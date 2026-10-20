import { motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Flame } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { CountUp } from "./CountUp";
import { IMPACT_TREND, STREAK_WEEKS } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

export function ImpactMetric({
  value,
  label,
  decimals = 0,
  prefix = "",
  suffix = "",
  index = 0,
}: {
  value: number;
  label: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 240, damping: 26, delay: index * 0.07 }}
    >
      <GlassCard interactive className="p-5">
        <p className="text-gradient font-display text-3xl font-bold sm:text-4xl">
          <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
      </GlassCard>
    </motion.div>
  );
}

export function RescueScore({ score }: { score: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <GlassCard className="flex flex-col items-center p-6 sm:p-7">
      <p className="text-sm font-medium text-muted-foreground">This month&apos;s Rescue Score</p>
      <div className="relative mt-4 size-40">
        <svg viewBox="0 0 150 150" className="size-full -rotate-90" role="img" aria-label={`Rescue score ${score} out of 100`}>
          <circle cx="75" cy="75" r={r} fill="none" strokeWidth="10" className="stroke-secondary/70" />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--lime)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="75"
            cy="75"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="url(#scoreGrad)"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c - (score / 100) * c }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold">
            <CountUp value={score} />
          </span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-fresh">Better than last week ↑</p>
    </GlassCard>
  );
}

export function TrendChart() {
  return (
    <GlassCard className="p-5 sm:p-6">
      <p className="text-sm font-medium">Food rescued over time</p>
      <p className="text-xs text-muted-foreground">Last 6 weeks</p>
      <div className="mt-4 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={IMPACT_TREND} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
              }}
            />
            <Area
              type="monotone"
              dataKey="rescued"
              stroke="var(--lime)"
              strokeWidth={2.5}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

export function RescueStreak() {
  const weeks = STREAK_WEEKS.filter(Boolean).length;
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-amber/15">
          <Flame className="size-5 text-amber" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold">🔥 {weeks} Week Rescue Streak</p>
          <p className="text-sm text-muted-foreground">
            You saved food every week this month.
          </p>
        </div>
      </div>
      <ul className="mt-5 flex gap-2" aria-label="Weekly rescue activity">
        {STREAK_WEEKS.map((done, i) => (
          <li key={i} className="flex-1">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
              className={cn(
                "h-2 origin-left rounded-full",
                done ? "bg-gradient-primary" : "bg-secondary/70",
              )}
            />
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              W{i + 1}
              <span className="sr-only">{done ? " completed" : " missed"}</span>
            </p>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
