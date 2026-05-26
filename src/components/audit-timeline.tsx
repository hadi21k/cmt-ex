import type { AuditLog } from "@/lib/workflow/types";

// Audit timeline per design.md 5 (signature component). Vertical list,
// 1px ink-at-25%-alpha hairline trunk on the left, body-md-strong
// message in center, optional metadata line below. No card wrapper,
// sits on the page tonal field directly. Spec 3: "audit timeline
// must be useful, not decorative."

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm" style={{ color: "rgba(14, 15, 12, 0.55)" }}>
        No audit entries yet.
      </p>
    );
  }

  return (
    <ol className="relative pl-7">
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-[7.5px] w-px"
        style={{ backgroundColor: "rgba(14, 15, 12, 0.25)" }}
      />
      {logs.map((log) => (
        <li key={log.id} className="relative pb-5 last:pb-0">
          <span
            aria-hidden
            className="absolute top-[6px] left-[-24px] block h-2 w-2 rounded-full border"
            style={{ backgroundColor: "#ffffff", borderColor: "#0e0f0c" }}
          />
          <time
            className="block text-[13px] tabular-nums"
            style={{ color: "rgba(14, 15, 12, 0.6)" }}
            dateTime={log.created_at}
          >
            {formatTime(log.created_at)}
          </time>
          <p
            className="mt-1 text-base font-medium"
            style={{ color: "#0e0f0c" }}
          >
            {log.message}
          </p>
          <MetadataLine metadata={log.metadata} />
        </li>
      ))}
    </ol>
  );
}

function MetadataLine({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  if (entries.length === 0) return null;

  return (
    <dl
      className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px]"
      style={{ color: "rgba(14, 15, 12, 0.7)" }}
    >
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt className="font-medium">{key}:</dt>
          <dd className="font-mono">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
