import { motion, useReducedMotion } from "motion/react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function RescueButton({
  onClick,
  loading,
  className,
}: {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      onClick={onClick}
      disabled={!!loading}
      {...(reduced ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.965 } })}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={cn(
        "group bg-gradient-primary relative w-full overflow-hidden rounded-2xl px-8 py-5 text-lg font-semibold text-primary-foreground",
        "shadow-[0_18px_50px_-18px_oklch(0.7_0.19_355/60%)] disabled:opacity-80 sm:w-auto",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="animate-energy absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/45%),transparent)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 120%, oklch(1 0 0 / 30%), transparent 60%)" }}
      />
      <span className="relative z-10 inline-flex items-center gap-2.5">
        <Zap className="size-5 fill-current" aria-hidden="true" />
        {loading ? "Rescuing…" : "Rescue My Food"}
      </span>
    </motion.button>
  );
}
