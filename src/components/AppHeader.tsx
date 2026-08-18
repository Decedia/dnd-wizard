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
      <path d="M12 2C9 2 7 4 7 6.5c0 .8.2 1.5.6 2.1L5.5 12l2.2 1.3-.3 2.2 2.5-.8 2.5.8-.3-2.2 2.2-1.3-2.1-1.4C12.8 9.8 13 9.1 13 8.5c0-.8-.3-1.5-.8-2C12 6.2 12 6 12 6s0 .2.2.5c.5-.5.8-1.2.8-2 0-1.1-1-2-2.5-2-.5 0-1 .1-1.5.3.2-.3.3-.7.3-1.1C9 1.2 8 0 6.5 0S4 1.2 4 2.7c0 .4.1.8.3 1.1-.5-.2-1-.3-1.5-.3C1.5 3.5.5 4.6.5 6s1 2.5 2.5 2.5c.5 0 1-.1 1.5-.3-.2.3-.3.7-.3 1.1 0 1.5 1.5 2.7 3.5 2.7s3.5-1.2 3.5-2.7c0-.4-.1-.8-.3-1.1.5.2 1 .3 1.5.3 1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5zM8.5 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6 7.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm12 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}
