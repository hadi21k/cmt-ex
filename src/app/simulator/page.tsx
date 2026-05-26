import { Simulator } from "./_simulator";

export default function SimulatorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-tight tracking-tight text-foreground">
            Event Simulator
          </h1>
          <p
            className="text-sm"
            style={{ color: "rgba(46, 42, 57, 0.7)" }}
          >
            Pick a sample, edit JSON, submit. The engine handles it the same
            way a real webhook payload would.
          </p>
        </header>
        <Simulator />
      </div>
    </div>
  );
}
