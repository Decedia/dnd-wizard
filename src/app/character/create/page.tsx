"use client";

import { useState, useCallback, useEffect } from "react";
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
import { createEmptyCharacter, saveCharacter, getRaceData, getMaxExpertiseCount, type Character } from "@/lib/storage";

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
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);

  const update = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      const next = { ...prev, ...patch };
      const { computeDerivedStats } = require("@/lib/storage");
      const derived = computeDerivedStats(next);
      return { ...next, ...derived };
    });
  }, []);

  const isWizard = character.class === "Wizard";
  const effectiveTotalSteps = getEffectiveTotalSteps(isWizard);
  const effectiveStep = getEffectiveStep(step, isWizard);
  const maxExpertise = character.class === "Rogue" ? getMaxExpertiseCount(character) : 0;

  const canProceed = (): boolean => {
    if (step === 1) {
      return character.name.trim().length > 0;
    }
    if (step === 6 && character.class === "Rogue") {
      const currentExpertise = (character.expertise || []).length;
      return currentExpertise >= maxExpertise;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step === 6 && character.class === "Rogue" && (character.expertise || []).length < maxExpertise) {
      setShowExpertiseModal(true);
      return;
    }
    if (effectiveStep < effectiveTotalSteps) {
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
              race: character.race,
              class: character.class,
              level: character.level,
              background: character.background,
              alignment: character.alignment,
              experiencePoints: character.experiencePoints,
              str: character.str,
              dex: character.dex,
              con: character.con,
              int: character.int,
              wis: character.wis,
              cha: character.cha,
              features: character.features,
              spellSlots: character.spellSlots,
              languages: character.languages,
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
              class: character.class,
              savingThrows: character.savingThrows,
              proficiencyBonus: character.proficiencyBonus,
              initiative: character.initiative,
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
            data={character}
            onChange={(patch) => update(patch)}
          />
        );
      case 7:
        return (
          <StepEquipment
            data={character}
            onChange={(patch) => update(patch)}
          />
        );
      case 8:
        return (
          <StepSpells
            data={character}
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

      <div className="fixed bottom-24 left-0 right-0 z-50 bg-gradient-to-t from-charcoal via-charcoal to-transparent pt-6 pb-4">
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
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 rounded-xl bg-burgundy px-6 py-3 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {effectiveStep === effectiveTotalSteps ? "Finish & Save" : "Next"}
          </button>
        </div>
      </div>

      {showExpertiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80">
          <div className="max-w-md w-full rounded-xl border border-parchment/20 bg-charcoal-light p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-gold mb-2">Expertise</h2>
            <p className="text-xs text-parchment/50 mb-4">
              Select {maxExpertise} skills to double your proficiency bonus. These should be skills your character is already proficient in.
            </p>
            <div className="space-y-2">
              {Object.entries(character.skills)
                .filter(([, proficient]) => proficient)
                .map(([name]) => {
                  const isSelected = (character.expertise || []).includes(name);
                  const isDisabled = !isSelected && (character.expertise || []).length >= maxExpertise;
                  return (
                    <label
                      key={name}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-gold/40 bg-gold/5"
                          : isDisabled
                          ? "border-parchment/5 bg-charcoal/20 opacity-50"
                          : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const current = character.expertise || [];
                          if (current.includes(name)) {
                            update({ expertise: current.filter((n) => n !== name) });
                          } else if (current.length < maxExpertise) {
                            update({ expertise: [...current, name] });
                          }
                        }}
                        disabled={isDisabled}
                        className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
                      />
                      <span className="text-sm text-parchment/80">{name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded ml-auto">EXPERTISE</span>
                      )}
                    </label>
                  );
                })}
              {character.class === "Rogue" && (
                <label
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    (character.expertise || []).includes("Thieves' Tools")
                      ? "border-gold/40 bg-gold/5"
                      : (character.expertise || []).length >= maxExpertise
                      ? "border-parchment/5 bg-charcoal/20 opacity-50"
                      : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(character.expertise || []).includes("Thieves' Tools")}
                    onChange={() => {
                      const current = character.expertise || [];
                      if (current.includes("Thieves' Tools")) {
                        update({ expertise: current.filter((n) => n !== "Thieves' Tools") });
                      } else if (current.length < maxExpertise) {
                        update({ expertise: [...current, "Thieves' Tools"] });
                      }
                    }}
                    disabled={(character.expertise || []).length >= maxExpertise && !(character.expertise || []).includes("Thieves' Tools")}
                    className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
                  />
                  <span className="text-sm text-parchment/80">Thieves&apos; Tools</span>
                  {(character.expertise || []).includes("Thieves' Tools") && (
                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded ml-auto">EXPERTISE</span>
                  )}
                </label>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowExpertiseModal(false)}
                disabled={(character.expertise || []).length < maxExpertise}
                className="flex-1 rounded-xl bg-burgundy px-4 py-2 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
