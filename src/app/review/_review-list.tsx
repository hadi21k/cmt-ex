"use client";

import { StatusChip } from "@/components/status-chip";
import type {
  Action,
  Event,
  EventSource,
  ReviewQueueItem,
} from "@/lib/workflow/types";

// Compact left-column queue. One row per open review item, click to
// select. Each card surfaces the review reason inline so the operator
// can triage by reading the queue instead of round-tripping into the
// detail card. The age dot escalates as the item sits longer:
// muted = under 5 min, warning = 5 min to 1 hour, negative = over 1 hour.

const SOURCE_LABEL: Record<EventSource, string> = {
  financeops: "FinanceOps",
  campaignops: "CampaignOps",
  guestops: "GuestOps",
  unknown: "Unknown",
};

export interface ReviewListItem {
  item: ReviewQueueItem;
  event: Event;
  actions: Action[];
}

interface ReviewListProps {
  items: ReviewListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReviewList({ items, selectedId, onSelect }: ReviewListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ item, event }) => {
        const active = item.id === selectedId;
        const ageMs = Date.now() - new Date(item.created_at).getTime();
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
              className="group flex w-full flex-col gap-2 rounded-xl bg-white p-4 text-left transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                border: active
                  ? "1px solid #0e0f0c"
                  : "1px solid rgba(14, 15, 12, 0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <span
                      className="shrink-0 text-[13px] font-semibold leading-5"
                      style={{ color: "#0e0f0c" }}
                    >
                      {SOURCE_LABEL[event.source]}
                    </span>
                    <span
                      className="truncate font-mono text-[12px] leading-5"
                      style={{ color: "rgba(14, 15, 12, 0.6)" }}
                    >
                      · {event.event_type}
                    </span>
                  </div>
                  <span
                    className="truncate font-mono text-[14px] leading-tight"
                    style={{ color: "#0e0f0c" }}
                  >
                    {event.source_event_id}
                  </span>
                </div>
                <StatusChip status={event.status} />
              </div>
              <p
                className="line-clamp-2 text-[13px] leading-[1.45]"
                style={{ color: "rgba(14, 15, 12, 0.75)" }}
              >
                {item.reason}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <AgeDot ageMs={ageMs} />
                <span
                  className="text-[12px] tabular-nums"
                  style={{ color: "rgba(14, 15, 12, 0.55)" }}
                >
                  {formatRelative(ageMs)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AgeDot({ ageMs }: { ageMs: number }) {
  let bg = "rgba(14, 15, 12, 0.25)";
  if (ageMs > 60 * 60 * 1000) bg = "#d03238";
  else if (ageMs > 5 * 60 * 1000) bg = "#ffd11a";
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: bg }}
    />
  );
}

function formatRelative(ageMs: number): string {
  const seconds = Math.round(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
