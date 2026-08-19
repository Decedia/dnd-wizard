"use client";

import { useState } from "react";
import type { LevelUpResult } from "@/lib/level-up";

interface LevelUpModalProps {
  open: boolean;
  levelUpResult: LevelUpResult | null;
  currentAbilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  onConfirm: (asiChoices: { ability: string; delta: number }[]) => void;
  onCancel: () => void;
  hpGainDescription?: string;
  expertiseOptions?: { name: string; isSkill: boolean }[];
  expertiseCount?: number;
  onExpertiseConfirm?: (selections: string[]) => void;
  characterClass?: string;
  currentExpertise?: string[];
  currentSkills?: Record<string, boolean>;
}

const ABILITIES = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
] as const;

function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function LevelUpModal({ open, levelUpResult, currentAbilityScores, onConfirm, onCancel, hpGainDescription, expertiseOptions, expertiseCount, onExpertiseConfirm, characterClass, currentExpertise, currentSkills }: LevelUpModalProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>(currentExpertise || []);
  const totalPoints = levelUpResult?.hasASI ? 2 * levelUpResult.asiLevels.length : 0;

  if (!open || !levelUpResult) return null;

  const allocatedPoints = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const canConfirm = !levelUpResult.hasASI || allocatedPoints === totalPoints;
  const canConfirmExpertise = !expertiseOptions || selectedExpertise.length === (expertiseCount || 0);
  const hasASI = levelUpResult.hasASI;
  const hasExpertise = !!expertiseOptions;

  const adjustAllocation = (ability: string, delta: number) => {
    setAllocations((prev) => {
      const current = prev[ability] || 0;
      const newVal = Math.max(0, current + delta);
      const currentTotal = Object.values(prev).reduce((sum, v) => sum + v, 0);
      if (delta > 0 && currentTotal >= totalPoints) return prev;
      if (newVal === 0) {
        const next = { ...prev };
        delete next[ability];
        return next;
      }
      return { ...prev, [ability]: newVal };
    });
  };

  const handleConfirm = () => {
    const choices: { ability: string; delta: number }[] = Object.entries(allocations)
      .filter(([, val]) => val > 0)
      .map(([ability, delta]) => ({ ability, delta }));
    if (hasExpertise && onExpertiseConfirm) {
      onExpertiseConfirm(selectedExpertise);
    }
    onConfirm(choices);
  };

  const toggleExpertise = (name: string) => {
    setSelectedExpertise((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      }
      if (prev.length >= (expertiseCount || 0)) return prev;
      return [...prev, name];
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80"
      onClick={hasASI || hasExpertise ? undefined : onCancel}
    >
      <div className="max-w-md w-full rounded-xl border border-parchment/20 bg-charcoal-light p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold text-gold mb-4">Level Up!</h2>

        {levelUpResult.addedFeatures.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-parchment/80 mb-2">New Features</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {levelUpResult.addedFeatures.map((feature, idx) => (
                <div key={idx} className="text-xs text-parchment/70">
                  <span className="font-medium text-gold/80">{feature.name}:</span> {feature.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {hpGainDescription && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-parchment/80 mb-1">Hit Points</h3>
            <p className="text-xs text-parchment/70">{hpGainDescription}</p>
          </div>
        )}

        {hasASI && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-parchment/80 mb-2">
              Ability Score Improvement ({levelUpResult.asiLevels.length} ASI{levelUpResult.asiLevels.length > 1 ? "s" : ""})
            </h3>
            <p className="text-xs text-parchment/50 mb-2">Distribute {totalPoints} points among your abilities</p>
            <div className="space-y-2">
              {ABILITIES.map(({ key, label }) => {
                const baseScore = currentAbilityScores[key];
                const allocated = allocations[key] || 0;
                const newScore = baseScore + allocated;
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                    <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                    <span className="text-sm text-parchment/60">{baseScore}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustAllocation(key, -1)}
                        disabled={allocated <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold text-gold w-6 text-center">{allocated > 0 ? `+${allocated}` : "0"}</span>
                      <button
                        type="button"
                        onClick={() => adjustAllocation(key, 1)}
                        disabled={allocated >= totalPoints || newScore >= 20}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-parchment/20 text-parchment/60 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-parchment w-8 text-right">{newScore}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasExpertise && expertiseOptions && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-parchment/80 mb-1">Expertise</h3>
            <p className="text-xs text-parchment/50 mb-2">Select {expertiseCount} skill{expertiseCount && expertiseCount > 1 ? "s" : ""} to double your proficiency bonus</p>
            <div className="space-y-2">
              {expertiseOptions.map((option) => {
                const isSelected = selectedExpertise.includes(option.name);
                const isDisabled = !isSelected && selectedExpertise.length >= (expertiseCount || 0);
                return (
                  <label
                    key={option.name}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-gold/40 bg-gold/5"
                        : isDisabled
                        ? "border-parchment/5 bg-charcoal/20 opacity-50"
                        : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExpertise(option.name)}
                      disabled={isDisabled}
                      className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
                    />
                    <span className="text-sm text-parchment/80">{option.name}</span>
                    {option.isSkill && currentSkills && currentSkills[option.name] && (
                      <span className="text-[10px] text-green-400/70">Proficient</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {levelUpResult.spellSlots && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-parchment/80 mb-1">Spell Slots</h3>
            <p className="text-xs text-parchment/70">
              You now have{" "}
              {Object.entries(levelUpResult.spellSlots)
                .map(([level, count]) => `${count} ${formatOrdinal(Number(level))}-level spell slot${count > 1 ? "s" : ""}`)
                .join(", ")}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={hasASI || hasExpertise}
            className="flex-1 rounded-xl border border-parchment/20 px-4 py-2 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || (hasExpertise && !canConfirmExpertise)}
            className="flex-1 rounded-xl bg-burgundy px-4 py-2 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            Confirm Level Up
          </button>
        </div>
      </div>
    </div>
  );
}
