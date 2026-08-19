"use client";

import { useState } from "react";
import type { Character } from "@/lib/storage";

interface ExpertisePickerProps {
  character: Character;
  selectedExpertise: string[];
  onExpertiseChange: (selections: string[]) => void;
}

export function ExpertisePicker({ character, selectedExpertise, onExpertiseChange }: ExpertisePickerProps) {
  const maxCount = character.class === "Rogue" ? getRogueExpertiseLimit(character.level) : 0;

  if (maxCount === 0) return null;

  const proficientSkills = Object.entries(character.skills)
    .filter(([, proficient]) => proficient)
    .map(([name]) => name);

  const hasThievesTools = character.class === "Rogue";
  const options = [...proficientSkills];
  if (hasThievesTools && !options.includes("Thieves' Tools")) {
    options.push("Thieves' Tools");
  }

  const toggleExpertise = (name: string) => {
    if (selectedExpertise.includes(name)) {
      onExpertiseChange(selectedExpertise.filter((n) => n !== name));
    } else if (selectedExpertise.length < maxCount) {
      onExpertiseChange([...selectedExpertise, name]);
    }
  };

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Expertise</span>
        <span className="text-xs text-parchment/50">{selectedExpertise.length} of {maxCount} selected</span>
      </div>
      <div className="space-y-2">
        {options.map((name) => {
          const isSelected = selectedExpertise.includes(name);
          const isDisabled = !isSelected && selectedExpertise.length >= maxCount;
          return (
            <label
              key={name}
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
                onChange={() => toggleExpertise(name)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50 disabled:opacity-30"
              />
              <span className="text-sm text-parchment/80">{name}</span>
              {isSelected && (
                <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded ml-auto">EXPERTISE</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function getRogueExpertiseLimit(level: number): number {
  if (level < 1) return 0;
  let maxCount = 0;
  const scalingValues: Record<number, number> = { 1: 2, 3: 2, 6: 4 };
  for (const [lvl, count] of Object.entries(scalingValues)) {
    if (Number(lvl) <= level) {
      maxCount = Math.max(maxCount, count);
    }
  }
  return maxCount;
}
