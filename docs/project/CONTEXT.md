---
project: operations-command-center
created: 2026-05-25T18:31
status: active
---

# Operations Command Center

## Overview

Take-home coding exercise for a job application. The candidate (the user) must build a full-stack internal operations dashboard for a fictional company that receives events from three business systems (FinanceOps, CampaignOps, GuestOps). The app accepts events, runs them through a shared workflow engine with stream-specific adapters, generates and executes mock actions, routes risky or ambiguous cases to a human review queue, and exposes an audit timeline. Reviewers may test the submitted app with additional payloads and request one small live rule change.

The complete candidate-facing brief is captured verbatim in [requirements.md](./requirements.md) - that file is the contract and the master spec for this project.

## Goals

- Deliver a working full-stack web app within the one-working-day timebox.
- Implement a shared workflow engine with three stream adapters (FinanceOps overdue invoice, CampaignOps client brief, GuestOps reservation change), NOT three disconnected forms.
- Build the five required pages: Dashboard, Event Inbox, Event Detail Page, Event Simulator, Human Review Queue.
- Persist events, actions, review_queue_items, and audit_logs so state survives refresh.
- Implement idempotency via `source_event_id` so duplicate submissions do not create duplicate actions.
- Route invalid, ambiguous, unsupported, and failed events to the human review queue with a clear reason.
- Implement mock external services (mockFinanceService, mockCampaignService, mockGuestService) with a `simulate_failure` flag for failure-path testing.
- Ship at least 6 meaningful tests covering the required test list (3 happy paths, duplicate handling, missing-field-to-review, simulated failure).
- Ship a README with setup, test commands, sample events, architecture explanation, and an honest tradeoffs / next-steps section.
- Make the code structure easy to extend with a fourth stream (per the strong-submission signals).

## Constraints

- **Timebox: one working day.** Prioritize a coherent working product over visual perfection.
- **Stack:** React / Next.js + TypeScript recommended. Persistence layer of choice (SQLite, Postgres, Supabase, local JSON). Browser localStorage only if the tradeoff is explained.
- **No real external integrations.** Mock services only.
- **No authentication or RBAC.** Explicitly out of scope.
- **No real LLM required.** A rule-based or mocked classifier is fine; low-confidence outputs go to review.
- **Synthetic data only.** No real customer data, no internal company information.
- **Review format:** the company may test the submission with additional payloads and ask for one small live rule change to assess maintainability.
- **Evaluation weights:** Product/UI 25%, Workflow correctness 20%, Architecture 20%, Reliability 15%, Testing 10%, Communication 10%.

## Index

- [requirements.md](./requirements.md) - verbatim transcription of the candidate-facing PDF; the master spec for everything in this project (sections 1-14 + Appendix A sample payloads + Appendix B submission checklist).
- [user-stories.md](./user-stories.md) - the six end-to-end use cases (3 happy paths + missing-field + unknown + simulated-failure), the operator's daily loop, the four-pillar rubric breakdown, and the code-mapping table. Read this before any feature code.
- [design.md](./design.md) - design system (tokens, components, do's and don'ts) extracted from cmonkeytribe.com and retargeted for the dashboard's product register. Read before building any UI.

## Decision log

(none yet - appended by /archive when implement plans complete)

## Open questions

- Final stack pick: Next.js with API routes (single repo, single deploy) vs Next.js + separate backend. The PDF recommends Next.js but does not require it.
- Persistence pick: SQLite (fastest for a one-day timebox, no setup) vs Postgres/Supabase (more "real"). Note: the brief allows browser localStorage with a tradeoff note - decide whether that is acceptable given the one-day budget.
- Classifier approach for the "Unknown source" branch: pure rule-based switch on `source` field, or a slightly fuzzier check that also routes unsupported `event_type` values to review with a distinct reason.
- How much polish to invest in the audit timeline UI - the brief explicitly flags "useful, not just decorative" as a strong-submission signal.
- Whether to implement the optional QA-task bonus in the CampaignOps workflow.

## Related

- [requirements.md](./requirements.md) - the full PDF contents
- Implement plans that built this project: [setup-and-scaffold.md](../implement/setup-and-scaffold.md) (foundation) and [workflows-and-pages.md](../implement/workflows-and-pages.md) (feature work).
