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
  { backgroundColor: string; color: string }
> = {
  pending: { backgroundColor: "rgba(14, 15, 12, 0.08)", color: "#0e0f0c" },
  executing: { backgroundColor: "rgba(14, 15, 12, 0.12)", color: "#0e0f0c" },
  completed: { backgroundColor: "rgba(46, 173, 75, 0.12)", color: "#054d28" },
  failed: { backgroundColor: "rgba(208, 50, 56, 0.12)", color: "#a7000d" },
  cancelled: {
    backgroundColor: "rgba(14, 15, 12, 0.06)",
    color: "rgba(14, 15, 12, 0.6)",
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-3">
          <p
            className="text-[13px] tracking-[0.5px] uppercase"
            style={{ color: "rgba(14, 15, 12, 0.6)" }}
          >
            Event
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] leading-tight tracking-tight text-foreground">
              <span className="font-mono">{event.source_event_id}</span>
            </h1>
            <StatusChip status={event.status} />
          </div>
          <p className="text-sm" style={{ color: "rgba(14, 15, 12, 0.7)" }}>
            <span style={{ color: "#0e0f0c" }}>
              {SOURCE_LABEL[event.source]}
            </span>{" "}
            · <span className="font-mono">{event.event_type}</span> · received{" "}
            {formatTime(event.created_at)}
          </p>
        </header>

        {reviewItem ? <ReviewReason item={reviewItem} /> : null}

        <SectionPanel title="Original payload" emphasis>
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
              {actions.map((action) => (
                <li
                  key={action.id}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: "white",
                    borderColor: "rgba(14, 15, 12, 0.1)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[15px]" style={{ color: "#0e0f0c" }}>
                      {action.type}
                    </p>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                      style={ACTION_TONE[action.status]}
                    >
                      {ACTION_LABEL[action.status]}
                    </span>
                  </div>
                  {Object.keys(action.payload ?? {}).length > 0 ? (
                    <pre
                      className="mt-3 overflow-x-auto font-mono text-[12px] leading-relaxed"
                      style={{ color: "rgba(14, 15, 12, 0.75)" }}
                    >
                      {JSON.stringify(action.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
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

function ReviewReason({ item }: { item: ReviewQueueItem }) {
  const colors = {
    open: { bg: "rgba(255, 209, 26, 0.10)", text: "#4a3b1c", border: "rgba(255, 209, 26, 0.35)" },
    approved: { bg: "rgba(46, 173, 75, 0.10)", text: "#054d28", border: "rgba(46, 173, 75, 0.35)" },
    rejected: { bg: "rgba(208, 50, 56, 0.10)", text: "#a7000d", border: "rgba(208, 50, 56, 0.35)" },
    resolved: { bg: "rgba(14, 15, 12, 0.06)", text: "rgba(14, 15, 12, 0.7)", border: "rgba(14, 15, 12, 0.2)" },
  }[item.status as "open" | "approved" | "rejected" | "resolved"] ?? {
    bg: "rgba(14, 15, 12, 0.06)",
    text: "#0e0f0c",
    border: "rgba(14, 15, 12, 0.2)",
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
      <p className="text-[13px] font-medium uppercase tracking-[0.5px]">
        Review · {item.status}
      </p>
      <p className="mt-1.5 text-base">{item.reason}</p>
      {item.resolution_notes ? (
        <p className="mt-2 text-sm whitespace-pre-line">
          <span className="font-medium">Notes: </span>
          {item.resolution_notes}
        </p>
      ) : null}
    </div>
  );
}

function SectionPanel({
  title,
  emphasis,
  children,
}: {
  title: string;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className="text-[18px] font-medium"
        style={{ color: emphasis ? "#0e0f0c" : "#0e0f0c" }}
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
