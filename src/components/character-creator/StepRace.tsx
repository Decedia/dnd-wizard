"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticRaces, type SRDRace } from "@/lib/srd-client";

interface StepRaceProps {
  data: { race: string };
  onChange: (data: Partial<StepRaceProps["data"]>) => void;
}

export function StepRace({ data, onChange }: StepRaceProps) {
  const races: SRDRace[] = getStaticRaces();

  const handleSelect = useCallback((raceName: string) => {
    onChange({ race: raceName });
  }, [onChange]);

  return (
    <StepCard title="Race">
      <div className="space-y-3">
        {races.map((race) => {
          const isSelected = data.race === race.name;
          return (
            <button
              key={race.name}
              type="button"
              onClick={() => handleSelect(race.name)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-gold bg-gold/10"
                  : "border-parchment/10 bg-charcoal/40 hover:border-gold/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-parchment">{race.name}</span>
                <span className="text-xs text-parchment/40">
                  {race.size} / Speed {race.speed} ft
                </span>
              </div>
              <p className="mt-1 text-xs text-parchment/50">
                {Object.entries(race.abilityScoreIncreases)
                  .map(([stat, bonus]) => `+${bonus} ${stat.toUpperCase()}`)
                  .join(", ")}
              </p>
              <div className="mt-2 space-y-1">
                {race.traits.map((trait) => (
                  <div key={trait.name} className="text-xs text-parchment/60">
                    <span className="font-medium text-gold/80">{trait.name}:</span>{" "}
                    {trait.description}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
