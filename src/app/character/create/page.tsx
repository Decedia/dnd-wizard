"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepOrigin } from "@/components/character-creator/StepOrigin";
import { StepPersonality } from "@/components/character-creator/StepPersonality";
import { StepSourceSelection } from "@/components/character-creator/StepSourceSelection";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { StepAbilities } from "@/components/character-creator/StepAbilities";
import { StepSkills } from "@/components/character-creator/StepSkills";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { StepAppearance } from "@/components/character-creator/StepAppearance";
import { WizardNav } from "@/components/WizardNav";
import {
  initializeCharacter,
  finalizeCreation,
  getCreationSteps,
  getValidationMessage,
  syncBaseFeatures,
  type Character,
} from "@/lib/character-creation";

export default function CharacterCreate() {
  const router = useRouter();
  const [character, setCharacter] = useState<Character>(initializeCharacter);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => getCreationSteps(character), [character]);
  const totalSteps = steps.length;
  const currentStep = steps[step];
  const isLastStep = step === totalSteps - 1;

  const currentValidationError = currentStep?.required && !currentStep.completed
    ? getValidationMessage(currentStep, character)
    : null;

  const update = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      const next = syncBaseFeatures({ ...prev, ...patch });
      return next;
    });
  }, []);

  const canProceed = useCallback((): boolean => {
    if (!currentStep) return false;
    if (!currentStep.required) return true;
    return currentStep.completed;
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;
    if (isLastStep) {
      const final = await finalizeCreation(character);
      router.replace(`/character/${final.id}`);
    } else {
      setStep((s) => s + 1);
    }
  }, [canProceed, isLastStep, character, router]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const renderStep = useCallback(() => {
    if (!currentStep) return null;
    switch (currentStep.type) {
      case "source-selection":
        return <StepSourceSelection data={character} onChange={update} />;
      case "origin":
        return <StepOrigin data={character} onChange={update} />;
      case "personality":
        return <StepPersonality data={character} onChange={update} />;
      case "abilities":
        return <StepAbilities data={character} onChange={update} />;
      case "skills":
        return <StepSkills data={character} onChange={update} />;
      case "equipment":
        return <StepEquipment data={character} onChange={update} />;
      case "appearance":
        return <StepAppearance data={character} onChange={update} />;
      default:
        return null;
    }
  }, [currentStep, character, update]);

  const isLevelStep = currentStep?.type === "level";

  if (isLevelStep) {
    return (
      <LevelUpWizard
        character={character}
        onCancel={() => setStep((s) => Math.max(0, s - 1))}
        onComplete={async (updated) => {
          const final = await finalizeCreation(updated);
          router.replace(`/character/${final.id}`);
        }}
        minLevel={1}
        maxLevel={10}
        title="Starting Level"
        subtitle="Choose your starting level and roll HP"
        startFromLevelOne
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title="Character Creator" subtitle={`Step ${step + 1} of ${totalSteps}`} />

      <main className="px-4 py-5 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={step + 1} totalSteps={totalSteps} />
          {currentValidationError && (
            <div className="mb-3.5 surface border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5">
              <p className="text-xs font-semibold text-[var(--color-error-600)]">{currentValidationError}</p>
            </div>
          )}
          {renderStep()}
        </div>
      </main>

      <WizardNav
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed()}
        nextLabel={isLastStep ? "Create Character" : "Next"}
        showBack={step > 0}
      />
    </div>
  );
}
