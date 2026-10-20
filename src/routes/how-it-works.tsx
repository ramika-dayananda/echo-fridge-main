import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Camera, ChefHat, Leaf, ListOrdered } from "lucide-react";
import { GlassCard } from "@/components/fridge/GlassCard";

const TITLE = "How FridgePulse Works ⚡";
const DESC =
  "Photograph groceries, get AI freshness estimates, pick a cooking window, and rescue the food closest to being wasted.";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    icon: Camera,
    title: "Snap & Stash",
    body: "One photo of your groceries. Vision AI identifies every item and logs it for you — no typing, no barcodes.",
  },
  {
    icon: ListOrdered,
    title: "Freshness ranking",
    body: "Each item gets an estimated freshness window and a priority: use first, use soon, or fresh. Your fridge re-sorts itself as the clock ticks.",
  },
  {
    icon: ChefHat,
    title: "Rescue meals",
    body: "Tell FridgePulse when you're cooking next. It builds a recipe around the ingredients closest to being wasted, and explains why.",
  },
  {
    icon: Leaf,
    title: "See the impact",
    body: "Every rescue adds up: kilograms saved, money kept, and a weekly streak that makes eating well feel like progress.",
  },
];

function HowItWorks() {
  return (
    <div className="space-y-10 pt-6">
      <header>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">How it works</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Four steps between a full fridge and a meal that saves it.
        </p>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 26 }}
          >
            <GlassCard interactive className="h-full p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12">
                <s.icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">
                {i + 1}. {s.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </GlassCard>
          </motion.li>
        ))}
      </ol>

      <GlassCard strong className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-xl font-semibold">Ready to rescue tonight&apos;s dinner?</p>
        <Link
          to="/"
          className="bg-gradient-primary inline-flex min-h-12 items-center justify-center rounded-2xl px-7 font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          📸 Snap &amp; Stash
        </Link>
      </GlassCard>

      <p className="text-xs text-muted-foreground">
        Freshness estimates are guidance only. Always follow package dates and food-safety
        recommendations.
      </p>
    </div>
  );
}
