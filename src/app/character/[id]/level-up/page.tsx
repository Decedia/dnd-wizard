"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepCard } from "@/components/character-creator/StepCard";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { getStaticClass, getStaticRace, getStaticSpells } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus } from "@/lib/storage";

interface LevelUpStep {
  id: string;
  title: string;
  description: string;
  type: "hp" | "features" | "subclass" | "asi" | "expertise" | "spells";
  required: boolean;
  completed: boolean;
}

export default function LevelUpPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [character, setCharacter] = useState<Character | null>(() => {
    if (typeof window !== "undefined" && id) {
      const loadedChar = getCharacter(id) ?? null;
      if (loadedChar) {
        const derived = computeDerivedStats(loadedChar);
        return { ...loadedChar, ...derived } as Character;
      }
    }
    return null;
  });
  const [step, setStep] = useState(0);
  const [hpGain, setHpGain] = useState<number | null>(null);
  const [asiChoices, setAsiChoices] = useState<Record<string, { ability: string; delta: number }[]>>({});
  const [subclassChoice, setSubclassChoice] = useState<string | null>(null);
  const [expertiseChoices, setExpertiseChoices] = useState<string[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  const oldLevel = character?.level ?? 1;
  const newLevel = oldLevel + 1;
  const classData = character?.class ? getStaticClass(character.class) : null;
  const subclassLevel = classData?.subclassLevel;

  const steps = useMemo<LevelUpStep[]>(() => {
    if (!character || !classData) return [];
    const levelSteps: LevelUpStep[] = [
      {
        id: "hp",
        title: "Hit Points",
        description: "Roll or take the average for your hit die to increase your maximum HP.",
        type: "hp",
        required: true,
        completed: hpGain !== null,
      },
    ];

    if (newLevel === subclassLevel && classData.subclasses && classData.subclasses.length > 0 && !character.subclass) {
      levelSteps.push({
        id: "subclass",
        title: "Choose Subclass",
        description: `Choose your ${classData.name} subclass.`,
        type: "subclass",
        required: true,
        completed: !!subclassChoice,
      });
    }

    if (classData.levels?.[newLevel - 1]?.asi) {
      levelSteps.push({
        id: "asi",
        title: "Ability Score Improvement",
        description: "Distribute 2 points among your abilities (max 20).",
        type: "asi",
        required: true,
        completed: (asiChoices[newLevel] || []).length === 2,
      });
    }

    if (character.class === "Rogue") {
      levelSteps.push({
        id: "expertise",
        title: "Expertise",
        description: "Choose skills to double your proficiency bonus.",
        type: "expertise",
        required: true,
        completed: expertiseChoices.length > 0,
      });
    }

    if (classData.spellcastingAbility && classData.levels?.[newLevel - 1]?.spellSlots) {
      levelSteps.push({
        id: "spells",
        title: "New Spells",
        description: "Choose new spells for your expanded spell slots.",
        type: "spells",
        required: true,
        completed: selectedSpells.length > 0,
      });
    }

    return levelSteps;
  }, [newLevel, subclassLevel, classData, character, hpGain, subclassChoice, asiChoices, expertiseChoices, selectedSpells]);

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const canProceed = useCallback((): boolean => {
    if (!currentStep) return false;
    if (!currentStep.required) return true;
    return currentStep.completed;
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    if (!character) return;

    const patch: Partial<Character> = {
      level: newLevel,
    };

    if (hpGain) {
      patch.maxHp = (character.maxHp || 0) + hpGain;
      patch.currentHp = (character.currentHp || 0) + hpGain;
    }

    if (subclassChoice && !character.subclass) {
      patch.subclass = subclassChoice;
    }

    if (Object.keys(asiChoices).length > 0) {
      const updates: any = { ...character };
      for (const choices of Object.values(asiChoices)) {
        for (const choice of choices) {
          updates[choice.ability] = (character[choice.ability as keyof Character] as number || 0) + choice.delta;
        }
      }
      Object.assign(patch, updates);
    }

    if (expertiseChoices.length > 0) {
      patch.expertise = [...(character.expertise || []), ...expertiseChoices];
    }

    if (selectedSpells.length > 0) {
      patch.spells = [...(character.spells || []), ...selectedSpells.map((name) => ({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name, level: 0, source: "srd" as const }))];
    }

    const derived = computeDerivedStats({ ...character, ...patch });
    const finalCharacter = { ...character, ...patch, ...derived };
    saveCharacter(finalCharacter);
    router.push(`/character/${id}`);
  }, [character, newLevel, hpGain, subclassChoice, asiChoices, expertiseChoices, selectedSpells, router, id]);

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    if (isLastStep) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  }, [canProceed, isLastStep, handleFinish]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.push(`/character/${id}`);
    }
  }, [step, router, id]);

  const renderStepContent = useCallback(() => {
    if (!currentStep || !character) return null;
    switch (currentStep.type) {
      case "hp":
        return (
          <div className="space-y-4">
            <p className="text-sm text-parchment/60">Roll your hit die or take the average to increase your maximum HP.</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <input
                  type="number"
                  value={hpGain || ""}
                  onChange={(e) => setHpGain(Number(e.target.value) || null)}
                  className="input w-24 text-center"
                  placeholder="HP"
                  min={1}
                />
                <span className="text-xs text-text-muted">HP Gain</span>
              </div>
            </div>
          </div>
        );

      case "subclass":
        return (
          <div className="space-y-3">
            {classData?.subclasses?.map((subclass) => {
              const isSelected = subclassChoice === subclass.name;
              return (
                <button
                  key={subclass.name}
                  type="button"
                  onClick={() => setSubclassChoice(subclass.name)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border bg-charcoal/40 hover:border-accent/30"
                  }`}
                >
                  <span className="text-sm font-medium text-parchment/80">{subclass.name}</span>
                  {subclass.description && (
                    <p className="text-xs text-parchment/50 mt-1">{subclass.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        );

      case "asi":
        return (
          <div className="space-y-3">
            <p className="text-sm text-parchment/60">Distribute 2 points among your abilities (max 20).</p>
            {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
              const currentAllocation = (asiChoices[newLevel] || []).find((c) => c.ability === ability);
              const currentValue = currentAllocation?.delta || 0;
              const baseScore = character[ability as keyof Character] as number;
              const newScore = baseScore + currentValue;

              return (
                <div key={ability} className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2">
                  <span className="text-sm font-medium text-parchment/80 w-12">{ability.toUpperCase()}</span>
                  <span className="text-sm text-parchment/60">{baseScore}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAsiChoices((prev) => {
                          const current = prev[newLevel] || [];
                          const existing = current.findIndex((c) => c.ability === ability);
                          if (existing >= 0) {
                            const next = current.map((c, i) => (i === existing ? { ability, delta: c.delta - 1 } : c)).filter((c) => c.delta > 0);
                            return { ...prev, [newLevel]: next };
                          }
                          return prev;
                        });
                      }}
                      disabled={currentValue <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold text-accent w-6 text-center">{currentValue}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalAllocated = (asiChoices[newLevel] || []).reduce((sum, c) => sum + c.delta, 0);
                        if (totalAllocated >= 2 || newScore >= 20) return;
                        setAsiChoices((prev) => {
                          const current = prev[newLevel] || [];
                          const existing = current.findIndex((c) => c.ability === ability);
                          if (existing >= 0) {
                            const next = current.map((c, i) => (i === existing ? { ability, delta: c.delta + 1 } : c));
                            return { ...prev, [newLevel]: next };
                          } else {
                            return { ...prev, [newLevel]: [...current, { ability, delta: 1 }] };
                          }
                        });
                      }}
                      disabled={(asiChoices[newLevel] || []).reduce((sum, c) => sum + c.delta, 0) >= 2 || newScore >= 20}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-parchment w-8 text-right">{newScore}</span>
                </div>
              );
            })}
          </div>
        );

      case "expertise":
        return (
          <div className="space-y-3">
            <p className="text-sm text-parchment/60">Choose 2 skills to double your proficiency bonus.</p>
            {Object.entries(character.skills || {})
              .filter(([, proficient]) => proficient)
              .map(([name]) => {
                const isSelected = expertiseChoices.includes(name);
                const isDisabled = !isSelected && expertiseChoices.length >= 2;

                return (
                  <label
                    key={name}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent/40 bg-accent/10"
                        : isDisabled
                          ? "border-border bg-charcoal/40 opacity-50"
                          : "border-border bg-charcoal/40 hover:border-accent/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setExpertiseChoices((prev) => prev.filter((n) => n !== name));
                        } else if (expertiseChoices.length < 2) {
                          setExpertiseChoices((prev) => [...prev, name]);
                        }
                      }}
                      disabled={isDisabled}
                      className="h-4 w-4 rounded border-border bg-charcoal text-accent focus:ring-accent/50 disabled:opacity-30"
                    />
                    <span className="text-sm text-parchment/80">{name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded ml-auto">EXPERTISE</span>
                    )}
                  </label>
                );
              })}
          </div>
        );

      case "spells":
        return (
          <div className="space-y-3">
            <p className="text-sm text-parchment/60">Choose new spells for your expanded spell slots.</p>
            {getStaticSpells()
              .filter((s) => s.classes?.includes(character.class))
              .map((spell) => {
                const isSelected = selectedSpells.includes(spell.name);
                return (
                  <button
                    key={spell.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSpells((prev) => prev.filter((s) => s !== spell.name));
                      } else {
                        setSelectedSpells((prev) => [...prev, spell.name]);
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      isSelected
                        ? "border-accent/40 bg-accent/10"
                        : "border-border bg-charcoal/40 hover:border-accent/30"
                    }`}
                  >
                    <span className="text-sm text-parchment">{spell.name}</span>
                    <span className="text-xs text-text-muted ml-2">Level {spell.level}</span>
                  </button>
                );
              })}
          </div>
        );

      default:
        return null;
    }
  }, [currentStep, character, hpGain, subclassChoice, asiChoices, expertiseChoices, selectedSpells, newLevel, classData]);

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Level Up" subtitle="Character Not Found" />
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">Character Not Found</h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">This character could not be found. It may have been deleted.</p>
            <Link href="/" className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark">
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Level Up!" subtitle={`Level ${oldLevel} → ${newLevel}`} />
      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={step + 1} totalSteps={steps.length} />
          {currentStep && (
            <StepCard title={currentStep.title} hint={currentStep.description}>
              {renderStepContent()}
            </StepCard>
          )}
        </div>
      </main>
      <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center">
        <div className="mx-auto max-w-lg px-4 w-full">
          <div className="flex items-center gap-3 rounded-full border border-parchment/20 bg-charcoal/90 backdrop-blur-xl p-3 shadow-lg">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-parchment/20 px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {isLastStep ? "Finish Level Up" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
