"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticRaces, type SRDRace } from "@/lib/srd-client";
import { InfoButton } from "@/components/InfoButton";
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
            className={`w-full p-4 text-left rounded-[var(--radius-md)] transition-all ${
              isSelected
                ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="text-card-title">{race.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted">
                    {race.size} / Speed {race.speed} ft
                  </span>
                  {race.traits && race.traits.length > 0 && (
                    <InfoButton
                      title={`${race.name} Traits`}
                      description={race.traits.map((t) => `${t.name}: ${t.description}`).join("\n\n")}
                    />
                  )}
                </div>
              </div>
              <p className="mt-1 text-description">
                {Object.entries(race.abilityScoreIncreases || {})
                  .map(([stat, bonus]) => `+${bonus} ${stat.toUpperCase()}`)
                  .join(", ")}
              </p>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
