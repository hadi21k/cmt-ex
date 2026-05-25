export default function ReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Review Queue
          </h1>
          <p className="text-muted-foreground text-sm">
            Risky, ambiguous, or failed events waiting for an operator to
            approve, reject, edit, or resolve.
          </p>
        </header>
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          Coming in the next implement plan. View original, see reason,
          approve / reject / edit action, add notes, mark resolved
          (spec §6).
        </div>
      </div>
    </div>
  );
}
