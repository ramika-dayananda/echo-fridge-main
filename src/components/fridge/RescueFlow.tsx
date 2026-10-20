import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CookingWindowSelector } from "./CookingWindowSelector";
import { RescueButton } from "./RescueButton";
import { RescueCelebration } from "./RecipeCard";
import { RescueWizard } from "./RescueWizard";
import { useFridge } from "@/store/fridge-store";

type WizardPhase = "idle" | "wizard" | "done";

export function RescueFlow() {
  const fridgeCtx = useFridge();
  const { atRisk, setWindow, rescueByIds } = fridgeCtx;
  const cookingWindow = fridgeCtx.window;
  const [phase, setPhase] = useState<WizardPhase>("idle");
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);

  function handleWizardComplete(rescuedIds: string[], count: number) {
    // Run rescue first (removes items, updates impact)
    rescueByIds(rescuedIds);
    setCelebrateCount(count);
    // Show celebration overlay while wizard is still mounted
    setCelebrate(true);
    // After celebration completes, transition to done screen
    setTimeout(() => {
      setCelebrate(false);
      setPhase("done");
    }, 2600);
  }

  function handleWizardCancel() {
    setPhase("idle");
  }

  return (
    <section id="rescue" aria-labelledby="rescue-title" className="scroll-mt-28 space-y-6">
      <CookingWindowSelector value={cookingWindow} onChange={setWindow} atRiskCount={atRisk.length} />

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-sheen glass flex flex-col items-center gap-4 rounded-3xl p-7 text-center sm:p-10"
          >
            <h2 id="rescue-title" className="sr-only">
              Rescue my food
            </h2>
            <RescueButton onClick={() => setPhase("wizard")} />
            <p className="max-w-sm text-sm text-muted-foreground">
              Build {cookingWindow.label.toLowerCase()}&apos;s meal around what needs saving first.
            </p>
          </motion.div>
        )}

        {phase === "wizard" && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            <RescueWizard
              cookingWindow={cookingWindow}
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            id="rescue-result"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-sheen glass flex flex-col items-center gap-4 rounded-3xl p-7 text-center sm:p-10"
          >
            <span className="text-4xl" aria-hidden="true">🥗</span>
            <h2 className="text-xl font-semibold">All done — nice rescue!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your ingredients are marked as used and your impact has been updated.
            </p>
            <button
              onClick={() => setPhase("idle")}
              className="bg-gradient-primary inline-flex min-h-11 items-center justify-center rounded-2xl px-7 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              Rescue Another Meal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <RescueCelebration count={celebrateCount} show={celebrate} />
    </section>
  );
}
