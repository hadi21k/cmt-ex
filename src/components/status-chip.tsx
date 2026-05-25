import type { EventStatus } from "@/lib/workflow/types";

// Status chip per design.md §5. Five variants, each in its own role
// layer so the brand pair (teal + orange) is reserved for identity +
// CTA only. Pill shape (20px radius), 4px×12px padding, 13px label,
// no orange on `failed` (failed is red, orange is the next action).

const VARIANTS: Record<EventStatus, { bg: string; text: string; label: string }> = {
  received: {
    bg: "rgba(46, 42, 57, 0.08)",
    text: "#2E2A39",
    label: "Received",
  },
  processing: {
    bg: "rgba(18, 83, 107, 0.12)",
    text: "#12536B",
    label: "Processing",
  },
  completed: {
    bg: "rgba(34, 134, 81, 0.12)",
    text: "#226051",
    label: "Completed",
  },
  review_required: {
    bg: "rgba(202, 138, 4, 0.14)",
    text: "#854D0E",
    label: "Needs review",
  },
  failed: {
    bg: "rgba(180, 35, 24, 0.12)",
    text: "#8B1F12",
    label: "Failed",
  },
};

interface StatusChipProps {
  status: EventStatus;
  label?: string;
}

export function StatusChip({ status, label }: StatusChipProps) {
  const variant = VARIANTS[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-0.5 text-[13px] font-medium tracking-normal whitespace-nowrap"
      style={{ backgroundColor: variant.bg, color: variant.text }}
    >
      {label ?? variant.label}
    </span>
  );
}
