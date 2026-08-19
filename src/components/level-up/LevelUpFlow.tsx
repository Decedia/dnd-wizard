"use client";

import { useState, useMemo, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepCard } from "@/components/character-creator/StepCard";
import { Dice, DiceType } from "@/components/Dice";
import { generateLevelUpSteps, type LevelUpChanges, type LevelUpStep } from "@/lib/level-up";
import { getClassData } from "@/data/srd";
import { getModifier } from "@/lib/storage";

interface LevelUpFlowProps {
  open: boolean;
  oldLevel: number;
  newLevel: number;
  className: string;
  currentAbilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  currentExpertise: string[];
  currentSkills: Record<string, boolean>;
  onComplete: (changes: LevelUpChanges) => void;
  onCancel: () => void;
}

export function LevelUpFlow({
  open,
  oldLevel,
  newLevel,
  className,
  currentAbilityScores,
  currentExpertise,
  currentSkills,
  onComplete,
  onCancel,
}: LevelUpFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hpResolved, setHpResolved] = useState<Record<number, boolean>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, { ability: string; delta: number }[]>>({});
  const [subclassChoice, setSubclassChoice] = useState<string | null>(null);
  const [expertiseChoices, setExpertiseChoices] = useState<Record<number, string[]>>({});

  const steps = useMemo(
    () => generateLevelUpSteps(oldLevel, newLevel, className, currentExpertise, currentSkills),
    [oldLevel, newLevel, className, currentExpertise, currentSkills]
  );

  const handleHpResolve = useCallback((level: number) => {
    setHpResolved((prev) => ({ ...prev, [level]: true }));
  }, []);

  const handleAsiChange = useCallback((level: number, ability: string, delta: number) => {
    setAsiChoices((prev) => {
      const current = prev[level] || [];
      const existing = current.findIndex((c) => c.ability === ability);
      let next: { ability: string; delta: number }[];
      if (existing >= 0) {
        next = current.map((c, i) => (i === existing ? { ability, delta: c.delta + delta } : c)).filter((c) => c.delta > 0);
      } else if (delta > 0) {
        next = [...current, { ability, delta }];
      } else {
        next = current;
      }
      return { ...prev, [level]: next };
    });
  }, []);

  const handleFinish = useCallback(() => {
    const allFeatures: { name: string; description: string }[] = [];
    const allSpellSlots: Record<number, number> = {};
    let finalSpellSlots: Record<number, number> | null = null;

    for (let level = oldLevel + 1; level <= newLevel; level++) {
      const levelData = getClassData(className)?.levels[level - 1];
      if (levelData?.features) {
        allFeatures.push(...levelData.features);
      }
      if (levelData?.spellSlots) {
        Object.assign(allSpellSlots, levelData.spellSlots);
        finalSpellSlots = { ...allSpellSlots };
      }
    }

    const allAsi: { ability: string; delta: number }[] = [];
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      allAsi.push(...(asiChoices[level] || []));
    }

    const allExpertise: string[] = [];
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      allExpertise.push(...(expertiseChoices[level] || []));
    }

    onComplete({
      level: newLevel,
      features: allFeatures,
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      abilityScoreChanges: allAsi,
      expertise: [...new Set(allExpertise)],
      spellSlots: finalSpellSlots,
    });
  }, [oldLevel, newLevel, className, subclassChoice, asiChoices, expertiseChoices, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStepIndex === steps.length - 1) {
      handleFinish();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, steps.length, handleFinish]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      onCancel();
    }
  }, [currentStepIndex, onCancel]);

  if (!open || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const canProceed = (): boolean => {
    switch (currentStep.type) {
      case "hp":
        return hpResolved[currentStep.level] === true;
      case "asi":
        return (asiChoices[currentStep.level]?.length || 0) > 0;
      case "subclass":
        return subclassChoice !== null;
      case "expertise":
        return (expertiseChoices[currentStep.level]?.length || 0) === (currentStep.expertiseCount || 0);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case "hp":
        return (
          <HpStep
            step={currentStep}
            className={className}
            onResolve={handleHpResolve}
            resolved={hpResolved[currentStep.level] === true}
          />
        );
      case "features":
        return <FeaturesStep step={currentStep} />;
      case "subclass":
        return <SubclassStep step={currentStep} selected={subclassChoice} onSelect={setSubclassChoice} />;
      case "asi":
        return (
          <AsiStep
            step={currentStep}
            abilityScores={currentAbilityScores}
            choices={asiChoices[currentStep.level] || []}
            onChange={(ability, delta) => handleAsiChange(currentStep.level, ability, delta)}
          />
        );
      case "expertise":
        return (
          <ExpertiseStep
            step={currentStep}
            className={className}
            currentExpertise={currentExpertise}
            currentSkills={currentSkills}
            selected={expertiseChoices[currentStep.level] || []}
            onSelect={(names) => setExpertiseChoices((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "spellSlots":
        return <SpellSlotsStep step={currentStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal">
      <AppHeader title="Level Up!" subtitle={`Step ${currentStepIndex + 1} of ${steps.length}`} />
      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={currentStepIndex + 1} totalSteps={steps.length} />
          <StepCard title={currentStep.title}>{renderStepContent()}</StepCard>
        </div>
      </main>
      <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center">
        <div className="mx-auto max-w-lg px-4 w-full">
          <div className="flex items-center gap-3 rounded-xl border border-parchment/20 bg-charcoal/90 backdrop-blur-xl p-3 shadow-lg">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-lg border border-parchment/20 px-4 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {isLastStep ? "Finish Level Up" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HpStep({ step, className, onResolve, resolved }: { step: LevelUpStep; className: string; onResolve: (level: number) => void; resolved: boolean }) {
  const classData = getClassData(className);
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(10);
  const average = Math.floor(hitDie / 2) + 1;
  const diceType = `d${hitDie}` as DiceType;

  return (
    <div className="space-y-4">
      <p className="text-xs text-parchment/60">{step.description}</p>
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Dice type={diceType} size={80} onRoll={() => onResolve(step.level)} />
          <span className="text-[10px] text-parchment/50 uppercase tracking-wider">Roll</span>
        </div>
        <button
          type="button"
          onClick={() => onResolve(step.level)}
          disabled={resolved}
          className="rounded-lg border border-parchment/20 bg-charcoal/40 px-4 py-2 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40 disabled:opacity-40"
        >
          Take Average ({average + conMod})
        </button>
      </div>
      {resolved && (
        <div className="text-center">
          <span className="text-xs text-parchment/50">HP gain recorded for this level.</span>
        </div>
      )}
    </div>
  );
}

function FeaturesStep({ step }: { step: LevelUpStep }) {
  return (
    <div className="space-y-2">
      {step.features?.map((feature, idx) => (
        <div key={idx} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
          <span className="text-sm font-medium text-gold/80">{feature.name}:</span>
          <span className="text-xs text-parchment/70 ml-1">{feature.description}</span>
        </div>
      ))}
    </div>
  );
}

function SubclassStep({ step, selected, onSelect }: { step: LevelUpStep; selected: string | null; onSelect: (name: string) => void }) {
  return (
    <div className="space-y-3">
      {step.description && <p className="text-xs text-parchment/60">{step.description}</p>}
      <div className="space-y-2">
        {step.subclassOptions?.map((option) => (
          <label
            key={option.name}
            className={`flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
              selected === option.name
                ? "border-gold/40 bg-gold/5"
                : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
            }`}
          >
            <input
              type="radio"
              name="subclass"
              checked={selected === option.name}
              onChange={() => onSelect(option.name)}
              className="mt-1 h-4 w-4 text-gold focus:ring-gold/50"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-parchment/80">{option.name}</span>
              {option.description && <p className="text-xs text-parchment/50 mt-1">{option.description}</p>}
              {option.features?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="text-xs text-parchment/60">
                      <span className="font-medium text-gold/80">{feature.name}:</span> {feature.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function AsiStep({
  step,
  abilityScores,
  choices,
  onChange,
}: {
  step: LevelUpStep;
  abilityScores: LevelUpFlowProps["currentAbilityScores"];
  choices: { ability: string; delta: number }[];
  onChange: (ability: string, delta: number) => void;
}) {
  const abilities = [
    { key: "str", label: "STR" },
    { key: "dex", label: "DEX" },
    { key: "con", label: "CON" },
    { key: "int", label: "INT" },
    { key: "wis", label: "WIS" },
    { key: "cha", label: "CHA" },
  ] as const;

  const totalAllocated = choices.reduce((sum, c) => sum + c.delta, 0);
  const maxPoints = step.asiCount || 2;

  return (
    <div className="space-y-3">
      <p className="text-xs text-parchment/60">{step.description}</p>
      <p className="text-xs text-parchment/50">Points remaining: {maxPoints - totalAllocated}</p>
      <div className="space-y-2">
        {abilities.map(({ key, label }) => {
          const baseScore = abilityScores[key];
          const current = choices.find((c) => c.ability === key);
          const allocated = current?.delta || 0;
          const newScore = baseScore + allocated;

          return (
            <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
              <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
              <span className="text-sm text-parchment/60">{baseScore}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(key, -1)}
                  disabled={allocated <= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
                >
                  -
                </button>
                <span className="text-sm font-semibold text-gold w-6 text-center">{allocated > 0 ? `+${allocated}` : "0"}</span>
                <button
                  type="button"
                  onClick={() => onChange(key, 1)}
                  disabled={totalAllocated >= maxPoints || newScore >= 20}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <span className="text-sm font-semibold text-parchment w-8 text-right">{newScore}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpertiseStep({
  step,
  className,
  currentExpertise,
  currentSkills,
  selected,
  onSelect,
}: {
  step: LevelUpStep;
  className: string;
  currentExpertise: string[];
  currentSkills: Record<string, boolean>;
  selected: string[];
  onSelect: (names: string[]) => void;
}) {
  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onSelect(selected.filter((n) => n !== name));
    } else if (selected.length < (step.expertiseCount || 0)) {
      onSelect([...selected, name]);
    }
  };

  const proficientSkills = Object.entries(currentSkills)
    .filter(([, proficient]) => proficient)
    .map(([name]) => name);

  const options = [...proficientSkills];
  if (className === "Rogue" && !options.includes("Thieves' Tools")) {
    options.push("Thieves' Tools");
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-parchment/60">{step.description}</p>
      <div className="space-y-2">
        {options.map((name) => {
          const isSelected = selected.includes(name);
          const isDisabled = !isSelected && selected.length >= (step.expertiseCount || 0);
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
                onChange={() => toggle(name)}
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
      </div>
    </div>
  );
}

function SpellSlotsStep({ step }: { step: LevelUpStep }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-parchment/60">Your spell slots have been updated.</p>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(step.spellSlots || {}).map(([level, count]) => (
          <div key={level} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-2 py-2 text-center">
            <span className="text-[10px] text-parchment/50 uppercase">Level {level}</span>
            <span className="block text-sm font-semibold text-gold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
