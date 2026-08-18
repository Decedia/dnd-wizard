"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { SKILLS, getModifier, getProficiencyBonus, type Character } from "@/lib/storage";

interface SkillsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function SkillsSection({ character, onChange }: SkillsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const profBonus = getProficiencyBonus(character.level);

  return (
    <SectionCard id="skills" title="Skills" icon={<SkillsIcon className="h-5 w-5" />}>
      <div className="space-y-2">
        {SKILLS.map(({ name, ability }) => {
          const score = character[ability as keyof Character] as number;
          const mod = getModifier(score);
          const isProficient = character.skills[name] ?? false;
          const total = mod + (isProficient ? profBonus : 0);

          return (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2"
            >
              <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isProficient}
                onChange={(e) => onChange({ skills: { ...character.skills, [name]: e.target.checked } })}
                onBlur={onFieldBlur}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
              />
                <span className="text-sm text-parchment/80">{name}</span>
              </label>
              <span className="text-sm font-semibold text-parchment/70">
                {total >= 0 ? `+${total}` : total}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function SkillsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
