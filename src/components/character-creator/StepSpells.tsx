"use client";

import { useMemo, useRef } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepSpellsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSpells({ data, onChange }: StepSpellsProps) {
  const idCounter = useRef(0);
  const classData = data.class ? getStaticClass(data.class) : null;
  const spellcastingAbility = classData?.spellcastingAbility || "int";
  const spells = getStaticSpells().filter((s) => s.classes?.includes(data.class));

  const selectedSpells = data.spells || [];

  const toggleSpell = (spellName: string) => {
    const isSelected = selectedSpells.some((s) => s.name === spellName);
    if (isSelected) {
      onChange({
        spells: selectedSpells.filter((s) => s.name !== spellName),
      });
    } else {
      const id = `spell-${idCounter.current++}`;
      onChange({
        spells: [...selectedSpells, { id, name: spellName, level: 0, source: "srd" as const, description: "" }],
      });
    }
  };

  const spellLevels = useMemo(() => {
    const levels: { [key: number]: typeof spells } = {};
    for (const spell of spells) {
      const level = spell.level || 0;
      if (!levels[level]) levels[level] = [];
      levels[level].push(spell);
    }
    return levels;
  }, [spells]);

  return (
    <StepCard
      title="Spells"
      hint="Choose your character's starting spells. Spells are magical abilities that your character can cast. Choose spells that fit your character's theme and playstyle."
    >
      <div className="space-y-4">
        {Object.entries(spellLevels)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([level, levelSpells]) => (
            <div key={level}>
              <h3 className="text-xs font-medium text-parchment/60 uppercase tracking-wider mb-2">
                {level === "0" ? "Cantrips" : `Level ${level} Spells`}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {levelSpells.map((spell) => {
                  const isSelected = selectedSpells.some((s) => s.name === spell.name);
                  return (
                    <button
                      key={spell.name}
                      type="button"
                      onClick={() => toggleSpell(spell.name)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        isSelected
                          ? "border-accent/40 bg-accent/10"
                          : "border-border bg-charcoal/40 hover:border-accent/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-parchment">{spell.name}</span>
                        <span className="text-xs text-text-muted">
                          {spell.school || ""}
                        </span>
                      </div>
                      {spell.description && (
                        <p className="text-xs text-parchment/50 mt-1 line-clamp-2">{spell.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </StepCard>
  );
}
