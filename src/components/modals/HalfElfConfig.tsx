"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";

const ABILITY_OPTIONS = [
  { id: "str", label: "STR" },
  { id: "dex", label: "DEX" },
  { id: "con", label: "CON" },
  { id: "int", label: "INT" },
  { id: "wis", label: "WIS" },
  { id: "cha", label: "CHA" },
];

const SKILL_OPTIONS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
  "History", "Insight", "Intimidation", "Investigation", "Medicine",
  "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight of Hand", "Stealth", "Survival",
];

export interface HalfElfConfigPayload {
  abilities: string[];
  skills: string[];
}

interface HalfElfConfigProps {
  initialAbilities?: string[];
  initialSkills?: string[];
  character?: Partial<Character>;
  onChange: (payload: HalfElfConfigPayload) => void;
}

export function HalfElfConfig({
  initialAbilities = [],
  initialSkills = [],
  character,
  onChange,
}: HalfElfConfigProps) {
  const { t } = useLanguage();
  const [abilities, setAbilities] = useState<string[]>(initialAbilities);
  const [skills, setSkills] = useState<string[]>(initialSkills);

  // Skills already granted by the class or background stay available here but
  // are flagged, so a player can see they already have the proficiency.
  const alreadyKnown = new Set<string>(
    Object.entries(character?.skills || {})
      .filter(([, proficient]) => proficient)
      .map(([name]) => name),
  );

  useEffect(() => {
    onChange({ abilities, skills });
  }, [abilities, skills, onChange]);

  const toggleAbility = (abilityId: string) => {
    setAbilities((prev) => {
      if (prev.includes(abilityId)) return prev.filter((a) => a !== abilityId);
      if (prev.length < 2) return [...prev, abilityId];
      return [prev[1], abilityId];
    });
  };

  const toggleSkill = (skillName: string) => {
    setSkills((prev) => {
      if (prev.includes(skillName)) return prev.filter((s) => s !== skillName);
      if (prev.length < 2) return [...prev, skillName];
      return [prev[1], skillName];
    });
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border-strong bg-paper">
        <p className="text-xs text-ink-muted">{t("modal.halfElfHint", "Sebagai Half-Elf, kamu mendapatkan +1 pada dua ability score pilihanmu, dan proficiency pada dua skill pilihanmu.")}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">
            {t("modal.plusOneToTwoAbilities", "+1 on Two Abilities")}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ABILITY_OPTIONS.map((ability) => {
              const isSelected = abilities.includes(ability.id);
              return (
                <button
                  key={ability.id}
                  type="button"
                  onClick={() => toggleAbility(ability.id)}
                  className={`p-2 text-center rounded-lg border-2 text-xs font-bold uppercase transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-ink bg-ink/10 text-ink"
                      : "border-border-strong text-ink hover:border-ink/40"
                  }`}
                >
                  {ability.label}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-ink-muted mt-1.5">
            {abilities.length === 0
              ? t("modal.select2Abilities", "Select 2 abilities")
              : abilities.length === 1
                ? t("modal.oneAbilitySelected", "1 ability selected")
                : t("modal.twoAbilitiesSelected", "2 abilities selected")}
          </div>
        </div>

        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">
            {t("origin.skillProficiency", "Skill Proficiency")}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SKILL_OPTIONS.map((skillName) => {
              const isSelected = skills.includes(skillName);
              const known = alreadyKnown.has(skillName) && !isSelected;
              return (
                <button
                  key={skillName}
                  type="button"
                  onClick={() => toggleSkill(skillName)}
                  className={`p-1.5 text-left rounded-lg border-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-ink bg-ink/10 text-ink"
                      : "border-border-strong text-ink hover:border-ink/40"
                  }`}
                >
                  {skillName}
                  {known && <span className="ml-1 text-ink-subtle">•</span>}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-ink-muted mt-1.5">
            {skills.length === 0
              ? t("modal.select2Skills", "Select 2 skills")
              : skills.length === 1
                ? t("modal.oneSkillSelected", "1 skill selected")
                : t("modal.twoSkillsSelected", "2 skills selected")}
          </div>
        </div>
      </div>
    </div>
  );
}
