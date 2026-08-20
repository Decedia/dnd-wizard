"use client";

import { useState, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getModifier, getRaceData } from "@/lib/storage";
import { getClassData } from "@/data/srd";

interface StepAbilityScoresProps {
  data: {
    abilityScores: {
      str: number;
      dex: number;
      con: number;
      int: number;
      wis: number;
      cha: number;
    };
    abilityMethod: "standard" | "pointbuy" | "diceroll";
    race?: string;
    class?: string;
    savingThrows: Record<string, { proficient: boolean; value: number }>;
    proficiencyBonus: number;
    initiative: number;
  };
  onChange: (data: Partial<StepAbilityScoresProps["data"]>) => void;
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITIES = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
] as const;

const POINT_BUY_COSTS: Record<number, number> = {
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

function getRacialBonus(race: string | undefined, ability: string): number {
  if (!race) return 0;
  const raceData = getRaceData(race);
  return raceData?.abilityScoreIncreases[ability] ?? 0;
}

function getFinalScore(baseScore: number, race: string | undefined, ability: string): number {
  return baseScore + getRacialBonus(race, ability);
}

export function StepAbilityScores({ data, onChange }: StepAbilityScoresProps) {
  const [method, setMethod] = useState<"standard" | "pointbuy" | "diceroll">(data.abilityMethod || "standard");
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const hasSeen = sessionStorage.getItem("ability-scores-info-seen");
      if (!hasSeen) {
        sessionStorage.setItem("ability-scores-info-seen", "true");
      }
      return !hasSeen;
    }
    return false;
  });

  const handleMethodChange = (newMethod: "standard" | "pointbuy" | "diceroll") => {
    setMethod(newMethod);
    onChange({ abilityMethod: newMethod });
    if (newMethod === "standard") {
      onChange({
        abilityScores: {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        },
      });
    } else if (newMethod === "pointbuy") {
      onChange({
        abilityScores: {
          str: 8,
          dex: 8,
          con: 8,
          int: 8,
          wis: 8,
          cha: 8,
        },
      });
    } else if (newMethod === "diceroll") {
      onChange({
        abilityScores: {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        },
      });
    }
  };

  const classData = data.class ? getClassData(data.class) : null;
  const savingThrowProfs = classData?.savingThrows || [];
  const profBonus = data.proficiencyBonus || 0;

  const abilityScores = data.abilityScores;
  const finalAbilityScores = {
    str: abilityScores.str + getRacialBonus(data.race, "str"),
    dex: abilityScores.dex + getRacialBonus(data.race, "dex"),
    con: abilityScores.con + getRacialBonus(data.race, "con"),
    int: abilityScores.int + getRacialBonus(data.race, "int"),
    wis: abilityScores.wis + getRacialBonus(data.race, "wis"),
    cha: abilityScores.cha + getRacialBonus(data.race, "cha"),
  };

  const liveSavingThrows: Record<string, { proficient: boolean; value: number }> = {};
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
    const isProficient = savingThrowProfs.includes(key);
    const abilityMod = getModifier(finalAbilityScores[key as keyof typeof finalAbilityScores]);
    liveSavingThrows[key] = {
      proficient: isProficient,
      value: isProficient ? abilityMod + profBonus : abilityMod,
    };
  }

  const liveInitiative = getModifier(finalAbilityScores.dex);

  return (
    <StepCard title="Ability Scores & Saving Throws">
      {showInfo && (
        <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 p-3">
          <p className="text-xs text-parchment/70 mb-2">
            <strong className="text-gold">Saving throws</strong> represent your character&apos;s ability to resist harm. Each class is proficient in two abilities — meaning you add your proficiency bonus to those saving throw rolls.
          </p>
          <p className="text-xs text-parchment/70 mb-3">
            <strong className="text-gold">Ability modifiers</strong> are derived from your scores: take your score, subtract 10, divide by 2, and round down. A score of 10–11 gives +0, 12–13 gives +1, 14–15 gives +2, and so on. These modifiers are added to attack rolls, skill checks, and saving throws.
          </p>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="text-xs text-gold hover:text-gold/80 font-medium"
          >
            Got it
          </button>
        </div>
      )}

      <div className="mb-4 flex rounded-lg border border-parchment/10 bg-charcoal/40 p-1">
        {[
          { key: "standard", label: "Standard Array" },
          { key: "pointbuy", label: "Point Buy" },
          { key: "diceroll", label: "Dice Roll" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => handleMethodChange(option.key as "standard" | "pointbuy" | "diceroll")}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
              method === option.key
                ? "bg-burgundy text-parchment"
                : "text-parchment/60 hover:text-parchment"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {method === "standard" && (
        <StandardArray scores={data.abilityScores} onChange={onChange} race={data.race} />
      )}
      {method === "pointbuy" && (
        <PointBuy scores={data.abilityScores} onChange={onChange} race={data.race} />
      )}
      {method === "diceroll" && (
        <DiceRoll scores={data.abilityScores} onChange={onChange} race={data.race} />
      )}

      <div className="mt-4">
        <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Saving Throws</span>
        <div className="mt-2 space-y-2">
          {ABILITIES.map(({ key, label }) => {
            const st = liveSavingThrows[key] ?? { proficient: false, value: 0 };
            const isProficient = savingThrowProfs.includes(key);
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                <span className="text-sm text-parchment/80 w-12">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-parchment/50">{isProficient ? "Proficient" : ""}</span>
                  <input
                    type="number"
                    value={st.value}
                    readOnly
                    className="input w-20 text-center bg-charcoal/60"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Initiative">
          <input
            type="number"
            value={liveInitiative}
            readOnly
            className="input bg-charcoal/60"
          />
        </Field>
      </div>
    </StepCard>
  );
}

function StandardArray({
  scores,
  onChange,
  race,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
  race?: string;
}) {
  const usedValues = new Set(Object.values(scores).filter((v) => v > 0));

  return (
    <div className="space-y-3">
      {ABILITIES.map(({ key, label }) => {
        const baseScore = scores[key] || 0;
        const racialBonus = getRacialBonus(race, key);
        const finalScore = getFinalScore(baseScore, race, key);
        const finalMod = getModifier(finalScore);
        const baseMod = getModifier(baseScore);
        return (
          <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
            <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
            <select
              value={baseScore || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val > 0 && usedValues.has(val) && scores[key] !== val) return;
                onChange({ abilityScores: { ...scores, [key]: val } });
              }}
              onBlur={() => {}}
              className="input w-20 text-center"
            >
              <option value="">-</option>
              {STANDARD_ARRAY.map((val) => (
                <option key={val} value={val} disabled={usedValues.has(val) && scores[key] !== val}>
                  {val}{usedValues.has(val) && scores[key] !== val ? " (used)" : ""}
                </option>
              ))}
            </select>
            <div className="flex flex-col items-end gap-0.5 w-16">
              {racialBonus > 0 && (
                <span className="text-[10px] text-parchment/40">+{racialBonus} racial</span>
              )}
              <span className="text-sm font-semibold text-gold">
                {finalScore > 0 ? `${finalMod >= 0 ? "+" : ""}${finalMod}` : "-"}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-parchment/40 mt-2">
        Available: {STANDARD_ARRAY.filter((v) => !usedValues.has(v)).join(", ") || "None (clear a field to free a value)"}
      </p>
    </div>
  );
}

function PointBuy({
  scores,
  onChange,
  race,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
  race?: string;
}) {
  const POINTS_TOTAL = 27;
  const usedPoints = ABILITIES.reduce((sum, { key }) => {
    const score = scores[key as keyof StepAbilityScoresProps["data"]["abilityScores"]] || 8;
    return sum + (POINT_BUY_COSTS[score] || 0);
  }, 0);
  const remaining = POINTS_TOTAL - usedPoints;

  const adjustScore = (key: keyof StepAbilityScoresProps["data"]["abilityScores"], delta: number) => {
    const current = scores[key] || 8;
    const newScore = Math.max(8, Math.min(15, current + delta));
    const currentCost = POINT_BUY_COSTS[current] || 0;
    const newCost = POINT_BUY_COSTS[newScore] || 0;
    const costDelta = newCost - currentCost;
    if (costDelta > remaining && delta > 0) return;
    onChange({ abilityScores: { ...scores, [key]: newScore } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
        <span className="text-xs font-medium text-parchment/60">Points Remaining</span>
        <span className={`text-sm font-bold ${remaining > 0 ? "text-gold" : "text-burgundy-light"}`}>
          {remaining} / {POINTS_TOTAL}
        </span>
      </div>
      {ABILITIES.map(({ key, label }) => {
        const score = scores[key] || 8;
        const finalScore = getFinalScore(score, race, key);
        const finalMod = getModifier(finalScore);
        const racialBonus = getRacialBonus(race, key);
        return (
          <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
            <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustScore(key, -1)}
                disabled={score <= 8}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
              >
                -
              </button>
              <span className="text-sm font-semibold text-parchment w-6 text-center">{score}</span>
              <button
                type="button"
                onClick={() => adjustScore(key, 1)}
                disabled={score >= 15 || (POINT_BUY_COSTS[score] || 0) >= remaining}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <div className="flex flex-col items-end gap-0.5 w-16">
              {racialBonus > 0 && (
                <span className="text-[10px] text-parchment/40">+{racialBonus}</span>
              )}
              <span className="text-sm font-semibold text-gold">
                {finalScore > 0 ? `${finalMod >= 0 ? "+" : ""}${finalMod}` : "-"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DiceRollState {
  dice: number[];
  locked: boolean;
  manualOverride: string;
}

function DiceRoll({
  scores,
  onChange,
  race,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
  race?: string;
}) {
  const [diceState, setDiceState] = useState<Record<string, DiceRollState>>(() => {
    const initial: Record<string, DiceRollState> = {};
    for (const { key } of ABILITIES) {
      initial[key] = { dice: [0, 0, 0, 0], locked: false, manualOverride: "" };
    }
    return initial;
  });

  const rollDie = (): number => Math.floor(Math.random() * 6) + 1;

  const rollAll = useCallback(() => {
    setDiceState((prev) => {
      const next: Record<string, DiceRollState> = {};
      for (const { key } of ABILITIES) {
        const current = prev[key];
        const dice = current.locked ? current.dice : [rollDie(), rollDie(), rollDie(), rollDie()];
        next[key] = { ...current, dice, locked: current.locked };
      }
      return next;
    });
  }, []);

  const rollSingle = (key: string, index: number) => {
    setDiceState((prev) => {
      const current = prev[key];
      if (current.locked) return prev;
      const newDice = [...current.dice];
      newDice[index] = rollDie();
      return { ...prev, [key]: { ...current, dice: newDice } };
    });
  };

  const lockAbility = (key: string) => {
    setDiceState((prev) => {
      const current = prev[key];
      const sorted = [...current.dice].sort((a, b) => b - a);
      const sum = sorted[0] + sorted[1] + sorted[2];
      const manual = current.manualOverride ? parseInt(current.manualOverride) : 0;
      const finalScore = manual > 0 ? manual : sum;
      onChange({ abilityScores: { ...scores, [key]: finalScore } });
      return { ...prev, [key]: { ...current, locked: true } };
    });
  };

  const resetAll = () => {
    setDiceState((prev) => {
      const next: Record<string, DiceRollState> = {};
      for (const { key } of ABILITIES) {
        next[key] = { dice: prev[key].dice, locked: false, manualOverride: "" };
      }
      return next;
    });
    onChange({
      abilityScores: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
      },
    });
  };

  const handleManualOverride = (key: string, value: string) => {
    setDiceState((prev) => {
      const current = prev[key];
      const numVal = parseInt(value) || 0;
      return { ...prev, [key]: { ...current, manualOverride: value } };
    });
    const numVal = parseInt(value) || 0;
    if (numVal >= 3 && numVal <= 18) {
      onChange({ abilityScores: { ...scores, [key]: numVal } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={rollAll}
          className="rounded-lg border border-parchment/20 bg-charcoal/40 px-4 py-2 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
        >
          Roll All Dice
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg border border-parchment/10 bg-charcoal/20 px-3 py-2 text-xs text-parchment/60 transition-colors hover:border-parchment/30"
        >
          Reset
        </button>
      </div>

      {ABILITIES.map(({ key, label }) => {
        const state = diceState[key];
        const baseScore = scores[key] || 0;
        const racialBonus = getRacialBonus(race, key);
        const finalScore = getFinalScore(baseScore, race, key);
        const finalMod = getModifier(finalScore);
        const sorted = [...state.dice].sort((a, b) => b - a);
        const sum = sorted[0] + sorted[1] + sorted[2];
        const displayScore = state.manualOverride ? parseInt(state.manualOverride) : (state.locked ? sum : 0);

        return (
          <div key={key} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
            state.locked ? "border-green-500/20 bg-green-500/5" : "border-parchment/10 bg-charcoal/40"
          }`}>
            <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
            <div className="flex items-center gap-1">
              {state.dice.map((die, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => rollSingle(key, idx)}
                  disabled={state.locked}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                    state.locked
                      ? "border-parchment/10 bg-charcoal/30 text-parchment/40"
                      : die === 1
                        ? "border-burgundy/40 bg-burgundy/10 text-burgundy-light cursor-pointer"
                        : "border-parchment/20 bg-charcoal/40 text-parchment"
                  }`}
                  title={die === 1 && !state.locked ? "Click to reroll this die" : `Die ${idx + 1}`}
                >
                  {die || "-"}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-end gap-0.5 w-16">
              {!state.locked && (
                <span className="text-[10px] text-parchment/40">
                  {state.dice.some((d) => d === 1) ? "reroll 1s!" : `= ${sum}`}
                </span>
              )}
              {state.locked && (
                <span className="text-[10px] text-green-400">locked</span>
              )}
              <span className="text-sm font-semibold text-gold">
                {finalScore > 0 ? `${finalMod >= 0 ? "+" : ""}${finalMod}` : "-"}
              </span>
            </div>
            {!state.locked ? (
              <button
                type="button"
                onClick={() => lockAbility(key)}
                disabled={state.dice[0] === 0}
                className="ml-2 rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-medium text-gold transition-colors hover:border-gold/50 disabled:opacity-40"
              >
                Lock
              </button>
            ) : (
              <div className="ml-2 flex items-center gap-1">
                <input
                  type="number"
                  min={3}
                  max={18}
                  value={state.manualOverride}
                  onChange={(e) => handleManualOverride(key, e.target.value)}
                  onBlur={() => {}}
                  className="input w-12 text-center text-xs"
                  placeholder={String(sum)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
