import { z } from "zod";

import type { ActionSpec, StreamAdapter } from "../types";

// GuestOps adapter. Handles `reservation.change_requested` events.
// Spec 5.C:
//   - Validate reservation_id, guest_name, requested_check_in are present.
//   - Missing required fields → review_required (not auto-completed).
//   - Generate request_reservation_change + generate_guest_message.

const payloadSchema = z.object({
  reservation_id: z.string(),
  guest_name: z.string(),
  requested_check_in: z.string(),
});

export const guestopsReservationChangeAdapter: StreamAdapter = (event) => {
  const parsed = payloadSchema.safeParse(event.payload);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .filter(
        (i) => i.code === "invalid_type" && /received undefined/.test(i.message),
      )
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      return {
        kind: "review",
        reason: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      };
    }
    return {
      kind: "review",
      reason: `Invalid GuestOps payload: ${parsed.error.issues[0].message}`,
    };
  }

  const { reservation_id, guest_name, requested_check_in } = parsed.data;
  const firstName = guest_name.split(" ")[0];

  const actions: ActionSpec[] = [
    {
      type: "request_reservation_change",
      payload: { reservation_id, requested_check_in },
    },
    {
      type: "generate_guest_message",
      payload: {
        message: `Hi ${firstName}, we received your request to change your check-in date to ${requested_check_in}.`,
      },
    },
  ];

  return { kind: "actions", actions };
};
