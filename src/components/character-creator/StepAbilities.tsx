"use client";

import { useMemo, useState } from "react";
import { DiceFive, Info, Minus, Plus, Star } from "@phosphor-icons/react";
import type { Character } from "@/lib/storage";
import { isRecommended } from "@/lib/recommendations";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepAbilitiesProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

type AbilityMethod = "standard" | "pointbuy" | "manual" | "freebuy";
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
const BASE_SCORE = 8;
const POINT_BUY_MAX = 15;
const ROLL_MIN = 3;
const ROLL_MAX = 18;
const FREE_BUY_MAX = 20;

const METHOD_TABS: { key: AbilityMethod; labelKey: string; labelFallback: string }[] = [
  { key: "pointbuy", labelKey: "abilities.tabPointBuy", labelFallback: "Point Buy" },
  { key: "standard", labelKey: "abilities.tabArray", labelFallback: "Array" },
  { key: "manual", labelKey: "abilities.tabRoll", labelFallback: "Roll" },
  { key: "freebuy", labelKey: "abilities.tabFreeBuy", labelFallback: "Free Buy" },
];

const GUIDE_RULES: {
  labelKey: string;
  labelFallback: string;
  textKey: string;
  textFallback: string;
}[] = [
  {
    labelKey: "abilities.pointBuy",
    labelFallback: "Point Buy",
    textKey: "abilities.rulePointBuy",
    textFallback: "Max 15. Scores of 14 & 15 cost 2 points each.",
  },
  {
    labelKey: "abilities.standardArray",
    labelFallback: "Standard Array",
    textKey: "abilities.ruleArray",
    textFallback: "Standard numbers (15, 14, 13, 12, 10, 8).",
  },
  {
    labelKey: "abilities.manualRoll",
    labelFallback: "Manual Roll",
    textKey: "abilities.ruleRoll",
    textFallback: "Roll with dice (High risk!).",
  },
  {
    labelKey: "abilities.freeBuy",
    labelFallback: "Free Buy",
    textKey: "abilities.ruleFreeBuy",
    textFallback: "Homebrew! Spend points however you like.",
  },
];

const ROW_CLASS =
  "mb-3 flex items-center justify-between rounded-xl border-2 border-border-strong bg-surface p-3";

const EMPTY_STATS: Record<AbilityKey, number> = {
  str: BASE_SCORE,
  dex: BASE_SCORE,
  con: BASE_SCORE,
  int: BASE_SCORE,
  wis: BASE_SCORE,
  cha: BASE_SCORE,
};

const PLACEHOLDER_SCORE = 10;

const seedScores = (character: Character): Record<AbilityKey, number> => {
  const variantAbilities = new Set(character.variantHumanAbilities || []);
  const seeded = { ...EMPTY_STATS };
  ABILITIES.forEach((ability) => {
    const saved = character[ability.key] as number | undefined;
    if (typeof saved !== "number") return;
    const base = variantAbilities.has(ability.key) ? saved - 1 : saved;
    if (base >= ROLL_MIN && base <= FREE_BUY_MAX) {
      seeded[ability.key] = base;
    }
  });
  const isPlaceholder = ABILITIES.every(
    (ability) => seeded[ability.key] === PLACEHOLDER_SCORE,
  );
  return isPlaceholder ? { ...EMPTY_STATS } : seeded;
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

const statCostStep = (score: number): number => getStatCost(score + 1) - getStatCost(score);

const totalCost = (scores: Record<AbilityKey, number>): number =>
  ABILITIES.reduce((sum, ability) => sum + getStatCost(scores[ability.key]), 0);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const roll4d6DropLowest = (): number => {
  const dice = [0, 1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
  return dice
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, die) => sum + die, 0);
};

const reduceHighestScore = (
  scores: Record<AbilityKey, number>,
): Record<AbilityKey, number> | null => {
  let target: AbilityKey | null = null;
  for (const { key } of ABILITIES) {
    if (scores[key] > BASE_SCORE && (target === null || scores[key] > scores[target])) {
      target = key;
    }
  }
  if (target === null) return null;
  const next = { ...scores };
  next[target] -= 1;
  return next;
};

const normalizeForMethod = (
  method: AbilityMethod,
  current: Record<AbilityKey, number>,
): Record<AbilityKey, number> => {
  const next = { ...current };
  if (method === "standard") return next;
  if (method === "pointbuy") {
    const clamped = { ...next };
    ABILITIES.forEach((ability) => {
      clamped[ability.key] = clamp(clamped[ability.key], BASE_SCORE, POINT_BUY_MAX);
    });
    let candidate = clamped;
    let guard = 0;
    while (totalCost(candidate) > POINT_BUY_TOTAL && guard < 100) {
      const reduced = reduceHighestScore(candidate);
      if (!reduced) break;
      candidate = reduced;
      guard += 1;
    }
    return candidate;
  }
  if (method === "freebuy") {
    ABILITIES.forEach((ability) => {
      next[ability.key] = clamp(next[ability.key], BASE_SCORE, FREE_BUY_MAX);
    });
    return next;
  }
  ABILITIES.forEach((ability) => {
    next[ability.key] = clamp(next[ability.key], ROLL_MIN, ROLL_MAX);
  });
  return next;
};

export function StepAbilities({ data, onChange }: StepAbilitiesProps) {
  const { t } = useLanguage();

  const [statMethod, setStatMethod] = useState<AbilityMethod>(
    (data.abilityMethod as AbilityMethod) || "pointbuy",
  );

  const [stats, setStats] = useState<Record<AbilityKey, number>>(() =>
    normalizeForMethod(statMethod, seedScores(data)),
  );

  const [arraySelections, setArraySelections] = useState<Record<AbilityKey, number | null>>(
    () => {
      const seeded = seedScores(data);
      const initial: Record<AbilityKey, number | null> = {
        str: null,
        dex: null,
        con: null,
        int: null,
        wis: null,
        cha: null,
      };
      const values = ABILITIES.map((ability) => seeded[ability.key]);
      const sortedSeeded = [...values].sort((a, b) => b - a).join(",");
      const sortedArray = [...STANDARD_ARRAY].sort((a, b) => b - a).join(",");
      if (sortedSeeded === sortedArray) {
        ABILITIES.forEach((ability) => {
          initial[ability.key] = seeded[ability.key];
        });
      }
      return initial;
    },
  );

  const pointsSpent = useMemo(() => totalCost(stats), [stats]);
  const pointsRemaining = POINT_BUY_TOTAL - pointsSpent;

  const usedArrayValues = useMemo(
    () =>
      new Set(
        ABILITIES.map((ability) => arraySelections[ability.key]).filter(
          (value): value is number => value !== null,
        ),
      ),
    [arraySelections],
  );

  const patchStats = (next: Record<AbilityKey, number>) => {
    const patch: Record<string, number> = {};
    ABILITIES.forEach((ability) => {
      patch[ability.key] = next[ability.key];
    });
    onChange(patch as Partial<Character>);
  };

  const applyScore = (key: AbilityKey, score: number) => {
    setStats((prev) => ({ ...prev, [key]: score }));
    onChange({ [key]: score } as Partial<Character>);
  };

  const handleMethodChange = (method: AbilityMethod) => {
    const normalized = normalizeForMethod(method, stats);
    setStatMethod(method);
    setStats(normalized);
    const patch: Partial<Character> = { abilityMethod: method } as Partial<Character>;
    ABILITIES.forEach((ability) => {
      if (normalized[ability.key] !== stats[ability.key]) {
        (patch as Record<string, number>)[ability.key] = normalized[ability.key];
      }
    });
    onChange(patch);
  };

  const changeScore = (key: AbilityKey, requested: number) => {
    const current = stats[key];
    let next = requested;
    if (statMethod === "pointbuy") {
      if (next < BASE_SCORE || next > POINT_BUY_MAX) return;
      if (pointsRemaining - (getStatCost(next) - getStatCost(current)) < 0) return;
    } else if (statMethod === "freebuy") {
      next = clamp(next, BASE_SCORE, FREE_BUY_MAX);
    } else {
      next = clamp(next, ROLL_MIN, ROLL_MAX);
    }
    if (next === current) return;
    applyScore(key, next);
  };

  const selectArrayValue = (key: AbilityKey, value: number | null) => {
    setArraySelections((prev) => {
      const next = { ...prev };
      ABILITIES.forEach((ability) => {
        if (ability.key !== key && next[ability.key] === value) {
          next[ability.key] = null;
        }
      });
      next[key] = value;
      return next;
    });
    applyScore(key, value ?? BASE_SCORE);
  };

  const handleRoll = () => {
    const rolled = { ...EMPTY_STATS };
    ABILITIES.forEach((ability) => {
      rolled[ability.key] = roll4d6DropLowest();
    });
    setStats(rolled);
    patchStats(rolled);
  };

  const getLimits = (score: number): { canIncrement: boolean; canDecrement: boolean } => {
    if (statMethod === "pointbuy") {
      return {
        canIncrement: score < POINT_BUY_MAX && pointsRemaining - statCostStep(score) >= 0,
        canDecrement: score > BASE_SCORE,
      };
    }
    if (statMethod === "freebuy") {
      return { canIncrement: score < FREE_BUY_MAX, canDecrement: score > BASE_SCORE };
    }
    return { canIncrement: score < ROLL_MAX, canDecrement: score > ROLL_MIN };
  };

  const renderLabelBlock = (ability: { key: AbilityKey; label: string; full: string }) => {
    const isRec = isRecommended("stat", ability.label, data.class);
    return (
      <div className="flex items-center gap-3">
        <div className="flex w-5 justify-center">
          {isRec && <Star size={16} weight="fill" className="text-warning-400" />}
        </div>
        <span className="text-lg font-black uppercase text-ink">{ability.label}</span>
      </div>
    );
  };

  const renderStatRow = (ability: { key: AbilityKey; label: string; full: string }) => {
    const { key, full } = ability;
    const score = stats[key];

    if (statMethod === "standard") {
      const selected = arraySelections[key];
      return (
        <div key={key} className="mb-3 rounded-xl border-2 border-border-strong bg-surface p-3">
          <div className="flex items-center justify-between">
            {renderLabelBlock(ability)}
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              {selected !== null
                ? t("abilities.numberSelected", { score: selected }, "{score} selected")
                : t("abilities.pickNumber", "Pick a number")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STANDARD_ARRAY.map((value) => {
              const isSelected = selected === value;
              const isTaken = !isSelected && usedArrayValues.has(value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isTaken}
                  onClick={() => selectArrayValue(key, isSelected ? null : value)}
                  aria-label={`${full} ${value}`}
                  className={[
                    "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                    isSelected
                      ? "bg-ink text-surface"
                      : isTaken
                        ? "border border-border-muted bg-paper-muted text-ink-muted line-through opacity-50"
                        : "border border-border-strong bg-surface text-ink active:scale-95",
                  ].join(" ")}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const { canIncrement, canDecrement } = getLimits(score);
    const statCost = getStatCost(score);
    const nextStepCost = statCostStep(score);

    return (
      <div key={key} className={ROW_CLASS}>
        {renderLabelBlock(ability)}
        <div className="flex items-center gap-4">
          {statMethod === "pointbuy" && (
            <span
              className="w-9 text-right text-[10px] font-bold text-ink-muted"
              title={t("abilities.costTitle", { n: statCost }, "Costs {n} points")}
            >
              {statCost}
              {nextStepCost > 1 && (
                <span className="text-accent-indigo-700">+{nextStepCost}</span>
              )}
            </span>
          )}
          <button
            type="button"
            onClick={() => changeScore(key, score - 1)}
            disabled={!canDecrement}
            aria-label={t("abilities.decrease", { ability: full }, "Decrease {ability}")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dark text-ink-muted transition-all active:scale-95 disabled:opacity-40"
          >
            <Minus size={16} weight="bold" />
          </button>
          <span className="w-6 text-center text-xl font-black text-ink">{score}</span>
          <button
            type="button"
            onClick={() => changeScore(key, score + 1)}
            disabled={!canIncrement}
            aria-label={t("abilities.increase", { ability: full }, "Increase {ability}")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-indigo-200 bg-accent-indigo-50 text-accent-indigo-700 transition-all active:scale-95 disabled:opacity-40"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-ink">
          {t("creator.abilityScores", "Ability Scores")}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          {t(
            "creator.abilityScoresHint",
            "Ability scores define your character's physical and mental abilities.",
          )}
        </p>
      </header>

      <nav
        aria-label={t("abilities.methodAria", "Ability score generation method")}
        className="mb-5 flex rounded-xl border border-border-strong bg-paper-muted p-1"
      >
        {METHOD_TABS.map((tab) => {
          const active = statMethod === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleMethodChange(tab.key)}
              aria-pressed={active}
              className={[
                "flex-1 rounded-lg px-1 py-2 text-center text-[11px] transition-all",
                active ? "bg-surface font-bold text-ink shadow-sm" : "font-medium text-ink-muted",
              ].join(" ")}
            >
              {t(tab.labelKey, tab.labelFallback)}
            </button>
          );
        })}
      </nav>

      <div className="mb-5 rounded-2xl border border-accent-indigo-200 bg-accent-indigo-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info size={18} weight="bold" className="text-accent-indigo-700" />
          <h3 className="text-sm font-bold text-accent-indigo-800">
            {t("abilities.beginnerGuide", "Beginner's Guide")}
          </h3>
        </div>
        <p className="mb-2 text-xs leading-relaxed text-accent-indigo-800">
          {t(
            "abilities.guideIntro",
            "Ability scores determine how great your character is. Watch for the Star (⭐) icon, which marks the most important stats for the class you chose!",
          )}
        </p>
        <ul className="ml-1 space-y-1 text-[11px] text-accent-indigo-800">
          {GUIDE_RULES.map((rule) => (
            <li key={rule.textKey}>
              <strong className="font-semibold">{t(rule.labelKey, rule.labelFallback)}:</strong>{" "}
              {t(rule.textKey, rule.textFallback)}
            </li>
          ))}
        </ul>
      </div>

      {statMethod === "pointbuy" && (
        <div className="sticky top-14 z-20 mb-5 rounded-2xl border-2 border-border-strong bg-paper px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
              {t("abilities.pointsRemaining", "Points Remaining")}
            </span>
            <span className="text-2xl font-black text-ink">
              {pointsRemaining}
              <span className="ml-1 text-xs font-bold text-ink-muted">/ {POINT_BUY_TOTAL}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-muted">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${(pointsSpent / POINT_BUY_TOTAL) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-ink-muted">
            <span>
              {t("abilities.pointsSpent", { n: pointsSpent }, "Spent {n}")}
            </span>
            <span>{t("abilities.maxScore", { max: POINT_BUY_MAX }, "Max {max}")}</span>
          </div>
        </div>
      )}

      {statMethod === "manual" && (
        <button
          type="button"
          onClick={handleRoll}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border-strong bg-surface py-3 font-bold text-ink transition-transform active:scale-[0.98]"
        >
          <DiceFive size={18} weight="bold" />
          {t("abilities.rollDice", "Roll Dice (4d6)")}
        </button>
      )}

      <div>{ABILITIES.map(renderStatRow)}</div>
    </section>
  );
}
