import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  COOKING_WINDOWS,
  SEED_INVENTORY,
  priorityFromDays,
  statusFromDays,
  sortIngredients,
  type CookingWindow,
  type Ingredient,
  type Recipe,
  type RescueRecipe,
} from "@/lib/fridge-data";

type Impact = {
  rescuedCount: number;
  kgAvoided: number;
  valueSaved: number;
  meals: number;
};

type FridgeState = {
  inventory: Ingredient[];
  sorted: Ingredient[];
  atRisk: Ingredient[];
  activeInventory: Ingredient[]; // non-expired, non-rescued — for recipe wizard
  window: CookingWindow;
  recipe: Recipe | null;
  impact: Impact;
  setWindow: (w: CookingWindow) => void;
  addIngredients: (items: Ingredient[]) => void;
  addIngredientManual: (name: string, daysLeft: number) => void;
  removeIngredient: (id: string) => void;
  setRecipe: (r: Recipe | null) => void;
  rescue: (names: string[]) => void;           // legacy (marks as rescued)
  rescueByIds: (ids: string[]) => void;         // new: removes from inventory
  rescueScore: number;
};

const FridgeContext = createContext<FridgeState | null>(null);

function computeScore(inventory: Ingredient[], impact: Impact): number {
  // Score based on impact history (since rescued items are now removed from inventory)
  const mealBonus = Math.min(impact.meals * 5, 30);
  const rescueBonus = Math.min(impact.rescuedCount * 2, 40);
  // Penalise for currently at-risk items not yet rescued
  const atRiskCount = inventory.filter(
    (i) => i.priority === "use-first" || i.priority === "use-soon",
  ).length;
  const riskPenalty = Math.min(atRiskCount * 2, 20);
  return Math.round(Math.min(100, mealBonus + rescueBonus - riskPenalty + 10));
}

export function FridgeProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Ingredient[]>([]);  // Start empty — users add via Snap & Stash or manual entry
  const [window, setWindow] = useState<CookingWindow>(COOKING_WINDOWS[0]!);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [impact, setImpact] = useState<Impact>({
    rescuedCount: 12,
    kgAvoided: 4.2,
    valueSaved: 38,
    meals: 7,
  });

  const addIngredients = useCallback((items: Ingredient[]) => {
    setInventory((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      return [...prev, ...items.filter((i) => !existing.has(i.id))];
    });
  }, []);

  const addIngredientManual = useCallback((name: string, daysLeft: number) => {
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const priority = priorityFromDays(daysLeft);
    const status = statusFromDays(daysLeft);
    const emojiMap: Record<string, string> = {
      chicken: "🍗", beef: "🥩", pork: "🥩", fish: "🐟", salmon: "🐟", tuna: "🐟",
      spinach: "🥬", lettuce: "🥬", kale: "🥬", broccoli: "🥦", cabbage: "🥦",
      tomato: "🍅", pepper: "🫑", carrot: "🥕", onion: "🧅", garlic: "🧄",
      potato: "🥔", mushroom: "🍄", avocado: "🥑", cucumber: "🥒", corn: "🌽",
      apple: "🍎", banana: "🍌", lemon: "🍋", orange: "🍊", berry: "🫐",
      milk: "🥛", cheese: "🧀", egg: "🥚", yogurt: "🥛", butter: "🧈",
      rice: "🍚", pasta: "🍝", bread: "🍞", tofu: "🍱",
    };
    const lc = name.toLowerCase();
    const emoji = Object.entries(emojiMap).find(([k]) => lc.includes(k))?.[1] ?? "🥘";

    const newItem: Ingredient = {
      id,
      name: name.trim(),
      emoji,
      daysLeft,
      status,
      priority,
      category: priority === "expired" ? "Expired" : priority === "use-first" ? "Urgent" : priority === "use-soon" ? "Use Soon" : "Fresh",
      qty: "—",
      estimated: true,
    };
    setInventory((prev) => sortIngredients([...prev, newItem]));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Legacy: marks as rescued (used by old RescueFlow)
  const rescue = useCallback((names: string[]) => {
    setInventory((prev) =>
      prev.map((i) => (names.includes(i.name) ? { ...i, rescued: true } : i)),
    );
    setImpact((prev) => ({
      rescuedCount: prev.rescuedCount + names.length,
      kgAvoided: Math.round((prev.kgAvoided + names.length * 0.28) * 10) / 10,
      valueSaved: prev.valueSaved + names.length * 3,
      meals: prev.meals + 1,
    }));
  }, []);

  // New: removes rescued ingredients from active inventory + updates impact
  const rescueByIds = useCallback((ids: string[]) => {
    // Update impact first (captures current count before removal)
    setImpact((prev) => ({
      rescuedCount: prev.rescuedCount + ids.length,
      kgAvoided: Math.round((prev.kgAvoided + ids.length * 0.28) * 10) / 10,
      valueSaved: prev.valueSaved + ids.length * 3,
      meals: prev.meals + 1,
    }));
    // Remove rescued items from inventory entirely — no lingering RESCUED badges
    setInventory((prev) => prev.filter((i) => !ids.includes(i.id)));
  }, []);

  const value = useMemo<FridgeState>(() => {
    const sorted = sortIngredients(inventory);
    const activeInventory = sorted.filter((i) => !i.rescued && i.priority !== "expired");
    const rescueScore = computeScore(inventory, impact);
    return {
      inventory,
      sorted,
      atRisk: sorted.filter((i) => !i.rescued && i.priority === "use-first"),
      activeInventory,
      window,
      recipe,
      impact,
      setWindow,
      addIngredients,
      addIngredientManual,
      removeIngredient,
      setRecipe,
      rescue,
      rescueByIds,
      rescueScore,
    };
  }, [inventory, window, recipe, impact, addIngredients, addIngredientManual, removeIngredient, rescue, rescueByIds]);

  return <FridgeContext.Provider value={value}>{children}</FridgeContext.Provider>;
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error("useFridge must be used inside FridgeProvider");
  return ctx;
}
