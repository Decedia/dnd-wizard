"use client";

import { encodeFeatOptions } from "@/lib/feat-grants";
import { useState, useCallback } from "react";
import { Sword, Users, CaretRight, Person, Sparkle, Shield, Leaf, Hand, Brain, Skull, Flame, Lightning, Hammer, Scroll } from "@phosphor-icons/react";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";
import { FieldState } from "@/components/ui/FieldState";
import { BackgroundSelectionModal, backgroundStatLine } from "../modals/BackgroundSelectionModal";
import { LanguagePicker } from "./LanguagePicker";
import { getBackgroundData } from "@/data/backgrounds";
import { applyBackground } from "@/lib/character-creation";

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
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false);
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset, language);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset, language);

  const selectedClass = classes.find((c) => c.name === data.class);
  const selectedRace = races.find((r) => r.name === data.race);
  const selectedBackground = getBackgroundData(data.background);

  const truncate = (text?: string, max = 140) => {
    if (!text) return "";
    const cleaned = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n+/g, " ").trim();
    if (cleaned.length <= max) return cleaned;
    return cleaned.slice(0, max).trimEnd() + "...";
  };

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

      const isHalfElf = raceName.startsWith("Half-Elf");
      const oldAbilities = data.variantHumanAbilities || [];
      const newAbilities = isVariant ? (payload.configChoice?.featureData?.abilities || []) : [];
      const oldSkill = data.variantHumanSkill;
      const newSkill = isVariant ? payload.configChoice?.featureData?.skill : undefined;
      const oldFeat = data.featureSelections?.["variant-human-feat"]?.[0];
      const newFeat = isVariant ? payload.configChoice?.featureData?.feat : undefined;

      // Half-Elf mirrors the variant human pattern: undo what was previously
      // applied, then apply the new picks.
      const oldHalfElfAbilities = data.halfElfAbilities || [];
      const newHalfElfAbilities = isHalfElf ? (payload.configChoice?.featureData?.abilities || []) : [];
      const oldHalfElfSkills = data.halfElfSkills || [];
      const newHalfElfSkills = isHalfElf ? (payload.configChoice?.featureData?.skills || []) : [];

      const abilityPatch: Record<string, number> = {};
      for (const ab of [...oldAbilities, ...oldHalfElfAbilities]) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) - 1;
      }
      for (const ab of [...newAbilities, ...newHalfElfAbilities]) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) + 1;
      }

      const nextSkills: Record<string, boolean> = { ...data.skills };
      if (newSkill && !nextSkills[newSkill]) nextSkills[newSkill] = true;
      for (const skill of newHalfElfSkills) nextSkills[skill] = true;
      for (const skill of oldHalfElfSkills) {
        if (newHalfElfSkills.includes(skill)) continue;
        delete nextSkills[skill];
      }
      const skillPatch: Record<string, any> = { skills: nextSkills };

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
            "variant-human-feat-options": newFeat ? encodeFeatOptions(payload.configChoice?.featureData?.featOptions) : [],
          },
        } : { 
          variantHumanAbilities: undefined, 
          variantHumanSkill: undefined, 
          featureSelections: { ...data.featureSelections, "variant-human-feat": [], "variant-human-feat-options": [] } 
        }),
        // Half-Elf selections are stored on the character so the abilities step
        // and the final rebuild can see them, and are cleared when leaving the
        // race so a stale +1 cannot linger.
        ...(isHalfElf
          ? { halfElfAbilities: newHalfElfAbilities, halfElfSkills: newHalfElfSkills }
          : { halfElfAbilities: undefined, halfElfSkills: undefined }),
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
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{t("origin.hintBackground", "Tentukan kelas, ras, dan latar belakang pahlawanmu.")}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-widest text-[var(--color-text-secondary)] mb-3">{t("creator.selectClassRace", "CHOOSE CLASS & RACE")}</h2>
        {/* Class Card */}
        <FieldState
          value={data.class}
          label={t("form.class", "Class")}
          required
        >
          <div
            onClick={() => setClassModalOpen(true)}
            className="group border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent-indigo-500)] bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all mb-3"
          >
            <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-indigo-50)] text-[var(--color-accent-indigo-600)] flex items-center justify-center shrink-0">
              {data.class ? (() => { const Icon = CLASS_ICONS[data.class] || Sword; return <Icon className="h-6 w-6" />; })() : <Sword className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{data.class || t("origin.selectClass", "Pilih Kelas")}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{data.class ? truncate(selectedClass?.flavor || data.class) : t("origin.classExamples", "Fighter, Wizard, Rogue...")}</p>
            </div>
            <CaretRight className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-indigo-500)] transition-colors h-5 w-5" />
          </div>
        </FieldState>

        {/* Race Card */}
        <FieldState
          value={data.race}
          label={t("form.race", "Race")}
          required
        >
          <div
            onClick={() => setRaceModalOpen(true)}
            className="group border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent-teal-500)] bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-teal-50)] text-[var(--color-accent-teal-600)] flex items-center justify-center shrink-0">
              {data.race ? (() => { const Icon = RACE_ICONS[data.race] || Users; return <Icon className="h-6 w-6" />; })() : <Users className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{data.race ? (data.race === "Human" && data.raceVariant === "variant" ? t("origin.variantHuman", "Variant Human") : data.race) : t("origin.selectRace", "Pilih Ras")}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{data.race ? truncate(selectedRace?.flavor || (selectedRace as any)?.recommendation?.text || data.race) : t("origin.raceExamples", "Manusia, Elf, Dwarf...")}</p>
            </div>
            <CaretRight className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-teal-500)] transition-colors h-5 w-5" />
          </div>
        </FieldState>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-widest text-[var(--color-text-secondary)] mb-3">{t("origin.selectBackground", "PILIH LATAR BELAKANG")}</h2>
        <FieldState
          value={data.background}
          label={t("form.background", "Background")}
          required
        >
          <div
            onClick={() => setBackgroundModalOpen(true)}
            className="group border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-border-active)] bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-ink/10 text-ink flex items-center justify-center shrink-0">
              <Scroll className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{data.background || t("origin.chooseBackground", "Pilih Latar Belakang")}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                {selectedBackground ? backgroundStatLine(selectedBackground, t) : t("origin.backgroundExamples", "Acolyte, Soldier, Sage...")}
              </p>
            </div>
            <CaretRight className="text-[var(--color-text-muted)] transition-colors h-5 w-5" />
          </div>
        </FieldState>
      </div>

      <div className="mb-8">
        <LanguagePicker data={data} onChange={onChange} />
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

      {backgroundModalOpen && (
        <BackgroundSelectionModal
          isOpen={true}
          current={data.background}
          onClose={() => setBackgroundModalOpen(false)}
          onConfirm={(bg) => {
            if (bg !== data.background) onChange(applyBackground(data, bg));
          }}
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
