import { PRIORITY_META, type Priority } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

const STYLES: Record<Priority, { dot: string; text: string; ring: string; symbol: string }> = {
  expired:     { dot: "bg-destructive",              text: "text-destructive",  ring: "bg-destructive/10",  symbol: "✕" },
  "use-first": { dot: "bg-urgent animate-urgent-pulse", text: "text-urgent",   ring: "bg-urgent/10",       symbol: "!" },
  "use-soon":  { dot: "bg-soon",                     text: "text-soon",        ring: "bg-soon/10",         symbol: "~" },
  fresh:       { dot: "bg-fresh",                    text: "text-fresh",       ring: "bg-fresh/10",        symbol: "✓" },
};

export function StatusBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const s = STYLES[priority];
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        s.ring,
        s.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden="true" />
      <span aria-hidden="true" className="opacity-70">
        {s.symbol}
      </span>
      <span className="sr-only">Status: </span>
      {meta.label}
    </span>
  );
}
