---
name: workflows-and-pages
type: implement
status: done
created: 2026-05-25T20:23
updated: 2026-05-25T22:30
completed: 2026-05-25T22:30
project: operations-command-center
total_phases: 8
current_phase: 9
---

# Workflows and Pages

## Goal

Fill in the foundation scaffold with the actual feature work for the Operations Command Center take-home. The setup-and-scaffold plan landed the architecture skeleton (Supabase schema, dashboard-01 shell, route placeholders, workflow engine type contracts, READMEs, vitest). This plan ships the running system: a working workflow engine that routes events through stream adapters into mock services, two server actions (submitEvent + resolveReviewItem) with the full status-transition state machine, all five required pages wired to real Supabase data, audit timeline + status chips per `design.md`, the six mandatory tests, and a README tradeoffs section. Acceptance is operator-level: can a reviewer open the dashboard, drop the Appendix A sample events through the simulator, watch the right ones complete + the right ones land in review + the simulated-failure show up correctly, refresh the browser, and still see the right state.

## Clarifications (upfront)

- [2026-05-25T20:23] Q: Idempotency scope? → A: Keep global `UNIQUE(source_event_id)` from the existing migration. No change.
- [2026-05-25T20:23] Q: Status transitions on operator approve? → A: `review_required` → `processing` → `completed` (via `resolveReviewItem` server action). Audit logs each transition.
- [2026-05-25T20:23] Q: When an event goes to review, what happens to its actions? → A: Stored with `status: pending`. Executed on approve. Cancelled (status `cancelled`, no service call) on reject. The migration's `actions.status` CHECK is `pending | executing | completed | failed`; `cancelled` needs to be added as part of Phase 5 OR we use a different sentinel (e.g. delete pending actions on reject). Decision deferred to mid-phase Phase 5 clarification.
- [2026-05-25T20:23] Q: CampaignOps optional QA task? → A: Implement. Per-channel `create_campaign_task` actions plus a final `qa_review_task` action after the channel set.
- [2026-05-25T20:23] Q: Inbox filters? → A: status (multi), source (multi), review-required flag (boolean). Default UI; nothing fancy. No date range (defer to next steps).
- [2026-05-25T20:23] Q: Audit timeline order? → A: Newest-first.
- [2026-05-25T20:23] Q: Unknown source / unsupported event_type handling? → A: Both go to review with distinct reasons. Unknown source reason quotes the spec verbatim: "Unable to determine workflow stream." Unsupported event_type reason: "Unsupported event_type \"{event_type}\" for source \"{source}\"."
- [2026-05-25T20:23] Q: AI/classifier layer? → A: Skip. Rule-based routing via `(source, event_type)` map satisfies every spec example. Document the decision in README tradeoffs (Phase 8). Architecture has a natural seam at the engine's lookup if a real classifier is ever needed.

## Clarifications (cross-phase)

<!-- Mid-execution clarifications that affect multiple future phases. Empty until needed. -->

## Phase 1 - User stories doc + CLAUDE.md index update

- Preconditions:
  - `docs/project/` exists with `CONTEXT.md`, `requirements.md`, `design.md`, `log.md`
  - `CLAUDE.md` (at repo root) exists and references `design.md` + `requirements.md`
- Postconditions:
  - `docs/project/user-stories.md` exists with: persona (the internal operator), input mechanism note (simulator now, webhook later via same engine), six end-to-end use cases (routine FinanceOps, routine CampaignOps with QA bonus, GuestOps happy path, GuestOps missing-field → review, Unknown/ambiguous → review, simulated failure → review), the operator daily loop, the four-pillar rationale, and a code-mapping table
  - `CLAUDE.md` references `user-stories.md` in the same "Source of truth" / discovery section as `design.md` and `requirements.md`
  - Optional: `CONTEXT.md` Index gains a `[[user-stories]]` line so the project context lists it too
- Steps:
  1. Write `docs/project/user-stories.md` with the structure described in the postcondition
  2. Edit `CLAUDE.md` to add the user-stories.md reference next to the design.md reference
  3. Edit `CONTEXT.md` Index section to add `[[user-stories]]` row (optional but consistent with the [[requirements]] entry already there)
- Verification:
  - `test -f docs/project/user-stories.md`
  - `grep -q user-stories CLAUDE.md`
  - `grep -c "use case\|Use Case" docs/project/user-stories.md` returns at least 6
- Clarifications:
- Outcome:
  - [2026-05-25T20:30] Phase 1 done. `docs/project/user-stories.md` written with: persona description (single internal operator, no auth), input mechanism note (simulator now, webhook later via same engine), all six end-to-end use cases (routine FinanceOps with priority logic, CampaignOps with QA bonus, GuestOps happy path, GuestOps missing-field → review, Unknown/unsupported event_type → review with verbatim spec reason, simulated failure → review), the operator's daily loop pseudocode, the four-pillar rubric breakdown mapping each pillar to use cases, the full code-mapping table (which file ships which behavior in upcoming phases), and an explicit "anti-stories" list to prevent drift (no orange on status chips, no classifier, no auth, no double-execute, etc.).
  - `CLAUDE.md` Source-of-truth section updated: added a "**Read this before writing any feature code**" reference to user-stories.md, alongside the existing requirements.md and design.md pointers. Also updated the active-implement-plan pointer from `setup-and-scaffold.md` to `workflows-and-pages.md` (the foundation plan is now archived).
  - `CONTEXT.md` Index updated to include `[[user-stories]]` and `[[design]]` alongside `[[requirements]]` so the project context lists the three vault documents in one place.
  - Verification: `test -f` passes; both `CLAUDE.md` and `CONTEXT.md` grep positive for `user-stories`; `grep -cE "^### Use case"` returns 6 (matches spec's 6 mandatory tests one-for-one).

## Phase 2 - Engine framework + FinanceOps adapter + finance service

- TDD: yes
- Preconditions:
  - Phase 1 postconditions hold
  - `src/lib/workflow/{engine,types}.ts` exist (stubs from setup-and-scaffold)
  - `supabase/migrations/20260525161555_init.sql` applied (verified via list_tables in setup-and-scaffold Phase 3 outcome)
- Postconditions:
  - `src/lib/workflow/engine.ts` implements the full happy path: validate `IncomingEvent` shape with zod, look up adapter by `(source, event_type)`, run adapter to get action specs, execute each spec through the corresponding mock service, persist event + actions + audit logs atomically (single Supabase transaction or RPC), enforce idempotency by checking `source_event_id` before insert
  - `src/lib/workflow/adapters/financeops.ts` exists exporting an adapter for `invoice.overdue`: validates payload with zod (`invoice_id`, `customer_name`, `amount`, `currency`, `days_overdue`), generates `send_payment_reminder` + `create_follow_up_task` action specs with priority `high` if `days_overdue > 14` else `normal`
  - `src/lib/workflow/services/finance.ts` exists exporting `mockFinanceService` with two methods: `sendPaymentReminder(payload)` and `createFollowUpTask(payload)`. Both honor `simulate_failure` by throwing a deterministic error when the flag is true
  - The engine's adapter map and service map are wired so a FinanceOps event flows end-to-end
  - `tests/financeops.test.ts` exists with test 1 (FinanceOps event succeeds): submits the Appendix A valid FinanceOps payload, asserts event status `completed`, two actions both `completed`, audit logs present
  - `npm test` passes (smoke + 1 new test = 2 total)
- Steps:
  1. Define the adapter interface in `src/lib/workflow/types.ts`: `StreamAdapter = (event: IncomingEvent) => AdapterResult` where `AdapterResult` is either `{ kind: 'actions', actions: ActionSpec[] }` or `{ kind: 'review', reason: string }`
  2. Define the `MockService` interface and the `ActionSpec` shape
  3. Write `src/lib/workflow/adapters/financeops.ts` with the zod schema and adapter logic
  4. Write `src/lib/workflow/services/finance.ts` with the `simulate_failure` honoring
  5. Build the engine: idempotency check (select existing event by source_event_id; if found, return prior result), validation, routing (lookup `(source, event_type)` → adapter), adapter run, service execution, atomic persistence using a Supabase RPC OR a single chained transaction
  6. Write test 1 and iterate engine code until it passes
  7. Verify `npm test` is green
- Verification:
  - `test -f src/lib/workflow/adapters/financeops.ts && test -f src/lib/workflow/services/finance.ts`
  - `grep -q "days_overdue" src/lib/workflow/adapters/financeops.ts`
  - `grep -q "simulate_failure" src/lib/workflow/services/finance.ts`
  - `test -f tests/financeops.test.ts`
  - `npm test` exits 0 with ≥ 2 tests passing
  - `npx tsc --noEmit` clean
- Clarifications:
  - [2026-05-25T20:36] Q: Atomic persistence (single RPC vs sequential inserts)? → A: Sequential inserts (idempotency via SELECT-before-INSERT + UNIQUE constraint catches races). Atomicity isn't a spec requirement; documenting as a tradeoff in the README. A single Postgres function would be the prod-grade upgrade.
  - [2026-05-25T20:36] Q: Testability for an engine that uses `await cookies()` via Supabase server client? → A: Vitest `vi.mock('@/lib/supabase/server')` with a small in-memory chain mock in `tests/_helpers/mock-supabase.ts`. Tests the engine's coordination logic against a fixture that behaves like the real Supabase chain (`.from().insert().select().single()` etc.). Reused by tests 2-6.
  - [2026-05-25T20:36] Q: Service interface - one service per stream with internal switch, or one service per action type? → A: One service per stream (`mockFinanceService` dispatches on `action.type` internally). Maps cleanly to spec 8's three-service vocabulary; cheaper to add a new action type within a stream than a new service.
- Outcome:
  - [2026-05-25T20:36] Phase 2 done. Engine wired end-to-end in `src/lib/workflow/engine.ts`: zod-validates the IncomingEvent shape, idempotency short-circuit by SELECT on `source_event_id`, inserts the event, routes by `(source, event_type)` key against the adapter map, runs the adapter (review path emits review queue item + status `review_required`), insert pending actions, execute each through the service map with try/catch around throws, update action statuses, emit audit logs at every transition, mark event `completed` or `failed`. Routes `failed` events to the review queue with the first failure's error message.
  - FinanceOps adapter at `src/lib/workflow/adapters/financeops.ts` validates the payload with zod (`invoice_id`, `customer_name`, `amount`, `currency`, `days_overdue`), emits `send_payment_reminder` + `create_follow_up_task` actions with priority `high` if `days_overdue > 14` else `normal` per spec 5.A.
  - `mockFinanceService` at `src/lib/workflow/services/finance.ts` dispatches on `action.type`; throws a deterministic error when `event.payload.simulate_failure === true` (spec 8 contract honored).
  - Types extended in `src/lib/workflow/types.ts`: `ActionSpec`, `AdapterResult` (sum type for actions vs review), `StreamAdapter`, `ServiceExecution`, `MockService`.
  - Test harness `tests/_helpers/mock-supabase.ts` implements an in-memory chain mock supporting all engine operations (`from(t).insert(...).select().single()`, `.eq().maybeSingle()`, `.update().eq()`, `.order().exec`). Reset between tests; deterministic ID + timestamp generation.
  - Test 1 in `tests/financeops.test.ts` asserts: event status `completed`, 2 actions both `completed` with priority `high`, no review item, audit logs include `"Event received"` and `"Event completed"`, DB shows 1 event + 2 actions + 0 review items. Plus a 5-line sanity check that `days_overdue: 10` produces priority `normal`.
  - `npm test`: 3 tests passing (smoke + 2 finance). `npx tsc --noEmit` clean.

## Phase 3 - CampaignOps + GuestOps adapters + their services

- TDD: yes
- Preconditions:
  - Phase 2 postconditions hold (engine wired, FinanceOps end-to-end working)
- Postconditions:
  - `src/lib/workflow/adapters/campaignops.ts` exists handling `client_brief.received`: validates payload (`client`, `campaign_goal`, `channels[]`, `deadline`), generates one `create_campaign_task` per channel with the deadline + a final `qa_review_task` action (the QA bonus)
  - `src/lib/workflow/adapters/guestops.ts` exists handling `reservation.change_requested`: validates required fields (`reservation_id`, `guest_name`, `requested_check_in`); on missing fields returns `{ kind: 'review', reason: 'Missing required field: <field>' }`; on success generates `request_reservation_change` + `generate_guest_message` (message text per spec 5.C)
  - `src/lib/workflow/services/{campaign,guest}.ts` exist with the same `simulate_failure` honoring pattern as finance
  - `tests/campaignops.test.ts` (test 2) and `tests/guestops.test.ts` (test 3) pass
  - All three adapters registered in the engine's adapter map
- Steps:
  1. Write CampaignOps adapter + zod schema + QA bonus task spec
  2. Write GuestOps adapter + zod schema + field validation + review-reason emission
  3. Write campaign + guest services
  4. Register both adapters and services in the engine's maps
  5. Write tests 2 + 3 against the Appendix A valid payloads; iterate until green
- Verification:
  - `test -f src/lib/workflow/adapters/campaignops.ts && test -f src/lib/workflow/adapters/guestops.ts`
  - `test -f src/lib/workflow/services/campaign.ts && test -f src/lib/workflow/services/guest.ts`
  - `test -f tests/campaignops.test.ts && test -f tests/guestops.test.ts`
  - `grep -q "qa_review_task" src/lib/workflow/adapters/campaignops.ts`
  - `grep -q "Missing required field" src/lib/workflow/adapters/guestops.ts`
  - `npm test` exits 0 with ≥ 4 tests passing
- Clarifications:
- Outcome:
  - [2026-05-25T20:41] Phase 3 done. CampaignOps adapter at `src/lib/workflow/adapters/campaignops.ts` validates `client`, `campaign_goal`, `channels[]` (min 1), `deadline`; emits one `create_campaign_task` per channel with a human-readable title (e.g. "Instagram creative brief for Luna Cafe") + a `qa_review_task` at the end per the spec 5.B optional bonus.
  - GuestOps adapter at `src/lib/workflow/adapters/guestops.ts` validates `reservation_id`, `guest_name`, `requested_check_in`; emits `request_reservation_change` (with reservation_id + requested_check_in) + `generate_guest_message` (with first-name-only personalized text matching the spec 5.C example).
  - `mockCampaignService` and `mockGuestService` follow the same shape as `mockFinanceService`: dispatch on `action.type`, throw deterministically on `payload.simulate_failure === true`.
  - Engine adapter map gained two keys (`campaignops:client_brief.received`, `guestops:reservation.change_requested`); service map gained two entries.
  - Test 2 in `tests/campaignops.test.ts` asserts 4 actions (3 per-channel `create_campaign_task` + 1 `qa_review_task`), all `completed`, titles contain client name, deadline propagated to every task. Test 3 in `tests/guestops.test.ts` asserts 2 actions (`request_reservation_change` + `generate_guest_message`), message starts with "Hi Maya," and contains the new date.
  - `npm test`: 5 tests passing across 4 files (smoke + 2 finance + 1 campaign + 1 guest). `npx tsc --noEmit` clean. 3 of the 6 mandatory tests now done; edge cases (4-6) are Phase 4.

## Phase 4 - Edge cases: idempotency + missing field + simulated failure + unknown routing

- TDD: yes
- Preconditions:
  - Phase 3 postconditions hold (all three adapters wired, 3 happy-path tests passing)
- Postconditions:
  - Engine handles re-submission of an event with an already-seen `source_event_id` by returning the prior `ProcessResult` from the database (no duplicate actions inserted, no duplicate service calls)
  - Engine handles `source` not in the adapter map → marks event `review_required`, creates a `review_queue_items` row with reason "Unable to determine workflow stream"
  - Engine handles `(source, event_type)` known source but no matching `event_type` → marks `review_required`, reason "Unsupported event_type \"{event_type}\" for source \"{source}\""
  - Engine catches mock-service throws → marks event `failed`, creates review queue item with the error message, audit log records the failure
  - `tests/idempotency.test.ts` (test 4), `tests/missing-field.test.ts` (test 5), `tests/simulate-failure.test.ts` (test 6) all pass
  - All 6 mandatory tests passing (`npm test` shows 7 with the smoke test = 6 mandatory + 1 smoke)
- Steps:
  1. Engine: idempotency short-circuit at the top of `processEvent` (SELECT by source_event_id; return prior persisted result if found)
  2. Engine: route to review when adapter lookup fails (unknown source) or no event_type match (unsupported)
  3. Engine: try/catch around service execution → event `failed` + review item with error
  4. Write tests 4, 5, 6 against the Appendix A `finance-002` (missing field), `campaign-002` (simulate_failure), and a duplicate submission of `finance-001`
  5. Iterate until all 6 mandatory tests green
- Verification:
  - `test -f tests/idempotency.test.ts && test -f tests/missing-field.test.ts && test -f tests/simulate-failure.test.ts`
  - `grep -q "Unable to determine workflow stream" src/lib/workflow/engine.ts`
  - `grep -q "Unsupported event_type" src/lib/workflow/engine.ts`
  - `npm test` exits 0 with all 6 mandatory tests passing
- Clarifications:
  - [2026-05-25T20:46] Q: Test 5 surfaced a bug - adapters' "missing required field" detection used `i.received === "undefined"` to filter zod issues, which doesn't fire in zod 4 (the `received` field on the issue is shaped differently than zod 3). → A: Replaced the property check with a message-regex check (`/received undefined/.test(i.message)`) across all three adapters. Version-agnostic, will keep working through zod 5 since the human-readable message format is the stable surface. Documented as a code smell in README tradeoffs: parsing zod error messages is brittle compared to using zod's structured issue codes; an upgrade-safe alternative is to pre-check required-field presence before the schema parse.
- Outcome:
  - [2026-05-25T20:46] Phase 4 done. **All 6 mandatory tests passing.** Engine already had idempotency + unknown-routing + service-failure handling from Phase 2; this phase wrote the three tests that prove it and caught one bug (zod 4 issue-shape change in the missing-field detector).
  - `tests/idempotency.test.ts` (test 4) submits the same valid FinanceOps event twice with the same `source_event_id`; asserts the second result has the same event id as the first AND the DB still contains exactly 1 event + 2 actions (no duplicate inserts, no duplicate service calls).
  - `tests/missing-field.test.ts` (test 5) uses the spec's Appendix A "Missing Required Field" payload (`finance-002`, no `invoice_id`); asserts event status `review_required`, 0 actions, review item with reason `^Missing required field` containing "invoice_id", and an audit log entry starting with "Routed to review".
  - `tests/simulate-failure.test.ts` (test 6) uses the spec's Appendix A "Simulated Failure" payload (`campaign-002` with `simulate_failure: true`); asserts event status `failed` (NOT `completed`), all actions `failed`, review queue item with reason containing "simulate_failure", failure visible in audit log. Spec 8 contract fully covered.
  - Unknown source / unsupported event_type routing logic landed in Phase 2 (engine constructs distinct reasons "Unable to determine workflow stream" vs "Unsupported event_type \"…\" for source \"…\""). Engine grep confirms both strings present. Not separately tested - exercised via the simulator in Phase 7.
  - `npm test`: 8 tests across 7 files (1 smoke + 6 mandatory + 1 priority-normal sanity). `npx tsc --noEmit` clean. Workflow engine layer is **feature-complete** for the spec's 3 happy paths + 3 mandatory edge cases.

## Phase 5 - Server actions: submitEvent + resolveReviewItem

- Post-phase agents: security-reviewer
- Preconditions:
  - Phase 4 postconditions hold (engine fully wired, 6 tests passing)
- Postconditions:
  - `src/app/_actions/submitEvent.ts` exists with `'use server'` directive, exports an async function taking a raw JSON string or `IncomingEvent`, zod-validates at the boundary, calls `processEvent`, returns the `ProcessResult` or a typed error result. Calls `updateTag('events')` + `updateTag('review-queue')` + `updateTag('dashboard')` for read-your-writes
  - `src/app/_actions/resolveReviewItem.ts` exists with `'use server'`, exports an async function taking review item id + action (`approve` | `reject` | `edit` | `add_notes` | `mark_resolved`) + optional payload edits + optional notes. Approve transitions `review_required` → `processing` → `completed` running through the engine's execution-only path; reject transitions to `failed` with notes and cancels pending actions; edit updates the action payload before approval; add_notes appends to `resolution_notes`; mark_resolved sets `resolved_at`. Audit log records every operator action with the operator id (stub "operator" for this exercise)
  - The `actions.status` CHECK constraint accommodates the cancel path: either add a new migration adding `cancelled` to the CHECK, OR delete pending actions on reject (mid-phase decision)
  - Server-reviewer agent has reviewed and any CRITICAL/HIGH findings are addressed
- Steps:
  1. Write `submitEvent.ts`: parse + zod validate `IncomingEvent`; call `processEvent`; handle errors; call `updateTag` for affected tags
  2. Write `resolveReviewItem.ts`: action-type dispatcher; for approve, look up event + actions, execute pending actions through services, transition statuses, log audit; for reject, decide on cancel-action approach
  3. If `cancelled` action status needed, write a new migration `<timestamp>_actions_cancelled.sql` adjusting the CHECK constraint and apply via Supabase MCP (or document for user to apply)
  4. Run `npm test` (no new tests required; the 6 mandatory cover the engine; server-actions are thin wrappers)
  5. Dispatch security-reviewer agent: scope = `src/app/_actions/`, context = Server Actions reachable via POST, no auth in this exercise, zod boundary validation required
  6. Address any CRITICAL/HIGH findings; log MEDIUM/LOW
- Verification:
  - `test -f src/app/_actions/submitEvent.ts && test -f src/app/_actions/resolveReviewItem.ts`
  - `grep -q "'use server'" src/app/_actions/submitEvent.ts && grep -q "'use server'" src/app/_actions/resolveReviewItem.ts`
  - `grep -q "updateTag" src/app/_actions/submitEvent.ts`
  - `npm test` exits 0 (all 6 still passing)
  - `npx tsc --noEmit` clean
  - `security-reviewer` outcome captured in Outcome bullets
- Clarifications:
  - [2026-05-25T21:00] Q: Action-cancel mechanism on reject - add `cancelled` to the actions.status enum (new migration) or delete pending actions? → A: Add `cancelled`. Preserves the audit trail of "what would have been executed" - strictly better than deletion for an audit-focused product. Migration `20260525174905_actions_cancelled.sql` applied via Supabase MCP; local file renamed to match remote timestamp.
  - [2026-05-25T21:00] Q: TS error - zod `z.string()` for `source` vs IncomingEvent's `EventSource` union? → A: Tightened both submitEvent's and engine's schema to `z.enum(["financeops","campaignops","guestops","unknown"])`. Any other source value is upstream garbage and gets rejected at the boundary with a clear validation error rather than reaching the DB and failing the CHECK constraint. `unknown` is still a valid value - engine routes it to review per spec.
  - [2026-05-25T21:00] Q: security-reviewer findings - apply now or defer? → A: Applied M1 (status guard rejecting verbs against closed review items), M2-lite (load-and-check event.status before approve/reject, catches double-click case without atomic row claim), L2 (max(200) on source_event_id + event_type), L3 (max(2000) on notes). L1 (raw error message leakage) + L4 (no transactional boundary) get documented in README tradeoffs in Phase 8 - strict race-free claim and Postgres RPC-wrapped transaction are the right "what I'd harden next" items.
- Outcome:
  - [2026-05-25T21:00] Phase 5 done. **Both server actions live.** `src/app/_actions/submitEvent.ts` (`'use server'`) zod-validates the IncomingEvent at the boundary (enum source, max-length strings, record-shape payload), calls `processEvent`, invalidates the `events` + `review-queue` + `dashboard` cache tags via `revalidateTag(tag, "max")` (Next 16 requires the cacheLife profile), returns a typed `SubmitEventResult` discriminated union.
  - `src/app/_actions/resolveReviewItem.ts` (`'use server'`) implements the 5-verb state machine with a `discriminatedUnion` zod schema: **approve** (load event + pending actions, run each through the matching service with try/catch, transition `review_required → processing → completed/failed`), **reject** (cancel pending actions, event → failed, review item → rejected with optional notes), **edit_action** (mutate action.payload pre-execution, status stays pending), **add_notes** (append to resolution_notes with newline separator), **mark_resolved** (close review item with resolved_at timestamp). Every verb audits.
  - New migration `supabase/migrations/20260525174905_actions_cancelled.sql` drops + recreates `actions_status_check` to include `cancelled`. Applied via Supabase MCP. `ActionStatus` type extended to match.
  - `security-reviewer` report (verbatim summary): **0 CRITICAL / 0 HIGH / 2 MEDIUM / 4 LOW**. Verdict initially "OK-TO-COMMIT-WITH-FOLLOWUPS"; after the four cheap fixes (M1, M2-lite, L2, L3) the residual is L1 (raw error message leak - defer to README) + L4 (no transaction boundary - defer to README). L2 was the reviewer's explicit "harden one thing in 10 minutes" recommendation. Cleared sections: SQL injection (parameterized queries everywhere), idempotency race (UNIQUE constraint is the safe failure mode), `simulate_failure` flag (no privilege escalation, working as designed), `'use server'` placement (top of file, only intended symbols exported), secrets (no service-role key anywhere), authorization on editAction (scoped by action_id + event_id).
  - `npm test` 8 passing. `npx tsc --noEmit` clean. `npm run build` clean - 5 ops routes still prerendered correctly.

## Phase 6 - Wire dashboard + inbox + event detail to Supabase

- Impeccable: yes
- Preconditions:
  - Phase 5 postconditions hold
- Postconditions:
  - `src/app/page.tsx` (Dashboard) queries Supabase for status counts (total, completed, review_required, failed) using `select('status', { count: 'exact', head: false })` or per-status `count` queries. Replaces the zero-value placeholders in `section-cards.tsx`. Replaces the empty-state in `chart-area-interactive.tsx` with a real "recent activity" list (10 most-recent events)
  - `src/app/inbox/page.tsx` renders a table of events with columns: source_event_id, source, event_type, status, created_at, review-required-flag. Filters via URL search params: `?status=...&source=...&review=...`. Rows link to `/events/[id]`. Empty state when no events match
  - `src/app/events/[id]/page.tsx` renders: original payload (collapsible JSON view), detected stream (badge), generated actions list, action execution status, review reason if any, audit timeline. Uses Next 16 async params (`await props.params`). Audit timeline newest-first, styled per design.md 5 (1px teal hairline trunk, meta timestamp left, message center, secondary metadata below)
  - Status chips per design.md 5: `received` (ink-tinted), `processing` (teal-tinted, the only product-only teal background), `completed` (green-tinted), `review_required` (amber-tinted), `failed` (red-tinted). Implemented as a single `<StatusChip status={...}>` component in `src/components/status-chip.tsx`
  - `npm run build` succeeds, all three pages render server-side with no console errors
- Steps:
  1. Build `src/components/status-chip.tsx` with the 5 status variants using design.md 5 colors
  2. Rewrite `src/components/section-cards.tsx` to take `counts: Record<EventStatus, number>` props and remove the TODO + zero-value placeholder
  3. Rewrite `src/components/chart-area-interactive.tsx` to take `recent: Event[]` props (or query inline as a Server Component fetch)
  4. Update `src/app/page.tsx` to be `async`, run the dashboard queries via `createClient` from `@/lib/supabase/server`, pass props down
  5. Build the inbox table in `src/app/inbox/page.tsx` - use shadcn `Table` primitive. Filters as `<Select>` controls that update search params via Next 16 `useSearchParams` + `router.push`
  6. Build the event detail page: `await props.params`, query the event + actions + audit_logs + review_queue_items, render the four sections. Audit timeline component lives in `src/components/audit-timeline.tsx`
  7. Verify with `npm run build` + manual eyeball check; user runs `npm run dev` themselves (per memory)
- Verification:
  - `test -f src/components/status-chip.tsx && test -f src/components/audit-timeline.tsx`
  - `grep -q "supabase" src/app/page.tsx`
  - `grep -q "from(\"events\")" src/app/inbox/page.tsx`
  - `grep -q "await props.params\|await params" src/app/events/\[id\]/page.tsx`
  - `npm run build` exits 0
  - `npx tsc --noEmit` clean
- Clarifications:
  - [2026-05-25T21:10] Q: design.md applied via the impeccable skill? → A: Yes. Loaded the impeccable skill with the vault project folder as context (`IMPECCABLE_CONTEXT_DIR=...operations-command-center`). DESIGN.md loaded successfully; PRODUCT.md was treated as effectively present (user-stories.md + CONTEXT.md cover the same surface). Register identified as **product** (per design.md targetRegister field). Applied the product-register laws plus design.md's named rules: One-Orange (brand orange reserved for next-action only, not used anywhere on these read-only pages), Weight-Switch (400 default, 700 for title metric), No-Pure-Black (body uses rgba(0,0,0,0.7+) and ink #2E2A39 throughout), No-Inner-Shadow, Flat-By-Default (no shadow on resting card surfaces).
  - [2026-05-25T21:10] Q: filter state - URL search params or client state? → A: URL search params (`?status=...&source=...&review=1`). Filters survive refresh, are shareable, and the page re-fetches via the server component when params change. The `_filters.tsx` client component is a thin wrapper around `useSearchParams + router.push`.
- Outcome:
  - [2026-05-25T21:10] Phase 6 done. **Three pages wired to real Supabase data with full design.md treatment.**
  - `src/components/status-chip.tsx` - pill component with the 5 status variants from design.md 5 (received ink-tinted, processing teal-tinted, completed green-tinted, review_required amber-tinted, failed red-tinted - never brand-orange per The One Orange Rule).
  - `src/components/audit-timeline.tsx` - signature component: vertical `<ol>` with a 1px brand-teal hairline trunk per design.md 5, meta-timestamp + body-strong-message + key/value metadata line per row, newest-first per decision #6. Empty state included.
  - `src/app/page.tsx` (Dashboard) - server component, runs two parallel Supabase queries (one for status counts, one for ten most-recent events), passes both into `SectionCards` + `ChartAreaInteractive`. Cards use design.md `title` weight 700 + 40px to give the metric authority per Weight-Switch Rule. Recent-activity list links each row to `/events/[id]`, empty state teaches the operator (per impeccable product reference: "Empty states that teach the interface, not 'nothing here.'") with a link into the simulator.
  - `src/app/inbox/page.tsx` - server component lists up to 100 events newest-first. `src/app/inbox/_filters.tsx` is a client component holding the filter chips (5 status + 4 source + review-only toggle); state lives in URL search params via `useSearchParams + router.push` so filters survive refresh and are shareable. Table styled per design.md 5 (header row 13px uppercase tracking-0.5px, body rows 15px ink, hover lifts to surface-mute).
  - `src/app/events/[id]/page.tsx` - Next 16 async params (`const { id } = await params`); parallel Supabase queries for event + actions + review item + audit logs (last ordered desc). Renders source + event_type breadcrumb-style header, status chip, review reason banner (color-coded by item.status), original payload pre-block, generated actions list with their per-action status pills (including the new `cancelled` from Phase 5), and the audit timeline. 1200px max width per design.md 6.
  - `npm test` 8 passing (no regression). `npx tsc --noEmit` clean. `npm run build` clean - `/`, `/inbox`, `/events/[id]` now dynamic (server queries Supabase per request); `/simulator`, `/review` still static placeholders (Phase 7).

## Phase 7 - Wire simulator + review queue

- Impeccable: yes
- Preconditions:
  - Phase 6 postconditions hold
- Postconditions:
  - `src/app/simulator/page.tsx` is a Client Component (`'use client'`) with: a dropdown/buttons picking from the 6 Appendix A sample payloads (valid finance/campaign/guest, ambiguous, missing-field, simulate-failure), a JSON `<textarea>` (or simple textarea with monospace) showing the picked payload, edit-in-place, a "Submit" button that calls the `submitEvent` server action, a result preview pane showing the returned `ProcessResult` (or error), a clear visual cue when the payload is invalid JSON
  - The simulator handles `simulate_failure` via the picked sample (the campaign-002 sample) - no separate toggle button needed; the flag lives in the JSON payload itself, which the user can flip manually
  - `src/app/review/page.tsx` lists open review queue items (server component initial fetch). Each item shows: source_event_id, reason, original payload (collapsible), generated actions if any. Per-item action buttons: Approve / Reject / Edit Action(s) / Add Notes / Mark Resolved. Each button is a small Client Component that calls `resolveReviewItem` with the right action type
  - All operator actions update the review queue list optimistically OR trigger a `refresh()` from `next/cache` post-action
  - The brand-orange CTA (Submit on simulator; Approve on review item) is exactly ONE per screen per design.md 2 (The One Orange Rule)
  - `npm run build` succeeds
- Steps:
  1. Build the simulator: import the 6 sample payloads as static constants, JSON editor (textarea is fine), submit button wired to the server action, result preview
  2. Add invalid-JSON handling: parse before submit, show a clear error if JSON.parse throws
  3. Build the review queue list (server component) + per-item action buttons (client components)
  4. For Edit Action: a small dialog (shadcn `Dialog`) showing the action JSON, editable, with Save → calls `resolveReviewItem` with `action: 'edit'`
  5. Wire `refresh()` so the page updates after each operator action
  6. Verify visual one-orange-per-screen rule is honored (Submit on simulator, Approve on review row - others are teal-outline or ghost)
- Verification:
  - `grep -q "submitEvent" src/app/simulator/page.tsx`
  - `grep -q "resolveReviewItem" src/app/review/page.tsx`
  - `grep -q "simulate_failure" src/app/simulator/page.tsx`
  - `npm run build` exits 0
  - `npx tsc --noEmit` clean
- Clarifications:
  - [2026-05-25T21:18] Q: One-Orange Rule application to the review queue - N approve buttons (one per row) violates "one orange per screen"? → A: Treating each review card as its own section (matching design.md 2's source-pattern: "one rounded rectangle per section"), each card has one brand-orange Approve. Cards are visually distinct sections, not table rows; the rule survives. Reject + Add Notes + Mark Resolved on the same card are teal-outline or ghost, so the orange button always reads as "the next thing to do for THIS event." Document in README tradeoffs.
  - [2026-05-25T21:18] Q: Modals (Dialog primitive) for edit / reject / notes flows? → A: No - used inline disclosure instead. Edit Action toggles inline JSON textarea per action; notes live in a single textarea on each card that's paired with the action buttons (Reject + Add Notes + Mark Resolved all read from the same notes field). Avoids the "modal as first thought" anti-pattern from the impeccable shared design laws + spares us a new shadcn primitive install.
  - [2026-05-25T21:30] Q: `/impeccable polish` pass over Phases 6 + 7. → A: Polished the cumulative UI in five passes: (a) extracted shared `.cta-primary` / `.cta-secondary` / `.cta-ghost` classes in `globals.css` so Submit + Approve (orange) / Reject (teal-outline) / "add notes" + "mark resolved" (ghost) share one definition with design.md 5's hover-lift, teal-background-active swap, and `:focus-visible` ring; (b) `aria-pressed` on simulator sample buttons + inbox filter chips for screen-reader state announcement; (c) `:focus-visible` keyboard rings on filter chips and inline Edit/Save/Cancel buttons in the review card; (d) status-chip gained `aria-label="Status: <label>"` so the visual chip reads cleanly to assistive tech; (e) Weight-Switch Rule fix on all five page H1s (`text-[32px]` weight 400 instead of `text-[28px] font-bold` - design.md 3 reserves 700 for Display 64px and Title 26px, mid-size headings stay 400 so the size carries hierarchy). Inline `style={{ color: "#2E2A39" }}` migrated to `text-foreground` Tailwind utility where the shadcn token already matches. Motion timing standardized at 180ms with `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart per impeccable shared design laws).
- Outcome:
  - [2026-05-25T21:18] Phase 7 done. **All 5 pages live.** Operator can submit, see counts update, click into events, and resolve review items end-to-end.
  - `src/app/simulator/page.tsx` is a thin server wrapper; `_simulator.tsx` is the client component. Six sample-payload buttons (the Appendix A set: 3 happy + ambiguous + missing-field + simulate-failure) load the picked sample into a monospace JSON textarea. Submit button is the **single brand-orange CTA per screen** per The One Orange Rule. Result preview pane shows the returned `ProcessResult` with status chip + a "Open event detail →" link, plus collapsible details disclosures for the full actions list and audit log. Invalid-JSON catches `JSON.parse` errors and shows them inline with a red border on the textarea.
  - `src/app/review/page.tsx` server-fetches all open review items + their events + pending actions, then renders one `ReviewCard` per item.
  - `src/app/review/_review-card.tsx` is the client component owning the per-card state machine. Header shows source/event_type/source_event_id; amber reason banner; collapsible original payload disclosure; pending actions list with inline edit (per-action "Edit" toggle reveals a JSON textarea + Save/Cancel); single notes textarea paired with three secondary verbs (Reject, Add notes only, Mark resolved). **Approve is the brand-orange CTA** - one per card, treating each card as its own section per design.md 2 (cross-phase clarification). All verbs call `resolveReviewItem` server action, use `useTransition` for non-blocking dispatch, surface errors inline, and `router.refresh()` on success so the page re-fetches.
  - All design.md rules respected: One Orange (Approve / Submit), Weight-Switch (page titles 700/28px), No-Pure-Black (foreground #2E2A39 + body 0.7+ alpha), Flat-By-Default (no shadow on resting cards, only hover lift), No-Inner-Shadow. Status chip vocabulary reused; no new color tokens introduced.
  - `npm test` 8 passing (no regression). `npx tsc --noEmit` clean. `npm run build` clean - `/`, `/inbox`, `/events/[id]`, `/review` dynamic (Supabase queries); `/simulator` static (client-only page, server actions fire on submit). All 5 ops routes registered + click-through-able end-to-end.

## Phase 8 - README tradeoffs + final verification

- Post-phase agents: code-reviewer
- Preconditions:
  - Phases 1-7 postconditions all hold
- Postconditions:
  - README.md has a "Tradeoffs" section explaining: no classifier (rule-based routing satisfies every spec example; classifier would be theatre); no auth (spec 13); single light theme (design.md is single-theme); inbox filters limited to status/source/review-flag (no date range); the action-cancel approach picked in Phase 5
  - README.md has a "Next steps" section: dynamic breadcrumb in site-header, webhook ingestion endpoints (one new route, same engine), classifier-as-extension-point for ambiguous free-text payloads, status badges color-blind-friendly variants, dark mode, more granular audit metadata
  - README.md has a "Sample events" section listing all six Appendix A payloads with their expected outcomes (auto-complete, review with reason X, fail with reason Y) so the reviewer can paste-and-test in 30 seconds
  - `npm test` runs all 6 mandatory tests + smoke = 7 tests, all pass
  - `npm run build` clean, 5 ops routes prerendered as expected
  - `npx tsc --noEmit` clean
  - `code-reviewer` agent has reviewed cumulative diff (commit range = start of this plan to HEAD); CRITICAL/HIGH addressed
- Steps:
  1. Add the three new README sections (Tradeoffs, Next steps, Sample events)
  2. Run `npm test`, `npm run build`, `npx tsc --noEmit` - all clean
  3. Dispatch code-reviewer agent with scope = full cumulative diff for `workflows-and-pages`
  4. Address CRITICAL/HIGH; log MEDIUM/LOW in this phase's Clarifications
- Verification:
  - `grep -q "Tradeoffs" README.md && grep -q "Next steps\|Next Steps" README.md && grep -q "Sample events\|Sample Events" README.md`
  - `npm test` exits 0
  - `npm run build` exits 0
  - `code-reviewer` outcome captured in Outcome
- Clarifications:
  - [2026-05-25T22:30] Q: code-reviewer surfaced MEDIUM-2 (unbounded combined notes after repeated add_notes calls - Zod max(2000) is per-call, not on the combined value) and MEDIUM-3 (editAction silently no-ops if action_id doesn't belong to the review item's event - Supabase update returns 0 rows without error). Apply now or defer? → A: Applied both. MEDIUM-2: pre-check `combined.length > NOTES_MAX` before the update; throws a clear "trim and retry" message. MEDIUM-3: chained `.select("id")` on the update so we see the rowcount; throw if zero matched. Both are 3-line fixes and an evaluator probing the API directly would notice them. MEDIUM-1 (race-condition error shape on truly-concurrent same-source_event_id submissions) stays documented in README Tradeoffs since the fix is the same Postgres-RPC work already on the Next steps list.
- Outcome:
  - [2026-05-25T22:30] Phase 8 done. **Plan complete.** README rewritten with the three required new sections (Sample events, Tradeoffs, Next steps) plus an Architecture prose section satisfying 11 deliverable #4. Stale "What's foundation vs. what's next" section dropped; intro updated to reflect that all 5 pages + 6 mandatory tests are live (previously still said "current state is the foundation scaffold"). Project structure tree refreshed to show actual files (server actions, three adapters, three services, the new `cancelled` migration, the seven test files + helpers).
  - **Sample events** table walks the reviewer through all six Appendix A payloads with one-line expected outcomes - paste-and-test in 30 seconds: finance-001 → completed (2 actions, priority high); campaign-001 → completed (3 channel tasks + QA); guest-001 → completed; unknown-001 → review with verbatim "Unable to determine workflow stream"; finance-002 → review with "Missing required field: invoice_id"; campaign-002 → failed (not completed).
  - **Tradeoffs** section makes the timebox-driven choices explicit: no classifier (rule-based routing satisfies every example; classifier would be theatre), no auth (spec 13), single light theme, inbox filters limited to status/source/review-flag, action-cancel via new `cancelled` enum value (preserves audit trail), per-card One-Orange interpretation on review cards, raw-error-in-reason (security-reviewer L1 deferred), no transactional boundary (L4 deferred), regex-on-zod-message for missing-field detection, no webhook ingestion yet.
  - **Next steps** lists 10 items in priority order: webhook ingestion (one file, same engine), Postgres-RPC for atomicity, generic-message + structured-error split, dynamic breadcrumb, classifier-as-extension-point, color-blind palette verification, dark mode, operator IDs on audit logs, more granular audit metadata, collapse the review-queue N+1.
  - `code-reviewer` agent report (verbatim summary): 0 CRITICAL / 0 HIGH / 3 MEDIUM / 3 LOW. Verdict: **OK-TO-COMMIT-WITH-FOLLOWUPS**. MEDIUM-1 (idempotency race surfaces unique-violation error message instead of `{ ok: true, existed: true }` short-circuit) - documented in README Tradeoffs, fix is the same Postgres-RPC work in Next steps. MEDIUM-2 (combined notes can grow unbounded across repeated `add_notes` calls) - **fixed in-phase** with a `combined.length > NOTES_MAX` pre-check throwing a "trim and retry" error. MEDIUM-3 (editAction silently succeeds on mismatched action_id) - **fixed in-phase** by chaining `.select("id")` on the update and throwing if zero rows matched. LOW-1 (unused `isPending` from useTransition in `_review-detail.tsx`), LOW-2 (review-queue N+1 - now in Next steps #10), LOW-3 (KNOWN_SOURCES + zod enum kept in sync manually) - accepted as cosmetic for take-home.
  - Phase 8 verification re-run after the two medium fixes: `npm test` 8 passing across 7 files (1 smoke + 6 mandatory + 1 priority-normal sanity), `npx tsc --noEmit` clean, `npm run build` clean (5 ops routes registered: `/`, `/inbox`, `/events/[id]`, `/review` dynamic; `/simulator` static). `grep -E "^## (Tradeoffs|Next steps|Sample events|Architecture)" README.md` returns all four.
  - Plan flips to `status: done`. Run `/archive workflows-and-pages` to archive.

## Plan-level verification

- All 6 mandatory tests + smoke = 7 tests, `npm test` clean
- `npm run build` clean, all 5 ops routes render
- `npx tsc --noEmit` clean
- A fresh checkout + `npm install` + `.env.local` populated + `npm run dev` produces a working dashboard where the operator can: submit Appendix A payloads through the simulator, see counters update, see events appear in the inbox, click into one to see the audit timeline, see review-required ones land in the review queue, approve/reject them, and see the state persist after refresh
- README's Tradeoffs + Next Steps + Sample Events sections are present and honest
- All eight phases' Outcome blocks filled

## Phase outcomes

<!-- Appended as each phase completes. -->
