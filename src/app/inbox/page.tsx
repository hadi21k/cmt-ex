export default function InboxPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Event Inbox
          </h1>
          <p className="text-muted-foreground text-sm">
            List of received events with source, type, status, and a review
            flag. Filters land in the next implement.
          </p>
        </header>
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          Coming in the next implement plan. See spec §3 for the required
          columns and filters.
        </div>
      </div>
    </div>
  );
}
