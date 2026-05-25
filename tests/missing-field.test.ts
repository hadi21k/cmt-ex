import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

// Appendix A "Missing Required Field" payload — invoice_id absent.
const eventMissingInvoiceId: IncomingEvent = {
  source_event_id: "finance-002",
  source: "financeops",
  event_type: "invoice.overdue",
  payload: {
    customer_name: "Acme Trading",
    amount: 4200,
    currency: "USD",
    days_overdue: 17,
  },
};

describe("Missing required field (test 5)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("routes a FinanceOps event missing invoice_id to review", async () => {
    const result = await processEvent(eventMissingInvoiceId);

    expect(result.event.status).toBe("review_required");
    expect(result.actions).toHaveLength(0);

    expect(result.reviewItem).not.toBeNull();
    expect(result.reviewItem?.status).toBe("open");
    expect(result.reviewItem?.reason).toMatch(/^Missing required field/);
    expect(result.reviewItem?.reason).toContain("invoice_id");

    expect(db.events).toHaveLength(1);
    expect(db.review_queue_items).toHaveLength(1);
    expect(db.actions).toHaveLength(0);

    const messages = result.auditLogs.map((a) => a.message);
    expect(messages.some((m) => m.startsWith("Routed to review"))).toBe(true);
  });
});
