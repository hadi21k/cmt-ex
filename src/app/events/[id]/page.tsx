import { notFound } from "next/navigation";

import { AuditTimeline } from "@/components/audit-timeline";
import { StatusChip } from "@/components/status-chip";
import { createClient } from "@/lib/supabase/server";
import type {
  Action,
  ActionStatus,
  AuditLog,
  Event,
  EventSource,
  ReviewQueueItem,
} from "@/lib/workflow/types";

// Event detail per spec §3: original payload, detected stream, generated
// actions + their statuses, review reason if any, audit timeline (newest
// first per decision #6). Next 16 async params.
// Header carries a one-line payload summary per source so a first-time
// reviewer can answer "what is this event about?" without parsing JSON.

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

const SOURCE_LABEL: Record<EventSource, string> = {
  financeops: "FinanceOps",
  campaignops: "CampaignOps",
  guestops: "GuestOps",
  unknown: "Unknown",
};

const ACTION_LABEL: Record<ActionStatus, string> = {
  pending: "Pending",
  executing: "Executing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const ACTION_TONE: Record<
  ActionStatus,
  { backgroundColor: string; color: string; border: string }
> = {
  pending: {
    backgroundColor: "#ffffff",
    color: "#868685",
    border: "rgba(14, 15, 12, 0.10)",
  },
  executing: {
    backgroundColor: "#e8ebe6",
    color: "#0e0f0c",
    border: "rgba(14, 15, 12, 0.15)",
  },
  completed: {
    backgroundColor: "rgba(46, 173, 75, 0.12)",
    color: "#054d28",
    border: "rgba(46, 173, 75, 0.40)",
  },
  failed: {
    backgroundColor: "rgba(208, 50, 56, 0.12)",
    color: "#a7000d",
    border: "rgba(208, 50, 56, 0.40)",
  },
  cancelled: {
    backgroundColor: "rgba(14, 15, 12, 0.06)",
    color: "rgba(14, 15, 12, 0.6)",
    border: "rgba(14, 15, 12, 0.20)",
  },
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const eventRes = await supabase
    .from("events")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (!eventRes.data) {
    notFound();
  }

  const event = eventRes.data as Event;

  const [actionsRes, reviewRes, auditRes] = await Promise.all([
    supabase
      .from("actions")
      .select()
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("review_queue_items")
      .select()
      .eq("event_id", id)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select()
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const actions = (actionsRes.data ?? []) as Action[];
  const reviewItem = (reviewRes.data ?? null) as ReviewQueueItem | null;
  const auditLogs = (auditRes.data ?? []) as AuditLog[];
  const summary = payloadSummary(event);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[32px] leading-tight tracking-tight text-foreground">
              {event.source_event_id}
            </h1>
            <StatusChip status={event.status} />
          </div>
          <p
            className="text-sm leading-5"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            <span className="font-medium" style={{ color: "#0e0f0c" }}>
              {SOURCE_LABEL[event.source]}
            </span>{" "}
            · <span className="font-mono">{event.event_type}</span> · received{" "}
            {formatTime(event.created_at)}
          </p>
          {summary ? (
            <p
              className="max-w-[65ch] text-base font-medium leading-6"
              style={{ color: "#0e0f0c" }}
            >
              {summary}
            </p>
          ) : null}
        </header>

        {reviewItem ? <ReviewReason item={reviewItem} /> : null}

        <SectionPanel title="Original payload">
          <pre
            className="overflow-x-auto rounded-lg p-4 font-mono text-[13px] leading-relaxed"
            style={{
              backgroundColor: "#ffffff",
              color: "#0e0f0c",
              border: "1px solid rgba(14, 15, 12, 0.08)",
            }}
          >
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </SectionPanel>

        <SectionPanel title="Generated actions">
          {actions.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "rgba(14, 15, 12, 0.6)" }}
            >
              No actions generated. The event was routed without producing
              workflow output.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {actions.map((action) => {
                const hasPayload =
                  action.payload && Object.keys(action.payload).length > 0;
                return (
                  <li
                    key={action.id}
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: "white",
                      borderColor: "rgba(14, 15, 12, 0.1)",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        className="font-mono text-[15px]"
                        style={{ color: "#0e0f0c" }}
                      >
                        {action.type}
                      </p>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-0.5 text-[14px] font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: ACTION_TONE[action.status].backgroundColor,
                          color: ACTION_TONE[action.status].color,
                          border: `1px solid ${ACTION_TONE[action.status].border}`,
                        }}
                      >
                        {ACTION_LABEL[action.status]}
                      </span>
                    </div>
                    {hasPayload ? (
                      <details className="group mt-3">
                        <summary
                          className="cursor-pointer text-[13px] font-medium hover:underline"
                          style={{ color: "rgba(14, 15, 12, 0.7)" }}
                        >
                          View payload
                        </summary>
                        <pre
                          className="mt-2 overflow-x-auto font-mono text-[12px] leading-relaxed"
                          style={{ color: "rgba(14, 15, 12, 0.75)" }}
                        >
                          {JSON.stringify(action.payload, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionPanel>

        <SectionPanel title="Audit timeline">
          <AuditTimeline logs={auditLogs} />
        </SectionPanel>
      </div>
    </div>
  );
}

function payloadSummary(event: Event): string | null {
  const payload = event.payload as Record<string, unknown> | null;
  if (!payload) return null;

  const parts: Array<string | number> = [];

  switch (event.event_type) {
    case "invoice.overdue": {
      if (typeof payload.client_name === "string") parts.push(payload.client_name);
      if (typeof payload.invoice_id === "string") parts.push(payload.invoice_id);
      if (
        (typeof payload.amount === "number" || typeof payload.amount === "string") &&
        typeof payload.currency === "string"
      ) {
        parts.push(`${payload.amount} ${payload.currency}`);
      }
      if (typeof payload.days_overdue === "number") {
        parts.push(`${payload.days_overdue}d overdue`);
      }
      break;
    }
    case "client_brief.received": {
      if (typeof payload.brand === "string") parts.push(payload.brand);
      if (typeof payload.campaign_id === "string") parts.push(payload.campaign_id);
      if (Array.isArray(payload.channels) && payload.channels.length > 0) {
        parts.push(payload.channels.join(", "));
      }
      if (typeof payload.deadline === "string") {
        parts.push(`deadline ${payload.deadline}`);
      }
      break;
    }
    case "reservation.change_requested": {
      if (typeof payload.guest_name === "string") parts.push(payload.guest_name);
      if (typeof payload.reservation_id === "string") parts.push(payload.reservation_id);
      if (
        typeof payload.current_check_in === "string" &&
        typeof payload.requested_check_in === "string"
      ) {
        parts.push(`${payload.current_check_in} → ${payload.requested_check_in}`);
      }
      break;
    }
    default:
      return null;
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function ReviewReason({ item }: { item: ReviewQueueItem }) {
  const colors = {
    open: {
      bg: "rgba(255, 209, 26, 0.20)",
      text: "#4a3b1c",
      border: "rgba(255, 209, 26, 0.60)",
    },
    approved: {
      bg: "rgba(46, 173, 75, 0.12)",
      text: "#054d28",
      border: "rgba(46, 173, 75, 0.40)",
    },
    rejected: {
      bg: "rgba(208, 50, 56, 0.12)",
      text: "#a7000d",
      border: "rgba(208, 50, 56, 0.40)",
    },
    resolved: {
      bg: "rgba(14, 15, 12, 0.06)",
      text: "rgba(14, 15, 12, 0.7)",
      border: "rgba(14, 15, 12, 0.20)",
    },
  }[item.status as "open" | "approved" | "rejected" | "resolved"] ?? {
    bg: "rgba(14, 15, 12, 0.06)",
    text: "#0e0f0c",
    border: "rgba(14, 15, 12, 0.20)",
  };

  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <p className="text-[14px] font-semibold leading-5">
        Review status: {item.status}
      </p>
      <p className="mt-1.5 text-base leading-6">{item.reason}</p>
      {item.resolution_notes ? (
        <p className="mt-2 text-sm leading-5 whitespace-pre-line">
          <span className="font-semibold">Notes: </span>
          {item.resolution_notes}
        </p>
      ) : null}
    </div>
  );
}

function SectionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className="text-[18px] font-semibold leading-6"
        style={{ color: "#0e0f0c" }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
