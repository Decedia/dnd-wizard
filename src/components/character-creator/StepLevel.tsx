"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepLevelProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepLevel({ data, onChange }: StepLevelProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const hitDie = classData?.hitDie || 10;
  const conMod = Math.floor((data.con - 10) / 2);
  const level = data.level || 1;

  const baselineHp = hitDie + conMod;

  const adjustLevel = useCallback((delta: number) => {
    const newLevel = Math.max(1, Math.min(20, level + delta));
    const patch: Partial<Character> = { level: newLevel };
    
    // If level drops below subclass level, clear subclass
    if (classData && newLevel < (classData.subclassLevel || 0)) {
      patch.subclass = undefined;
    }
    
    onChange(patch);
  }, [level, classData, onChange]);

  return (
    <StepCard title="Starting Level" hint="Choose your character's starting level. Higher levels mean more abilities, but also more complexity. Your subclass becomes available when you reach the required level for your class.">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => adjustLevel(-1)}
            disabled={level <= 1}
            className="h-10 w-10 rounded-full border border-border bg-charcoal/40 text-parchment transition-all hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
          >
            -
          </button>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-parchment">Level {level}</div>
              {classData && classData.subclassLevel && (
                <div className="text-xs text-parchment/50 mt-1">
                  Subclass available at Level {classData.subclassLevel}
                </div>
              )}
          </div>
          <button
            type="button"
            onClick={() => adjustLevel(1)}
            disabled={level >= 20}
            className="h-10 w-10 rounded-full border border-border bg-charcoal/40 text-parchment transition-all hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
          >
            +
          </button>
        </div>

        <div className="rounded-lg border border-border bg-charcoal/40 p-3">
          <div className="text-xs text-parchment/50 uppercase tracking-wider mb-1">Baseline HP at Level 1</div>
          <div className="text-sm text-parchment">
            Hit Die: d{hitDie} + CON modifier ({conMod >= 0 ? '+' : ''}{conMod}) = <span className="text-accent font-semibold">{baselineHp > 0 ? '+' : ''}{baselineHp}</span>
          </div>
          <div className="text-xs text-parchment/40 mt-1">
            HP scales automatically as you level up.
          </div>
        </div>
      </div>
    </StepCard>
  );
}
