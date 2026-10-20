/**
 * Client-facing interface to the Gemini server function.
 * Only imports the server function call interface — no SDK code here.
 * The actual Gemini API call lives in gemini.server.ts (server-only).
 */

export {
  analyzeImageServerFn,
  detectedFoodToReviewedItem,
  getMockReviewedItems,
  reviewedItemToIngredient,
} from "./gemini.server";
