"use client";

import { useState, useMemo, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProgressIndicator } from "@/components/character-creator/ProgressIndicator";
import { StepCard } from "@/components/character-creator/StepCard";
import { generateLevelUpSteps, type LevelUpChanges, type LevelUpStep, type LevelUpStepSection } from "@/lib/level-up";
import { getStaticClass, getStaticSpells, getStaticWizardSpells } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";

interface LevelUpFlowProps {
  open: boolean;
  oldLevel: number;
  newLevel: number;
  charClass: string;
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
  charClass,
  currentAbilityScores,
  currentExpertise,
  currentSkills,
  onComplete,
  onCancel,
}: LevelUpFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hpResolved, setHpResolved] = useState<Record<number, number | boolean>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, { ability: string; delta: number }[]>>({});
  const [subclassChoice, setSubclassChoice] = useState<string | null>(null);
  const [expertiseChoices, setExpertiseChoices] = useState<Record<number, string[]>>({});
  const [skillSelections, setSkillSelections] = useState<Record<number, string[]>>({});

  const steps = useMemo(
    () => generateLevelUpSteps(oldLevel, newLevel, charClass, currentExpertise, currentSkills),
    [oldLevel, newLevel, charClass, currentExpertise, currentSkills]
  );

  const [selectedSpells, setSelectedSpells] = useState<Record<number, string[]>>({});
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>({});

  const runningAbilityScores = useMemo(() => {
    const scores = { ...currentAbilityScores };
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      const choices = asiChoices[level] || [];
      for (const c of choices) {
        scores[c.ability as keyof typeof scores] = (scores[c.ability as keyof typeof scores] || 0) + c.delta;
      }
    }
    return scores;
  }, [currentAbilityScores, asiChoices, oldLevel, newLevel]);

  const getAbilityScoresForStep = useCallback((stepLevel: number) => {
    const scores = { ...currentAbilityScores };
    for (let level = oldLevel + 1; level < stepLevel; level++) {
      const choices = asiChoices[level] || [];
      for (const c of choices) {
        scores[c.ability as keyof typeof scores] = (scores[c.ability as keyof typeof scores] || 0) + c.delta;
      }
    }
    return scores;
  }, [currentAbilityScores, asiChoices, oldLevel]);

  const handleHpResolve = useCallback((level: number, gain?: number) => {
    setHpResolved((prev) => ({ ...prev, [level]: gain ?? true }));
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
      const levelData = getStaticClass(charClass)?.levels[level - 1];
      if (levelData?.features) {
        allFeatures.push(...levelData.features
          .filter((f: any) => !f.optional || featureChoices[f.name])
          .map((f: any) => {
            const choice = featureChoices[f.name];
            let name = f.name;
            let description = f.description || f.name;
            if (choice) {
              name = `${f.name} (${choice})`;
            }
            return { name, description };
          }));
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

    const allSkillProficiencies: string[] = [];
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      allSkillProficiencies.push(...(skillSelections[level] || []));
    }

    onComplete({
      level: newLevel,
      features: allFeatures,
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      abilityScoreChanges: allAsi,
      expertise: [...new Set(allExpertise)],
      spellSlots: finalSpellSlots,
      choices: Object.keys(featureChoices).length > 0 ? featureChoices : undefined,
      ...(allSkillProficiencies.length > 0 ? { skillProficiencies: [...new Set(allSkillProficiencies)] } : {}),
    });
  }, [oldLevel, newLevel, charClass, subclassChoice, asiChoices, expertiseChoices, featureChoices, skillSelections, onComplete]);

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
          if (section.subclassFeatureChoices) {
            for (const choice of section.subclassFeatureChoices) {
              if (!featureChoices[choice.featureName]) return false;
            }
          }
          break;
        case "expertise":
          if ((expertiseChoices[currentStep.level]?.length || 0) !== (section.expertiseCount || 0)) return false;
          break;
        case "skillSelection":
          if (featureChoices["Aspect of the Beast"] === "Tiger") {
            if ((skillSelections[currentStep.level]?.length || 0) !== (section.skillSelectionCount || 0)) return false;
          }
          break;
        case "spellSelection": {
          const spellKey = currentStep.level;
          if ((selectedSpells[spellKey]?.length || 0) < (section.spellSelectionCount || 0)) return false;
          break;
        }
        case "features":
          if (section.featureChoices) {
            for (const choice of section.featureChoices) {
              if (choice.optional) continue;
              if (!featureChoices[choice.featureName]) return false;
            }
          }
          break;
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

  const renderSection = (section: any) => {
    switch (section.type) {
      case "hp":
        return (
          <HpStep
            step={{ ...section, level: currentStep.level } as any}
            charClass={charClass}
            conMod={getModifier(runningAbilityScores.con)}
            onResolve={handleHpResolve}
            resolved={hpResolved[currentStep.level] != null}
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
            abilityScores={getAbilityScoresForStep(currentStep.level)}
            choices={asiChoices[currentStep.level] || []}
            onChange={(ability, delta) => handleAsiChange(currentStep.level, ability, delta)}
          />
        );
      case "expertise":
        return (
          <ExpertiseStep
            step={{ ...section, level: currentStep.level } as any}
            charClass={charClass}
            currentExpertise={currentExpertise}
            currentSkills={currentSkills}
            selected={expertiseChoices[currentStep.level] || []}
            onSelect={(names) => setExpertiseChoices((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "skillSelection":
        return (
          <SkillSelectionStep
            step={{ ...section, level: currentStep.level } as any}
            currentSkills={currentSkills}
            selected={skillSelections[currentStep.level] || []}
            onSelect={(names) => setSkillSelections((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "spellSlots":
        return <SpellSlotsStep step={{ ...section, level: currentStep.level } as any} />;
      case "spellSelection":
        return (
          <SpellSelectionStep
            step={{ ...section, level: currentStep.level } as any}
            character={{ class: charClass, level: newLevel, ...getAbilityScoresForStep(currentStep.level) } as any}
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
          <div className="flex items-center gap-3 rounded-full border border-parchment/20 bg-charcoal/90 backdrop-blur-xl p-3 shadow-lg">
             <button
               type="button"
               onClick={handleBack}
               className="flex-1 rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-parchment transition-all hover:border-white/40 hover:bg-white/5"
             >
               Back
             </button>
             <button
               type="button"
               onClick={handleNext}
               disabled={!canProceed()}
               className="flex-1 rounded-full bg-burgundy px-4 py-2.5 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
             >
              {isLastStep ? "Finish Level Up" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HpStep({ step, charClass, conMod, onResolve, resolved, gain }: { step: LevelUpStep; charClass: string; conMod: number; onResolve: (level: number, gain?: number) => void; resolved: boolean; gain?: number }) {
  const classData = getStaticClass(charClass);
  const hitDie = classData?.hitDie || 10;
  const average = Math.floor(hitDie / 2) + 1;
  const totalGain = average + conMod;
  const [manualRoll, setManualRoll] = useState("");

  const handleManualSubmit = () => {
    const val = parseInt(manualRoll, 10);
    if (!isNaN(val) && val > 0) {
      onResolve(step.level, val);
    } else {
      onResolve(step.level);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <input
            type="number"
            value={manualRoll}
            onChange={(e) => setManualRoll(e.target.value)}
            onBlur={() => {}}
            placeholder="Enter roll..."
            className="input w-24 text-center text-sm"
            min={1}
          />
          <span className="text-[10px] text-parchment/50 uppercase tracking-wider">Roll</span>
        </div>
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={resolved}
          className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-parchment transition-all hover:border-white/40 hover:bg-white/5 disabled:opacity-40"
        >
          Take Average ({totalGain})
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
          <span className="text-sm font-medium text-parchment/80">{feature.name}:</span>
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
                       <span className="font-medium text-parchment/80">{feature.name}:</span> {feature.description}
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
                   className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-parchment/60 disabled:opacity-30"
                 >
                  -
                </button>
                <span className="text-sm font-semibold text-burgundy w-6 text-center">{allocated > 0 ? `+${allocated}` : "0"}</span>
                 <button
                   type="button"
                   onClick={() => onChange(key, 1)}
                   disabled={totalAllocated >= maxPoints || newScore >= 20}
                   className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-parchment/60 disabled:opacity-30"
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
  charClass,
  currentExpertise,
  currentSkills,
  selected,
  onSelect,
}: {
  step: LevelUpStepSection;
  charClass: string;
  currentExpertise: string[];
  currentSkills: Record<string, boolean>;
  selected: string[];
  onSelect: (names: string[]) => void;
}) {
  const toggle = (name: string) => {
    if (currentExpertise.includes(name)) {
      return;
    }
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
  if (charClass === "Rogue" && !options.includes("Thieves' Tools")) {
    options.push("Thieves' Tools");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((name) => {
          const isSelected = selected.includes(name);
          const isAlreadySelected = currentExpertise.includes(name);
          const isDisabled = isAlreadySelected || (!isSelected && selected.length >= (step.expertiseCount || 0));
          return (
            <label
              key={name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                isAlreadySelected || isSelected
                  ? "border-burgundy/40 bg-burgundy/5"
                  : isDisabled
                  ? "border-parchment/5 bg-charcoal/20 opacity-50"
                  : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
              }`}
            >
              <input
                type="checkbox"
                checked={isAlreadySelected || isSelected}
                onChange={() => toggle(name)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-burgundy focus:ring-burgundy/50 disabled:opacity-30"
              />
              <span className="text-sm text-parchment/80">{name}</span>
              {(isAlreadySelected || isSelected) && (
                <span className="text-[10px] font-bold text-burgundy bg-burgundy/10 px-1.5 py-0.5 rounded ml-auto">EXPERTISE</span>
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
            <span className="block text-sm font-semibold text-burgundy">{count}</span>
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
  const classData = getStaticClass(character.class);

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
  const isWizardClass = character.class === "Wizard";
  const tabSpells = useMemo(() => {
    if (!currentTab) return [];
    const spellList = isWizardClass ? getStaticWizardSpells() : getStaticSpells();
    if (currentTab.level === 0) {
      return spellList.filter((s) => s.level === 0);
    }
    return spellList.filter((s) => s.level === currentTab!.level);
  }, [currentTab, isWizardClass]);

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
             className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
               activeTab === tab.key
                 ? "bg-burgundy text-parchment"
                 : "border border-white/20 text-parchment/60 hover:text-parchment"
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
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isSelected
                  ? "border-burgundy/40 bg-burgundy/5"
                  : isDisabled
                  ? "border-parchment/5 bg-charcoal/20 opacity-50"
                  : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSpell(spell.name)}
                  disabled={isDisabled}
                  className="h-4 w-4 rounded border-white/30 bg-charcoal text-white focus:ring-white/50 disabled:opacity-30"
                />
                <span className="text-sm text-parchment/80">{spell.name}</span>
              </label>
              <span className="text-xs text-parchment/50 capitalize">{("school" in spell ? spell.school : undefined) || spell.level}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillSelectionStep({
  step,
  currentSkills,
  selected,
  onSelect,
}: {
  step: LevelUpStepSection;
  currentSkills: Record<string, boolean>;
  selected: string[];
  onSelect: (names: string[]) => void;
}) {
  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onSelect(selected.filter((n) => n !== name));
    } else if (selected.length < (step.skillSelectionCount || 0)) {
      onSelect([...selected, name]);
    }
  };

  const options = step.skillOptions || [];

  return (
    <div className="space-y-3">
      {step.description && <p className="text-xs text-parchment/50">{step.description}</p>}
      <div className="space-y-2">
        {options.map((name) => {
          const isSelected = selected.includes(name);
          const isAlreadyProficient = currentSkills[name];
          const isDisabled = isAlreadyProficient || (!isSelected && selected.length >= (step.skillSelectionCount || 0));
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
                checked={isSelected || isAlreadyProficient}
                onChange={() => toggle(name)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
              />
              <span className="text-sm text-parchment/80">{name}</span>
              {isAlreadyProficient && <span className="text-[10px] text-parchment/40">(already proficient)</span>}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-parchment/50">{selected.length} of {step.skillSelectionCount || 0} selected</p>
    </div>
  );
}
