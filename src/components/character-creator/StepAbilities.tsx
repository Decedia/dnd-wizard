"use client";

import { useState, useMemo, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticRace } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { StarIcon as Star } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";
import { NewPlayerTips } from "@/components/NewPlayerTips";

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
  const sortedAbilities = useMemo(() => {
    return [...ABILITIES].sort((a, b) => (isRecommended("stat", b.label, data.class) ? 1 : 0) - (isRecommended("stat", a.label, data.class) ? 1 : 0));
  }, [data.class]);

  const [method, setMethod] = useState<AbilityMethod>(data.abilityMethod || "standard");
  const [pointBuyScores, setPointBuyScores] = useState<Record<AbilityKey, number>>(() => {
    const initial: Record<AbilityKey, number> = {
      str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
    };
    ABILITIES.forEach(ability => {
      const currentScore = (data[ability.key] as number) || 10;
      if (currentScore >= 8 && currentScore <= 15) {
        initial[ability.key] = currentScore;
      }
    });
    return initial;
  });
  const [diceRollScores, setDiceRollScores] = useState<Record<AbilityKey, number>>(() => {
    const initial: Record<AbilityKey, number> = {
      str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
    };
    ABILITIES.forEach(ability => {
      const currentScore = (data[ability.key] as number) || 10;
      if (currentScore >= 8 && currentScore <= 15) {
        initial[ability.key] = currentScore;
      }
    });
    return initial;
  });
  const [standardArraySelections, setStandardArraySelections] = useState<Record<AbilityKey, number | null>>(() => {
    const initial: Record<AbilityKey, number | null> = {
      str: null, dex: null, con: null, int: null, wis: null, cha: null
    };
    return initial;
  });

  const classData = data.class ? getStaticClass(data.class) : null;
  const raceData = data.race ? getStaticRace(data.race) : null;

  const raceBonuses = useMemo(() => {
    if (!raceData?.abilityScoreIncreases) return {} as Record<AbilityKey, number>;
    if (data.race === "Human" && data.raceVariant === "variant") {
      const bonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
      const selected = data.variantHumanAbilities || [];
      for (const ab of selected) {
        if (ab in bonuses) {
          bonuses[ab as AbilityKey] = 1;
        }
      }
      return bonuses;
    }
    return raceData.abilityScoreIncreases as Record<AbilityKey, number>;
  }, [raceData, data.race, data.raceVariant, data.variantHumanAbilities]);

  const getBaseScore = useCallback((key: AbilityKey): number => {
    return (data[key] as number) || 10;
  }, [data]);

  const getFinalScore = useCallback((key: AbilityKey): number => {
    const base = getBaseScore(key);
    const raceBonus = raceBonuses[key] || 0;
    return Math.min(20, base + raceBonus);
  }, [getBaseScore, raceBonuses]);

  const pointBuyUsed = useMemo(() => {
    return ABILITIES.reduce((sum, ability) => {
      return sum + (POINT_BUY_COSTS[pointBuyScores[ability.key]] || 0);
    }, 0);
  }, [pointBuyScores]);

  const pointBuyRemaining = useMemo(() => {
    return POINT_BUY_TOTAL - pointBuyUsed;
  }, [pointBuyUsed]);

  const syncPointBuyToCharacter = useCallback((scores: Record<AbilityKey, number>) => {
    const patch: Partial<Character> = {};
    ABILITIES.forEach(ability => {
      patch[ability.key] = scores[ability.key];
    });
    onChange(patch);
  }, [onChange]);

  const syncDiceRollToCharacter = useCallback((scores: Record<AbilityKey, number>) => {
    const patch: Partial<Character> = {};
    ABILITIES.forEach(ability => {
      patch[ability.key] = scores[ability.key];
    });
    onChange(patch);
  }, [onChange]);

  const loadCharacterScoresToPointBuy = useCallback(() => {
    const scores: Record<AbilityKey, number> = {
      str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
    };
    ABILITIES.forEach(ability => {
      const currentScore = getBaseScore(ability.key);
      if (currentScore >= 8 && currentScore <= 15) {
        scores[ability.key] = currentScore;
      }
    });
    setPointBuyScores(scores);
  }, [getBaseScore]);

  const handlePointBuyChange = useCallback((abilityKey: AbilityKey, newScore: number) => {
    setPointBuyScores(prev => {
      const oldScore = prev[abilityKey];
      if (newScore === oldScore) return prev;

      const oldCost = POINT_BUY_COSTS[oldScore] || 0;
      const newCost = POINT_BUY_COSTS[newScore] || 0;
      const costDiff = newCost - oldCost;

      const currentUsed = ABILITIES.reduce((sum, ability) => {
        return sum + (POINT_BUY_COSTS[prev[ability.key]] || 0);
      }, 0);

      if (currentUsed + costDiff > POINT_BUY_TOTAL) return prev;
      if (newScore < 8 || newScore > 15) return prev;

      const next = { ...prev, [abilityKey]: newScore };
      onChange({ [abilityKey]: newScore } as Partial<Character>);
      return next;
    });
  }, [onChange]);

  const handleDiceRollChange = useCallback((abilityKey: AbilityKey, newScore: number) => {
    setDiceRollScores(prev => {
      const oldScore = prev[abilityKey];
      if (newScore === oldScore) return prev;
      if (newScore < 8 || newScore > 15) return prev;

      const next = { ...prev, [abilityKey]: newScore };
      onChange({ [abilityKey]: newScore } as Partial<Character>);
      return next;
    });
  }, [onChange]);

  const renderStandardArray = () => {
    const currentSelections = standardArraySelections;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_ARRAY.map((val) => {
            const isUsed = Object.values(currentSelections).includes(val);
            return (
               <span
                 key={val}
                 className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                   isUsed
                     ? "bg-paper-muted text-ink-muted line-through"
                     : "bg-paper text-ink border border-border-strong"
                 }`}
               >
                 {val}
               </span>
            );
          })}
        </div>
        <div className="space-y-3">
          {sortedAbilities.map(({ key, label, full }) => {
            const finalScore = getFinalScore(key);
            const baseScore = getBaseScore(key);
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const currentSelection = currentSelections[key];

            const valuesUsedByOthers = ABILITIES
              .filter(({ key: otherKey }) => otherKey !== key)
              .map(({ key: otherKey }) => currentSelections[otherKey])
              .filter((val): val is number => val !== null);

            return (
              <div
                key={key}
                className="card flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink w-12 flex items-center gap-1">
                    {label}
                    {isRecommended("stat", label, data.class) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                  <span className="text-[10px] text-ink-muted font-medium">{full}</span>
                </div>
                <div className="flex items-center gap-2">
                  {raceBonus > 0 && (
                    <span className="text-xs font-bold text-ink bg-paper px-1.5 py-0.5 rounded-full">+{raceBonus}</span>
                  )}
                  <select
                    value={currentSelection ?? "-"}
                    onChange={(e) => {
                      const val = e.target.value === "-" ? null : parseInt(e.target.value);
                      setStandardArraySelections(prev => ({ ...prev, [key]: val }));
                      if (val !== null) {
                        onChange({ [key]: val } as Partial<Character>);
                      }
                    }}
                    className="input w-16 text-center border border-border-strong rounded-full"
                  >
                    <option value="-">-</option>
                    {STANDARD_ARRAY.map((val) => {
                      const isTakenByOther = valuesUsedByOthers.includes(val);
                      return (
                        <option key={val} value={val} disabled={isTakenByOther}>{val}</option>
                      );
                    })}
                  </select>
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-bold text-ink bg-paper px-2 py-0.5 rounded-full">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-ink-muted font-medium">mod</span>
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
         <div className="flex items-center justify-between card px-4 py-2">
          <span className="text-sm font-bold text-ink">Points Remaining</span>
          <span className={`text-lg font-bold ${pointBuyRemaining >= 0 ? "text-ink" : "text-ink-muted"}`}>
            {pointBuyRemaining} / {POINT_BUY_TOTAL}
          </span>
        </div>
        <div className="space-y-3">
          {sortedAbilities.map(({ key, label, full }) => {
            const score = pointBuyScores[key];
            const finalScore = Math.min(20, score + (raceBonuses[key] || 0));
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const cost = POINT_BUY_COSTS[score] || 0;
            const canDecrease = score > 8;
            const canIncrease = score < 15 && pointBuyRemaining >= (POINT_BUY_COSTS[score + 1] || 0);

            return (
              <div
                key={key}
                className="card flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink w-12 flex items-center gap-1">
                    {label}
                    {isRecommended("stat", label, data.class) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                  <span className="text-[10px] text-ink-muted font-medium">{full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, score - 1)}
                    disabled={!canDecrease}
                    className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30 rounded-full"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center w-20">
                    <span className="text-lg font-bold text-ink">{score}</span>
                    <span className="text-[10px] text-ink-muted font-medium">
                      {raceBonus > 0 ? `final: ${finalScore}` : `cost: ${cost}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, score + 1)}
                    disabled={!canIncrease}
                    className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30 rounded-full"
                  >
                    +
                  </button>
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-bold text-ink bg-paper px-2 py-0.5 rounded-full">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-ink-muted font-medium">mod</span>
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
        <p className="text-xs text-ink-muted font-medium">Manually enter each ability score. Maximum is 15, minimum is 8.</p>
        <div className="space-y-3">
          {sortedAbilities.map(({ key, label, full }) => {
            const score = diceRollScores[key];
            const finalScore = Math.min(20, score + (raceBonuses[key] || 0));
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;

            return (
              <div
                key={key}
                className="card flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink w-12 flex items-center gap-1">
                    {label}
                    {isRecommended("stat", label, data.class) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                  <span className="text-[10px] text-ink-muted font-medium">{full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDiceRollChange(key, score - 1)}
                    disabled={score <= 8}
                    className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30 rounded-full"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center w-20">
                    <span className="text-lg font-bold text-ink">{score}</span>
                    <span className="text-[10px] text-ink-muted font-medium">
                      {raceBonus > 0 ? `final: ${finalScore}` : "max: 15"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDiceRollChange(key, score + 1)}
                    disabled={score >= 15}
                    className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30 rounded-full"
                  >
                    +
                  </button>
                  <div className="flex flex-col items-center w-12">
                    <span className="text-sm font-bold text-ink bg-paper px-2 py-0.5 rounded-full">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <span className="text-[10px] text-ink-muted font-medium">mod</span>
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
      hint="Ability scores define your character's physical and mental abilities. Choose how to generate them: Standard Array (balanced) or Point Buy (custom)."
    >
      <div className="space-y-4">
         <div className="flex rounded-full bg-paper-muted p-1">
          {([
            { key: "standard" as AbilityMethod, label: "Standard Array" },
            { key: "pointbuy" as AbilityMethod, label: "Point Buy" },
            { key: "diceroll" as AbilityMethod, label: "Dice Roll" },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMethod(tab.key)}
              className={`btn flex-1 px-3 py-2 rounded-full ${
                method === tab.key
                  ? "btn btn-primary"
                  : "btn btn-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {renderMethodContent()}
        <NewPlayerTips
          tips={[
            {
              title: "What are Ability Scores?",
              content: "Ability scores represent your character's raw potential. STR affects melee attacks and carrying capacity. DEX affects ranged attacks and AC. CON affects HP. INT affects Wizard spells and knowledge. WIS affects Cleric/Druid spells and perception. CHA affects Bard/Sorcerer/Warlock spells and social skills.",
            },
            {
              title: "Gold Star = Recommended",
              content: "Gold stars show the most important abilities for your class. Put your highest scores here for a stronger character.",
            },
            {
              title: "Generating Scores",
              content: "Standard Array gives balanced scores (15, 14, 13, 12, 10, 8). Point Buy lets you customize. Dice Roll is random but can be fun!",
            },
          ]}
        />
      </div>
    </StepCard>
  );
}
