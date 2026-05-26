// Inbox route loading state. Server Component fetches up to 100 events
// (filtered by status / source from URL params); this skeleton renders
// instantly while that query runs. Mirrors the page chrome: title +
// filter chip groups + 3-column table.

export default function InboxLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex animate-pulse flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <div className="h-10 w-56 rounded-md bg-secondary" />
          <div className="h-4 w-40 rounded-md bg-secondary" />
        </header>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-16 rounded-md bg-secondary" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-md bg-secondary" />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-16 rounded-md bg-secondary" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-28 rounded-md bg-secondary" />
            ))}
          </div>
        </section>

        <div
          className="overflow-hidden rounded-xl bg-white"
          style={{ border: "1px solid rgba(14, 15, 12, 0.1)" }}
        >
          <div className="flex items-center gap-4 px-6 py-3" style={{ backgroundColor: "#e8ebe6" }}>
            <div className="h-4 flex-1 rounded-md bg-white/60" />
            <div className="h-4 w-20 rounded-md bg-white/60" />
            <div className="h-4 w-24 rounded-md bg-white/60" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4"
              style={{ borderTop: "1px solid rgba(14, 15, 12, 0.08)" }}
            >
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-3/5 rounded-md bg-secondary" />
                <div className="h-3 w-2/5 rounded-md bg-secondary" />
              </div>
              <div className="h-6 w-24 rounded-full bg-secondary" />
              <div className="h-3 w-20 rounded-md bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
