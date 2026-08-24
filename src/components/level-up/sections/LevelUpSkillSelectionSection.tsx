"use client";

interface LevelUpSkillSelectionSectionProps {
  description: string;
  level: number;
  skillChoices: Record<number, string[]>;
  skillOptions: string[];
  skillSelectionCount: number;
  onSkillChange: (level: number, skill: string) => void;
}

export function LevelUpSkillSelectionSection({
  description,
  level,
  skillChoices,
  skillOptions,
  skillSelectionCount,
  onSkillChange,
}: LevelUpSkillSelectionSectionProps) {
  const current = skillChoices[level] || [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-parchment/60">{description}</p>
      <div className="flex flex-wrap gap-2">
        {skillOptions?.map((skill) => {
          const isSelected = current.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => onSkillChange(level, skill)}
              className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                isSelected
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-charcoal/40 text-parchment/60 hover:border-accent/30"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
