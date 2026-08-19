"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";
import { getClassLevel1Hp, getClassPerLevelHp, getModifier } from "@/lib/storage";
import { getClassData } from "@/data/srd";

interface StepLevelHitPointsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepLevelHitPoints({ data, onChange }: StepLevelHitPointsProps) {
  const [selectedLevel, setSelectedLevel] = useState(data.level);
  const [hpResolved, setHpResolved] = useState(false);
  const classData = data.class ? getClassData(data.class) : null;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(data.con);
  const level1Hp = (classData?.hitDie || 10) + conMod;

  const handleLevelChange = (newLevel: number) => {
    setSelectedLevel(newLevel);
    setHpResolved(false);
    onChange({ level: newLevel });
  };

  return (
    <StepCard title="Level & Hit Points">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => handleLevelChange(Math.max(1, selectedLevel - 1))}
            disabled={selectedLevel <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-parchment/20 text-parchment/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30"
          >
            -
          </button>
          <span className="text-2xl font-display font-bold text-gold w-8 text-center">{selectedLevel}</span>
          <button
            type="button"
            onClick={() => handleLevelChange(Math.min(10, selectedLevel + 1))}
            disabled={selectedLevel >= 10}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-parchment/20 text-parchment/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30"
          >
            +
          </button>
        </div>

        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs text-parchment/60 mb-2">
            <strong className="text-gold">Level 1 Baseline HP:</strong> Your starting hit points are calculated as your class hit die ({hitDie}) + your Constitution modifier ({conMod >= 0 ? "+" : ""}{conMod}).
          </p>
          <p className="text-sm font-semibold text-parchment">
            {level1Hp} HP at Level 1
          </p>
        </div>

        {selectedLevel > 1 && (
          <div className="rounded-lg border border-parchment/10 bg-charcoal/40 p-4">
            <p className="text-xs text-parchment/60 mb-3">
              Each level above 1 adds your class&apos;s average HP per level ({(classData?.hpPerLevel || 5)} + CON modifier {conMod >= 0 ? "+" : ""}{conMod} = {(classData?.hpPerLevel || 5) + conMod} HP per level).
            </p>
            <p className="text-xs text-parchment/50">
              Selecting level {selectedLevel} will generate {selectedLevel - 1} per-level step{selectedLevel > 2 ? "s" : ""} covering levels 2 through {selectedLevel}.
            </p>
          </div>
        )}
      </div>
    </StepCard>
  );
}
