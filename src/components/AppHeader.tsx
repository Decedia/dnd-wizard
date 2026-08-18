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
            <i className="fa-solid fa-hat-wizard text-2xl text-gold" />
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
