"use client";

import { useState, useEffect } from "react";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BookCard } from "@/components/BookCard";
import { BookPatterns, type BookId } from "@/components/book-svgs";
import { useSRD } from "@/contexts/SRDContext";

const BOOK_SPECS: Record<
  BookId,
  {
    name: string;
    tags: string[];
    color: string;
    stripColor: string;
    icon: string;
    patternSvg: React.ReactNode;
  }
> = {
  PHB: {
    name: "Player's Handbook",
    tags: ["Core rules", "Always on"],
    color: "#8B0000",
    stripColor: "#cc0000",
    icon: "📖",
    patternSvg: BookPatterns.PHB,
  },
  XGE: {
    name: "Xanathar's Guide to Everything",
    tags: ["Subclasses", "Feats", "Spells"],
    color: "#1c2f9e",
    stripColor: "#3f51b5",
    icon: "👁️",
    patternSvg: BookPatterns.XGE,
  },
  TCE: {
    name: "Tasha's Cauldron of Everything",
    tags: ["Optional rules", "Subclasses"],
    color: "#4a148c",
    stripColor: "#9c27b0",
    icon: "🪄",
    patternSvg: BookPatterns.TCE,
  },
  MTF: {
    name: "Mordenkainen's Tome of Foes",
    tags: ["Races", "Lore"],
    color: "#7f1111",
    stripColor: "#d32f2f",
    icon: "💀",
    patternSvg: BookPatterns.MTF,
  },
  VGTM: {
    name: "Volo's Guide to Monsters",
    tags: ["Races", "Monsters"],
    color: "#1b5e20",
    stripColor: "#4caf50",
    icon: "🐉",
    patternSvg: BookPatterns.VGTM,
  },
  MPMM: {
    name: "Mordenkainen Presents: Monsters of the Multiverse",
    tags: ["Races", "Monsters", "Lore"],
    color: "#4a148c",
    stripColor: "#9c27b0",
    icon: "👾",
    patternSvg: BookPatterns.MPMM,
  },
  SCAG: {
    name: "Sword Coast Adventurer's Guide",
    tags: ["Subclasses", "Setting"],
    color: "#0d47a1",
    stripColor: "#2196f3",
    icon: "⚔️",
    patternSvg: BookPatterns.SCAG,
  },
  EGW: {
    name: "Explorer's Guide to Wildemount",
    tags: ["Races", "Setting"],
    color: "#2d4a22",
    stripColor: "#66bb6a",
    icon: "🗺️",
    patternSvg: BookPatterns.EGW,
  },
  FTD: {
    name: "Fizban's Treasury of Dragons",
    tags: ["Dragons", "Races"],
    color: "#8a3a00",
    stripColor: "#ff7043",
    icon: "🔥",
    patternSvg: BookPatterns.FTD,
  },
  VRGR: {
    name: "Van Richten's Guide to Ravenloft",
    tags: ["Races", "Horror"],
    color: "#311b92",
    stripColor: "#673ab7",
    icon: "🧛",
    patternSvg: BookPatterns.VRGR,
  },
};

export function StepSourceSelection({ data, onChange }: { data: { sources: string[]; ruleset?: "2014" | "2024" }; onChange: (patch: { sources: string[]; ruleset?: "2014" | "2024" }) => void }) {
  const selectedSources = data.sources || ["PHB"];
  const ruleset = data.ruleset || "2014";
  const { setRuleset: setSrdRuleset } = useSRD();

  useEffect(() => {
    setSrdRuleset(ruleset);
  }, [ruleset, setSrdRuleset]);

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

  const totalBooks = SOURCE_OPTIONS.length;
  const selectedCount = selectedSources.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          Step 1 of {totalBooks > 0 ? "8" : "6"}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Choose rulebooks</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Select which books to draw content from.
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

      <div
        className="flex items-center justify-between rounded-[12px] border px-[14px] py-[10px]"
        style={{ borderColor: "#e0e0e0", background: "#fff" }}
      >
        <span style={{ fontSize: 13, color: "#888" }}>Books selected</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
          {selectedCount} / {totalBooks}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
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
              color={spec.color}
              stripColor={spec.stripColor}
              icon={spec.icon}
              patternSvg={spec.patternSvg}
            />
          );
        })}
      </div>
    </div>
  );
}
