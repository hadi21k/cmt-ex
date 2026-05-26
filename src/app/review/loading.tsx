// Review queue loading state. Server Component fetches all open
// review_queue_items, then for each item queries the event + pending
// actions (N+1 pattern documented in README Next steps #10). This is
// the slowest route. The skeleton renders instantly. Mirrors the page
// chrome: header + split view (list of cards on the left, detail card
// on the right).

export default function ReviewLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] animate-pulse flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <div className="h-10 w-44 rounded-md bg-secondary" />
          <div className="h-4 w-32 rounded-md bg-secondary" />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-xl bg-white p-4"
                style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-4 w-24 rounded-md bg-secondary" />
                  <div className="h-6 w-20 rounded-full bg-secondary" />
                </div>
                <div className="h-4 w-32 rounded-md bg-secondary" />
                <div className="flex items-baseline justify-between gap-3">
                  <div className="h-3 w-28 rounded-md bg-secondary" />
                  <div className="h-3 w-12 rounded-md bg-secondary" />
                </div>
              </li>
            ))}
          </ul>

          <section
            className="overflow-hidden rounded-2xl bg-white"
            style={{ border: "1px solid rgba(14, 15, 12, 0.12)" }}
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-48 rounded-md bg-secondary" />
                  <div className="h-5 w-40 rounded-md bg-secondary" />
                </div>
                <div className="h-6 w-24 rounded-full bg-secondary" />
              </div>
              <div
                className="flex flex-col gap-2 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(255, 209, 26, 0.20)",
                  border: "1px solid rgba(255, 209, 26, 0.60)",
                }}
              >
                <div className="h-4 w-40 rounded-md bg-white/50" />
                <div className="h-4 w-2/3 rounded-md bg-white/50" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-44 rounded-md bg-secondary" />
                <div
                  className="rounded-lg p-3"
                  style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
                >
                  <div className="h-3 w-2/3 rounded-md bg-secondary" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded-md bg-secondary" />
                <div className="h-24 w-full rounded-lg bg-secondary" />
              </div>
            </div>
            <div
              className="flex flex-wrap items-center gap-2 px-6 py-4"
              style={{ borderTop: "1px solid rgba(14, 15, 12, 0.1)", backgroundColor: "rgba(14, 15, 12, 0.015)" }}
            >
              <div className="h-12 w-28 rounded-3xl bg-secondary" />
              <div className="h-10 w-24 rounded-xl bg-secondary" />
              <div className="h-12 w-36 rounded-3xl bg-secondary" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
