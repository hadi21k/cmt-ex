"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { submitEvent, type SubmitEventResult } from "@/app/_actions/submitEvent";
import { StatusChip } from "@/components/status-chip";

// Appendix A sample payloads - exact strings from the candidate spec.
// Split into two labelled groups so an operator (or first-time reviewer)
// learns the mental model: three streams work end to end, three edge
// cases route to review or surface a failure. Picking a sample replaces
// the editor; the simulate_failure case is just sample #6 with the flag
// already on.

interface Sample {
  id: string;
  label: string;
  description: string;
  payload: Record<string, unknown>;
}

const HAPPY_PATHS: Sample[] = [
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
];

const EDGE_CASES: Sample[] = [
  {
    id: "duplicate-finance",
    label: "FinanceOps · duplicate event",
    description: "Same source_event_id as the overdue invoice. Submit after sample 1 to trigger idempotency (no new actions).",
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
    description: "Same shape as the overdue invoice but invoice_id is missing → review",
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
    description: "Same as the client brief with simulate_failure: true → fails + review",
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

const ALL_SAMPLES: Sample[] = [...HAPPY_PATHS, ...EDGE_CASES];

export function Simulator() {
  const [json, setJson] = useState<string>(
    JSON.stringify(ALL_SAMPLES[0].payload, null, 2),
  );
  const [activeId, setActiveId] = useState<string>(ALL_SAMPLES[0].id);
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
      <section className="flex flex-col gap-4">
        <SampleGroup
          label="Happy paths"
          subtitle="Three streams that run end to end with no operator intervention."
          samples={HAPPY_PATHS}
          activeId={activeId}
          onPick={loadSample}
        />
        <div
          aria-hidden
          className="h-px"
          style={{ backgroundColor: "rgba(14, 15, 12, 0.1)" }}
        />
        <SampleGroup
          label="Edge cases"
          subtitle="Routed to the review queue or surfaced as a failure."
          samples={EDGE_CASES}
          activeId={activeId}
          onPick={loadSample}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              className="text-[14px] font-semibold leading-5"
              style={{ color: "#0e0f0c" }}
            >
              Payload
            </h2>
            <span
              className="text-[13px]"
              style={{ color: "rgba(14, 15, 12, 0.6)" }}
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
              backgroundColor: "#ffffff",
              borderColor: parseError ? "#a7000d" : "rgba(14, 15, 12, 0.18)",
              color: "#0e0f0c",
            }}
          />
          {parseError ? (
            <p className="text-[13px]" style={{ color: "#a7000d" }}>
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
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2
            className="text-[14px] font-semibold leading-5"
            style={{ color: "#0e0f0c" }}
          >
            Result
          </h2>
          {result === null ? (
            <div
              className="flex min-h-[360px] flex-col items-start justify-center gap-1 rounded-xl border border-dashed p-6 text-[14px] leading-5"
              style={{
                borderColor: "rgba(14, 15, 12, 0.18)",
                color: "rgba(14, 15, 12, 0.6)",
              }}
            >
              <p>No submissions yet.</p>
              <p>Pick a sample, edit, and submit to see what happens.</p>
            </div>
          ) : result.ok ? (
            <ResultPreview result={result.result} />
          ) : (
            <div
              className="rounded-xl border p-4 text-[14px] leading-5"
              style={{
                backgroundColor: "rgba(208, 50, 56, 0.12)",
                borderColor: "rgba(208, 50, 56, 0.40)",
                color: "#a7000d",
              }}
            >
              <p className="font-semibold">Submission failed.</p>
              <p className="mt-1 whitespace-pre-line">{result.error}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SampleGroup({
  label,
  subtitle,
  samples,
  activeId,
  onPick,
}: {
  label: string;
  subtitle: string;
  samples: Sample[];
  activeId: string;
  onPick: (sample: Sample) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2
          className="text-[14px] font-semibold leading-5"
          style={{ color: "#0e0f0c" }}
        >
          {label}
        </h2>
        <p
          className="text-[13px] leading-5"
          style={{ color: "rgba(14, 15, 12, 0.6)" }}
        >
          {subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {samples.map((sample) => {
          const active = sample.id === activeId;
          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onPick(sample)}
              aria-pressed={active}
              className="flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={
                active
                  ? {
                      backgroundColor: "#0e0f0c",
                      borderColor: "#0e0f0c",
                      color: "#ffffff",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      borderColor: "rgba(14, 15, 12, 0.12)",
                      color: "#0e0f0c",
                    }
              }
            >
              <span className="text-[15px] font-semibold leading-5">
                {sample.label}
              </span>
              <span
                className="text-[13px] leading-5"
                style={{
                  color: active ? "rgba(255, 255, 255, 0.75)" : "rgba(14, 15, 12, 0.65)",
                }}
              >
                {sample.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultPreview({
  result,
}: {
  result: Extract<SubmitEventResult, { ok: true }>["result"];
}) {
  const { event, reviewItem, existed } = result;
  return (
    <div className="flex flex-col gap-4">
      {existed ? (
        <div
          className="rounded-xl border px-4 py-3 text-[14px] leading-5"
          style={{
            backgroundColor: "#e8ebe6",
            borderColor: "rgba(14, 15, 12, 0.20)",
            color: "#0e0f0c",
          }}
        >
          <p className="text-[14px] font-semibold leading-5">Duplicate event</p>
          <p className="mt-1">
            An event with this <span className="font-mono">source_event_id</span>{" "}
            already exists. Returning the prior result without re-running. Edit the id to create a new event.
          </p>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
        style={{
          backgroundColor: "white",
          borderColor: "rgba(14, 15, 12, 0.12)",
        }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[13px]"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            {event.source_event_id}
          </span>
          <Link
            href={`/events/${event.id}`}
            className="text-[15px] font-semibold underline underline-offset-2"
            style={{ color: "#0e0f0c" }}
          >
            Open event detail →
          </Link>
        </div>
        <StatusChip status={event.status} />
      </div>

      {reviewItem ? (
        <div
          className="rounded-xl border px-4 py-3 text-[14px] leading-5"
          style={{
            backgroundColor: "rgba(255, 209, 26, 0.20)",
            borderColor: "rgba(255, 209, 26, 0.60)",
            color: "#4a3b1c",
          }}
        >
          <p className="text-[14px] font-semibold leading-5">Sent to review</p>
          <p className="mt-1">{reviewItem.reason}</p>
        </div>
      ) : null}
    </div>
  );
}
