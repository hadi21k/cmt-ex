import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

const validCampaignOpsEvent: IncomingEvent = {
  source_event_id: "campaign-001",
  source: "campaignops",
  event_type: "client_brief.received",
  payload: {
    client: "Luna Cafe",
    campaign_goal: "Launch Ramadan catering offer",
    channels: ["instagram", "email", "landing_page"],
    deadline: "2026-06-10",
  },
};

describe("CampaignOps workflow (test 2: happy path)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("processes a valid client_brief.received event end-to-end", async () => {
    const result = await processEvent(validCampaignOpsEvent);

    expect(result.event.status).toBe("completed");
    expect(result.event.source).toBe("campaignops");

    // 3 per-channel tasks + 1 QA bonus task = 4 actions.
    expect(result.actions).toHaveLength(4);

    const taskActions = result.actions.filter(
      (a) => a.type === "create_campaign_task",
    );
    expect(taskActions).toHaveLength(3);
    const channels = taskActions.map((a) => a.payload.channel).sort();
    expect(channels).toEqual(["email", "instagram", "landing_page"]);
    for (const task of taskActions) {
      expect(task.payload.deadline).toBe("2026-06-10");
      expect(typeof task.payload.title).toBe("string");
      expect(String(task.payload.title)).toContain("Luna Cafe");
    }

    const qaTask = result.actions.find((a) => a.type === "qa_review_task");
    expect(qaTask).toBeDefined();
    expect(qaTask?.payload.deadline).toBe("2026-06-10");

    for (const action of result.actions) {
      expect(action.status).toBe("completed");
    }

    expect(result.reviewItem).toBeNull();
    expect(db.actions).toHaveLength(4);
  });
});
