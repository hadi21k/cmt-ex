import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type {
  Action,
  Event,
  ReviewQueueItem,
} from "@/lib/workflow/types";

import { ReviewShell } from "./_review-shell";
import type { ReviewListItem } from "./_review-list";

// Review queue per spec §6. Server component fetches all open items
// with their events + pending/failed actions in one PostgREST query
// (review_queue_items -> events -> actions, with the actions array
// filtered to pending/failed inside the embed). Then the client shell
// renders the queue-and-detail split view.

interface ReviewRow extends ReviewQueueItem {
  event: (Event & { action_list: Action[] | null }) | null;
}

type ReasonBucket =
  | "missing field"
  | "unknown source"
  | "unsupported event"
  | "service failure";

function bucketReason(reason: string): ReasonBucket {
  if (reason.startsWith("Missing required field")) return "missing field";
  if (reason.startsWith("Unable to determine workflow stream"))
    return "unknown source";
  if (reason.startsWith("Unsupported event_type")) return "unsupported event";
  return "service failure";
}

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("review_queue_items")
    .select(`
      *,
      event:events!event_id(
        *,
        action_list:actions(*)
      )
    `)
    .eq("status", "open")
    .in("event.action_list.status", ["pending", "failed"])
    .order("created_at", { ascending: false });

  const withContext: ReviewListItem[] = ((data ?? []) as ReviewRow[])
    .filter((row): row is ReviewRow & { event: NonNullable<ReviewRow["event"]> } => row.event !== null)
    .map((row) => {
      const { event, ...itemFields } = row;
      const { action_list, ...eventFields } = event;
      // Postgres UPDATEs append a new tuple version at the end of the heap.
      // A SELECT without ORDER BY returns rows in heap-walk order, so an
      // edited action would jump to the bottom of the list on revalidate.
      // Sort by (created_at, id) so the list stays stable across refreshes.
      const actions = ((action_list ?? []) as Action[]).slice().sort((a, b) => {
        const t = (a.created_at ?? "").localeCompare(b.created_at ?? "");
        return t !== 0 ? t : a.id.localeCompare(b.id);
      });
      return {
        item: itemFields as ReviewQueueItem,
        event: eventFields as Event,
        actions,
      };
    });

  const counts = withContext.reduce<Record<ReasonBucket, number>>(
    (acc, { item }) => {
      const bucket = bucketReason(item.reason);
      acc[bucket] = (acc[bucket] ?? 0) + 1;
      return acc;
    },
    {
      "missing field": 0,
      "unknown source": 0,
      "unsupported event": 0,
      "service failure": 0,
    },
  );

  const total = withContext.length;
  const breakdown = (Object.entries(counts) as [ReasonBucket, number][])
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${n} ${label}`)
    .join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-[40px] leading-[1.1] font-black tracking-tight text-foreground">
              Review Queue
            </h1>
            <p
              className="text-sm leading-5"
              style={{ color: "rgba(14, 15, 12, 0.7)" }}
            >
              Events the engine paused on. Approve, reject, or close without acting.
            </p>
          </div>
          {total > 0 ? (
            <div className="flex items-baseline gap-3">
              <span
                className="font-mono tabular-nums text-[28px] leading-none font-semibold"
                style={{ color: "#0e0f0c" }}
              >
                {total}
              </span>
              <span
                className="text-[14px] font-semibold leading-5"
                style={{ color: "rgba(14, 15, 12, 0.7)" }}
              >
                {breakdown}
              </span>
            </div>
          ) : null}
        </header>

        {withContext.length === 0 ? (
          <EmptyState />
        ) : (
          <ReviewShell items={withContext} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl border px-6 py-12 text-center"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "rgba(14, 15, 12, 0.12)",
        color: "rgba(14, 15, 12, 0.65)",
      }}
    >
      <p className="text-[18px] font-semibold" style={{ color: "#0e0f0c" }}>
        Queue is clear.
      </p>
      <p className="mt-2 text-sm leading-5">
        Risky or ambiguous events land here. To populate, send an{" "}
        <Link
          href="/simulator"
          className="underline underline-offset-2"
          style={{ color: "#0e0f0c" }}
        >
          unknown event or one with simulate_failure
        </Link>
        .
      </p>
    </div>
  );
}
