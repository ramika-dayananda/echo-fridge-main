import { ImpactMetric, RescueScore, RescueStreak, TrendChart } from "./Impact";
import { useFridge } from "@/store/fridge-store";

export function ImpactSection() {
  const { impact } = useFridge();

  return (
    <section id="impact" aria-labelledby="impact-title" className="scroll-mt-28">
      <h2 id="impact-title" className="text-2xl font-semibold sm:text-3xl">
        Your Impact 🌱
      </h2>
      <p className="mt-1 text-muted-foreground">
        Small rescues, compounding. Here&apos;s what your kitchen kept out of the bin.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ImpactMetric value={impact.rescuedCount} label="Ingredients Rescued" index={0} />
        <ImpactMetric value={impact.kgAvoided} decimals={1} suffix=" kg" label="Food Waste Avoided" index={1} />
        <ImpactMetric value={impact.valueSaved} prefix="$" label="Estimated Value Saved" index={2} />
        <ImpactMetric value={impact.meals} label="Rescue Meals" index={3} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <RescueScore score={82} />
        <div className="grid gap-4">
          <TrendChart />
          <RescueStreak />
        </div>
      </div>
    </section>
  );
}
