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

export function ReviewDetail({ item, event, actions, onResolved }: ReviewDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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

  const onSaveNotesOnly = () => {
    if (!notes.trim()) {
      setError("Add a note before saving.");
      return;
    }
    setBusy("add_notes");
    setError(null);
    startTransition(async () => {
      const res = await resolveReviewItem({
        review_item_id: item.id,
        action: "add_notes",
        notes,
      });
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotes("");
      router.refresh();
    });
  };

  const startEditingAction = (action: Action) => {
    setEditingActionId(action.id);
    setEditJson(JSON.stringify(action.payload, null, 2));
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
    });
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: "rgba(14, 15, 12, 0.12)" }}
    >
      <div className="px-6 py-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p
              className="text-[12px] uppercase tracking-[0.6px]"
              style={{ color: "rgba(14, 15, 12, 0.55)" }}
            >
              <span style={{ color: "#0e0f0c" }}>
                {SOURCE_LABEL[event.source]}
              </span>{" "}
              · <span className="font-mono">{event.event_type}</span>
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/events/${event.id}`}
                className="font-mono text-[18px] underline underline-offset-2"
                style={{ color: "#0e0f0c" }}
              >
                {event.source_event_id}
              </Link>
              <span
                className="text-[13px]"
                style={{ color: "rgba(14, 15, 12, 0.55)" }}
              >
                Open in event detail →
              </span>
            </div>
          </div>
          <StatusChip status={event.status} />
        </header>

        <div
          className="mt-5 rounded-xl border px-4 py-3 text-[14px]"
          style={{
            backgroundColor: "rgba(255, 209, 26, 0.08)",
            borderColor: "rgba(255, 209, 26, 0.35)",
            color: "#4a3b1c",
          }}
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.6px]">
            Why this is in review
          </p>
          <p className="mt-1">{item.reason}</p>
        </div>

        <details className="mt-5">
          <summary
            className="cursor-pointer text-[13px] font-medium"
            style={{ color: "rgba(14, 15, 12, 0.75)" }}
          >
            Original payload
          </summary>
          <pre
            className="mt-2 overflow-x-auto rounded-lg p-3 font-mono text-[12px] leading-relaxed"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(14, 15, 12, 0.08)",
              color: "#0e0f0c",
            }}
          >
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </details>

        {actions.length > 0 ? (
          <section className="mt-6 flex flex-col gap-3">
            <p
              className="text-[12px] uppercase tracking-[0.6px]"
              style={{ color: "rgba(14, 15, 12, 0.55)" }}
            >
              Pending actions ({actions.length})
            </p>
            <ul className="flex flex-col gap-2">
              {actions.map((action) => {
                const editing = editingActionId === action.id;
                return (
                  <li
                    key={action.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "rgba(14, 15, 12, 0.1)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className="font-mono text-[14px]"
                        style={{ color: "#0e0f0c" }}
                      >
                        {action.type}
                      </span>
                      {editing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveActionEdit(action.id)}
                            disabled={busy !== null}
                            className="rounded-md border px-3 py-1 text-[13px] transition-colors hover:bg-[rgba(14,15,12,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-55"
                            style={{
                              backgroundColor: "#0e0f0c",
                              borderColor: "#0e0f0c",
                              color: "#ffffff",
                            }}
                          >
                            {busy === `edit-${action.id}` ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActionId(null);
                              setEditError(null);
                            }}
                            className="rounded-md border px-3 py-1 text-[13px] transition-colors hover:bg-[rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            style={{
                              backgroundColor: "white",
                              borderColor: "rgba(14, 15, 12, 0.2)",
                              color: "rgba(14, 15, 12, 0.8)",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingAction(action)}
                          className="rounded px-1 text-[13px] underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55"
                          style={{ color: "rgba(14, 15, 12, 0.7)" }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editing ? (
                      <>
                        <textarea
                          value={editJson}
                          onChange={(e) => setEditJson(e.target.value)}
                          spellCheck={false}
                          className="mt-2 min-h-[120px] w-full resize-y rounded-md border p-2 font-mono text-[12px]"
                          style={{
                            backgroundColor: "#ffffff",
                            borderColor: editError
                              ? "#a7000d"
                              : "rgba(14, 15, 12, 0.18)",
                            color: "#0e0f0c",
                          }}
                        />
                        {editError ? (
                          <p
                            className="mt-1 text-[13px]"
                            style={{ color: "#a7000d" }}
                          >
                            {editError}
                          </p>
                        ) : null}
                      </>
                    ) : Object.keys(action.payload ?? {}).length > 0 ? (
                      <pre
                        className="mt-2 overflow-x-auto font-mono text-[12px] leading-relaxed"
                        style={{ color: "rgba(14, 15, 12, 0.75)" }}
                      >
                        {JSON.stringify(action.payload, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`notes-${item.id}`}
              className="text-[12px] uppercase tracking-[0.6px]"
              style={{ color: "rgba(14, 15, 12, 0.55)" }}
            >
              Operator notes
            </label>
            <span
              className="text-[12px]"
              style={{ color: "rgba(14, 15, 12, 0.55)" }}
            >
              Saved with your decision below.
            </span>
          </div>

          {item.resolution_notes ? (
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: "rgba(14, 15, 12, 0.02)",
                borderColor: "rgba(14, 15, 12, 0.1)",
              }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.6px]"
                style={{ color: "rgba(14, 15, 12, 0.5)" }}
              >
                Already on file
              </p>
              <p
                className="mt-1 text-[14px] whitespace-pre-line"
                style={{ color: "rgba(14, 15, 12, 0.85)" }}
              >
                {item.resolution_notes}
              </p>
            </div>
          ) : null}

          <div
            className="rounded-lg border bg-white"
            style={{ borderColor: "rgba(14, 15, 12, 0.18)" }}
          >
            <textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder={
                item.resolution_notes
                  ? "Add another note. The new note appends to what's already on file."
                  : "Optional. Why are you approving, rejecting, or resolving this?"
              }
              className="w-full resize-y rounded-t-lg p-3 text-[14px] focus:outline-none"
              style={{
                backgroundColor: "transparent",
                color: "#0e0f0c",
              }}
            />
            <div
              className="flex items-center justify-between gap-2 border-t px-3 py-2"
              style={{
                borderColor: "rgba(14, 15, 12, 0.1)",
                backgroundColor: "rgba(14, 15, 12, 0.015)",
              }}
            >
              <span
                className="text-[12px]"
                style={{ color: "rgba(14, 15, 12, 0.6)" }}
              >
                {notes.length > 0
                  ? `${notes.length} character${notes.length === 1 ? "" : "s"} draft`
                  : "Draft. Not saved until you click below."}
              </span>
              <button
                type="button"
                onClick={onSaveNotesOnly}
                disabled={busy !== null || !notes.trim()}
                className="rounded-md px-3 py-1 text-[13px] underline underline-offset-2 transition-colors hover:bg-[rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                style={{ color: "rgba(14, 15, 12, 0.75)" }}
              >
                {busy === "add_notes" ? "Saving…" : "Save without deciding"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <p className="mt-3 text-[13px]" style={{ color: "#a7000d" }}>
            {error}
          </p>
        ) : null}
      </div>

      <footer
        className="flex flex-wrap items-end justify-start gap-2 border-t px-6 py-4"
        style={{
          borderColor: "rgba(14, 15, 12, 0.1)",
          backgroundColor: "rgba(14, 15, 12, 0.015)",
        }}
      >
        <VerbButton
          label={busy === "approve" ? "Approving…" : "Approve"}
          hint="Run the pending actions."
          onClick={onApprove}
          disabled={busy !== null}
          variant="primary"
        />
        <VerbButton
          label={busy === "reject" ? "Rejecting…" : "Reject"}
          hint="Cancel actions. Mark failed."
          onClick={onReject}
          disabled={busy !== null}
          variant="secondary"
        />
        <VerbButton
          label={busy === "mark_resolved" ? "Closing…" : "Mark resolved"}
          hint="I handled this outside."
          onClick={onMarkResolved}
          disabled={busy !== null}
          variant="ghost"
        />
      </footer>
    </section>
  );
}

function VerbButton({
  label,
  hint,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "cta-primary"
      : variant === "secondary"
        ? "cta-secondary"
        : "cta-ghost";
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={onClick} disabled={disabled} className={cls}>
        {label}
      </button>
      <span
        className="px-1 text-[12px]"
        style={{ color: "rgba(14, 15, 12, 0.6)" }}
      >
        {hint}
      </span>
    </div>
  );
}
