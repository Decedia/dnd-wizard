"use client";

import { useState, useMemo } from "react";
import { Star, Minus, Plus, Info } from "@phosphor-icons/react";
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
const DEFAULT_STATS: Record<AbilityKey, number> = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
};

const METHOD_TABS = [
  { key: "pointbuy" as AbilityMethod, label: "Point Buy" },
  { key: "standard" as AbilityMethod, label: "Array" },
  { key: "manual" as AbilityMethod, label: "Roll" },
  { key: "freebuy" as AbilityMethod, label: "Free Buy" },
] as const;

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

export function StepAbilities({ data, onChange }: StepAbilitiesProps) {
  const { t } = useLanguage();

  const [statMethod, setStatMethod] = useState<AbilityMethod>(
    (data.abilityMethod as AbilityMethod) || "pointbuy",
  );
  const [stats, setStats] = useState<Record<AbilityKey, number>>(() => {
    const initial = { ...DEFAULT_STATS };
    ABILITIES.forEach((ability) => {
      const currentScore = (data[ability.key] as number) || 8;
      if (currentScore >= 8 && currentScore <= 15) {
        initial[ability.key] = currentScore;
      }
    });
    return initial;
  });

  const [standardArraySelections, setStandardArraySelections] = useState<
    Record<AbilityKey, number | null>
  >(() => {
    const initial: Record<AbilityKey, number | null> = {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    };
    ABILITIES.forEach((ability) => {
      const currentScore = (data[ability.key] as number) || 8;
      if (STANDARD_ARRAY.includes(currentScore)) {
        initial[ability.key] = currentScore;
      }
    });
    return initial;
  });

  const totalPointsSpent = useMemo(
    () => Object.values(stats).reduce((total, score) => total + getStatCost(score), 0),
    [stats],
  );
  const pointsRemaining = POINT_BUY_TOTAL - totalPointsSpent;

  const canProceed = useMemo(() => {
    if (statMethod === "standard") {
      return ABILITIES.every((a) => standardArraySelections[a.key] !== null);
    }
    return Object.values(stats).every((s) => s >= 8);
  }, [statMethod, standardArraySelections, stats]);

  const handleTabChange = (method: AbilityMethod) => {
    setStatMethod(method);
    onChange({ abilityMethod: method } as Partial<Character>);
  };

  const applyStat = (stat: AbilityKey, newScore: number) => {
    setStats((prev) => ({ ...prev, [stat]: newScore }));
    onChange({ [stat]: newScore } as Partial<Character>);
  };

  const handlePointBuyChange = (stat: AbilityKey, newScore: number) => {
    if (newScore < 8 || newScore > 15) return;
    const diff = getStatCost(newScore) - getStatCost(stats[stat]);
    if (pointsRemaining - diff >= 0) {
      applyStat(stat, newScore);
    }
  };

  const handleRollChange = (stat: AbilityKey, newScore: number) => {
    if (newScore < 8 || newScore > 15) return;
    applyStat(stat, newScore);
  };

  const handleFreeBuyChange = (stat: AbilityKey, newScore: number) => {
    if (newScore < 8 || newScore > 30) return;
    applyStat(stat, newScore);
  };

  const handleArraySelect = (stat: AbilityKey, val: number | null) => {
    setStandardArraySelections((prev) => ({ ...prev, [stat]: val }));
    if (val !== null) {
      applyStat(stat, val);
    }
  };

  const getLimits = (
    score: number,
  ): { canIncrement: boolean; canDecrement: boolean } => {
    if (statMethod === "pointbuy") {
      return {
        canIncrement: score < 15 && pointsRemaining - statCostStep(score) >= 0,
        canDecrement: score > 8,
      };
    }
    if (statMethod === "freebuy") {
      return { canIncrement: score < 30, canDecrement: score > 8 };
    }
    return { canIncrement: score < 15, canDecrement: score > 8 };
  };

  const onStatChange = (stat: AbilityKey, newScore: number) => {
    if (statMethod === "pointbuy") return handlePointBuyChange(stat, newScore);
    if (statMethod === "freebuy") return handleFreeBuyChange(stat, newScore);
    return handleRollChange(stat, newScore);
  };

  const renderStatRow = (ability: { key: AbilityKey; label: string }) => {
    const { key, label } = ability;
    const score = stats[key];
    const isRec = isRecommended("stat", label, data.class);

    if (statMethod === "standard") {
      const currentSelection = standardArraySelections[key];
      const valuesUsedByOthers = ABILITIES.filter((a) => a.key !== key)
        .map((a) => standardArraySelections[a.key])
        .filter((v): v is number => v !== null);

      return (
        <div
          key={key}
          className="flex items-center justify-between bg-paper border-2 border-[var(--color-border-strong)] rounded-xl p-3 mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 flex justify-center">
              {isRec && (
                <Star
                  size={16}
                  weight="fill"
                  className="text-[var(--color-warning-400)]"
                />
              )}
            </div>
            <span className="font-black text-lg text-[var(--color-ink)] uppercase">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentSelection ?? "-"}
              onChange={(e) => {
                const val = e.target.value === "-" ? null : parseInt(e.target.value);
                handleArraySelect(key, val);
              }}
              className="input w-16 text-center text-[var(--color-ink)]"
            >
              <option value="-">—</option>
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
    }

    const { canIncrement, canDecrement } = getLimits(score);

    return (
      <div
        key={key}
        className="flex items-center justify-between bg-paper border-2 border-[var(--color-border-strong)] rounded-xl p-3 mb-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
            {isRec && (
              <Star
                size={16}
                weight="fill"
                className="text-[var(--color-warning-400)]"
              />
            )}
          </div>
          <span className="font-black text-lg text-[var(--color-ink)] uppercase">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onStatChange(key, score - 1)}
            disabled={!canDecrement}
            className="w-9 h-9 rounded-full bg-[var(--color-paper-muted)] flex items-center justify-center text-[var(--color-ink-muted)] disabled:opacity-40 active:scale-95 transition-all"
          >
            <Minus size={16} weight="bold" />
          </button>

          <span className="font-black text-xl w-6 text-center text-[var(--color-ink)]">
            {score}
          </span>

          <button
            type="button"
            onClick={() => onStatChange(key, score + 1)}
            disabled={!canIncrement}
            className="w-9 h-9 rounded-full bg-[var(--color-accent-indigo-50)] border border-[var(--color-accent-indigo-200)] flex items-center justify-center text-[var(--color-accent-indigo-700)] disabled:opacity-40 active:scale-95 transition-all"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full pb-32">
      <header className="mb-4">
        <h2 className="text-[var(--color-text-primary)] text-base font-semibold">
          {t("creator.abilityScores", "Ability Scores")}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-xs mt-1">
          {t(
            "creator.abilityScoresHint",
            "Ability scores define your character's physical and mental abilities.",
          )}
        </p>
      </header>

      <nav
        aria-label="Ability score generation method"
        className="flex bg-[var(--color-paper-muted)] p-1 rounded-xl mb-6"
      >
        {METHOD_TABS.map((tab) => {
          const active = statMethod === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                "flex-1 text-[11px] font-medium py-2 px-1 text-center rounded-lg transition-all",
                active
                  ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-bold"
                  : "text-[var(--color-ink-muted)]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="bg-[var(--color-accent-indigo-50)] border border-[var(--color-accent-indigo-200)] rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Info
            size={18}
            weight="bold"
            className="text-[var(--color-accent-indigo-700)]"
          />
          <h3 className="font-bold text-sm text-[var(--color-ink)]">
            Panduan Pemula
          </h3>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mb-2">
          Atribut menentukan seberapa hebat karaktermu. Perhatikan ikon Bintang
          (⭐) yang menunjukkan stat paling penting untuk kelas yang kamu pilih!
        </p>
        <ul className="text-[11px] text-[var(--color-ink-muted)] space-y-1 ml-1">
          <li>
            <strong className="font-semibold text-[var(--color-ink)]">
              Point Buy:
            </strong>{" "}
            Maks 15. Angka 14 & 15 harganya 2 poin.
          </li>
          <li>
            <strong className="font-semibold text-[var(--color-ink)]">
              Array:
            </strong>{" "}
            Angka baku (15, 14, 13, 12, 10, 8).
          </li>
          <li>
            <strong className="font-semibold text-[var(--color-ink)]">
              Roll:
            </strong>{" "}
            Acak dengan dadu (Beresiko tinggi!).
          </li>
          <li>
            <strong className="font-semibold text-[var(--color-ink)]">
              Free Buy:
            </strong>{" "}
            Homebrew! Bebas isi poin sesukamu.
          </li>
        </ul>
      </div>

      {statMethod === "standard" && (
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_ARRAY.map((val) => {
            const isUsed =
              Object.values(standardArraySelections).includes(val) &&
              Object.values(standardArraySelections).filter((v) => v === val)
                .length > 0;
            const assigned = Object.values(standardArraySelections).includes(val);
            return (
              <span
                key={val}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  assigned
                    ? "bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] line-through"
                    : "bg-paper text-[var(--color-ink)] border border-[var(--color-border-strong)]"
                }`}
              >
                {val}
              </span>
            );
          })}
        </div>
      )}

      {statMethod === "pointbuy" && (
        <div className="bg-[var(--color-paper-muted)] border border-[var(--color-border-strong)] rounded-2xl px-4 py-3 flex justify-between items-center sticky top-0 z-10 mb-6">
          <span className="text-xs font-bold uppercase text-[var(--color-ink-muted)] tracking-widest">
            Sisa Poin
          </span>
          <span
            className={`text-2xl font-black ${
              pointsRemaining === 0
                ? "text-[var(--color-ink-subtle)]"
                : "text-[var(--color-success-500)]"
            }`}
          >
            {pointsRemaining} <span className="text-xs text-[var(--color-ink-subtle)]">/ {POINT_BUY_TOTAL}</span>
          </span>
        </div>
      )}

      <div className="space-y-0">
        {ABILITIES.map(renderStatRow)}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <button
          type="button"
          onClick={() => handleTabChange(statMethod)}
          className="bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] font-bold py-3.5 rounded-xl text-center disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          Kembali
        </button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={() => {
            if (!canProceed) return;
            onChange({ abilityMethod: statMethod } as Partial<Character>);
          }}
          className="bg-[var(--color-accent-indigo-600)] text-[var(--color-paper)] font-bold py-3.5 rounded-xl text-center border-b-4 border-[var(--color-accent-indigo-700)] disabled:opacity-50 active:border-b-0 active:translate-y-1 transition-all"
        >
          Lanjut
        </button>
      </div>
    </section>
  );
}
