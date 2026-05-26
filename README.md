# Operations Command Center

Internal operations dashboard for a fictional company that receives events from three business systems (FinanceOps, CampaignOps, GuestOps). The app accepts events, runs them through a shared workflow engine with stream-specific adapters, executes mock side effects, and routes risky or ambiguous cases to a human review queue with an audit timeline.

This repository is the candidate submission for a take-home exercise. All five required pages are live and wired to real Supabase data, the three workflow streams + unknown-routing are implemented, and the six mandatory tests pass.

## Source of truth

The master spec — a verbatim transcription of the candidate-facing PDF — lives in this repo at:

[`docs/project/requirements.md`](./docs/project/requirements.md)

That file is the contract. `CLAUDE.md` at the repo root indexes its key requirements (five required pages, three workflow streams, five statuses, four persistence entities, six mandatory tests, evaluation rubric) so every working session anchors to the spec without re-reading the PDF.

## How this was built (reviewer pointer)

The full build record lives in [`docs/implement/`](./docs/implement/) as two phased plans, each with goal, preconditions, postconditions, verification, and per-phase outcomes:

- [`setup-and-scaffold.md`](./docs/implement/setup-and-scaffold.md) — foundation pass: CLAUDE.md spec index, Supabase schema migration, dashboard-01 shell with stripped mock data, design tokens, route placeholders, workflow engine skeleton, vitest smoke test, README.
- [`workflows-and-pages.md`](./docs/implement/workflows-and-pages.md) — feature pass: workflow engine + three stream adapters + three mock services, `submitEvent` + `resolveReviewItem` server actions, all five pages wired to Supabase, audit timeline, status chips, and the six mandatory tests.

Supporting docs in [`docs/project/`](./docs/project/):

- [`requirements.md`](./docs/project/requirements.md) — the candidate-facing PDF, verbatim.
- [`user-stories.md`](./docs/project/user-stories.md) — the six end-to-end use cases, the operator's daily loop, the four-pillar rubric breakdown, and the code-mapping table.
- [`design.md`](./docs/project/design.md) — design system (tokens, components, do's and don'ts).
- [`CONTEXT.md`](./docs/project/CONTEXT.md) — project goals, constraints, decisions.

## Stack

- **Next.js 16.2.6** — App Router, Turbopack default, Server Functions / Server Actions
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind 4** — CSS-only config; no `tailwind.config.js`
- **shadcn/ui v4** — `dashboard-01` block as the layout base, mock data stripped
- **Supabase** (hosted) — `@supabase/supabase-js` + `@supabase/ssr` for SSR-safe clients
- **Zod** — payload validation at system boundaries (spec §4.1)
- **Vitest** + jsdom + @testing-library/react — for the 6 mandatory tests

Node `>=22.12.0` required (enforced via `engines.node`). The vitest 4 toolchain pulls rolldown which uses `node:util.styleText`, stable from Node 21.7 / 22.12.

## How to run

```bash
# 1. Match Node version (.nvmrc pins 24.14.0; any Node >= 22.12 works)
nvm use

# 2. Install deps
npm install

# 3. Configure Supabase
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_SUPABASE_URL and
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from your Supabase project's
# Project Settings -> API page.

# 4. Apply the schema migration to your Supabase project
#    (canonical workflow; reproducible on any teammate's clone)
npx supabase login                 # opens browser, paste token
npx supabase link --project-ref <your-project-ref>
npx supabase db push               # applies supabase/migrations/*.sql

# 5. Run the app
npm run dev                        # http://localhost:3000

# 6. Run tests
npm test                           # vitest run (CI-style)
npm run test:watch                 # vitest (interactive)
```

On a fresh database, the dashboard shows zero-value metric cards and an empty "Recent activity" card — there is no seed data and no mock content. Submit one of the [sample events](#sample-events) through the simulator (`/simulator`) to populate the dashboard, inbox, and review queue.

## Sample events

The simulator at `/simulator` ships with the six Appendix A payloads loaded as one-click samples. Paste, submit, and the result preview shows the engine's `ProcessResult`. Expected outcomes:

| Sample | `source_event_id` | Expected outcome |
| --- | --- | --- |
| Valid FinanceOps | `finance-001` | `completed`. Two actions (`send_payment_reminder`, `create_follow_up_task`), both `completed`, both `priority: high` (because `days_overdue: 17 > 14`). |
| Valid CampaignOps | `campaign-001` | `completed`. Four actions: one `create_campaign_task` per channel (Instagram, email, landing page) + one `qa_review_task` (the spec §5.B bonus). |
| Valid GuestOps | `guest-001` | `completed`. Two actions (`request_reservation_change`, `generate_guest_message`). Message starts `"Hi Maya, we received your request..."`. |
| Ambiguous | `unknown-001` | `review_required`. Review item with reason `"Unable to determine workflow stream."` (verbatim spec §6). No actions generated. |
| Missing required field | `finance-002` | `review_required`. Review item with reason `"Missing required field: invoice_id"`. No actions generated, no service calls. |
| Simulated failure | `campaign-002` | `failed` (NOT `completed`). Actions exist with status `failed`. Review item with reason containing `"simulate_failure"`. Visible on the dashboard's Failed counter. |

Submitting the same payload twice with the same `source_event_id` is a no-op: the engine short-circuits, returns the prior result, and no duplicate actions or service calls fire. This is the idempotency contract test (test 4).

## Architecture

Five layers, each with one job. The engine is the orchestrator; adapters are pure; services are side-effecty; persistence is one Supabase row per concern.

- **Workflow engine** (`src/lib/workflow/engine.ts`). `processEvent(IncomingEvent) → ProcessResult`. Six-step contract: validate with zod → check idempotency (`SELECT` by `source_event_id`) → insert event → route by `(source, event_type)` against the adapter map → run the adapter → execute each action through the matching mock service → persist actions and statuses → emit an audit log entry at every transition.
- **Stream adapters** (`src/lib/workflow/adapters/`). One file per stream. Pure functions: `(event) => { kind: 'actions', actions: ActionSpec[] } | { kind: 'review', reason: string }`. No I/O, no service calls. Adding a fourth stream is dropping a new file here, adding a row to the engine's adapter map, and adding the source value to `EventSource` in `types.ts` + the `events_source_check` constraint in a new migration. No other code changes.
- **Mock services** (`src/lib/workflow/services/`). One file per stream. Dispatch on `action.type` internally. Honour `simulate_failure` by throwing a deterministic error when the flag is in the event payload (per spec §8). Async.
- **Persistence** (Supabase: `events`, `actions`, `review_queue_items`, `audit_logs`). `UNIQUE(events.source_event_id)` is the hard idempotency contract. Foreign keys + CHECK constraints on status enums enforce the state machine at the DB layer.
- **Review flow** (`src/app/_actions/resolveReviewItem.ts`). When the adapter returns `{ kind: 'review' }`, when the source is unknown, when a service throws, or when an operator clicks Reject — a `review_queue_items` row is created. The operator has five verbs: `approve` (transitions `review_required → processing → completed/failed`, executes pending actions), `reject` (cancels pending actions, marks event `failed`), `edit_action` (mutates `action.payload` pre-execution), `add_notes` (appends to `resolution_notes`), `mark_resolved` (closes with `resolved_at`). Every verb writes to `audit_logs`.

## Project structure

```
src/
  app/
    _actions/             # Server Actions (Next 16 private folder)
      submitEvent.ts      #   POST a payload → processEvent + cache invalidations
      resolveReviewItem.ts#   Operator verbs: approve / reject / edit_action /
                          #   add_notes / mark_resolved. Five-verb state machine.
    events/[id]/page.tsx  # Event Detail: payload + actions + review banner + audit timeline
    inbox/                # Event Inbox: filtered table; filters live in URL search params
    review/               # Review Queue: split-view (list + detail card)
    simulator/            # Event Simulator: six Appendix A samples + JSON editor
    layout.tsx            # Sidebar + header shell wraps every route
    page.tsx              # Dashboard at /: counts + recent activity
    globals.css           # Design tokens + .cta-primary/secondary/ghost
  components/
    ui/                   # 22 shadcn primitives (button, card, sidebar, ...)
    app-sidebar.tsx       # Nav wired to the 5 ops routes
    section-cards.tsx     # 4 metric cards (Total/Completed/Review/Failed)
    chart-area-interactive.tsx  # "Recent activity" card
    audit-timeline.tsx    # Vertical timeline per design.md §5 (1px teal trunk)
    status-chip.tsx       # 5 status variants per design.md §5 (no orange on failed)
  lib/
    supabase/
      client.ts           # Browser client (createBrowserClient)
      server.ts           # SSR client (createServerClient + async cookies adapter)
    workflow/
      engine.ts           # processEvent(): the 6-step orchestrator
      types.ts            # EventStatus, EventSource, ActionSpec, AdapterResult, ...
      adapters/           # financeops.ts, campaignops.ts, guestops.ts
      services/           # finance.ts, campaign.ts, guest.ts (simulate_failure honoured)
supabase/
  config.toml
  migrations/
    20260525161555_init.sql        # 4 tables, UNIQUE(source_event_id), CHECK + RLS
    20260525174905_actions_cancelled.sql  # adds 'cancelled' to actions.status enum
tests/
  _helpers/
    mock-supabase.ts      # In-memory chain mock for the Supabase client
  smoke.test.ts           # types + path alias resolve
  financeops.test.ts      # test 1 + priority-normal sanity
  campaignops.test.ts     # test 2 (one task per channel + QA bonus)
  guestops.test.ts        # test 3 (request_reservation_change + guest message)
  idempotency.test.ts     # test 4 (duplicate source_event_id is a no-op)
  missing-field.test.ts   # test 5 (review with the missing field name in reason)
  simulate-failure.test.ts# test 6 (failed status, NOT completed)
```

Adding a fourth stream is the strong-submission signal the rubric explicitly probes. The recipe: drop a new file in `src/lib/workflow/adapters/`, register it in the engine's adapter map, add the source to `EventSource` in `types.ts` and to the `events_source_check` constraint in a new migration file. No other code changes.

## Tradeoffs

Honest list of what was intentionally left out and why. Each item is a choice the timebox forced, not an oversight.

- **No classifier, no LLM.** Routing is a static `(source, event_type) → adapter` map. Every Appendix A payload (and every reasonable extension) is decided by `source` + `event_type` strings. A classifier would route the same payloads to review the same way; it'd just add a moving part. The engine's lookup has a clean seam for a real classifier if one is ever needed (see Next steps).
- **No auth, no roles.** Spec §13 says auth is out of scope. The user pill on the sidebar reads `Operator`, audit logs record `operator` as the actor. Adding real auth would touch the audit-log writer and the server actions' authorization checks, nothing else.
- **Single light theme.** `design.md` is a single-theme system (cream surface + brand teal/orange + status chip palette). A dark variant would require re-deriving the chip palette to keep contrast — deferred.
- **Inbox filters are limited to status / source / review-required.** No date range, no full-text search. The filter state is in URL search params already, so extending is additive.
- **Action cancellation preserves the audit trail.** When an operator rejects a review item, pending actions transition to `cancelled` (a new value added to the `actions.status` CHECK in `supabase/migrations/20260525174905_actions_cancelled.sql`) rather than being deleted. The "what would have run" record is the audit value.
- **One Orange on review cards = one per card, not per screen.** Each review card is treated as its own section per `design.md` §2's source pattern, so each card has one brand-orange Approve while Reject / Add notes / Mark resolved stay teal-outline or ghost. Documented in `docs/implement/workflows-and-pages.md` Phase 7 clarification.
- **Raw error message stored in `review_queue_items.reason` on service failure.** Security-reviewer flagged this as LOW (L1) — for production the user-facing reason should be generic with the raw error in a structured ops-only field. The take-home benefits from the operator seeing the real message; production wouldn't.
- **No transactional boundary around `processEvent`.** Inserts are sequential (event → actions → audit logs → status updates). Idempotency via `UNIQUE(source_event_id)` is the safe failure mode if a process dies mid-write; a clone won't see partial state because the second submission short-circuits on the SELECT. Production should wrap the writes in a Postgres function (RPC) for true atomicity. Security-reviewer L4.
- **Missing-field detection parses zod error messages with a regex** (`/received undefined/`) instead of inspecting zod's structured issue codes. The shape of zod's `received` field changed between zod 3 and zod 4; the regex on the human-readable message is version-agnostic. Cleaner alternative: pre-check required-field presence before the schema parse.
- **No webhook ingestion route yet.** The simulator is the only way events enter the system. The engine doesn't care whether the caller is a Server Action or an HTTP handler — adding `src/app/api/webhook/[source]/route.ts` would be one file calling the same `processEvent`.

## Next steps

What I'd build next given another half-day, in priority order.

1. **Webhook ingestion endpoints.** One file at `src/app/api/webhook/[source]/route.ts` that POST-receives JSON, validates with the same zod schema as `submitEvent`, calls `processEvent`. Closes the loop between simulator and real upstream systems.
2. **Wrap `processEvent` in a Postgres RPC.** True atomicity (event + actions + audit logs in one transaction). Eliminates the partial-write window. Addresses security-reviewer L4.
3. **Generic-message + structured-error split** on service failures (security-reviewer L1). User-facing `reason` becomes "An external service failed for this event," the raw error message moves to `audit_logs.metadata.error`.
4. **Dynamic breadcrumb in `site-header`.** Currently the header reads "Dashboard" everywhere. A `usePathname` + route → label map makes it route-aware.
5. **Classifier-as-extension-point** for the ambiguous free-text payload case (`unknown-001`). Plug a rule-engine or LLM at the `(source, event_type)` lookup seam; low-confidence outputs route to review with the classifier's confidence score in the reason.
6. **Color-blind palette verification** for status chips. The text labels already make chips legible, but a verification pass with a deuteranopia simulator would tighten the chip colors.
7. **Dark mode.** Requires re-deriving the chip palette + the cream surface + the audit-timeline trunk color for contrast.
8. **Operator IDs on audit logs.** Currently stubbed `"operator"`. Real auth would feed real user IDs; the schema already has `audit_logs.metadata` as JSONB so no migration is needed.
9. **More granular audit metadata.** Engine version, adapter version, service latency, retry count. Useful when the system grows past one stream version.
10. **Collapse the review-queue N+1.** `src/app/review/page.tsx` issues one Supabase query for the open items, then two per item for the event + pending actions. Fine for a handful of open items; a single `select("*, events(*), actions(*)")` join (or an RPC) closes the loop at scale.

## Conventions

- **Package manager:** `npm`. Never `pnpm`, `yarn`, or `bun`.
- **Workflow engine:** `src/lib/workflow/`. New streams = new file in `adapters/`.
- **Server actions:** `src/app/_actions/`. One file per top-level operation. The underscore is load-bearing (Next 16 private folder).
- **Supabase clients:** `src/lib/supabase/client.ts` (browser) + `server.ts` (SSR via `@supabase/ssr`).
- **Migrations:** `supabase/migrations/<timestamp>_<name>.sql`. Apply with `npx supabase db push`.
- **Tests:** only the 6 mandatory ones.

## Design

Two-color brand (teal `#12536B` for identity, orange `#ED5338` for the single per-screen CTA), cream surface, Helvetica/Arial, near-flat shadows, generous letter-spacing. Status chip palette and per-page typography land alongside the corresponding feature work. Full system in [`docs/project/design.md`](./docs/project/design.md).
