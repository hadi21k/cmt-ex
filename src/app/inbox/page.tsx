import Link from "next/link";

import { StatusChip } from "@/components/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import type { Event, EventSource, EventStatus } from "@/lib/workflow/types";

import { InboxFilters } from "./_filters";

// Inbox per spec 3. Lists events with source_event_id, stream, type,
// status, created_at, plus filters on status / source. The
// "review-required only" toggle is removed: Status:`Needs review` covers
// it. Table collapsed to 3 columns (Event / Status / Created) so the
// primary scan column carries the most information per row. Filters
// live inside the table card as a header band so the whole thing reads
// as one control panel.
// Next 16: searchParams is async.

interface InboxPageProps {
  searchParams: Promise<{
    status?: string;
    source?: string;
  }>;
}

const ALL_STATUSES: EventStatus[] = [
  "received",
  "processing",
  "completed",
  "review_required",
  "failed",
];

const ALL_SOURCES: EventSource[] = [
  "financeops",
  "campaignops",
  "guestops",
  "unknown",
];

const SOURCE_LABEL: Record<EventSource, string> = {
  financeops: "FinanceOps",
  campaignops: "CampaignOps",
  guestops: "GuestOps",
  unknown: "Unknown",
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const statusFilter = ALL_STATUSES.includes(params.status as EventStatus)
    ? (params.status as EventStatus)
    : null;
  const sourceFilter = ALL_SOURCES.includes(params.source as EventSource)
    ? (params.source as EventSource)
    : null;

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select()
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (sourceFilter) query = query.eq("source", sourceFilter);

  const { data } = await query;
  const events = (data ?? []) as Event[];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[40px] leading-[1.1] font-black tracking-tight text-foreground">
            Event Inbox
          </h1>
          <p
            className="text-sm leading-5"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            {events.length} event{events.length === 1 ? "" : "s"}, newest first.
          </p>
        </header>

        <div
          className="overflow-hidden rounded-xl bg-white"
          style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
        >
          <div
            className="px-4 py-4 lg:px-5"
            style={{ borderBottom: "1px solid rgba(14, 15, 12, 0.08)" }}
          >
            <InboxFilters status={statusFilter} source={sourceFilter} />
          </div>

          {events.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                {/* No colored header band here: when the table sits inside a
                    card with a filter row above, the sage header from
                    design.md 5 would double-band the top of the card. The
                    column headers stay white-on-white, separated from the
                    filter band and the data rows by ink-10% hairlines. */}
                <TableRow>
                  <TableHead
                    className="text-[13px] font-semibold"
                    style={{ color: "rgba(14, 15, 12, 0.65)" }}
                  >
                    Event
                  </TableHead>
                  <TableHead
                    className="w-[160px] text-[13px] font-semibold"
                    style={{ color: "rgba(14, 15, 12, 0.65)" }}
                  >
                    Status
                  </TableHead>
                  <TableHead
                    className="w-[200px] text-[13px] font-semibold"
                    style={{ color: "rgba(14, 15, 12, 0.65)" }}
                  >
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="group cursor-pointer transition-colors hover:bg-[rgba(14,15,12,0.04)]"
                  >
                    <TableCell className="py-3">
                      <Link href={`/events/${event.id}`} className="block">
                        <p
                          className="truncate font-mono text-[15px] font-semibold leading-5"
                          style={{ color: "#0e0f0c" }}
                        >
                          {event.source_event_id}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[13px] leading-5"
                          style={{ color: "rgba(14, 15, 12, 0.6)" }}
                        >
                          <span className="font-medium">
                            {SOURCE_LABEL[event.source]}
                          </span>{" "}
                          ·{" "}
                          <span className="font-mono">{event.event_type}</span>
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="w-[160px] py-3 whitespace-nowrap">
                      <Link href={`/events/${event.id}`} className="block">
                        <StatusChip status={event.status} />
                      </Link>
                    </TableCell>
                    <TableCell className="w-[200px] py-3 whitespace-nowrap">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center justify-between gap-2 text-[14px] tabular-nums"
                        style={{ color: "rgba(14, 15, 12, 0.6)" }}
                      >
                        <span>{formatTime(event.created_at)}</span>
                        <span
                          aria-hidden
                          className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          style={{ color: "rgba(14, 15, 12, 0.7)" }}
                        >
                          →
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="px-6 py-12 text-center"
      style={{ color: "rgba(14, 15, 12, 0.65)" }}
    >
      <p className="text-[16px] font-semibold" style={{ color: "#0e0f0c" }}>
        No events match these filters.
      </p>
      <p className="mt-1.5 text-sm leading-5">
        Try clearing filters or{" "}
        <Link
          href="/simulator"
          className="underline underline-offset-2"
          style={{ color: "#0e0f0c" }}
        >
          submit a sample event in the simulator
        </Link>
        .
      </p>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
