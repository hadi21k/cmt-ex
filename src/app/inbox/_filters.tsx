"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { EventSource, EventStatus } from "@/lib/workflow/types";

// Inbox filter chips. Status (5) + Source (4) + review-only toggle.
// State lives in the URL (?status=...&source=...&review=1) so filters
// survive refresh + are shareable. Selecting a chip toggles it off when
// already active.

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
  reviewOnly: boolean;
}

export function InboxFilters({ status, source, reviewOnly }: FiltersProps) {
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

  const anyActive = status || source || reviewOnly;

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

      <FilterGroup label="Quick">
        <Chip
          active={reviewOnly}
          onClick={() => setParam("review", reviewOnly ? null : "1")}
        >
          Review-required only
        </Chip>
        {anyActive ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-[13px] underline underline-offset-2"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            Clear all
          </button>
        ) : null}
      </FilterGroup>
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
        className="text-[12px] uppercase tracking-[0.6px]"
        style={{ color: "rgba(14, 15, 12, 0.55)" }}
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
      className="rounded-full border px-3 py-1 text-[13px] transition-colors hover:bg-[rgba(14,15,12,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={
        active
          ? {
              backgroundColor: "rgba(14, 15, 12, 0.12)",
              borderColor: "#0e0f0c",
              color: "#0e0f0c",
            }
          : {
              backgroundColor: "white",
              borderColor: "rgba(14, 15, 12, 0.2)",
              color: "rgba(14, 15, 12, 0.8)",
            }
      }
    >
      {children}
    </button>
  );
}
