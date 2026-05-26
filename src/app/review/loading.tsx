// Review queue loading state. Server Component fetches all open review
// items + their events + pending/failed actions in one PostgREST embed,
// then the client shell renders the queue-and-detail split view. This
// skeleton renders instantly. Mirrors the new chrome: page title with
// queue summary, denser list cards (label + id + reason preview + age),
// split-view, detail card with header band, reason banner, pending
// actions cluster, and one decide deck at the bottom.

export default function ReviewLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] animate-pulse flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-10 w-44 rounded-md bg-secondary" />
            <div className="h-4 w-[55ch] max-w-full rounded-md bg-secondary" />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="h-7 w-6 rounded-md bg-secondary" />
            <div className="h-5 w-56 rounded-md bg-secondary" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-xl bg-white p-4"
                style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="h-4 w-32 rounded-md bg-secondary" />
                    <div className="h-4 w-24 rounded-md bg-secondary" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-secondary" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-full rounded-md bg-secondary" />
                  <div className="h-3 w-4/5 rounded-md bg-secondary" />
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: "rgba(14, 15, 12, 0.25)" }}
                  />
                  <div className="h-3 w-14 rounded-md bg-secondary" />
                </div>
              </li>
            ))}
          </ul>

          <section
            className="overflow-hidden rounded-2xl bg-white"
            style={{ border: "1px solid rgba(14, 15, 12, 0.12)" }}
          >
            <div
              className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5"
              style={{ borderColor: "rgba(14, 15, 12, 0.10)" }}
            >
              <div className="flex flex-col gap-2">
                <div className="h-4 w-44 rounded-md bg-secondary" />
                <div className="h-6 w-40 rounded-md bg-secondary" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-32 rounded-md bg-secondary" />
                <div className="h-6 w-20 rounded-full bg-secondary" />
              </div>
            </div>

            <div className="flex flex-col gap-5 px-6 py-6">
              <div
                className="flex flex-col gap-2 rounded-xl px-5 py-4"
                style={{
                  backgroundColor: "rgba(255, 209, 26, 0.20)",
                  border: "1px solid rgba(255, 209, 26, 0.60)",
                }}
              >
                <div className="h-3 w-32 rounded-md bg-white/50" />
                <div className="h-5 w-2/3 rounded-md bg-white/50" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <div className="h-4 w-36 rounded-md bg-secondary" />
                  <div className="h-3 w-6 rounded-md bg-secondary" />
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white p-3"
                    style={{ border: "1px solid rgba(14, 15, 12, 0.12)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 rounded-md bg-secondary" />
                      <div className="h-4 w-24 rounded-md bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex flex-col overflow-hidden rounded-xl"
                style={{ border: "1px solid rgba(14, 15, 12, 0.18)" }}
              >
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <div className="h-4 w-16 rounded-md bg-secondary" />
                    <div className="h-3 w-48 rounded-md bg-secondary" />
                  </div>
                  <div className="h-20 w-full rounded-md bg-secondary" />
                </div>
                <div
                  className="flex flex-wrap items-center gap-2 border-t px-5 py-4"
                  style={{
                    borderColor: "rgba(14, 15, 12, 0.10)",
                    backgroundColor: "rgba(14, 15, 12, 0.02)",
                  }}
                >
                  <div className="h-12 w-28 rounded-3xl bg-secondary" />
                  <div className="h-10 w-20 rounded-xl bg-secondary" />
                  <div className="h-12 w-36 rounded-3xl bg-secondary" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
