import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TODO: wire to Supabase events query in next implement.
//
// Real shape (server component):
//   const supabase = await createClient();
//   const { data } = await supabase
//     .from('events')
//     .select('status', { count: 'exact' });
//   const counts = countByStatus(data);
//
// Values stay at 0 until that's wired so the dashboard never shows
// fake numbers (spec §3: "numbers should come from stored data, not
// static placeholders").

type MetricKey = "total" | "completed" | "review_required" | "failed";

const METRICS: Array<{ key: MetricKey; label: string }> = [
  { key: "total", label: "Total events" },
  { key: "completed", label: "Completed" },
  { key: "review_required", label: "Needs review" },
  { key: "failed", label: "Failed" },
];

export function SectionCards() {
  const counts: Record<MetricKey, number> = {
    total: 0,
    completed: 0,
    review_required: 0,
    failed: 0,
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {METRICS.map(({ key, label }) => (
        <Card key={key} className="@container/card">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {counts[key]}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
