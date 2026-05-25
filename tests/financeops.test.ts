import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

const validFinanceOpsEvent: IncomingEvent = {
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
};

describe("FinanceOps workflow (test 1: happy path)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("processes a valid invoice.overdue event end-to-end", async () => {
    const result = await processEvent(validFinanceOpsEvent);

    expect(result.event.status).toBe("completed");
    expect(result.event.source).toBe("financeops");
    expect(result.event.event_type).toBe("invoice.overdue");

    expect(result.actions).toHaveLength(2);
    const types = result.actions.map((a) => a.type).sort();
    expect(types).toEqual(["create_follow_up_task", "send_payment_reminder"]);
    for (const action of result.actions) {
      expect(action.status).toBe("completed");
      expect(action.payload.priority).toBe("high");
    }

    expect(result.reviewItem).toBeNull();

    expect(result.auditLogs.length).toBeGreaterThanOrEqual(4);
    const messages = result.auditLogs.map((a) => a.message);
    expect(messages).toContain("Event received");
    expect(messages).toContain("Event completed");

    expect(db.events).toHaveLength(1);
    expect(db.actions).toHaveLength(2);
    expect(db.review_queue_items).toHaveLength(0);
  });

  it("sets priority normal when days_overdue <= 14", async () => {
    resetMockDb();
    const result = await processEvent({
      ...validFinanceOpsEvent,
      source_event_id: "finance-001-normal",
      payload: { ...validFinanceOpsEvent.payload, days_overdue: 10 },
    });

    expect(result.event.status).toBe("completed");
    for (const action of result.actions) {
      expect(action.payload.priority).toBe("normal");
    }
  });
});
