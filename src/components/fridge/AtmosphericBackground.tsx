/** Slow-drifting orbs + grain. Purely decorative. */
export function AtmosphericBackground() {
  return (
    <div
      aria-hidden="true"
      className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="animate-drift-a absolute -left-[20%] -top-[25%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle_at_center,var(--lime)_0%,transparent_62%)] opacity-[0.16] blur-[90px]" />
      <div className="animate-drift-b absolute -right-[25%] top-[10%] h-[65vmax] w-[65vmax] rounded-full bg-[radial-gradient(circle_at_center,var(--emerald)_0%,transparent_60%)] opacity-[0.18] blur-[100px]" />
      <div className="animate-drift-c absolute bottom-[-30%] left-[15%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle_at_center,var(--amber)_0%,transparent_60%)] opacity-[0.1] blur-[110px]" />
      <div className="animate-drift-a absolute bottom-[5%] right-[5%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle_at_center,var(--cyan)_0%,transparent_62%)] opacity-[0.1] blur-[100px]" />
    </div>
  );
}
