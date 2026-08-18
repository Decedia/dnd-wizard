"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacter } from "@/lib/storage";

export default function CharacterView() {
  const params = useParams();
  const id = params.id as string;
  const character = typeof window !== "undefined" ? getCharacter(id) ?? null : null;

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title={character?.name || "Character"} subtitle="Character Sheet" />

      <main className="px-4 py-6 pb-28">
        {!character ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">
              Character Not Found
            </h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">
              This character could not be found. It may have been deleted.
            </p>
            <Link
              href="/"
              className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-burgundy-light"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-parchment/10 bg-charcoal-light/60 p-4">
              <div>
                <p className="text-xs text-parchment/40 uppercase tracking-wider">
                  Character Name
                </p>
                <p className="font-display text-lg font-semibold text-parchment">
                  {character.name || "Unnamed Hero"}
                </p>
              </div>
              <div className="text-2xl">🧙</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
              <div className="mb-4 text-5xl opacity-40">📜</div>
              <h2 className="font-display text-xl font-semibold text-parchment mb-2">
                Character Sheet
              </h2>
              <p className="text-sm text-parchment/50 max-w-xs">
                The full character sheet will be displayed here. Coming soon.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
