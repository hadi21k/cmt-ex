---
source: operations_command_center_candidate_exercise.pdf
captured: 2026-05-25T18:31
pages: 12
status: master-spec
note: Verbatim transcription of the candidate-facing PDF. Do not edit content; this is the contract.
---


# Operations Command Center - Candidate Exercise

## Coding Exercise: Operations Command Center

**Full-stack take-home exercise for product engineering candidates**

### Timebox: One working day

Build a small but polished web app that lets an internal operator submit operational events, review generated actions, resolve risky cases, and inspect an audit trail. Prioritize a coherent working product over visual perfection.

| Item | Expectation |
| --- | --- |
| Exercise type | Full-stack web app with UI, workflow logic, persistence, and tests |
| Domain knowledge required | None. The business systems in this brief are fictional. |
| External APIs | Not required. Use mock services only. |
| Recommended stack | React / Next.js + TypeScript, with SQLite, Supabase, Postgres, local JSON, or equivalent persistence |
| Review format | We may test your app with additional payloads and ask for one small live change. |

> This document is candidate-facing. It does not require knowledge of any internal company systems or codebase.

---

## 1. Objective

Build an internal operations dashboard for a fictional company that receives events from three different business systems. Your app should feel like a real tool an operations team could use: it should accept events, generate actions, show what happened, and route risky or ambiguous cases to human review.

> **Important design requirement**
>
> Do not build this as three disconnected forms. Build a shared operations system with reusable workflow logic and stream-specific adapters.

The exercise is designed to show how you think across product, engineering, reliability, UI, and workflow design.

---

## 2. Scenario

The company receives operational events from three fictional systems:

| System | What it handles |
| --- | --- |
| FinanceOps | Invoices, overdue payments, suppliers, customer follow-ups, and payment reminders. |
| CampaignOps | Client campaign briefs, execution tasks, creative deliverables, and internal agency workflows. |
| GuestOps | Reservations, guest requests, booking changes, and guest-facing confirmation messages. |

For each event, the operator should be able to understand what arrived, what workflow was selected, what actions were generated, whether the actions executed successfully, and why anything was sent to review.

---

## 3. Required Pages

| Page | Required functionality |
| --- | --- |
| Dashboard | Show total events, completed events, events needing review, failed events, and recent activity. The numbers should come from stored data, not static placeholders. |
| Event Inbox | List received events with source event ID, stream, event type, status, created time, and whether review is required. Include useful filters. |
| Event Detail Page | Show original payload, detected stream, generated actions, action execution status, review reason if any, and an audit timeline. |
| Event Simulator | Provide a UI where we can select sample events, edit JSON, submit events, simulate failure, and see the result. |
| Human Review Queue | Show risky or ambiguous events. Let an operator approve, reject, edit generated actions, add resolution notes, and mark items resolved. |

---

## 4. Required Event Behavior

For each incoming event, your system should:

1. Validate the event structure and required payload fields.
2. Identify the correct workflow stream: FinanceOps, CampaignOps, GuestOps, or Unknown.
3. Run the relevant workflow adapter.
4. Generate one or more actions.
5. Execute mock external actions through a mock service.
6. Persist events, actions, review items, and audit logs.
7. Avoid duplicate processing using `source_event_id`.
8. Send invalid, ambiguous, unsupported, or failed events to human review.
9. Show the full history in the UI.

### Statuses

| Status | Meaning |
| --- | --- |
| `received` | The event has been accepted and stored. |
| `processing` | The workflow is being evaluated or actions are being executed. |
| `completed` | The workflow completed and actions were successfully handled. |
| `review_required` | The system could not safely complete the event without human review. |
| `failed` | The event failed in a way that is visible and auditable. |

---

## 5. Required Workflows

### A. FinanceOps - Overdue Invoice

**Input event:**

```json
{
  "source_event_id": "finance-001",
  "source": "financeops",
  "event_type": "invoice.overdue",
  "payload": {
    "invoice_id": "INV-9281",
    "customer_name": "Acme Trading",
    "amount": 4200,
    "currency": "USD",
    "days_overdue": 17
  }
}
```

**Expected behavior:**

- Create a payment reminder action.
- Create a follow-up task.
- Mark priority as `high` if `days_overdue` is greater than 14. Otherwise, mark it `normal`.
- Save the result and show the actions in the UI.

**Example generated actions:**

```json
[
  {
    "type": "send_payment_reminder",
    "target": "Acme Trading",
    "priority": "high"
  },
  {
    "type": "create_follow_up_task",
    "invoice_id": "INV-9281",
    "priority": "high"
  }
]
```

### B. CampaignOps - Client Brief Received

**Input event:**

```json
{
  "source_event_id": "campaign-001",
  "source": "campaignops",
  "event_type": "client_brief.received",
  "payload": {
    "client": "Luna Cafe",
    "campaign_goal": "Launch Ramadan catering offer",
    "channels": [
      "instagram",
      "email",
      "landing_page"
    ],
    "deadline": "2026-06-10"
  }
}
```

**Expected behavior:**

- Create one task per channel.
- Generate sensible task names.
- Include the deadline on each task.
- Save the task list and show it in the UI.
- Optional bonus: add a final QA task.

**Example generated actions:**

```json
[
  {
    "type": "create_campaign_task",
    "title": "Instagram creative brief for Luna Cafe",
    "channel": "instagram",
    "deadline": "2026-06-10"
  },
  {
    "type": "create_campaign_task",
    "title": "Email copy brief for Luna Cafe",
    "channel": "email",
    "deadline": "2026-06-10"
  },
  {
    "type": "create_campaign_task",
    "title": "Landing page content brief for Luna Cafe",
    "channel": "landing_page",
    "deadline": "2026-06-10"
  }
]
```

### C. GuestOps - Reservation Change Requested

**Input event:**

```json
{
  "source_event_id": "guest-001",
  "source": "guestops",
  "event_type": "reservation.change_requested",
  "payload": {
    "reservation_id": "RES-7729",
    "guest_name": "Maya Haddad",
    "current_check_in": "2026-06-04",
    "requested_check_in": "2026-06-06",
    "nights": 3
  }
}
```

**Expected behavior:**

- Validate that `reservation_id`, `guest_name`, and `requested_check_in` are present.
- Create a reservation-change action.
- Generate a guest-facing confirmation message.
- Save the result and show it in the UI.
- Treat missing or ambiguous reservation fields as review-required, not automatically completed.

**Example generated actions:**

```json
[
  {
    "type": "request_reservation_change",
    "reservation_id": "RES-7729",
    "requested_check_in": "2026-06-06"
  },
  {
    "type": "generate_guest_message",
    "message": "Hi Maya, we received your request to change your check-in date to 2026-06-06."
  }
]
```

---

## 6. Human Review Queue

Events should enter the review queue when:

- Required fields are missing.
- The source is unknown.
- The event type is unsupported.
- The payload is ambiguous.
- A mock external service fails.
- The system cannot safely automate the request.

Each review item should let the operator:

- View the original event.
- See the review reason.
- Approve the generated action, if one exists.
- Reject the event.
- Edit an action before approval.
- Add resolution notes.
- Mark the review item as resolved.

**Example ambiguous event:**

```json
{
  "source_event_id": "unknown-001",
  "source": "unknown",
  "event_type": "message.received",
  "payload": {
    "text": "Please move this to next Friday and tell the client it is confirmed."
  }
}
```

> **Expected handling**
>
> This event should not be blindly automated. It should go to review with a clear reason, such as: Unable to determine workflow stream.

---

## 7. Persistence and Data Model

Your app should preserve useful state after refresh. You may use SQLite, Postgres, Supabase, local JSON files, or another reasonable persistence layer. Browser localStorage is acceptable only if you clearly explain the tradeoff.

**Minimum entities to persist:**

| Entity | Suggested fields |
| --- | --- |
| `events` | id, source_event_id, source, event_type, payload, status, created_at, updated_at |
| `actions` | id, event_id, type, payload, status, created_at |
| `review_queue_items` | id, event_id, reason, status, resolution_notes, created_at, resolved_at |
| `audit_logs` | id, event_id, message, metadata, created_at |

---

## 8. Mock External Services

Do not integrate with real external systems. Implement mock services such as:

- **mockFinanceService:** pretends to send payment reminders and create finance follow-ups.
- **mockCampaignService:** pretends to create internal campaign tasks.
- **mockGuestService:** pretends to request reservation changes and prepare guest messages.

To test failure handling, support a payload flag like this:

```json
{
  "simulate_failure": true
}
```

When this flag appears, the relevant mock service should fail. The failure should be visible in the UI, recorded in the audit trail, and handled without incorrectly marking the event as `completed`.

---

## 9. Event Simulator Requirements

The simulator should make the app easy to test manually. It should include:

- A dropdown or buttons for sample events.
- A JSON editor or textarea.
- A submit button.
- A result preview.
- A way to simulate failure.
- Clear handling for invalid JSON or malformed payloads.

We should be able to use the UI to submit:

- A valid FinanceOps event.
- A valid CampaignOps event.
- A valid GuestOps event.
- An unknown or ambiguous event.
- A duplicate event with the same `source_event_id`.
- A simulated failure event.

---

## 10. Technical Requirements

| Requirement   | Details                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | A usable web UI. React / Next.js is recommended but not required.                                                                             |
| Backend       | Any reasonable backend/API approach is acceptable. Next.js API routes, Express, FastAPI, Rails, Django, or equivalent are fine.               |
| Persistence   | Use SQLite, Postgres, Supabase, local JSON, or another clear persistence layer.                                                               |
| Tests         | Include at least 6 meaningful tests.                                                                                                          |
| Data          | Use only synthetic data. Do not use real customer data or private company information.                                                        |
| External APIs | No real external APIs are required. Use mock services.                                                                                        |
| AI/LLM usage  | A real LLM is not required. If you add a classifier, it can be rule-based or mocked. Low-confidence or ambiguous outputs should go to review. |

### Required tests

- FinanceOps event succeeds.
- CampaignOps event succeeds.
- GuestOps event succeeds.
- Duplicate event does not create duplicate actions.
- Missing required field goes to review.
- Simulated external failure is handled correctly.

---

## 11. Deliverables

1. **Working app.** The app can be run locally and tested through the UI.
2. **Source code.** Submit a GitHub repo, zip file, or equivalent source package.
3. **README.** Include setup instructions, how to run tests, how to seed or submit sample events, and any assumptions.
4. **Architecture explanation.** Briefly explain your workflow engine, adapters, persistence, and review flow.
5. **At least 6 tests.** Include the required tests listed above.
6. **Sample events.** Include sample payloads or seed data that make the demo easy to run.
7. **Tradeoffs and next steps.** Explain what you intentionally did not build because of the one-day timebox.

---

## 12. What We Will Evaluate

| Area | What strong submissions show | Weight |
| --- | --- | --- |
| Product / UI quality | The app is easy to understand, the dashboard is useful, the inbox and detail pages are clear, and the review queue feels like a real workflow. | 25% |
| Workflow correctness | The three workflows produce correct actions, invalid cases go to review, failures are visible, and statuses make sense. | 20% |
| Architecture | There is a shared workflow engine, clean stream-specific adapters, and clear separation between UI, workflow logic, and persistence. | 20% |
| Reliability | Idempotency works, state persists after refresh, audit logs are useful, and bad inputs do not crash the app. | 15% |
| Testing | Tests cover happy paths, idempotency, review behavior, failure handling, and are easy to run. | 10% |
| Communication | The README and architecture explanation are clear, honest, and practical. | 10% |

---

## 13. What Not To Spend Time On

- Authentication or role-based permissions.
- Real payment, booking, CRM, ERP, email, or task-management integrations.
- A perfect visual design system.
- Complex AI features.
- Production-grade deployment unless you want to show it as a bonus.

---

## 14. Strong Submission Signals

- You can run the app, submit events, refresh, and the state is still there.
- The UI makes it obvious what happened and why.
- Duplicate events do not create duplicate actions.
- The app does not blindly automate ambiguous or risky requests.
- The audit timeline is useful, not just decorative.
- The code structure makes it easy to add a fourth stream.
- Your README explains tradeoffs clearly.

> **Live review note**
>
> After submission, we may test your app with additional payloads and ask you to make one small rule change live. This is to understand how maintainable your solution is, not to catch you out.

---

## Appendix A - Sample Payloads

You may include these in your simulator, seed data, or README examples.

### Valid FinanceOps Event

```json
{
  "source_event_id": "finance-001",
  "source": "financeops",
  "event_type": "invoice.overdue",
  "payload": {
    "invoice_id": "INV-9281",
    "customer_name": "Acme Trading",
    "amount": 4200,
    "currency": "USD",
    "days_overdue": 17
  }
}
```

### Valid CampaignOps Event

```json
{
  "source_event_id": "campaign-001",
  "source": "campaignops",
  "event_type": "client_brief.received",
  "payload": {
    "client": "Luna Cafe",
    "campaign_goal": "Launch Ramadan catering offer",
    "channels": [
      "instagram",
      "email",
      "landing_page"
    ],
    "deadline": "2026-06-10"
  }
}
```

### Valid GuestOps Event

```json
{
  "source_event_id": "guest-001",
  "source": "guestops",
  "event_type": "reservation.change_requested",
  "payload": {
    "reservation_id": "RES-7729",
    "guest_name": "Maya Haddad",
    "current_check_in": "2026-06-04",
    "requested_check_in": "2026-06-06",
    "nights": 3
  }
}
```

### Ambiguous Event - Should Go To Review

```json
{
  "source_event_id": "unknown-001",
  "source": "unknown",
  "event_type": "message.received",
  "payload": {
    "text": "Please move this to next Friday and tell the client it is confirmed."
  }
}
```

### Missing Required Field - Should Go To Review

```json
{
  "source_event_id": "finance-002",
  "source": "financeops",
  "event_type": "invoice.overdue",
  "payload": {
    "customer_name": "Acme Trading",
    "amount": 4200,
    "currency": "USD",
    "days_overdue": 17
  }
}
```

### Simulated Failure Event - Should Not Be Completed

```json
{
  "source_event_id": "campaign-002",
  "source": "campaignops",
  "event_type": "client_brief.received",
  "payload": {
    "client": "Luna Cafe",
    "campaign_goal": "Launch Ramadan catering offer",
    "channels": [
      "instagram"
    ],
    "deadline": "2026-06-10",
    "simulate_failure": true
  }
}
```

---

## Appendix B - Submission Checklist

- App runs locally from a fresh checkout.
- README includes setup and test commands.
- Simulator includes sample events.
- Dashboard, inbox, detail page, simulator, and review queue are available.
- FinanceOps, CampaignOps, and GuestOps workflows work.
- Duplicate `source_event_id` is handled safely.
- Invalid and ambiguous events go to review.
- Mock service failure is visible and auditable.
- State persists after refresh.
- At least 6 tests pass.
- Architecture and tradeoffs are explained.
