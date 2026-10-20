/**
 * Shared types for Gemini extraction + freshness engine.
 * Gemini's job: extract. FridgePulse's job: decide.
 */

// ─── What Gemini extracts from the image ─────────────────────────────────────

export type VisibleCondition = "fresh" | "ripe" | "very_ripe" | "damaged" | "unknown";

export type PrintedDateType =
  | "best_before"
  | "use_by"
  | "expiry"
  | "sell_by"
  | "packed_on"
  | "production_date"
  | "unknown";

export type DetectedPrintedDate = {
  type: PrintedDateType;
  rawText: string;          // exactly as seen: "BEST BEFORE AUG 18 2026"
  parsedDate?: string;      // ISO YYYY-MM-DD, only when Gemini is confident
};

export type DetectedFood = {
  name: string;
  category?: string;
  confidence?: number;      // 0–1
  visibleCondition: VisibleCondition;
  printedDate?: DetectedPrintedDate;
};

// ─── Purchase / storage context chosen by the user ────────────────────────────

/**
 * discounted = ordinary sale/promotion — does NOT reduce freshness.
 * clearance  = reduced-to-clear — may reduce estimated window.
 * ripe / very_ripe = condition at point of purchase.
 */
export type PurchaseCondition =
  | "regular"
  | "discounted"
  | "clearance"
  | "ripe"
  | "very_ripe";

export type StorageMethod =
  | "fridge"
  | "freezer"
  | "pantry"
  | "counter"
  | "unknown";

// ─── Item as it sits in the review screen ─────────────────────────────────────

/**
 * One item on the SnapReview screen.
 * The user can edit all fields before committing to inventory.
 */
export type ReviewedItem = {
  /** Temporary UI id (never stored in inventory) */
  reviewId: string;

  /** Gemini's raw detection */
  detection: DetectedFood;

  /** User-editable fields (pre-filled from detection) */
  editedName: string;
  editedDateType: PrintedDateType | "none";
  editedDateRaw: string;       // free text shown to user: "Aug 18 2026"
  editedDateISO: string;       // ISO for calculation: "2026-08-18" | ""
  purchaseCondition: PurchaseCondition;
  storageMethod: StorageMethod;

  /** Computed by freshness engine (recomputed on every edit) */
  daysLeft: number;
  freshnessReason: string;
  printedDateLabel: string;    // human label for the date line, e.g. "Best Before: Aug 18"
};

// ─── Labels shown in UI for date type ────────────────────────────────────────

export const DATE_TYPE_LABELS: Record<PrintedDateType | "none", string> = {
  none:             "No date detected",
  best_before:      "Best Before",
  use_by:           "Use By",
  expiry:           "Expiry / Expiration",
  sell_by:          "Sell By",
  packed_on:        "Packed On",
  production_date:  "Production Date",
  unknown:          "Date (type unknown)",
};

export const PURCHASE_CONDITION_LABELS: Record<PurchaseCondition, string> = {
  regular:    "Regular purchase",
  discounted: "Discounted / Promotion",
  clearance:  "Clearance / Quick sale",
  ripe:       "Already ripe",
  very_ripe:  "Very ripe — use soon",
};

export const STORAGE_METHOD_LABELS: Record<StorageMethod, string> = {
  fridge:   "Refrigerator",
  freezer:  "Freezer",
  pantry:   "Pantry / Cupboard",
  counter:  "Counter / Room temp",
  unknown:  "Not sure",
};
