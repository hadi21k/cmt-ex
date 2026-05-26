"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { mockCampaignService } from "@/lib/workflow/services/campaign";
import { mockFinanceService } from "@/lib/workflow/services/finance";
import { mockGuestService } from "@/lib/workflow/services/guest";
import type {
  Action,
  Event,
  EventSource,
  MockService,
} from "@/lib/workflow/types";
import { createClient } from "@/lib/supabase/server";

// resolveReviewItem: the operator's verbs on a review item.
//
//  approve       - run any pending actions through the service, transition
//                  event review_required → processing → completed (or failed
//                  if a service throws). Audit every step.
//  reject        - mark pending actions cancelled, event → failed, review
//                  item → rejected with optional notes.
//  edit_action   - mutate an action's payload before it runs. Status stays
//                  pending. Operator then needs to approve.
//  add_notes     - append to review item's resolution_notes. Status stays
//                  open.
//  mark_resolved - review item → resolved + resolved_at. No engine action;
//                  used for "handled out of band".

const services: Partial<Record<EventSource, MockService>> = {
  financeops: mockFinanceService,
  campaignops: mockCampaignService,
  guestops: mockGuestService,
};

const baseSchema = z.object({
  review_item_id: z.string().min(1),
});

const NOTES_MAX = 2000;

const inputSchema = z.discriminatedUnion("action", [
  baseSchema.extend({ action: z.literal("approve") }),
  baseSchema.extend({
    action: z.literal("reject"),
    notes: z.string().max(NOTES_MAX).optional(),
  }),
  baseSchema.extend({
    action: z.literal("edit_action"),
    action_id: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
  }),
  baseSchema.extend({
    action: z.literal("add_notes"),
    notes: z.string().min(1).max(NOTES_MAX),
  }),
  baseSchema.extend({
    action: z.literal("mark_resolved"),
    notes: z.string().max(NOTES_MAX).optional(),
  }),
]);

export type ResolveReviewItemInput = z.infer<typeof inputSchema>;

export type ResolveReviewItemResult =
  | { ok: true }
  | { ok: false; error: string };

export async function resolveReviewItem(
  raw: unknown,
): Promise<ResolveReviewItemResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; "),
    };
  }

  try {
    await dispatch(parsed.data);
    revalidateTag("events", "max");
    revalidateTag("review-queue", "max");
    revalidateTag("dashboard", "max");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function dispatch(input: ResolveReviewItemInput): Promise<void> {
  const supabase = await createClient();
  const reviewItem = await loadReviewItem(supabase, input.review_item_id);

  // M1: every verb requires the review item to still be open. Once closed
  // (approved / rejected / resolved) the state is terminal - re-submitting
  // an action against it is almost certainly a double-click or a stale UI
  // and should fail loudly rather than corrupt the audit trail.
  if (reviewItem.status !== "open") {
    throw new Error(
      `Review item is ${reviewItem.status}, not open. Refresh and try again.`,
    );
  }

  switch (input.action) {
    case "approve":
      return approve(supabase, reviewItem);
    case "reject":
      return reject(supabase, reviewItem, input.notes);
    case "edit_action":
      return editAction(supabase, reviewItem, input.action_id, input.payload);
    case "add_notes":
      return addNotes(supabase, reviewItem, input.notes);
    case "mark_resolved":
      return markResolved(supabase, reviewItem, input.notes);
  }
}

// ---------------------------------------------------------------------------
// Verbs
// ---------------------------------------------------------------------------

async function approve(supabase: Supabase, review: ReviewItem): Promise<void> {
  const event = await loadEvent(supabase, review.event_id);

  // M2-lite: catch the common double-click race. Strict race-free locking
  // would need a row-level claim (covered in README tradeoffs).
  if (event.status !== "review_required") {
    throw new Error(
      `Event is ${event.status}, not review_required. Already processed?`,
    );
  }

  const actions = await loadPendingActions(supabase, event.id);
  const service = services[event.source as EventSource];

  await updateEventStatus(supabase, event.id, "processing");
  await audit(supabase, event.id, "Operator approved review item", {
    review_item_id: review.id,
  });

  let allOk = true;
  let firstError: string | null = null;

  for (const action of actions) {
    let outcome;
    try {
      outcome = service
        ? await service(
            { type: action.type, payload: action.payload as Record<string, unknown> },
            { ...toIncomingEvent(event), payload: event.payload as Record<string, unknown> },
          )
        : ({ ok: false as const, error: `No service for source "${event.source}"` });
    } catch (err) {
      outcome = {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    if (outcome.ok) {
      await updateActionStatus(supabase, action.id, "completed");
      await audit(supabase, event.id, `Action "${action.type}" completed (operator-approved)`, outcome.result ?? {});
    } else {
      await updateActionStatus(supabase, action.id, "failed");
      await audit(supabase, event.id, `Action "${action.type}" failed (operator-approved)`, {
        error: outcome.error,
      });
      allOk = false;
      if (!firstError) firstError = outcome.error;
    }
  }

  if (allOk) {
    await updateEventStatus(supabase, event.id, "completed");
    await audit(supabase, event.id, "Event completed after operator approval");
  } else {
    await updateEventStatus(supabase, event.id, "failed");
    await audit(supabase, event.id, "Event failed after operator approval", {
      error: firstError,
    });
  }

  await closeReviewItem(supabase, review.id, "approved");
}

async function reject(
  supabase: Supabase,
  review: ReviewItem,
  notes: string | undefined,
): Promise<void> {
  const event = await loadEvent(supabase, review.event_id);
  if (event.status !== "review_required") {
    throw new Error(
      `Event is ${event.status}, not review_required. Already processed?`,
    );
  }
  await cancelPendingActions(supabase, review.event_id);
  await updateEventStatus(supabase, review.event_id, "failed");
  await audit(supabase, review.event_id, "Event rejected by operator", {
    review_item_id: review.id,
    notes: notes ?? null,
  });
  await closeReviewItem(supabase, review.id, "rejected", notes);
}

async function editAction(
  supabase: Supabase,
  review: ReviewItem,
  actionId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await supabase
    .from("actions")
    .update({ payload })
    .eq("id", actionId)
    .eq("event_id", review.event_id)
    .select("id");
  if (error) throw new Error(`editAction failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(
      `Action ${actionId} does not exist or does not belong to this review item.`,
    );
  }
  await audit(supabase, review.event_id, "Operator edited action payload", {
    action_id: actionId,
  });
}

async function addNotes(
  supabase: Supabase,
  review: ReviewItem,
  notes: string,
): Promise<void> {
  const existing = review.resolution_notes ?? "";
  const combined = existing ? `${existing}\n${notes}` : notes;
  if (combined.length > NOTES_MAX) {
    throw new Error(
      `Combined notes would exceed ${NOTES_MAX} characters (existing ${existing.length} + new ${notes.length}). Trim and retry.`,
    );
  }
  const { error } = await supabase
    .from("review_queue_items")
    .update({ resolution_notes: combined })
    .eq("id", review.id);
  if (error) throw new Error(`addNotes failed: ${error.message}`);
  await audit(supabase, review.event_id, "Operator added notes to review item", {
    review_item_id: review.id,
  });
}

async function markResolved(
  supabase: Supabase,
  review: ReviewItem,
  notes: string | undefined,
): Promise<void> {
  await closeReviewItem(supabase, review.id, "resolved", notes);
  await audit(supabase, review.event_id, "Operator marked review item resolved", {
    review_item_id: review.id,
  });
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

type Supabase = Awaited<ReturnType<typeof createClient>>;
type ReviewItem = {
  id: string;
  event_id: string;
  status: string;
  resolution_notes: string | null;
};

async function loadReviewItem(
  supabase: Supabase,
  id: string,
): Promise<ReviewItem> {
  const { data, error } = await supabase
    .from("review_queue_items")
    .select()
    .eq("id", id)
    .single();
  if (error || !data) {
    throw new Error(`Review item not found: ${id}`);
  }
  return data as ReviewItem;
}

async function loadEvent(supabase: Supabase, id: string): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .select()
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(`Event not found: ${id}`);
  return data as Event;
}

async function loadPendingActions(
  supabase: Supabase,
  eventId: string,
): Promise<Action[]> {
  // Spec §6: "Approve the generated action." Approval runs the actions -
  // including ones the engine already tried and failed (service-failure
  // route). Completed actions stay completed; we only retry pending/failed.
  const { data, error } = await supabase
    .from("actions")
    .select()
    .eq("event_id", eventId)
    .in("status", ["pending", "failed"]);
  if (error) throw new Error(`loadPendingActions failed: ${error.message}`);
  return (data ?? []) as Action[];
}

async function updateEventStatus(
  supabase: Supabase,
  id: string,
  status: Event["status"],
): Promise<void> {
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
): Promise<void> {
  const { error } = await supabase
    .from("actions")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateActionStatus failed: ${error.message}`);
}

async function cancelPendingActions(
  supabase: Supabase,
  eventId: string,
): Promise<void> {
  const { error } = await supabase
    .from("actions")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("status", "pending");
  if (error) throw new Error(`cancelPendingActions failed: ${error.message}`);
}

async function closeReviewItem(
  supabase: Supabase,
  id: string,
  status: "approved" | "rejected" | "resolved",
  notes?: string,
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    resolved_at: new Date().toISOString(),
  };
  if (notes !== undefined) patch.resolution_notes = notes;
  const { error } = await supabase
    .from("review_queue_items")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(`closeReviewItem failed: ${error.message}`);
}

async function audit(
  supabase: Supabase,
  eventId: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    event_id: eventId,
    message,
    metadata,
  });
  if (error) throw new Error(`audit failed: ${error.message}`);
}

function toIncomingEvent(event: Event) {
  return {
    source_event_id: event.source_event_id,
    source: event.source,
    event_type: event.event_type,
  };
}
