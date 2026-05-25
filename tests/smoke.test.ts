import { describe, expect, it } from "vitest";

import type { EventSource, EventStatus } from "@/lib/workflow/types";

describe("smoke", () => {
  it("loads workflow types via the @/ path alias", () => {
    const status: EventStatus = "received";
    const source: EventSource = "financeops";

    expect(status).toBe("received");
    expect(source).toBe("financeops");
  });
});
