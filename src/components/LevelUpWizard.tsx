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

  // accumulated hp gains per level (total including CON)
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

  // BUG 1: Level 1 HP is never part of leveling up (it is always the fixed
  // hitDie max + CON set automatically). HP screens are only for levels 2..N.
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

  // --- ASI helpers ---
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

  // --- Navigation ---
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
    // section
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

    // HP — record each level's gain into levelHp and derive maxHp from it.
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

    // ASI
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

    // Expertise
    const allExpertise = new Set(character.expertise || []);
    for (const list of Object.values(expertiseSelections)) list.forEach((s) => allExpertise.add(s));
    draft.expertise = Array.from(allExpertise);

    // Spells
    const spells = [...(character.spells || [])];
    for (const list of Object.values(spellSelections)) {
      for (const name of list) {
        if (!spells.some((s) => s.name === name)) {
          const spell = getStaticSpells().find((s) => s.name === name);
          spells.push({
            id: `spell-${name}`.replace(/\s+/g, "-"),
            name,
            level: spell?.level ?? 1,
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

  // --- Next/back button labels ---
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
    <div className="min-h-screen bg-charcoal">
      <div className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="text-sm text-parchment/70 hover:text-parchment">
              Cancel
            </button>
            <div className="text-sm font-semibold text-parchment">Level Up</div>
            <div className="w-12" />
          </div>
          <div className="mt-2">
            <label className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">
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
                  className={`h-9 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold transition-all ${
                    lvl === targetLevel
                      ? "bg-accent text-white"
                      : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-6 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={Math.min(screenIndex + 1, screens.length)} totalSteps={Math.max(1, screens.length)} />

          {screen ? (
            (() => {
              if (screen.kind === "hp") {
                const hpStepNumber = screens.slice(0, screenIndex + 1).filter((s) => s.kind === "hp").length;
                return (
                  <StepCard title={`Level ${screen.level} HP`} hint={`Roll, take the average, or enter your hit die result for level ${screen.level}.`}>
                    <div className="space-y-4">
                      <div className="text-xs text-parchment/60 font-medium">
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
                      <div className="text-center text-sm text-green-400">
                        ✓ {ABILITIES.filter(({ key }) => (buildAllocation(st)[key] || 0) > 0).map(({ full, key }) => `${full} increased to ${(character as any)[key] + buildAllocation(st)[key]}`).join(", ")}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsiDismissedLevels((prev) => prev.filter((l) => l !== screen.level))}
                        className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-center text-xs text-parchment/70 w-full"
                      >
                        Complete your Ability Score Improvement
                      </button>
                    )}
                  </StepCard>
                );
              }

              // generic section
              return (
                <StepCard title={sectionTitle(screen.section.type) || "Level Up"} hint={screen.section.description}>
                  <div className="space-y-5">
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
              <p className="text-sm text-parchment/60">Choose a target level above to begin leveling up.</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-charcoal shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-parchment">
                  Level {lvl} — Ability Score Improvement
                </div>
                <button
                  type="button"
                  onClick={cancelAsi}
                  className="text-xl leading-none text-parchment/60 hover:text-parchment"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto px-4 py-4">
                <AsiStep
                  level={lvl}
                  state={st}
                  baseScores={baseScores(lvl)}
                  onChange={(patch) => setAsi(lvl, patch)}
                />
              </div>
              <div className="flex justify-between border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={cancelAsi}
                  className="rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-parchment hover:border-accent/40"
                >
                  Cancel
                </button>
                {st.confirmed ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark active:scale-[0.98]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!asiIsValid(st)}
                    onClick={handleNext}
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
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
      <div className="rounded-lg border border-border bg-charcoal/30 px-3 py-3 text-center">
        <div className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">Hit Die</div>
        <div className="text-2xl font-display font-bold text-accent">d{hitDie}</div>
        <div className="text-[11px] text-parchment/60 mt-1">
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
          className="rounded-lg border border-border bg-charcoal/40 px-3 py-2.5 text-sm font-semibold text-parchment hover:border-accent/40"
        >
          Take Average ({averageHp})
        </button>

        <label className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">
          Manual (rolled die + CON)
        </label>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => setValue(parseInt(e.target.value || "0", 10))}
          className="input w-full text-center text-lg font-semibold"
          placeholder={String(averageHp)}
        />
      </div>

      {value > 0 && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-center text-sm">
          <span className="text-parchment/70">HP gained at level {level}: </span>
          <span className="text-accent font-bold">{value}</span>
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
        <p className="text-xs text-parchment/70">
          You can increase one ability score by 2, or two ability scores by 1 each. These changes apply
          permanently when you confirm.
        </p>
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-3 space-y-1">
          {changes.map((k) => {
            const ab = ABILITIES.find((a) => a.key === k)!;
            return (
              <div key={k} className="text-sm">
                <span className="text-parchment/80">{ab.full}</span>{" "}
                <span className="text-parchment/50">
                  {baseScores[k]} → <span className="text-accent font-bold">{baseScores[k] + alloc[k]}</span>
                </span>
              </div>
            );
          })}
          <div className="pt-1 text-sm font-semibold text-accent">
            {changes.map((k) => ABILITIES.find((a) => a.key === k)!.full).join(" and ")} increased!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-parchment/70">
        You can increase one ability score by 2, or two ability scores by 1 each. These changes apply
        permanently when you confirm.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ mode: "single", single: undefined, d1: undefined, d2: undefined })}
          className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-all ${
            state.mode === "single" ? "border-accent bg-accent/10 text-parchment" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
          }`}
        >
          +2 to one ability
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "double", single: undefined, d1: undefined, d2: undefined })}
          className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-all ${
            state.mode === "double" ? "border-accent bg-accent/10 text-parchment" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
          }`}
        >
          +1 to two abilities
        </button>
      </div>

      {state.mode === "single" && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">Choose ability</div>
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
      <div className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">{label}</div>
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
      <span className="text-base">{sectionIcon(section.type)}</span>
      <div className="text-xs font-semibold uppercase tracking-wider text-accent">
        {sectionTitle(section.type)}
      </div>
    </div>
  );

  if (section.type === "subclassSelection" && section.subclassOptions) {
    return (
      <div className="space-y-3">
        {header}
        <div className="space-y-2">
          {section.subclassOptions.map((opt) => {
            const isSel = subclassSelection === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSubclassSelect(opt.name)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  isSel ? "border-accent bg-accent/10" : "border-border bg-charcoal/40 hover:border-accent/30"
                }`}
              >
                <div className="text-sm font-semibold text-parchment">{opt.name}</div>
                {opt.description && (
                  <p className="mt-1 text-[11px] text-parchment/70 whitespace-pre-line leading-relaxed">{opt.description}</p>
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
      <div className="space-y-3">
        {header}
        <div className="space-y-3">
          {section.features?.map((f, i) => (
            <div key={i} className="rounded-lg border border-border bg-charcoal/30 p-3">
              <div className="text-sm font-bold text-accent tracking-wide">{f.name}</div>
              <p className="mt-1 text-xs text-parchment/80 leading-relaxed whitespace-pre-line">{f.description}</p>
              {section.featureChoices
                ?.filter((fc) => fc.featureName === f.name)
                .map((fc) => (
                  <div key={fc.featureName} className="mt-2">
                    <div className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">Choose</div>
                    <div className="mt-1 grid grid-cols-1 gap-1.5">
                      {fc.options.map((opt) => {
                        const isSel = (featureChoices[fc.storageKey || fc.featureName] || "") === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onFeatureChoice(fc.storageKey || fc.featureName, opt)}
                            className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                              isSel ? "border-accent/40 bg-accent/10 text-parchment" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
                            }`}
                          >
                            {opt}
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
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">Choose {count} skill{count !== 1 ? "s" : ""} to gain expertise (double proficiency).</p>
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
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                  isSel ? "border-accent/40 bg-accent/10 text-parchment" : disabled ? "border-border bg-charcoal/40 opacity-50" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
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
      <div className="space-y-3">
        {header}
        <div className="flex flex-wrap gap-2">
          {Object.entries(section.spellSlots || {}).map(([lvl, n]) => (
            <span key={lvl} className="rounded-full border border-border bg-charcoal/40 px-3 py-1 text-xs text-parchment/80">
              Level {lvl}: {n} slots
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "spellSelection") {
    const available = getStaticSpells().filter((s) => s.classes?.includes(character.class));
    const count = section.spellSelectionCount || 0;
    const toggle = (name: string) => {
      if (spells.includes(name)) onSpellsChange(spells.filter((s) => s !== name));
      else if (spells.length < count) onSpellsChange([...spells, name]);
    };
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">You may add up to {count} spell{count !== 1 ? "s" : ""}. (Optional)</p>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {available.map((sp) => {
            const isSel = spells.includes(sp.name);
            const disabled = !isSel && spells.length >= count;
            return (
              <button
                key={sp.name}
                type="button"
                onClick={() => toggle(sp.name)}
                disabled={disabled}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                  isSel ? "border-accent/40 bg-accent/10 text-parchment" : disabled ? "border-border bg-charcoal/40 opacity-50" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
                }`}
              >
                {sp.name} <span className="text-parchment/40">Lv {sp.level}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
