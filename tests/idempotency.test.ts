import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, makeMockSupabase, resetMockDb } from "./_helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeMockSupabase(),
}));

import { processEvent } from "@/lib/workflow/engine";
import type { IncomingEvent } from "@/lib/workflow/types";

const event: IncomingEvent = {
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

describe("Idempotency (test 4: duplicate source_event_id)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("does not create duplicate actions on re-submission", async () => {
    const first = await processEvent(event);
    expect(first.event.status).toBe("completed");
    expect(first.actions).toHaveLength(2);
    expect(db.events).toHaveLength(1);
    expect(db.actions).toHaveLength(2);

    const second = await processEvent(event);

    expect(second.event.id).toBe(first.event.id);
    expect(second.actions).toHaveLength(2);

    expect(db.events).toHaveLength(1);
    expect(db.actions).toHaveLength(2);
  });
});
