"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { getModifier, getRaceData } from "@/lib/storage";

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
    abilityMethod: "standard" | "pointbuy" | "manual";
    race?: string;
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
  const [method, setMethod] = useState<"standard" | "pointbuy" | "manual">(data.abilityMethod || "standard");

  const handleMethodChange = (newMethod: "standard" | "pointbuy" | "manual") => {
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
    }
  };

  return (
    <StepCard title="Ability Scores">
      <div className="mb-4 flex rounded-lg border border-parchment/10 bg-charcoal/40 p-1">
        {[
          { key: "standard", label: "Standard Array" },
          { key: "pointbuy", label: "Point Buy" },
          { key: "manual", label: "Manual Entry" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => handleMethodChange(option.key as "standard" | "pointbuy" | "manual")}
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
      {method === "manual" && (
        <ManualEntry scores={data.abilityScores} onChange={onChange} race={data.race} />
      )}
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
  const usedValues = new Set(Object.values(scores).filter(Boolean));
  const availableValues = STANDARD_ARRAY.filter((v) => !usedValues.has(v));

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
              onChange={(e) => onChange({ abilityScores: { ...scores, [key]: parseInt(e.target.value) || 0 } })}
              onBlur={() => {}}
              className="input w-20 text-center"
            >
              <option value="">-</option>
              {STANDARD_ARRAY.map((val) => (
                <option key={val} value={val}>{val}</option>
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
        Available values: {availableValues.length > 0 ? availableValues.join(", ") : "None (clear a field to free a value)"}
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

function ManualEntry({
  scores,
  onChange,
  race,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
  race?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ABILITIES.map(({ key, label }) => {
        const baseScore = scores[key] || 0;
        const racialBonus = getRacialBonus(race, key);
        const finalScore = getFinalScore(baseScore, race, key);
        const finalMod = getModifier(finalScore);
        return (
          <div key={key} className="rounded-lg border border-parchment/10 bg-charcoal/40 p-3">
            <span className="text-[10px] font-medium text-parchment/50 uppercase tracking-wider">{label}</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                value={baseScore || ""}
                onChange={(e) => onChange({ abilityScores: { ...scores, [key]: parseInt(e.target.value) || 0 } })}
                onBlur={() => {}}
                className="input w-16 text-center"
                placeholder="0"
              />
              <div className="flex flex-col">
                {racialBonus > 0 && (
                  <span className="text-[10px] text-parchment/40">+{racialBonus}</span>
                )}
                <span className="text-xs font-semibold text-gold">
                  {finalScore > 0 ? `${finalMod >= 0 ? "+" : ""}${finalMod}` : "-"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
