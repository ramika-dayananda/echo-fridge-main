import * as React from "react";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type GlassCardProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Pointer-following highlight + hover lift. */
  interactive?: boolean;
  strong?: boolean;
};

export function GlassCard({
  className,
  children,
  interactive = false,
  strong = false,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 0, active: false });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      {...(interactive
        ? {
            onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
              const r = ref.current?.getBoundingClientRect();
              if (!r) return;
              setPos({
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
                active: true,
              });
            },
            onPointerLeave: () => setPos((p) => ({ ...p, active: false })),
          }
        : {})}
      {...(interactive && !reduced ? { whileHover: { y: -4, scale: 1.008 } } : {})}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "glass-sheen relative overflow-hidden rounded-3xl",
        strong ? "glass-strong" : "glass",
        className,
      )}
      {...props}
    >
      {interactive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: pos.active ? 1 : 0,
            background: `radial-gradient(340px circle at ${pos.x}% ${pos.y}%, oklch(1 0 0 / 9%), transparent 70%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      {subtitle && <p className="max-w-xl text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
