import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

const validGuestOpsEvent: IncomingEvent = {
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
};

describe("GuestOps workflow (test 3: happy path)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("processes a valid reservation.change_requested event end-to-end", async () => {
    const result = await processEvent(validGuestOpsEvent);

    expect(result.event.status).toBe("completed");
    expect(result.event.source).toBe("guestops");

    expect(result.actions).toHaveLength(2);
    const types = result.actions.map((a) => a.type).sort();
    expect(types).toEqual(["generate_guest_message", "request_reservation_change"]);

    const reservation = result.actions.find(
      (a) => a.type === "request_reservation_change",
    );
    expect(reservation?.payload.reservation_id).toBe("RES-7729");
    expect(reservation?.payload.requested_check_in).toBe("2026-06-06");

    const message = result.actions.find(
      (a) => a.type === "generate_guest_message",
    );
    expect(String(message?.payload.message)).toMatch(/^Hi Maya,/);
    expect(String(message?.payload.message)).toContain("2026-06-06");

    for (const action of result.actions) {
      expect(action.status).toBe("completed");
    }

    expect(result.reviewItem).toBeNull();
    expect(db.actions).toHaveLength(2);
  });
});
