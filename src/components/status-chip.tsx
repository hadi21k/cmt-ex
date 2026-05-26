import type { EventStatus } from "@/lib/workflow/types";

// Status chip per design.md §5. Five variants in a separate role layer
// from the brand pair. Primary lime never appears as a status color
// (it stays reserved for the One Primary CTA per screen). Pill shape,
// 4px x 12px padding, 14px label at weight 600.

const VARIANTS: Record<EventStatus, { bg: string; text: string; border: string; label: string }> = {
  received: {
    bg: "#ffffff",
    text: "#868685",
    border: "rgba(14, 15, 12, 0.10)",
    label: "Received",
  },
  processing: {
    bg: "#e8ebe6",
    text: "#0e0f0c",
    border: "rgba(14, 15, 12, 0.15)",
    label: "Processing",
  },
  completed: {
    bg: "rgba(46, 173, 75, 0.12)",
    text: "#054d28",
    border: "rgba(46, 173, 75, 0.40)",
    label: "Completed",
  },
  review_required: {
    bg: "rgba(255, 209, 26, 0.20)",
    text: "#4a3b1c",
    border: "rgba(255, 209, 26, 0.60)",
    label: "Needs review",
  },
  failed: {
    bg: "rgba(208, 50, 56, 0.12)",
    text: "#a7000d",
    border: "rgba(208, 50, 56, 0.40)",
    label: "Failed",
  },
};

interface StatusChipProps {
  status: EventStatus;
  label?: string;
}

export function StatusChip({ status, label }: StatusChipProps) {
  const variant = VARIANTS[status];
  const text = label ?? variant.label;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-0.5 text-[14px] font-semibold whitespace-nowrap"
      style={{
        backgroundColor: variant.bg,
        color: variant.text,
        border: `1px solid ${variant.border}`,
      }}
      aria-label={`Status: ${text}`}
    >
      {text}
    </span>
  );
}
