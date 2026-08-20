"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import type { Character } from "@/lib/storage";

interface LevelXpSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function LevelXpSection({ character, onChange }: LevelXpSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const level = character.level || 1;
  const currentXp = character.experiencePoints || 0;
  const maxXp = character.maxExperiencePoints || 0;

  const progressPercent = maxXp > 0 ? Math.min(100, Math.max(0, (currentXp / maxXp) * 100)) : 0;

  return (
    <div className="rounded-xl border border-parchment/10 bg-charcoal-light/60 p-5 mb-4">
      <div className="flex items-center gap-5">
        {/* Level Circle - Read Only */}
        <div className="relative flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-burgundy bg-charcoal shadow-lg shadow-burgundy/20">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Level</span>
              <span className="text-3xl font-bold text-burgundy">{level}</span>
            </div>
          </div>
        </div>

        {/* XP Section */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider block mb-1">
                Current XP
              </label>
              <input
                type="number"
                value={currentXp}
                onChange={(e) => onChange({ experiencePoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                onBlur={onFieldBlur}
                className="input w-full text-center"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-center pt-4">
              <span className="text-burgundy font-bold text-lg">/</span>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider block mb-1">
                Max XP
              </label>
              <input
                type="number"
                value={maxXp}
                onChange={(e) => onChange({ maxExperiencePoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                onBlur={onFieldBlur}
                className="input w-full text-center"
                placeholder="0"
              />
            </div>
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-charcoal border border-parchment/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-burgundy to-burgundy-light transition-all duration-300 shadow-[0_0_10px_rgba(180,40,60,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-parchment/50">
              <span className="font-medium">
                {progressPercent.toFixed(1)}% Complete
              </span>
              <span>
                {currentXp.toLocaleString()} / {maxXp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
