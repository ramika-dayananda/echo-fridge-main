import { createFileRoute } from "@tanstack/react-router";
import { InventorySection } from "@/components/fridge/InventorySection";
import { RescueFlow } from "@/components/fridge/RescueFlow";
import { UploadScanner } from "@/components/fridge/UploadScanner";
import { useFridge } from "@/store/fridge-store";

const TITLE = "Inventory — FridgePulse ⚡";
const DESC =
  "Every ingredient in your fridge, sorted by how soon it needs cooking, with AI freshness estimates.";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { addIngredients } = useFridge();
  return (
    <div className="space-y-16 pt-6">
      <InventorySection />
      <RescueFlow />
      <UploadScanner onDetected={addIngredients} />
    </div>
  );
}
