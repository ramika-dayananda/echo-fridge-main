/**
 * SnapReview — confirmation screen shown after Gemini analysis.
 * Users can edit every field before items enter inventory.
 * Nothing is added automatically.
 */

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import {
  DATE_TYPE_LABELS,
  PURCHASE_CONDITION_LABELS,
  STORAGE_METHOD_LABELS,
  type PrintedDateType,
  type PurchaseCondition,
  type ReviewedItem,
  type StorageMethod,
} from "@/lib/gemini-types";
import { computeFreshness, daysFromISODate } from "@/lib/freshness-engine";
import { priorityFromDays, statusFromDays } from "@/lib/fridge-data";
import { cn } from "@/lib/utils";

// ─── Editable field select ────────────────────────────────────────────────────

function SmallSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
      >
        {(Object.entries(options) as [T, string][]).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Single reviewed item card ────────────────────────────────────────────────

function ReviewItemCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: ReviewedItem;
  index: number;
  onUpdate: (updated: ReviewedItem) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  function recompute(patch: Partial<ReviewedItem>): ReviewedItem {
    const next = { ...item, ...patch };

    const freshnessResult = computeFreshness({
      foodName: next.editedName || item.detection.name,
      visibleCondition: next.detection.visibleCondition,
      purchaseCondition: next.purchaseCondition,
      storageMethod: next.storageMethod,
      printedDateType:
        next.editedDateType === "none" ? undefined : next.editedDateType,
      printedDateISO: next.editedDateISO,
      printedDateRaw: next.editedDateRaw,
    });

    return {
      ...next,
      daysLeft: freshnessResult.daysLeft,
      freshnessReason: freshnessResult.freshnessReason,
      printedDateLabel: freshnessResult.printedDateLabel,
    };
  }

  function handleDateISOChange(iso: string) {
    // When user edits the ISO field directly, recompute
    onUpdate(recompute({ editedDateISO: iso }));
  }

  function handleDateTypeChange(type: PrintedDateType | "none") {
    onUpdate(recompute({ editedDateType: type }));
  }

  function handleNameChange(name: string) {
    onUpdate(recompute({ editedName: name }));
  }

  function handlePurchaseChange(pc: PurchaseCondition) {
    onUpdate(recompute({ purchaseCondition: pc }));
  }

  function handleStorageChange(sm: StorageMethod) {
    onUpdate(recompute({ storageMethod: sm }));
  }

  const priority = priorityFromDays(item.daysLeft);
  const daysLabel =
    item.daysLeft < 0
      ? `${Math.abs(item.daysLeft)}d overdue`
      : item.daysLeft === 0
        ? "Today"
        : `~${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"}`;

  const confidencePct =
    item.detection.confidence != null
      ? `${Math.round(item.detection.confidence * 100)}%`
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 26 }}
    >
      <GlassCard className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Editable name */}
            <input
              type="text"
              value={item.editedName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              placeholder="Food name…"
              aria-label="Edit food name"
            />
            {confidencePct && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Detected · {confidencePct} confidence
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right">
              <StatusBadge priority={priority} />
              <p className="mt-0.5 text-xs text-muted-foreground">{daysLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse details" : "Edit details"}
              className="glass flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-glass-strong"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.reviewId)}
              aria-label={`Remove ${item.editedName}`}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printed date summary (when collapsed) */}
        {!expanded && item.printedDateLabel && (
          <p className="mt-1.5 text-xs text-muted-foreground/80">
            📅 {item.printedDateLabel}
          </p>
        )}

        {/* Expanded editor */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                {/* Date type */}
                <SmallSelect
                  label="Date label type"
                  value={item.editedDateType}
                  options={DATE_TYPE_LABELS as Record<PrintedDateType | "none", string>}
                  onChange={handleDateTypeChange}
                />

                {/* Date value */}
                <div>
                  <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={item.editedDateISO}
                    onChange={(e) => handleDateISOChange(e.target.value)}
                    placeholder="2026-08-18"
                    className={cn(
                      "w-full rounded-lg border bg-secondary/40 px-2.5 py-1.5 text-xs",
                      "focus:outline-none focus:ring-1 focus:ring-primary/60",
                      item.editedDateISO && daysFromISODate(item.editedDateISO) === null
                        ? "border-destructive/60"
                        : "border-border",
                    )}
                  />
                  {item.editedDateRaw && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60 truncate">
                      Detected: {item.editedDateRaw}
                    </p>
                  )}
                </div>

                {/* Purchase condition */}
                <SmallSelect
                  label="How did you buy it?"
                  value={item.purchaseCondition}
                  options={PURCHASE_CONDITION_LABELS}
                  onChange={handlePurchaseChange}
                />

                {/* Storage method */}
                <SmallSelect
                  label="Storage"
                  value={item.storageMethod}
                  options={STORAGE_METHOD_LABELS}
                  onChange={handleStorageChange}
                />
              </div>

              {/* Freshness reason */}
              <div className="mt-3 rounded-xl bg-primary/6 p-3">
                <p className="text-[11px] font-medium text-primary/70 uppercase tracking-wider mb-1">
                  Why this estimate
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.freshnessReason}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main SnapReview component ────────────────────────────────────────────────

export function SnapReview({
  items: initialItems,
  usedFallback,
  onConfirm,
  onRescan,
}: {
  items: ReviewedItem[];
  usedFallback: boolean;
  onConfirm: (items: ReviewedItem[]) => void;
  onRescan: () => void;
}) {
  const [items, setItems] = useState<ReviewedItem[]>(initialItems);

  const updateItem = useCallback((updated: ReviewedItem) => {
    setItems((prev) =>
      prev.map((i) => (i.reviewId === updated.reviewId ? updated : i)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.reviewId !== id));
  }, []);

  function addBlankItem() {
    const blank: ReviewedItem = {
      reviewId: `manual-${Date.now()}`,
      detection: {
        name: "",
        visibleCondition: "unknown",
      },
      editedName: "",
      editedDateType: "none",
      editedDateRaw: "",
      editedDateISO: "",
      purchaseCondition: "regular",
      storageMethod: "fridge",
      daysLeft: 4,
      freshnessReason: "Manually added item — using default estimate.",
      printedDateLabel: "",
    };
    setItems((prev) => [...prev, blank]);
  }

  const validItems = items.filter((i) => i.editedName.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            ✅ Review before adding
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {items.length} item{items.length === 1 ? "" : "s"} detected
          </h3>
        </div>
        <button
          type="button"
          onClick={onRescan}
          className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-glass-strong text-muted-foreground"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Rescan
        </button>
      </div>

      {/* Fallback notice */}
      {usedFallback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-2xl border border-soon/30 bg-soon/8 px-4 py-3 text-sm"
        >
          <Info className="size-4 shrink-0 text-soon mt-0.5" aria-hidden="true" />
          <span className="text-muted-foreground">
            Live recognition is unavailable, so FridgePulse loaded demo detections.
            You can still edit and add these items.
          </span>
        </motion.div>
      )}

      {/* Item cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <ReviewItemCard
              key={item.reviewId}
              item={item}
              index={i}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            All items removed. Add one manually or rescan.
          </p>
        )}
      </div>

      {/* Add manual item */}
      <button
        type="button"
        onClick={addBlankItem}
        className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-primary hover:bg-glass-strong"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add item manually
      </button>

      {/* Safety disclaimer */}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground/70">
        <Info className="size-3 shrink-0 mt-0.5" aria-hidden="true" />
        Freshness estimates are guidance only. Always follow package dates and food-safety recommendations.
      </p>

      {/* CTA */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onConfirm(items)}
        disabled={validItems.length === 0}
        className={cn(
          "bg-gradient-primary w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold text-primary-foreground",
          "disabled:opacity-50 transition-transform",
        )}
      >
        <Check className="size-5" aria-hidden="true" />
        Add {validItems.length} item{validItems.length === 1 ? "" : "s"} to My Fridge
      </motion.button>
    </div>
  );
}
