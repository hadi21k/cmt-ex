// Next 16: route params are now async (Promise-returning). Pre-15 sync
// access is fully removed. Always `await props.params`.

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Event Detail
          </h1>
          <p className="text-muted-foreground text-sm">
            Event id: <span className="font-mono">{id}</span>
          </p>
        </header>
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          Coming in the next implement plan. Original payload, detected stream,
          generated actions, exec status, review reason, and the audit timeline
          (spec §3 + §6).
        </div>
      </div>
    </div>
  );
}
