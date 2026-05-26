"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { processEvent } from "@/lib/workflow/engine";
import type { ProcessResult } from "@/lib/workflow/types";

// Server Actions are reachable via direct POST, not just through our UI.
// Validate every field at the boundary regardless of UI guarantees.
// Spec 4 step 1 + security baseline.

// Spec 4 step 2 enumerates the four valid sources. Anything else is the
// upstream integration shipping garbage; reject at the boundary with a
// clear validation error rather than DB CHECK violation. `unknown` itself
// is a valid value - the engine routes it to review.
const incomingEventSchema = z.object({
  source_event_id: z.string().min(1).max(200),
  source: z.enum(["financeops", "campaignops", "guestops", "unknown"]),
  event_type: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()),
});

export type SubmitEventResult =
  | { ok: true; result: ProcessResult }
  | { ok: false; error: string };

export async function submitEvent(
  raw: unknown,
): Promise<SubmitEventResult> {
  const parsed = incomingEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; "),
    };
  }

  try {
    const result = await processEvent(parsed.data);

    if (result.existed) {
      // Operator-facing duplicate: surface as a validation error so the
      // simulator UI shows the red "Submission failed" banner instead of
      // pretending the submission succeeded. The engine's processEvent
      // still returns existed=true (no new data written) so any future
      // caller hitting it directly (e.g. a webhook handler retrying on a
      // network blip) keeps the retry-safe idempotent semantics. Only the
      // operator-facing entry point converts duplicate to error.
      return {
        ok: false,
        error: `An event with source_event_id "${parsed.data.source_event_id}" already exists. Edit the id to create a new event.`,
      };
    }

    revalidateTag("events", "max");
    revalidateTag("review-queue", "max");
    revalidateTag("dashboard", "max");
    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
