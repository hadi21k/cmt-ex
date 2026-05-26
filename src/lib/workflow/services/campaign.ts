import type { MockService, ServiceExecution } from "../types";

// mockCampaignService: pretends to create internal campaign tasks
// (think Asana, Trello, Notion). Spec 8.

export const mockCampaignService: MockService = async (action, event) => {
  if (event.payload.simulate_failure === true) {
    throw new Error("mockCampaignService failed: simulate_failure flag set");
  }

  switch (action.type) {
    case "create_campaign_task":
      return success({ task_title: action.payload.title });
    case "qa_review_task":
      return success({ qa_title: action.payload.title });
    default:
      return {
        ok: false,
        error: `mockCampaignService: unknown action type "${action.type}"`,
      };
  }
};

function success(result: Record<string, unknown>): ServiceExecution {
  return { ok: true, result };
}
