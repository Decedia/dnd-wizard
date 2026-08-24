"use client";

import { useState, useMemo, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticRace } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";
import type { Character } from "@/lib/storage";

interface StepAbilitiesProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

type AbilityMethod = "standard" | "pointbuy" | "diceroll";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const POINT_BUY_TOTAL = 27;

export function StepAbilities({ data, onChange }: StepAbilitiesProps) {
  const [method, setMethod] = useState<AbilityMethod>(data.abilityMethod || "standard");
  const [pointBuyRemaining, setPointBuyRemaining] = useState(POINT_BUY_TOTAL);
  const [diceRolls, setDiceRolls] = useState<Record<AbilityKey, number[]>>({
    str: [], dex: [], con: [], int: [], wis: [], cha: []
  });
  const [assignedArrayToAbility, setAssignedArrayToAbility] = useState<Record<AbilityKey, number>>({} as Record<AbilityKey, number>);
  const [diceRollResults, setDiceRollResults] = useState<Record<AbilityKey, number>>({
    str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
  });

  const classData = data.class ? getStaticClass(data.class) : null;
  const raceData = data.race ? getStaticRace(data.race) : null;

  const raceBonuses = useMemo(() => {
    if (!raceData?.abilityScoreIncreases) return {} as Record<AbilityKey, number>;
    return raceData.abilityScoreIncreases as Record<AbilityKey, number>;
  }, [raceData]);

  const getBaseScore = useCallback((key: AbilityKey): number => {
    return (data[key] as number) || 10;
  }, [data]);

  const getFinalScore = useCallback((key: AbilityKey): number => {
    const base = getBaseScore(key);
    const raceBonus = raceBonuses[key] || 0;
    return Math.min(20, base + raceBonus);
  }, [getBaseScore, raceBonuses]);

  const rollDice = useCallback((abilityKey: AbilityKey) => {
    const rolls: number[] = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    rolls.sort((a, b) => b - a);
    const total = Math.min(15, rolls.slice(0, 3).reduce((a, b) => a + b, 0));
    
    setDiceRolls(prev => ({ ...prev, [abilityKey]: rolls }));
    setDiceRollResults(prev => ({ ...prev, [abilityKey]: total }));
    
    const raceBonus = raceBonuses[abilityKey] || 0;
    const newBase = Math.max(8, total - raceBonus);
    onChange({ [abilityKey]: newBase } as Partial<Character>);
  }, [raceBonuses, onChange]);

  const handleStandardArrayAssign = useCallback((abilityKey: AbilityKey, value: number) => {
    const newAssigned = { ...assignedArrayToAbility };
    Object.keys(newAssigned).forEach(key => {
      if (newAssigned[key as AbilityKey] === value) {
        delete newAssigned[key as AbilityKey];
      }
    });
    newAssigned[abilityKey] = value;
    setAssignedArrayToAbility(newAssigned);

    const raceBonus = raceBonuses[abilityKey] || 0;
    const baseValue = Math.max(8, value - raceBonus);
    onChange({ [abilityKey]: baseValue } as Partial<Character>);
  }, [assignedArrayToAbility, raceBonuses, onChange]);

  const handlePointBuyChange = useCallback((abilityKey: AbilityKey, newScore: number) => {
    const oldScore = getBaseScore(abilityKey);
    if (newScore === oldScore) return;

    const oldCost = POINT_BUY_COSTS[oldScore] || 0;
    const newCost = POINT_BUY_COSTS[newScore] || 0;
    const costDiff = newCost - oldCost;

    if (pointBuyRemaining - costDiff < 0) return;
    if (newScore < 8 || newScore > 15) return;

    setPointBuyRemaining(prev => prev - costDiff);
    
    const raceBonus = raceBonuses[abilityKey] || 0;
    const baseValue = Math.max(8, newScore - raceBonus);
    onChange({ [abilityKey]: baseValue } as Partial<Character>);
  }, [getBaseScore, pointBuyRemaining, raceBonuses, onChange]);

  const handleDiceRollAll = useCallback(() => {
    const newResults: Record<AbilityKey, number> = {
      str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
    };
    const patch: Partial<Character> = {};
    
    ABILITIES.forEach(ability => {
      const rolls: number[] = [];
      for (let i = 0; i < 4; i++) {
        rolls.push(Math.floor(Math.random() * 6) + 1);
      }
      rolls.sort((a, b) => b - a);
      const total = Math.min(15, rolls.slice(0, 3).reduce((a, b) => a + b, 0));
      newResults[ability.key] = total;
      
      const raceBonus = raceBonuses[ability.key] || 0;
      patch[ability.key] = Math.max(8, total - raceBonus);
    });
    
    setDiceRollResults(newResults);
    onChange(patch);
  }, [raceBonuses, onChange]);

  const renderStandardArray = () => {
    const assignedValues = Object.values(assignedArrayToAbility);
    const availableValues = STANDARD_ARRAY.filter(val => !assignedValues.includes(val));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_ARRAY.map((val) => {
            const isUsed = assignedValues.includes(val);
            return (
              <span
                key={val}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  isUsed
                    ? "bg-charcoal/20 text-parchment/30 line-through"
                    : "bg-accent/10 text-accent border border-accent/30"
                }`}
              >
                {val}
              </span>
            );
          })}
        </div>
        <div className="space-y-3">
          {ABILITIES.map(({ key, label, full }) => {
            const currentScore = getFinalScore(key);
            const baseScore = getBaseScore(key);
            const modifier = getModifier(currentScore);
            const raceBonus = raceBonuses[key] || 0;

            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                  <span className="text-[10px] text-text-muted">{full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={assignedArrayToAbility[key] || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      if (val) handleStandardArrayAssign(key, val);
                    }}
                    className="input w-16 text-center"
                  >
                    <option value="">-</option>
                    {STANDARD_ARRAY.map((val) => (
                      <option key={val} value={val} disabled={!availableValues.includes(val) && assignedArrayToAbility[key] !== val}>
                        {val}
                      </option>
                    ))}
                  </select>
                  {raceBonus > 0 && (
                    <span className="text-xs text-accent">+{raceBonus}</span>
                  )}
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-semibold text-accent">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-text-muted">mod</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPointBuy = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-4 py-2">
          <span className="text-sm text-parchment/80">Points Remaining</span>
          <span className={`text-lg font-bold ${pointBuyRemaining > 0 ? "text-accent" : "text-parchment/50"}`}>
            {pointBuyRemaining} / {POINT_BUY_TOTAL}
          </span>
        </div>
        <div className="space-y-3">
          {ABILITIES.map(({ key, label, full }) => {
            const baseScore = getBaseScore(key);
            const finalScore = getFinalScore(key);
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const cost = POINT_BUY_COSTS[baseScore] || 0;

            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                  <span className="text-[10px] text-text-muted">{full}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, baseScore - 1)}
                    disabled={baseScore <= 8}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center w-16">
                    <span className="text-lg font-bold text-parchment">{baseScore}</span>
                    <span className="text-[10px] text-text-muted">cost: {cost}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, baseScore + 1)}
                    disabled={baseScore >= 15 || (pointBuyRemaining - (POINT_BUY_COSTS[baseScore + 1] || 0) < 0)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                  >
                    +
                  </button>
                  {raceBonus > 0 && (
                    <span className="text-xs text-accent">+{raceBonus}</span>
                  )}
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-semibold text-accent">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-text-muted">mod</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDiceRoll = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-parchment/50">Roll 4d6, drop the lowest. Maximum score is 15.</p>
          <button
            type="button"
            onClick={handleDiceRollAll}
            className="rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            Roll All
          </button>
        </div>
        <div className="space-y-3">
          {ABILITIES.map(({ key, label, full }) => {
            const baseScore = getBaseScore(key);
            const finalScore = getFinalScore(key);
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const rolls = diceRolls[key] || [];

            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                  <span className="text-[10px] text-text-muted">{full}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-1">
                      {rolls.length === 0 ? (
                        <span className="text-xs text-parchment/30">Not rolled</span>
                      ) : (
                        rolls.map((roll, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                              i < 3
                                ? "bg-accent/20 text-accent border border-accent/30"
                                : "bg-charcoal/60 text-parchment/30 line-through"
                            }`}
                          >
                            {roll}
                          </span>
                        ))
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      {diceRollResults[key] ? `Total: ${diceRollResults[key]}` : "4d6 drop lowest"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => rollDice(key)}
                    className="rounded-md border border-border bg-charcoal/40 px-2 py-1 text-xs text-parchment/60 hover:border-accent hover:text-accent transition-colors"
                  >
                    Roll
                  </button>
                  {raceBonus > 0 && (
                    <span className="text-xs text-accent">+{raceBonus}</span>
                  )}
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-semibold text-accent">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-text-muted">mod</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMethodContent = () => {
    switch (method) {
      case "standard":
        return renderStandardArray();
      case "pointbuy":
        return renderPointBuy();
      case "diceroll":
        return renderDiceRoll();
      default:
        return null;
    }
  };

  return (
    <StepCard
      title="Ability Scores"
      hint="Ability scores define your character's physical and mental abilities. Choose how to generate them: Standard Array (balanced), Point Buy (custom), or Dice Roll (random)."
    >
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border bg-charcoal/40 p-1">
          {([
            { key: "standard" as AbilityMethod, label: "Standard Array" },
            { key: "pointbuy" as AbilityMethod, label: "Point Buy" },
            { key: "diceroll" as AbilityMethod, label: "Dice Roll" },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMethod(tab.key)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                method === tab.key
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-parchment/60 hover:text-parchment/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {renderMethodContent()}
      </div>
    </StepCard>
  );
}
