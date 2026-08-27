/**
 * Iconography is drawn to a single 24 × 24 grid at 1.4 stroke, so nothing
 * on the site reads as a borrowed icon set.
 */

interface MarkProps {
  className?: string;
  strokeWidth?: number;
}

const base = (className = "") => ({
  viewBox: "0 0 24 24",
  fill: "none",
  className,
  "aria-hidden": true as const,
  focusable: "false" as const,
});

export function SearchMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export function AccountMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth}>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}

export function WishMark({ className, strokeWidth = 1.4, filled = false }: MarkProps & { filled?: boolean }) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BagMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M4.5 7.5h15l-1 13h-13z" strokeLinejoin="round" />
      <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" strokeLinecap="round" />
    </svg>
  );
}

export function CloseMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function StarMark({ className, filled = true }: MarkProps & { filled?: boolean }) {
  return (
    <svg {...base(className)} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.2}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9L3.5 9.7l5.9-.8z" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckMark({ className, strokeWidth = 1.6 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function PlusMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

export function MenuMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M3.5 8h17M3.5 16h17" />
    </svg>
  );
}

export function ShieldMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round">
      <path d="M12 3.5l7 2.6v5.6c0 4-2.9 7.4-7 8.8-4.1-1.4-7-4.8-7-8.8V6.1z" />
      <path d="M9 12l2.2 2.2L15.5 10" strokeLinecap="round" />
    </svg>
  );
}

export function TruckMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round">
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3v2.5h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

export function ReturnMark({ className, strokeWidth = 1.4 }: MarkProps) {
  return (
    <svg {...base(className)} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9a8 8 0 1 1-.6 4.5" />
      <path d="M3.5 4.5V9H8" />
    </svg>
  );
}

/** The CHISSELED monogram — a chiselled C cut from a square. */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        d="M4 4h24v7.5h-6.2V10H10.2v12h11.6v-1.5H28V28H4z"
        fill="currentColor"
      />
      <path d="M28 13.5v5h-6.2v-5z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
