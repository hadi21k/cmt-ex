import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventStatus } from "@/lib/workflow/types";

// Four metric cards: total / completed / needs review / failed.
// Counts come from a Supabase aggregation in src/app/page.tsx.
// The numbers carry hierarchy via design.md `title` weight (700) so the
// metric reads loud against the description label, per spec §3 ("real
// counts, never placeholders").

export type DashboardCounts = Record<EventStatus | "total", number>;

const METRICS: Array<{
  key: keyof DashboardCounts;
  label: string;
  hint?: string;
}> = [
  { key: "total", label: "Total events" },
  { key: "completed", label: "Completed", hint: "auto-handled by the engine" },
  { key: "review_required", label: "Needs review", hint: "operator action required" },
  { key: "failed", label: "Failed", hint: "service errors" },
];

export function SectionCards({ counts }: { counts: DashboardCounts }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {METRICS.map(({ key, label, hint }) => (
        <Card key={key} className="@container/card">
          <CardHeader>
            <CardDescription className="text-[13px] tracking-[0.5px] uppercase">
              {label}
            </CardDescription>
            <CardTitle
              className="text-[40px] leading-none font-bold tabular-nums"
              style={{ color: "#0e0f0c" }}
            >
              {counts[key]}
            </CardTitle>
            {hint ? (
              <p
                className="mt-2 text-[13px]"
                style={{ color: "rgba(14, 15, 12, 0.6)" }}
              >
                {hint}
              </p>
            ) : null}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
