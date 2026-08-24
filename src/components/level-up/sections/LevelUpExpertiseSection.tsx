"use client";

import type { Character } from "@/lib/storage";

interface LevelUpExpertiseSectionProps {
  description: string;
  level: number;
  character: Character;
  expertiseChoices: Record<number, string[]>;
  expertiseCount: number;
  onExpertiseChange: (level: number, skill: string) => void;
}

export function LevelUpExpertiseSection({
  description,
  level,
  character,
  expertiseChoices,
  expertiseCount,
  onExpertiseChange,
}: LevelUpExpertiseSectionProps) {
  const current = expertiseChoices[level] || [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-parchment/60">{description}</p>
      {Object.entries(character.skills || {})
        .filter(([, proficient]) => proficient)
        .map(([name]) => {
          const isSelected = current.includes(name);
          const isDisabled = !isSelected && current.length >= expertiseCount;

          return (
            <label
              key={name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? "border-accent/40 bg-accent/10"
                  : isDisabled
                    ? "border-border bg-charcoal/40 opacity-50"
                    : "border-border bg-charcoal/40 hover:border-accent/30"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onExpertiseChange(level, name)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-border bg-charcoal text-accent focus:ring-accent/50 disabled:opacity-30"
              />
              <span className="text-sm text-parchment/80">{name}</span>
              {isSelected && (
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded ml-auto">
                  EXPERTISE
                </span>
              )}
            </label>
          );
        })}
    </div>
  );
}
