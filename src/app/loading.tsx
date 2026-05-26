// Dashboard route loading state. Server Component fetches the four
// status counts + the ten most recent events; this skeleton renders
// instantly while those queries run. Mirrors the real chrome
// (header + four KPI tiles + recent activity card) so the layout
// doesn't shift on hydration.

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex animate-pulse flex-col gap-4 py-4 md:gap-6 md:py-6">
          <header className="flex flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
            <div className="flex flex-col gap-2">
              <div className="h-10 w-48 rounded-md bg-secondary" />
              <div className="h-4 w-[60ch] max-w-full rounded-md bg-secondary" />
              <div className="h-4 w-[40ch] max-w-full rounded-md bg-secondary" />
            </div>
            <div className="h-12 w-44 shrink-0 rounded-3xl bg-secondary" />
          </header>
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-xl bg-white p-6"
                style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full bg-secondary"
                  />
                  <div className="h-4 w-24 rounded-md bg-secondary" />
                </div>
                <div className="h-9 w-16 rounded-md bg-secondary" />
              </div>
            ))}
          </div>
          <div className="px-4 lg:px-6">
            <div
              className="flex flex-col gap-3 rounded-xl bg-white p-6"
              style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-32 rounded-md bg-secondary" />
                  <div className="h-3 w-64 rounded-md bg-secondary" />
                </div>
                <div className="h-7 w-32 rounded-md bg-secondary" />
              </div>
              <div className="flex flex-col gap-3 pt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 flex-1 rounded-md bg-secondary" />
                    <div className="h-6 w-20 rounded-full bg-secondary" />
                    <div className="h-3 w-12 rounded-md bg-secondary" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
