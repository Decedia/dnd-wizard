"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepIdentity } from "@/components/character-creator/StepIdentity";
import { StepRace } from "@/components/character-creator/StepRace";
import { StepClass } from "@/components/character-creator/StepClass";
import { StepAbilityScores } from "@/components/character-creator/StepAbilityScores";
import { StepBackground } from "@/components/character-creator/StepBackground";
import { StepSkills } from "@/components/character-creator/StepSkills";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { StepLooksAppearances } from "@/components/character-creator/StepLooksAppearances";
import { StepLevelHitPoints } from "@/components/character-creator/StepLevelHitPoints";
import { StepCard } from "@/components/character-creator/StepCard";
import { PerLevelStepsFlow } from "@/components/character-creator/PerLevelStepsFlow";
import {
  createEmptyCharacter,
  saveCharacter,
  getMaxExpertiseCount,
  computeDerivedStats,
  generateId,
  type Character,
} from "@/lib/storage";
import { getClassData, getRaceData, races } from "@/data/srd";
import { generateLevelUpSteps, type LevelUpChanges, type LevelUpStep } from "@/lib/level-up";

const BASE_STEPS = 8;

export default function CharacterCreate() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Character>(createEmptyCharacter());
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);
  const perLevelSteps = useMemo(() => {
    if (character.level <= 1) return [];
    return generateLevelUpSteps(1, character.level, character.class, character.expertise || [], character.skills || {});
  }, [character.level, character.class, character.expertise, character.skills]);

  const [pendingChanges, setPendingChanges] = useState<LevelUpChanges | null>(null);

  const totalSteps = useMemo(() => {
    return BASE_STEPS + 2 + perLevelSteps.length;
  }, [perLevelSteps.length]);

  const effectiveStep = step;

  const update = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      const next = { ...prev, ...patch };
      const derived = computeDerivedStats(next);
      return { ...next, ...derived };
    });
  }, []);

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

  const addRaceFeatures = useCallback((raceName: string) => {
    const raceData = getRaceData(raceName);
    if (!raceData) return;
    const newFeatures = raceData.traits.map((trait) => ({
      id: generateId(),
      name: trait.name,
      description: trait.description,
      source: "race" as const,
      locked: true,
    }));
    const existingRaceFeatures = character.features.filter((f) => f.source !== "race");
    update({ features: [...existingRaceFeatures, ...newFeatures] });
  }, [character.features, update]);

  const addClassFeatures = useCallback((className: string) => {
    const classData = getClassData(className);
    if (!classData) return;
    const newFeatures = classData.features
      .filter((f) => f.type === "feature")
      .map((f) => ({
        id: generateId(),
        name: f.name,
        description: f.description,
        source: "class" as const,
        locked: true,
      }));
    const existingClassFeatures = character.features.filter((f) => f.source !== "class");
    const existingAttacks = character.attacks.filter((a) => a.source !== "class");
    const classAttacks = classData.features
      .filter((f) => f.type === "attack")
      .map((f) => ({
        id: generateId(),
        name: f.name,
        attackBonus: 0,
        damageType: "",
        sneakAttack: f.name === "Sneak Attack" ? "1d6" : undefined,
        source: "class" as const,
        classFeatureName: f.name,
      }));
    update({
      features: [...existingClassFeatures, ...newFeatures],
      attacks: [...existingAttacks, ...classAttacks],
    });
  }, [character.features, character.attacks, update]);

  const handleRaceChange = useCallback((raceName: string) => {
    update({ race: raceName });
    addRaceFeatures(raceName);
  }, [update, addRaceFeatures]);

  const handleClassChange = useCallback((className: string) => {
    update({ class: className });
    addClassFeatures(className);
  }, [update, addClassFeatures]);

  const handleNext = () => {
    if (!canProceed()) return;
    if (step === 6 && character.class === "Rogue" && (character.expertise || []).length < maxExpertise) {
      setShowExpertiseModal(true);
      return;
    }

    if (step === BASE_STEPS) {
      setStep(BASE_STEPS + 1);
      return;
    }

    if (step === BASE_STEPS + 1) {
      if (character.level === 1) {
        handleFinish();
        return;
      }
      setStep(BASE_STEPS + 2);
      return;
    }

    if (step > BASE_STEPS + 1 && perLevelSteps.length > 0) {
      const perLevelIndex = step - BASE_STEPS - 2;
      if (perLevelIndex < perLevelSteps.length - 1) {
        setStep((s) => s + 1);
      } else {
        setPendingChanges({
          level: character.level,
          features: [],
          abilityScoreChanges: [],
          expertise: [],
          spellSlots: null,
        });
        setStep(totalSteps);
      }
      return;
    }

    if (step >= totalSteps) {
      handleFinish();
      return;
    }

    if (step < BASE_STEPS) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > BASE_STEPS + 1 && perLevelSteps.length > 0) {
      const perLevelIndex = step - BASE_STEPS - 2;
      if (perLevelIndex > 0) {
        setStep((s) => s - 1);
      } else {
        setStep(BASE_STEPS + 1);
      }
      return;
    }
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handlePerLevelComplete = (changes: LevelUpChanges) => {
    setPendingChanges(changes);
    setStep(totalSteps);
  };

  const handlePerLevelBack = () => {
    setStep(BASE_STEPS + 1);
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

    if (pendingChanges) {
      const allFeatures = [...character.features];
      for (const f of pendingChanges.features) {
        if (!allFeatures.some((ef) => ef.name === f.name)) {
          allFeatures.push({
            id: generateId(),
            name: f.name,
            description: f.description,
            source: "class" as const,
            locked: true,
          });
        }
      }
      finalCharacter.features = allFeatures;
      finalCharacter.level = pendingChanges.level;

      if (pendingChanges.abilityScoreChanges.length > 0) {
        for (const change of pendingChanges.abilityScoreChanges) {
          (finalCharacter as any)[change.ability] = (finalCharacter as any)[change.ability] + change.delta;
        }
      }
      if (pendingChanges.expertise.length > 0) {
        finalCharacter.expertise = [...(finalCharacter.expertise || []), ...pendingChanges.expertise];
      }
      if (pendingChanges.spellSlots) {
        finalCharacter.spellSlots = { ...finalCharacter.spellSlots, ...pendingChanges.spellSlots };
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
              background: character.background,
              alignment: character.alignment,
              languages: character.languages,
            }}
            onChange={(patch) => update(patch)}
          />
        );
      case 2:
        return (
          <StepRace
            data={{ race: character.race }}
            onChange={(patch) => {
              if (patch.race) handleRaceChange(patch.race);
            }}
          />
        );
      case 3:
        return (
          <StepClass
            data={{ class: character.class }}
            onChange={(patch) => {
              if (patch.class) handleClassChange(patch.class);
            }}
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
              abilityMethod: character.abilityMethod,
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
              if (patch.abilityMethod) {
                update({ abilityMethod: patch.abilityMethod });
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
          <StepLooksAppearances
            data={{ appearance: character.appearance }}
            onChange={(patch) => update(patch)}
          />
        );
      case 9:
        return (
          <StepLevelHitPoints
            data={character}
            onChange={(patch) => update(patch)}
          />
        );
      default:
        if (step > 9 && perLevelSteps.length > 0) {
          const perLevelIndex = step - 10;
          if (perLevelIndex < perLevelSteps.length) {
            return (
              <PerLevelStepsFlow
                character={character}
                steps={perLevelSteps}
                onComplete={handlePerLevelComplete}
                onBack={handlePerLevelBack}
                overallCurrentStep={step}
                overallTotalSteps={totalSteps}
              />
            );
          }
        }
        if (step >= totalSteps) {
          return (
            <StepCard title="Complete">
              <p className="text-sm text-parchment/70 mb-4">Your character is ready. Click Finish & Save to create your character.</p>
            </StepCard>
          );
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Character Creator" subtitle={`Step ${effectiveStep} of ${totalSteps}`} />

      <main className="px-4 py-6 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={effectiveStep} totalSteps={totalSteps} />
          {renderStep()}
        </div>
      </main>

      {step <= BASE_STEPS + 1 || step >= totalSteps ? (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center">
          <div className="mx-auto max-w-lg px-4 w-full">
            <div className="flex items-center gap-3 rounded-xl border border-parchment/20 bg-charcoal/90 backdrop-blur-xl p-3 shadow-lg">
              {step > 1 && step <= BASE_STEPS + 1 ? (
                <button
                  onClick={handleBack}
                  className="rounded-lg border border-parchment/20 px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
                >
                  Back
                </button>
              ) : null}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 rounded-lg bg-burgundy px-6 py-2.5 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
              >
                {step >= totalSteps ? "Finish & Save" : "Next"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
