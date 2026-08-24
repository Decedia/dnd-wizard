"use client";

import { getStaticSpells } from "@/lib/srd-client";

interface LevelUpSpellSelectionSectionProps {
  description: string;
  level: number;
  selectedSpells: Record<number, string[]>;
  characterClass: string;
  onSpellChange: (level: number, spellName: string) => void;
}

export function LevelUpSpellSelectionSection({
  description,
  level,
  selectedSpells,
  characterClass,
  onSpellChange,
}: LevelUpSpellSelectionSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-parchment/60">{description}</p>
      {getStaticSpells()
        .filter((s) => s.classes?.includes(characterClass))
        .map((spell) => {
          const isSelected = (selectedSpells[level] || []).includes(spell.name);
          return (
            <button
              key={spell.name}
              type="button"
              onClick={() => onSpellChange(level, spell.name)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                isSelected
                  ? "border-accent/40 bg-accent/10"
                  : "border-border bg-charcoal/40 hover:border-accent/30"
              }`}
            >
              <span className="text-sm text-parchment">{spell.name}</span>
              <span className="text-xs text-text-muted ml-2">Level {spell.level}</span>
            </button>
          );
        })}
    </div>
  );
}
