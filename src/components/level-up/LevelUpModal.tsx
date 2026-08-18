"use client";

import { useState, useEffect } from "react";
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

export function LevelUpModal({ open, levelUpResult, currentAbilityScores, onConfirm, onCancel }: LevelUpModalProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const totalPoints = levelUpResult?.hasASI ? 2 * levelUpResult.asiLevels.length : 0;

  if (!open || !levelUpResult) return null;

  const allocatedPoints = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const canConfirm = !levelUpResult.hasASI || allocatedPoints === totalPoints;
  const hasASI = levelUpResult.hasASI;

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
    onConfirm(choices);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80"
      onClick={hasASI ? undefined : onCancel}
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
            disabled={hasASI}
            className="flex-1 rounded-xl border border-parchment/20 px-4 py-2 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-xl bg-burgundy px-4 py-2 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            Confirm Level Up
          </button>
        </div>
      </div>
    </div>
  );
}
