"use client";

import { useState, useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { skills as srdSkills } from "@/data/srd";
import { getStaticClass } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, type Character } from "@/lib/storage";
import { getBackgroundData } from "@/data/backgrounds";
import { StarIcon as Star, XIcon as X, ListChecksIcon as ListChecks, CircleIcon as Circle, InfoIcon } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";

interface SkillsSectionProps {
  character: Character & { passivePerception: number };
  onChange: (patch: Partial<Character & { passivePerception: number }>) => void;
  editMode?: boolean;
}

export function SkillsSection({ character, onChange, editMode = true }: SkillsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const profBonus = getProficiencyBonus(character.level);
  const [infoSkill, setInfoSkill] = useState<string | null>(null);

  const classData = character.class ? getStaticClass(character.class) : null;
  const skillChoices = classData?.skillChoices || null;
  const allowedSkills = skillChoices?.options || [];
  const maxSelections = skillChoices?.count || 0;
  const background = getBackgroundData(character.background);
  const backgroundSkills = background?.skillProficiencies || [];
  const currentSelections = allowedSkills.filter((skill) => character.skills[skill] && !backgroundSkills.includes(skill)).length;

  const isSkillAllowed = (skillName: string) => allowedSkills.includes(skillName);
  const isBackgroundSkill = (skillName: string) => backgroundSkills.includes(skillName);
  const isAlreadyProficient = (skillName: string) => !!character.skills[skillName];

  const isAtMaxSelections = (skillName: string) => {
    if (maxSelections === 0) return false;
    if (isBackgroundSkill(skillName)) return false;
    if (!isSkillAllowed(skillName)) return true;
    if (character.skills[skillName]) return false;
    return currentSelections >= maxSelections;
  };

  const toggleSkill = useCallback((skillName: string) => {
    if (isAtMaxSelections(skillName)) return;
    if (isBackgroundSkill(skillName)) return;
    onChange({
      skills: {
        ...character.skills,
        [skillName]: !character.skills[skillName],
      },
    });
  }, [character.skills, isAtMaxSelections, isBackgroundSkill, onChange]);

  return (
    <SectionCard id="skills" title="Skills" icon={<ListChecks className="h-5 w-5" />}>
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
          const isBgSkill = isBackgroundSkill(name);
          const alreadyProficient = isAlreadyProficient(name);
          const disabled = !allowed || isAtMaxSelections(name) || alreadyProficient;

          return (
            <div
              key={name}
              className={`card px-2.5 py-2 ${
                isProficient
                  ? isBgSkill ? "bg-[var(--color-success-50)]" : "bg-ink/[0.02]"
                  : disabled
                    ? "bg-paper-muted/50 opacity-50"
                    : "bg-paper"
              }`}
            >
              {editMode ? (
                <label className={`flex items-center justify-between gap-2 cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}>
                  <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-ink truncate flex items-center gap-1">
                        {name}
                        {isRecommended("skill", name) && <Star className="h-3 w-3 text-amber-500" />}
                        {isBgSkill && <span className="text-[9px] font-bold text-[var(--color-success-600)] bg-[var(--color-success-100)] px-1 rounded">BG</span>}
                      </span>
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
                      disabled={disabled || isBgSkill}
                      className="checkbox disabled:opacity-30"
                    />
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-ink truncate flex items-center gap-1">
                        {(isProficient || isExpert) && (
                          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: isExpert ? "var(--color-accent-purple-600)" : isBgSkill ? "var(--color-success-500)" : "var(--color-ink)" }} />
                        )}
                        {name}
                        {isRecommended("skill", name) && <Star className="h-3 w-3 text-amber-500" />}
                      </span>
                     <span className="text-[10px] text-ink-muted font-medium">{ability.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold ${isProficient ? "text-ink" : "text-ink-muted"}`}>
                      {total >= 0 ? `+${total}` : total}
                    </span>
                    {(isProficient || isExpert) && (
                      <div className="relative">
                        <button type="button" onClick={() => setInfoSkill(infoSkill === name ? null : name)} className="shrink-0 text-ink-muted hover:text-ink">
                          <InfoIcon size={10} />
                        </button>
                        {infoSkill === name && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-28 rounded border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg p-1.5">
                            <span className={`text-[9px] font-bold px-1 rounded block text-center ${
                              isExpert ? "text-purple-700 bg-purple-100" : isBgSkill ? "text-green-700 bg-green-100" : "text-ink bg-paper-muted"
                            }`}>
                              {isExpert ? "expertise" : isBgSkill ? "background" : `normal +${profBonus}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            className="input max-w-[120px]"
          />
        </div>
      )}
    </SectionCard>
  );
}
