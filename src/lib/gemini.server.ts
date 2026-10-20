/**
 * Gemini server-side integration.
 * This file MUST only run on the server — it accesses GEMINI_API_KEY.
 *
 * Uses createServerFn from TanStack Start so the API key never reaches
 * the browser bundle.
 *
 * Model: gemini-3.6-flash
 *   - Flash-class multimodal model ✓
 *
 * Structured output:
 *   responseMimeType: "application/json" + responseJsonSchema (confirmed in SDK GenerateContentConfig).
 *   Without responseJsonSchema, gemini-3.6-flash returns prose even with responseMimeType set.
 *   Zod validates the parsed JSON as a second layer.
 */

import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { computeFreshness } from "./freshness-engine";
import type { DetectedFood, ReviewedItem, StorageMethod } from "./gemini-types";
import { DETECTABLE, priorityFromDays, statusFromDays } from "./fridge-data";

// ─── Zod schema for Gemini JSON response ─────────────────────────────────────

const PrintedDateSchema = z.object({
  type: z.enum([
    "best_before", "use_by", "expiry",
    "sell_by", "packed_on", "production_date", "unknown",
  ]),
  rawText: z.string().min(1),
  parsedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const DetectedFoodSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  visibleCondition: z.enum(["fresh", "ripe", "very_ripe", "damaged", "unknown"]),
  printedDate: PrintedDateSchema.optional(),
});

// min(0) — empty array is valid when no food is detected; caller handles fallback.
const GeminiResponseSchema = z.array(DetectedFoodSchema).min(0).max(20);

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a food recognition assistant for a kitchen inventory app.

Identify every distinct food item, packaged product, or grocery item visible in the image.

For each item, observe and report:
- name: the common English food name (e.g. "Spinach", "Chicken Breast", "Milk")
- category: one of Produce, Protein, Dairy, Greens, Grain, or Other
- confidence: how confident you are in the identification (0.0 to 1.0)
- visibleCondition: the physical state you can observe — fresh, ripe, very_ripe, damaged, or unknown
- printedDate: ONLY if a date label is clearly readable on packaging:
    - type: the label type (best_before, use_by, expiry, sell_by, packed_on, production_date, or unknown)
    - rawText: copy the text EXACTLY as printed (e.g. "BEST BEFORE AUG 18 2026")
    - parsedDate: the date in YYYY-MM-DD format — OMIT this field if you cannot read it confidently

Critical rules:
- Do NOT calculate days remaining or estimate shelf life — that is handled by the app.
- Do NOT make food safety judgements. Do NOT use the words "unsafe" or "expired".
- Do NOT invent a date that is not visibly printed on the packaging.
- If the same product appears multiple times, list it once.
- If no food is visible, return an empty array.`;

// ─── Server function input schema ─────────────────────────────────────────────

const AnalyzeImageInput = z.object({
  /** base64-encoded image data (no data: prefix) */
  imageBase64: z.string().min(100),
  /** MIME type of the compressed image */
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

type AnalyzeImageInput = z.infer<typeof AnalyzeImageInput>;

// ─── The server function ──────────────────────────────────────────────────────

/** Safely extract a loggable error summary — never logs secrets or image data. */
function describeError(err: unknown, stage: string): void {
  const name    = err instanceof Error ? err.name    : typeof err;
  const message = err instanceof Error ? err.message : String(err);

  // Pull HTTP status / Gemini API error details if present on the error object
  const status  = (err != null && typeof err === "object" && "status"  in err)
    ? String((err as Record<string, unknown>)["status"])  : undefined;
  const code    = (err != null && typeof err === "object" && "code"    in err)
    ? String((err as Record<string, unknown>)["code"])    : undefined;
  const details = (err != null && typeof err === "object" && "details" in err)
    ? JSON.stringify((err as Record<string, unknown>)["details"]) : undefined;

  console.error(
    `[Gemini] stage=${stage}`,
    `name=${name}`,
    `message=${message}`,
    ...(status  ? [`httpStatus=${status}`]  : []),
    ...(code    ? [`errorCode=${code}`]    : []),
    ...(details ? [`details=${details}`]   : []),
  );
}

export const analyzeImageServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => AnalyzeImageInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
      // Logged as error so it appears in Vercel's error log, not just warn
      console.error("[Gemini] stage=config GEMINI_API_KEY environment variable is not set");
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Log that we reached the handler with a safe summary (no key, no image data)
    console.log(`[Gemini] stage=start mimeType=${data.mimeType} imageSizeChars=${data.imageBase64.length}`);

    const ai = new GoogleGenAI({ apiKey });


        let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: data.mimeType,
                  data: data.imageBase64,
                },
              },
              {
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          // responseMimeType alone is insufficient — gemini-3.6-flash returns prose without
          // responseJsonSchema. Previous removal was incorrect; real failure was HTTP 429.
          // responseJsonSchema is confirmed in GenerateContentConfig SDK types.
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name:             { type: "string" },
                category:         { type: "string" },
                confidence:       { type: "number", minimum: 0, maximum: 1 },
                visibleCondition: { type: "string", enum: ["fresh", "ripe", "very_ripe", "damaged", "unknown"] },
                printedDate: {
                  type: "object",
                  properties: {
                    type:       { type: "string", enum: ["best_before", "use_by", "expiry", "sell_by", "packed_on", "production_date", "unknown"] },
                    rawText:    { type: "string" },
                    parsedDate: { type: "string" },
                  },
                  required: ["type", "rawText"],
                },
              },
              required: ["name", "visibleCondition"],
            },
            minItems: 0,
            maxItems: 20,
          },
        },
      });
      const finishReason = String(
        (response.candidates?.[0] as { finishReason?: string } | undefined)?.finishReason ?? "unknown"
      );
      if (finishReason === "MAX_TOKENS") {
        console.error("[Gemini] stage=api_response_received finishReason=MAX_TOKENS — response was truncated, increase maxOutputTokens");
      } else {
        console.log(`[Gemini] stage=api_response_received finishReason=${finishReason}`);
      }
    } catch (err) {
      describeError(err, "api_request");
      throw err;
    }

    const raw = response.text;
    if (!raw) {
      console.error("[Gemini] stage=response_parse response.text was empty or undefined");
      throw new Error("Empty response from Gemini");
    }

    // response.text is already valid JSON when responseMimeType = "application/json".
    // Still defensively strip fences in case of SDK version edge cases.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned) as unknown;
      console.log(`[Gemini] stage=json_parse_ok isArray=${Array.isArray(parsed)} length=${Array.isArray(parsed) ? String(parsed.length) : "n/a"}`);
    } catch (err) {
      // Log first 200 chars of raw text (safe — no secrets, no image data)
      console.error(`[Gemini] stage=json_parse rawTextPreview=${cleaned.slice(0, 200)}`);
      describeError(err, "json_parse");
      throw err;
    }

    let detections: DetectedFood[];
    try {
      detections = GeminiResponseSchema.parse(
        Array.isArray(parsed) && parsed.length === 0 ? parsed : parsed,
      ) as DetectedFood[];
      console.log(`[Gemini] stage=zod_validation_ok detectionCount=${detections.length}`);
    } catch (err) {
      describeError(err, "zod_validation");
      throw err;
    }

    return detections;
  });

// ─── Convert raw Gemini detections → ReviewedItem[] ──────────────────────────

export function detectedFoodToReviewedItem(
  detection: DetectedFood,
  index: number,
): ReviewedItem {
  const reviewId = `review-${Date.now()}-${index}`;

  const dateType = detection.printedDate?.type ?? "none";
  const dateISO = detection.printedDate?.parsedDate ?? "";
  const dateRaw = detection.printedDate?.rawText ?? "";

  const freshnessResult = computeFreshness({
    foodName: detection.name,
    visibleCondition: detection.visibleCondition,
    purchaseCondition: "regular",
    storageMethod: "fridge",
    printedDateType: dateType === "none" ? undefined : dateType,
    printedDateISO: dateISO,
    printedDateRaw: dateRaw,
  });

  return {
    reviewId,
    detection,
    editedName: detection.name,
    editedDateType: dateType,
    editedDateRaw: dateRaw,
    editedDateISO: dateISO,
    purchaseCondition: "regular",
    storageMethod: "fridge" as StorageMethod,
    daysLeft: freshnessResult.daysLeft,
    freshnessReason: freshnessResult.freshnessReason,
    printedDateLabel: freshnessResult.printedDateLabel,
  };
}

// ─── Mock fallback (same shape as real Gemini output) ────────────────────────

export function getMockDetections(): DetectedFood[] {
  return DETECTABLE.slice(0, 3 + Math.floor(Math.random() * 2)).map((item) => ({
    name: item.name,
    category: item.category,
    confidence: 0.85 + Math.random() * 0.14,
    visibleCondition: "fresh" as const,
  }));
}

/** Build ReviewedItems from the mock detections */
export function getMockReviewedItems(): ReviewedItem[] {
  return getMockDetections().map((d, i) => detectedFoodToReviewedItem(d, i));
}

/** Convert a ReviewedItem (after user edits on review screen) → Ingredient */
export function reviewedItemToIngredient(item: ReviewedItem) {
  // Recompute with final user choices
  const freshnessResult = computeFreshness({
    foodName: item.editedName,
    visibleCondition: item.detection.visibleCondition,
    purchaseCondition: item.purchaseCondition,
    storageMethod: item.storageMethod,
    printedDateType:
      item.editedDateType === "none" ? undefined : item.editedDateType,
    printedDateISO: item.editedDateISO,
    printedDateRaw: item.editedDateRaw,
  });

  const daysLeft = freshnessResult.daysLeft;
  const priority = priorityFromDays(daysLeft);
  const status = statusFromDays(daysLeft);

  // Simple emoji mapping
  const emojiMap: Record<string, string> = {
    chicken: "🍗", beef: "🥩", pork: "🥩", fish: "🐟", salmon: "🐟",
    spinach: "🥬", lettuce: "🥬", kale: "🥬", broccoli: "🥦",
    tomato: "🍅", pepper: "🫑", carrot: "🥕", onion: "🧅", garlic: "🧄",
    potato: "🥔", mushroom: "🍄", avocado: "🥑", cucumber: "🥒",
    apple: "🍎", banana: "🍌", lemon: "🍋", orange: "🍊",
    strawberry: "🍓", grape: "🍇", mango: "🥭",
    milk: "🥛", cheese: "🧀", egg: "🥚", yogurt: "🥛", butter: "🧈",
    bread: "🍞", pasta: "🍝", rice: "🍚", tofu: "🍱",
  };

  const lc = item.editedName.toLowerCase();
  const emoji =
    Object.entries(emojiMap).find(([k]) => lc.includes(k))?.[1] ?? "🥘";

  return {
    id: `snap-${Date.now()}-${item.reviewId}`,
    name: item.editedName.trim(),
    emoji,
    daysLeft,
    status,
    priority,
    category: item.detection.category ?? "Produce",
    qty: "—",
    estimated: true,
    freshnessReason: freshnessResult.freshnessReason,
    printedDateLabel: freshnessResult.printedDateLabel,
  };
}
