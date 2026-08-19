"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { skills as srdSkills, getClassData } from "@/data/srd";
import type { Character } from "@/lib/storage";
import { ExpertisePicker } from "@/components/character-sheet/ExpertisePicker";

interface StepSkillsProps {
  data: Character;
  onChange: (data: Partial<Character>) => void;
}

export function StepSkills({ data, onChange }: StepSkillsProps) {
  const classData = data.class ? getClassData(data.class) : null;
  const skillChoices = classData?.skillChoices || null;
  const allowedSkills = skillChoices?.options || [];
  const maxSelections = skillChoices?.count || 0;
  const currentSelections = Object.values(data.skills).filter(Boolean).length;

  const isSkillAllowed = (skillName: string) => {
    return allowedSkills.includes(skillName);
  };

  const isAtMaxSelections = (skillName: string) => {
    if (maxSelections === 0) return false;
    if (!isSkillAllowed(skillName)) return true;
    if (data.skills[skillName]) return false;
    return currentSelections >= maxSelections;
  };

  const toggleSkill = (skillName: string) => {
    if (isAtMaxSelections(skillName)) return;
    onChange({
      skills: {
        ...data.skills,
        [skillName]: !data.skills[skillName],
      },
    });
  };

  const handleExpertiseChange = (selections: string[]) => {
    onChange({ expertise: selections });
  };

  return (
    <StepCard title="Skills">
      {skillChoices ? (
        <p className="text-xs text-parchment/50 mb-3">
          Choose {maxSelections} skills from your class list ({currentSelections} of {maxSelections} selected)
        </p>
      ) : (
        <p className="text-xs text-parchment/50 mb-3">Select your character&apos;s skills.</p>
      )}
      <div className="space-y-2">
        {srdSkills.map(({ name, ability, description }) => {
          const isProficient = data.skills[name] ?? false;
          const allowed = isSkillAllowed(name);
          const disabled = !allowed || isAtMaxSelections(name);

          return (
            <div
              key={name}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                disabled
                  ? "border-parchment/5 bg-charcoal/20 opacity-50"
                  : "border-parchment/10 bg-charcoal/40"
              }`}
            >
              <label className={`flex items-center gap-3 cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}>
                <input
                  type="checkbox"
                  checked={isProficient}
                  onChange={() => toggleSkill(name)}
                  onBlur={() => {}}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
                />
                <span className="text-sm text-parchment/80">{name}</span>
                {!allowed && (
                  <span className="text-[10px] text-parchment/40">(not available)</span>
                )}
              </label>
              <span className="text-xs text-parchment/50 capitalize">{ability}</span>
            </div>
          );
        })}
      </div>

      <ExpertisePicker
        character={data}
        selectedExpertise={data.expertise || []}
        onExpertiseChange={handleExpertiseChange}
      />
    </StepCard>
  );
}
