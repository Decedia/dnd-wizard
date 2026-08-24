"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/character-sheet/SectionCard";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import {
  generateLevelUpSteps,
  sectionTitle,
  sectionIcon,
  type LevelUpStep,
  type LevelUpStepSection,
} from "@/lib/level-up";
import { useToggleArray } from "@/hooks/useToggleArray";
import { LevelTabs } from "@/components/level-up/LevelTabs";
import { WizardNav } from "@/components/level-up/WizardNav";
import { LevelUpHpSection } from "@/components/level-up/sections/LevelUpHpSection";
import { LevelUpAsiSection } from "@/components/level-up/sections/LevelUpAsiSection";
import { LevelUpFeaturesSection } from "@/components/level-up/sections/LevelUpFeaturesSection";
import { LevelUpExpertiseSection } from "@/components/level-up/sections/LevelUpExpertiseSection";
import { LevelUpSpellSlotsSection } from "@/components/level-up/sections/LevelUpSpellSlotsSection";
import { LevelUpSpellSelectionSection } from "@/components/level-up/sections/LevelUpSpellSelectionSection";
import { LevelUpSkillSelectionSection } from "@/components/level-up/sections/LevelUpSkillSelectionSection";

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
  const [hpGains, setHpGains] = useState<Record<number, number>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, { ability: string; delta: number }[]>>({});
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>({});
  const [expertiseChoices, toggleExpertise] = useToggleArray<string>({});
  const [selectedSpells, toggleSpell] = useToggleArray<string>({});
  const [skillChoices, toggleSkill] = useToggleArray<string>({});

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

  const updateHp = useCallback((level: number, value: number) => {
    setHpGains((prev) => ({ ...prev, [level]: value }));
  }, []);

  const updateAsi = useCallback((level: number, ability: string, delta: number) => {
    setAsiChoices((prev) => {
      const current = prev[level] || [];
      const existing = current.findIndex((c) => c.ability === ability);
      let next: { ability: string; delta: number }[];
      if (existing >= 0) {
        next = current.map((c, i) => (i === existing ? { ability, delta: c.delta + delta } : c)).filter((c) => c.delta !== 0);
      } else if (delta > 0) {
        next = [...current, { ability, delta }];
      } else {
        return prev;
      }
      return { ...prev, [level]: next };
    });
  }, []);

  const totalAsiAllocated = useCallback((level: number) => {
    return (asiChoices[level] || []).reduce((sum, c) => sum + c.delta, 0);
  }, [asiChoices]);

  const canProceed = useCallback((): boolean => {
    if (!currentStep) return false;
    for (const section of currentStep.sections) {
      switch (section.type) {
        case "hp":
          if (hpGains[currentStep.level] == null || hpGains[currentStep.level] <= 0) return false;
          break;
        case "asi":
          if (totalAsiAllocated(currentStep.level) !== 2) return false;
          break;
        case "expertise":
          if ((expertiseChoices[currentStep.level] || []).length < (section.expertiseCount || 1)) return false;
          break;
        case "spellSelection":
          if ((selectedSpells[currentStep.level] || []).length === 0) return false;
          break;
        case "skillSelection":
          if ((skillChoices[currentStep.level] || []).length < (section.skillSelectionCount || 1)) return false;
          break;
      }
    }
    return true;
  }, [currentStep, hpGains, expertiseChoices, selectedSpells, skillChoices, totalAsiAllocated]);

  const handleFinish = useCallback(() => {
    if (!character) return;

    const patch: Partial<Character> = { level: newLevel };

    let totalHpGain = 0;
    for (const [level, hp] of Object.entries(hpGains)) {
      totalHpGain += hp || 0;
    }
    if (totalHpGain > 0) {
      patch.maxHp = (character.maxHp || 0) + totalHpGain;
      patch.currentHp = (character.currentHp || 0) + totalHpGain;
    }

    if (Object.keys(asiChoices).length > 0) {
      const abilityUpdates: Record<string, number> = {};
      for (const choices of Object.values(asiChoices)) {
        for (const choice of choices) {
          abilityUpdates[choice.ability] = (abilityUpdates[choice.ability] || 0) + choice.delta;
        }
      }
      for (const [ability, delta] of Object.entries(abilityUpdates)) {
        (patch as any)[ability] = (character[ability as keyof Character] as number || 0) + delta;
      }
    }

    const allExpertise: string[] = [];
    for (const choices of Object.values(expertiseChoices)) {
      allExpertise.push(...choices);
    }
    if (allExpertise.length > 0) {
      patch.expertise = [...(character.expertise || []), ...allExpertise];
    }

    const allSpells: string[] = [];
    for (const spells of Object.values(selectedSpells)) {
      allSpells.push(...spells);
    }
    if (allSpells.length > 0) {
      patch.spells = [
        ...(character.spells || []),
        ...allSpells.map((name) => ({
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name,
          level: 0,
          source: "srd" as const,
        })),
      ];
    }

    const derived = computeDerivedStats({ ...character, ...patch });
    const finalCharacter = { ...character, ...patch, ...derived };
    saveCharacter(finalCharacter);
    router.push(`/character/${id}`);
  }, [character, newLevel, hpGains, asiChoices, expertiseChoices, selectedSpells, router, id]);

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    if (isLastTab) {
      handleFinish();
    } else {
      setLevelTab((t) => t + 1);
    }
  }, [canProceed, isLastTab, handleFinish]);

  const handleBack = useCallback(() => {
    if (levelTab > 0) {
      setLevelTab((t) => t - 1);
    } else {
      router.push(`/character/${id}`);
    }
  }, [levelTab, router, id]);

  const renderSection = useCallback(
    (section: LevelUpStepSection) => {
      switch (section.type) {
        case "hp":
          return (
            <LevelUpHpSection
              key={section.type}
              description={section.description || ""}
              level={currentStep?.level ?? 0}
              hpGain={hpGains[currentStep?.level ?? 0] || 0}
              onHpChange={updateHp}
            />
          );

        case "features":
          return (
            <LevelUpFeaturesSection
              key={section.type}
              features={section.features || []}
              featureChoices={section.featureChoices}
              featureChoicesState={featureChoices}
              onFeatureChoiceChange={(featureName, option) =>
                setFeatureChoices((prev) => ({ ...prev, [featureName]: option }))
              }
            />
          );

        case "asi":
          return (
            <LevelUpAsiSection
              key={section.type}
              description={section.description || ""}
              level={currentStep?.level ?? 0}
              character={character!}
              asiChoices={asiChoices}
              onAsiChange={updateAsi}
              totalAsiAllocated={totalAsiAllocated}
            />
          );

        case "expertise":
          return (
            <LevelUpExpertiseSection
              key={section.type}
              description={section.description || ""}
              level={currentStep?.level ?? 0}
              character={character!}
              expertiseChoices={expertiseChoices}
              expertiseCount={section.expertiseCount || 2}
              onExpertiseChange={toggleExpertise}
            />
          );

        case "spellSlots":
          return (
            <LevelUpSpellSlotsSection
              key={section.type}
              description={section.description || ""}
              spellSlots={section.spellSlots || {}}
            />
          );

        case "spellSelection":
          return (
            <LevelUpSpellSelectionSection
              key={section.type}
              description={section.description || ""}
              level={currentStep?.level ?? 0}
              selectedSpells={selectedSpells}
              characterClass={character?.class || ""}
              onSpellChange={toggleSpell}
            />
          );

        case "skillSelection":
          return (
            <LevelUpSkillSelectionSection
              key={section.type}
              description={section.description || ""}
              level={currentStep?.level ?? 0}
              skillChoices={skillChoices}
              skillOptions={section.skillOptions || []}
              skillSelectionCount={section.skillSelectionCount || 1}
              onSkillChange={toggleSkill}
            />
          );

        default:
          return null;
      }
    },
    [
      currentStep,
      character,
      hpGains,
      featureChoices,
      asiChoices,
      expertiseChoices,
      selectedSpells,
      skillChoices,
      updateHp,
      updateAsi,
      totalAsiAllocated,
      toggleExpertise,
      toggleSpell,
      toggleSkill,
    ]
  );

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
      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <LevelTabs steps={steps} levelTab={levelTab} onSelect={setLevelTab} />

          {currentStep && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-parchment">{currentStep.title}</h2>
              </div>
              {currentStep.sections.map((section, i) => (
                <SectionCard
                  key={`${section.type}-${i}`}
                  id=""
                  title={sectionTitle(section.type)}
                  icon={<span className="text-accent">{sectionIcon(section.type)}</span>}
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
        canProceed={canProceed()}
        nextLabel={isLastTab ? "Finish Level Up" : "Next"}
      />
    </div>
  );
}
