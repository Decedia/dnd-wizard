"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/character-sheet/SectionCard";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import {
  generateLevelUpSteps,
  type LevelUpStep,
  type LevelUpStepSection,
} from "@/lib/level-up";

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
  const [subclassChoice, setSubclassChoice] = useState<string | null>(null);
  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<string, string>>({});
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>({});
  const [expertiseChoices, setExpertiseChoices] = useState<Record<number, string[]>>({});
  const [selectedSpells, setSelectedSpells] = useState<Record<number, string[]>>({});
  const [skillChoices, setSkillChoices] = useState<Record<number, string[]>>({});

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
      character.skills || {},
      false,
      character.subclass
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
        case "subclass":
          if (!subclassChoice) return false;
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
  }, [currentStep, hpGains, subclassChoice, expertiseChoices, selectedSpells, skillChoices, totalAsiAllocated]);

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

    if (subclassChoice && !character.subclass) {
      patch.subclass = subclassChoice;
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
  }, [character, newLevel, hpGains, subclassChoice, asiChoices, expertiseChoices, selectedSpells, router, id]);

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
            <div key={section.type} className="space-y-4">
              <p className="text-sm text-parchment/60">{section.description}</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="number"
                    value={hpGains[currentStep?.level ?? 0] || ""}
                    onChange={(e) => updateHp(currentStep?.level ?? 0, Number(e.target.value) || 0)}
                    className="input w-24 text-center"
                    placeholder="HP"
                    min={1}
                  />
                  <span className="text-xs text-text-muted">HP Gain</span>
                </div>
              </div>
            </div>
          );

        case "features":
          return (
            <div key={section.type} className="space-y-3">
              {section.features?.map((feature, i) => (
                <div key={i} className="rounded-lg border border-border bg-charcoal/40 p-3">
                  <h4 className="text-sm font-medium text-parchment/80">{feature.name}</h4>
                  <p className="text-xs text-parchment/50 mt-1 whitespace-pre-line">{feature.description}</p>
                </div>
              ))}
              {section.featureChoices?.map((choice, i) => (
                <div key={`choice-${i}`} className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
                  <p className="text-xs font-medium text-accent">{choice.featureName}</p>
                  <p className="text-xs text-parchment/50">
                    {choice.optional ? "Optionally choose" : "Choose"} one
                    {choice.tigerSkillCount ? ` and ${choice.tigerSkillCount} skills` : ""}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {choice.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setFeatureChoices((prev) => ({ ...prev, [choice.featureName]: opt }))
                        }
                        className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                          featureChoices[choice.featureName] === opt
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-border bg-charcoal/40 text-parchment/60 hover:border-accent/30"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {choice.tigerSkillOptions && choice.tigerSkillCount && featureChoices[choice.featureName] === "Tiger" && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-parchment/50">Choose {choice.tigerSkillCount} skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {choice.tigerSkillOptions.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className="rounded-md border border-border bg-charcoal/40 px-2 py-0.5 text-xs text-parchment/60 hover:border-accent/30"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

        case "subclass":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              {section.subclassOptions?.map((sub) => {
                const isSelected = subclassChoice === sub.name;
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => setSubclassChoice(sub.name)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-charcoal/40 hover:border-accent/30"
                    }`}
                  >
                    <span className="text-sm font-medium text-parchment/80">{sub.name}</span>
                    {sub.description && (
                      <p className="text-xs text-parchment/50 mt-1">{sub.description}</p>
                    )}
                    {sub.features.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sub.features.map((f, i) => (
                          <div key={i} className="text-xs text-parchment/40">
                            <span className="font-medium text-parchment/60">{f.name}:</span>{" "}
                            {f.description.slice(0, 100)}
                            {f.description.length > 100 ? "..." : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
              {section.subclassFeatureChoices?.map((choice, i) => (
                <div key={`sub-choice-${i}`} className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
                  <p className="text-xs font-medium text-accent">{choice.featureName}</p>
                  <p className="text-xs text-parchment/50">Choose one:</p>
                  <div className="flex flex-wrap gap-2">
                    {choice.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setSubclassFeatureChoices((prev) => ({ ...prev, [choice.featureName]: opt }))
                        }
                        className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                          subclassFeatureChoices[choice.featureName] === opt
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-border bg-charcoal/40 text-parchment/60 hover:border-accent/30"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );

        case "subclassInfo":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              {section.subclassInfo && (
                <div className="rounded-lg border border-border bg-charcoal/40 p-3">
                  <h4 className="text-sm font-medium text-parchment/80">{section.subclassInfo.name}</h4>
                  {section.subclassInfo.description && (
                    <p className="text-xs text-parchment/50 mt-1">{section.subclassInfo.description}</p>
                  )}
                  {section.subclassInfo.features.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {section.subclassInfo.features.map((f, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium text-parchment/70">{f.name}:</span>{" "}
                          <span className="text-parchment/50">{f.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case "asi":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
                const currentAllocation = (asiChoices[currentStep?.level ?? 0] || []).find(
                  (c) => c.ability === ability
                );
                const currentValue = currentAllocation?.delta || 0;
                const baseScore = character?.[ability as keyof Character] as number;
                const newScore = baseScore + currentValue;

                return (
                  <div
                    key={ability}
                    className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-parchment/80 w-12">
                      {ability.toUpperCase()}
                    </span>
                    <span className="text-sm text-parchment/60">{baseScore}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateAsi(currentStep?.level ?? 0, ability, -1)}
                        disabled={currentValue <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold text-accent w-6 text-center">
                        {currentValue}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateAsi(currentStep?.level ?? 0, ability, 1)}
                        disabled={
                          totalAsiAllocated(currentStep?.level ?? 0) >= 2 || newScore >= 20
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-parchment w-8 text-right">
                      {newScore}
                    </span>
                  </div>
                );
              })}
            </div>
          );

        case "expertise":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              {Object.entries(character?.skills || {})
                .filter(([, proficient]) => proficient)
                .map(([name]) => {
                  const isSelected = (expertiseChoices[currentStep?.level ?? 0] || []).includes(name);
                  const isDisabled =
                    !isSelected &&
                    (expertiseChoices[currentStep?.level ?? 0] || []).length >=
                      (section.expertiseCount || 2);

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
                          setExpertiseChoices((prev) => {
                            const current = prev[currentStep?.level ?? 0] || [];
                            if (isSelected) {
                              return {
                                ...prev,
                                [currentStep?.level ?? 0]: current.filter((n) => n !== name),
                              };
                            } else if (current.length < (section.expertiseCount || 2)) {
                              return {
                                ...prev,
                                [currentStep?.level ?? 0]: [...current, name],
                              };
                            }
                            return prev;
                          });
                        }}
                        disabled={isDisabled}
                        className="h-4 w-4 rounded border-border bg-charcoal text-accent focus:ring-accent/50 disabled:opacity-30"
                      />
                      <span className="text-sm text-parchment/80">{name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded ml-auto">
                          EXPERTISE
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>
          );

        case "spellSlots":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">Your new spell slots:</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(section.spellSlots || {}).map(([level, count]) => (
                  <div
                    key={level}
                    className="flex flex-col items-center rounded-lg border border-border bg-charcoal/40 p-2"
                  >
                    <span className="text-xs text-parchment/50">Lvl {level}</span>
                    <span className="text-lg font-bold text-accent">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );

        case "spellSelection":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              {getStaticSpells()
                .filter((s) => s.classes?.includes(character?.class || ""))
                .map((spell) => {
                  const isSelected = (selectedSpells[currentStep?.level ?? 0] || []).includes(
                    spell.name
                  );
                  return (
                    <button
                      key={spell.name}
                      type="button"
                      onClick={() => {
                        setSelectedSpells((prev) => {
                          const current = prev[currentStep?.level ?? 0] || [];
                          if (isSelected) {
                            return {
                              ...prev,
                              [currentStep?.level ?? 0]: current.filter((s) => s !== spell.name),
                            };
                          } else {
                            return {
                              ...prev,
                              [currentStep?.level ?? 0]: [...current, spell.name],
                            };
                          }
                        });
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

        case "skillSelection":
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-sm text-parchment/60">{section.description}</p>
              <div className="flex flex-wrap gap-2">
                {section.skillOptions?.map((skill) => {
                  const isSelected = (skillChoices[currentStep?.level ?? 0] || []).includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSkillChoices((prev) => {
                          const current = prev[currentStep?.level ?? 0] || [];
                          if (isSelected) {
                            return {
                              ...prev,
                              [currentStep?.level ?? 0]: current.filter((s) => s !== skill),
                            };
                          } else if (current.length < (section.skillSelectionCount || 1)) {
                            return {
                              ...prev,
                              [currentStep?.level ?? 0]: [...current, skill],
                            };
                          }
                          return prev;
                        });
                      }}
                      className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-border bg-charcoal/40 text-parchment/60 hover:border-accent/30"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [
      currentStep,
      character,
      hpGains,
      subclassChoice,
      subclassFeatureChoices,
      featureChoices,
      asiChoices,
      expertiseChoices,
      selectedSpells,
      skillChoices,
      updateHp,
      updateAsi,
      totalAsiAllocated,
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
          {/* Level Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setLevelTab(index)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    index === levelTab
                      ? "bg-accent text-white"
                      : "bg-charcoal-light text-parchment/60 hover:bg-charcoal-lighter"
                  }`}
                >
                  Level {step.level}
                </button>
              ))}
            </div>
          </div>

          {/* Current Level Content */}
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

      {/* Navigation */}
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
              {isLastTab ? "Finish Level Up" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function sectionTitle(type: LevelUpStepSection["type"]): string {
  switch (type) {
    case "hp":
      return "Hit Points";
    case "features":
      return "New Features";
    case "subclass":
      return "Choose Subclass";
    case "subclassInfo":
      return "Subclass Features";
    case "asi":
      return "Ability Score Improvement";
    case "expertise":
      return "Expertise";
    case "spellSlots":
      return "Spell Slots";
    case "spellSelection":
      return "Spell Selection";
    case "skillSelection":
      return "Skill Selection";
    default:
      return "";
  }
}

function sectionIcon(type: LevelUpStepSection["type"]): string {
  switch (type) {
    case "hp":
      return "❤️";
    case "features":
      return "⚡";
    case "subclass":
      return "👑";
    case "subclassInfo":
      return "📜";
    case "asi":
      return "📊";
    case "expertise":
      return "🎯";
    case "spellSlots":
      return "✨";
    case "spellSelection":
      return "🔮";
    case "skillSelection":
      return "🛡️";
    default:
      return "📋";
  }
}
