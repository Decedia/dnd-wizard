"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaretRight, Lightning, ListNumbers } from "@phosphor-icons/react";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepOrigin } from "@/components/character-creator/StepOrigin";
import { StepPersonality } from "@/components/character-creator/StepPersonality";
import { StepSourceSelection } from "@/components/character-creator/StepSourceSelection";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { StepAbilities } from "@/components/character-creator/StepAbilities";
import { StepSkills } from "@/components/character-creator/StepSkills";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { StepEquipment2024 } from "@/components/character-creator/StepEquipment2024";
import { StepLook } from "@/components/character-creator/StepLook";
import { CreationOrderPicker } from "@/components/character-creator/CreationOrderPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { WizardNav, WIZARD_NAV_SPACE } from "@/components/WizardNav";
import {
  initializeCharacter,
  finalizeCreation,
  getCreationSteps,
  getValidationMessage,
  syncBaseFeatures,
  type Character,
} from "@/lib/character-creation";
import { getCharacter, saveCharacter } from "@/lib/storage";
import { classRebuildDraft, finishClassRebuild } from "@/lib/rebuild";
import { syncRules2024Preview } from "@/lib/rulesets";

export default function CharacterCreate() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [character, setCharacter] = useState<Character>(initializeCharacter);
  const [step, setStep] = useState(0);
  // Quick create or the full walk-through; asked once when the page opens.
  const [chosen, setChosen] = useState(false);
  // Picking the class again for a saved character (?rebuild=<id>): the old one, kept until the new one is saved.
  const [rebuildFrom, setRebuildFrom] = useState<Character | null>(null);
  useEffect(() => {
    syncRules2024Preview(window.location.search);
    const id = new URLSearchParams(window.location.search).get("rebuild");
    if (!id) return;
    let cancelled = false;
    getCharacter(id).then((old) => {
      if (cancelled || !old) return;
      const draft = classRebuildDraft(old);
      setRebuildFrom(old);
      setCharacter(draft);
      setChosen(true);
      setStep(Math.max(0, getCreationSteps(draft).findIndex((s) => s.id === "origin")));
    });
    return () => { cancelled = true; };
  }, []);

  // A class change keeps the gear the character carries, so there's no gear step.
  const steps = useMemo(
    () => getCreationSteps(character).filter((s) => !(character.rebuildOf && s.type === "equipment")),
    [character]
  );
  const totalSteps = steps.length;
  const currentStep = steps[step];
  const isLastStep = step === totalSteps - 1;

  const currentValidationError = currentStep?.required && !currentStep.completed
    ? getValidationMessage(currentStep, character)
    : null;


  const update = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      const next = syncBaseFeatures({ ...prev, ...patch }, language);
      return next;
    });
  }, [language]);

  const finishCreation = useCallback(async (draft: Character) => {
    const final = await finalizeCreation(draft, language);
    if (!rebuildFrom) return final;
    const rebuilt = finishClassRebuild(rebuildFrom, final);
    await saveCharacter(rebuilt);
    return rebuilt;
  }, [language, rebuildFrom]);

  const canProceed = useCallback((): boolean => {
    if (!currentStep) return false;
    if (!currentStep.required) return true;
    return currentStep.completed;
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;
    if (isLastStep) {
      const final = await finishCreation(character);
      router.replace(`/character?id=${final.id}`);
    } else {
      setStep((s) => s + 1);
    }
  }, [canProceed, isLastStep, character, router, finishCreation]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else if (rebuildFrom) router.replace(`/character?id=${rebuildFrom.id}`);
    else setChosen(false);
  }, [step, rebuildFrom, router]);

  const renderStep = useCallback(() => {
    if (!currentStep) return null;
    switch (currentStep.type) {
      case "source-selection":
        return (
          <>
            <CreationOrderPicker
              order={character.creationOrder ?? "concept"}
              steps={steps}
              onChange={(creationOrder) => update({ creationOrder })}
            />
            <StepSourceSelection data={character} onChange={update} />
          </>
        );
      case "origin":
        return <StepOrigin data={character} onChange={update} />;
      case "personality":
        return <StepPersonality data={character} onChange={update} />;
      case "abilities":
        return <StepAbilities data={character} onChange={update} />;
      case "skills":
        return <StepSkills data={character} onChange={update} />;
      case "equipment":
        return character.ruleset === "2024"
          ? <StepEquipment2024 data={character} onChange={update} />
          : <StepEquipment data={character} onChange={update} />;
      case "look":
        return <StepLook data={character} onChange={update} />;
      default:
        return null;
    }
  }, [currentStep, character, update, steps]);

  const isLevelStep = currentStep?.type === "level";

  if (!chosen) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader title={t("creator.title", "Character Creator")} />
        <main className="px-4 py-5">
          <div className="mx-auto max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("quick.newCharacter", "New character")}</p>
            <h1 className="text-2xl font-black tracking-tight text-ink">{t("quick.chooseTitle", "How do you want to start?")}</h1>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/character/quick"
                className="flex items-center gap-3 rounded-2xl border-2 border-border-strong bg-surface p-4 text-left transition active:scale-[0.98] hover:border-ink"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-surface"><Lightning size={22} weight="fill" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold leading-tight text-ink">{t("quick.title", "Quick create")}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{t("quick.chooseQuick", "Pick a class, subclass and name. Get a ready level 3 character with the most popular picks.")}</span>
                  <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink">{t("quick.chooseQuickFor", "For DMs and players who know the game")}</span>
                </span>
                <CaretRight size={20} weight="bold" className="shrink-0 text-ink-muted" />
              </Link>
              <button
                type="button"
                onClick={() => setChosen(true)}
                className="flex items-center gap-3 rounded-2xl border-2 border-border-strong bg-surface p-4 text-left transition active:scale-[0.98] hover:border-ink"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink"><ListNumbers size={22} weight="bold" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold leading-tight text-ink">{t("quick.full", "Full create")}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{t("quick.chooseFull", "Walk through every choice step by step: race, background, stats, skills, spells and gear.")}</span>
                  <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink">{t("quick.chooseFullFor", "Best for your first character")}</span>
                </span>
                <CaretRight size={20} weight="bold" className="shrink-0 text-ink-muted" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLevelStep) {
    return (
      <LevelUpWizard
        character={character}
        onCancel={() => setStep((s) => Math.max(0, s - 1))}
        onComplete={async (updated) => {
          const final = await finishCreation(updated);
          router.replace(`/character?id=${final.id}`);
        }}
        minLevel={1}
        maxLevel={Math.max(10, character.rebuildOf?.level ?? 1)}
        initialLevel={character.rebuildOf?.level}
        title={character.rebuildOf ? t("rebuild.classLevelTitle", "Back to your level") : t("creator.startingLevel")}
        subtitle={character.rebuildOf
          ? t("rebuild.classLevelHint", { level: character.rebuildOf.level }, "Level back up to {level} with your new class")
          : t("creator.startingLevelHint", "Choose your starting level and roll HP")}
        startFromLevelOne
        suggestAll={!!character.rebuildOf}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("creator.title", "Character Creator")} leaveWarning={t("leave.creation", "Your new hero is not saved yet. Going home now throws away the picks you made.")} />

      <main className="px-4 py-5" style={{ paddingBottom: WIZARD_NAV_SPACE }}>
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={step + 1} totalSteps={totalSteps} />
          {renderStep()}
        </div>
      </main>

      <WizardNav
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed()}
        nextLabel={
          isLastStep
            ? t("creator.createCharacter", "Create Character")
            : t("wizard.nextStep", { step: t(`creationOrder.step.${steps[step + 1].id}`, steps[step + 1].title) }, "Next: {step}")
        }
        showBack
      />
    </div>
  );
}
