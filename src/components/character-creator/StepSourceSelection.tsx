"use client";

import { useState, useMemo } from "react";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BookCard } from "./BookCard";

const BOOK_SPECS: Record<
  string,
  {
    name: string;
    background: string;
    tags: string[];
    pattern: React.ReactNode;
    illustration: React.ReactNode;
  }
> = {
  PHB: {
    name: "Player's Handbook",
    background: "#1a1a1a",
    tags: ["Core rules", "Always on"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <circle cx="100" cy="45" r="32" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="100" cy="45" r="20" fill="none" stroke="white" strokeWidth="1" />
        <line x1="20" y1="45" x2="180" y2="45" stroke="white" strokeWidth="1" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="6" width="28" height="32" rx="2" />
        <line x1="8" y1="14" x2="36" y2="14" />
        <line x1="14" y1="6" x2="14" y2="38" />
        <line x1="18" y1="20" x2="26" y2="20" />
        <line x1="18" y1="26" x2="26" y2="26" />
        <line x1="18" y1="32" x2="24" y2="32" />
        <circle cx="30" cy="36" r="3" fill="none" stroke="white" strokeWidth="1.2" />
        <line x1="30" y1="33" x2="30" y2="36" />
        <line x1="27" y1="36" x2="33" y2="36" />
      </svg>
    ),
  },
  XGE: {
    name: "Xanathar's Guide to Everything",
    background: "#1c2340",
    tags: ["Subclasses", "Feats", "Spells"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <polygon points="100,12 148,78 52,78" fill="none" stroke="white" strokeWidth="1.2" />
        <polygon points="100,24 136,66 64,66" fill="none" stroke="white" strokeWidth="1" />
        <polygon points="100,36 124,54 76,54" fill="none" stroke="white" strokeWidth="0.8" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="22" cy="22" r="10" />
        <circle cx="22" cy="22" r="4" fill="white" opacity="0.9" />
        <path d="M22 4 C24 10, 28 12, 32 10" />
        <path d="M22 4 C20 10, 16 12, 12 10" />
        <path d="M22 40 C24 34, 28 32, 32 34" />
        <path d="M22 40 C20 34, 16 32, 12 34" />
        <line x1="22" y1="2" x2="22" y2="8" />
        <line x1="22" y1="36" x2="22" y2="42" />
      </svg>
    ),
  },
  TCE: {
    name: "Tasha's Cauldron of Everything",
    background: "#1f1428",
    tags: ["Optional rules", "Subclasses"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <path d="M60,20 Q100,60 140,20" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M60,70 Q100,30 140,70" fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="100" cy="45" r="6" fill="none" stroke="white" strokeWidth="1" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="22" cy="28" rx="12" ry="7" />
        <path d="M10 28 L10 34 Q10 38 14 38 L30 38 Q34 38 34 34 L34 28" />
        <path d="M18 14 Q18 10 22 10 Q26 10 26 14" />
        <path d="M20 18 Q20 14 22 14 Q24 14 24 18" />
        <path d="M22 8 L22 6" />
        <line x1="34" y1="26" x2="38" y2="22" />
      </svg>
    ),
  },
  MTF: {
    name: "Mordenkainen's Tome of Foes",
    background: "#1a0f0f",
    tags: ["Races", "Lore"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <rect x="40" y="16" width="16" height="58" fill="none" stroke="white" strokeWidth="1" />
        <rect x="70" y="24" width="16" height="50" fill="none" stroke="white" strokeWidth="1" />
        <rect x="100" y="10" width="16" height="64" fill="none" stroke="white" strokeWidth="1" />
        <rect x="130" y="22" width="16" height="52" fill="none" stroke="white" strokeWidth="1" />
        <rect x="160" y="30" width="16" height="44" fill="none" stroke="white" strokeWidth="1" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="10" width="28" height="26" rx="2" />
        <path d="M8 18 L36 18" />
        <path d="M12 24 L32 24" />
        <path d="M12 30 L28 30" />
        <circle cx="28" cy="16" r="3" fill="white" opacity="0.85" />
        <path d="M16 34 L18 38 L22 34" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M10 10 L14 14" />
        <path d="M30 10 L34 14" />
      </svg>
    ),
  },
  VGtM: {
    name: "Volo's Guide to Monsters",
    background: "#0f1f14",
    tags: ["Races", "Monsters"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <circle cx="75" cy="36" r="18" fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="125" cy="54" r="18" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M45 70 Q100 10 155 70" fill="none" stroke="white" strokeWidth="1" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="22" cy="24" rx="12" ry="10" />
        <circle cx="16" cy="20" r="3" fill="white" opacity="0.9" />
        <circle cx="28" cy="20" r="3" fill="white" opacity="0.9" />
        <circle cx="16" cy="20" r="1" fill="#111" />
        <circle cx="28" cy="20" r="1" fill="#111" />
        <path d="M14 32 L18 28 L22 32 L26 28 L30 32" />
        <path d="M10 18 L6 14" />
        <path d="M34 18 L38 14" />
      </svg>
    ),
  },
  SCAG: {
    name: "Sword Coast Adventurer's Guide",
    background: "#141c20",
    tags: ["Subclasses", "Setting"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <line x1="100" y1="10" x2="100" y2="80" stroke="white" strokeWidth="0.8" />
        <line x1="30" y1="45" x2="170" y2="45" stroke="white" strokeWidth="0.8" />
        <circle cx="100" cy="45" r="10" fill="none" stroke="white" strokeWidth="1" />
        <line x1="100" y1="20" x2="100" y2="35" stroke="white" strokeWidth="1.2" />
        <line x1="100" y1="55" x2="100" y2="70" stroke="white" strokeWidth="1.2" />
        <line x1="55" y1="45" x2="70" y2="45" stroke="white" strokeWidth="1.2" />
        <line x1="130" y1="45" x2="145" y2="45" stroke="white" strokeWidth="1.2" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="8" x2="22" y2="36" />
        <line x1="18" y1="12" x2="26" y2="12" />
        <line x1="18" y1="18" x2="26" y2="18" />
        <circle cx="22" cy="24" r="2" fill="white" opacity="0.9" />
        <rect x="28" y="26" width="12" height="8" rx="1" transform="rotate(-12 28 26)" />
        <circle cx="32" cy="30" r="1.5" fill="white" opacity="0.9" />
        <circle cx="38" cy="28" r="1.5" fill="white" opacity="0.9" />
        <circle cx="34" cy="33" r="1.5" fill="white" opacity="0.9" />
      </svg>
    ),
  },
  EGW: {
    name: "Explorer's Guide to Wildemount",
    background: "#0f1a1a",
    tags: ["Races", "Setting"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <path d="M0 70 L30 50 L60 65 L90 40 L120 55 L150 35 L180 50 L200 45 L200 90 L0 90 Z" fill="none" stroke="white" strokeWidth="1" />
        <path d="M0 80 L40 60 L80 75 L120 55 L160 70 L200 60" fill="none" stroke="white" strokeWidth="0.8" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10 L28 22 L22 18 L16 22 Z" />
        <path d="M16 22 L16 34 Q16 38 22 38 Q28 38 28 34 L28 22" />
        <path d="M12 28 L8 32" />
        <path d="M32 28 L36 32" />
        <circle cx="22" cy="15" r="1.5" fill="white" opacity="0.9" />
      </svg>
    ),
  },
  FTD: {
    name: "Fizban's Treasury of Dragons",
    background: "#1a1410",
    tags: ["Races", "Draconic"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <path d="M20 20 L35 35 L20 50 L5 35 Z" fill="none" stroke="white" strokeWidth="0.8" />
        <path d="M60 10 L75 25 L60 40 L45 25 Z" fill="none" stroke="white" strokeWidth="0.8" />
        <path d="M100 20 L115 35 L100 50 L85 35 Z" fill="none" stroke="white" strokeWidth="0.8" />
        <path d="M140 15 L155 30 L140 45 L125 30 Z" fill="none" stroke="white" strokeWidth="0.8" />
        <path d="M175 25 L190 40 L175 55 L160 40 Z" fill="none" stroke="white" strokeWidth="0.8" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 28 L10 22 L14 18 L18 22" />
        <path d="M30 28 L34 22 L30 18 L26 22" />
        <path d="M18 32 Q22 38 26 32" />
        <path d="M22 10 L22 16" />
        <path d="M18 14 L22 10 L26 14" />
        <circle cx="22" cy="24" r="4" />
        <path d="M14 28 L8 26" />
        <path d="M30 28 L36 26" />
      </svg>
    ),
  },
  VRGR: {
    name: "Van Richten's Guide to Ravenloft",
    background: "#140f1a",
    tags: ["Races", "Horror"],
    pattern: (
      <svg width="100%" height="100%" viewBox="0 0 200 90" preserveAspectRatio="none">
        <path d="M100 10 L110 20 L120 15 L115 28 L130 30 L115 35 L120 48 L110 42 L100 55 L90 42 L80 48 L85 35 L70 30 L85 28 L80 15 L90 20 Z" fill="none" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <circle cx="100" cy="70" r="14" fill="none" stroke="white" strokeWidth="0.8" />
        <line x1="70" y1="70" x2="86" y2="70" stroke="white" strokeWidth="0.6" />
        <line x1="114" y1="70" x2="130" y2="70" stroke="white" strokeWidth="0.6" />
        <line x1="100" y1="56" x2="100" y2="72" stroke="white" strokeWidth="0.6" />
      </svg>
    ),
    illustration: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 24 L10 18 L14 14 L18 18" />
        <path d="M30 24 L34 18 L30 14 L26 18" />
        <path d="M18 28 Q22 34 26 28" />
        <path d="M16 18 L16 12" />
        <path d="M28 18 L28 12" />
        <circle cx="22" cy="10" r="3" fill="white" opacity="0.85" />
        <path d="M12 30 L8 38" />
        <path d="M32 30 L36 38" />
      </svg>
    ),
  },
};

export function StepSourceSelection({ data, onChange }: { data: { sources: string[] }; onChange: (patch: { sources: string[] }) => void }) {
  const selectedSources = data.sources || ["PHB"];

  const toggleSource = (sourceId: string) => {
    if (sourceId === "PHB") return;
    const current = selectedSources;
    if (current.includes(sourceId)) {
      onChange({ sources: current.filter((s) => s !== sourceId) });
    } else {
      onChange({ sources: [...current, sourceId] });
    }
  };

  const selectAll = () => {
    onChange({ sources: SOURCE_OPTIONS.map((s) => s.id) });
  };

  const selectCoreOnly = () => {
    onChange({ sources: ["PHB"] });
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

      <div className="grid grid-cols-2 gap-[10px]">
        {SOURCE_OPTIONS.map((source) => {
          const isSelected = selectedSources.includes(source.id);
          const isPHB = source.id === "PHB";
          const spec = BOOK_SPECS[source.id];

          if (!spec) return null;

          return (
            <BookCard
              key={source.id}
              abbr={source.id}
              name={spec.name}
              background={spec.background}
              tags={spec.tags}
              selected={isSelected}
              locked={isPHB}
              onToggle={() => toggleSource(source.id)}
              patternSvg={spec.pattern}
              illustrationSvg={spec.illustration}
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
