"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { submitEvent, type SubmitEventResult } from "@/app/_actions/submitEvent";
import { StatusChip } from "@/components/status-chip";

// Appendix A sample payloads — exact strings from the candidate spec.
// Picking a sample replaces the editor; the simulate_failure case is
// just sample #6 with the flag already on, so no separate toggle UI.

interface Sample {
  id: string;
  label: string;
  description: string;
  payload: Record<string, unknown>;
}

const SAMPLES: Sample[] = [
  {
    id: "finance-valid",
    label: "FinanceOps · overdue invoice",
    description: "Acme Trading, 17 days overdue → priority high",
    payload: {
      source_event_id: "finance-001",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-9281",
        customer_name: "Acme Trading",
        amount: 4200,
        currency: "USD",
        days_overdue: 17,
      },
    },
  },
  {
    id: "campaign-valid",
    label: "CampaignOps · client brief",
    description: "Luna Cafe Ramadan offer, three channels + QA task",
    payload: {
      source_event_id: "campaign-001",
      source: "campaignops",
      event_type: "client_brief.received",
      payload: {
        client: "Luna Cafe",
        campaign_goal: "Launch Ramadan catering offer",
        channels: ["instagram", "email", "landing_page"],
        deadline: "2026-06-10",
      },
    },
  },
  {
    id: "guest-valid",
    label: "GuestOps · reservation change",
    description: "Maya Haddad moves check-in 2 days later",
    payload: {
      source_event_id: "guest-001",
      source: "guestops",
      event_type: "reservation.change_requested",
      payload: {
        reservation_id: "RES-7729",
        guest_name: "Maya Haddad",
        current_check_in: "2026-06-04",
        requested_check_in: "2026-06-06",
        nights: 3,
      },
    },
  },
  {
    id: "ambiguous",
    label: "Unknown · ambiguous text",
    description: "Free-text message, unknown source → review",
    payload: {
      source_event_id: "unknown-001",
      source: "unknown",
      event_type: "message.received",
      payload: {
        text: "Please move this to next Friday and tell the client it is confirmed.",
      },
    },
  },
  {
    id: "missing-field",
    label: "FinanceOps · missing field",
    description: "Same shape as #1 but invoice_id is missing → review",
    payload: {
      source_event_id: "finance-002",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        customer_name: "Acme Trading",
        amount: 4200,
        currency: "USD",
        days_overdue: 17,
      },
    },
  },
  {
    id: "simulate-failure",
    label: "CampaignOps · simulate failure",
    description: "Same as #2 with simulate_failure: true → fails + review",
    payload: {
      source_event_id: "campaign-002",
      source: "campaignops",
      event_type: "client_brief.received",
      payload: {
        client: "Luna Cafe",
        campaign_goal: "Launch Ramadan catering offer",
        channels: ["instagram"],
        deadline: "2026-06-10",
        simulate_failure: true,
      },
    },
  },
];

export function Simulator() {
  const [json, setJson] = useState<string>(
    JSON.stringify(SAMPLES[0].payload, null, 2),
  );
  const [activeId, setActiveId] = useState<string>(SAMPLES[0].id);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitEventResult | null>(null);

  const loadSample = useCallback((sample: Sample) => {
    setJson(JSON.stringify(sample.payload, null, 2));
    setActiveId(sample.id);
    setParseError(null);
    setResult(null);
  }, []);

  const onSubmit = useCallback(async () => {
    setParseError(null);
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
      return;
    }

    setSubmitting(true);
    try {
      const next = await submitEvent(parsed);
      setResult(next);
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }, [json]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2
          className="text-[13px] uppercase tracking-[0.5px]"
          style={{ color: "rgba(46, 42, 57, 0.55)" }}
        >
          Sample payloads
        </h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLES.map((sample) => {
            const active = sample.id === activeId;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample)}
                aria-pressed={active}
                className="flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12536B]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={
                  active
                    ? {
                        backgroundColor: "rgba(18, 83, 107, 0.06)",
                        borderColor: "#12536B",
                        color: "#12536B",
                      }
                    : {
                        backgroundColor: "white",
                        borderColor: "rgba(46, 42, 57, 0.12)",
                        color: "#2E2A39",
                      }
                }
              >
                <span className="text-[15px] font-medium">{sample.label}</span>
                <span
                  className="text-[13px]"
                  style={{
                    color: active ? "#12536B" : "rgba(46, 42, 57, 0.65)",
                  }}
                >
                  {sample.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-[13px] uppercase tracking-[0.5px]"
              style={{ color: "rgba(46, 42, 57, 0.55)" }}
            >
              Payload
            </h2>
            <span
              className="text-[13px]"
              style={{ color: "rgba(46, 42, 57, 0.6)" }}
            >
              Edit before submitting.
            </span>
          </div>
          <textarea
            value={json}
            onChange={(e) => {
              setJson(e.target.value);
              setActiveId("");
              setParseError(null);
            }}
            spellCheck={false}
            className="min-h-[360px] resize-y rounded-xl border p-4 font-mono text-[13px] leading-relaxed focus:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "#FDFBF7",
              borderColor: parseError ? "#8B1F12" : "rgba(46, 42, 57, 0.18)",
              color: "#2E2A39",
            }}
          />
          {parseError ? (
            <p className="text-[13px]" style={{ color: "#8B1F12" }}>
              {parseError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="cta-primary"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <span className="text-[13px] text-muted-foreground">
              Sends through the same engine the simulator and any future
              webhook would use.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2
            className="text-[13px] uppercase tracking-[0.5px]"
            style={{ color: "rgba(46, 42, 57, 0.55)" }}
          >
            Result
          </h2>
          {result === null ? (
            <div
              className="flex min-h-[360px] flex-col items-start justify-center gap-1 rounded-xl border border-dashed p-6 text-[14px]"
              style={{
                borderColor: "rgba(46, 42, 57, 0.18)",
                color: "rgba(46, 42, 57, 0.6)",
              }}
            >
              <p>No submissions yet.</p>
              <p>
                Pick a sample, edit, and submit to see the engine's
                ProcessResult.
              </p>
            </div>
          ) : result.ok ? (
            <ResultPreview result={result.result} />
          ) : (
            <div
              className="rounded-xl border p-4 text-[14px]"
              style={{
                backgroundColor: "rgba(180, 35, 24, 0.06)",
                borderColor: "rgba(180, 35, 24, 0.35)",
                color: "#8B1F12",
              }}
            >
              <p className="font-medium">Submission failed.</p>
              <p className="mt-1 whitespace-pre-line">{result.error}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ResultPreview({
  result,
}: {
  result: Extract<SubmitEventResult, { ok: true }>["result"];
}) {
  const { event, actions, reviewItem, auditLogs, existed } = result;
  return (
    <div className="flex flex-col gap-4">
      {existed ? (
        <div
          className="rounded-xl border px-4 py-3 text-[14px]"
          style={{
            backgroundColor: "rgba(18, 83, 107, 0.08)",
            borderColor: "rgba(18, 83, 107, 0.35)",
            color: "#12536B",
          }}
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.5px]">
            Idempotent re-submission
          </p>
          <p className="mt-1">
            An event with this <span className="font-mono">source_event_id</span>{" "}
            already exists. Returning the prior result without re-running the
            workflow. Edit the id to create a new event.
          </p>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
        style={{
          backgroundColor: "white",
          borderColor: "rgba(46, 42, 57, 0.12)",
        }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[13px]"
            style={{ color: "rgba(46, 42, 57, 0.7)" }}
          >
            {event.source_event_id}
          </span>
          <Link
            href={`/events/${event.id}`}
            className="text-[15px] font-medium underline underline-offset-2"
            style={{ color: "#12536B" }}
          >
            Open event detail →
          </Link>
        </div>
        <StatusChip status={event.status} />
      </div>

      {reviewItem ? (
        <div
          className="rounded-xl border px-4 py-3 text-[14px]"
          style={{
            backgroundColor: "rgba(202, 138, 4, 0.10)",
            borderColor: "rgba(202, 138, 4, 0.35)",
            color: "#854D0E",
          }}
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.5px]">
            Sent to review
          </p>
          <p className="mt-1">{reviewItem.reason}</p>
        </div>
      ) : null}

      <details className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(46, 42, 57, 0.12)" }}>
        <summary
          className="cursor-pointer px-4 py-3 text-[14px] font-medium"
          style={{ color: "#2E2A39" }}
        >
          Actions ({actions.length})
        </summary>
        <pre
          className="overflow-x-auto border-t px-4 py-3 font-mono text-[12px] leading-relaxed"
          style={{
            backgroundColor: "#FDFBF7",
            borderColor: "rgba(46, 42, 57, 0.08)",
            color: "#2E2A39",
          }}
        >
          {JSON.stringify(actions, null, 2)}
        </pre>
      </details>

      <details className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(46, 42, 57, 0.12)" }}>
        <summary
          className="cursor-pointer px-4 py-3 text-[14px] font-medium"
          style={{ color: "#2E2A39" }}
        >
          Audit log ({auditLogs.length})
        </summary>
        <ol
          className="border-t px-4 py-3 text-[13px]"
          style={{ borderColor: "rgba(46, 42, 57, 0.08)" }}
        >
          {auditLogs.map((log) => (
            <li
              key={log.id}
              className="py-1.5"
              style={{ color: "rgba(46, 42, 57, 0.85)" }}
            >
              {log.message}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
