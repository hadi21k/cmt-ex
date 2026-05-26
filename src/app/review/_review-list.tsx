"use client";

import { StatusChip } from "@/components/status-chip";
import type {
  Action,
  Event,
  EventSource,
  ReviewQueueItem,
} from "@/lib/workflow/types";

// Compact left-column queue. One row per open review item, click to
// select. Designed for an ops operator's scan-and-decide loop —
// source, event_type, age, and the underlying event status are visible
// at a glance.

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
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
              className="group flex w-full flex-col gap-2 rounded-xl bg-white p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12536B]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                border: active
                  ? "1px solid #12536B"
                  : "1px solid rgba(46, 42, 57, 0.1)",
                boxShadow: active
                  ? "0 4px 14px rgba(18, 83, 107, 0.12)"
                  : "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.6px]"
                  style={{ color: "rgba(46, 42, 57, 0.6)" }}
                >
                  {SOURCE_LABEL[event.source]}
                </span>
                <StatusChip status={event.status} />
              </div>
              <p className="truncate font-mono text-[15px] leading-tight text-foreground">
                {event.source_event_id}
              </p>
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="truncate font-mono text-[12px]"
                  style={{ color: "rgba(46, 42, 57, 0.55)" }}
                >
                  {event.event_type}
                </span>
                <span
                  className="shrink-0 text-[12px] tabular-nums"
                  style={{ color: "rgba(46, 42, 57, 0.5)" }}
                >
                  {formatRelative(item.created_at)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function formatRelative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
