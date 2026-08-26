"use client";

import { useMemo } from "react";
import { CheckCircle } from "phosphor-react";
import { StepCard } from "./StepCard";
import { getStaticClass } from "@/lib/srd-client";
import { getProficiencyBonus } from "@/lib/storage";
import type { Character } from "@/lib/storage";

interface StepSkillsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSkills({ data, onChange }: StepSkillsProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const profBonus = getProficiencyBonus(data.level);
  const skillChoices = classData?.skillChoices || null;

  const selectedCount = useMemo(() => {
    if (!skillChoices) return 0;
    return Object.entries(data.skills || {}).filter(([name, proficient]) => proficient && skillChoices.options.includes(name)).length;
  }, [data.skills, skillChoices]);

  const toggleSkill = (skillName: string) => {
    if (!skillChoices) {
      onChange({
        skills: { ...data.skills, [skillName]: !data.skills[skillName] },
      });
      return;
    }

    const isAllowed = skillChoices.options.includes(skillName);
    const isSelected = data.skills[skillName];
    const atMax = selectedCount >= skillChoices.count;

    if (!isAllowed) return;
    if (!isSelected && atMax) return;

    onChange({
      skills: { ...data.skills, [skillName]: !isSelected },
    });
  };

  const allSkills = useMemo(() => {
    const skills: { name: string; ability: string }[] = [];
    const abilitySkills: Record<string, string[]> = {
      str: ["Athletics"],
      dex: ["Acrobatics", "Sleight of Hand", "Stealth"],
      con: [],
      int: ["Arcana", "History", "Investigation", "Nature", "Religion"],
      wis: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
      cha: ["Deception", "Intimidation", "Performance", "Persuasion"],
    };

    for (const [ability, skillNames] of Object.entries(abilitySkills)) {
      for (const skill of skillNames) {
        skills.push({ name: skill, ability });
      }
    }

    return skills;
  }, []);

  const getAbilityModifier = (ability: string) => {
    const score = data[ability as keyof Character] as number;
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  return (
    <StepCard
      title="Skills & Proficiencies"
      hint="Choose your character's skill proficiencies. Skills represent your character's abilities and training, from Athletics to Persuasion."
    >
      {skillChoices && (
        <div className="mb-4 hint-box-light">
          <p className="text-body">
            Select <span className="font-bold">{skillChoices.count}</span> skills from your class list.
            <span className="text-[var(--color-text-muted)]">({selectedCount} of {skillChoices.count} selected)</span>
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {allSkills.map(({ name, ability }) => {
          const isProficient = data.skills[name] || false;
          const isAllowed = !skillChoices || skillChoices.options.includes(name);
          const atMax = skillChoices ? selectedCount >= skillChoices.count : false;
          const disabled = !isAllowed || (!isProficient && atMax);

          return (
            <button
              key={name}
              type="button"
              onClick={() => toggleSkill(name)}
              disabled={disabled}
              className={`btn w-full px-3 py-2 text-left transition-all ${
                isProficient
                  ? "bg-[var(--color-bg)] text-[var(--color-text-primary)] border-2 border-[var(--color-border-active)]"
                  : disabled
                    ? "bg-transparent text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40 cursor-not-allowed"
                    : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-body ${isProficient ? "font-semibold" : ""}`}>{name}</span>
                  <span className={`text-[10px] ${isAllowed ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}>
                    {ability.toUpperCase()} {getAbilityModifier(ability)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isProficient && (
                    <span className="text-green-600 text-sm font-bold">+{profBonus}</span>
                  )}
                  {isAllowed && (
                     <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isProficient ? "bg-green-600 border-green-600" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
                       {isProficient && (
                         <CheckCircle weight="fill" color="#ffffff" className="h-3 w-3" />
                       )}
                     </div>
                  )}
                  {!isAllowed && (
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded">N/A</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
