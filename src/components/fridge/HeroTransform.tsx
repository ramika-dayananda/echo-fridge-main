import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import groceries from "@/assets/groceries.jpg";
import type { Priority } from "@/lib/fridge-data";

const RESULTS: { name: string; emoji: string; days: number; priority: Priority }[] = [
  { name: "Avocado", emoji: "🥑", days: 2, priority: "use-first" },
  { name: "Chicken", emoji: "🍗", days: 1, priority: "use-first" },
  { name: "Spinach", emoji: "🥬", days: 2, priority: "use-first" },
];

/** Looping "photo -> scan -> structured inventory" demo. */
export function HeroTransform() {
  const [step, setStep] = useState(0); // 0 photo, 1 scan, 2 cards

  useEffect(() => {
    const timings = [1600, 2400, 4200];
    const t = setTimeout(() => setStep((s) => (s + 1) % 3), timings[step]);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <GlassCard strong className="p-4 sm:p-5" aria-hidden="true">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img
          src={groceries}
          alt=""
          width={1024}
          height={768}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,oklch(0.16_0.032_285/85%)_100%)]" />

        <AnimatePresence>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="animate-scanline absolute inset-x-0 h-20 -translate-y-1/2 bg-[linear-gradient(180deg,transparent,oklch(0.83_0.15_58/28%),transparent)]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-primary shadow-[0_0_18px_2px_oklch(0.83_0.15_58/70%)]" />
              </div>
              <p className="absolute bottom-4 left-4 rounded-full bg-background/70 px-3 py-1.5 text-xs backdrop-blur-md">
                Identifying ingredients…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === 2 && (
            <motion.ul className="absolute inset-x-3 bottom-3 space-y-2">
              {RESULTS.map((r, i) => (
                <motion.li
                  key={r.name}
                  initial={{ opacity: 0, y: 22, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.16, type: "spring", stiffness: 260, damping: 22 }}
                  className="glass flex items-center gap-3 rounded-xl px-3 py-2.5"
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span className="flex-1 text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-muted-foreground">~{r.days}d</span>
                  <StatusBadge priority={r.priority} className="hidden sm:inline-flex" />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
