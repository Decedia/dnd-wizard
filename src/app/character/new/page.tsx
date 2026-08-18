"use client";

import { AppHeader } from "@/components/AppHeader";

export default function CharacterCreator() {
  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Character Creator" subtitle="Step-by-step creation" />

      <main className="px-4 py-6 pb-28">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
          <div className="mb-4 text-5xl opacity-40">🐉</div>
          <h2 className="font-display text-xl font-semibold text-parchment mb-2">
            Character Creator
          </h2>
          <p className="text-sm text-parchment/50 max-w-xs">
            The creation flow will guide you through building your D&D 5e hero.
            Coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
