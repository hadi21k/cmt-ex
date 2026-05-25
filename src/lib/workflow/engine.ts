import type { IncomingEvent, ProcessResult } from "./types";

/**
 * Workflow engine entry point.
 *
 * Contract (built in next implement):
 *   1. Validate `event` structure + required payload fields (zod).
 *   2. Route to a stream adapter based on `event.source` + `event.event_type`.
 *      Unknown source / unsupported event_type → review queue.
 *   3. Run the adapter to produce a list of pending actions.
 *   4. Execute each action through its mock service.
 *      If a service throws (or `payload.simulate_failure === true`) the
 *      event ends as `failed` AND goes to review with the error message
 *      as the reason. Spec §8.
 *   5. Persist event + actions + review item + audit logs atomically.
 *   6. Honour idempotency: re-submission of an existing `source_event_id`
 *      returns the prior `ProcessResult` without creating duplicates.
 *      Spec §4 step 7.
 *
 * Adapters land in `./adapters/`. Mock services land in `./services/`.
 * Adding a fourth stream = drop a new file in `adapters/` and register it
 * in the adapter map; the engine itself does not change.
 */
export async function processEvent(
  _event: IncomingEvent,
): Promise<ProcessResult> {
  throw new Error(
    "workflow engine not yet implemented. Next /implement plan wires this. See requirements.md §4 and §5.",
  );
}
