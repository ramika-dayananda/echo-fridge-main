import { Link } from "@tanstack/react-router";
import { Home, Leaf, Refrigerator, Sparkles, User } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Refrigerator },
  { to: "/impact", label: "Impact", icon: Leaf },
  { to: "/how-it-works", label: "How it Works", icon: Sparkles },
] as const;

export function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5"
      >
        <Link to="/" className="font-display text-base font-bold tracking-tight sm:text-lg">
          Fridge<span className="text-gradient">Pulse</span> <span aria-hidden="true">⚡</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.slice(1).map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-glass-strong hover:text-foreground"
                activeProps={{ className: "text-foreground bg-glass-strong" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          aria-label="Your account"
          className="glass flex size-9 items-center justify-center rounded-full text-sm font-semibold"
        >
          <User className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Mobile"
      className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl px-2 py-1.5 md:hidden"
    >
      {LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
          activeProps={{ className: "text-primary" }}
        >
          <l.icon className="size-5" aria-hidden="true" />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
