import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ImageUp, Loader2, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { SnapReview } from "./SnapReview";
import { SCAN_STAGES } from "@/lib/fridge-ai";
import type { Ingredient } from "@/lib/fridge-data";
import { compressImageForUpload } from "@/lib/image-compress";
import {
  analyzeImageServerFn,
  detectedFoodToReviewedItem,
  getMockReviewedItems,
  reviewedItemToIngredient,
} from "@/lib/gemini-client";
import type { ReviewedItem } from "@/lib/gemini-types";
import groceries from "@/assets/groceries.jpg";
import { cn } from "@/lib/utils";

type Phase = "idle" | "scanning" | "review" | "done";

export function UploadScanner({
  onDetected,
}: {
  onDetected: (items: Ingredient[]) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string>(groceries);
  const [stage, setStage] = useState(0);
  const [reviewItems, setReviewItems] = useState<ReviewedItem[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "scanning") return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, SCAN_STAGES.length - 1)), 850);
    return () => clearInterval(t);
  }, [phase]);

  async function run(file?: File | null) {
    if (file) setPreview(URL.createObjectURL(file));
    setPhase("scanning");
    setUsedFallback(false);

    let items: ReviewedItem[];

    if (file) {
      try {
        // Compress image client-side before sending to server
        const compressed = await compressImageForUpload(file);

        // Call Gemini via server function
        const detections = await analyzeImageServerFn({
          data: {
            imageBase64: compressed.base64,
            mimeType: compressed.mimeType,
          },
        });

        items = detections.map((d, i) => detectedFoodToReviewedItem(d, i));

        if (items.length === 0) {
          // Gemini returned empty array — fall back
          items = getMockReviewedItems();
          setUsedFallback(true);
        }
      } catch (err) {
        // Any failure (network, rate limit, missing key, bad JSON) → mock fallback
        console.warn("[SnapReview] Gemini unavailable, using mock data:", err);
        items = getMockReviewedItems();
        setUsedFallback(true);
      }
    } else {
      // Demo photo button — always use mock (no real image to send)
      // Add a brief realistic delay
      await new Promise((r) => setTimeout(r, 2600));
      items = getMockReviewedItems();
      setUsedFallback(false); // demo mode, no error
    }

    setReviewItems(items);
    setPhase("review");
  }

  function handleConfirm(confirmedItems: ReviewedItem[]) {
    const ingredients = confirmedItems
      .filter((i) => i.editedName.trim().length > 0)
      .map((i) => reviewedItemToIngredient(i));
    onDetected(ingredients);
    setPhase("done");
  }

  function handleRescan() {
    setPhase("idle");
    setReviewItems([]);
    setPreview(groceries);
  }

  return (
    <GlassCard strong className="p-5 sm:p-8" id="snap">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left: image area */}
        <div className="flex-1">
          <h2 className="text-2xl font-semibold sm:text-3xl">Snap your groceries.</h2>
          <p className="mt-2 text-muted-foreground">
            Take one photo. FridgePulse identifies items and reads package dates.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void run(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "mt-6 rounded-3xl border border-dashed p-5 transition-colors sm:p-6",
              dragging ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary/40">
              <img
                src={preview}
                alt="Groceries ready to be scanned"
                width={1024}
                height={768}
                className={cn(
                  "size-full object-cover transition-all duration-700",
                  phase === "scanning" ? "scale-[1.03] brightness-90" : "",
                )}
              />
              <AnimatePresence>
                {phase === "scanning" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_calc(100%_-_1px),oklch(0.83_0.15_58/18%)_100%)] bg-[length:100%_28px]" />
                    <div className="animate-scanline absolute inset-x-0 h-24 -translate-y-1/2 bg-[linear-gradient(180deg,transparent,oklch(0.83_0.15_58/30%),transparent)]">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-primary shadow-[0_0_18px_2px_oklch(0.83_0.15_58/70%)]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs font-medium backdrop-blur-md"
                >
                  <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                  Added to your fridge
                </motion.div>
              )}
            </div>

            {/* Upload buttons — hide during review/done */}
            {(phase === "idle" || phase === "scanning") && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => void run(e.target.files?.[0])}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void run(e.target.files?.[0])}
                />
                <button
                  onClick={() => cameraRef.current?.click()}
                  disabled={phase === "scanning"}
                  className="bg-gradient-primary inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
                >
                  <Camera className="size-4" aria-hidden="true" /> Take Photo
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={phase === "scanning"}
                  className="glass inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-transform hover:bg-glass-strong active:scale-[0.97] disabled:opacity-60"
                >
                  <ImageUp className="size-4" aria-hidden="true" /> Upload Image
                </button>
                <button
                  onClick={() => void run(null)}
                  disabled={phase === "scanning"}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  Use demo photo
                </button>
              </div>
            )}

            {phase === "review" && (
              <div className="mt-5">
                <button
                  onClick={handleRescan}
                  className="glass inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:bg-glass-strong"
                >
                  ← Rescan or upload different photo
                </button>
              </div>
            )}

            <p className="mt-3 hidden text-center text-xs text-muted-foreground sm:block">
              or drag &amp; drop an image anywhere in this panel
            </p>
          </div>
        </div>

        {/* Right: analysis panel */}
        <div className="w-full lg:max-w-xs" aria-live="polite">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            AI analysis
          </p>

          {phase === "idle" && (
            <p className="mt-4 text-sm text-muted-foreground">
              Detected foods will appear here with an estimated freshness window and priority.
              Package dates on labels are read automatically.
            </p>
          )}

          {phase === "scanning" && (
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {SCAN_STAGES[stage]}
              </p>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-[linear-gradient(90deg,var(--glass),var(--glass-strong),var(--glass))] bg-[length:200%_100%]"
                />
              ))}
            </div>
          )}

          {phase === "review" && (
            <div className="mt-4">
              <SnapReview
                items={reviewItems}
                usedFallback={usedFallback}
                onConfirm={handleConfirm}
                onRescan={handleRescan}
              />
            </div>
          )}

          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-fresh">
                <Sparkles className="size-4" aria-hidden="true" />
                Items added to your fridge!
              </p>
              <button
                onClick={handleRescan}
                className="glass inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium hover:bg-glass-strong"
              >
                Scan more groceries
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
