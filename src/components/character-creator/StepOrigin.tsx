"use client";

import { useState, useCallback } from "react";
import { Sword, Users, CaretRight } from "@phosphor-icons/react";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export function StepOrigin({ data, onChange, currentStep, totalSteps, onBack, onNext, canProceed }: StepOriginProps) {
  const { t, language } = useLanguage();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [raceModalOpen, setRaceModalOpen] = useState(false);
  const [characterName, setCharacterName] = useState(data.name || "");
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset, language);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset, language);

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
    <div className="space-y-3 pb-32">
      <div className="mb-6 px-1">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
            Langkah {currentStep} dari {totalSteps}
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
          />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identitas & Asal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Tentukan nama, kelas, dan ras untuk memulai pahlawanmu.</p>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-2">NAMA KARAKTER</label>
        <input 
          type="text" 
          placeholder="Masukkan nama..." 
          value={characterName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl py-3.5 px-4 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors outline-none" 
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-3">PILIH KELAS & RAS</h2>
        
        {/* Class Card */}
        <div 
          onClick={() => setClassModalOpen(true)}
          className="group border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all mb-3"
        >
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sword size={24} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Pilih Kelas</h3>
            <p className="text-xs text-slate-500">Fighter, Wizard, Rogue...</p>
          </div>
          <CaretRight className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" size={20} weight="bold" />
        </div>

        {/* Race Card */}
        <div 
          onClick={() => setRaceModalOpen(true)}
          className="group border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={24} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Pilih Ras</h3>
            <p className="text-xs text-slate-500">Manusia, Elf, Dwarf...</p>
          </div>
          <CaretRight className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" size={20} weight="bold" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={onBack}
          className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform"
        >
          Kembali
        </button>
        <button 
          onClick={onNext} 
          disabled={!isFormComplete}
          className="bg-indigo-600 disabled:bg-indigo-500/50 disabled:border-b-0 text-white disabled:text-white/70 font-bold py-3.5 rounded-xl text-center border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
        >
          Lanjut
        </button>
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
