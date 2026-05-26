"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ReviewDetail } from "./_review-detail";
import { ReviewList, type ReviewListItem } from "./_review-list";

// Queue-plus-detail split view. The list on the left stays sticky on
// desktop so the operator never loses sight of the next item to decide
// on. Selection state is local to the client; on a successful action,
// pre-select the next item and refresh - the router re-fetches and
// the resolved item drops out of the list, but the next item is
// already selected so the operator stays in flow.

interface ReviewShellProps {
  items: ReviewListItem[];
}

export function ReviewShell({ items }: ReviewShellProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.item.id ?? null,
  );

  // Keep selection valid as the items list changes (after a resolve).
  useEffect(() => {
    if (selectedId && items.some((i) => i.item.id === selectedId)) return;
    setSelectedId(items[0]?.item.id ?? null);
  }, [items, selectedId]);

  if (items.length === 0) return null;

  const selectedIndex = items.findIndex((i) => i.item.id === selectedId);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const nextItem =
    items[selectedIndex + 1] ?? items[selectedIndex - 1] ?? null;

  const onResolved = () => {
    setSelectedId(nextItem && nextItem.item.id !== selected?.item.id ? nextItem.item.id : null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
        <ReviewList items={items} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>
      <div>
        {selected ? (
          <ReviewDetail
            key={selected.item.id}
            item={selected.item}
            event={selected.event}
            actions={selected.actions}
            onResolved={onResolved}
          />
        ) : (
          <NoSelectionState />
        )}
      </div>
    </div>
  );
}

function NoSelectionState() {
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
        Pick a review item from the queue.
      </p>
    </div>
  );
}
