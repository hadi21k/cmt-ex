import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TODO: wire to Supabase audit_logs (or events ordered by created_at) in
// next implement. Spec §3 requires "recent activity" on the dashboard.
//
// Real shape (server component):
//   const supabase = await createClient();
//   const { data: recent } = await supabase
//     .from('events')
//     .select('id, source, event_type, status, created_at')
//     .order('created_at', { ascending: false })
//     .limit(10);
//
// The demo block shipped a 90-day chart here; that's a future enhancement,
// not on the critical path. Empty list is the honest scaffold.

export function ChartAreaInteractive() {
  const recent: Array<{ id: string; source: string; status: string }> = [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          The ten most recent events across all streams.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No events yet. Submit one in the simulator to populate the timeline.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((event) => (
              <li key={event.id}>
                {event.source} — {event.status}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
