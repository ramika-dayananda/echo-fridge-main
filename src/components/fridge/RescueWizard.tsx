import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, ChevronRight, X, Zap } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { GenerationState, RescipeResultCards } from "./RecipeCard";
import { generateRescipesMock } from "@/lib/fridge-ai";
import { COOK_TIME_META, CUISINES, type CookTime, type CookingWindow, type Cuisine, type Ingredient, type RescueRecipe } from "@/lib/fridge-data";
import { useFridge } from "@/store/fridge-store";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Ingredients",
  2: "Time",
  3: "Cuisine",
  4: "Rescue Meals",
};

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of 4`} role="status">
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <div
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            s === current ? "w-6 bg-primary" : s < current ? "w-3 bg-primary/50" : "w-3 bg-secondary/70",
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Ingredient selection ────────────────────────────────────────────

function Step1Ingredients({
  inventory,
  selected,
  onToggle,
  error,
}: {
  inventory: Ingredient[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  error: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold sm:text-2xl">What needs rescuing?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Urgent ingredients are pre-selected. Pick what you want to cook with.
      </p>

      <div className="mt-5 space-y-2.5">
        <AnimatePresence initial={false}>
          {inventory.map((item, i) => {
            const checked = selected.has(item.id);
            const isUrgent = item.priority === "use-first" || item.priority === "use-soon";
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 28 }}
                onClick={() => onToggle(item.id)}
                aria-pressed={checked}
                className={cn(
                  "relative w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
                  "flex items-center gap-3",
                  checked
                    ? "border-primary/50 bg-primary/8"
                    : "glass border-transparent hover:bg-glass-strong",
                )}
              >
                {/* Checkbox */}
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40",
                  )}
                  aria-hidden="true"
                >
                  {checked && <Check className="size-3" />}
                </span>

                <span className="text-lg" aria-hidden="true">{item.emoji}</span>

                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    ~{item.daysLeft} day{item.daysLeft === 1 ? "" : "s"} · {item.qty}
                  </span>
                </span>

                <StatusBadge priority={item.priority} />

                {isUrgent && !checked && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-urgent text-[9px] font-bold text-white" aria-hidden="true">
                    !
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {inventory.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No active ingredients in your fridge. Add some ingredients first.
          </p>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-3 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Step 2: Cooking time ─────────────────────────────────────────────────────

function Step2Time({
  selected,
  onSelect,
  error,
}: {
  selected: CookTime | null;
  onSelect: (v: CookTime) => void;
  error: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold sm:text-2xl">How much time have you got?</h2>
      <p className="mt-1 text-sm text-muted-foreground">We'll match your meal to your schedule.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["quick", "full"] as CookTime[]).map((ct) => {
          const meta = COOK_TIME_META[ct];
          const active = selected === ct;
          return (
            <motion.button
              key={ct}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(ct)}
              aria-pressed={active}
              className={cn(
                "relative rounded-2xl border p-6 text-left transition-colors",
                active
                  ? "border-primary/60 bg-primary/8"
                  : "glass border-transparent hover:bg-glass-strong",
              )}
            >
              {active && (
                <motion.span
                  layoutId="time-ring"
                  className="absolute inset-0 rounded-2xl border-2 border-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="text-3xl" aria-hidden="true">{meta.icon}</span>
              <p className="mt-3 text-base font-semibold">{meta.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-3 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Step 3: Cuisine ──────────────────────────────────────────────────────────

function Step3Cuisine({
  selected,
  onSelect,
  customValue,
  onCustomChange,
  error,
}: {
  selected: Cuisine | null;
  onSelect: (c: Cuisine) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  error: string;
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold sm:text-2xl">What are you craving?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose a cuisine for your rescue meals.</p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {CUISINES.map((c) => {
          const active = selected === c && !showCustom;
          return (
            <motion.button
              key={c}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setShowCustom(false);
                onSelect(c);
              }}
              aria-pressed={active}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-primary-foreground"
                  : "glass hover:bg-glass-strong text-foreground/85",
              )}
            >
              {active && (
                <motion.span
                  layoutId="cuisine-pill"
                  className="bg-gradient-primary absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{c}</span>
            </motion.button>
          );
        })}

        {/* Custom cuisine toggle */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setShowCustom(true);
            onSelect("");
          }}
          aria-pressed={showCustom}
          className={cn(
            "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
            showCustom
              ? "text-primary-foreground"
              : "glass hover:bg-glass-strong text-foreground/85",
          )}
        >
          {showCustom && (
            <motion.span
              layoutId="cuisine-pill"
              className="bg-gradient-primary absolute inset-0 rounded-full"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              aria-hidden="true"
            />
          )}
          <span className="relative z-10">Custom…</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <input
              autoFocus
              type="text"
              value={customValue}
              onChange={(e) => {
                onCustomChange(e.target.value);
                if (e.target.value.trim()) onSelect(e.target.value.trim());
              }}
              placeholder="e.g. Korean, Ethiopian, Fusion…"
              className={cn(
                "w-full rounded-xl border bg-secondary/40 px-4 py-3 text-sm",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/60",
                error ? "border-destructive/70" : "border-border",
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-3 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function RescueWizard({
  cookingWindow,
  onComplete,
  onCancel,
}: {
  cookingWindow: CookingWindow;
  onComplete: (rescuedIds: string[], count: number) => void;
  onCancel: () => void;
}) {
  const { activeInventory } = useFridge();

  // Step 1
  const [selected, setSelected] = useState<Set<string>>(() => {
    const urgent = new Set<string>(
      activeInventory
        .filter((i: Ingredient) => i.priority === "use-first" || i.priority === "use-soon")
        .map((i: Ingredient) => i.id),
    );
    return urgent;
  });
  const [step1Error, setStep1Error] = useState("");

  // Step 2
  const [cookTime, setCookTime] = useState<CookTime | null>(null);
  const [step2Error, setStep2Error] = useState("");

  // Step 3
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [customCuisine, setCustomCuisine] = useState("");
  const [step3Error, setStep3Error] = useState("");

  // Step 4
  const [recipes, setRecipes] = useState<RescueRecipe[]>([]);
  const [generating, setGenerating] = useState(false);

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleIngredient(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setStep1Error("");
  }

  async function advance() {
    if (step === 1) {
      if (selected.size === 0) {
        setStep1Error("Choose at least one ingredient to continue.");
        return;
      }
      setStep1Error("");
      goTo(2);
    } else if (step === 2) {
      if (!cookTime) {
        setStep2Error("Tell us how much time you have.");
        return;
      }
      setStep2Error("");
      goTo(3);
    } else if (step === 3) {
      const finalCuisine = cuisine === "" ? customCuisine.trim() : cuisine;
      if (!finalCuisine) {
        setStep3Error("Choose a cuisine or enter one.");
        return;
      }
      setStep3Error("");
      // Generate recipes
      goTo(4);
      setGenerating(true);
      try {
        const selectedItems = activeInventory.filter((i: Ingredient) => selected.has(i.id));
        const result = await generateRescipesMock(
          selectedItems,
          cookTime!,
          finalCuisine,
          cookingWindow,
        );
        setRecipes(result);
      } catch {
        // Fallback: show minimal safe recipes
        setRecipes(buildEmergencyFallback(activeInventory.filter((i: Ingredient) => selected.has(i.id))));
      } finally {
        setGenerating(false);
      }
    }
  }

  function back() {
    if (step === 1) {
      onCancel();
    } else {
      goTo((step - 1) as Step);
    }
  }

  function handleCookThis(recipe: RescueRecipe) {
    // Map ingredient names back to IDs for removal
    const namesToIds = Object.fromEntries(activeInventory.map((i: Ingredient) => [i.name.toLowerCase(), i.id] as [string, string]));
    const ids = recipe.ingredients_used
      .map((n) => namesToIds[n.toLowerCase()])
      .filter(Boolean) as string[];
    onComplete(ids.length > 0 ? ids : [...selected], recipe.ingredients_used.length);
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <GlassCard strong className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            aria-label="Go back"
            className="glass flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-glass-strong hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Step {step} of 4 — {STEP_LABELS[step]}
            </p>
            <StepDots current={step} />
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close wizard"
          className="glass flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-glass-strong hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {step === 1 && (
            <Step1Ingredients
              inventory={activeInventory}
              selected={selected}
              onToggle={toggleIngredient}
              error={step1Error}
            />
          )}
          {step === 2 && (
            <Step2Time
              selected={cookTime}
              onSelect={(v) => { setCookTime(v); setStep2Error(""); }}
              error={step2Error}
            />
          )}
          {step === 3 && (
            <Step3Cuisine
              selected={cuisine}
              onSelect={(c) => { setCuisine(c); setStep3Error(""); }}
              customValue={customCuisine}
              onCustomChange={setCustomCuisine}
              error={step3Error}
            />
          )}
          {step === 4 && generating && (
            <GenerationState names={activeInventory.filter((i: Ingredient) => selected.has(i.id)).map((i: Ingredient) => i.name)} />
          )}
          {step === 4 && !generating && recipes.length > 0 && (
            <RescipeResultCards
              recipes={recipes}
              cookingWindow={cookingWindow}
              onCookThis={handleCookThis}
              onRetry={() => {
                goTo(1);
                setRecipes([]);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* CTA — hidden on step 4 */}
      {step < 4 && (
        <div className="mt-7">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void advance()}
            className="bg-gradient-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold text-primary-foreground"
          >
            {step === 3 ? (
              <>
                <Zap className="size-4 fill-current" aria-hidden="true" />
                Generate Rescue Meals
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="size-4" aria-hidden="true" />
              </>
            )}
          </motion.button>
        </div>
      )}
    </GlassCard>
  );
}

// ─── Emergency fallback ───────────────────────────────────────────────────────

function buildEmergencyFallback(ingredients: Ingredient[]): RescueRecipe[] {
  const names = ingredients.map((i: Ingredient) => i.name);
  const [a = "Protein", b = "Vegetable"] = names;
  return [
    {
      id: "fb-0",
      name: `${a} Stir-fry`,
      time_minutes: 15,
      difficulty: "Easy",
      description: `A quick stir-fry using ${a} and ${b} — simple, satisfying, and waste-free.`,
      ingredients_used: names.slice(0, 2),
      extra_ingredients: ["Oil", "Soy sauce", "Garlic", "Rice"],
      steps: [
        `Prep and season ${a}.`,
        "Heat oil in a pan or wok over high heat.",
        `Add ${a}, cook 4 minutes, then add ${b}.`,
        "Season with soy sauce and garlic. Serve over rice.",
      ],
      rescue_reason: `${a} is at the top of your freshness priority list — this stir-fry uses it before it goes to waste.`,
    },
    {
      id: "fb-1",
      name: `${a} & ${b} Wrap`,
      time_minutes: 12,
      difficulty: "Easy",
      description: `A no-fuss wrap that rescues ${a} and ${b} in under 15 minutes.`,
      ingredients_used: names.slice(0, 2),
      extra_ingredients: ["Wraps", "Sauce of choice", "Cheese"],
      steps: [
        `Cook ${a} in a pan with a little oil.`,
        `Warm the wrap. Layer ${a} and ${b}.`,
        "Add sauce and roll tightly. Serve immediately.",
      ],
      rescue_reason: `Quick, reliable, and designed to use what you have on hand.`,
    },
    {
      id: "fb-2",
      name: `${a} Bowl`,
      time_minutes: 20,
      difficulty: "Easy",
      description: `A flexible bowl recipe built around ${a} — works with any sides you have.`,
      ingredients_used: [a],
      extra_ingredients: ["Cooked grain", "Dressing", "Any fresh vegetables"],
      steps: [
        `Season and cook ${a} until done.`,
        "Prepare a grain base (rice, quinoa, or couscous).",
        `Build bowls: grain, ${a}, any other fresh items.`,
        "Drizzle with your favourite dressing.",
      ],
      rescue_reason: `Flexible bowl format — perfect for rescuing ${a} along with whatever else is in your fridge.`,
    },
  ];
}
