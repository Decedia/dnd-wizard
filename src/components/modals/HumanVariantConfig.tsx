"use client";

import { useState, useMemo, useEffect, useEffectEvent } from "react";
import { FeatSelectionModal } from "@/components/modals/FeatSelectionModal";
import { getStaticFeats } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SRDFeat } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { getTakenSpellNames } from "@/lib/taken-spells";
import { meetsPrerequisites } from "@/lib/feat-requirements";
import { featPicks } from "@/lib/level-up-picks";
import { PickCards, type PickCard } from "@/components/level-up/PickCards";

const SKILL_OPTIONS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
  "History", "Insight", "Intimidation", "Investigation", "Medicine",
  "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight of Hand", "Stealth", "Survival",
];

const ABILITY_OPTIONS = [
  { id: "str", label: "STR" },
  { id: "dex", label: "DEX" },
  { id: "con", label: "CON" },
  { id: "int", label: "INT" },
  { id: "wis", label: "WIS" },
  { id: "cha", label: "CHA" },
];

export interface HumanVariantConfigPayload {
  abilities: string[];
  skill: string | undefined;
  feat: string | undefined;
  featOptions?: Record<string, string>;
}

interface HumanVariantConfigProps {
  initialAbilities?: string[];
  initialSkill?: string;
  initialFeat?: string;
  initialFeatOptions?: Record<string, string>;
  disabledFeats?: string[];
  character?: Partial<Character>;
  sources?: string[];
  onChange: (payload: HumanVariantConfigPayload) => void;
}

/** Variant Human picks, laid out like the Half-Elf panel: two abilities, one skill, one feat. */
export function HumanVariantConfig({
  initialAbilities = [],
  initialSkill,
  initialFeat,
  initialFeatOptions,
  disabledFeats = [],
  character,
  sources,
  onChange,
}: HumanVariantConfigProps) {
  const { t, language } = useLanguage();
  const [abilities, setAbilities] = useState<string[]>(initialAbilities);
  const [skill, setSkill] = useState<string | undefined>(initialSkill);
  const [feat, setFeat] = useState<string | undefined>(initialFeat);
  const [featOptions, setFeatOptions] = useState<Record<string, string> | undefined>(initialFeatOptions);
  const [featModalOpen, setFeatModalOpen] = useState(false);

  // onChange is new on every parent render, so it is read as an effect event.
  const report = useEffectEvent((payload: HumanVariantConfigPayload) => onChange(payload));
  useEffect(() => {
    report({ abilities, skill, feat, featOptions });
  }, [abilities, skill, feat, featOptions]);

  // Skills from the class or background stay pickable but are flagged.
  // This race's own earlier pick is not counted as already known.
  const alreadyKnown = new Set<string>(
    Object.entries(character?.skills || {})
      .filter(([name, proficient]) => proficient && name !== character?.variantHumanSkill)
      .map(([name]) => name),
  );

  // The earlier Variant Human feat shows as taken elsewhere; it stays pickable here.
  const blocked = disabledFeats.filter((name) => name !== initialFeat);

  const cards = useMemo<PickCard[]>(() => {
    const open = getStaticFeats(sources || [], undefined, "en")
      .map((f) => f.name)
      .filter((name) => !blocked.includes(name) && (!character || meetsPrerequisites(character as Character, name)));
    return featPicks(character?.class, open).map((p) => ({
      key: p.name,
      title: p.name,
      why: language === "id" ? p.why.id : p.why.en,
      selected: feat === p.name,
    }));
  }, [sources, blocked, character, feat, language]);
  const featFromCards = !feat || cards.some((c) => c.key === feat);

  const toggleAbility = (abilityId: string) => {
    setAbilities((prev) => {
      if (prev.includes(abilityId)) return prev.filter((a) => a !== abilityId);
      if (prev.length < 2) return [...prev, abilityId];
      return [prev[1], abilityId];
    });
  };

  const pickCard = (name: string) => {
    setFeat((prev) => (prev === name ? undefined : name));
    setFeatOptions(undefined);
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border-strong bg-paper">
        <p className="text-xs text-ink-muted">
          {t("modal.variantHumanDescription", "You gain +1 to two different ability scores of your choice, proficiency in one skill of your choice, and one feat of your choice.")}
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
                    isSelected ? "border-ink bg-ink/10 text-ink" : "border-border-strong text-ink hover:border-ink/40"
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
              const isSelected = skill === skillName;
              const known = alreadyKnown.has(skillName) && !isSelected;
              return (
                <button
                  key={skillName}
                  type="button"
                  onClick={() => setSkill((prev) => (prev === skillName ? undefined : skillName))}
                  className={`p-1.5 text-left rounded-lg border-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isSelected ? "border-ink bg-ink/10 text-ink" : "border-border-strong text-ink hover:border-ink/40"
                  }`}
                >
                  {skillName}
                  {known && <span className="ml-1 text-ink-subtle">•</span>}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-ink-muted mt-1.5">
            {alreadyKnown.size > 0
              ? t("modal.skillKnownHint", "• = you already have it from your class or background.")
              : skill
                ? t("modal.oneSkillSelected", "1 skill selected")
                : t("modal.select1Skill", "Select 1 skill")}
          </div>
        </div>

        <div className="rounded-xl border-2 border-border-strong bg-surface p-3 space-y-3">
          <PickCards label={t("modal.suggestedFeats", "Suggested feats")} cards={cards} onPick={pickCard} />
          {feat && !featFromCards && (
            <div className="rounded-lg border-2 border-ink bg-ink/10 p-2 text-sm font-bold text-ink">{feat}</div>
          )}
          <button type="button" onClick={() => setFeatModalOpen(true)} className="btn btn-secondary w-full">
            {t("levelUp.flow.seeAllFeats", "See all feats")}
          </button>
        </div>
      </div>

      {featModalOpen && (
        <FeatSelectionModal
          selectedFeat={feat}
          sources={sources || []}
          disabledFeats={blocked}
          character={character as Character}
          takenSpells={(() => {
            // This feat's own picks stay pickable when it is changed.
            const own = new Set(Object.values(featOptions || {}).map((v) => v.toLowerCase()));
            const { ["variant-human-feat-options"]: _own, ...rest } = (character as Character)?.featureSelections || {};
            return new Set([...getTakenSpellNames({ ...(character as Character), featureSelections: rest })].filter((n) => !own.has(n)));
          })()}
          onSelect={(selected: SRDFeat, selectedOptions?: Record<string, string>) => {
            setFeat(selected.name);
            setFeatOptions(
              selectedOptions && Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
            );
            setFeatModalOpen(false);
          }}
          onClose={() => setFeatModalOpen(false)}
        />
      )}
    </div>
  );
}
