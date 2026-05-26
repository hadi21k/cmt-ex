# Mock External Services

Per spec 8, do NOT integrate with real external systems. Each stream has a mock service that pretends to do the side effect (send a reminder, create a task, request a reservation change) and returns a synthetic success/failure result.

## Planned files (next implement)

| File | Stream | Pretends to | Spec |
| --- | --- | --- | --- |
| `finance.ts` | `mockFinanceService` | Send payment reminders, create finance follow-ups | 8 |
| `campaign.ts` | `mockCampaignService` | Create internal campaign tasks | 8 |
| `guest.ts` | `mockGuestService` | Request reservation changes, prepare guest messages | 8 |

Each file exports a single function matching the `MockService` interface (defined alongside the engine). The engine looks services up by action `type`.

## The `simulate_failure` contract

If the incoming event's payload has `"simulate_failure": true` (top-level), the relevant mock service MUST fail when invoked. Spec 8 wording:

> When this flag appears, the relevant mock service should fail. The failure should be visible in the UI, recorded in the audit trail, and handled without incorrectly marking the event as `completed`.

The end state for a simulated-failure event:

- Event status: `failed` (NOT `completed`).
- An audit log entry capturing the failure with the service name and the error message.
- A review queue item with the failure reason so the operator can decide what to do.
- No partial-success masquerading as success.

## Why mocks at all

The exercise is fictional; real integrations aren't allowed. The mocks also make the failure-path test (#6 of the 6 mandatory tests) deterministic - flip the flag, expect the failure path.

## Anti-patterns

- **Services that talk to a real endpoint** (Stripe sandbox, Mailgun sandbox, etc.). Out of scope.
- **Services that silently swallow `simulate_failure`** because the happy path is easier to wire. The failure path is a spec requirement, not a nice-to-have.
- **Random failures inside mocks** ("flake 5% of the time to make it realistic"). Failures are deterministic, driven only by the explicit flag.
