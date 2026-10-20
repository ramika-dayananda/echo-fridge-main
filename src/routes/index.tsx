import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Camera } from "lucide-react";
import { HeroTransform } from "@/components/fridge/HeroTransform";
import { UploadScanner } from "@/components/fridge/UploadScanner";
import { InventorySection } from "@/components/fridge/InventorySection";
import { RescueFlow } from "@/components/fridge/RescueFlow";
import { ImpactSection } from "@/components/fridge/ImpactSection";
import { useFridge } from "@/store/fridge-store";

const TITLE = "FridgePulse ⚡ — Your food. Before it's too late.";
const DESC =
  "An AI kitchen copilot that photographs your groceries, estimates freshness, and builds meals around what needs saving first.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Index() {
  const { addIngredients } = useFridge();

  return (
    <div className="space-y-20 sm:space-y-24">
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
        >
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary">
            AI kitchen copilot · Zero-waste by default
          </p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.03] sm:text-6xl lg:text-7xl">
            Your food.
            <br />
            <span className="text-gradient">Before it&apos;s too late.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Turn forgotten groceries into meals with an AI kitchen copilot that knows what to use
            first.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#snap"
              className="bg-gradient-primary inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl px-7 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.97]"
            >
              <Camera className="size-5" aria-hidden="true" /> Snap &amp; Stash
            </a>
            <Link
              to="/inventory"
              className="glass inline-flex min-h-13 items-center justify-center rounded-2xl px-7 text-base font-semibold hover:bg-glass-strong"
            >
              View Inventory
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 24 }}
        >
          <HeroTransform />
        </motion.div>
      </section>

      <UploadScanner onDetected={addIngredients} />
      <InventorySection />
      <RescueFlow />
      <ImpactSection />
    </div>
  );
}
