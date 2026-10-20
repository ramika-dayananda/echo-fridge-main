import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check, ChefHat, ChevronDown, Clock, RefreshCw, Sparkles, Star, Zap,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { GENERATION_STAGES } from "@/lib/fridge-ai";
import type { CookingWindow, Recipe, RescueRecipe } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

// ─── Generation loading state ─────────────────────────────────────────────────

export function GenerationState({ names }: { names: string[] }) {
  const stages = GENERATION_STAGES(names);
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(v + 1, stages.length - 1)), 700);
    return () => clearInterval(t);
  }, [stages.length]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ rotate: [0, 12, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="text-2xl"
          aria-hidden="true"
        >
          ⚡
        </motion.span>
        <h2 className="text-xl font-semibold sm:text-2xl">Building your Rescue Meals…</h2>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary/60">
        <motion.div
          initial={{ width: "5%" }}
          animate={{ width: "95%" }}
          transition={{ duration: 3.0, ease: "easeInOut" }}
          className="bg-gradient-primary h-full"
        />
      </div>

      <div aria-live="polite" className="mt-5 h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-primary"
          >
            {stages[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div
            key={n}
            className="h-32 animate-pulse rounded-2xl bg-[linear-gradient(90deg,var(--glass),var(--glass-strong),var(--glass))] bg-[length:200%_100%]"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single expandable Rescue Recipe card ─────────────────────────────────────

function RescueRecipeCard({
  recipe,
  index,
  onCookThis,
}: {
  recipe: RescueRecipe;
  index: number;
  onCookThis: (r: RescueRecipe) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cooked, setCooked] = useState(false);

  const difficultyColor = recipe.difficulty === "Easy" ? "text-fresh" : "text-soon";

  function handleCook() {
    setCooked(true);
    onCookThis(recipe);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 240, damping: 24 }}
    >
      <GlassCard
        interactive
        className={cn(
          "p-5 sm:p-6 transition-all duration-200",
          expanded ? "ring-1 ring-primary/40" : "",
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">
                Rescue Meal {index + 1}
              </span>
              <span className={cn("text-xs font-semibold", difficultyColor)}>
                {recipe.difficulty}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold leading-tight sm:text-xl">{recipe.name}</h3>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse recipe" : "Expand recipe"}
            className="glass flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-glass-strong"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="size-4" aria-hidden="true" />
            </motion.span>
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {recipe.time_minutes} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-3.5" aria-hidden="true" />
            {recipe.difficulty}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {recipe.description}
        </p>

        {/* Ingredients rescued tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.ingredients_used.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              <Check className="size-3" aria-hidden="true" />
              {name}
            </span>
          ))}
        </div>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="mt-5 border-t border-border pt-5 space-y-5">
                {/* Rescue reason */}
                <div className="rounded-2xl bg-primary/6 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">
                    Why this meal?
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/85">{recipe.rescue_reason}</p>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Instructions
                  </h4>
                  <ol className="space-y-2.5">
                    {recipe.steps.map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-3 text-sm"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground leading-relaxed pt-0.5">{s}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>

                {/* Extra ingredients */}
                {recipe.extra_ingredients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      You'll also need
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.extra_ingredients.map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCook}
            disabled={cooked}
            className={cn(
              "bg-gradient-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.97]",
              "disabled:opacity-70",
            )}
          >
            <ChefHat className="size-4" aria-hidden="true" />
            {cooked ? "✓ Ingredients Marked" : "⚡ Cook This"}
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Three-recipe results view ────────────────────────────────────────────────

export function RescipeResultCards({
  recipes,
  cookingWindow,
  onCookThis,
  onRetry,
}: {
  recipes: RescueRecipe[];
  cookingWindow: CookingWindow;
  onCookThis: (r: RescueRecipe) => void;
  onRetry: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            🍽️ Tonight&apos;s Rescue Meals
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
            3 meals built for {cookingWindow.label.toLowerCase()}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-glass-strong text-muted-foreground"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Start Over
        </button>
      </div>

      <div className="space-y-4">
        {recipes.map((r, i) => (
          <RescueRecipeCard key={r.id} recipe={r} index={i} onCookThis={onCookThis} />
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Recipes are AI-generated suggestions. Always apply your own food-safety judgement.
      </p>
    </div>
  );
}

// ─── Legacy single RecipeCard (kept for backward compat) ──────────────────────

export function RecipeCard({
  recipe,
  onCook,
  onRetry,
  cooked,
}: {
  recipe: Recipe;
  onCook: () => void;
  onRetry: () => void;
  cooked: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
    >
      <GlassCard strong className="p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          🍽️ Tonight&apos;s Rescue Meal
        </p>
        <h2 className="mt-2 text-2xl font-semibold sm:text-4xl">{recipe.title}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" /> {recipe.time}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4" aria-hidden="true" /> {recipe.window}
          </span>
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Ingredients rescued
            </h3>
            <ul className="mt-3 space-y-2">
              {recipe.rescued.map((r, i) => (
                <motion.li
                  key={r}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 260, damping: 24 }}
                  className="glass flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <Check className="size-4 text-fresh" aria-hidden="true" />
                  <span className="font-medium">{r}</span>
                </motion.li>
              ))}
            </ul>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Why this meal?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{recipe.why}</p>

            <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
              {recipe.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="font-semibold text-primary">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-secondary/35 p-6 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
              className="relative"
            >
              <span className="text-gradient font-display text-6xl font-bold">
                {recipe.rescued.length}
              </span>
            </motion.div>
            <p className="text-sm font-medium">ingredients rescued</p>

            <button
              onClick={onCook}
              disabled={cooked}
              className="bg-gradient-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-70"
            >
              <ChefHat className="size-4" aria-hidden="true" />
              {cooked ? "Cooking started" : "Start Cooking"}
            </button>
            <button
              onClick={onRetry}
              className="glass inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium hover:bg-glass-strong"
            >
              <RefreshCw className="size-4" aria-hidden="true" /> Try Another Meal
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Celebration overlay ──────────────────────────────────────────────────────

export function RescueCelebration({ count, show }: { count: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-6 backdrop-blur-md"
          role="alertdialog"
          aria-label="Food rescued"
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="glass-strong relative overflow-hidden rounded-3xl px-10 py-12 text-center"
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -120 - Math.random() * 90,
                  x: (i - 7) * 22,
                  scale: [0, 1, 0.6],
                }}
                transition={{ duration: 1.6, delay: i * 0.045 }}
                className="absolute bottom-10 left-1/2 size-2 rounded-full bg-primary"
              />
            ))}
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.2, repeat: 1 }}
              className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15"
            >
              <Zap className="size-8 fill-primary text-primary" aria-hidden="true" />
            </motion.div>
            <h2 className="mt-5 text-3xl font-semibold">⚡ Food Rescued!</h2>
            <p className="mt-2 text-muted-foreground">
              {count} ingredient{count === 1 ? "" : "s"} saved from going to waste.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
