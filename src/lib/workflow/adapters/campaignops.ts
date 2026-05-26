import { z } from "zod";

import type { ActionSpec, StreamAdapter } from "../types";

// CampaignOps adapter. Handles `client_brief.received` events.
// Spec 5.B:
//   - One create_campaign_task action per channel.
//   - Sensible title.
//   - Deadline carried on each task.
//   - Optional bonus: final QA task. We implement it (decided in Phase 1).

const payloadSchema = z.object({
  client: z.string(),
  campaign_goal: z.string(),
  channels: z.array(z.string()).min(1),
  deadline: z.string(),
});

const channelLabel: Record<string, string> = {
  instagram: "Instagram creative",
  email: "Email copy",
  landing_page: "Landing page content",
};

export const campaignopsClientBriefAdapter: StreamAdapter = (event) => {
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
      reason: `Invalid CampaignOps payload: ${parsed.error.issues[0].message}`,
    };
  }

  const { client, channels, deadline } = parsed.data;

  const tasks: ActionSpec[] = channels.map((channel) => ({
    type: "create_campaign_task",
    payload: {
      title: `${channelLabel[channel] ?? channel} brief for ${client}`,
      channel,
      deadline,
    },
  }));

  // QA bonus task. Spec 5.B "Optional bonus: add a final QA task."
  const qaTask: ActionSpec = {
    type: "qa_review_task",
    payload: {
      title: `QA review for ${client} campaign`,
      deadline,
    },
  };

  return { kind: "actions", actions: [...tasks, qaTask] };
};
