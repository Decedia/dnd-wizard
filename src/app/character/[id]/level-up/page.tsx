"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/character-sheet/SectionCard";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { getStaticClass } from "@/lib/srd-client";
import { generateLevelUpSteps, type LevelUpStep, type LevelUpStepSection } from "@/lib/level-up";
import { WizardNav } from "@/components/WizardNav";

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

  const [levelTab, setLevelTab] = useState(0);

  const oldLevel = character?.level ?? 1;
  const newLevel = oldLevel + 1;
  const classData = character?.class ? getStaticClass(character.class) : null;

  const steps = useMemo<LevelUpStep[]>(() => {
    if (!character || !classData) return [];
    return generateLevelUpSteps(
      oldLevel,
      newLevel,
      character.class,
      character.expertise || [],
      character.skills || {}
    );
  }, [character, classData, oldLevel, newLevel]);

  const currentStep = steps[levelTab];
  const isLastTab = levelTab === steps.length - 1;

  const handleNext = useCallback(() => {
    if (!character) return;
    if (isLastTab) {
      const patch: Partial<Character> = { level: newLevel };
      const derived = computeDerivedStats({ ...character, ...patch });
      const finalCharacter = { ...character, ...patch, ...derived } as Character;
      saveCharacter(finalCharacter);
      router.push(`/character/${id}`);
    } else {
      setLevelTab((t) => t + 1);
    }
  }, [isLastTab, newLevel, character, router, id]);

  const handleBack = useCallback(() => {
    if (levelTab > 0) {
      setLevelTab((t) => t - 1);
    } else {
      router.push(`/character/${id}`);
    }
  }, [levelTab, router, id]);

  const renderSection = useCallback((section: LevelUpStepSection) => {
    if (section.type === "features" && section.features) {
      return (
        <div className="space-y-4">
          {section.features.map((feature, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="text-sm font-semibold text-accent">{feature.name}</h3>
              <p className="text-sm text-parchment/80 leading-relaxed whitespace-pre-line">{feature.description}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Level Up" subtitle="Character Not Found" />
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">
              Character Not Found
            </h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">
              This character could not be found. It may have been deleted.
            </p>
            <Link
              href="/"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
            >
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

      <div className="sticky top-[68px] z-30 bg-charcoal/90 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {steps.map((step, index) => {
              const isActive = index === levelTab;
              const isCompleted = index < levelTab;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setLevelTab(index)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : isCompleted
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
                  }`}
                >
                  Level {step.level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          {currentStep && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-parchment">{currentStep.title}</h2>
              </div>
              {currentStep.sections.map((section, i) => (
                <SectionCard
                  key={`${section.type}-${i}`}
                  id=""
                  title={section.type === "features" ? "New Features" : ""}
                  icon={section.type === "features" ? <span className="text-accent">⚡</span> : undefined}
                >
                  {renderSection(section)}
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      </main>

      <WizardNav
        onBack={handleBack}
        onNext={handleNext}
        canProceed={true}
        nextLabel={isLastTab ? "Finish Level Up" : "Next"}
      />
    </div>
  );
}
