"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resolveReviewItem } from "@/app/_actions/resolveReviewItem";
import { StatusChip } from "@/components/status-chip";
import type {
  Action,
  Event,
  EventSource,
  ReviewQueueItem,
} from "@/lib/workflow/types";

const SOURCE_LABEL: Record<EventSource, string> = {
  financeops: "FinanceOps",
  campaignops: "CampaignOps",
  guestops: "GuestOps",
  unknown: "Unknown",
};

interface ReviewDetailProps {
  item: ReviewQueueItem;
  event: Event;
  actions: Action[];
  onResolved: () => void;
}

export function ReviewDetail({
  item,
  event,
  actions,
  onResolved,
}: ReviewDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const editing = editingActionId !== null;
  const hasActions = actions.length > 0;

  const decide = (label: string, body: unknown) => {
    setBusy(label);
    setError(null);
    startTransition(async () => {
      const res = await resolveReviewItem(body);
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onResolved();
    });
  };

  const onApprove = () =>
    decide("approve", { review_item_id: item.id, action: "approve" });

  const onReject = () =>
    decide("reject", {
      review_item_id: item.id,
      action: "reject",
      ...(notes ? { notes } : {}),
    });

  const onMarkResolved = () =>
    decide("mark_resolved", {
      review_item_id: item.id,
      action: "mark_resolved",
      ...(notes ? { notes } : {}),
    });

  const startEditingAction = (action: Action) => {
    setEditingActionId(action.id);
    setEditJson(JSON.stringify(action.payload, null, 2));
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingActionId(null);
    setEditError(null);
  };

  const saveActionEdit = (actionId: string) => {
    let parsed: Record<string, unknown>;
    try {
      const raw = JSON.parse(editJson);
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new Error("Action payload must be a JSON object");
      }
      parsed = raw as Record<string, unknown>;
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Invalid JSON");
      return;
    }
    setEditError(null);
    setBusy(`edit-${actionId}`);
    startTransition(async () => {
      const res = await resolveReviewItem({
        review_item_id: item.id,
        action: "edit_action",
        action_id: actionId,
        payload: parsed,
      });
      setBusy(null);
      if (!res.ok) {
        setEditError(res.error);
        return;
      }
      setEditingActionId(null);
      router.refresh();
    });
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: "rgba(14, 15, 12, 0.12)" }}
    >
      {/* Header band */}
      <header
        className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5"
        style={{ borderColor: "rgba(14, 15, 12, 0.10)" }}
      >
        <div className="flex flex-col gap-1">
          <p
            className="text-[13px] leading-5"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            <span className="font-semibold" style={{ color: "#0e0f0c" }}>
              {SOURCE_LABEL[event.source]}
            </span>{" "}
            · <span className="font-mono">{event.event_type}</span>
          </p>
          <Link
            href={`/events/${event.id}`}
            className="font-mono text-[20px] leading-tight underline underline-offset-2"
            style={{ color: "#0e0f0c" }}
          >
            {event.source_event_id}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <details className="group relative">
            <summary
              className="cursor-pointer list-none rounded-md px-2 py-1 text-[13px] underline underline-offset-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
              style={{ color: "rgba(14, 15, 12, 0.7)" }}
            >
              View raw payload
            </summary>
            <pre
              className="absolute right-0 z-10 mt-2 max-h-[60vh] w-[min(560px,90vw)] overflow-auto rounded-lg p-3 font-mono text-[12px] leading-relaxed shadow-[0_8px_24px_rgba(14,15,12,0.12)]"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(14, 15, 12, 0.15)",
                color: "#0e0f0c",
              }}
            >
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </details>
          <StatusChip status={event.status} />
        </div>
      </header>

      <div className="flex flex-col gap-5 px-6 py-6">
        {/* Reason banner. Palette tracks the event's status: failed events
            use the negative chip family so the banner matches the chip on
            the right; review_required (pause-for-human cases) stay warning. */}
        <ReasonBanner event={event} reason={item.reason} />

        {/* Pending actions cluster, or no-actions empty state */}
        {hasActions ? (
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                className="text-[14px] font-semibold leading-5"
                style={{ color: "#0e0f0c" }}
              >
                Pending actions
              </h2>
              <span
                className="font-mono text-[12px] tabular-nums"
                style={{ color: "rgba(14, 15, 12, 0.55)" }}
              >
                {actions.length}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {actions.map((action) => {
                const isEditing = editingActionId === action.id;
                const hasPayload =
                  action.payload && Object.keys(action.payload).length > 0;
                return (
                  <li
                    key={action.id}
                    className="overflow-hidden rounded-lg transition-colors"
                    style={{
                      backgroundColor: isEditing ? "#e8ebe6" : "#ffffff",
                      border: `1px solid ${
                        isEditing
                          ? "rgba(14, 15, 12, 0.30)"
                          : "rgba(14, 15, 12, 0.12)"
                      }`,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                      <span
                        className="font-mono text-[14px] leading-5"
                        style={{ color: "#0e0f0c" }}
                      >
                        {action.type}
                      </span>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveActionEdit(action.id)}
                            disabled={busy !== null}
                            className="rounded-md px-3 py-1 text-[13px] font-semibold transition-colors hover:bg-[#cdffad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 disabled:opacity-55"
                            style={{
                              backgroundColor: "#9fe870",
                              color: "#0e0f0c",
                            }}
                          >
                            {busy === `edit-${action.id}` ? "Saving…" : "Save edit"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md px-3 py-1 text-[13px] transition-colors hover:bg-[rgba(14,15,12,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
                            style={{ color: "rgba(14, 15, 12, 0.75)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingAction(action)}
                          disabled={busy !== null}
                          className="rounded px-2 py-0.5 text-[13px] underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 disabled:opacity-40"
                          style={{ color: "rgba(14, 15, 12, 0.7)" }}
                        >
                          Edit payload
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="px-3 pb-3">
                        <textarea
                          value={editJson}
                          onChange={(e) => setEditJson(e.target.value)}
                          spellCheck={false}
                          autoFocus
                          className="min-h-[140px] w-full resize-y rounded-md p-3 font-mono text-[12px] leading-[1.55] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
                          style={{
                            backgroundColor: "#ffffff",
                            border: `1px solid ${
                              editError ? "#a7000d" : "rgba(14, 15, 12, 0.20)"
                            }`,
                            color: "#0e0f0c",
                          }}
                        />
                        {editError ? (
                          <p
                            className="mt-2 text-[13px]"
                            style={{ color: "#a7000d" }}
                          >
                            {editError}
                          </p>
                        ) : null}
                      </div>
                    ) : hasPayload ? (
                      <details
                        className="border-t"
                        style={{ borderColor: "rgba(14, 15, 12, 0.08)" }}
                      >
                        <summary
                          className="cursor-pointer px-3 py-2 text-[13px] underline underline-offset-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
                          style={{ color: "rgba(14, 15, 12, 0.7)" }}
                        >
                          View payload
                        </summary>
                        <pre
                          className="overflow-x-auto px-3 pb-3 font-mono text-[12px] leading-[1.55]"
                          style={{
                            color: "rgba(14, 15, 12, 0.75)",
                          }}
                        >
                          {JSON.stringify(action.payload, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <NoActionsState />
        )}

        {/* Decide deck: notes + verbs together as one interaction */}
        <section
          className="flex flex-col overflow-hidden rounded-xl"
          style={{ border: "1px solid rgba(14, 15, 12, 0.18)" }}
        >
          <div className="flex flex-col gap-3 px-5 py-4">
            <label
              htmlFor={`notes-${item.id}`}
              className="text-[14px] font-semibold leading-5"
              style={{ color: "#0e0f0c" }}
            >
              Decide
            </label>

            {item.resolution_notes ? (
              <div
                className="rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: "rgba(14, 15, 12, 0.03)",
                  border: "1px solid rgba(14, 15, 12, 0.08)",
                }}
              >
                <p
                  className="text-[12px] font-semibold leading-4"
                  style={{ color: "rgba(14, 15, 12, 0.55)" }}
                >
                  Already on file
                </p>
                <p
                  className="mt-1 text-[14px] leading-5 whitespace-pre-line"
                  style={{ color: "#0e0f0c" }}
                >
                  {item.resolution_notes}
                </p>
              </div>
            ) : null}

            <textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                hasActions
                  ? "Optional notes. Saved with whichever verb you pick below."
                  : "Optional notes. What did you do off-platform? Saved with the verb you pick below."
              }
              className="w-full resize-y rounded-md px-3 py-2 text-[14px] leading-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(14, 15, 12, 0.15)",
                color: "#0e0f0c",
              }}
            />

            {error ? (
              <p
                className="text-[13px] leading-5"
                style={{ color: "#a7000d" }}
              >
                {error}
              </p>
            ) : null}
          </div>

          <div
            className="flex flex-wrap items-center gap-2 border-t px-5 py-4"
            style={{
              borderColor: "rgba(14, 15, 12, 0.10)",
              backgroundColor: "rgba(14, 15, 12, 0.02)",
            }}
          >
            {hasActions ? (
              <button
                type="button"
                onClick={onApprove}
                disabled={busy !== null || editing}
                className="cta-primary"
              >
                {busy === "approve" ? "Approving…" : "Approve"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onReject}
              disabled={busy !== null || editing}
              className="cta-ghost"
            >
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button
              type="button"
              onClick={onMarkResolved}
              disabled={busy !== null || editing}
              className="cta-secondary"
            >
              {busy === "mark_resolved" ? "Closing…" : "Mark resolved"}
            </button>
            {editing ? (
              <span
                className="ml-auto text-[12px]"
                style={{ color: "rgba(14, 15, 12, 0.6)" }}
              >
                Finish the action edit first.
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function ReasonBanner({ event, reason }: { event: Event; reason: string }) {
  const isFailed = event.status === "failed";
  const palette = isFailed
    ? {
        bg: "rgba(208, 50, 56, 0.12)",
        border: "rgba(208, 50, 56, 0.40)",
        text: "#a7000d",
      }
    : {
        bg: "rgba(255, 209, 26, 0.20)",
        border: "rgba(255, 209, 26, 0.60)",
        text: "#4a3b1c",
      };
  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      <p className="text-[14px] font-semibold leading-5">
        Why this is here
      </p>
      <p className="mt-1.5 text-[17px] leading-[1.4] font-medium">{reason}</p>
    </div>
  );
}

function NoActionsState() {
  return (
    <section
      className="flex flex-col gap-2 rounded-xl px-5 py-4"
      style={{
        backgroundColor: "#e8ebe6",
        border: "1px solid rgba(14, 15, 12, 0.12)",
      }}
    >
      <h2
        className="text-[14px] font-semibold leading-5"
        style={{ color: "#0e0f0c" }}
      >
        No generated actions
      </h2>
      <p
        className="text-[14px] leading-5"
        style={{ color: "rgba(14, 15, 12, 0.75)" }}
      >
        The engine couldn&apos;t safely derive actions for this event. Your options are
        Reject (close as failed) or Mark resolved (you handled it off-platform).
      </p>
    </section>
  );
}
