export default function SimulatorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Event Simulator
          </h1>
          <p className="text-muted-foreground text-sm">
            Pick a sample event, edit JSON, submit, and see the result. The
            simulate-failure toggle lives here too.
          </p>
        </header>
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          Coming in the next implement plan. Sample-event dropdown, JSON
          editor, submit button, result preview, simulate-failure toggle
          (spec §9).
        </div>
      </div>
    </div>
  );
}
