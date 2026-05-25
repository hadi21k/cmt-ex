# Operations Command Center

Internal operations dashboard for a fictional company that receives events from three business systems (FinanceOps, CampaignOps, GuestOps). The app accepts events, runs them through a shared workflow engine with stream-specific adapters, executes mock side effects, and routes risky or ambiguous cases to a human review queue with an audit timeline.

This repository is the candidate submission for a take-home exercise. The current state is the **foundation scaffold**: stack wired, schema landed, dashboard shell rendered, routes click-through-able. Workflow logic, mock services, and the 6 mandatory tests land in the next implement pass.

## Source of truth

The master spec lives outside the repo in the flow vault as a verbatim transcription of the candidate-facing PDF:

`../workspace/flow/vault/projects/operations-command-center/requirements.md`

That file is the contract. `CLAUDE.md` at the repo root indexes its key requirements (five required pages, three workflow streams, five statuses, four persistence entities, six mandatory tests, evaluation rubric) so every working session anchors to the spec without re-reading the PDF.

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

The dashboard at `/` shows zero-value metric cards and an empty "Recent activity" card by design — there is no seed data and no mock content. Submit events through the simulator (lands next implement) to populate the dashboard.

## Project structure

```
src/
  app/
    _actions/             # Server Actions (Next 16 private folder)
                          # README documents conventions; files land next implement
    events/[id]/page.tsx  # Event Detail (placeholder)
    inbox/page.tsx        # Event Inbox (placeholder)
    review/page.tsx       # Human Review Queue (placeholder)
    simulator/page.tsx    # Event Simulator (placeholder)
    layout.tsx            # Sidebar + header shell wraps every route
    page.tsx              # Dashboard at /
    globals.css           # Design tokens from design.md (cream + teal/orange brand)
  components/
    ui/                   # 22 shadcn primitives (button, card, sidebar, ...)
    app-sidebar.tsx       # Nav rewired to the 5 ops routes
    section-cards.tsx     # 4 zero-value metric cards (Total/Completed/Review/Failed)
    chart-area-interactive.tsx  # "Recent activity" empty-state card
    site-header.tsx
  lib/
    supabase/
      client.ts           # Browser client (createBrowserClient)
      server.ts           # SSR client (createServerClient + async cookies adapter)
    workflow/
      engine.ts           # processEvent() stub with the 6-step contract in JSDoc
      types.ts            # EventStatus, EventSource, Event, Action, ReviewQueueItem, AuditLog
      adapters/           # README: contract + "adding a fourth stream" recipe
      services/           # README: mock services + simulate_failure contract
supabase/
  config.toml
  migrations/
    20260525161555_init.sql  # 4 tables, UNIQUE(source_event_id), CHECK constraints, RLS
tests/
  smoke.test.ts           # 1 test verifying types + path alias resolve
```

Adding a fourth stream is the strong-submission signal the rubric explicitly probes. The recipe: drop a new file in `src/lib/workflow/adapters/`, register it in the engine's adapter map, add the source to `EventSource` in `types.ts` and to the `events_source_check` constraint in a new migration file. No other code changes.

## What's foundation vs. what's next

**Foundation (this scaffold):**

- Dependencies, env wiring, gitignore, `.nvmrc`, engines pin
- Supabase clients + schema migration (4 tables with idempotency + RLS) applied to hosted project
- shadcn `dashboard-01` shell, mock data stripped, nav rewired to the 5 routes
- 4 placeholder pages reachable from the sidebar
- Workflow engine type contracts + architecture READMEs
- Vitest config + one smoke test
- Design tokens from `vault/projects/operations-command-center/design.md` applied to `globals.css`

**Next implement (feature work):**

- `submitEvent` and `resolveReviewItem` Server Actions
- Three stream adapters (FinanceOps / CampaignOps / GuestOps) per spec §5
- Three mock services (mockFinanceService / mockCampaignService / mockGuestService) per spec §8 with `simulate_failure` honoured
- The engine wiring (validate → route → adapt → execute → persist → idempotency)
- Inbox table, Event Detail view, Simulator JSON editor, Review Queue actions
- The 6 mandatory tests (3 happy paths, duplicate, missing field, simulated failure)
- Audit timeline UI styled per `design.md` §5
- Status chip components matching the design system palette
- Tradeoffs + next-steps section in this README

## Conventions

- **Package manager:** `npm`. Never `pnpm`, `yarn`, or `bun`.
- **Workflow engine:** `src/lib/workflow/`. New streams = new file in `adapters/`.
- **Server actions:** `src/app/_actions/`. One file per top-level operation. The underscore is load-bearing (Next 16 private folder).
- **Supabase clients:** `src/lib/supabase/client.ts` (browser) + `server.ts` (SSR via `@supabase/ssr`).
- **Migrations:** `supabase/migrations/<timestamp>_<name>.sql`. Apply with `npx supabase db push`.
- **Tests:** only the 6 mandatory ones.

## Design

Two-color brand (teal `#12536B` for identity, orange `#ED5338` for the single per-screen CTA), cream surface, Helvetica/Arial, near-flat shadows, generous letter-spacing. Status chip palette and per-page typography land alongside the corresponding feature work. Full system in `../workspace/flow/vault/projects/operations-command-center/design.md`.
