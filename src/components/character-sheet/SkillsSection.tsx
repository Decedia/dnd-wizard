"use client";

import { useState, useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { skills as srdSkills } from "@/data/srd";
import { getStaticClass } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, type Character } from "@/lib/storage";

interface SkillsSectionProps {
  character: Character & { passivePerception: number };
  onChange: (patch: Partial<Character & { passivePerception: number }>) => void;
  editMode?: boolean;
}

function StarIcon({ className, filled = false }: { className?: string; filled?: false }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function SkillsSection({ character, onChange, editMode = true }: SkillsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const profBonus = getProficiencyBonus(character.level);
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const classData = character.class ? getStaticClass(character.class) : null;
  const skillChoices = classData?.skillChoices || null;
  const allowedSkills = skillChoices?.options || [];
  const maxSelections = skillChoices?.count || 0;
  const currentSelections = allowedSkills.filter((skill) => character.skills[skill]).length;

  const isSkillAllowed = (skillName: string) => allowedSkills.includes(skillName);
  const isAlreadyProficient = (skillName: string) => !!character.skills[skillName];

  const isAtMaxSelections = (skillName: string) => {
    if (maxSelections === 0) return false;
    if (!isSkillAllowed(skillName)) return true;
    if (character.skills[skillName]) return false;
    return currentSelections >= maxSelections;
  };

  const toggleSkill = useCallback((skillName: string) => {
    if (isAtMaxSelections(skillName)) return;
    onChange({
      skills: {
        ...character.skills,
        [skillName]: !character.skills[skillName],
      },
    });
  }, [character.skills, isAtMaxSelections, onChange]);

  return (
    <SectionCard id="skills" title="SKILLS" icon={<SkillsIcon className="h-5 w-5" />}>
      {skillChoices && editMode && (
        <div className="mb-2.5 hint-box-light">
          <span className="text-[11px] text-ink-muted">
            Select {maxSelections} skills from your class list ({currentSelections} of {maxSelections} selected)
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {srdSkills.map(({ name, ability, description }) => {
          const score = character[ability as keyof Character] as number;
          const mod = getModifier(score);
          const isProficient = character.skills[name] ?? false;
          const isExpert = character.expertise?.includes(name) ?? false;
          const profMultiplier = isExpert ? 2 : 1;
          const total = isProficient ? mod + (profBonus * profMultiplier) : mod;
          const allowed = isSkillAllowed(name);
          const alreadyProficient = isAlreadyProficient(name);
          const disabled = !allowed || isAtMaxSelections(name) || alreadyProficient;

          return (
            <div
              key={name}
              className={`card px-2.5 py-2 ${
                isProficient
                  ? "border-ink/30 bg-ink/[0.02]"
                  : disabled
                    ? "border-border-muted bg-paper-muted/50 opacity-50"
                    : "border-border-strong bg-paper"
              }`}
            >
              {editMode ? (
                <label className={`flex items-center justify-between gap-2 cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-ink truncate">{name}</span>
                    <span className="text-[10px] text-ink-muted font-medium">{ability.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold ${isProficient ? "text-ink" : "text-ink-muted"}`}>
                      {total >= 0 ? `+${total}` : total}
                    </span>
                    <input
                      type="checkbox"
                      checked={isProficient}
                      onChange={() => toggleSkill(name)}
                      onBlur={onFieldBlur}
                      disabled={disabled}
                      className="checkbox-light disabled:opacity-30"
                    />
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-ink truncate flex items-center gap-1">
                      {name}
                      {(isProficient || isExpert) && (
                        <span className="flex items-center text-ink">
                          {isExpert && <StarIcon className="h-2.5 w-2.5 filled" />}
                          {isExpert && isProficient && <StarIcon className="h-2.5 w-2.5 -ml-0.5 filled" />}
                          {!isExpert && isProficient && <StarIcon className="h-2.5 w-2.5 filled" />}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-ink-muted font-medium">{ability.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                  <span className={`text-xs font-semibold ${isProficient ? "text-ink" : "text-ink-muted"}`}>
                    {total >= 0 ? `+${total}` : total}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <div className="mt-3">
          <span className="field-label-light">Passive Wisdom (Perception)</span>
          <input
            type="number"
            value={character.passivePerception}
            readOnly
            className="input max-w-[120px] bg-paper-muted"
          />
        </div>
      )}

      {tooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/5" onClick={() => setTooltip(null)}>
          <div className="max-w-sm surface bg-paper p-3.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-display font-semibold text-ink text-sm">{tooltip.name}</h3>
              <button onClick={() => setTooltip(null)} className="text-ink-muted hover:text-ink">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink">{tooltip.description}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SkillsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
