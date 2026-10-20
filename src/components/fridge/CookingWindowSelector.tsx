import { motion } from "motion/react";
import { CalendarClock, Sparkles } from "lucide-react";
import { COOKING_WINDOWS, type CookingWindow } from "@/lib/fridge-data";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

export function CookingWindowSelector({
  value,
  onChange,
  atRiskCount,
}: {
  value: CookingWindow;
  onChange: (w: CookingWindow) => void;
  atRiskCount: number;
}) {
  return (
    <GlassCard className="p-5 sm:p-7">
      <h2 className="text-xl font-semibold sm:text-2xl">When are you cooking next?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        FridgePulse matches your window against the ingredients most at risk.
      </p>

      <div
        role="radiogroup"
        aria-label="Cooking window"
        className="mt-5 flex flex-wrap gap-2.5"
      >
        {COOKING_WINDOWS.map((w) => {
          const active = w.id === value.id;
          return (
            <button
              key={w.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(w)}
              className={cn(
                "relative min-h-11 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                "glass hover:bg-glass-strong active:scale-[0.97]",
                active ? "text-primary-foreground" : "text-foreground/85",
              )}
            >
              {active && (
                <motion.span
                  layoutId="window-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="bg-gradient-primary absolute inset-0 rounded-full"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{w.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Next cooking window
            </p>
            <motion.p
              key={value.detail}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold"
            >
              {value.detail}
            </motion.p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-primary">
          <Sparkles className="size-4 animate-pulse" aria-hidden="true" />
          Matching {atRiskCount} at-risk ingredient{atRiskCount === 1 ? "" : "s"}
        </p>
      </div>
    </GlassCard>
  );
}
