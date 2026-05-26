import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import {
  type DashboardCounts,
  SectionCards,
} from "@/components/section-cards";
import { createClient } from "@/lib/supabase/server";
import type { Event, EventStatus } from "@/lib/workflow/types";

// Dashboard root. Spec §3: total / completed / needs review / failed
// counts come from stored data, never static placeholders, plus a
// recent-activity list.

export default async function DashboardPage() {
  const supabase = await createClient();

  const [statusRes, recentRes] = await Promise.all([
    supabase.from("events").select("status"),
    supabase
      .from("events")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const counts: DashboardCounts = {
    total: 0,
    received: 0,
    processing: 0,
    completed: 0,
    review_required: 0,
    failed: 0,
  };
  for (const row of (statusRes.data ?? []) as Array<{ status: EventStatus }>) {
    counts.total += 1;
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  const recent = (recentRes.data ?? []) as Event[];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <header className="flex flex-col gap-1 px-4 lg:px-6">
            <h1 className="text-[32px] leading-tight tracking-tight text-foreground">
              Dashboard
            </h1>
            <p
              className="text-sm"
              style={{ color: "rgba(14, 15, 12, 0.7)" }}
            >
              Operations across FinanceOps, CampaignOps, and GuestOps.
            </p>
          </header>
          <SectionCards counts={counts} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive recent={recent} />
          </div>
        </div>
      </div>
    </div>
  );
}
