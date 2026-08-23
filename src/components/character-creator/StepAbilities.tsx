"use client";

import { useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticRace } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";
import type { Character } from "@/lib/storage";

interface StepAbilitiesProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepAbilities({ data, onChange }: StepAbilitiesProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const raceData = data.race ? getStaticRace(data.race) : null;

  const abilities = [
    { key: "str" as const, label: "STR", description: "Strength" },
    { key: "dex" as const, label: "DEX", description: "Dexterity" },
    { key: "con" as const, label: "CON", description: "Constitution" },
    { key: "int" as const, label: "INT", description: "Intelligence" },
    { key: "wis" as const, label: "WIS", description: "Wisdom" },
    { key: "cha" as const, label: "CHA", description: "Charisma" },
  ];

  const raceBonuses = useMemo(() => {
    if (!raceData?.abilityScoreIncreases) return {};
    return raceData.abilityScoreIncreases;
  }, [raceData]);

  const handleChange = (ability: keyof Character, value: number) => {
    onChange({ [ability]: Math.max(8, Math.min(20, value)) });
  };

  return (
    <StepCard
      title="Ability Scores"
      hint="Ability scores define your character's physical and mental abilities. Each class relies on different abilities — for example, a Fighter uses Strength, while a Wizard uses Intelligence."
    >
      <div className="space-y-3">
        {abilities.map(({ key, label, description }) => {
          const baseScore = data[key] || 10;
          const raceBonus = raceBonuses[key] || 0;
          const finalScore = baseScore + raceBonus;
          const modifier = getModifier(finalScore);

          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                <span className="text-[10px] text-text-muted">{description}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange(key, baseScore - 1)}
                  disabled={baseScore <= 8}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                >
                  -
                </button>
                <div className="flex flex-col items-center w-16">
                  <span className="text-lg font-bold text-parchment">{baseScore}</span>
                  {raceBonus > 0 && (
                    <span className="text-[10px] text-accent">+{raceBonus} racial</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(key, baseScore + 1)}
                  disabled={baseScore >= 20}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                >
                  +
                </button>
                <div className="flex flex-col items-center w-12">
                  <span className="text-sm font-semibold text-accent">
                    {modifier >= 0 ? `+${modifier}` : modifier}
                  </span>
                  <span className="text-[10px] text-text-muted">modifier</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </StepCard>
  );
}
