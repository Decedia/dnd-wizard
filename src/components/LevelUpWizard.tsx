"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { StepCard } from "./character-creator/StepCard";
import { WizardNav } from "./WizardNav";
import { ProgressIndicator } from "./character-creator/ProgressIndicator";
import {
  generateLevelUpSteps,
  sectionTitle,
  sectionIcon,
  normalizeDescription,
  type LevelUpStep,
  type LevelUpStepSection,
} from "@/lib/level-up";
import { getStaticClass, getStaticSubclasses, getStaticSpells } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, computeDerivedStats, SKILLS, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";
import { Dice, type DiceHandle, type DiceType } from "./Dice";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

type AsiMode = "single" | "double";
interface AsiState {
  mode?: AsiMode;
  single?: AbilityKey;
  d1?: AbilityKey;
  d2?: AbilityKey;
  confirmed?: boolean;
}

type Screen =
  | { kind: "hp"; level: number }
  | { kind: "asi"; level: number; section: LevelUpStepSection }
  | { kind: "section"; level: number; section: LevelUpStepSection };

interface LevelUpWizardProps {
  character: Character;
  onCancel: () => void;
  onComplete: (character: Character) => void;
}

export function LevelUpWizard({ character, onCancel, onComplete }: LevelUpWizardProps) {
  const classData = character.class ? getStaticClass(character.class) : undefined;
  const currentLevel = character.level || 1;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const diceType = `d${hitDie}` as DiceType;

  const [targetLevel, setTargetLevel] = useState(Math.min(20, currentLevel + 1));
  const [screenIndex, setScreenIndex] = useState(0);

  const [hpValues, setHpValues] = useState<Record<number, number>>({});
  const [asiState, setAsiState] = useState<Record<number, AsiState>>({});
  const [asiDismissedLevels, setAsiDismissedLevels] = useState<number[]>([]);

  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(character.featureSelections || {}).map(([k, v]) => [
        k,
        Array.isArray(v) ? v[0] || "" : v,
      ])
    )
  );
  const [expertiseSelections, setExpertiseSelections] = useState<Record<number, string[]>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});

  const generated: LevelUpStep[] = useMemo(
    () => generateLevelUpSteps(currentLevel, targetLevel, character.class, character.expertise, character.skills, false, subclassSelection || character.subclass),
    [currentLevel, targetLevel, character.class, character.expertise, character.skills, subclassSelection, character.subclass]
  );

  const screens: Screen[] = useMemo(() => {
    const hpScreens: Screen[] = generated
      .map((step) => step.level)
      .filter((lvl) => lvl !== 1)
      .map((lvl) => ({ kind: "hp" as const, level: lvl }));

    const detailScreens: Screen[] = generated.flatMap((step) =>
      step.sections
        .filter((s) => s.type !== "hp")
        .map((s) =>
          s.type === "asi"
            ? ({ kind: "asi" as const, level: step.level, section: s })
            : ({ kind: "section" as const, level: step.level, section: s })
        )
    );

    return [...hpScreens, ...detailScreens];
  }, [generated]);

  const screen = screens[screenIndex];
  const isLast = screenIndex === screens.length - 1;
  const isAsiScreen = screen?.kind === "asi";
  const hpCount = screens.filter((s) => s.kind === "hp").length;

  const setHp = (level: number, value: number) =>
    setHpValues((prev) => ({ ...prev, [level]: value }));

  const setAsi = (level: number, patch: Partial<AsiState>) =>
    setAsiState((prev) => ({ ...prev, [level]: { ...(prev[level] || {}), ...patch } }));

  const setExpertise = (level: number, list: string[]) =>
    setExpertiseSelections((prev) => ({ ...prev, [level]: list }));

  const setSpells = (level: number, list: string[]) =>
    setSpellSelections((prev) => ({ ...prev, [level]: list }));

  const cancelAsi = () => {
    if (!screen || screen.kind !== "asi") return;
    setAsiState((prev) => {
      const next = { ...prev };
      delete next[screen.level];
      return next;
    });
    setAsiDismissedLevels((prev) => [...prev, screen.level]);
  };

  const buildAllocation = (st?: AsiState): Record<AbilityKey, number> => {
    const alloc: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (!st) return alloc;
    if (st.mode === "single" && st.single) alloc[st.single] = 2;
    if (st.mode === "double") {
      if (st.d1) alloc[st.d1] = 1;
      if (st.d2) alloc[st.d2] = 1;
    }
    return alloc;
  };

  const baseScores = useCallback(
    (excludeLevel?: number): Record<AbilityKey, number> => {
      const base: Record<AbilityKey, number> = {
        str: character.str,
        dex: character.dex,
        con: character.con,
        int: character.int,
        wis: character.wis,
        cha: character.cha,
      };
      for (const [lvlStr, st] of Object.entries(asiState)) {
        const lvl = Number(lvlStr);
        if (!st.confirmed || lvl === excludeLevel) continue;
        const alloc = buildAllocation(st);
        (Object.keys(alloc) as AbilityKey[]).forEach((k) => (base[k] += alloc[k]));
      }
      return base;
    },
    [character, asiState]
  );

  const asiIsValid = (st?: AsiState): boolean => {
    if (!st || !st.mode) return false;
    if (st.mode === "single") return !!st.single;
    return !!st.d1 && !!st.d2 && st.d1 !== st.d2;
  };

  const canProceed = useCallback((): boolean => {
    if (!screen) return false;
    if (screen.kind === "hp") {
      const v = hpValues[screen.level];
      return !!v && v > 0;
    }
    if (screen.kind === "asi") {
      const st = asiState[screen.level];
      if (!st?.confirmed) return asiIsValid(st);
      return true;
    }
    const section = screen.section;
    if (section.type === "subclassSelection") return !!subclassSelection;
    if (section.type === "expertise") {
      const sel = expertiseSelections[screen.level] || [];
      return sel.length >= (section.expertiseCount || 0);
    }
    return true;
  }, [screen, hpValues, asiState, subclassSelection, expertiseSelections]);

  const handleNext = () => {
    if (!screen) return;
    if (isLast) {
      handleFinish();
      return;
    }
    if (screen.kind === "asi") {
      if (!asiState[screen.level]?.confirmed) {
        setAsi(screen.level, { confirmed: true });
        setAsiDismissedLevels((prev) => [...prev, screen.level]);
        return;
      }
      if (!asiDismissedLevels.includes(screen.level)) {
        setAsiDismissedLevels((prev) => [...prev, screen.level]);
        return;
      }
      setScreenIndex((s) => Math.min(screens.length - 1, s + 1));
      return;
    }
    setScreenIndex((s) => Math.min(screens.length - 1, s + 1));
  };

  const handleBack = () => {
    if (!screen) return;
    if (screen.kind === "asi") {
      setAsiState((prev) => {
        const next = { ...prev };
        delete next[screen.level];
        return next;
      });
      setAsiDismissedLevels((prev) => prev.filter((l) => l !== screen.level));
    }
    setScreenIndex((s) => Math.max(0, s - 1));
  };

  const handleFinish = () => {
    if (!classData) return;

    let draft: Character = {
      ...character,
      subclass: subclassSelection || character.subclass,
      featureSelections: Object.fromEntries(
        Object.entries(featureChoices).map(([k, v]) => [k, [v]])
      ),
    };

    const existingLevelHp =
      character.levelHp && Object.keys(character.levelHp).length > 0 ? character.levelHp : null;
    if (existingLevelHp) {
      const mergedLevelHp: Record<number, number> = { ...existingLevelHp };
      for (const [lvlStr, gain] of Object.entries(hpValues)) {
        const lvl = Number(lvlStr);
        mergedLevelHp[lvl] = (mergedLevelHp[lvl] || 0) + gain;
      }
      let sum = 0;
      for (const v of Object.values(mergedLevelHp)) sum += v;
      draft.levelHp = mergedLevelHp;
      draft.maxHp = sum;
    } else {
      let totalHp = 0;
      for (const v of Object.values(hpValues)) totalHp += v;
      draft.maxHp = (character.maxHp || 0) + totalHp;
    }
    draft.currentHp = draft.maxHp;

    for (const [lvlStr, st] of Object.entries(asiState)) {
      const lvl = Number(lvlStr);
      if (!st.confirmed) continue;
      draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
      const alloc = buildAllocation(st);
      for (const { key } of ABILITIES) {
        const add = alloc[key] || 0;
        if (add > 0) draft = { ...draft, [key]: ((draft[key] as number) || 0) + add };
      }
    }

    const allExpertise = new Set(character.expertise || []);
    for (const list of Object.values(expertiseSelections)) list.forEach((s) => allExpertise.add(s));
    draft.expertise = Array.from(allExpertise);

    const spells = [...(character.spells || [])];
    for (const list of Object.values(spellSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (!spells.some((s) => s.name === name && s.level === level)) {
          const spell = getStaticSpells().find((s) => s.name === name);
          spells.push({
            id: `spell-${name}-${level}`.replace(/\s+/g, "-"),
            name,
            level,
            source: "srd",
            srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
        }
      }
    }
    draft.spells = spells;

    draft.level = targetLevel;

    let finalChar = applySubclassFeatures(draft);
    finalChar = syncBaseFeatures(finalChar);
    finalChar = { ...finalChar, ...computeDerivedStats(finalChar) };

    onComplete(finalChar);
  };

  let nextLabel = "Next";
  let showBack = screenIndex > 0;
  if (screen) {
    if (screen.kind === "hp") nextLabel = "Confirm";
    else if (screen.kind === "asi") {
      const st = asiState[screen.level];
      nextLabel = st?.confirmed ? "Continue" : "Confirm ASI";
    } else if (isLast) nextLabel = "Finish Level Up";
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-40 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="text-xs font-semibold text-ink-muted hover:text-ink transition-colors">
              Cancel
            </button>
            <div className="text-xs font-semibold text-ink">Level Up</div>
            <div className="w-12" />
          </div>
          <div className="mt-2">
            <label className="field-label-light">
              Target Level
            </label>
            <div className="mt-1 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {Array.from({ length: 20 - currentLevel }, (_, i) => i + currentLevel + 1).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setTargetLevel(lvl);
                    setScreenIndex(0);
                    setHpValues({});
                    setAsiState({});
                    setExpertiseSelections({});
                    setSpellSelections({});
                  }}
                  className={`btn h-8 min-w-[2.25rem] px-2.5 text-xs rounded-full ${
                    lvl === targetLevel
                      ? "btn btn-primary"
                      : "btn btn-secondary"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-5 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={Math.min(screenIndex + 1, screens.length)} totalSteps={Math.max(1, screens.length)} />

          {screen ? (
            (() => {
              if (screen.kind === "hp") {
                const hpStepNumber = screens.slice(0, screenIndex + 1).filter((s) => s.kind === "hp").length;
                return (
                  <StepCard title={`Level ${screen.level} HP`} hint={`Roll, take the average, or enter your hit die result for level ${screen.level}.`}>
                    <div className="space-y-3">
                      <div className="text-[11px] text-ink-muted font-medium">
                        Level {screen.level} HP — Step {hpStepNumber} of {hpCount}
                      </div>

                      <HpStep
                        level={screen.level}
                        hitDie={hitDie}
                        diceType={diceType}
                        conMod={conMod}
                        averageHp={averageHp}
                        value={hpValues[screen.level] || 0}
                        onChange={(v) => setHp(screen.level, v)}
                      />
                    </div>
                  </StepCard>
                );
              }

              if (screen.kind === "asi") {
                const st = asiState[screen.level] || {};
                const isConfirmed = !!st.confirmed;
                return (
                  <StepCard
                    title={`Level ${screen.level} — Ability Score Improvement`}
                    hint="A popup is open to assign your Ability Score Improvement."
                  >
                    {isConfirmed ? (
                      <div className="text-center text-xs font-semibold text-ink bg-paper py-2 surface">
                        ✓ {ABILITIES.filter(({ key }) => (buildAllocation(st)[key] || 0) > 0).map(({ full, key }) => `${full} increased to ${(character as any)[key] + buildAllocation(st)[key]}`).join(", ")}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsiDismissedLevels((prev) => prev.filter((l) => l !== screen.level))}
                        className="btn btn-secondary w-full p-3.5 text-center text-xs"
                      >
                        Complete your Ability Score Improvement
                      </button>
                    )}
                  </StepCard>
                );
              }

              return (
                <StepCard title={sectionTitle(screen.section.type) || "Level Up"} hint={screen.section.description}>
                  <div className="space-y-4">
                    <SectionRenderer
                      section={screen.section}
                      character={character}
                      subclassSelection={subclassSelection}
                      onSubclassSelect={setSubclassSelection}
                      featureChoices={featureChoices}
                      onFeatureChoice={(name, value) => setFeatureChoices((prev) => ({ ...prev, [name]: value }))}
                      expertise={expertiseSelections[screen.level] || character.expertise || []}
                      onExpertiseChange={(list) => setExpertise(screen.level, list)}
                      spells={spellSelections[screen.level] || []}
                      onSpellsChange={(list) => setSpells(screen.level, list)}
                    />
                  </div>
                </StepCard>
              );
            })()
          ) : (
            <StepCard title="No Levels">
              <p className="text-xs text-ink-muted font-medium">Choose a target level above to begin leveling up.</p>
            </StepCard>
          )}
        </div>
      </main>

      {!isAsiScreen && (
        <WizardNav
          onBack={handleBack}
          onNext={handleNext}
          backLabel="Back"
          nextLabel={nextLabel}
          canProceed={canProceed()}
          showBack={showBack}
        />
      )}

      {isAsiScreen && screen && !asiDismissedLevels.includes(screen.level) && (() => {
        const lvl = screen.level;
        const st = asiState[lvl] || {};
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/5 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-paper">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs font-semibold text-ink">
                  Level {lvl} — Ability Score Improvement
                </div>
                <button
                  type="button"
                  onClick={cancelAsi}
                  className="text-lg leading-none text-ink-muted hover:text-ink transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto px-4 py-3.5">
                <AsiStep
                  level={lvl}
                  state={st}
                  baseScores={baseScores(lvl)}
                  onChange={(patch) => setAsi(lvl, patch)}
                />
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={cancelAsi}
                  className="btn btn-secondary px-4 py-2 text-xs rounded-full"
                >
                  Cancel
                </button>
                {st.confirmed ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary px-4 py-2 text-xs rounded-full"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!asiIsValid(st)}
                    onClick={handleNext}
                    className="btn-primary px-4 py-2 text-xs rounded-full disabled:opacity-40"
                  >
                    Confirm ASI
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function HpStep({
  level,
  hitDie,
  diceType,
  conMod,
  averageHp,
  value,
  onChange,
}: {
  level: number;
  hitDie: number;
  diceType: DiceType;
  conMod: number;
  averageHp: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const diceRef = useRef<DiceHandle>(null);
  const setValue = (v: number) => {
    if (Number.isNaN(v)) return;
    onChange(Math.max(1, Math.round(v)));
  };

  return (
    <div className="space-y-4">
      <div className="card px-3 py-3 text-center">
        <div className="field-label-light">Hit Die</div>
        <div className="text-xl font-display font-bold text-ink bg-paper px-3 py-1 rounded-md inline-block">d{hitDie}</div>
        <div className="text-[11px] text-ink-muted font-medium mt-1">
          Roll the die, add your CON modifier ({conMod >= 0 ? `+${conMod}` : conMod}).
        </div>
      </div>

      <div className="flex justify-center">
        <Dice ref={diceRef} type={diceType} size={84} onRoll={(result) => setValue(result + conMod)} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setValue(averageHp)}
          className="btn btn-secondary px-3 py-2 text-xs"
        >
          Take Average ({averageHp})
        </button>

        <label className="field-label-light">
          Manual (rolled die + CON)
        </label>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => setValue(parseInt(e.target.value || "0", 10))}
          className="input w-full text-center text-lg font-bold"
          placeholder={String(averageHp)}
        />
      </div>

      {value > 0 && (
        <div className="card px-3 py-2 text-center text-xs">
          <span className="text-ink-muted font-medium">HP gained at level {level}: </span>
          <span className="text-ink font-bold bg-paper px-2 py-0.5 rounded-md">{value}</span>
        </div>
      )}
    </div>
  );
}

function AsiStep({
  level,
  state,
  baseScores,
  onChange,
}: {
  level: number;
  state: AsiState;
  baseScores: Record<AbilityKey, number>;
  onChange: (patch: Partial<AsiState>) => void;
}) {
  const alloc = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } as Record<AbilityKey, number>;
  if (state.mode === "single" && state.single) alloc[state.single] = 2;
  if (state.mode === "double") {
    if (state.d1) alloc[state.d1] = 1;
    if (state.d2) alloc[state.d2] = 1;
  }

  if (state.confirmed) {
    const changes = (Object.keys(alloc) as AbilityKey[]).filter((k) => alloc[k] > 0);
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-ink-muted font-medium">
          You can increase one ability score by 2, or two ability scores by 1 each. These changes apply
          permanently when you confirm.
        </p>
        <div className="card px-3 py-3 space-y-1">
          {changes.map((k) => {
            const ab = ABILITIES.find((a) => a.key === k)!;
            return (
              <div key={k} className="text-xs font-medium text-ink">
                <span className="font-semibold">{ab.full}</span>{" "}
                <span className="text-ink-muted">
                  {baseScores[k]} → <span className="text-ink font-bold bg-paper px-1 rounded">{baseScores[k] + alloc[k]}</span>
                </span>
              </div>
            );
          })}
          <div className="pt-1 text-xs font-bold text-ink bg-paper px-2 py-1 rounded-md inline-block">
            {changes.map((k) => ABILITIES.find((a) => a.key === k)!.full).join(" and ")} increased!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-ink-muted font-medium">
        You can increase one ability score by 2, or two ability scores by 1 each. These changes apply
        permanently when you confirm.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ mode: "single", single: undefined, d1: undefined, d2: undefined })}
          className={`btn ${state.mode === "single" ? "btn btn-primary" : "btn btn-secondary"}`}
        >
          +2 to one ability
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "double", single: undefined, d1: undefined, d2: undefined })}
          className={`btn ${state.mode === "double" ? "btn btn-primary" : "btn btn-secondary"}`}
        >
          +1 to two abilities
        </button>
      </div>

      {state.mode === "single" && (
        <div className="space-y-2">
          <div className="field-label-light">Choose ability</div>
          <select
            value={state.single || ""}
            onChange={(e) => onChange({ single: (e.target.value || undefined) as AbilityKey | undefined })}
            className="input w-full"
          >
            <option value="">Select…</option>
            {ABILITIES.map(({ key, label, full }) => {
              const atCap = baseScores[key] + 2 > 20;
              return (
                <option key={key} value={key} disabled={atCap}>
                  {label} — {full} ({baseScores[key]} → {baseScores[key] + 2})
                  {atCap ? " (max)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {state.mode === "double" && (
        <div className="space-y-3">
          <AbilitySelect
            label="First ability (+1)"
            value={state.d1}
            exclude={state.d2}
            baseScores={baseScores}
            onChange={(v) => onChange({ d1: v })}
          />
          <AbilitySelect
            label="Second ability (+1)"
            value={state.d2}
            exclude={state.d1}
            baseScores={baseScores}
            onChange={(v) => onChange({ d2: v })}
          />
        </div>
      )}
    </div>
  );
}

function AbilitySelect({
  label,
  value,
  exclude,
  baseScores,
  onChange,
}: {
  label: string;
  value?: AbilityKey;
  exclude?: AbilityKey;
  baseScores: Record<AbilityKey, number>;
  onChange: (v: AbilityKey | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="field-label-light">{label}</div>
      <select
        value={value || ""}
        onChange={(e) => onChange((e.target.value || undefined) as AbilityKey | undefined)}
        className="input w-full"
      >
        <option value="">Select…</option>
        {ABILITIES.map(({ key, label: lbl, full }) => {
          const atCap = baseScores[key] + 1 > 20;
          const disabled = atCap || key === exclude;
          return (
            <option key={key} value={key} disabled={disabled}>
              {lbl} — {full} ({baseScores[key]} → {baseScores[key] + 1})
              {atCap ? " (max)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function SectionRenderer({
  section,
  character,
  subclassSelection,
  onSubclassSelect,
  featureChoices,
  onFeatureChoice,
  expertise,
  onExpertiseChange,
  spells,
  onSpellsChange,
}: {
  section: LevelUpStepSection;
  character: Character;
  subclassSelection: string;
  onSubclassSelect: (name: string) => void;
  featureChoices: Record<string, string>;
  onFeatureChoice: (name: string, value: string) => void;
  expertise: string[];
  onExpertiseChange: (list: string[]) => void;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
}) {
  const header = (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-70">{sectionIcon(section.type)}</span>
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink">
        {sectionTitle(section.type)}
      </div>
    </div>
  );

  if (section.type === "subclassSelection" && section.subclassOptions) {
    return (
      <div className="space-y-2.5">
        {header}
        <div className="space-y-2">
          {section.subclassOptions.map((opt) => {
            const isSel = subclassSelection === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSubclassSelect(opt.name)}
                className={`btn w-full p-2.5 text-left rounded-xl border ${
                  isSel
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink border-border-muted"
                }`}
              >
                <div className="text-xs font-semibold text-ink">{opt.name}</div>
                {opt.description && (
                  <p className="mt-0.5 text-[10px] text-ink-muted whitespace-pre-line leading-relaxed font-medium">{opt.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "features") {
    return (
      <div className="space-y-2.5">
        {header}
        <div className="space-y-2.5">
          {section.features?.map((f, i) => (
            <div key={i} className="card p-2.5">
              <div className="text-xs font-semibold text-ink bg-paper px-2 py-0.5 rounded-md inline-block tracking-wide">{f.name}</div>
              <p className="mt-1 text-[11px] text-ink-muted leading-relaxed whitespace-pre-line font-medium">{f.description}</p>
              {section.featureChoices
                ?.filter((fc) => fc.featureName === f.name)
                .map((fc) => (
                  <div key={fc.featureName} className="mt-2">
                    <div className="field-label-light">Choose</div>
                    <div className="mt-1 grid grid-cols-1 gap-1.5">
                      {fc.options.map((opt) => {
                        const isSel = (featureChoices[fc.storageKey || fc.featureName] || "") === opt;
                        return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onFeatureChoice(fc.storageKey || fc.featureName, opt)}
                        className={`btn w-full px-2.5 py-1.5 text-left rounded-xl border ${
                          isSel ? "bg-ink text-white border-ink" : "bg-white text-ink border-border-muted"
                        }`}
                      >
                        <div className="text-[11px] font-semibold text-ink">{opt}</div>
                        {fc.descriptions?.[opt] && (
                          <div className="text-[10px] text-ink-muted mt-0.5 leading-relaxed font-medium">{fc.descriptions[opt]}</div>
                        )}
                      </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "expertise") {
    const count = section.expertiseCount || 0;
    const toggle = (skill: string) => {
      if (expertise.includes(skill)) onExpertiseChange(expertise.filter((s) => s !== skill));
      else if (expertise.length < count) onExpertiseChange([...expertise, skill]);
    };
    return (
      <div className="space-y-2.5">
        {header}
        <p className="text-[11px] text-ink-muted font-medium">Choose {count} skill{count !== 1 ? "s" : ""} to gain expertise (double proficiency).</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SKILLS.map((s) => {
            const isSel = expertise.includes(s.name);
            const disabled = !isSel && expertise.length >= count;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => toggle(s.name)}
                disabled={disabled}
                className={`btn px-2 py-1.5 text-left text-[11px] rounded-xl border ${
                  isSel ? "bg-ink text-white border-ink" : disabled ? "bg-white text-ink border-border-muted opacity-50" : "bg-white text-ink border-border-muted"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "spellSlots") {
    return (
      <div className="space-y-2.5">
        {header}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(section.spellSlots || {}).map(([lvl, n]) => (
            <span key={lvl} className="badge-light text-ink bg-paper-muted">
              Level {lvl}: {n} slots
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "spellSelection") {
    const maxLevel = section.spellSelectionMaxLevel || 9;
    const available = getStaticSpells().filter((s) => s.classes?.includes(character.class) && (s.level === 0 || s.level <= maxLevel));
    const count = section.spellSelectionCount || 0;
    const cantripCount = section.cantripSelectionCount || 0;
    const toggle = (name: string, level: number) => {
      if (spells.some((s) => s === `${name}:${level}`)) {
        onSpellsChange(spells.filter((s) => s !== `${name}:${level}`));
      } else {
        if (level === 0) {
          const currentCantrips = spells.filter((s) => s.endsWith(":0")).length;
          if (currentCantrips < cantripCount) onSpellsChange([...spells, `${name}:${level}`]);
        } else {
          const currentSpells = spells.filter((s) => !s.endsWith(":0")).length;
          if (currentSpells < count) onSpellsChange([...spells, `${name}:${level}`]);
        }
      }
    };
    const cantrips = available.filter((s) => s.level === 0);
    const levelSpells = available.filter((s) => s.level > 0);
    return (
      <div className="space-y-2.5">
        {header}
        <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
          You may add up to {count} spell{count !== 1 ? "s" : ""}{cantripCount > 0 ? ` and ${cantripCount} cantrip${cantripCount !== 1 ? "s" : ""}` : ""}. (Optional)
        </p>
        {cantripCount > 0 && cantrips.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Cantrips</div>
            <div className="max-h-32 overflow-y-auto space-y-1.5">
              {cantrips.map((sp) => {
                const isSel = spells.includes(`${sp.name}:0`);
                const currentCantrips = spells.filter((s) => s.endsWith(":0")).length;
                const disabled = !isSel && currentCantrips >= cantripCount;
                return (
                  <button
                    key={sp.name}
                    type="button"
                    onClick={() => toggle(sp.name, 0)}
                    disabled={disabled}
                    className={`btn w-full px-2.5 py-1.5 text-left text-[11px] rounded-xl border ${
                      isSel ? "btn-primary" : disabled ? "btn-secondary opacity-50" : "btn-secondary"
                    }`}
                  >
                    {sp.name} <span className="text-[var(--color-text-muted)] font-medium">{sp.school}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {count > 0 && levelSpells.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Spells</div>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {levelSpells.map((sp) => {
                const isSel = spells.includes(`${sp.name}:${sp.level}`);
                const currentSpells = spells.filter((s) => !s.endsWith(":0")).length;
                const disabled = !isSel && currentSpells >= count;
                return (
                  <button
                    key={sp.name}
                    type="button"
                    onClick={() => toggle(sp.name, sp.level)}
                    disabled={disabled}
                    className={`btn w-full px-2.5 py-1.5 text-left text-[11px] rounded-xl border ${
                      isSel ? "btn-primary" : disabled ? "btn-secondary opacity-50" : "btn-secondary"
                    }`}
                  >
                    {sp.name} <span className="text-[var(--color-text-muted)] font-medium">Lv {sp.level}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
