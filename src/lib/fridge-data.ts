/**
 * FridgePulse domain model + mock data.
 *
 * INTEGRATION POINTS: every function in `src/lib/fridge-ai.ts` is a stub that
 * the AI/backend team can replace with a real API call. This file holds only
 * types and seed data.
 */

export type Status = "fresh" | "soon" | "today" | "expired";
export type Priority = "use-first" | "use-soon" | "fresh" | "expired";

export type Ingredient = {
  id: string;
  name: string;
  emoji: string;
  daysLeft: number;
  status: Status;
  priority: Priority;
  category: string;
  qty: string;
  estimated?: boolean;
  rescued?: boolean;
  /** Human-readable explanation of why this freshness estimate was chosen */
  freshnessReason?: string;
  /** Display label for a detected printed date, e.g. "Best Before: Aug 18 2026" */
  printedDateLabel?: string;
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; short: string; order: number; token: string }
> = {
  expired:    { label: "EXPIRED",   short: "Expired", order: 0, token: "expired" },
  "use-first":{ label: "USE TODAY", short: "Urgent",  order: 1, token: "urgent" },
  "use-soon": { label: "USE SOON",  short: "Soon",    order: 2, token: "soon" },
  fresh:      { label: "FRESH",     short: "Fresh",   order: 3, token: "fresh" },
};

export function statusFromDays(days: number): Status {
  if (days < 0) return "expired";
  if (days <= 1) return "today";
  if (days <= 3) return "soon";
  return "fresh";
}

export function priorityFromDays(days: number): Priority {
  if (days < 0)  return "expired";
  if (days <= 1) return "use-first";
  if (days <= 3) return "use-soon";
  return "fresh";
}

export function sortIngredients(items: Ingredient[]): Ingredient[] {
  return [...items].sort(
    (a, b) =>
      Number(a.rescued ?? false) - Number(b.rescued ?? false) ||
      PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order ||
      a.daysLeft - b.daysLeft ||
      a.name.localeCompare(b.name),
  );
}

export const SEED_INVENTORY: Ingredient[] = [
  { id: "chicken", name: "Chicken Breast", emoji: "🍗", daysLeft: 1, status: "today", priority: "use-first", category: "Protein", qty: "2 fillets" },
  { id: "spinach", name: "Spinach",        emoji: "🥬", daysLeft: 2, status: "soon",  priority: "use-soon",  category: "Greens",  qty: "1 bunch" },
  { id: "avocado", name: "Avocado",        emoji: "🥑", daysLeft: 3, status: "soon",  priority: "use-soon",  category: "Produce", qty: "2 whole" },
  { id: "yogurt",  name: "Greek Yogurt",   emoji: "🥛", daysLeft: 4, status: "soon",  priority: "use-soon",  category: "Dairy",   qty: "500 g" },
  { id: "pepper",  name: "Bell Pepper",    emoji: "🫑", daysLeft: 5, status: "fresh", priority: "fresh",     category: "Produce", qty: "1 red" },
  { id: "lemon",   name: "Lemon",          emoji: "🍋", daysLeft: 8, status: "fresh", priority: "fresh",     category: "Produce", qty: "3 whole" },
];

/** Foods the mock vision model "detects" from an uploaded photo. */
export const DETECTABLE: Ingredient[] = [
  { id: "salmon",   name: "Salmon Fillet",    emoji: "🐟", daysLeft: 1, status: "today", priority: "use-first", category: "Protein", qty: "2 portions" },
  { id: "mushroom", name: "Mushrooms",         emoji: "🍄", daysLeft: 2, status: "soon",  priority: "use-soon",  category: "Produce", qty: "250 g" },
  { id: "tomato",   name: "Cherry Tomatoes",   emoji: "🍅", daysLeft: 4, status: "soon",  priority: "use-soon",  category: "Produce", qty: "1 punnet" },
  { id: "broccoli", name: "Broccoli",          emoji: "🥦", daysLeft: 6, status: "fresh", priority: "fresh",     category: "Greens",  qty: "1 head" },
];

export type CookingWindow = { id: string; label: string; detail: string };

export const COOKING_WINDOWS: CookingWindow[] = [
  { id: "tonight",  label: "Tonight",      detail: "Tonight · 7:00 PM" },
  { id: "tomorrow", label: "Tomorrow",     detail: "Tomorrow · 6:30 PM" },
  { id: "weekend",  label: "This Weekend", detail: "Saturday · 1:00 PM" },
  { id: "custom",   label: "Choose Time",  detail: "Custom · 8:00 PM" },
];

export type CookTime = "quick" | "full";
export const COOK_TIME_META: Record<CookTime, { label: string; subtitle: string; icon: string; minutes: string }> = {
  quick: { label: "Quick & Easy",        subtitle: "Under 20 minutes",  icon: "⚡", minutes: "< 20 min" },
  full:  { label: "Full Cooking Session", subtitle: "30–50 minutes",    icon: "🍳", minutes: "30–50 min" },
};

export const CUISINES = [
  "Italian", "Mexican", "Indian", "Thai", "Mediterranean",
  "American Comfort", "Japanese", "Middle Eastern", "Surprise Me",
] as const;
export type Cuisine = typeof CUISINES[number] | string;

// ─── Rescue recipe (richer type used by the 4-step wizard) ───────────────────

export type RescueRecipe = {
  id: string;
  name: string;
  time_minutes: number;
  difficulty: "Easy" | "Medium";
  description: string;
  ingredients_used: string[];
  extra_ingredients: string[];
  steps: string[];
  rescue_reason: string;
};

// ─── Legacy single-recipe type kept for fridge-ai.ts ─────────────────────────

export type Recipe = {
  title: string;
  time: string;
  window: string;
  rescued: string[];
  why: string;
  steps: string[];
};

export const IMPACT_TREND = [
  { week: "W1", rescued: 3 },
  { week: "W2", rescued: 5 },
  { week: "W3", rescued: 4 },
  { week: "W4", rescued: 7 },
  { week: "W5", rescued: 6 },
  { week: "W6", rescued: 9 },
];

export const STREAK_WEEKS = [true, true, true, true, false];
