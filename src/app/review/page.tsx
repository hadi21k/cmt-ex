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
// with their events + pending actions, then the client shell renders
// the queue-and-detail split view.

export default async function ReviewPage() {
  const supabase = await createClient();

  const itemsRes = await supabase
    .from("review_queue_items")
    .select()
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const items = (itemsRes.data ?? []) as ReviewQueueItem[];

  const withContext: ReviewListItem[] = [];
  for (const item of items) {
    const [eventRes, actionsRes] = await Promise.all([
      supabase.from("events").select().eq("id", item.event_id).maybeSingle(),
      supabase
        .from("actions")
        .select()
        .eq("event_id", item.event_id)
        .eq("status", "pending"),
    ]);
    if (!eventRes.data) continue;
    withContext.push({
      item,
      event: eventRes.data as Event,
      actions: (actionsRes.data ?? []) as Action[],
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-tight tracking-tight text-foreground">
            Review Queue
          </h1>
          <p
            className="text-sm"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            {withContext.length} open item
            {withContext.length === 1 ? "" : "s"}.
          </p>
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
      <p className="text-[18px] font-medium" style={{ color: "#0e0f0c" }}>
        No open review items.
      </p>
      <p className="mt-2 text-sm">
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
