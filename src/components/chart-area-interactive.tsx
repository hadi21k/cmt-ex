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

// Recent activity list per spec §3 ("recent activity"). Ten most recent
// events from any stream, newest-first (created_at desc), each row links
// to the event detail page. Empty state teaches the operator how to
// populate the dashboard (use the simulator) — per impeccable product
// reference: "Empty states that teach the interface, not 'nothing here'."

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
        <CardTitle className="text-lg font-medium tracking-normal">
          Recent activity
        </CardTitle>
        <CardDescription>
          The ten most recent events across all streams.
        </CardDescription>
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
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 transition-colors hover:bg-[rgba(0,0,0,0.02)]"
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
                      className="mt-0.5 truncate text-[13px]"
                      style={{ color: "rgba(14, 15, 12, 0.6)" }}
                    >
                      {event.source_event_id}
                    </p>
                  </div>
                  <StatusChip status={event.status} />
                  <time
                    className="text-[13px] tabular-nums"
                    style={{ color: "rgba(14, 15, 12, 0.6)" }}
                    dateTime={event.created_at}
                  >
                    {formatRelative(event.created_at)}
                  </time>
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
