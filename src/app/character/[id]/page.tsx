"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacter, saveCharacter, type Character } from "@/lib/storage";
import { StickyMiniHeader } from "@/components/character-sheet/StickyMiniHeader";
import { SectionNav } from "@/components/character-sheet/SectionNav";
import { CharacterSheetProvider } from "@/components/character-sheet/CharacterSheetContext";
import { IdentitySection } from "@/components/character-sheet/IdentitySection";
import { StatsSection } from "@/components/character-sheet/StatsSection";
import { SkillsSection } from "@/components/character-sheet/SkillsSection";
import { FeaturesTraitsSection } from "@/components/character-sheet/FeaturesTraitsSection";
import { InventorySection } from "@/components/character-sheet/InventorySection";
import { SpellsSection } from "@/components/character-sheet/SpellsSection";
import { AppearanceBioSection } from "@/components/character-sheet/AppearanceBioSection";

export default function CharacterView() {
  const params = useParams();
  const id = params.id as string;

  const [character, setCharacter] = useState<Character | null>(() => {
    if (typeof window !== "undefined" && id) {
      return getCharacter(id) ?? null;
    }
    return null;
  });

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [spellsCollapsed, setSpellsCollapsed] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    clearTimeout(timeoutRef.current ?? undefined);
    timeoutRef.current = setTimeout(() => {
      if (character) {
        saveCharacter(character);
      }
    }, 400);
  }, [character]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current ?? undefined);
  }, []);

  const handleSave = () => {
    if (character) {
      saveCharacter(character);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    }
  };

  const handleChange = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Character" subtitle="Character Sheet" />
        <main className="px-4 py-6 pb-28">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title={character.name || "Character"} subtitle="Character Sheet" />
      <StickyMiniHeader character={character} />
      <SectionNav />

      <CharacterSheetProvider onFieldBlur={debouncedSave}>
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg space-y-4">
            <IdentitySection character={character} onChange={handleChange} />
            <StatsSection character={character} onChange={handleChange} />
            <SkillsSection character={character} onChange={handleChange} />
            <FeaturesTraitsSection character={character} onChange={handleChange} />
            <InventorySection character={character} onChange={handleChange} />
            <SpellsSection
              character={character}
              onChange={handleChange}
              collapsed={spellsCollapsed}
              onToggleCollapse={() => setSpellsCollapsed((c) => !c)}
            />
            <AppearanceBioSection character={character} onChange={handleChange} />
          </div>

          <div className="mx-auto max-w-lg mt-6 mb-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-burgundy px-6 py-3 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98]"
            >
              Save Character
            </button>
            {savedAt && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-400">
                <CheckIcon className="h-4 w-4" />
                Saved
              </div>
            )}
          </div>
        </main>
      </CharacterSheetProvider>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
