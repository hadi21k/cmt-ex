import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

// Appendix A "Simulated Failure Event" payload — simulate_failure: true.
const eventWithFailure: IncomingEvent = {
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
};

describe("Simulated external failure (test 6)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("marks the event failed when the mock service throws, visible in UI + audit + review queue", async () => {
    const result = await processEvent(eventWithFailure);

    // Spec §8: "handled without incorrectly marking the event as completed."
    expect(result.event.status).toBe("failed");
    expect(result.event.status).not.toBe("completed");

    // Actions were generated but none executed cleanly.
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.every((a) => a.status === "failed")).toBe(true);

    // Visible in the review queue with the error as the reason.
    expect(result.reviewItem).not.toBeNull();
    expect(result.reviewItem?.reason).toContain("simulate_failure");

    // Visible in the audit trail.
    const messages = result.auditLogs.map((a) => a.message);
    expect(messages.some((m) => m.includes("failed"))).toBe(true);

    expect(db.events).toHaveLength(1);
    expect(db.review_queue_items).toHaveLength(1);
  });
});
