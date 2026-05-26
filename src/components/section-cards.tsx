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
// uppercase, no tracking). Labels carry the meaning. Each tile gets a
// semantic dot before the label so the four tiles read distinctly even
// when monochrome; counts > 0 on the actionable metrics (review,
// failed) render in their status color so the operator's eye lands on
// the urgency signals instead of treating all four tiles equally.

export type DashboardCounts = Record<EventStatus | "total", number>;

interface Metric {
  key: keyof DashboardCounts;
  label: string;
  dot: string;
  activeColor: string | null;
}

const METRICS: Metric[] = [
  {
    key: "total",
    label: "Total events",
    dot: "rgba(14, 15, 12, 0.35)",
    activeColor: null,
  },
  {
    key: "completed",
    label: "Completed",
    dot: "#2ead4b",
    activeColor: "#054d28",
  },
  {
    key: "review_required",
    label: "Needs review",
    dot: "#ffd11a",
    activeColor: "#4a3b1c",
  },
  {
    key: "failed",
    label: "Failed",
    dot: "#d03238",
    activeColor: "#a7000d",
  },
];

export function SectionCards({ counts }: { counts: DashboardCounts }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {METRICS.map(({ key, label, dot, activeColor }) => {
        const value = counts[key];
        const numberColor =
          activeColor && value > 0 ? activeColor : "#0e0f0c";
        return (
          <Card key={key} className="@container/card">
            <CardHeader>
              <CardDescription className="flex items-center gap-2 text-[14px] leading-5 font-semibold text-foreground/70">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: dot }}
                />
                {label}
              </CardDescription>
              <CardTitle
                className="text-[32px] leading-[1.2] font-semibold tabular-nums tracking-[-0.96px]"
                style={{ color: numberColor }}
              >
                {value}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
