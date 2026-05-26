"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { EventSource, EventStatus } from "@/lib/workflow/types";

// Inbox filter chips per design.md §5 (Filter Chips). State lives in
// the URL (?status=...&source=...) so filters survive refresh and are
// shareable. Selecting a chip toggles it off when already active.
// The rectangular ink-polarity treatment is deliberately distinct from
// the pill-shaped semantic-color status chip palette: filters control
// listing, status chips communicate event state. Two affordances, two
// visuals.

const STATUSES: Array<{ value: EventStatus; label: string }> = [
  { value: "received", label: "Received" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "review_required", label: "Needs review" },
  { value: "failed", label: "Failed" },
];

const SOURCES: Array<{ value: EventSource; label: string }> = [
  { value: "financeops", label: "FinanceOps" },
  { value: "campaignops", label: "CampaignOps" },
  { value: "guestops", label: "GuestOps" },
  { value: "unknown", label: "Unknown" },
];

interface FiltersProps {
  status: EventStatus | null;
  source: EventSource | null;
}

export function InboxFilters({ status, source }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) params.delete(key);
      else params.set(key, value);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const anyActive = status || source;

  return (
    <section className="flex flex-col gap-3">
      <FilterGroup label="Status">
        {STATUSES.map((s) => (
          <Chip
            key={s.value}
            active={status === s.value}
            onClick={() =>
              setParam("status", status === s.value ? null : s.value)
            }
          >
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Stream">
        {SOURCES.map((s) => (
          <Chip
            key={s.value}
            active={source === s.value}
            onClick={() =>
              setParam("source", source === s.value ? null : s.value)
            }
          >
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      {anyActive ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="self-start text-[14px] underline underline-offset-2"
          style={{ color: "rgba(14, 15, 12, 0.7)" }}
        >
          Clear all filters
        </button>
      ) : null}
    </section>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="text-[14px] font-semibold leading-5"
        style={{ color: "rgba(14, 15, 12, 0.7)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-md border px-3 py-1 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={
        active
          ? {
              backgroundColor: "#0e0f0c",
              borderColor: "#0e0f0c",
              color: "#ffffff",
            }
          : {
              backgroundColor: "#ffffff",
              borderColor: "rgba(14, 15, 12, 0.15)",
              color: "rgba(14, 15, 12, 0.8)",
            }
      }
    >
      {children}
    </button>
  );
}
