"use client";

import { useState, useMemo, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticRace } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { Star, Minus, Plus, Info } from "@phosphor-icons/react";
import { isRecommended } from "@/lib/recommendations";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepAbilitiesProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

type AbilityMethod = "standard" | "pointbuy" | "manual";

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

const POINT_BUY_TOTAL = 27;

const DEFAULT_STATS: Record<AbilityKey, number> = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
};

const getStatCost = (score: number): number => {
  if (score === 8) return 0;
  if (score === 9) return 1;
  if (score === 10) return 2;
  if (score === 11) return 3;
  if (score === 12) return 4;
  if (score === 13) return 5;
  if (score === 14) return 7;
  if (score === 15) return 9;
  return 0;
};

export function StepAbilities({ data, onChange }: StepAbilitiesProps) {
  const { t } = useLanguage();

  const [statMethod, setStatMethod] = useState<AbilityMethod>((data.abilityMethod as AbilityMethod) || "pointbuy");
  const [stats, setStats] = useState<Record<AbilityKey, number>>(() => {
    const initial = { ...DEFAULT_STATS };
    ABILITIES.forEach((ability) => {
      const currentScore = (data[ability.key] as number) || 10;
      if (currentScore >= 8 && currentScore <= 15) {
        initial[ability.key] = currentScore;
      }
    });
    return initial;
  });

  const [standardArraySelections, setStandardArraySelections] = useState<Record<AbilityKey, number | null>>(() => {
    const initial: Record<AbilityKey, number | null> = {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    };
    return initial;
  });

  const classData = data.class ? getStaticClass(data.class, data.ruleset) : null;
  const raceData = data.race ? getStaticRace(data.race, data.ruleset) : null;

  const raceBonuses = useMemo(() => {
    if (!raceData?.abilityScoreIncreases) return {} as Record<AbilityKey, number>;
    if (data.race === "Human" && data.raceVariant === "variant") {
      return {} as Record<AbilityKey, number>;
    }
    return raceData.abilityScoreIncreases as Record<AbilityKey, number>;
  }, [raceData, data.race, data.raceVariant]);

  const getBaseScore = useCallback(
    (key: AbilityKey): number => {
      return (data[key] as number) || 10;
    },
    [data]
  );

  const getFinalScore = useCallback(
    (key: AbilityKey): number => {
      const base = getBaseScore(key);
      const raceBonus = raceBonuses[key] || 0;
      return Math.min(20, base + raceBonus);
    },
    [getBaseScore, raceBonuses]
  );

  const totalPointsSpent = useMemo(() => {
    return Object.values(stats).reduce((total, score) => total + getStatCost(score), 0);
  }, [stats]);

  const pointsRemaining = useMemo(() => {
    return POINT_BUY_TOTAL - totalPointsSpent;
  }, [totalPointsSpent]);

  const handleStatChange = useCallback(
    (stat: AbilityKey, newScore: number) => {
      if (newScore < 8 || newScore > 15) return;

      const currentCost = getStatCost(stats[stat]);
      const newCost = getStatCost(newScore);
      const costDifference = newCost - currentCost;

      if (pointsRemaining - costDifference >= 0) {
        const nextStats = { ...stats, [stat]: newScore };
        setStats(nextStats);
        onChange({ [stat]: newScore } as Partial<Character>);
      }
    },
    [stats, pointsRemaining, onChange]
  );

  const handleManualChange = useCallback(
    (abilityKey: AbilityKey, newScore: number) => {
      if (newScore < 8 || newScore > 15) return;

      const nextStats = { ...stats, [abilityKey]: newScore };
      setStats(nextStats);
      onChange({ [abilityKey]: newScore } as Partial<Character>);
    },
    [stats, onChange]
  );

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
          {ABILITIES.map(({ key, label, full }) => {
            const finalScore = getFinalScore(key);
            const baseScore = getBaseScore(key);
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const currentSelection = currentSelections[key];
            const isRec = isRecommended("stat", label, data.class);

            const valuesUsedByOthers = ABILITIES.filter(({ key: otherKey }) => otherKey !== key)
              .map(({ key: otherKey }) => currentSelections[otherKey])
              .filter((val): val is number => val !== null);

            return (
              <div
                key={key}
                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {isRec && <Star size={16} weight="fill" className="text-amber-400 animate-pulse" />}
                  </div>
                  <div>
                    <span className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase">{label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {raceBonus > 0 && (
                    <span className="text-xs font-bold text-ink bg-paper px-1.5 py-0.5 rounded-full">+{raceBonus}</span>
                  )}
                  <select
                    value={currentSelection ?? "-"}
                    onChange={(e) => {
                      const val = e.target.value === "-" ? null : parseInt(e.target.value);
                      setStandardArraySelections((prev) => ({ ...prev, [key]: val }));
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
                        <option key={val} value={val} disabled={isTakenByOther}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
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
        {statMethod === "pointbuy" && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-4 flex justify-between items-center mb-6 shadow-sm">
            <span className="text-sm font-bold tracking-widest uppercase text-slate-300">Sisa Poin</span>
            <span className={`text-2xl font-black ${pointsRemaining === 0 ? "text-slate-400" : "text-emerald-400"}`}>
              {pointsRemaining} <span className="text-sm text-slate-500">/ 27</span>
            </span>
          </div>
        )}

        <div className="space-y-3">
          {ABILITIES.map(({ key, label, full }) => {
            const currentScore = stats[key];
            const finalScore = Math.min(20, currentScore + (raceBonuses[key] || 0));
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const isRec = isRecommended("stat", label, data.class);
            const nextCost = getStatCost(currentScore + 1) - getStatCost(currentScore);
            const canIncrement = currentScore < 15 && pointsRemaining - nextCost >= 0;
            const canDecrement = currentScore > 8;

            return (
              <div
                key={key}
                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {isRec && <Star size={16} weight="fill" className="text-amber-400 animate-pulse" />}
                  </div>
                  <div>
                    <span className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase">{label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleStatChange(key, currentScore - 1)}
                    disabled={!canDecrement}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <Minus size={16} weight="bold" />
                  </button>

                  <span className="font-black text-xl w-6 text-center text-slate-900 dark:text-white">
                    {currentScore}
                  </span>

                  <button
                    onClick={() => handleStatChange(key, currentScore + 1)}
                    disabled={!canIncrement}
                    className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:bg-slate-50 disabled:border-transparent active:scale-95 transition-all"
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderManual = () => {
    return (
      <div className="space-y-4">
        <p className="text-xs text-ink-muted font-medium">Manually enter each ability score. Maximum is 15, minimum is 8.</p>
        <div className="space-y-3">
          {ABILITIES.map(({ key, label, full }) => {
            const currentScore = stats[key];
            const finalScore = Math.min(20, currentScore + (raceBonuses[key] || 0));
            const modifier = getModifier(finalScore);
            const raceBonus = raceBonuses[key] || 0;
            const isRec = isRecommended("stat", label, data.class);

            return (
              <div
                key={key}
                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {isRec && <Star size={16} weight="fill" className="text-amber-400 animate-pulse" />}
                  </div>
                  <div>
                    <span className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase">{label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleManualChange(key, currentScore - 1)}
                    disabled={currentScore <= 8}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <Minus size={16} weight="bold" />
                  </button>

                  <span className="font-black text-xl w-6 text-center text-slate-900 dark:text-white">
                    {currentScore}
                  </span>

                  <button
                    onClick={() => handleManualChange(key, currentScore + 1)}
                    disabled={currentScore >= 15}
                    className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:bg-slate-50 disabled:border-transparent active:scale-95 transition-all"
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMethodContent = () => {
    switch (statMethod) {
      case "standard":
        return renderStandardArray();
      case "pointbuy":
        return renderPointBuy();
      case "manual":
        return renderManual();
      default:
        return null;
    }
  };

  return (
    <StepCard
      title={t("creator.abilityScores")}
      hint={t("creator.abilityScoresHint", "Ability scores define your character's physical and mental abilities. Choose how to generate them: Standard Array (balanced), Point Buy (custom with costs), Manual Roll (direct entry).")}
    >
      <div className="space-y-4">
        <div className="flex rounded-full bg-paper-muted p-1">
          {[
            { key: "standard" as AbilityMethod, label: "Standard Array" },
            { key: "pointbuy" as AbilityMethod, label: "Point Buy" },
            { key: "manual" as AbilityMethod, label: "Manual Roll" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatMethod(tab.key)}
              className={`btn flex-1 px-3 py-2 rounded-full ${
                statMethod === tab.key ? "btn btn-primary" : "btn btn-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Premium Newbie Tips Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Info size={18} weight="bold" className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Panduan Pemula</h3>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed mb-2">
            Atribut menentukan seberapa hebat karaktermu. Perhatikan ikon Bintang (⭐) yang menunjukkan stat paling penting untuk kelas yang kamu pilih!
          </p>
          <ul className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 space-y-1 ml-1">
            <li>
              <strong className="font-semibold">Point Buy:</strong> Atur poin fleksibel. Angka 14 & 15 harganya lebih mahal (2 poin).
            </li>
            <li>
              <strong className="font-semibold">Array Standar:</strong> Gunakan urutan angka baku yang aman (15, 14, 13, 12, 10, 8).
            </li>
            <li>
              <strong className="font-semibold">Roll:</strong> Acak angkamu menggunakan dadu (Beresiko tinggi!).
            </li>
          </ul>
        </div>

        {renderMethodContent()}
      </div>
    </StepCard>
  );
}