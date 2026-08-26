"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticRaces, type SRDRace } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepRaceProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepRace({ data, onChange }: StepRaceProps) {
  const races: SRDRace[] = getStaticRaces();

  const handleSelect = useCallback(
    (raceName: string) => {
      onChange({ race: raceName });
    },
    [onChange]
  );

  return (
    <StepCard title="Race" hint="Choose your character's race. Each race has unique traits, ability bonuses, and special abilities.">
      <div className="space-y-3">
        {races.map((race) => {
          const isSelected = data.race === race.name;
          return (
          <button
            key={race.name}
            type="button"
            onClick={() => handleSelect(race.name)}
            className={`btn w-full p-4 text-left rounded-full ${
              isSelected
                ? "bg-paper-muted border-l-2 border-ink"
                : "bg-white border border-border-muted"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-ink">{race.name}</span>
                <span className="text-xs text-ink-muted">
                  {race.size} / Speed {race.speed} ft
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {Object.entries(race.abilityScoreIncreases || {})
                  .map(([stat, bonus]) => `+${bonus} ${stat.toUpperCase()}`)
                  .join(", ")}
              </p>
              {race.traits && race.traits.length > 0 && (
                <div className="mt-2 space-y-1">
                  {race.traits.map((trait) => (
                    <div key={trait.name} className="text-xs text-ink-muted">
                      <span className="font-bold">{trait.name}:</span> {trait.description}
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
