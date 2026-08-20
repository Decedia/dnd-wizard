"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import type { Character } from "@/lib/storage";

interface LevelXpSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export function LevelXpSection({ character, onChange }: LevelXpSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const level = character.level || 1;
  const currentXp = character.experiencePoints || 0;

  const currentThreshold = XP_THRESHOLDS[level] || 0;
  const nextThreshold = XP_THRESHOLDS[level + 1] || null;
  const xpInCurrentLevel = currentXp - currentThreshold;
  const xpNeededForNext = nextThreshold ? nextThreshold - currentThreshold : null;
  const progressPercent = xpNeededForNext ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100)) : 100;

  const handleLevelChange = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(20, newLevel));
    onChange({ level: clamped });
  };

  return (
    <div className="rounded-xl border border-parchment/10 bg-charcoal-light/60 p-5 mb-4">
      <div className="flex items-center gap-5">
        {/* Level Circle */}
        <div className="relative flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-burgundy bg-charcoal shadow-lg shadow-burgundy/20">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Level</span>
              <span className="text-3xl font-bold text-burgundy">{level}</span>
            </div>
          </div>
        </div>

        {/* XP Section */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-parchment/60 uppercase tracking-wider">Experience Points</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLevelChange(level - 1)}
                disabled={level <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-parchment/60 transition-all hover:border-white/40 hover:text-parchment disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                value={currentXp}
                onChange={(e) => onChange({ experiencePoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                onBlur={onFieldBlur}
                className="input w-24 text-center"
                placeholder="XP"
              />
              <button
                type="button"
                onClick={() => handleLevelChange(level + 1)}
                disabled={level >= 20}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-parchment/60 transition-all hover:border-white/40 hover:text-parchment disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal">
              <div
                className="h-full rounded-full bg-burgundy transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-parchment/50">
              <span>
                {xpInCurrentLevel.toLocaleString()} / {xpNeededForNext ? xpNeededForNext.toLocaleString() : "MAX"}
              </span>
              {nextThreshold && (
                <span>Next: {nextThreshold.toLocaleString()} XP</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
