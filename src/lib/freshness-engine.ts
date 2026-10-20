/**
 * FridgePulse Freshness Engine
 * ----------------------------
 * Owns ALL freshness decisions. Gemini extracts — this module decides.
 *
 * Pipeline:
 *   Signal 1 — Printed date (strongest, only for forward-looking labels)
 *   Signal 2 — Baseline food table
 *   Signal 3 — Storage method adjustment
 *   Signal 4 — Purchase condition adjustment (clearance/ripe/very_ripe ONLY)
 *   Signal 5 — Visible condition fine-tuning
 *
 * Rules:
 *   - discounted does NOT reduce freshness (it's a price signal, not freshness)
 *   - If a reliable printed date (best_before/use_by/expiry) is present, it is
 *     the primary source. We do NOT additionally shorten that window for clearance.
 *   - Negative daysLeft is preserved so the existing expired state works correctly.
 *   - sell_by / packed_on / production_date are stored as metadata only — they
 *     are NOT used as expiry signals.
 */

import { differenceInDays, parseISO, isValid } from "date-fns";
import type {
  PrintedDateType,
  PurchaseCondition,
  StorageMethod,
  VisibleCondition,
} from "./gemini-types";

// ─── Baseline freshness table ─────────────────────────────────────────────────

type FoodBaseline = {
  /** Days of estimated freshness in a fridge (default storage) */
  fridgeDays: number;
  frozenDays?: number;
  pantryDays?: number;
  counterDays?: number;
};

/**
 * Keys are lowercase, trimmed food names. Partial match used in lookup.
 * These are ESTIMATED freshness windows, not food-safety limits.
 */
const BASELINE: Record<string, FoodBaseline> = {
  "spinach":        { fridgeDays: 5,  frozenDays: 180 },
  "kale":           { fridgeDays: 7,  frozenDays: 180 },
  "lettuce":        { fridgeDays: 7  },
  "salad":          { fridgeDays: 4  },
  "tomato":         { fridgeDays: 5,  counterDays: 7 },
  "cherry tomato":  { fridgeDays: 5,  counterDays: 7 },
  "avocado":        { fridgeDays: 3,  counterDays: 5 },
  "bell pepper":    { fridgeDays: 7  },
  "pepper":         { fridgeDays: 7  },
  "cucumber":       { fridgeDays: 7  },
  "mushroom":       { fridgeDays: 5  },
  "broccoli":       { fridgeDays: 7,  frozenDays: 365 },
  "cauliflower":    { fridgeDays: 7  },
  "carrot":         { fridgeDays: 14 },
  "celery":         { fridgeDays: 14 },
  "onion":          { fridgeDays: 30, pantryDays: 60 },
  "garlic":         { fridgeDays: 30, pantryDays: 90 },
  "potato":         { fridgeDays: 14, pantryDays: 60 },
  "sweet potato":   { fridgeDays: 14, pantryDays: 30 },
  "corn":           { fridgeDays: 3,  frozenDays: 365 },
  "grapes":         { fridgeDays: 10 },
  "strawberry":     { fridgeDays: 4  },
  "blueberry":      { fridgeDays: 7  },
  "raspberry":      { fridgeDays: 3  },
  "banana":         { fridgeDays: 4,  counterDays: 5 },
  "apple":          { fridgeDays: 30, counterDays: 14 },
  "orange":         { fridgeDays: 21, counterDays: 14 },
  "lemon":          { fridgeDays: 14, counterDays: 7  },
  "lime":           { fridgeDays: 14, counterDays: 7  },
  "mango":          { fridgeDays: 5,  counterDays: 4  },
  "pineapple":      { fridgeDays: 5,  counterDays: 3  },
  "watermelon":     { fridgeDays: 5  },
  "peach":          { fridgeDays: 5,  counterDays: 3  },
  "chicken breast": { fridgeDays: 2,  frozenDays: 270 },
  "chicken":        { fridgeDays: 2,  frozenDays: 270 },
  "ground beef":    { fridgeDays: 2,  frozenDays: 120 },
  "beef":           { fridgeDays: 3,  frozenDays: 270 },
  "pork":           { fridgeDays: 3,  frozenDays: 180 },
  "lamb":           { fridgeDays: 3,  frozenDays: 270 },
  "salmon":         { fridgeDays: 2,  frozenDays: 180 },
  "fish":           { fridgeDays: 2,  frozenDays: 180 },
  "shrimp":         { fridgeDays: 2,  frozenDays: 180 },
  "tofu":           { fridgeDays: 5  },
  "eggs":           { fridgeDays: 28 },
  "milk":           { fridgeDays: 7  },
  "cream":          { fridgeDays: 7  },
  "yogurt":         { fridgeDays: 14 },
  "greek yogurt":   { fridgeDays: 14 },
  "cheese":         { fridgeDays: 21 },
  "butter":         { fridgeDays: 30 },
  "bread":          { fridgeDays: 5,  pantryDays: 5  },
  "bagel":          { fridgeDays: 7,  pantryDays: 4  },
  "pasta":          { fridgeDays: 3,  pantryDays: 730 },
  "rice":           { fridgeDays: 4,  pantryDays: 730 },
};

const DEFAULT_FALLBACK_DAYS = 4;

// ─── Food name normalisation ──────────────────────────────────────────────────

/** Best-effort fuzzy lookup: returns baseline entry or undefined */
function lookupBaseline(rawName: string): FoodBaseline | undefined {
  const normalised = rawName.toLowerCase().trim();

  // Exact match first
  if (normalised in BASELINE) return BASELINE[normalised];

  // Longest partial key that appears in the name
  let best: { key: string; entry: FoodBaseline } | undefined;
  for (const [key, entry] of Object.entries(BASELINE)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      if (!best || key.length > best.key.length) {
        best = { key, entry };
      }
    }
  }
  return best?.entry;
}

// ─── Printed date helpers ─────────────────────────────────────────────────────

/** Date types we treat as a forward-looking expiry signal */
const FORWARD_LOOKING_DATE_TYPES: PrintedDateType[] = [
  "best_before",
  "use_by",
  "expiry",
];

/** Date types we store as metadata but do NOT use to calculate daysLeft */
const CONTEXTUAL_DATE_TYPES: PrintedDateType[] = [
  "sell_by",
  "packed_on",
  "production_date",
  "unknown",
];

function daysFromPrintedDate(isoDate: string): number {
  const parsed = parseISO(isoDate);
  if (!isValid(parsed)) return NaN;
  // differenceInDays(future, now) → positive if future, negative if past
  return differenceInDays(parsed, new Date());
}

function formatDateLabel(type: PrintedDateType, rawText: string): string {
  const labels: Record<PrintedDateType, string> = {
    best_before:     "Best Before",
    use_by:          "Use By",
    expiry:          "Expiry",
    sell_by:         "Sell By",
    packed_on:       "Packed On",
    production_date: "Production Date",
    unknown:         "Date",
  };
  // Try to pull a short date from rawText for display (e.g. "Aug 18 2026" → "Aug 18")
  const shortDate = rawText.replace(/(best before|use by|expir\w+|sell by|packed on|production date|bb|bb:|use by:)/gi, "").trim();
  return `${labels[type]}: ${shortDate}`;
}

// ─── Main engine function ─────────────────────────────────────────────────────

export type FreshnessResult = {
  daysLeft: number;           // may be negative (expired)
  freshnessReason: string;
  printedDateLabel: string;   // e.g. "Best Before: Aug 18 2026" | ""
  usedPrintedDate: boolean;
};

export type FreshnessInput = {
  foodName: string;
  visibleCondition: VisibleCondition;
  purchaseCondition: PurchaseCondition;
  storageMethod: StorageMethod;
  printedDateType?: PrintedDateType | "none" | undefined;
  printedDateISO?: string | undefined;    // YYYY-MM-DD, empty string = not available
  printedDateRaw?: string | undefined;    // raw text from label, for display
};

export function computeFreshness(input: FreshnessInput): FreshnessResult {
  const {
    foodName,
    visibleCondition,
    purchaseCondition,
    storageMethod,
    printedDateType,
    printedDateISO,
    printedDateRaw,
  } = input;

  const reasons: string[] = [];
  let printedDateLabel = "";
  let usedPrintedDate = false;
  let daysLeft: number;

  // ── Signal 1: Printed date (forward-looking types only) ──────────────────
  const hasForwardDate =
    printedDateISO &&
    printedDateISO.length > 0 &&
    printedDateType &&
    printedDateType !== "none" &&
    (FORWARD_LOOKING_DATE_TYPES as string[]).includes(printedDateType);

  if (hasForwardDate && printedDateISO) {
    const daysFromLabel = daysFromPrintedDate(printedDateISO);

    if (!isNaN(daysFromLabel)) {
      // Use the printed date directly — negative values preserved for expired
      daysLeft = daysFromLabel;
      usedPrintedDate = true;

      const labelType = printedDateType as PrintedDateType;
      printedDateLabel = printedDateRaw
        ? formatDateLabel(labelType, printedDateRaw)
        : `${labelType.replace("_", " ")}: ${printedDateISO}`;

      const daysText =
        daysLeft < 0
          ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago`
          : daysLeft === 0
            ? "today"
            : `about ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`;

      const labelName = {
        best_before: "Best Before",
        use_by: "Use By",
        expiry: "Expiry",
      }[labelType as "best_before" | "use_by" | "expiry"] ?? "date";

      reasons.push(`${labelName} date detected: ${printedDateRaw ?? printedDateISO} — ${daysText}.`);

      // ── IMPORTANT: when a reliable printed date is present, we do NOT apply
      // purchase-condition shortening. The label is the authoritative signal.
      // Visible condition adjustments are also skipped (the date already
      // accounts for the actual product state).

      return {
        daysLeft,
        freshnessReason: reasons.join(" "),
        printedDateLabel,
        usedPrintedDate,
      };
    }
  }

  // Store contextual date labels for display even when not used for calculation
  if (
    printedDateISO &&
    printedDateType &&
    printedDateType !== "none" &&
    (CONTEXTUAL_DATE_TYPES as string[]).includes(printedDateType) &&
    printedDateRaw
  ) {
    printedDateLabel = formatDateLabel(printedDateType as PrintedDateType, printedDateRaw);
    reasons.push(`${printedDateLabel} noted (used as reference only, not as expiry).`);
  }

  // ── Signal 2: Baseline food table ────────────────────────────────────────
  const baseline = lookupBaseline(foodName);

  if (!baseline) {
    daysLeft = DEFAULT_FALLBACK_DAYS;
    reasons.push(
      `No package date detected. No specific freshness data for "${foodName}" — using a conservative ${DEFAULT_FALLBACK_DAYS}-day estimate.`,
    );
  } else {
    // ── Signal 3: Storage method ──────────────────────────────────────────
    let baseDays: number;
    switch (storageMethod) {
      case "freezer":
        baseDays = baseline.frozenDays ?? baseline.fridgeDays;
        if (baseline.frozenDays) reasons.push("Frozen storage — extended estimate applied.");
        break;
      case "pantry":
        baseDays = baseline.pantryDays ?? baseline.fridgeDays;
        if (baseline.pantryDays) reasons.push("Pantry storage estimate applied.");
        break;
      case "counter":
        baseDays = baseline.counterDays ?? baseline.fridgeDays;
        break;
      default:
        baseDays = baseline.fridgeDays;
    }

    const baseLabel = foodName.toLowerCase();
    reasons.push(
      `No package date detected. Estimated from typical ${storageMethod === "fridge" || storageMethod === "unknown" ? "refrigerated" : storageMethod} ${baseLabel} freshness.`,
    );

    daysLeft = baseDays;
  }

  // ── Signal 4: Purchase condition ──────────────────────────────────────────
  // discounted → NO change (price signal only)
  // clearance  → 35% reduction
  // ripe       → 40% reduction
  // very_ripe  → 65% reduction
  switch (purchaseCondition) {
    case "clearance":
      daysLeft = Math.round(daysLeft * 0.65);
      reasons.push("Clearance item — estimated freshness window shortened.");
      break;
    case "ripe":
      daysLeft = Math.round(daysLeft * 0.60);
      reasons.push("Already ripe when purchased — freshness window shortened.");
      break;
    case "very_ripe":
      daysLeft = Math.round(daysLeft * 0.35);
      reasons.push("Very ripe when purchased — prioritized for earlier use.");
      break;
    case "discounted":
      reasons.push("Promotional discount selected — freshness estimate unchanged.");
      break;
    case "regular":
      // no note needed
      break;
  }

  // ── Signal 5: Visible condition fine-tuning ────────────────────────────────
  // Only applied when we're using the baseline (no authoritative printed date)
  switch (visibleCondition) {
    case "very_ripe":
      daysLeft = Math.max(1, daysLeft - 1);
      if (purchaseCondition !== "very_ripe" && purchaseCondition !== "ripe") {
        reasons.push(`Very ripe ${foodName.toLowerCase()} detected — prioritized for earlier use.`);
      }
      break;
    case "damaged":
      daysLeft = Math.max(1, daysLeft - 2);
      reasons.push("Damaged condition observed — freshness window shortened.");
      break;
    case "fresh":
    case "ripe":
    case "unknown":
      // no adjustment
      break;
  }

  // Ensure minimum of 1 day when item is present (negative only comes from printed date path above)
  daysLeft = Math.max(1, daysLeft);

  return {
    daysLeft,
    freshnessReason: reasons.join(" "),
    printedDateLabel,
    usedPrintedDate,
  };
}

/** Convenience: compute just the days for a user-edited date in the review screen */
export function daysFromISODate(isoDate: string): number | null {
  if (!isoDate || isoDate.length < 10) return null;
  const parsed = parseISO(isoDate);
  if (!isValid(parsed)) return null;
  return differenceInDays(parsed, new Date());
}
