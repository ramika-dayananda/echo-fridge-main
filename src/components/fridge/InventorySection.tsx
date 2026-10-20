import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Info, Plus, X } from "lucide-react";
import { IngredientCard } from "./IngredientCard";
import { GlassCard } from "./GlassCard";
import { useFridge } from "@/store/fridge-store";
import type { Ingredient } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

function AddIngredientForm({ onAdd }: { onAdd: (name: string, days: number) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [nameError, setNameError] = useState("");
  const [daysError, setDaysError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) { setNameError("Enter an ingredient name."); valid = false; }
    const d = Number(days);
    if (days === "" || isNaN(d) || !Number.isInteger(d)) { setDaysError("Enter a valid number of days."); valid = false; }
    if (!valid) return;
    onAdd(name.trim(), d);
    setName(""); setDays(""); setNameError(""); setDaysError(""); setOpen(false);
  }

  function cancel() {
    setOpen(false); setName(""); setDays(""); setNameError(""); setDaysError("");
  }

  return (
    <div>
      {!open ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(true)}
          className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-primary hover:bg-glass-strong"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Ingredient
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <GlassCard className="p-4 sm:p-5">
            <form onSubmit={submit} noValidate>
              <h3 className="mb-4 text-sm font-semibold text-foreground/90">Add ingredient</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label htmlFor="ing-name" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Ingredient name
                  </label>
                  <input
                    id="ing-name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    placeholder="e.g. Chicken Breast"
                    className={cn(
                      "w-full rounded-xl border bg-secondary/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/60",
                      nameError ? "border-destructive/70" : "border-border",
                    )}
                  />
                  {nameError && (
                    <p role="alert" className="mt-1 text-xs text-destructive">
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="w-full sm:w-36">
                  <label htmlFor="ing-days" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Days of freshness
                  </label>
                  <input
                    id="ing-days"
                    type="number"
                    min={-30}
                    max={365}
                    value={days}
                    onChange={(e) => {
                      setDays(e.target.value);
                      setDaysError("");
                    }}
                    placeholder="e.g. 3"
                    className={cn(
                      "w-full rounded-xl border bg-secondary/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/60",
                      daysError ? "border-destructive/70" : "border-border",
                    )}
                  />
                  {daysError && (
                    <p role="alert" className="mt-1 text-xs text-destructive">
                      {daysError}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="bg-gradient-primary flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97] sm:flex-none"
                >
                  Add to Fridge
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="glass rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-glass-strong"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

export function InventorySection() {
  const { sorted, atRisk, addIngredientManual, removeIngredient } = useFridge();
  const [open, setOpen] = useState<string | null>(null);

  const expired = sorted.filter((i: Ingredient) => i.priority === "expired");
  const active = sorted.filter((i: Ingredient) => i.priority !== "expired" && !i.rescued);

  return (
    <section id="inventory" aria-labelledby="inventory-title" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="inventory-title" className="text-2xl font-semibold sm:text-3xl">
            Your Fridge
          </h2>
          <p className="mt-1 text-muted-foreground">Eat smarter. Waste less.</p>
        </div>
        <div className="flex items-center gap-3">
          {atRisk.length > 0 && (
            <p className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-urgent" aria-hidden="true" />
              {atRisk.length} ingredient{atRisk.length === 1 ? "" : "s"} need attention
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <AddIngredientForm onAdd={addIngredientManual} />
      </div>

      {/* Expired items warning */}
      <AnimatePresence>
        {expired.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/8 p-4"
          >
            <p className="flex items-start gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {expired.length} item{expired.length > 1 ? "s are" : " is"} past the estimated freshness window — consider removing{" "}
                {expired.length === 1 ? "it" : "them"}.
              </span>
            </p>
            <ul className="mt-2 space-y-1 pl-6">
              {expired.map((i: Ingredient) => (
                <li key={i.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{i.emoji}</span> {i.name}
                  <button
                    onClick={() => removeIngredient(i.id)}
                    className="ml-1 text-destructive hover:underline"
                    aria-label={`Remove ${i.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active ingredients */}
      <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {active.map((item: Ingredient, i: number) => (
            <IngredientCard
              key={item.id}
              item={item}
              index={i}
              expanded={open === item.id}
              onToggle={(id) => setOpen((cur) => (cur === id ? null : id))}
              onRemove={removeIngredient}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {active.length === 0 && expired.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 rounded-2xl border border-dashed border-border py-12 text-center"
        >
          <p className="text-2xl mb-3" aria-hidden="true">🥗</p>
          <p className="text-base font-semibold text-foreground/80">Your fridge is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Snap your groceries or add an item to get started.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <a
              href="#snap"
              className="bg-gradient-primary inline-flex min-h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              📷 Snap &amp; Stash
            </a>
          </div>
        </motion.div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Freshness estimates are guidance only. Always follow package dates and food-safety
        recommendations.
      </p>
    </section>
  );
}
