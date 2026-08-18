"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepIdentity } from "@/components/character-creator/StepIdentity";
import { StepRace } from "@/components/character-creator/StepRace";
import { StepClass } from "@/components/character-creator/StepClass";
import { StepAbilityScores } from "@/components/character-creator/StepAbilityScores";
import { StepBackground } from "@/components/character-creator/StepBackground";
import { StepSkills } from "@/components/character-creator/StepSkills";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { StepSpells } from "@/components/character-creator/StepSpells";
import { StepFinalTouches } from "@/components/character-creator/StepFinalTouches";
import { createEmptyCharacter, saveCharacter, getRaceData, type Character } from "@/lib/storage";

const TOTAL_STEPS = 9;

function getEffectiveStep(actualStep: number, isWizard: boolean): number {
  if (!isWizard && actualStep === 9) return 8;
  return actualStep;
}

function getEffectiveTotalSteps(isWizard: boolean): number {
  return isWizard ? TOTAL_STEPS : TOTAL_STEPS - 1;
}

export default function CharacterCreate() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Character>(createEmptyCharacter);

  const update = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev, ...patch }));
  }, []);

  const isWizard = character.class === "Wizard";
  const effectiveTotalSteps = getEffectiveTotalSteps(isWizard);
  const effectiveStep = getEffectiveStep(step, isWizard);

  const canProceed = (): boolean => {
    if (step === 1) {
      return character.name.trim().length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < effectiveTotalSteps) {
      if (!isWizard && step === 7) {
        setStep(9);
      } else {
        setStep((s) => s + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      if (!isWizard && step === 9) {
        setStep(7);
      } else {
        setStep((s) => s - 1);
      }
    }
  };

  const handleFinish = () => {
    const raceData = getRaceData(character.race);
    const finalCharacter = { ...character };
    if (raceData) {
      const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
      for (const key of abilityKeys) {
        const bonus = raceData.abilityScoreIncreases[key] ?? 0;
        finalCharacter[key] = character[key] + bonus;
      }
    }
    saveCharacter(finalCharacter);
    router.replace(`/character/${finalCharacter.id}`);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepIdentity
            data={{
              name: character.name,
              playerName: character.playerName,
              alignment: character.alignment,
              level: character.level,
              class: character.class,
              str: character.str,
              dex: character.dex,
              con: character.con,
              int: character.int,
              wis: character.wis,
              cha: character.cha,
              features: character.features,
              spellSlots: character.spellSlots,
            }}
            onChange={(patch) => update(patch)}
          />
        );
      case 2:
        return (
          <StepRace
            data={{ race: character.race }}
            onChange={(patch) => update(patch)}
          />
        );
      case 3:
        return (
          <StepClass
            data={{ class: character.class }}
            onChange={(patch) => update(patch)}
          />
        );
      case 4:
        return (
          <StepAbilityScores
            data={{
              abilityScores: {
                str: character.str,
                dex: character.dex,
                con: character.con,
                int: character.int,
                wis: character.wis,
                cha: character.cha,
              },
              abilityMethod: "standard",
              race: character.race,
            }}
            onChange={(patch) => {
              if (patch.abilityScores) {
                update(patch.abilityScores);
              }
            }}
          />
        );
      case 5:
        return (
          <StepBackground
            data={{
              background: character.background,
              personalityTrait1: character.personalityTrait1,
              personalityTrait2: character.personalityTrait2,
              ideal: character.ideal,
              bond: character.bond,
              flaw: character.flaw,
            }}
            onChange={(patch) => update(patch)}
          />
        );
      case 6:
        return (
          <StepSkills
            data={{ skills: character.skills }}
            onChange={(patch) => update(patch)}
          />
        );
      case 7:
        return (
          <StepEquipment
            data={{ inventory: character.inventory }}
            onChange={(patch) => update(patch)}
          />
        );
      case 8:
        return (
          <StepSpells
            data={{ spells: character.spells }}
            onChange={(patch) => update(patch)}
          />
        );
      case 9:
        return (
          <StepFinalTouches
            data={{ appearance: character.appearance }}
            onChange={(patch) => update(patch)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Character Creator" subtitle={`Step ${effectiveStep} of ${effectiveTotalSteps}`} />

      <main className="px-4 py-6 pb-32">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={effectiveStep} totalSteps={effectiveTotalSteps} />
          {renderStep()}
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 z-40 bg-gradient-to-t from-charcoal via-charcoal to-transparent pt-6 pb-4">
        <div className="mx-auto max-w-lg px-4 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="rounded-xl border border-parchment/20 px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
            >
              Back
            </button>
          )}
          <button
            onClick={step === effectiveTotalSteps ? handleFinish : handleNext}
            disabled={!canProceed()}
            className="flex-1 rounded-xl bg-burgundy px-6 py-3 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {step === effectiveTotalSteps ? "Finish & Save" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
