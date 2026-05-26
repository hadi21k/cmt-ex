import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventStatus } from "@/lib/workflow/types";

// Four metric cards: total / completed / needs review / failed. Counts
// come from a Supabase aggregation in src/app/page.tsx. Per design.md
// the metric number uses display-sm (32 px weight 600, -0.96 px
// tracking); the label uses body-sm-strong (14 px weight 600, no
// uppercase, no tracking). Labels carry the meaning; no hint subtitles
// (the chip vocabulary on Recent Activity does the explaining). Spec
// §3: "real counts, never placeholders."

export type DashboardCounts = Record<EventStatus | "total", number>;

const METRICS: Array<{
  key: keyof DashboardCounts;
  label: string;
}> = [
  { key: "total", label: "Total events" },
  { key: "completed", label: "Completed" },
  { key: "review_required", label: "Needs review" },
  { key: "failed", label: "Failed" },
];

export function SectionCards({ counts }: { counts: DashboardCounts }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {METRICS.map(({ key, label }) => (
        <Card key={key} className="@container/card">
          <CardHeader>
            <CardDescription className="text-[14px] leading-5 font-semibold text-foreground/70">
              {label}
            </CardDescription>
            <CardTitle className="text-[32px] leading-[1.2] font-semibold tabular-nums tracking-[-0.96px] text-foreground">
              {counts[key]}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
