"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepCard } from "@/components/character-creator/StepCard";
import { Dice, DiceType } from "@/components/Dice";
import { generateLevelUpSteps, type LevelUpChanges, type LevelUpStep, type LevelUpStepSection } from "@/lib/level-up";
import { getClassData, spells } from "@/data/srd";
import { getModifier, getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";

export default function LevelUpPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [character, setCharacter] = useState(() => {
    if (typeof window !== "undefined" && id) {
      const loaded = getCharacter(id) ?? null;
      if (loaded) {
        const derived = computeDerivedStats(loaded);
        return { ...loaded, ...derived };
      }
      return null;
    }
    return null;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hpResolved, setHpResolved] = useState<Record<number, boolean>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, { ability: string; delta: number }[]>>({});
  const [subclassChoice, setSubclassChoice] = useState<string | null>(null);
  const [expertiseChoices, setExpertiseChoices] = useState<Record<number, string[]>>({});
  const [selectedSpells, setSelectedSpells] = useState<Record<number, string[]>>({});

  const oldLevel = character?.level ?? 1;
  const newLevel = oldLevel + 1;
  const className = character?.class ?? "";

  const steps = useMemo(
    () => generateLevelUpSteps(oldLevel, newLevel, className, character?.expertise || [], character?.skills || {}),
    [oldLevel, newLevel, className, character?.expertise, character?.skills]
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
    if (!character) return;

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

    const patch: Partial<Character> = { level: newLevel };
    if (allFeatures.length > 0) {
      patch.features = [
        ...character.features,
        ...allFeatures.map((f) => ({
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: f.name,
          description: f.description,
        })),
      ];
    }
    if (subclassChoice) {
      patch.subclass = subclassChoice;
      const classData = getClassData(className);
      const subclassData = classData?.subclasses?.find((s) => s.name === subclassChoice);
      if (subclassData?.features) {
        const subclassFeatureEntries = subclassData.features.map((f) => ({
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: f.name,
          description: f.description,
        }));
        patch.features = [
          ...(patch.features || character.features),
          ...subclassFeatureEntries,
        ];
      }
    }
    if (allAsi.length > 0) {
      const updates: any = { ...character };
      for (const change of allAsi) {
        updates[change.ability] = (character[change.ability as keyof Character] as number || 0) + change.delta;
      }
      Object.assign(patch, updates);
    }
    if (allExpertise.length > 0) {
      patch.expertise = [...(character.expertise || []), ...allExpertise];
    }
    if (finalSpellSlots) {
      patch.spellSlots = { ...character.spellSlots, ...finalSpellSlots };
    }

    const derived = computeDerivedStats({ ...character, ...patch });
    const finalChar = { ...character, ...patch, ...derived };

    saveCharacter(finalChar);
    router.push(`/character/${id}`);
  }, [character, oldLevel, newLevel, className, subclassChoice, asiChoices, expertiseChoices, router, id]);

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
      router.push(`/character/${id}`);
    }
  }, [currentStepIndex, router, id]);

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Level Up" subtitle="Character Not Found" />
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">Character Not Found</h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">This character could not be found. It may have been deleted.</p>
            <Link href="/" className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-burgundy-light">
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Level Up" subtitle={character.name || "Character"} />
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">✨</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">No Level Up Available</h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">There are no level-up steps for this character at this time.</p>
            <button
              onClick={() => router.push(`/character/${id}`)}
              className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-burgundy-light"
            >
              Back to Character
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const sections = currentStep.sections || [];

  const canProceed = (): boolean => {
    for (const section of sections) {
      switch (section.type) {
        case "hp":
          if (!hpResolved[currentStep.level]) return false;
          break;
        case "asi":
          if ((asiChoices[currentStep.level]?.length || 0) === 0) return false;
          break;
        case "subclass":
          if (subclassChoice === null) return false;
          break;
        case "expertise":
          if ((expertiseChoices[currentStep.level]?.length || 0) !== (section.expertiseCount || 0)) return false;
          break;
        case "spellSelection": {
          const spellKey = currentStep.level;
          if ((selectedSpells[spellKey]?.length || 0) < (section.spellSelectionCount || 0)) return false;
          break;
        }
        default:
          break;
      }
    }
    return true;
  };

  const renderStepContent = () => {
    return (
      <div className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? "border-t border-parchment/10 pt-4" : ""}>
            {section.description && (
              <p className="text-xs text-parchment/60 mb-3">{section.description}</p>
            )}
            {renderSection(section)}
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (section: LevelUpStepSection) => {
    switch (section.type) {
      case "hp":
        return (
          <HpStep
            step={{ ...section, level: currentStep.level } as any}
            className={className}
            onResolve={handleHpResolve}
            resolved={hpResolved[currentStep.level] === true}
          />
        );
      case "features":
        return <FeaturesStep step={{ ...section, level: currentStep.level } as any} />;
      case "subclass":
        return <SubclassStep step={{ ...section, level: currentStep.level } as any} selected={subclassChoice} onSelect={setSubclassChoice} />;
      case "asi":
        return (
          <AsiStep
            step={{ ...section, level: currentStep.level } as any}
            abilityScores={{
              str: character.str,
              dex: character.dex,
              con: character.con,
              int: character.int,
              wis: character.wis,
              cha: character.cha,
            }}
            choices={asiChoices[currentStep.level] || []}
            onChange={(ability, delta) => handleAsiChange(currentStep.level, ability, delta)}
          />
        );
      case "expertise":
        return (
          <ExpertiseStep
            step={{ ...section, level: currentStep.level } as any}
            className={className}
            currentExpertise={character.expertise || []}
            currentSkills={character.skills || {}}
            selected={expertiseChoices[currentStep.level] || []}
            onSelect={(names) => setExpertiseChoices((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "spellSlots":
        return <SpellSlotsStep step={{ ...section, level: currentStep.level } as any} />;
      case "spellSelection":
        return (
          <SpellSelectionStep
            step={{ ...section, level: currentStep.level } as any}
            character={{ class: className, level: newLevel, str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha } as any}
            selected={selectedSpells[currentStep.level] || []}
            onSelect={(names) => setSelectedSpells((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
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
              className="rounded-lg border border-parchment/20 px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 rounded-lg bg-burgundy px-6 py-2.5 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {isLastStep ? "Finish Level Up" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HpStep({ step, className, onResolve, resolved }: { step: LevelUpStepSection; className: string; onResolve: (level: number) => void; resolved: boolean }) {
  const classData = getClassData(className);
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(10);
  const average = Math.floor(hitDie / 2) + 1;
  const diceType = `d${hitDie}` as DiceType;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Dice key={`dice-${step.level}`} type={diceType} size={80} onRoll={() => onResolve(step.level!)} />
          <span className="text-[10px] text-parchment/50 uppercase tracking-wider">Roll</span>
        </div>
        <button
          type="button"
          onClick={() => onResolve(step.level!)}
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

function FeaturesStep({ step }: { step: LevelUpStepSection }) {
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

function SubclassStep({ step, selected, onSelect }: { step: LevelUpStepSection; selected: string | null; onSelect: (name: string) => void }) {
  return (
    <div className="space-y-3">
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
  step: LevelUpStepSection;
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
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
  step: LevelUpStepSection;
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
      {step.description && <p className="text-xs text-parchment/60">{step.description}</p>}
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

function SpellSlotsStep({ step }: { step: LevelUpStepSection }) {
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

function SpellSelectionStep({
  step,
  character,
  selected,
  onSelect,
}: {
  step: LevelUpStepSection;
  character: { class: string; level: number; con: number; str: number; dex: number; int: number; wis: number; cha: number };
  selected: string[];
  onSelect: (names: string[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("cantrips");
  const classData = getClassData(character.class);

  const spellLevels = useMemo(() => {
    const levels: { key: string; label: string; level: number; limit: number }[] = [];
    const cantripsKnown = classData?.cantripsKnown?.[character.level] || 0;
    if (cantripsKnown > 0) {
      levels.push({ key: "cantrips", label: `Cantrips (0)`, level: 0, limit: cantripsKnown });
    }
    if (step.spellSlots) {
      for (const spellLevel of Object.keys(step.spellSlots).map(Number).sort((a, b) => a - b)) {
        const count = step.spellSlots![spellLevel];
        levels.push({ key: `level-${spellLevel}`, label: `Level ${spellLevel}`, level: spellLevel, limit: count });
      }
    }
    return levels;
  }, [classData, character.level, step.spellSlots]);

  const currentTab = spellLevels.find((l) => l.key === activeTab);
  const tabSpells = useMemo(() => {
    if (!currentTab) return [];
    if (currentTab.level === 0) {
      return spells.filter((s) => s.level === 0);
    }
    return spells.filter((s) => s.level === currentTab!.level);
  }, [currentTab]);

  const toggleSpell = (spellName: string) => {
    if (selected.includes(spellName)) {
      onSelect(selected.filter((n) => n !== spellName));
    } else if (selected.length < (currentTab?.limit || 0)) {
      onSelect([...selected, spellName]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {spellLevels.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-burgundy text-parchment"
                : "border border-parchment/10 text-parchment/60 hover:text-parchment"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-parchment/50">
        {currentTab ? `${selected.length} of ${currentTab.limit} selected` : ""}
      </p>
      <div className="space-y-2">
        {tabSpells.map((spell) => {
          const isSelected = selected.includes(spell.name);
          const isDisabled = !isSelected && selected.length >= (currentTab?.limit || 0);
          return (
            <div
              key={spell.name}
              className={`rounded-lg border px-3 py-2 ${
                isSelected
                  ? "border-gold/40 bg-gold/5"
                  : isDisabled
                  ? "border-parchment/5 bg-charcoal/20 opacity-50"
                  : "border-parchment/10 bg-charcoal/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-sm font-medium text-parchment/80">{spell.name}</span>
                  <p className="text-xs text-parchment/50 mt-0.5">{spell.effect}</p>
                  <p className="text-[10px] text-parchment/40 mt-1">{spell.castingTime} | {spell.range} | {spell.duration}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSpell(spell.name)}
                  disabled={isDisabled}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-gold/20 text-gold"
                      : isDisabled
                      ? "bg-charcoal/20 text-parchment/30"
                      : "border border-parchment/20 text-parchment hover:border-parchment/40"
                  }`}
                >
                  {isSelected ? "Selected" : `Select (${selected.length}/${currentTab?.limit || 0})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
