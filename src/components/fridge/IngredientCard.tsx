import { motion } from "motion/react";
import { Check, Clock, Trash2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import type { Ingredient } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

export function IngredientCard({
  item,
  index = 0,
  expanded,
  onToggle,
  onRemove,
}: {
  item: Ingredient;
  index?: number;
  expanded?: boolean;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const edge =
    item.priority === "expired"
      ? "before:bg-destructive"
      : item.priority === "use-first"
        ? "before:bg-urgent"
        : item.priority === "use-soon"
          ? "before:bg-soon"
          : "before:bg-fresh";

  const barColor =
    item.priority === "expired"
      ? "bg-destructive"
      : item.priority === "use-first"
        ? "bg-urgent"
        : item.priority === "use-soon"
          ? "bg-soon"
          : "bg-fresh";

  const barWidth =
    item.daysLeft <= 0
      ? "0%"
      : `${Math.min(100, (item.daysLeft / 10) * 100)}%`;

  const daysLabel =
    item.daysLeft < 0
      ? `${Math.abs(item.daysLeft)}d overdue`
      : item.daysLeft === 0
        ? "Today"
        : `~${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"}`;

  return (
    <motion.div
      layout
      layoutId={`ingredient-${item.id}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: index * 0.05 }}
    >
      <GlassCard
        interactive
        role="button"
        tabIndex={0}
        aria-expanded={!!expanded}
        aria-label={`${item.name}, ${item.rescued ? "rescued" : `${item.daysLeft} days of estimated freshness`}`}
        onClick={() => onToggle?.(item.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.(item.id);
          }
        }}
        className={cn(
          "cursor-pointer p-4 sm:p-5",
          "before:absolute before:left-0 before:top-5 before:h-10 before:w-[3px] before:rounded-r-full before:opacity-80 before:content-['']",
          edge,
          item.rescued && "opacity-70",
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/60 text-2xl shadow-inner">
            <span aria-hidden="true">{item.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{item.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {item.category} · {item.qty}
                  {item.estimated && <span className="ml-1 opacity-60">(estimated)</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {item.rescued ? (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="inline-flex items-center gap-1 rounded-full bg-fresh/15 px-2.5 py-1 text-[11px] font-semibold text-fresh"
                  >
                    <Check className="size-3" aria-hidden="true" /> RESCUED
                  </motion.span>
                ) : (
                  <StatusBadge priority={item.priority} />
                )}
                {onRemove && (
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className={cn("font-medium", item.priority === "expired" && "text-destructive")}>
                {daysLabel}
              </span>
              <span className="text-xs text-muted-foreground">Estimated freshness</span>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: barWidth }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={cn("h-full rounded-full", barColor)}
              />
            </div>

            <motion.div
              initial={false}
              animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="overflow-hidden"
            >
              {item.priority === "expired" ? (
                <p className="pt-3 text-sm text-destructive/80">
                  This item is past its estimated freshness window. Consider removing it from your
                  fridge — FridgePulse will not include expired items in Rescue Meals.
                </p>
              ) : (
                <div className="pt-3 space-y-2">
                  {item.printedDateLabel && (
                    <p className="text-xs font-medium text-primary/80">
                      📅 {item.printedDateLabel}
                    </p>
                  )}
                  {item.freshnessReason ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.freshnessReason}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      FridgePulse estimates {item.daysLeft} day{item.daysLeft === 1 ? "" : "s"} of peak
                      quality left based on typical storage for {item.category.toLowerCase()}. Cook it
                      early in your next window to keep it out of the bin.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
