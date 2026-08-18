"use client";

import { StepCard } from "./StepCard";
import { CLASSES } from "@/lib/storage";

interface StepClassProps {
  data: { class: string };
  onChange: (data: Partial<StepClassProps["data"]>) => void;
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  Fighter: "A master of martial combat, skilled with weapons and armor.",
  Wizard: "A scholarly spellcaster who wields magic through study and arcane knowledge.",
  Rogue: "A stealthy trickster who excels at skills, stealth, and striking from the shadows.",
};

export function StepClass({ data, onChange }: StepClassProps) {
  return (
    <StepCard title="Class">
      <div className="grid grid-cols-1 gap-3">
        {CLASSES.map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => onChange({ class: cls })}
            className={`rounded-xl border p-4 text-left transition-all ${
              data.class === cls
                ? "border-gold bg-gold/10"
                : "border-parchment/10 bg-charcoal/40 hover:border-gold/30"
            }`}
          >
            <span className="font-display font-semibold text-parchment">{cls}</span>
            <p className="mt-1 text-xs text-parchment/50">{CLASS_DESCRIPTIONS[cls]}</p>
          </button>
        ))}
      </div>
    </StepCard>
  );
}
