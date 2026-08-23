"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
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
    <SectionCard id="level-xp" title="LEVEL & EXPERIENCE" icon={<LevelIcon className="h-5 w-5" />}>
      <div className="flex items-center gap-5">
        <div className="relative flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-charcoal">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Level</span>
              <span className="text-3xl font-bold text-accent">{level}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {editMode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">
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
                <span className="text-accent font-bold text-lg">/</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">
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
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">Current XP</span>
                <span className="text-lg font-bold text-accent">{currentXp.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-center pt-4">
                <span className="text-accent font-bold text-lg">/</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">Max XP</span>
                <span className="text-lg font-bold text-accent">{maxXp.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-charcoal border border-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted">
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
    </SectionCard>
  );
}

function LevelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
