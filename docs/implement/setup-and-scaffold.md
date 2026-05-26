---
name: setup-and-scaffold
type: implement
status: done
created: 2026-05-25T18:51
updated: 2026-05-25T20:00
completed: 2026-05-25T20:00
project: operations-command-center
total_phases: 7
current_phase: 8
---

# Setup and Scaffold

## Goal

Lay the full foundation for the Operations Command Center exercise (this repository; Next.js 16 already scaffolded) without building any feature logic. After this plan completes the next `/implement` will start dropping in real workflows, pages, and the 6 mandatory tests. Concretely: anchor every future session to the requirements spec via `CLAUDE.md`, install Supabase + zod + vitest + the Supabase agent skill, wire Supabase clients (browser + SSR), land the schema migration for the four entities and apply it to the hosted project, add the shadcn `dashboard-01` block stripped of mock data with the sidebar rewired to the five required pages, create placeholder routes for the four non-dashboard pages, lay down the workflow-engine / adapters / services / server-actions folder skeleton, configure vitest with a smoke test, and update the README so a fresh checkout is runnable.

## Clarifications (upfront)

- [2026-05-25T18:51] Q: Supabase setup? → A: Hosted Supabase. `NEXT_PUBLIC_SUPABASE_URL=https://fiigztjfkvlgetyiiauj.supabase.co`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fcLZp34jKOSEIU_olKakCQ_0y9l_UHm`. Install `@supabase/supabase-js` + `@supabase/ssr`. Also `npx skills add supabase/agent-skills` (project-only).
- [2026-05-25T18:51] Q: Test runner? → A: Vitest, but tests are not aggressive for this exercise. Only the 6 mandatory tests will be written; vitest config + one smoke test is enough scaffold.
- [2026-05-25T18:51] Q: Sidebar nav rewire? → A: Rewire dashboard-01 nav to the five ops pages now (`/`, `/inbox`, `/simulator`, `/review`; Event Detail nested under `/events/[id]`).
- [2026-05-25T18:51] Q: Install zod + date-fns now? → A: Install zod now (event payload validation is unavoidable per spec §4.1). Skip date-fns; native `Intl` is enough.
- [2026-05-25T18:51] Q: How to apply migration? → A: Use Supabase CLI best-practice flow: `supabase init` (already may happen via `supabase link`), `supabase link --project-ref fiigztjfkvlgetyiiauj` (interactive: access token + DB password), `supabase migration new <name>` to scaffold the file, `supabase db push` to apply. Migration file lives at `supabase/migrations/<timestamp>_init.sql`.

## Clarifications (cross-phase)

<!-- Mid-execution clarifications that affect multiple future phases. Empty until needed. -->

## Phase 1 — CLAUDE.md index + Next 16 docs grounding

- Preconditions:
  - `CLAUDE.md` (at repo root) exists and contains `@AGENTS.md`
  - `AGENTS.md` (at repo root) exists with the Next.js-not-as-you-know-it warning
  - `node_modules/next/dist/docs/` directory exists
  - `docs/project/requirements.md` exists
- Postconditions:
  - Root `CLAUDE.md` opens with a "Source of truth" section that hard-links to `docs/project/requirements.md` and instructs every future session to read it first
  - `CLAUDE.md` preserves the `@AGENTS.md` include
  - `CLAUDE.md` lists the five required pages, the three workflow streams, and the four persistence entities as a quick-reference index so future sessions can't miss a requirement
  - At least one Next 16 doc file in `node_modules/next/dist/docs/` (app-router, server-actions, or similar) has been read and any notable changes-from-training-data jotted into `CLAUDE.md`'s "Next 16 notes" section
- Steps:
  1. `ls node_modules/next/dist/docs/` to inventory available docs
  2. Read the App Router and Server Actions guides (and any deprecation guide present)
  3. Note any breaking changes from typical Next 14/15 conventions
  4. Rewrite `CLAUDE.md` with: (a) "Source of truth" pointing at requirements.md absolute path, (b) project quick-reference (pages / streams / entities / statuses), (c) "Next 16 notes" with anything that diverges from training data, (d) preserved `@AGENTS.md` include at bottom
- Verification:
  - `grep -q "requirements.md" CLAUDE.md` passes
  - `grep -q "@AGENTS.md" CLAUDE.md` passes
  - `grep -E "FinanceOps|CampaignOps|GuestOps" CLAUDE.md` finds all three
  - `grep -E "events|actions|review_queue_items|audit_logs" CLAUDE.md` finds all four entities
- Clarifications:
- Outcome:
  - [2026-05-25T19:08] Phase 1 done. CLAUDE.md rewritten with: (a) "Source of truth" section hard-linking to requirements.md absolute path; (b) quick-reference tables for 5 pages, 4 stream mappings (including Unknown), 5 statuses, 4 persistence entities with key fields; (c) mock-services + simulate_failure rules; (d) 6 mandatory tests; (e) strong-submission signals; (f) Stack list; (g) Next 16 notes capturing async cookies/headers/params/searchParams, `next lint` removed, middleware→proxy, Turbopack default, revalidateTag cacheLife arg, refresh() from next/cache, React 19.2, parallel-routes default.js, private folders `_folder` convention, runtimeConfig removal, images.domains deprecation; (h) project conventions (npm only, paths for workflow/server-actions/supabase/migrations); (i) consult list pointing at mutating-data and version-16 docs.
  - Read source docs: `01-app/01-getting-started/07-mutating-data.md`, `01-app/01-getting-started/02-project-structure.md`, `01-app/02-guides/upgrading/version-16.md`.
  - All 4 postcondition grep checks pass: `requirements.md` referenced (2 times — Source of truth + Files to consult), `@AGENTS.md` include preserved (1 time at bottom), all three streams present, all four entity rows present.

## Phase 2 — Install dependencies + Supabase agent skill

- Preconditions:
  - Phase 1 postconditions hold
  - `package.json` exists with Next 16.2.6, React 19.2.4, shadcn 4.8.0, Tailwind 4, TypeScript 5
  - `npm` available in PATH
- Postconditions:
  - `@supabase/supabase-js` and `@supabase/ssr` present in `dependencies` at latest stable
  - `zod` present in `dependencies` at latest stable
  - `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` present in `devDependencies` at latest stable
  - `supabase` CLI available as a devDependency (so `npx supabase ...` works without a global install)
  - Supabase agent skill installed at the project scope (under `.claude/skills/` for the exercise project, NOT global), via `npx skills add supabase/agent-skills`
  - `npm install` completes with no error and no deprecated-package warning for any newly-added package
- Steps:
  1. `npm i @supabase/supabase-js @supabase/ssr zod`
  2. `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom supabase`
  3. From the repo root, run `npx skills add supabase/agent-skills` — install at project scope only (not global). If the command prompts for global vs project, choose project.
  4. Verify `package.json` shows all expected packages
  5. Skim `npm install` output for deprecation warnings on the newly-added set; if any, swap to a non-deprecated alternative
- Verification:
  - `node -e "const p=require('./package.json'); ['@supabase/supabase-js','@supabase/ssr','zod'].forEach(k=>{if(!p.dependencies[k])throw new Error('missing '+k)})"` passes
  - `node -e "const p=require('./package.json'); ['vitest','@vitejs/plugin-react','jsdom','@testing-library/react','@testing-library/jest-dom','supabase'].forEach(k=>{if(!p.devDependencies[k])throw new Error('missing '+k)})"` passes
  - `ls .claude/skills/` shows the Supabase agent skill folder (or wherever `npx skills add` lands it)
  - `npx supabase --version` prints a version
- Clarifications:
  - [2026-05-25T19:18] Q: `current_phase` counter was off-by-one after Phase 1 (showed 1 instead of 2). → A: Convention adopted: `current_phase` = "phase currently in progress or about to execute next." After completing Phase N, set to N+1. Corrected on Phase 2 finalization (bumped 1 → 3).
- Outcome:
  - [2026-05-25T19:18] Phase 2 done. Runtime deps installed: `@supabase/supabase-js ^2.106.2`, `@supabase/ssr ^0.10.3`, `zod ^4.4.3`. DevDeps installed: `vitest ^4.1.7`, `@vitejs/plugin-react ^6.0.2`, `jsdom ^29.1.1`, `@testing-library/react ^16.3.2`, `@testing-library/jest-dom ^6.9.1`, `supabase ^2.101.0` (CLI).
  - Supabase agent skills installed at project scope via `npx skills add supabase/agent-skills -y --all`: two skills landed — `supabase` (main) and `supabase-postgres-best-practices` — at `.agents/skills/`, symlinked into `.claude/skills/`. Universal install also reached Amp, Antigravity, Cline, Codex, Cursor and 10 more agents in the same install.
  - No `npm WARN deprecated` lines emitted for any of the target packages. EBADENGINE noise is environmental (Node 21.4.0 between LTS) and does NOT affect any of the newly-added direct deps; it appears on transitive packages that pin Node 18/20/22+. `npm audit` reports 2 moderate-severity vulnerabilities post-install — captured here for the final code-reviewer phase to evaluate; nothing to address mid-scaffold.
  - All postcondition checks pass: package.json contains all required keys; `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/` exist; `npx supabase --version` returns `2.101.0`.

## Phase 3 — Supabase client wiring + env + schema migration

- Post-phase agents: database-reviewer
- Preconditions:
  - Phase 2 postconditions hold
  - `@supabase/supabase-js` and `@supabase/ssr` installed
  - `supabase` CLI available via `npx supabase`
- Postconditions:
  - `src/lib/supabase/client.ts` exports a browser client built with `createBrowserClient` from `@supabase/ssr`
  - `src/lib/supabase/server.ts` exports server helpers (`createServerClient` with cookies adapter) compatible with Next 16 server actions and route handlers
  - `.env.local` exists at project root with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` populated
  - `.env.local` is in `.gitignore`
  - `.env.example` exists with placeholder values and a comment explaining each var
  - `supabase/config.toml` exists (created by `supabase init` or `supabase link`)
  - `supabase/migrations/<timestamp>_init.sql` exists with `CREATE TABLE` statements for `events`, `actions`, `review_queue_items`, `audit_logs` matching spec §7 fields, plus `UNIQUE` constraint on `events.source_event_id` for idempotency, plus appropriate foreign keys (`actions.event_id`, `review_queue_items.event_id`, `audit_logs.event_id`)
  - Migration includes a `status` CHECK constraint covering `received | processing | completed | review_required | failed`
  - Migration has been applied to the hosted Supabase project (`supabase db push` succeeded), verified by listing tables in Studio or via CLI
  - `database-reviewer` agent has reviewed the migration and any CRITICAL/HIGH findings are addressed (per the addressed rule in `how_phase_agents_work`)
- Steps:
  1. `mkdir -p src/lib/supabase supabase/migrations`
  2. Read latest `@supabase/ssr` docs (via `npx supabase --help` and the agent skill's docs) to confirm Next 16 cookie API shape
  3. Write `src/lib/supabase/client.ts` — browser client
  4. Write `src/lib/supabase/server.ts` — server client with cookies adapter compatible with Next 16's async `cookies()` API
  5. Create `.env.local` with the user-provided URL and publishable key
  6. Verify `.gitignore` covers `.env.local` (Next scaffold should already; add if missing)
  7. Create `.env.example` with placeholder values
  8. `npx supabase init` (if `supabase/` not present already; idempotent)
  9. `npx supabase link --project-ref fiigztjfkvlgetyiiauj` — interactive: user provides access token + DB password
  10. `npx supabase migration new init` — scaffolds timestamped migration file
  11. Write SQL for the four tables matching spec §7, with UNIQUE(source_event_id), CHECK constraint on status, FKs, `created_at`/`updated_at` with `now()` defaults, JSONB for `payload` and `metadata`
  12. `npx supabase db push` — apply to hosted project
  13. Verify tables exist via `npx supabase db diff` (should be empty after push) or by querying via the Supabase MCP if available
  14. Dispatch `database-reviewer` agent on the migration file with the spec §7 entity table as context
  15. Address any CRITICAL/HIGH findings; capture LOW/MEDIUM in this phase's Clarifications
- Verification:
  - `test -f src/lib/supabase/client.ts && test -f src/lib/supabase/server.ts`
  - `test -f .env.local && grep -q NEXT_PUBLIC_SUPABASE_URL .env.local`
  - `test -f .env.example && grep -q NEXT_PUBLIC_SUPABASE_URL .env.example`
  - `grep -q "^\.env\.local$" .gitignore || grep -q "\.env\*\.local" .gitignore`
  - `test -f supabase/config.toml`
  - `ls supabase/migrations/*_init.sql | wc -l` equals 1
  - `grep -c "CREATE TABLE" supabase/migrations/*_init.sql` equals 4
  - `grep -q "UNIQUE.*source_event_id" supabase/migrations/*_init.sql`
  - `npx supabase db diff` returns empty (no drift between local migrations and remote)
  - `database-reviewer` outcome captured in this phase's Outcome bullets
- Clarifications:
  - [2026-05-25T19:25] Q: How to apply the migration given the user wired the Supabase MCP after the plan was written? → A: Use MCP `apply_migration` this session (fastest, no shell auth needed); document the CLI flow (`supabase login` + `supabase link --project-ref ...` + `supabase db push`) in the README (Phase 7) as the canonical reproducible workflow for anyone cloning the repo. Best-practice rule confirmed: the migration FILE in `supabase/migrations/` is the source of truth; the apply mechanism is incidental.
  - [2026-05-25T19:25] Q: Local file timestamp drifted from the MCP-applied version (`20260525161014` vs `20260525161555`). → A: Renamed local file to match remote so `supabase db push` is a no-op for any future clone. Migration history table on the remote shows version `20260525161555`.
- Outcome:
  - [2026-05-25T19:25] Phase 3 done. Supabase clients wired: `src/lib/supabase/client.ts` (browser via `createBrowserClient`), `src/lib/supabase/server.ts` (SSR via `createServerClient` with the `cookies: { getAll, setAll }` adapter compatible with Next 16's async `cookies()` API). `.env.local` populated with the hosted project URL + publishable key, gitignored via existing `.env*` pattern. `.env.example` committed with placeholder values and a comment explaining each var.
  - `supabase init` scaffolded `supabase/config.toml`. Migration created via `supabase migration new init`, then renamed to `supabase/migrations/20260525161555_init.sql` to match the remote version after apply. SQL covers all four entities per spec §7: `events` (with `UNIQUE(source_event_id)` for idempotency, CHECK on status + source enums, `updated_at` trigger), `actions` (FK + CHECK on status), `review_queue_items` (FK + CHECK on status, `resolution_notes` + `resolved_at` for the review flow), `audit_logs` (FK, JSONB metadata). FK columns explicitly indexed (postgres does not auto-index FKs). RLS enabled on all four tables with permissive `to anon, authenticated using (true) with check (true)` policies — deliberate per spec §13 (auth out of scope); rationale documented inline in the migration.
  - Applied to hosted Supabase project `fiigztjfkvlgetyiiauj` via `mcp__supabase__apply_migration`. Verified via `mcp__supabase__list_tables`: all 4 tables exist with `rls_enabled: true`, correct columns, correct CHECK constraints, and all three FKs to `events.id` registered. `mcp__supabase__list_migrations` confirms migration `20260525161555_init` recorded.
  - Supabase advisors run. SECURITY: 4× WARN "RLS Policy Always True" (one per table) — accepted as deliberate per the auth-out-of-scope constraint, rationale documented in migration comments. PERFORMANCE: 9× INFO "Unused Index" — empty tables with no query history; will self-resolve once data lands.
  - `database-reviewer` agent report (verbatim summary): Engine PostgreSQL; 0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW. Verdict: **OK-TO-COMMIT-WITH-FOLLOWUPS** — "Schema is spec-complete. All four tables present with correct fields, types, and FK structure. Clear to proceed." MEDIUM #1: `events_created_at_idx` / `audit_logs_created_at_idx` `DESC` annotation is cargo-cult on single-column btree (planner traverses bidirectionally) — cosmetic, no action. MEDIUM #2: Optional composite `(status, created_at DESC)` on `review_queue_items` would eliminate sort step at scale — deferred (one-day exercise won't hit that scale). LOW: `actions_status_idx` likely unused (actions always queried via `event_id`); `set_updated_at` only on `events` (correct, others have no `updated_at`); `audit_logs.metadata` NOT NULL is properly enforced via the default. RLS posture: "Acceptable as-is. The advisor warning is a false positive for a no-auth exercise. RLS enabled + permissive policy is strictly better than RLS disabled because future auth addition only requires adding a policy."

## Phase 4 — shadcn init + dashboard-01 block + sidebar nav rewire

- Preconditions:
  - Phase 1 postconditions hold (Next 16 docs grounded)
  - `shadcn` available in devDependencies (already from initial scaffold)
- Postconditions:
  - `components.json` exists at project root with current shadcn 4.x configuration
  - `src/components/ui/` populated with the primitives required by `dashboard-01` (button, card, sidebar, sheet, separator, badge, table, dropdown-menu, avatar, breadcrumb, tooltip, etc. — whatever the block pulls in)
  - `dashboard-01` block files exist under `src/components/` and `src/app/` per shadcn's install layout for v4
  - All mock/demo data in the block (chart data, sample rows, user names, fake stats) replaced with `[]` arrays or `null` and a `// TODO: wire to Supabase` comment so the next implement can plug in real queries
  - Sidebar nav rewired to the four top-level routes: `/` (Dashboard), `/inbox` (Event Inbox), `/simulator` (Event Simulator), `/review` (Human Review Queue). Event Detail is not a top-level nav item; it's reached from the Inbox.
  - Sidebar nav labels and icons (using `lucide-react`) match the operations domain — e.g. Inbox icon, Play/Beaker icon for Simulator, Flag/Alert icon for Review
  - Dashboard page (`src/app/page.tsx`) renders the block layout cleanly with no console errors and no demo content
- Steps:
  1. Read latest shadcn v4 docs (via the shadcn MCP if available, else `npx shadcn@latest --help` and the shadcn website's v4 section) to confirm the Tailwind 4 + Next 16 setup steps
  2. `npx shadcn@latest init` if `components.json` doesn't exist; accept defaults compatible with Tailwind 4 (no separate tailwind.config — Tailwind 4 uses CSS-only config)
  3. `npx shadcn@latest add dashboard-01` — installs block + all transitive components
  4. Inventory every file the block created — `git status` after the install
  5. Walk each file and identify mock data sources (constant arrays of users, charts data files, demo stats)
  6. Replace each mock data source with an empty fallback + `// TODO: wire to Supabase events query` (or equivalent comment naming the real source)
  7. Rewrite the sidebar nav array to the four routes with operations-themed labels and icons
  8. `npm run dev` (background) and visually confirm the dashboard loads with no errors and no demo content
- Verification:
  - `test -f components.json`
  - `ls src/components/ui/*.tsx | wc -l` is > 5
  - `grep -rE "(Acme|Lorem|demo|fake|mock data)" src/components/ src/app/ | wc -l` returns 0 (or only matches in comments saying "no mock data")
  - `grep -E "(\"/inbox\"|\"/simulator\"|\"/review\")" src/components/` finds all three new nav links
  - `npm run build` succeeds
- Clarifications:
  - [2026-05-25T19:35] Q: User added `design.md` mid-flight (cmonkeytribe-derived design system: teal/orange brand, cream surface, Helvetica, specific status chip palette, near-flat shadows). Apply in Phase 4 or defer to next implement? → A: Apply CORE color tokens + font family in Phase 4 (`globals.css` overrides shadcn defaults to map onto the brand pair, swap Geist for Helvetica/Arial system stack). Defer status chip components, audit-timeline trunk, table specifications, and per-page typography hierarchy to next implement when actual pages get built — those need real markup, not just tokens. Documented in design.md §5 (status chips) as "applied per-component when actual pages are built."
  - [2026-05-25T19:35] Q: dashboard-01 block put dashboard at `/dashboard/page.tsx`; spec wants `/`. → A: Moved content to `/page.tsx`, deleted `/dashboard/` folder, hoisted the shell (`SidebarProvider` + `AppSidebar` + `SiteHeader` + `TooltipProvider`) into `src/app/layout.tsx` so all five required routes share it without duplication.
  - [2026-05-25T19:35] Q: data-table.tsx and data.json kept or dropped? → A: Dropped. The block's table was tightly coupled to the demo schema with heavy zod validation. `/inbox` (Phase 5 placeholder; built in next implement) will use a simpler table built from scratch against the real `events` shape. Less dead code in the scaffold.
- Outcome:
  - [2026-05-25T19:35] Phase 4 done. `npx shadcn@latest init -d -y` (Next + Tailwind 4 detected, neutral base, CSS variables) created `components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`. `npx shadcn@latest add @shadcn/dashboard-01 -y` landed 22 UI primitives (button, card, sidebar, sheet, table, dropdown-menu, tooltip, breadcrumb, badge, etc.) + 9 dashboard composites (app-sidebar, chart-area-interactive, data-table, nav-main/secondary/documents/user, section-cards, site-header) + `src/app/dashboard/page.tsx` + demo `data.json`.
  - Demo content stripped. `data-table.tsx`, `data.json`, and `nav-documents.tsx` deleted (block-specific, not on spec). `app-sidebar.tsx` rewired: brand mark "Operations CC", nav items `/` (Dashboard, LayoutDashboardIcon), `/inbox` (Event Inbox, InboxIcon), `/simulator` (Simulator, BeakerIcon), `/review` (Review Queue, FlagIcon); navClouds + documents removed; navSecondary trimmed to a single Help link; user placeholder "Operator". `section-cards.tsx` rewired to 4 zero-value metric cards (Total events / Completed / Needs review / Failed) with `// TODO: wire to Supabase events query` and a sketch of the real server-component shape. `chart-area-interactive.tsx` replaced with a "Recent activity" empty-state card (the 90-day mock chart was off-spec; recent-activity list is the actual §3 requirement). `site-header.tsx` title changed from "Documents" to "Dashboard".
  - Layout restructured: `src/app/layout.tsx` now hosts `TooltipProvider` + `SidebarProvider` + `AppSidebar` + `SidebarInset` + `SiteHeader` shell so every route inherits it. Geist font dropped per design.md (Helvetica/Arial system stack only). `src/app/page.tsx` rewritten to just compose `SectionCards` + `ChartAreaInteractive`. Old Next-scaffold boilerplate gone. `src/app/dashboard/` folder deleted.
  - Design tokens applied to `globals.css`: `--background` cream `#FDFBF7`, `--foreground` ink `#2E2A39`, `--primary` brand-teal `#12536B`, `--accent` brand-orange `#ED5338`, `--card`/`--popover` white, `--border` `#BFBFBF`, `--ring` brand-teal (focus ring per design), sidebar tokens mapped to white surface with teal-on-cream-tint active state, radius scale set to design's 10/11/12/22 px. Dark mode block removed (design.md is single light theme). Body font + letter-spacing (0.6px) applied at the `html` selector. Status chip palette (received/processing/completed/review_required/failed) DEFERRED to next implement per design.md §5 — they're per-component, not base tokens.
  - Verification: `npm run build` clean (compiled in 7.4s, TypeScript checked, one route `/` prerendered). `components.json` exists. `ls src/components/ui/*.tsx` returns 22. `grep` confirms all four nav URLs (`/`, `/inbox`, `/simulator`, `/review`) wired and zero matches for demo markers (`Acme Inc`, `Lorem`, `m@example`, `+12.5%`-style fake trend percentages). Build output shows zero `npm WARN deprecated` lines added by this phase.

## Phase 5 — Route scaffolds + workflow architecture skeleton

- Preconditions:
  - Phase 4 postconditions hold (dashboard-01 in place, nav rewired)
- Postconditions:
  - Placeholder route files exist and render under the dashboard layout: `src/app/inbox/page.tsx`, `src/app/events/[id]/page.tsx`, `src/app/simulator/page.tsx`, `src/app/review/page.tsx` — each renders a centered "Coming in next implement" message with the page title and breadcrumb
  - `src/lib/workflow/` exists with: `engine.ts` (stub exporting the engine signature), `types.ts` (TypeScript types for `Event`, `Action`, `ReviewQueueItem`, `AuditLog`, `EventStatus`, `EventSource`), `adapters/README.md` (explains the FinanceOps/CampaignOps/GuestOps adapter contract and that adding a fourth stream means dropping a new file in this folder), `services/README.md` (explains where `mockFinanceService`, `mockCampaignService`, `mockGuestService` live and the `simulate_failure` contract)
  - `src/app/_actions/README.md` exists explaining the server-actions convention for this project (one file per top-level operation: `submitEvent.ts`, `resolveReviewItem.ts`, etc.)
  - All types in `src/lib/workflow/types.ts` are derived from spec §7 entities and §4 statuses, with explicit JSDoc comments linking back to `requirements.md` sections
  - No business logic yet — just type definitions, signatures, README stubs, and "Coming next" placeholders
- Steps:
  1. Create the four placeholder route files. Each is a small Server Component that imports the dashboard layout and renders `<div>Coming in next implement: <title></div>` with a useful breadcrumb
  2. Create `src/lib/workflow/types.ts` with TypeScript types for the four entities + the five-value status union + the source union (`financeops | campaignops | guestops | unknown`) — straight from spec
  3. Create `src/lib/workflow/engine.ts` with stub exports: `processEvent(event: IncomingEvent): Promise<ProcessResult>` and `ProcessResult` type; body throws `Error('not yet implemented — see next /implement plan')`
  4. Create `src/lib/workflow/adapters/README.md` documenting: adapter interface, where each stream's adapter lives, how to add a fourth stream (the strong-submission signal)
  5. Create `src/lib/workflow/services/README.md` documenting mock services + `simulate_failure` flag contract
  6. Create `src/app/_actions/README.md` documenting server-actions location and naming
  7. Run `npx tsc --noEmit` to confirm types compile
- Verification:
  - `test -f src/app/inbox/page.tsx && test -f src/app/events/\[id\]/page.tsx && test -f src/app/simulator/page.tsx && test -f src/app/review/page.tsx`
  - `test -f src/lib/workflow/engine.ts && test -f src/lib/workflow/types.ts`
  - `test -f src/lib/workflow/adapters/README.md && test -f src/lib/workflow/services/README.md && test -f src/app/_actions/README.md`
  - `grep -E "received|processing|completed|review_required|failed" src/lib/workflow/types.ts` finds all five statuses
  - `grep -E "financeops|campaignops|guestops|unknown" src/lib/workflow/types.ts` finds all four sources
  - `npx tsc --noEmit` succeeds
  - `npm run build` succeeds
- Clarifications:
  - [2026-05-25T19:50] Q: Plan said "render with a useful breadcrumb" on placeholder routes; `site-header.tsx` currently shows a hardcoded "Dashboard" title. Build dynamic breadcrumb now or defer? → A: Defer to next implement. Making the breadcrumb route-aware needs `usePathname` in a client component + a route → label map, which is a feature, not a placeholder. Each placeholder page renders its own `<h1>` title + a clear "Coming in next implement" empty-state card. Sufficient for navigability test ("can I click through all 5 routes from the sidebar without errors").
- Outcome:
  - [2026-05-25T19:50] Phase 5 done. Four placeholder route files created under the `SidebarInset` shell from `layout.tsx`: `src/app/inbox/page.tsx`, `src/app/events/[id]/page.tsx` (Server Component using Next 16 async `params` correctly: `const { id } = await params`), `src/app/simulator/page.tsx`, `src/app/review/page.tsx`. Each renders a page-title `<h1>`, a one-line description of what the page will do per spec, and an empty-state card with the specific spec section that scopes it (§3 / §6 / §9).
  - Workflow architecture skeleton created under `src/lib/workflow/`: `types.ts` (TypeScript types for `EventStatus`, `EventSource`, `ActionStatus`, `ReviewStatus`, `IncomingEvent`, `Event`, `Action`, `ReviewQueueItem`, `AuditLog`, `ProcessResult` — all derived from spec §4 and §7, JSDoc references pointing back to those sections); `engine.ts` (stub `processEvent` throws "not yet implemented" with the 6-step contract documented in the function JSDoc — validate, route, run adapter, execute services, persist atomically, honour idempotency); `adapters/README.md` (adapter contract, planned files table for the three streams, and the "adding a fourth stream" recipe that the rubric will probe); `services/README.md` (mock services per spec §8, `simulate_failure` contract documented verbatim, anti-patterns including random failures and silently-swallowed flags).
  - Server-actions skeleton: `src/app/_actions/README.md` documenting the convention (Next 16 private folder so `_actions` is not a route segment, one file per top-level operation, planned files `submitEvent.ts` + `resolveReviewItem.ts`, cache-tag conventions using `updateTag` for read-your-writes + `revalidateTag('tag', 'max')` with the required Next 16 cacheLife profile, zod validation at the boundary, anti-patterns including the load-bearing underscore).
  - Verification: `npx tsc --noEmit` clean (no output, exit 0). `npm run build` clean: all 5 ops routes registered (`/` static, `/inbox` static, `/events/[id]` dynamic, `/simulator` static, `/review` static). All `test -f` checks pass for the 4 route files + 2 lib files + 3 README files. All 5 statuses (`received | processing | completed | review_required | failed`) appear as literals in `types.ts`; all 4 sources (`financeops | campaignops | guestops | unknown`) appear in the `EventSource` union. No business logic landed — pure type definitions, signatures, and READMEs as the plan required.

## Phase 6 — Vitest config + smoke test

- Preconditions:
  - Phase 2 postconditions hold (vitest installed)
- Postconditions:
  - `vitest.config.ts` exists at project root with React + jsdom + path alias matching `tsconfig.json`
  - `tests/smoke.test.ts` (or `src/__tests__/smoke.test.ts` — pick the cleaner convention) exists with one trivial assertion that imports from `src/lib/workflow/types.ts` to verify the path alias works
  - `"test": "vitest run"` and `"test:watch": "vitest"` scripts in `package.json`
  - `npm test` runs and passes with 1 test
- Steps:
  1. Read vitest's current Next 16 / React 19 / Tailwind 4 setup recommendation
  2. Write `vitest.config.ts` with `@vitejs/plugin-react`, `environment: 'jsdom'`, and the `@/*` path alias from `tsconfig.json`
  3. Write `tests/smoke.test.ts` — one assertion using an import from `src/lib/workflow/types.ts` to validate alias + TS compilation
  4. Add `test` and `test:watch` scripts to `package.json`
  5. `npm test` and verify pass
- Verification:
  - `test -f vitest.config.ts`
  - `test -f tests/smoke.test.ts || test -f src/__tests__/smoke.test.ts`
  - `grep -q '"test"' package.json`
  - `npm test` exits 0 with at least 1 test passing
- Clarifications:
  - [2026-05-25T19:55] Q: First `npm test` failed on Node 21.4 with `SyntaxError: 'node:util' does not provide an export named 'styleText'` from rolldown (vitest 4's bundler). `styleText` became stable in Node 21.7. → A: Switched env to Node 24.14.0 via `nvm use 24.14.0` (user choice). Reinstalled deps to pull in the platform-specific `@rolldown/binding-linux-x64-gnu` native module that npm had skipped under 21.4. Added `engines.node: ">=22.12.0"` to `package.json` so any teammate/CI hitting an older Node fails fast with a clear message. Documented in README (Phase 7) that Node 22+ is required.
- Outcome:
  - [2026-05-25T19:55] Phase 6 done. `vitest.config.ts` written at project root using `vitest/config`, `@vitejs/plugin-react`, `environment: 'jsdom'`, `resolve.alias` mapping `@` → `./src` to match `tsconfig.json` paths. `include` covers both `tests/**` and `src/**/*.test.{ts,tsx}` so test files can live alongside source or in a top-level folder.
  - `tests/smoke.test.ts` imports `EventStatus` + `EventSource` from `@/lib/workflow/types` (verifying the path alias resolves end-to-end, not a no-op `expect(true).toBe(true)`), then asserts the literal-string members `'received'` and `'financeops'` satisfy the unions.
  - `package.json` gained `"test": "vitest run"` (CI-style one-shot) and `"test:watch": "vitest"` (interactive). Also added `"engines": { "node": ">=22.12.0" }` per the cross-phase clarification.
  - `npm test` passes: 1 file, 1 test, 1.61s (RUN v4.1.7). `npm run build` still clean under Node 24.14.0 with all 5 ops routes registered.

## Phase 7 — README + final verification

- Post-phase agents: code-reviewer
- Preconditions:
  - Phases 1-6 postconditions all hold
- Postconditions:
  - `README.md` has a "Stack" section naming Next.js 16, React 19, shadcn (v4), Tailwind 4, Supabase + `@supabase/ssr`, zod, vitest
  - `README.md` has a "How to run" section with the exact commands: clone, `npm install`, copy `.env.example` to `.env.local` and fill, `npm run dev`, `npm test`
  - `README.md` has a "Source of truth" section linking to `docs/project/requirements.md`
  - `README.md` has a "Project structure" section listing the workflow engine layout (`src/lib/workflow/`, `src/lib/supabase/`, `src/app/_actions/`)
  - `npm run build` succeeds end-to-end with no warnings related to our code
  - `npm test` succeeds
  - `code-reviewer` agent has reviewed the cumulative diff from main and any CRITICAL/HIGH findings are addressed
- Steps:
  1. Read existing `README.md` (the Next scaffold default)
  2. Rewrite preserving any helpful Next sections, adding: Stack, How to run, Source of truth, Project structure, "Next implement will add" forward-pointer to feature work
  3. Run `npm run build` end-to-end
  4. Run `npm test`
  5. Dispatch `code-reviewer` agent with: scope = full cumulative diff for this plan; context = setup-and-scaffold plan goal (foundation only, no feature logic)
  6. Address CRITICAL/HIGH; log LOW/MEDIUM in this phase's Clarifications
- Verification:
  - `grep -q "How to run" README.md && grep -q "Stack" README.md`
  - `grep -q "requirements.md" README.md`
  - `npm run build` exits 0
  - `npm test` exits 0
  - `code-reviewer` report captured in Outcome
- Clarifications:
  - [2026-05-25T20:00] Q: `code-reviewer` flagged 1 HIGH + 5 MEDIUM findings. Address all or just HIGH? → A: Addressed HIGH plus all MEDIUMs (under 10 minutes' work each, and a take-home submission benefits from a clean diff). HIGH: nav-main sidebar items had no `render` prop so were `<button>` not `<a>` — now use `<Link>` from next/link for prefetching. MEDIUMs: stripped Quick Create + MailIcon demo widget from nav-main.tsx; stripped Account/Billing/Notifications/Log out dropdown from nav-user.tsx (auth out of scope per spec §13); removed hardcoded "Dashboard" h1 from site-header.tsx (each page owns its own h1; dynamic breadcrumb deferred); replaced dangling `--font-geist-mono` reference in globals.css with explicit system mono stack; bumped `@types/node` from ^20 to ^22 to match `engines.node`; uninstalled unused `@dnd-kit/*` + `@tanstack/react-table` (block dependencies whose consumers were already deleted). Kept `recharts` and `src/components/ui/chart.tsx` per reviewer's hedge — one `npx shadcn add chart` away from re-adding if removed. Avatar fallback now derives initials from `user.name` instead of hardcoded "CN".
- Outcome:
  - [2026-05-25T20:00] Phase 7 done. **Plan complete.** `README.md` rewritten with Source of truth (links to docs/project/requirements.md), Stack (Next 16 / React 19 / TS 5 / Tailwind 4 / shadcn v4 / Supabase / zod / vitest, Node `>=22.12.0`), How to run (6 numbered steps: `nvm use`, `npm install`, `cp .env.example .env.local`, supabase login + link + db push, `npm run dev`, `npm test`), Project structure (annotated tree showing the workflow engine layout), What's foundation vs. what's next (explicit list of what this scaffold ships and what next implement will add), Conventions (npm only, server-actions location with the load-bearing underscore, migration apply via `supabase db push`), and Design pointer to design.md. `.nvmrc` committed at `24.14.0`.
  - `code-reviewer` agent report (verbatim summary): 0 CRITICAL, 1 HIGH, 5 MEDIUM, 5 LOW. Verdict initially **FIX-BEFORE-COMMIT**. HIGH (nav-main items not navigating) and all 5 MEDIUMs addressed in-phase. LOWs accepted as-is: `data.user.avatar = ""` + `email = "operator@local"` are scaffold placeholders polished in next implement; `@custom-variant dark` declaration is harmless noise; TODO comments without issue links are standard for solo take-home; site-header.tsx living next to client components is fine convention-wise (any future dynamic breadcrumb will become a Client Component there).
  - Verification re-run after fixes: `npm run build` clean (all 5 ops routes registered + the `/icon.png` static asset from the user's branding edit), `npm test` clean (1 file / 1 test / 2.02s on Node 24.14.0), `grep` confirms README has "How to run", "## Stack", and "requirements.md".
  - Plan flips to `status: done`. Run `/archive setup-and-scaffold` to archive.

## Plan-level verification

- `npm run build` clean
- `npm test` clean (1 smoke test)
- `npx tsc --noEmit` clean
- All four required entities exist as tables in the hosted Supabase project (verified via `supabase db diff` empty or by querying Studio)
- `CLAUDE.md` has the requirements.md index at the top and preserves `@AGENTS.md`
- A fresh `git clone` + `npm install` + `.env.local` fill + `npm run dev` produces a navigable dashboard with the four placeholder routes reachable from the sidebar
- No deprecated packages in `npm install` output for anything we added
- All seven phases' Outcome blocks filled

## Phase outcomes

<!-- Appended as each phase completes. -->
