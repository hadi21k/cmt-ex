import Link from "next/link";

import { StatusChip } from "@/components/status-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Event } from "@/lib/workflow/types";

// Recent activity list per spec 3 ("recent activity"). Ten most recent
// events from any stream, newest-first (created_at desc), each row links
// to the event detail page. Header gets a "View all in inbox" link so
// the operator can pivot from the dashboard glance to the full list
// without navigating through the sidebar. Empty state teaches the
// operator how to populate the dashboard (use the simulator) - per
// impeccable product reference: "Empty states that teach the interface,
// not 'nothing here'."

const SOURCE_LABEL: Record<string, string> = {
  financeops: "FinanceOps",
  campaignops: "CampaignOps",
  guestops: "GuestOps",
  unknown: "Unknown",
};

interface RecentActivityProps {
  recent: Event[];
}

export function ChartAreaInteractive({ recent }: RecentActivityProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold tracking-normal">
              Recent activity
            </CardTitle>
            <CardDescription>
              The ten most recent events across all streams.
            </CardDescription>
          </div>
          {recent.length > 0 ? (
            <Link
              href="/inbox"
              className="rounded-md px-2 py-1 text-[13px] font-semibold underline underline-offset-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
              style={{ color: "#0e0f0c" }}
            >
              View all in inbox →
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div
            className="rounded-xl px-6 py-8 text-center text-sm"
            style={{
              backgroundColor: "rgba(14, 15, 12, 0.02)",
              color: "rgba(14, 15, 12, 0.6)",
            }}
          >
            <p className="font-medium" style={{ color: "#0e0f0c" }}>
              No events yet.
            </p>
            <p className="mt-1">
              Drop one in the{" "}
              <Link
                href="/simulator"
                className="underline underline-offset-2"
                style={{ color: "#0e0f0c" }}
              >
                simulator
              </Link>{" "}
              to populate the dashboard.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "rgba(14, 15, 12, 0.1)" }}>
            {recent.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="group -mx-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[rgba(14,15,12,0.04)]"
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-[15px] font-medium"
                      style={{ color: "#0e0f0c" }}
                    >
                      {SOURCE_LABEL[event.source] ?? event.source}
                      <span
                        className="ml-2 font-mono text-[13px]"
                        style={{ color: "rgba(14, 15, 12, 0.6)" }}
                      >
                        {event.event_type}
                      </span>
                    </p>
                    <p
                      className="mt-0.5 truncate font-mono text-[13px]"
                      style={{ color: "rgba(14, 15, 12, 0.6)" }}
                    >
                      {event.source_event_id}
                    </p>
                  </div>
                  <StatusChip status={event.status} />
                  <time
                    className="whitespace-nowrap text-[13px] tabular-nums"
                    style={{ color: "rgba(14, 15, 12, 0.6)" }}
                    dateTime={event.created_at}
                  >
                    {formatRelative(event.created_at)}
                  </time>
                  <span
                    aria-hidden
                    className="w-3 text-[15px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ color: "rgba(14, 15, 12, 0.7)" }}
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
