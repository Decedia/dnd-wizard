"use client";

import { useState, useMemo } from "react";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BookCard } from "@/components/BookCard";
import { BookPatterns, BookIcons, type BookId } from "@/components/book-svgs";
import { useSRD } from "@/contexts/SRDContext";

const BOOK_SPECS: Record<
  BookId,
  {
    name: string;
    tags: string[];
    spineColor: string;
    coverGradient: string;
    topColor: string;
    bookmarkColor: string;
    patternSvg: React.ReactNode;
    iconSvg: React.ReactNode;
  }
> = {
  PHB: {
    name: "Player's Handbook",
    tags: ["Core rules", "Always on"],
    spineColor: "#8B0000",
    coverGradient: "linear-gradient(160deg, #8B0000 0%, #5c0000 100%)",
    topColor: "#6b0000",
    bookmarkColor: "#cc0000",
    patternSvg: BookPatterns.PHB,
    iconSvg: BookIcons.PHB,
  },
  XGE: {
    name: "Xanathar's Guide to Everything",
    tags: ["Subclasses", "Feats", "Spells"],
    spineColor: "#1a237e",
    coverGradient: "linear-gradient(160deg, #1c2f9e 0%, #0d1457 100%)",
    topColor: "#0d1880",
    bookmarkColor: "#3f51b5",
    patternSvg: BookPatterns.XGE,
    iconSvg: BookIcons.XGE,
  },
  TCE: {
    name: "Tasha's Cauldron of Everything",
    tags: ["Optional rules", "Subclasses"],
    spineColor: "#4a148c",
    coverGradient: "linear-gradient(160deg, #6a1fa8 0%, #2d0a5e 100%)",
    topColor: "#4a148c",
    bookmarkColor: "#9c27b0",
    patternSvg: BookPatterns.TCE,
    iconSvg: BookIcons.TCE,
  },
  MTF: {
    name: "Mordenkainen's Tome of Foes",
    tags: ["Races", "Lore"],
    spineColor: "#b71c1c",
    coverGradient: "linear-gradient(160deg, #7f1111 0%, #3d0808 100%)",
    topColor: "#6b0e0e",
    bookmarkColor: "#d32f2f",
    patternSvg: BookPatterns.MTF,
    iconSvg: BookIcons.MTF,
  },
  VGtM: {
    name: "Volo's Guide to Monsters",
    tags: ["Races", "Monsters"],
    spineColor: "#1b5e20",
    coverGradient: "linear-gradient(160deg, #2e7d32 0%, #0a3d0a 100%)",
    topColor: "#1b5e20",
    bookmarkColor: "#4caf50",
    patternSvg: BookPatterns.VGtM,
    iconSvg: BookIcons.VGtM,
  },
  SCAG: {
    name: "Sword Coast Adventurer's Guide",
    tags: ["Subclasses", "Setting"],
    spineColor: "#0d47a1",
    coverGradient: "linear-gradient(160deg, #1565c0 0%, #072a6e 100%)",
    topColor: "#0d47a1",
    bookmarkColor: "#2196f3",
    patternSvg: BookPatterns.SCAG,
    iconSvg: BookIcons.SCAG,
  },
  EGW: {
    name: "Explorer's Guide to Wildemount",
    tags: ["Races", "Setting"],
    spineColor: "#004d40",
    coverGradient: "linear-gradient(160deg, #00695c 0%, #00251a 100%)",
    topColor: "#004d40",
    bookmarkColor: "#26a69a",
    patternSvg: BookPatterns.EGW,
    iconSvg: BookIcons.EGW,
  },
  FTD: {
    name: "Fizban's Treasury of Dragons",
    tags: ["Races", "Draconic"],
    spineColor: "#5d4037",
    coverGradient: "linear-gradient(160deg, #795548 0%, #3e2723 100%)",
    topColor: "#5d4037",
    bookmarkColor: "#8d6e63",
    patternSvg: BookPatterns.FTD,
    iconSvg: BookIcons.FTD,
  },
  VRGR: {
    name: "Van Richten's Guide to Ravenloft",
    tags: ["Races", "Horror"],
    spineColor: "#311b92",
    coverGradient: "linear-gradient(160deg, #4527a0 0%, #1a0f2e 100%)",
    topColor: "#311b92",
    bookmarkColor: "#673ab7",
    patternSvg: BookPatterns.VRGR,
    iconSvg: BookIcons.VRGR,
  },
};

export function StepSourceSelection({ data, onChange }: { data: { sources: string[]; ruleset?: "2014" | "2024" }; onChange: (patch: { sources: string[]; ruleset?: "2014" | "2024" }) => void }) {
  const selectedSources = data.sources || ["PHB"];
  const ruleset = data.ruleset || "2014";
  const { setRuleset: setSrdRuleset } = useSRD();

  const syncRuleset = useMemo(() => {
    if ((data.ruleset || "2014") !== (ruleset)) {
      setSrdRuleset(ruleset);
    }
  }, [data.ruleset, ruleset, setSrdRuleset]);

  const toggleSource = (sourceId: string) => {
    if (sourceId === "PHB") return;
    const current = selectedSources;
    if (current.includes(sourceId)) {
      onChange({ sources: current.filter((s) => s !== sourceId), ruleset });
    } else {
      onChange({ sources: [...current, sourceId], ruleset });
    }
  };

  const selectAll = () => {
    onChange({ sources: SOURCE_OPTIONS.map((s) => s.id), ruleset });
  };

  const selectCoreOnly = () => {
    onChange({ sources: ["PHB"], ruleset });
  };

  const setRuleset = (next: "2014" | "2024") => {
    onChange({ sources: selectedSources, ruleset: next });
    setSrdRuleset(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          Step 1 of {SOURCE_OPTIONS.length > 0 ? "8" : "6"}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Choose your rulebooks</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Select which books to draw content from. PHB is always included. You can change this per character.
        </p>
      </div>

      <div className="flex rounded-full bg-[var(--color-bg)] p-1">
        {(["2014", "2024"] as const).map((rs) => (
          <button
            key={rs}
            type="button"
            onClick={() => setRuleset(rs)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-full transition-colors ${
              ruleset === rs ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {rs === "2014" ? "2014 Rules" : "2024 Rules"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectCoreOnly}
          className="flex-1 px-3 py-2 text-xs font-semibold rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
        >
          PHB only
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="flex-1 px-3 py-2 text-xs font-semibold rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors"
        >
          Select all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 items-stretch">
        {SOURCE_OPTIONS.map((source) => {
          const isSelected = selectedSources.includes(source.id);
          const isPHB = source.id === "PHB";
          const spec = BOOK_SPECS[source.id as BookId];

          if (!spec) return null;

          return (
            <BookCard
              key={source.id}
              id={source.id}
              abbr={source.id}
              name={spec.name}
              tags={spec.tags}
              selected={isSelected}
              locked={isPHB}
              onToggle={() => toggleSource(source.id)}
              spineColor={spec.spineColor}
              coverGradient={spec.coverGradient}
              topColor={spec.topColor}
              bookmarkColor={spec.bookmarkColor}
              patternSvg={spec.patternSvg}
              iconSvg={spec.iconSvg}
            />
          );
        })}
      </div>

      <div className="text-center text-[11px] text-[var(--color-text-muted)]">
        {selectedSources.length} of {SOURCE_OPTIONS.length} selected
      </div>
    </div>
  );
}
