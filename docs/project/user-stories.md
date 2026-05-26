---
project: operations-command-center
type: user-stories
created: 2026-05-25T20:23
audience: future-session, reviewer, candidate
purpose: ground every implementation decision in the actual operator experience the spec is describing. Read this before opening code so you stay aligned with what the system DOES, not just what it IS.
---

# User Stories - Operations Command Center

## The persona

One person: the **internal operator**. The first human to notice when something across the business breaks. Not a developer. Not a manager. A high-leverage individual contributor who needs to see what happened across three lines of business and act in seconds.

Day-in-the-life: they keep the dashboard open in a browser tab next to their email. When the review queue badge ticks up, they pivot to it. Otherwise the system runs itself.

This is a single-user, single-tenant tool. No auth, no roles (spec §13). The user pill on the sidebar is just a label.

## How events enter the system

For this exercise: **the simulator** (`/simulator`). The operator (or a reviewer testing the app) pastes a JSON payload, optionally edits it, and submits.

In the real-world version this same payload would arrive over a webhook from one of the three upstream business systems whenever something noteworthy happens (invoice goes overdue, brief lands, guest requests a change). The processing logic is identical either way — the engine doesn't care whether the caller is a Server Action from a form submit or an HTTP POST from a webhook. Adding a webhook route later is one file: `src/app/api/webhook/[source]/route.ts` calls the same `processEvent()` the simulator uses.

## The six end-to-end use cases

These are the scenarios the system must handle. Every line of business logic exists to serve one of them. The 6 mandatory tests cover these six cases.

### Use case 1 - Routine overdue invoice (auto-handled)

**Story:** Acme Trading owes the company $4,200 on INV-9281 and it's 17 days late. FinanceOps fires an `invoice.overdue` event.

**Expected flow:**

1. Event arrives → zod-validated → routed to the FinanceOps adapter.
2. Adapter checks `days_overdue: 17 > 14` → sets priority `high`.
3. Adapter generates two action specs: `send_payment_reminder` (target: Acme Trading, priority: high) and `create_follow_up_task` (invoice_id: INV-9281, priority: high).
4. Engine calls `mockFinanceService.sendPaymentReminder` and `mockFinanceService.createFollowUpTask`. Both succeed.
5. Event status → `completed`. Actions persisted with status `completed`. Audit log records the run.
6. Operator sees Total and Completed counters tick up on the dashboard.

**Operator action:** none. Pure automation. This is the happy path the system is built to scale.

**Test it covers:** test 1 - "FinanceOps event succeeds."

### Use case 2 - Routine campaign brief (auto-handled with QA bonus)

**Story:** Luna Cafe sent a creative brief: launch a Ramadan catering offer across Instagram, email, and a landing page, deadline 2026-06-10.

**Expected flow:**

1. Event arrives → routed to the CampaignOps adapter.
2. Adapter generates one `create_campaign_task` action per channel (3 actions) + a final `qa_review_task` action (the bonus per spec §5.B).
3. `mockCampaignService` creates each task (pretend Asana / Trello).
4. Event status → `completed`.

**Operator action:** none, but they can click into the event from the inbox to see all 4 tasks were created with their deadlines.

**Test it covers:** test 2 - "CampaignOps event succeeds."

### Use case 3 - Reservation change, all fields present (auto-handled)

**Story:** Maya Haddad wants to move her check-in from June 4 to June 6, 3 nights.

**Expected flow:**

1. Event arrives → routed to the GuestOps adapter.
2. Adapter zod-validates required fields (`reservation_id`, `guest_name`, `requested_check_in`) — all present.
3. Adapter generates `request_reservation_change` + `generate_guest_message` (text: "Hi Maya, we received your request to change your check-in date to 2026-06-06.").
4. `mockGuestService` executes both.
5. Event status → `completed`.

**Operator action:** none. Maya's confirmation email "sent" automatically.

**Test it covers:** test 3 - "GuestOps event succeeds."

### Use case 4 - Reservation change missing a field (goes to review)

**Story:** Same as use case 3 but `requested_check_in` is missing from the payload (the spec ships this as Appendix A's "Missing Required Field" example with `source_event_id: finance-002` — note the spec deliberately mislabels it on the finance side; we apply the same principle to any stream).

**Expected flow:**

1. Event arrives → routed to the relevant adapter.
2. Adapter zod-validates → fails on the missing field.
3. Adapter returns `{ kind: 'review', reason: 'Missing required field: requested_check_in' }`.
4. Engine marks event `review_required`, creates a `review_queue_items` row with the reason, stores the event's would-be actions with status `pending` (NOT executed).
5. Audit log records the routing decision and the validation failure.
6. Review queue badge increments.

**Operator action (in `/review`):**

- Opens the review item, reads the reason and the original payload.
- Three choices:
  - **Approve as-is** — only valid if the payload is now actionable (unlikely without an edit).
  - **Edit action(s)** — open the action JSON, fill in or fix the missing data, then approve. On approve: status transitions `review_required` → `processing` → `completed`, pending actions execute through the services.
  - **Reject** — mark `rejected` with optional notes. Pending actions stay un-executed (the action-cancel approach is a Phase 5 decision: either marked `cancelled` if we add that enum value, or deleted).
  - **Add notes + Mark resolved** — for "I called the guest, I handled this off-platform."

**Test it covers:** test 5 - "Missing required field goes to review."

### Use case 5 - Unknown / ambiguous event (goes to review)

**Story:** Someone forwarded a message-to-event integration: `"Please move this to next Friday and tell the client it is confirmed."` arrives as `source: "unknown"` with `event_type: "message.received"`.

**Expected flow:**

1. Event arrives → engine checks the source enum.
2. `source: "unknown"` matches no adapter in the adapter map.
3. Engine marks event `review_required` with reason "Unable to determine workflow stream" (quoted verbatim from spec §6).
4. No actions are generated. We don't know what the operator wants done.
5. Audit log records the routing decision.

**Variant - same flow with a different reason:** if `source` is a known stream (e.g. `financeops`) but `event_type` is one we don't have an adapter for (e.g. `event_type: "something.weird"`), the engine marks `review_required` with reason "Unsupported event_type \"something.weird\" for source \"financeops\"."

**Operator action:** opens the review item, reads the original text payload, decides if it maps to a real workflow, picks reject with notes, or marks resolved with notes about what they did off-platform.

**Tests it covers:** none of the six mandatory directly (the spec's missing-field test covers the routing logic for the review path), but the engine logic is exercised whenever an unknown payload comes in via the simulator.

### Use case 6 - External service failure (goes to review with the error)

**Story:** Same as use case 1 (Acme overdue invoice), but the event payload includes `"simulate_failure": true`.

**Expected flow:**

1. Event arrives → FinanceOps adapter generates the two actions normally.
2. Engine calls `mockFinanceService.sendPaymentReminder()` → service throws (the `simulate_failure` flag triggers a deterministic error).
3. Engine catches → marks event `failed` (NOT `completed`).
4. Creates a review queue item with reason capturing the service name + error message.
5. Audit log records the failure with the full error.
6. Failed counter ticks up on the dashboard.

**Operator action:** opens the review item, sees the failure reason, decides whether to retry (resubmit the event without the flag — they'd need to manually re-submit through the simulator), mark resolved with notes, or escalate.

**Test it covers:** test 6 - "Simulated external failure is handled correctly."

**Bonus test that wasn't a use case but is mandatory:**

### Test 4 - Duplicate `source_event_id` does not create duplicate actions

Not a user-facing scenario per se. It's the idempotency contract: if the same event arrives twice (network retry, double-click on Submit, webhook double-fire), the second submission is a no-op that returns the prior result. The operator must not see two reminders sent for the same overdue invoice.

This is enforced by `UNIQUE(source_event_id)` on the events table plus the engine's "check before insert" idempotency short-circuit.

## The operator's daily loop

```
loop:
  glance at dashboard counters (Total / Completed / Needs Review / Failed)
  if Needs Review > 0:
    open /review
    for each open item:
      read original payload
      read review reason
      decide: approve / approve-with-edits / reject / add-notes-and-resolve
      apply
  if Failed count is climbing in /inbox:
    investigate (likely a downstream system issue or a spec change)
  if something looks off in a specific event:
    open /events/[id] and use the audit timeline to reconstruct what happened
```

This is the entire UX. Each of the five pages serves one verb:

- **Dashboard (`/`)** = "what's the state of the world?"
- **Inbox (`/inbox`)** = "what's flowing through?"
- **Event Detail (`/events/[id]`)** = "exactly what happened to this one?"
- **Simulator (`/simulator`)** = "let me test what would happen if X arrived."
- **Review Queue (`/review`)** = "where do I need to act?"

## Why the rubric's four pillars exist (made concrete by the stories)

| Pillar | Weight | What it protects against | Use case that proves it |
| --- | --- | --- | --- |
| Reliability | 15% | Duplicate execution, lost state, opaque failures | UC1 + Test 4 (idempotency) |
| Workflow correctness | 20% | Wrong action sent to the customer | UC1 (priority logic), UC2 (one task per channel), UC3 (validation) |
| Architecture | 20% | Sprint-long change to add a 4th stream | The adapter map pattern; any new stream is a new file in `adapters/` |
| UX (25%) + Testing (10%) + Communication (10%) | 45% | Bad operator decisions; can't reproduce; reviewer can't understand the code | Audit timeline (UC4/UC5/UC6); status chips; README tradeoffs |

## What this maps to in code (next implement plan ships these)

| Use case / behavior | Code location |
| --- | --- |
| Route by `(source, event_type)` | `src/lib/workflow/engine.ts` — adapter map lookup |
| FinanceOps logic + priority | `src/lib/workflow/adapters/financeops.ts` |
| CampaignOps per-channel + QA bonus | `src/lib/workflow/adapters/campaignops.ts` |
| GuestOps validation + actions | `src/lib/workflow/adapters/guestops.ts` |
| Mock side effects + simulate_failure | `src/lib/workflow/services/{finance,campaign,guest}.ts` |
| Submit event from UI | `src/app/_actions/submitEvent.ts` |
| Operator approve / reject / edit | `src/app/_actions/resolveReviewItem.ts` |
| Dashboard counters | `src/app/page.tsx` (Supabase aggregation) |
| Inbox filtering | `src/app/inbox/page.tsx` (URL search params for status/source/review) |
| Audit timeline | `src/app/events/[id]/page.tsx` + `src/components/audit-timeline.tsx` |
| Simulator | `src/app/simulator/page.tsx` (sample picker, JSON editor, submit) |
| Review actions | `src/app/review/page.tsx` (per-item action buttons) |
| Status chips | `src/components/status-chip.tsx` (5 design.md variants) |

## Anti-stories (things the system should NOT do)

These are spec'd or implied by spec §13 + §14, captured here so we don't drift:

- **Don't blindly automate ambiguous payloads.** UC5's payload could be guessed at — don't. Send it to review with a clear reason.
- **Don't double-execute.** UC1 retried twice is still one reminder sent. Idempotency is non-negotiable.
- **Don't silently swallow failures.** UC6 must be visible on the dashboard's Failed counter, on the inbox list, in the audit timeline, AND in the review queue.
- **Don't add brand-orange to status chips.** Brand-orange is the single per-screen CTA (Submit on simulator, Approve on review). Failure is `failed` status red (design.md §5), not brand-orange.
- **Don't add a classifier or any LLM.** Rule-based routing on `(source, event_type)` covers every spec example. Spec §13: "Complex AI features" is out of scope.
- **Don't require auth.** Spec §13.

## When to update this document

When the use cases change — a new stream lands, a new operator workflow emerges, a spec interpretation shifts. Not on every implementation detail. This is the product-level truth that survives code refactors.
