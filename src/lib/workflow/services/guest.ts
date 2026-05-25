import type { MockService, ServiceExecution } from "../types";

// mockGuestService: pretends to request reservation changes and
// prepare guest-facing confirmation messages. Spec §8.

export const mockGuestService: MockService = async (action, event) => {
  if (event.payload.simulate_failure === true) {
    throw new Error("mockGuestService failed: simulate_failure flag set");
  }

  switch (action.type) {
    case "request_reservation_change":
      return success({
        reservation_id: action.payload.reservation_id,
        new_check_in: action.payload.requested_check_in,
      });
    case "generate_guest_message":
      return success({ message_drafted: action.payload.message });
    default:
      return {
        ok: false,
        error: `mockGuestService: unknown action type "${action.type}"`,
      };
  }
};

function success(result: Record<string, unknown>): ServiceExecution {
  return { ok: true, result };
}
