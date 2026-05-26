// Event detail loading state. Server Component fetches the event,
// then in parallel the actions + review item + audit logs. This
// skeleton renders instantly. Mirrors the page chrome: header + 3
// sections (Original payload, Generated actions, Audit timeline).

export default function EventDetailLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] animate-pulse flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-8 w-44 rounded-md bg-secondary" />
            <div className="h-6 w-24 rounded-full bg-secondary" />
          </div>
          <div className="h-4 w-72 rounded-md bg-secondary" />
          <div className="h-5 w-[50ch] max-w-full rounded-md bg-secondary" />
        </header>

        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className="flex flex-col gap-3">
            <div className="h-5 w-40 rounded-md bg-secondary" />
            <div
              className="rounded-lg bg-white p-4"
              style={{ border: "1px solid rgba(14, 15, 12, 0.08)" }}
            >
              <div className="flex flex-col gap-2">
                <div className="h-3 w-3/4 rounded-md bg-secondary" />
                <div className="h-3 w-2/3 rounded-md bg-secondary" />
                <div className="h-3 w-1/2 rounded-md bg-secondary" />
                <div className="h-3 w-3/5 rounded-md bg-secondary" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
