"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { activeRaceChoices, type RaceChoice } from "@/lib/srd-client";

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
  /** A SCAG variant's picks (the elf trait, then its cantrip), by race choice id. */
  choices?: Record<string, string>;
}

interface HalfElfConfigProps {
  initialAbilities?: string[];
  initialSkills?: string[];
  initialChoices?: Record<string, string>;
  /** Set for a SCAG variant: its elf trait replaces Skill Versatility. */
  variant?: boolean;
  raceChoices?: RaceChoice[];
  character?: Partial<Character>;
  onChange: (payload: HalfElfConfigPayload) => void;
}

export function HalfElfConfig({
  initialAbilities = [],
  initialSkills = [],
  initialChoices = {},
  variant = false,
  raceChoices = [],
  character,
  onChange,
}: HalfElfConfigProps) {
  const { t } = useLanguage();
  const [abilities, setAbilities] = useState<string[]>(initialAbilities);
  const [skills, setSkills] = useState<string[]>(variant ? [] : initialSkills);
  const [picks, setPicks] = useState<Record<string, string>>(initialChoices);
  const shownChoices = activeRaceChoices(raceChoices, picks);
  const raceChoicesRef = useRef(raceChoices);
  raceChoicesRef.current = raceChoices;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Skills already granted by the class or background stay available here but
  // are flagged, so a player can see they already have the proficiency.
  const alreadyKnown = new Set<string>(
    Object.entries(character?.skills || {})
      .filter(([, proficient]) => proficient)
      .map(([name]) => name),
  );

  useEffect(() => {
    // Drop a pick whose choice no longer applies (the cantrip after switching
    // to weapon training).
    // raceChoices and onChange are new on every parent render, so they are
    // read through refs; depending on them would report on every render.
    const active = new Set(activeRaceChoices(raceChoicesRef.current, picks).map((c) => c.id));
    const choices = Object.fromEntries(Object.entries(picks).filter(([id]) => active.has(id)));
    onChangeRef.current({ abilities, skills, choices });
  }, [abilities, skills, picks]);

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
        <p className="text-xs text-ink-muted">
          {variant
            ? t("modal.halfElfVariantHint", "As a half-elf of elf descent, you gain +1 to two ability scores of your choice, and one elf trait instead of two skills.")
            : t("modal.halfElfHint", "Sebagai Half-Elf, kamu mendapatkan +1 pada dua ability score pilihanmu, dan proficiency pada dua skill pilihanmu.")}
        </p>
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

        {shownChoices.map((choice) => (
          <div key={choice.id} className="rounded-xl border-2 border-border-strong bg-surface p-3">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">{choice.name}</div>
            <div className="grid grid-cols-1 gap-1.5">
              {(choice.options || []).map((opt) => {
                const isSelected = picks[choice.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPicks((prev) => ({ ...prev, [choice.id]: opt.id }))}
                    className={`p-2 text-left rounded-lg border-2 text-xs transition-all active:scale-[0.98] ${
                      isSelected ? "border-ink bg-ink/10 text-ink" : "border-border-strong text-ink hover:border-ink/40"
                    }`}
                  >
                    <span className="font-semibold">{opt.name}</span>
                    {opt.description && <span className="block text-[10px] text-ink-muted mt-0.5">{opt.description}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!variant && (
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
        )}
      </div>
    </div>
  );
}
