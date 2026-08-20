"use client";

import Link from "next/link";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function WizardHatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 18h20v2H2z" />
      <path d="M5 18l7-14 7 14z" />
    </svg>
  );
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal/80 backdrop-blur-xl">
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <WizardHatIcon className="h-7 w-7 text-burgundy" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold tracking-wide text-white">
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
