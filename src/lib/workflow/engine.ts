import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { campaignopsClientBriefAdapter } from "./adapters/campaignops";
import { financeopsInvoiceOverdueAdapter } from "./adapters/financeops";
import { guestopsReservationChangeAdapter } from "./adapters/guestops";
import { mockCampaignService } from "./services/campaign";
import { mockFinanceService } from "./services/finance";
import { mockGuestService } from "./services/guest";
import type {
  Action,
  ActionSpec,
  AuditLog,
  Event,
  EventSource,
  IncomingEvent,
  MockService,
  ProcessResult,
  ReviewQueueItem,
  StreamAdapter,
} from "./types";

// Engine flow (spec §4):
//   1. Validate IncomingEvent shape.
//   2. Idempotency: if source_event_id already exists, return prior result.
//   3. Insert event (received). Audit.
//   4. Look up adapter by (source, event_type). If none → review.
//   5. Run adapter. If review → create review queue item, return.
//   6. Adapter returned actions → status processing, insert actions as pending.
//   7. Execute each action through its service. Catch throws → mark action failed.
//   8. If all actions completed → status completed. Else → status failed + review item.

const KNOWN_SOURCES: EventSource[] = [
  "financeops",
  "campaignops",
  "guestops",
];

const incomingEventSchema = z.object({
  source_event_id: z.string().min(1),
  source: z.enum(["financeops", "campaignops", "guestops", "unknown"]),
  event_type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

// Adapter map keyed by `${source}:${event_type}`. Adding a fourth stream =
// one new file in adapters/ + one new entry here.
const adapters: Record<string, StreamAdapter> = {
  "financeops:invoice.overdue": financeopsInvoiceOverdueAdapter,
  "campaignops:client_brief.received": campaignopsClientBriefAdapter,
  "guestops:reservation.change_requested": guestopsReservationChangeAdapter,
};

// Service map keyed by source. Each service dispatches on action.type
// internally for that stream's action set.
const services: Partial<Record<EventSource, MockService>> = {
  financeops: mockFinanceService,
  campaignops: mockCampaignService,
  guestops: mockGuestService,
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function processEvent(
  input: IncomingEvent,
): Promise<ProcessResult> {
  const validation = incomingEventSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(
      `Invalid event structure: ${validation.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  const incoming: IncomingEvent = validation.data;
  const supabase = await createClient();

  // Idempotency short-circuit. Spec §4 step 7.
  const existing = await loadResultBySourceId(supabase, incoming.source_event_id);
  if (existing) return existing;

  const event = await insertEvent(supabase, incoming);
  await addAuditLog(supabase, event.id, "Event received", {
    source: incoming.source,
    event_type: incoming.event_type,
  });

  // Routing. Spec §4 step 2 + §6 (review reasons).
  const adapter = adapters[`${incoming.source}:${incoming.event_type}`];
  if (!adapter) {
    const reason = KNOWN_SOURCES.includes(incoming.source as EventSource)
      ? `Unsupported event_type "${incoming.event_type}" for source "${incoming.source}"`
      : "Unable to determine workflow stream";
    return await routeToReview(supabase, event, reason, []);
  }

  const result = adapter(incoming);

  if (result.kind === "review") {
    return await routeToReview(supabase, event, result.reason, []);
  }

  await updateEventStatus(supabase, event.id, "processing");
  await addAuditLog(
    supabase,
    event.id,
    `Routed to ${incoming.source} adapter, generated ${result.actions.length} action${result.actions.length === 1 ? "" : "s"}`,
  );

  const actions = await insertActions(supabase, event.id, result.actions);
  const service = services[incoming.source as EventSource];

  let allSucceeded = true;
  let firstFailureReason: string | null = null;

  for (const action of actions) {
    const outcome = await runService(service, action, incoming);
    if (outcome.ok) {
      await updateActionStatus(supabase, action.id, "completed");
      await addAuditLog(
        supabase,
        event.id,
        `Action "${action.type}" completed`,
        outcome.result ?? {},
      );
    } else {
      await updateActionStatus(supabase, action.id, "failed");
      await addAuditLog(supabase, event.id, `Action "${action.type}" failed`, {
        error: outcome.error,
      });
      allSucceeded = false;
      if (!firstFailureReason) firstFailureReason = outcome.error;
    }
  }

  if (allSucceeded) {
    await updateEventStatus(supabase, event.id, "completed");
    await addAuditLog(supabase, event.id, "Event completed");
    return await loadResult(supabase, event.id);
  }

  // At least one action failed. Spec §8: visible, audited, NOT completed.
  await updateEventStatus(supabase, event.id, "failed");
  await addAuditLog(supabase, event.id, "Event failed: one or more actions failed", {
    error: firstFailureReason,
  });
  await insertReviewQueueItem(
    supabase,
    event.id,
    firstFailureReason ?? "Action failed",
  );
  return await loadResult(supabase, event.id);
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function runService(
  service: MockService | undefined,
  action: Action,
  event: IncomingEvent,
) {
  if (!service) {
    return {
      ok: false as const,
      error: `No service registered for source "${event.source}"`,
    };
  }
  try {
    return await service({ type: action.type, payload: action.payload }, event);
  } catch (err) {
    return { ok: false as const, error: errorMessage(err) };
  }
}

async function insertEvent(
  supabase: Supabase,
  incoming: IncomingEvent,
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      source_event_id: incoming.source_event_id,
      source: incoming.source,
      event_type: incoming.event_type,
      payload: incoming.payload,
      status: "received",
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`insertEvent failed: ${error?.message ?? "no row returned"}`);
  }
  return data as Event;
}

async function insertActions(
  supabase: Supabase,
  eventId: string,
  specs: ActionSpec[],
): Promise<Action[]> {
  if (specs.length === 0) return [];
  const rows = specs.map((spec) => ({
    event_id: eventId,
    type: spec.type,
    payload: spec.payload,
    status: "pending",
  }));
  const { data, error } = await supabase.from("actions").insert(rows).select();
  if (error || !data) {
    throw new Error(`insertActions failed: ${error?.message ?? "no rows returned"}`);
  }
  return data as Action[];
}

async function updateEventStatus(
  supabase: Supabase,
  id: string,
  status: Event["status"],
) {
  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`updateEventStatus failed: ${error.message}`);
}

async function updateActionStatus(
  supabase: Supabase,
  id: string,
  status: Action["status"],
) {
  const { error } = await supabase
    .from("actions")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateActionStatus failed: ${error.message}`);
}

async function addAuditLog(
  supabase: Supabase,
  eventId: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("audit_logs").insert({
    event_id: eventId,
    message,
    metadata,
  });
  if (error) throw new Error(`addAuditLog failed: ${error.message}`);
}

async function insertReviewQueueItem(
  supabase: Supabase,
  eventId: string,
  reason: string,
): Promise<ReviewQueueItem> {
  const { data, error } = await supabase
    .from("review_queue_items")
    .insert({ event_id: eventId, reason, status: "open" })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`insertReviewQueueItem failed: ${error?.message ?? "no row returned"}`);
  }
  return data as ReviewQueueItem;
}

async function routeToReview(
  supabase: Supabase,
  event: Event,
  reason: string,
  _pendingActions: ActionSpec[],
): Promise<ProcessResult> {
  await updateEventStatus(supabase, event.id, "review_required");
  await insertReviewQueueItem(supabase, event.id, reason);
  await addAuditLog(supabase, event.id, `Routed to review: ${reason}`);
  return await loadResult(supabase, event.id);
}

async function loadResult(
  supabase: Supabase,
  eventId: string,
): Promise<ProcessResult> {
  const [eventRes, actionsRes, reviewRes, auditRes] = await Promise.all([
    supabase.from("events").select().eq("id", eventId).single(),
    supabase.from("actions").select().eq("event_id", eventId),
    supabase
      .from("review_queue_items")
      .select()
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select()
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);
  if (eventRes.error || !eventRes.data) {
    throw new Error(`loadResult failed: ${eventRes.error?.message ?? "no event"}`);
  }
  return {
    event: eventRes.data as Event,
    actions: (actionsRes.data ?? []) as Action[],
    reviewItem: (reviewRes.data ?? null) as ReviewQueueItem | null,
    auditLogs: (auditRes.data ?? []) as AuditLog[],
  };
}

async function loadResultBySourceId(
  supabase: Supabase,
  sourceEventId: string,
): Promise<ProcessResult | null> {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("source_event_id", sourceEventId)
    .maybeSingle();
  if (error) throw new Error(`idempotency check failed: ${error.message}`);
  if (!data) return null;
  return await loadResult(supabase, data.id);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}
