"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Star } from "phosphor-react";
import type { Character } from "@/lib/storage";

interface LevelXpSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function LevelXpSection({ character, onChange, editMode = true }: LevelXpSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const level = character.level || 1;
  const currentXp = character.experiencePoints || 0;
  const maxXp = character.maxExperiencePoints || 0;

  const progressPercent = maxXp > 0 ? Math.min(100, Math.max(0, (currentXp / maxXp) * 100)) : 0;

  return (
    <SectionCard id="level-xp" title="Level & Experience" icon={<Star weight="regular" className="h-5 w-5" />}>
      <div className="flex items-center gap-5">
        <div className="relative flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border-[3px] border-paper bg-paper">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Level</span>
              <span className="text-3xl font-bold text-ink">{level}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {editMode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="field-label-light">
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
                <span className="text-[var(--color-text-secondary)] font-bold text-lg">/</span>
              </div>
              <div className="flex-1">
                <label className="field-label-light">
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
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <span className="field-label-light">Current XP</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{currentXp.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-center pt-4">
                <span className="text-[var(--color-text-secondary)] font-bold text-lg">/</span>
              </div>
              <div className="flex-1 text-center">
                <span className="field-label-light">Max XP</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{maxXp.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="progress-track-light">
              <div
                className="progress-fill-light"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)] font-medium">
              <span>
                {progressPercent.toFixed(1)}% Complete
              </span>
              <span>
                {currentXp.toLocaleString()} / {maxXp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
