"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, Character } from "@/lib/storage";

export default function Home() {
  const characters = getCharacters();

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="DND Wizard" subtitle="My Characters" />

      <main className="px-4 py-6 pb-28">
        <div className="mb-6">
          <Link
            href="/character/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-burgundy px-6 py-4 text-lg font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl leading-none">🐉</span>
            <span>Create New Character</span>
          </Link>
        </div>

        <section>
          <h2 className="font-display text-lg font-semibold text-gold mb-3">
            My Characters
          </h2>

          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-12 text-center">
              <div className="mb-3 text-4xl opacity-40">🐉</div>
              <p className="text-sm text-parchment/50">
                No characters yet. Create your first hero to begin your adventure.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {characters.map((char) => (
                <li key={char.id}>
                  <Link
                    href={`/character/${char.id}`}
                    className="block rounded-xl border border-parchment/10 bg-charcoal-light/60 p-4 transition-all active:scale-[0.98] hover:border-gold/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-burgundy/20 text-lg">
                          🧙
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-parchment">
                            {char.name || "Unnamed Hero"}
                          </h3>
                          <p className="text-xs text-parchment/40">
                            Created {formatDate(char.createdAt)}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-parchment/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
