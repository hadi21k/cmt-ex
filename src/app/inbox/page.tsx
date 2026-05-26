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

// Inbox per spec §3. Lists events with source_event_id, stream, type,
// status, created_at, review flag, plus filters on status / source /
// review-required (decision #5 in workflows-and-pages clarifications).
// Next 16: searchParams is async.

interface InboxPageProps {
  searchParams: Promise<{
    status?: string;
    source?: string;
    review?: string;
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
  const reviewOnly = params.review === "1";

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select()
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (sourceFilter) query = query.eq("source", sourceFilter);
  if (reviewOnly) query = query.eq("status", "review_required");

  const { data } = await query;
  const events = (data ?? []) as Event[];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-tight tracking-tight text-foreground">
            Event Inbox
          </h1>
          <p
            className="text-sm"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            {events.length} event{events.length === 1 ? "" : "s"}, newest first.
          </p>
        </header>

        <InboxFilters
          status={statusFilter}
          source={sourceFilter}
          reviewOnly={reviewOnly}
        />

        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: "rgba(14, 15, 12, 0.1)" }}
          >
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: "rgba(14, 15, 12, 0.03)" }}>
                  <TableHead
                    className="text-[13px] uppercase tracking-[0.5px]"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    Source event ID
                  </TableHead>
                  <TableHead
                    className="text-[13px] uppercase tracking-[0.5px]"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    Stream
                  </TableHead>
                  <TableHead
                    className="text-[13px] uppercase tracking-[0.5px]"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    Type
                  </TableHead>
                  <TableHead
                    className="text-[13px] uppercase tracking-[0.5px]"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    Status
                  </TableHead>
                  <TableHead
                    className="text-right text-[13px] uppercase tracking-[0.5px]"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.02)]"
                  >
                    <TableCell className="font-mono text-[13px]">
                      <Link
                        href={`/events/${event.id}`}
                        className="block"
                        style={{ color: "#0e0f0c" }}
                      >
                        {event.source_event_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/events/${event.id}`}
                        className="block text-[15px]"
                        style={{ color: "#0e0f0c" }}
                      >
                        {SOURCE_LABEL[event.source]}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/events/${event.id}`}
                        className="block font-mono text-[13px]"
                        style={{ color: "rgba(14, 15, 12, 0.8)" }}
                      >
                        {event.event_type}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/events/${event.id}`} className="block">
                        <StatusChip status={event.status} />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/events/${event.id}`}
                        className="block text-[13px] tabular-nums"
                        style={{ color: "rgba(14, 15, 12, 0.6)" }}
                      >
                        {formatTime(event.created_at)}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-xl px-6 py-10 text-center"
      style={{
        backgroundColor: "rgba(14, 15, 12, 0.02)",
        color: "rgba(14, 15, 12, 0.6)",
      }}
    >
      <p className="text-base font-medium" style={{ color: "#0e0f0c" }}>
        No events match these filters.
      </p>
      <p className="mt-1 text-sm">
        Try clearing filters or submit a sample event in the simulator.
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
