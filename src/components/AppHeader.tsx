"use client";

import Link from "next/link";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-charcoal/80 backdrop-blur-xl">
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-burgundy shadow-md shadow-burgundy/20 transition-transform group-hover:scale-105">
            <DragonLogo className="h-6 w-6 text-gold" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold tracking-wide text-gold">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-parchment/50 font-body">{subtitle}</p>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

function DragonLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.4 3.8L4 14l2.5 1.5L6 18l3-1 3 1 3-1 3 1-1.5-2.5L20 14l-3.4-3.2C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5zm-2 14a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}
