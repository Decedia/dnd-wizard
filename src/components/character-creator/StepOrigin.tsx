"use client";

import { useState, useCallback } from "react";
import { Sword, Users, CaretRight, Person, Sparkle, Shield, Leaf, Hand, Brain, Skull, Flame, Lightning, Hammer } from "@phosphor-icons/react";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Barbarian: Sparkle,
  Bard: Sparkle,
  Cleric: Shield,
  Druid: Leaf,
  Fighter: Sword,
  Monk: Hand,
  Paladin: Shield,
  Ranger: Sparkle,
  Rogue: Sparkle,
  Sorcerer: Sparkle,
  Warlock: Skull,
  Wizard: Sparkle,
  Artificer: Brain,
};

const RACE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Human: Person,
  Elf: Person,
  Dwarf: Person,
  Halfling: Person,
  Dragonborn: Person,
  Gnome: Person,
  "Half-Elf": Person,
  "Half-Orc": Person,
  Tiefling: Person,
  "Variant Human": Person,
};

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepOrigin({ data, onChange }: StepOriginProps) {
  const { t, language } = useLanguage();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [raceModalOpen, setRaceModalOpen] = useState(false);
  const [characterName, setCharacterName] = useState(data.name || "");
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset, language);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset, language);

  const selectedClass = classes.find((c) => c.name === data.class);
  const selectedRace = races.find((r) => r.name === data.race);

  const truncate = (text?: string, max = 140) => {
    if (!text) return "";
    const cleaned = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n+/g, " ").trim();
    if (cleaned.length <= max) return cleaned;
    return cleaned.slice(0, max).trimEnd() + "...";
  };

  const handleNameChange = useCallback(
    (value: string) => {
      setCharacterName(value);
      onChange({ name: value });
    },
    [onChange]
  );

  const handleClassSelect = useCallback(
    (payload: any) => {
      const className = payload.name;
      if (className !== data.class) {
        onChange({
          class: className,
          subclass: undefined,
          inventory: [],
          skills: {},
          spells: [],
          cantrips: [],
          features: [],
          featureSelections: {},
          appliedAsi: [],
          attacks: [],
          costumeSpells: [],
        });
      }
      setClassModalOpen(false);
    },
    [data.class, onChange]
  );

  const handleRaceSelect = useCallback(
    (payload: any) => {
      const raceName = payload.name;
      const isVariant = payload.configChoice?.featureData?.choiceType === "variant";
      const nextRaceChoices = { ...data.raceChoices };
      if (payload.configChoice?.parentChoiceId && payload.configChoice?.featureData?.id) {
        nextRaceChoices[payload.configChoice.parentChoiceId] = payload.configChoice.featureData.id;
      }

      const oldAbilities = data.variantHumanAbilities || [];
      const newAbilities = isVariant ? (payload.configChoice?.featureData?.abilities || []) : [];
      const oldSkill = data.variantHumanSkill;
      const newSkill = isVariant ? payload.configChoice?.featureData?.skill : undefined;
      const oldFeat = data.featureSelections?.["variant-human-feat"]?.[0];
      const newFeat = isVariant ? payload.configChoice?.featureData?.feat : undefined;

      const abilityPatch: Record<string, number> = {};
      for (const ab of oldAbilities) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) - 1;
      }
      for (const ab of newAbilities) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) + 1;
      }

      const skillPatch: Record<string, any> = {};
      if (newSkill && !data.skills[newSkill]) {
        skillPatch.skills = { ...data.skills, [newSkill]: true };
      }

      const featPatch: Record<string, any> = { features: data.features };
      if (newFeat && !data.features.some((f) => f.name === newFeat)) {
        const { getStaticFeat } = require("@/lib/srd-client");
        const featData = getStaticFeat(newFeat);
        if (featData) {
          featPatch.features = [
            ...data.features,
            {
              id: `feat-${newFeat}`.replace(/\s+/g, "-"),
              name: featData.name,
              description: featData.description,
              summary: featData.summary || null,
              source: "race" as const,
              locked: true,
            },
          ];
        }
      }
      if (!newFeat && oldFeat) {
        featPatch.features = data.features.filter((f) => f.name !== oldFeat);
      }

      onChange({
        race: raceName,
        raceVariant: isVariant ? "variant" : undefined,
        raceChoices: nextRaceChoices,
        ...(isVariant ? {
          variantHumanAbilities: newAbilities,
          variantHumanSkill: newSkill,
          featureSelections: {
            ...data.featureSelections,
            "variant-human-feat": newFeat ? [newFeat] : [],
          },
        } : { 
          variantHumanAbilities: undefined, 
          variantHumanSkill: undefined, 
          featureSelections: { ...data.featureSelections, "variant-human-feat": [] } 
        }),
        ...abilityPatch,
        ...skillPatch,
        ...featPatch,
      });
      setRaceModalOpen(false);
    },
    [data, onChange]
  );

  const isFormComplete = data.class && data.race;

  return (
    <div className="space-y-3">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight">{t("origin.title", "Identitas & Asal")}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{t("origin.hint", "Tentukan nama, kelas, dan ras untuk memulai pahlawanmu.")}</p>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] mb-2">{t("origin.characterNameRequired", "NAMA KARAKTER")}</label>
        <input 
          type="text" 
          placeholder={t("origin.enterCharacterName", "Masukkan nama...")}
          value={characterName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full bg-[var(--color-bg)] border-2 border-[var(--color-border)] focus:border-[var(--color-accent-indigo-500)] rounded-2xl py-3.5 px-4 text-base font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors outline-none" 
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-widest text-[var(--color-text-secondary)] mb-3">{t("creator.selectClassRace", "PILIH KELAS & RAS")}</h2>
        
        {/* Class Card */}
        <div 
          onClick={() => setClassModalOpen(true)}
          className="group border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent-indigo-500)] bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all mb-3"
        >
          <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-indigo-50)] text-[var(--color-accent-indigo-600)] flex items-center justify-center shrink-0">
            {data.class ? (() => { const Icon = CLASS_ICONS[data.class] || Sword; return <Icon className="h-6 w-6" />; })() : <Sword className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{data.class || t("origin.selectClass", "Pilih Kelas")}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{data.class ? truncate(selectedClass?.flavorText || data.class) : t("origin.classExamples", "Fighter, Wizard, Rogue...")}</p>
          </div>
          <CaretRight className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-indigo-500)] transition-colors h-5 w-5" />
        </div>

        {/* Race Card */}
        <div 
          onClick={() => setRaceModalOpen(true)}
          className="group border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent-teal-500)] bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-teal-50)] text-[var(--color-accent-teal-600)] flex items-center justify-center shrink-0">
            {data.race ? (() => { const Icon = RACE_ICONS[data.race] || Users; return <Icon className="h-6 w-6" />; })() : <Users className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{data.race ? (data.race === "Human" && data.raceVariant === "variant" ? t("origin.variantHuman", "Variant Human") : data.race) : t("origin.selectRace", "Pilih Ras")}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{data.race ? truncate(selectedRace?.flavorText || (selectedRace as any)?.recommendation?.text || data.race) : t("origin.raceExamples", "Manusia, Elf, Dwarf...")}</p>
          </div>
          <CaretRight className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-teal-500)] transition-colors h-5 w-5" />
        </div>
      </div>

      {classModalOpen && (
        <ClassSelectionModal
          isOpen={true}
          onClose={() => setClassModalOpen(false)}
          onConfirm={handleClassSelect}
          characterSources={data.sources}
          currentCharacter={data}
        />
      )}

      {raceModalOpen && (
        <RaceSelectionModal
          isOpen={true}
          onClose={() => setRaceModalOpen(false)}
          onConfirm={handleRaceSelect}
          characterSources={data.sources}
          currentCharacter={data}
        />
      )}
    </div>
  );
}
