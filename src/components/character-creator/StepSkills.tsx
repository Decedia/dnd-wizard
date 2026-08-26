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
            <span className="text-muted">({selectedCount} of {skillChoices.count} selected)</span>
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
              className={`btn w-full px-3 py-2 text-left ${
                isProficient
                  ? "bg-white text-ink border-2 border-ink"
                  : disabled
                    ? "bg-white text-ink border border-border-muted opacity-50 cursor-not-allowed"
                    : "bg-white text-ink border border-border-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-body">{name}</span>
                  <span className="text-muted">{ability.toUpperCase()} {getAbilityModifier(ability)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isProficient && (
                    <span className="text-body">+{profBonus}</span>
                  )}
                  {isAllowed && (
                     <div className={`h-4 w-4 rounded border-2 ${isProficient ? "bg-paper border-paper" : "border-paper"}`}>
                       {isProficient && (
                         <CheckCircle weight="fill" color="var(--color-text-primary)" className="h-4 w-4" />
                       )}
                     </div>
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
