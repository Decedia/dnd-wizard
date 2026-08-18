"use client";

import { StepCard } from "./StepCard";
import { RACES } from "@/lib/storage";

interface StepRaceProps {
  data: { race: string };
  onChange: (data: Partial<StepRaceProps["data"]>) => void;
}

const RACE_DESCRIPTIONS: Record<string, string> = {
  Human: "Versatile and ambitious, humans are the most adaptable of all races.",
  Elf: "Graceful and long-lived, elves are attuned to nature and magic.",
  Dwarf: "Stout and resilient, dwarves are master craftsmen and miners.",
  Halfling: "Small but brave, halflings are nimble and surprisingly lucky.",
};

export function StepRace({ data, onChange }: StepRaceProps) {
  return (
    <StepCard title="Race">
      <div className="grid grid-cols-1 gap-3">
        {RACES.map((race) => (
          <button
            key={race}
            type="button"
            onClick={() => onChange({ race })}
            className={`rounded-xl border p-4 text-left transition-all ${
              data.race === race
                ? "border-gold bg-gold/10"
                : "border-parchment/10 bg-charcoal/40 hover:border-gold/30"
            }`}
          >
            <span className="font-display font-semibold text-parchment">{race}</span>
            <p className="mt-1 text-xs text-parchment/50">{RACE_DESCRIPTIONS[race]}</p>
          </button>
        ))}
      </div>
    </StepCard>
  );
}
