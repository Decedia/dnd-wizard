"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepCard } from "@/components/character-creator/StepCard";
import { StepIdentity } from "@/components/character-creator/StepIdentity";
import { StepRace } from "@/components/character-creator/StepRace";
import { StepClass } from "@/components/character-creator/StepClass";
import { StepLevel } from "@/components/character-creator/StepLevel";
import { StepAbilities } from "@/components/character-creator/StepAbilities";
import { StepSkills } from "@/components/character-creator/StepSkills";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { StepSpells } from "@/components/character-creator/StepSpells";
import { StepAppearance } from "@/components/character-creator/StepAppearance";
import { WizardNav } from "@/components/WizardNav";
import { StepFeatureSelections } from "@/components/character-creator/StepFeatureSelections";
import {
  initializeCharacter,
  finalizeCreation,
  getCreationSteps,
  getFeatureSelections,
  syncBaseFeatures,
  type Character,
} from "@/lib/character-creation";
import { getStaticClass, getStaticRace } from "@/lib/srd-client";

export default function CharacterCreate() {
  const router = useRouter();
  const [character, setCharacter] = useState<Character>(initializeCharacter);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => getCreationSteps(character), [character]);
  const totalSteps = steps.length;
  const currentStep = steps[step];
  const isLastStep = step === totalSteps - 1;
  const featureSelections = useMemo(() => getFeatureSelections(character), [character]);

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

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    if (isLastStep) {
      const final = finalizeCreation(character);
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
      case "identity":
        return <StepIdentity data={character} onChange={update} />;
      case "race":
        return <StepRace data={character} onChange={update} />;
      case "class":
        return <StepClass data={character} onChange={update} />;
      case "level":
        return <StepLevel data={character} onChange={update} />;
      case "abilities":
        return <StepAbilities data={character} onChange={update} />;
      case "skills":
        return <StepSkills data={character} onChange={update} />;
      case "equipment":
        return <StepEquipment data={character} onChange={update} />;
      case "spells":
        return <StepSpells data={character} onChange={update} />;
      case "appearance":
        return <StepAppearance data={character} onChange={update} />;
      case "feature-selections": {
        const selectionIndex = parseInt(currentStep.id.replace("feature-selection-", ""), 10);
        const selections = featureSelections[selectionIndex] ? [featureSelections[selectionIndex]] : [];
        return <StepFeatureSelections data={character} onChange={update} selections={selections} />;
      }
      default:
        return null;
    }
  }, [currentStep, character, update, featureSelections]);

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Character Creator" subtitle={`Step ${step + 1} of ${totalSteps}`} />

      <main className="px-4 py-6 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={step + 1} totalSteps={totalSteps} />
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
