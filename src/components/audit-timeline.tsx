import type { AuditLog } from "@/lib/workflow/types";

// Audit timeline per design.md §5 (signature component). Vertical list,
// 1px brand-teal hairline trunk on the left, meta timestamp on the left
// column, body-strong message in center, optional metadata line below.
// No card wrapper — sits on the page tonal field directly.
// Spec §3: "audit timeline must be useful, not decorative."

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm" style={{ color: "rgba(0, 0, 0, 0.55)" }}>
        No audit entries yet.
      </p>
    );
  }

  return (
    <ol className="relative pl-6">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-[7px] w-px"
        style={{ backgroundColor: "#12536B" }}
      />
      {logs.map((log) => (
        <li key={log.id} className="relative pb-5 last:pb-0">
          <span
            aria-hidden
            className="absolute top-1.5 left-[3px] block h-2 w-2 rounded-full border"
            style={{ backgroundColor: "#FDFBF7", borderColor: "#12536B" }}
          />
          <time
            className="block text-[13px]"
            style={{ color: "rgba(46, 42, 57, 0.6)" }}
            dateTime={log.created_at}
          >
            {formatTime(log.created_at)}
          </time>
          <p
            className="mt-1 text-base font-medium"
            style={{ color: "#2E2A39" }}
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
      style={{ color: "rgba(46, 42, 57, 0.7)" }}
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
