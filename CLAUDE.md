# Operations Command Center

## Source of truth

The master spec for this project lives in the repo at:

**`docs/project/requirements.md`**

**Read it before writing any code.** It is a verbatim transcription of the candidate-facing PDF and the contract you are being evaluated against. Do not skip a requirement — the evaluator may test with additional payloads.

Project metadata, goals, constraints, and open questions live in `docs/project/CONTEXT.md`. The build record lives in `docs/implement/`: `workflows-and-pages.md` (feature work) and `setup-and-scaffold.md` (foundation work).

The product-level user stories — the six end-to-end use cases the system must serve, the operator's daily loop, and the code-mapping table — live at `docs/project/user-stories.md`. **Read this before writing any feature code.** It is the why behind every adapter, server action, and UI surface.

The design system for this dashboard (tokens, components, do's and don'ts, extracted from cmonkeytribe.com and retargeted for product register) lives at `docs/project/design.md`. Read it before building any UI.

## Quick reference (do not drift from spec)

### Required pages (5)

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Dashboard | Total / completed / review / failed events + recent activity (real counts, never placeholders) |
| `/inbox` | Event Inbox | List events with source_event_id, stream, type, status, created_at, review flag, filters |
| `/events/[id]` | Event Detail | Original payload, detected stream, generated actions, exec status, review reason, audit timeline |
| `/simulator` | Event Simulator | Sample-event dropdown, JSON editor, submit, result preview, simulate-failure toggle |
| `/review` | Human Review Queue | View original, see reason, approve / reject / edit action, add notes, mark resolved |

### Workflow streams (3) + Unknown

| Stream | Trigger `event_type` | Adapter responsibility |
| --- | --- | --- |
| `financeops` | `invoice.overdue` | Payment reminder + follow-up task; priority `high` if `days_overdue > 14` else `normal` |
| `campaignops` | `client_brief.received` | One task per channel with deadline; optional bonus QA task |
| `guestops` | `reservation.change_requested` | Validate required fields, request change, generate guest message; missing fields → review |
| `unknown` | anything else | Route to review with reason "Unable to determine workflow stream" |

### Statuses (5)

`received` → `processing` → (`completed` | `review_required` | `failed`)

### Persistence entities (4)

| Table | Key fields |
| --- | --- |
| `events` | id, source_event_id (UNIQUE for idempotency), source, event_type, payload (jsonb), status, created_at, updated_at |
| `actions` | id, event_id (FK), type, payload (jsonb), status, created_at |
| `review_queue_items` | id, event_id (FK), reason, status, resolution_notes, created_at, resolved_at |
| `audit_logs` | id, event_id (FK), message, metadata (jsonb), created_at |

### Mock services (3) + failure flag

`mockFinanceService`, `mockCampaignService`, `mockGuestService`. If the event payload contains `"simulate_failure": true`, the relevant service must fail. The failure must be visible in the UI, recorded in `audit_logs`, and must NOT mark the event `completed`.

### Required tests (6)

1. FinanceOps event succeeds
2. CampaignOps event succeeds
3. GuestOps event succeeds
4. Duplicate `source_event_id` does not create duplicate actions
5. Missing required field goes to review
6. Simulated external failure handled correctly

### Strong-submission signals (don't forget)

- State persists across refresh
- Duplicate events do not create duplicate actions
- Code structure makes it easy to add a fourth stream (the rubric will probe this)
- Audit timeline is useful, not decorative
- README explains tradeoffs honestly

## Stack

- **Next.js 16.2.6** (App Router, Turbopack default, server actions)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind 4** (CSS-only config; no `tailwind.config.js`)
- **shadcn/ui v4** (dashboard-01 block as the base layout)
- **Supabase** hosted (`@supabase/supabase-js` + `@supabase/ssr`)
- **Zod** for event payload validation
- **Vitest** + jsdom + @testing-library/react for the 6 mandatory tests

## Next 16 notes (read before touching code)

Next.js 16 has multiple breaking changes from training data. Verify against `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` when in doubt.

- **Async Request APIs.** `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are now `Promise`-returning. ALWAYS `await` them. Pre-15 sync access is fully removed in 16.
  ```ts
  const cookieStore = await cookies()       // not: cookies()
  const { id } = await props.params         // not: props.params.id
  ```
- **`next lint` is removed.** Use the ESLint CLI directly (`npx eslint .`). `next build` no longer runs lint.
- **`middleware.ts` → `proxy.ts`.** The new file convention is `proxy.ts` with a `proxy` export. `edge` runtime is NOT supported in `proxy` (it runs on `nodejs`). We are not adding a proxy/middleware in this project, but if we ever do — use the new name.
- **Turbopack is default.** `next dev` and `next build` use Turbopack with no flag needed. No webpack config in this repo.
- **`revalidateTag` requires a `cacheLife` profile** as a second arg: `revalidateTag('events', 'max')`. For read-your-writes semantics inside a Server Action, use `updateTag('events')` instead.
- **`refresh()` from `next/cache`** refreshes the client router from a Server Action without touching tagged data.
- **`cacheLife` and `cacheTag`** are stable — drop the `unstable_` prefix.
- **React 19.2.** View Transitions, `useEffectEvent`, and `<Activity>` are available. Use cautiously for the audit-timeline UI if it helps.
- **Parallel routes** require explicit `default.js` files (we are not using parallel routes for this exercise).
- **Server Functions / Server Actions.** Async functions marked with `'use server'` (top of file or top of function). Convention for this project: one server action per file under `src/app/_actions/`.
- **Private folders.** `_folder` prefix excludes from routing — use `src/app/_actions/`, NOT `src/app/actions/`.
- **`serverRuntimeConfig` / `publicRuntimeConfig` removed.** Use env vars. Client values must be prefixed `NEXT_PUBLIC_`.
- **`images.domains` deprecated.** Use `images.remotePatterns`.

## Project conventions

- **Package manager:** `npm`. Never `pnpm`, `yarn`, or `bun`.
- **Workflow engine location:** `src/lib/workflow/` — `engine.ts`, `types.ts`, `adapters/`, `services/`. Adding a fourth stream = dropping a file in `adapters/`.
- **Server actions location:** `src/app/_actions/` — one file per top-level operation.
- **Supabase clients:** `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (SSR via `@supabase/ssr`).
- **Migrations:** `supabase/migrations/<timestamp>_<name>.sql`. Apply with `npx supabase db push` against the linked project.
- **Tests:** only the 6 mandatory tests. Don't write more.

## Files to consult before non-trivial work

- `requirements.md` (master spec — link above)
- `design.md` (design system, link in Source of truth section)
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` (Server Actions)
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` (every breaking change)

@AGENTS.md
