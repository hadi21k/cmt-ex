# Server Actions

Server-side mutations live here as Server Functions (`'use server'` directive). One file per top-level operation. The folder name starts with `_` so Next 16 excludes it from routing (`_actions` is a private folder, not a route segment).

## Planned files (next implement)

| File | What it does | Called from |
| --- | --- | --- |
| `submitEvent.ts` | Hand off an `IncomingEvent` to the workflow engine and return the `ProcessResult` for the simulator UI to render | Simulator form submit |
| `resolveReviewItem.ts` | Approve / reject / edit / add notes / mark resolved on a single review queue item | Review Queue row actions |

Each file:

1. Declares `'use server'` at the top.
2. Exports an async function with a typed signature.
3. Validates inputs at the boundary with zod (this is a system boundary per the security baseline; clients can POST directly to a Server Action).
4. Calls the workflow engine or directly mutates persistence.
5. Calls `revalidateTag(...)` or `refresh()` (Next 16 cache APIs) so the relevant page re-fetches its data.

## Cache tag conventions (next implement)

Tag everything with the entity it affects so we can revalidate precisely:

- `events` - the inbox list
- `event-${id}` - the event detail page for a specific event
- `review-queue` - the open review queue list
- `dashboard` - the four count cards on `/`

`updateTag` is preferred inside Server Actions (read-your-writes); `revalidateTag('events', 'max')` (note the cacheLife profile, required in Next 16) is for "this will refresh eventually" cases.

## Anti-patterns

- **Calling Server Actions from Server Components for read paths.** Use direct Supabase queries in the component; reserve actions for mutations.
- **Returning DB rows without typing them.** Use the entity types in `@/lib/workflow/types`. If a server action returns `any`, it's wrong.
- **Skipping zod validation.** Server Actions are reachable via direct POST - same threat model as a public API endpoint, even when the UI never sends a malformed payload.
- **Folder named `actions` (no underscore prefix).** That becomes a route segment and conflicts with Next routing. The `_` is load-bearing.
