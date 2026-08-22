"use client";

import { useState, useMemo, useCallback } from "react";
import { Dice, DiceType } from "@/components/Dice";
import { generateLevelUpSteps, type LevelUpStep, type LevelUpChanges, type LevelUpStepSection } from "@/lib/level-up";
import { getStaticClass, getStaticSpells, getStaticWizardSpells } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus } from "@/lib/storage";
import { normalizeDescription, getAnimalDescription } from "@/lib/level-up";
import type { Character } from "@/lib/storage";

interface PerLevelStepsFlowProps {
  character: Character;
  steps: LevelUpStep[];
  onComplete: (changes: LevelUpChanges) => void;
  onBack: () => void;
  overallCurrentStep: number;
  overallTotalSteps: number;
}

export function PerLevelStepsFlow({ character, steps, onComplete, onBack, overallCurrentStep, overallTotalSteps }: PerLevelStepsFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hpResolved, setHpResolved] = useState<Record<number, boolean>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, { ability: string; delta: number }[]>>({});
  const [subclassChoice, setSubclassChoice] = useState<string | null>(character.subclass || null);
  const [expertiseChoices, setExpertiseChoices] = useState<Record<number, string[]>>({});
  const [selectedSpells, setSelectedSpells] = useState<Record<string, string[]>>({});
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>({});
  const [skillSelections, setSkillSelections] = useState<Record<number, string[]>>({});

  const baseAbilityScores = useMemo(() => ({
    str: character.str || 0,
    dex: character.dex || 0,
    con: character.con || 0,
    int: character.int || 0,
    wis: character.wis || 0,
    cha: character.cha || 0,
  }), [character]);

  const getRunningAbilityScores = useCallback((stepLevel: number) => {
    const scores = { ...baseAbilityScores };
    for (let level = 2; level < stepLevel; level++) {
      const choices = asiChoices[level] || [];
      for (const c of choices) {
        scores[c.ability as keyof typeof scores] = (scores[c.ability as keyof typeof scores] || 0) + c.delta;
      }
    }
    return scores;
  }, [baseAbilityScores, asiChoices]);

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
    const classData = getStaticClass(character.class);
    const allFeatures: { name: string; description: string }[] = [];
    const allSpellSlots: Record<number, number> = {};
    let finalSpellSlots: Record<number, number> | null = null;

    for (let level = 1; level <= character.level; level++) {
      const levelData = classData?.levels[level - 1];
      if (levelData?.features) {
        allFeatures.push(...levelData.features
          .filter((f: any) => !f.optional || featureChoices[f.name])
          .map((f: any) => {
            const choice = featureChoices[f.name];
            let name = f.name;
            let description = normalizeDescription(f.description);
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
    for (let level = 1; level <= character.level; level++) {
      allAsi.push(...(asiChoices[level] || []));
    }

    const allExpertise: string[] = [];
    for (let level = 1; level <= character.level; level++) {
      allExpertise.push(...(expertiseChoices[level] || []));
    }

    const allSkillProficiencies: string[] = [];
    for (let level = 1; level <= character.level; level++) {
      allSkillProficiencies.push(...(skillSelections[level] || []));
    }

    const featureChoiceSkills: string[] = [];
    const primalKnowledgeSkill = featureChoices["Primal Knowledge"];
    if (primalKnowledgeSkill) {
      featureChoiceSkills.push(primalKnowledgeSkill);
    }

    onComplete({
      level: character.level,
      features: allFeatures,
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      abilityScoreChanges: allAsi,
      expertise: [...new Set(allExpertise)],
      spellSlots: finalSpellSlots,
      choices: Object.keys(featureChoices).length > 0 ? featureChoices : undefined,
      ...(allSkillProficiencies.length > 0 || featureChoiceSkills.length > 0 ? { skillProficiencies: [...new Set([...allSkillProficiencies, ...featureChoiceSkills])] } : {}),
    });
  }, [character.level, character.class, subclassChoice, asiChoices, expertiseChoices, featureChoices, skillSelections, onComplete]);

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
      onBack();
    }
  }, [currentStepIndex, onBack]);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const sections = currentStep.sections || [];
  const currentStepAbilityScores = getRunningAbilityScores(currentStep.level);

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
          if (section.subclassFeatureChoices && section.subclassOptions) {
            const selectedSub = section.subclassOptions.find((o) => o.name === subclassChoice);
            const availableFeatureNames = new Set(
              (selectedSub?.features || [])
                .filter((f: any) => (f.level == null || f.level === currentStep.level))
                .map((f: any) => f.name)
            );
            for (const choice of section.subclassFeatureChoices) {
              if (availableFeatureNames.has(choice.featureName) && !featureChoices[choice.featureName]) return false;
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
          const spellKey = `level-${currentStep.level}`;
          if ((selectedSpells[spellKey]?.length || 0) < (section.spellSelectionCount || 0)) return false;
          break;
        }
        case "features":
          if (section.featureChoices) {
            for (const choice of section.featureChoices) {
              if (choice.optional) continue;
              if (!featureChoices[choice.featureName]) return false;
              if (choice.featureName === "Aspect of the Beast" && featureChoices[choice.featureName] === "Tiger" && choice.tigerSkillCount) {
                const selected = skillSelections[currentStep.level] || [];
                if (selected.length !== choice.tigerSkillCount) return false;
              }
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

  const renderSection = (section: LevelUpStepSection) => {
    switch (section.type) {
      case "hp":
        return (
          <HpStepInline
            step={{ ...section, level: currentStep.level } as any}
            className={character.class}
            conMod={getModifier(currentStepAbilityScores.con)}
            onResolve={handleHpResolve}
            resolved={hpResolved[currentStep.level] === true}
          />
        );
      case "features":
        return (
          <FeaturesStepInline
            step={{ ...section, level: currentStep.level } as any}
            featureChoices={section.featureChoices}
            selectedChoices={featureChoices}
            onChoiceChange={(featureName, value) => {
              setFeatureChoices((prev) => {
                const next = { ...prev };
                if (value) {
                  next[featureName] = value;
                } else {
                  delete next[featureName];
                }
                return next;
              });
            }}
            skillSelections={skillSelections}
            onSkillSelect={(level, names) => setSkillSelections((prev) => ({ ...prev, [level]: names }))}
            currentSkills={character.skills || {}}
          />
        );
      case "subclass":
        return (
          <SubclassStepInline
            step={{ ...section, level: currentStep.level } as any}
            selected={subclassChoice}
            onSelect={setSubclassChoice}
            featureChoices={section.subclassFeatureChoices}
            selectedChoices={featureChoices}
            onChoiceChange={(featureName, value) => {
              setFeatureChoices((prev) => {
                const next = { ...prev };
                if (value) {
                  next[featureName] = value;
                } else {
                  delete next[featureName];
                }
                return next;
              });
            }}
          />
        );
      case "asi":
        return (
          <AsiStepInline
            step={{ ...section, level: currentStep.level } as any}
            abilityScores={currentStepAbilityScores}
            choices={asiChoices[currentStep.level] || []}
            onChange={(ability, delta) => handleAsiChange(currentStep.level, ability, delta)}
          />
        );
      case "expertise":
        return (
          <ExpertiseStepInline
            step={{ ...section, level: currentStep.level } as any}
            className={character.class}
            currentExpertise={character.expertise || []}
            currentSkills={character.skills || {}}
            selected={expertiseChoices[currentStep.level] || []}
            onSelect={(names) => setExpertiseChoices((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "skillSelection":
        return (
          <SkillSelectionStepInline
            step={{ ...section, level: currentStep.level } as any}
            currentSkills={character.skills || {}}
            selected={skillSelections[currentStep.level] || []}
            onSelect={(names) => setSkillSelections((prev) => ({ ...prev, [currentStep.level]: names }))}
          />
        );
      case "spellSlots":
        return <SpellSlotsStepInline step={{ ...section, level: currentStep.level } as any} />;
      case "spellSelection":
        return (
          <SpellSelectionStepInline
            step={{ ...section, level: currentStep.level } as any}
            character={{ ...character, ...currentStepAbilityScores }}
            selected={selectedSpells[`level-${currentStep.level}`] || []}
            onSelect={(names) => setSelectedSpells((prev) => ({ ...prev, [`level-${currentStep.level}`]: names }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="rounded-xl border border-parchment/10 bg-charcoal-light/60 p-4">
        <h3 className="mb-3 font-display text-lg font-semibold text-parchment">{currentStep.title}</h3>
        <div className="mb-4">
          {renderStepContent()}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
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
          className="flex-1 rounded-lg bg-burgundy px-6 py-2.5 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          {isLastStep ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

function HpStepInline({ step, className, conMod, onResolve, resolved }: { step: LevelUpStepSection; className: string; conMod: number; onResolve: (level: number) => void; resolved: boolean }) {
  const classData = getStaticClass(className);
  const hitDie = classData?.hitDie || 10;
  const average = Math.floor(hitDie / 2) + 1;
  const diceType = `d${hitDie}` as DiceType;
  const totalGain = average + conMod;

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

function FeaturesStepInline({ step, featureChoices, selectedChoices, onChoiceChange, skillSelections, onSkillSelect, currentSkills }: { step: LevelUpStepSection; featureChoices?: LevelUpStepSection["featureChoices"]; selectedChoices?: Record<string, string>; onChoiceChange?: (featureName: string, value: string) => void; skillSelections?: Record<number, string[]>; onSkillSelect?: (level: number, names: string[]) => void; currentSkills?: Record<string, boolean> }) {
  const level = step.level;
  return (
    <div className="space-y-2">
      {step.features?.map((feature, idx) => {
        const optionFeatureChoices = featureChoices?.find((c) => c.featureName === feature.name);
        const selectedAnimal = selectedChoices?.[feature.name];
        const animalDesc = selectedAnimal ? getAnimalDescription(feature.description, selectedAnimal) : undefined;
        const tigerSkills = optionFeatureChoices?.tigerSkillOptions;
        const selectedTigerSkills = skillSelections?.[level || 0] || [];
        return (
          <div key={idx} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
            <span className="text-sm font-medium text-gold/80">{feature.name}:</span>
            <span className="text-xs text-parchment/70 ml-1 whitespace-pre-line">{feature.description}</span>
            {optionFeatureChoices && (
              <div className="mt-2">
                <select
                  value={selectedAnimal || ""}
                  onChange={(e) => onChoiceChange?.(feature.name, e.target.value)}
                  onBlur={() => {}}
                  className="input w-full"
                >
                  <option value="">Choose...</option>
                  {optionFeatureChoices.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {animalDesc && (
                  <p className="text-xs text-parchment/50 mt-1">{animalDesc}</p>
                )}
                {selectedAnimal === "Tiger" && tigerSkills && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-parchment/60">If you chose Tiger for {feature.name}, select {optionFeatureChoices.tigerSkillCount || 2} skills to gain proficiency in.</p>
                    {tigerSkills.map((skill) => {
                      const isAlreadyProficient = currentSkills?.[skill];
                      const isSelected = selectedTigerSkills.includes(skill);
                      const isDisabled = isAlreadyProficient || (!isSelected && selectedTigerSkills.length >= (optionFeatureChoices.tigerSkillCount || 2));
                      return (
                        <label key={skill} className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${isSelected ? "border-gold/40 bg-gold/5" : isDisabled ? "border-parchment/5 bg-charcoal/20 opacity-50" : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"}`}>
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyProficient}
                            onChange={() => {
                              if (!onSkillSelect || !level) return;
                              const next = isSelected
                                ? selectedTigerSkills.filter((n) => n !== skill)
                                : selectedTigerSkills.length < (optionFeatureChoices.tigerSkillCount || 2)
                                  ? [...selectedTigerSkills, skill]
                                  : selectedTigerSkills;
                              onSkillSelect(level, next);
                            }}
                            disabled={isDisabled}
                            className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
                          />
                          <span className="text-sm text-parchment/80">{skill}</span>
                          {isAlreadyProficient && <span className="text-[10px] text-parchment/40">(already proficient)</span>}
                        </label>
                      );
                    })}
                    <p className="text-xs text-parchment/50">{selectedTigerSkills.length} of {optionFeatureChoices.tigerSkillCount || 2} selected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-parchment/50 mt-2">These features have been added to your character sheet.</p>
    </div>
  );
}

function SubclassStepInline({ step, selected, onSelect, featureChoices, selectedChoices, onChoiceChange }: { step: LevelUpStepSection; selected: string | null; onSelect: (name: string) => void; featureChoices?: LevelUpStepSection["subclassFeatureChoices"]; selectedChoices?: Record<string, string>; onChoiceChange?: (featureName: string, value: string) => void }) {
  const selectedOption = step.subclassOptions?.find((o) => o.name === selected);
  const level = step.level;
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
            </div>
          </label>
        ))}
      </div>
      {selectedOption && level && selectedOption.features?.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-parchment/60 uppercase tracking-wider">Features gained at level {level}</p>
          <div className="space-y-2">
            {selectedOption.features
              .filter((f) => (f as any).level == null || (f as any).level === level)
              .map((feature, idx) => {
                const optionFeatureChoices = featureChoices?.find((c) => c.featureName === feature.name);
                const selectedAnimal = selectedChoices?.[feature.name];
                const animalDesc = selectedAnimal ? getAnimalDescription(feature.description, selectedAnimal) : undefined;
                return (
                  <div key={idx} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                    <span className="text-sm font-medium text-gold/80">{feature.name}:</span>
                    <span className="text-xs text-parchment/70 ml-1 whitespace-pre-line">{feature.description}</span>
                    {optionFeatureChoices && (
                      <div className="mt-2">
                        <select
                          value={selectedAnimal || ""}
                          onChange={(e) => onChoiceChange?.(feature.name, e.target.value)}
                          onBlur={() => {}}
                          className="input w-full"
                        >
                           <option value="">Choose...</option>
                           {optionFeatureChoices.options.map((opt) => (
                             <option key={opt} value={opt}>{opt}</option>
                           ))}
                         </select>
                        {animalDesc && (
                          <p className="text-xs text-parchment/50 mt-1">{animalDesc}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function AsiStepInline({
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

function ExpertiseStepInline({
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
  if (className === "Rogue" && !options.includes("Thieves' Tools")) {
    options.push("Thieves' Tools");
  }

  return (
    <div className="space-y-3">
      {step.description && <p className="text-xs text-parchment/60">{step.description}</p>}
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

function SkillSelectionStepInline({
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
      {step.description && <p className="text-xs text-parchment/60">{step.description}</p>}
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

function SpellSlotsStepInline({ step }: { step: LevelUpStepSection }) {
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

function SpellSelectionStepInline({
  step,
  character,
  selected,
  onSelect,
}: {
  step: LevelUpStepSection;
  character: Character;
  selected: string[];
  onSelect: (names: string[]) => void;
}) {
  const classData = getStaticClass(character.class);
  const [activeTab, setActiveTab] = useState<string>("cantrips");

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
    const spellList = character.class === "Wizard" ? getStaticWizardSpells() : getStaticSpells();
    if (currentTab.level === 0) {
      return spellList.filter((s) => s.level === 0);
    }
    return spellList.filter((s) => s.level === currentTab!.level);
  }, [currentTab, character.class]);

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
