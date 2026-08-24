"use client";

import type { Character } from "@/lib/storage";

interface LevelUpAsiSectionProps {
  description: string;
  level: number;
  character: Character;
  asiChoices: Record<number, { ability: string; delta: number }[]>;
  onAsiChange: (level: number, ability: string, delta: number) => void;
  totalAsiAllocated: (level: number) => number;
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

export function LevelUpAsiSection({
  description,
  level,
  character,
  asiChoices,
  onAsiChange,
  totalAsiAllocated,
}: LevelUpAsiSectionProps) {
  const allocated = totalAsiAllocated(level);

  return (
    <div className="space-y-3">
      <p className="text-sm text-parchment/60">{description}</p>
      {ABILITIES.map((ability) => {
        const currentAllocation = (asiChoices[level] || []).find((c) => c.ability === ability);
        const currentValue = currentAllocation?.delta || 0;
        const baseScore = character[ability] as number;
        const newScore = baseScore + currentValue;

        return (
          <div
            key={ability}
            className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2"
          >
            <span className="text-sm font-medium text-parchment/80 w-12">
              {ability.toUpperCase()}
            </span>
            <span className="text-sm text-parchment/60">{baseScore}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAsiChange(level, ability, -1)}
                disabled={currentValue <= 0}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
              >
                -
              </button>
              <span className="text-sm font-semibold text-accent w-6 text-center">
                {currentValue}
              </span>
              <button
                type="button"
                onClick={() => onAsiChange(level, ability, 1)}
                disabled={allocated >= 2 || newScore >= 20}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <span className="text-sm font-semibold text-parchment w-8 text-right">
              {newScore}
            </span>
          </div>
        );
      })}
    </div>
  );
}
