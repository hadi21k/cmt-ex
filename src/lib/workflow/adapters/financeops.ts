import { z } from "zod";

import type { ActionSpec, StreamAdapter } from "../types";

// FinanceOps adapter. Handles `invoice.overdue` events.
// Spec §5.A:
//   - Create a payment reminder action.
//   - Create a follow-up task.
//   - Priority `high` if days_overdue > 14, else `normal`.

const payloadSchema = z.object({
  invoice_id: z.string(),
  customer_name: z.string(),
  amount: z.number(),
  currency: z.string(),
  days_overdue: z.number().int(),
});

export const financeopsInvoiceOverdueAdapter: StreamAdapter = (event) => {
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
      reason: `Invalid FinanceOps payload: ${parsed.error.issues[0].message}`,
    };
  }

  const { invoice_id, customer_name, days_overdue } = parsed.data;
  const priority = days_overdue > 14 ? "high" : "normal";

  const actions: ActionSpec[] = [
    {
      type: "send_payment_reminder",
      payload: { target: customer_name, priority },
    },
    {
      type: "create_follow_up_task",
      payload: { invoice_id, priority },
    },
  ];

  return { kind: "actions", actions };
};
