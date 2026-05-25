import type { MockService, ServiceExecution } from "../types";

// mockFinanceService: pretends to send payment reminders and create
// finance follow-up tasks. Spec §8. Failure is deterministic — the
// `simulate_failure: true` flag on the event payload makes the service
// throw, so failure-path tests are reproducible.

export const mockFinanceService: MockService = async (action, event) => {
  if (event.payload.simulate_failure === true) {
    throw new Error("mockFinanceService failed: simulate_failure flag set");
  }

  switch (action.type) {
    case "send_payment_reminder":
      return success({ sent_to: action.payload.target });
    case "create_follow_up_task":
      return success({ task_for: action.payload.invoice_id });
    default:
      return {
        ok: false,
        error: `mockFinanceService: unknown action type "${action.type}"`,
      };
  }
};

function success(result: Record<string, unknown>): ServiceExecution {
  return { ok: true, result };
}
