import { createFileRoute } from "@tanstack/react-router";
import { ImpactSection } from "@/components/fridge/ImpactSection";

const TITLE = "Your Impact — FridgePulse ⚡";
const DESC =
  "Track ingredients rescued, food waste avoided, money saved, and your weekly rescue streak.";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ImpactPage,
});

function ImpactPage() {
  return (
    <div className="pt-6">
      <ImpactSection />
    </div>
  );
}
