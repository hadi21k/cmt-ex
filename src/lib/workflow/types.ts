/**
 * Workflow engine types.
 *
 * Source of truth: `vault/projects/operations-command-center/requirements.md`.
 * - Statuses come from spec §4 ("Statuses" table).
 * - Sources and entity field shapes come from spec §7 ("Persistence and Data Model")
 *   and §5 ("Required Workflows").
 *
 * Keep these in sync with the SQL migration at `supabase/migrations/`.
 * If you add a fifth status, add it to both the union here and the CHECK
 * constraint in the migration.
 */

/** Lifecycle of a single incoming event. Spec §4. */
export type EventStatus =
  | "received"
  | "processing"
  | "completed"
  | "review_required"
  | "failed";

/** Which upstream system the event came from. Spec §2 + §5.
 *  "unknown" is the catch-all routed straight to human review. */
export type EventSource = "financeops" | "campaignops" | "guestops" | "unknown";

/** Lifecycle of a single generated action. Mirrors the migration's CHECK. */
export type ActionStatus = "pending" | "executing" | "completed" | "failed";

/** Lifecycle of a single review queue item. Mirrors the migration's CHECK. */
export type ReviewStatus = "open" | "approved" | "rejected" | "resolved";

/**
 * Shape of an event arriving at the system boundary (simulator, webhook,
 * test). The payload is intentionally loose `Record<string, unknown>` here;
 * each stream's adapter validates its own payload shape with zod when the
 * actual workflows land in the next implement.
 */
export interface IncomingEvent {
  source_event_id: string;
  source: EventSource;
  event_type: string;
  payload: Record<string, unknown>;
}

/** Row in the `events` table. Mirrors spec §7 fields. */
export interface Event {
  id: string;
  source_event_id: string;
  source: EventSource;
  event_type: string;
  payload: Record<string, unknown>;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

/** Row in the `actions` table. */
export interface Action {
  id: string;
  event_id: string;
  type: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  created_at: string;
}

/** Row in the `review_queue_items` table. */
export interface ReviewQueueItem {
  id: string;
  event_id: string;
  reason: string;
  status: ReviewStatus;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Row in the `audit_logs` table. Append-only timeline per event. */
export interface AuditLog {
  id: string;
  event_id: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Result of running the engine on a single incoming event. Returned by
 * `processEvent` (see `engine.ts`). The shape lets the simulator UI render
 * a result preview without re-querying the database.
 */
export interface ProcessResult {
  event: Event;
  actions: Action[];
  reviewItem: ReviewQueueItem | null;
  auditLogs: AuditLog[];
}

/** A pending action emitted by an adapter, before persistence + execution. */
export interface ActionSpec {
  type: string;
  payload: Record<string, unknown>;
}

/** Result of running a stream adapter on an incoming event.
 *  Either "here are the actions to run" or "this needs human review with reason X". */
export type AdapterResult =
  | { kind: "actions"; actions: ActionSpec[] }
  | { kind: "review"; reason: string };

/** Pure function: incoming event → either actions or a review reason.
 *  Adapters never hit the database or call services. */
export type StreamAdapter = (event: IncomingEvent) => AdapterResult;

/** Service execution result. ok=true means the side effect was simulated;
 *  ok=false captures a deterministic failure (e.g. simulate_failure flag). */
export type ServiceExecution =
  | { ok: true; result?: Record<string, unknown> }
  | { ok: false; error: string };

/** Mock service: given an action spec + originating event, simulate the
 *  side effect. Throws are caught by the engine and converted to ok=false. */
export type MockService = (
  action: ActionSpec,
  event: IncomingEvent,
) => Promise<ServiceExecution>;
