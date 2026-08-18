"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { getModifier } from "@/lib/storage";

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
        <StandardArray scores={data.abilityScores} onChange={onChange} />
      )}
      {method === "pointbuy" && (
        <PointBuy scores={data.abilityScores} onChange={onChange} />
      )}
      {method === "manual" && (
        <ManualEntry scores={data.abilityScores} onChange={onChange} />
      )}
    </StepCard>
  );
}

function StandardArray({
  scores,
  onChange,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
}) {
  const usedValues = new Set(Object.values(scores).filter(Boolean));
  const availableValues = STANDARD_ARRAY.filter((v) => !usedValues.has(v));

  return (
    <div className="space-y-3">
      {ABILITIES.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
          <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
          <select
            value={scores[key] || ""}
            onChange={(e) => onChange({ abilityScores: { ...scores, [key]: parseInt(e.target.value) || 0 } })}
            onBlur={() => {}}
            className="input w-20 text-center"
          >
            <option value="">-</option>
            {STANDARD_ARRAY.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <span className="text-sm font-semibold text-gold w-8 text-right">
            {scores[key] ? `${getModifier(scores[key]) >= 0 ? "+" : ""}${getModifier(scores[key])}` : "-"}
          </span>
        </div>
      ))}
      <p className="text-xs text-parchment/40 mt-2">
        Available values: {availableValues.length > 0 ? availableValues.join(", ") : "None (clear a field to free a value)"}
      </p>
    </div>
  );
}

function PointBuy({
  scores,
  onChange,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
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
        const cost = POINT_BUY_COSTS[score] || 0;
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
                disabled={score >= 15 || cost >= remaining}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <span className="text-sm font-semibold text-gold w-8 text-right">
              {getModifier(score) >= 0 ? `+${getModifier(score)}` : getModifier(score)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ManualEntry({
  scores,
  onChange,
}: {
  scores: StepAbilityScoresProps["data"]["abilityScores"];
  onChange: StepAbilityScoresProps["onChange"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ABILITIES.map(({ key, label }) => (
        <div key={key} className="rounded-lg border border-parchment/10 bg-charcoal/40 p-3">
          <span className="text-[10px] font-medium text-parchment/50 uppercase tracking-wider">{label}</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              value={scores[key] || ""}
              onChange={(e) => onChange({ abilityScores: { ...scores, [key]: parseInt(e.target.value) || 0 } })}
              onBlur={() => {}}
              className="input w-16 text-center"
              placeholder="0"
            />
            <span className="text-xs font-semibold text-gold">
              {scores[key] ? `${getModifier(scores[key]) >= 0 ? "+" : ""}${getModifier(scores[key])}` : "-"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
