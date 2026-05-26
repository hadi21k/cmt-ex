import { Simulator } from "./_simulator";

export default function SimulatorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[40px] leading-[1.1] font-black tracking-tight text-foreground">
            Event Simulator
          </h1>
          <p
            className="max-w-[65ch] text-sm leading-5"
            style={{ color: "rgba(14, 15, 12, 0.7)" }}
          >
            Pick a sample, edit JSON, submit. The same code path runs when a real upstream webhook sends an event.
          </p>
        </header>
        <Simulator />
      </div>
    </div>
  );
}
