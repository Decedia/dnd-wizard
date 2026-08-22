"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { skills as srdSkills } from "@/data/srd";
import { getStaticClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { ExpertisePicker } from "@/components/character-sheet/ExpertisePicker";

interface StepSkillsProps {
  data: Character;
  onChange: (data: Partial<Character>) => void;
  showExpertisePicker?: boolean;
  extraSkillChoices?: number;
}

export function StepSkills({ data, onChange, showExpertisePicker = true, extraSkillChoices = 0 }: StepSkillsProps) {
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const hasSeen = sessionStorage.getItem("skills-info-seen");
      if (!hasSeen) {
        sessionStorage.setItem("skills-info-seen", "true");
      }
      return !hasSeen;
    }
    return false;
  });

  const classData = data.class ? getStaticClass(data.class) : null;
  const skillChoices = classData?.skillChoices || null;
  const allowedSkills = skillChoices?.options || [];
  const maxSelections = skillChoices?.count || 0;
  const totalMaxSelections = maxSelections + extraSkillChoices;
  const currentSelections = Object.values(data.skills).filter(Boolean).length;

  const isSkillAllowed = (skillName: string) => {
    if (totalMaxSelections === 0) return allowedSkills.includes(skillName);
    return true;
    };
  
  const isAtMaxSelections = (skillName: string) => {
    if (totalMaxSelections === 0) return false;
    if (data.skills[skillName]) return false;
    return currentSelections >= totalMaxSelections;
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
      {showInfo && (
        <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 p-3">
          <p className="text-xs text-parchment/70 mb-2">
            <strong className="text-gold">Why these skills?</strong> Your class determines which skills you can choose from. Each class has a set of skills that reflect its core competencies and training.
          </p>
          <p className="text-xs text-parchment/70 mb-3">
            <strong className="text-gold">Proficiency matters</strong> because it adds your proficiency bonus to the relevant ability check. Being proficient means your character is especially skilled in that area.
          </p>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="text-xs text-gold hover:text-gold/80 font-medium"
          >
            Got it
          </button>
        </div>
      )}

      {skillChoices || extraSkillChoices > 0 ? (
        <p className="text-xs text-parchment/50 mb-3">
          Choose {totalMaxSelections} skills ({currentSelections} of {totalMaxSelections} selected)
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

      {showExpertisePicker && (
        <ExpertisePicker
          character={data}
          selectedExpertise={data.expertise || []}
          onExpertiseChange={handleExpertiseChange}
        />
      )}
    </StepCard>
  );
}
