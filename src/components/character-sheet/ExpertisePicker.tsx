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
        <span className="field-label-light mb-0">Expertise</span>
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">{selectedExpertise.length} of {maxCount} selected</span>
      </div>
      <div className="space-y-2">
        {options.map((name) => {
          const isSelected = selectedExpertise.includes(name);
          const isDisabled = !isSelected && selectedExpertise.length >= maxCount;
          return (
            <label
              key={name}
              className={`card flex items-center gap-3 px-3 py-2 cursor-pointer transition-all ${
                isDisabled ? "opacity-20" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleExpertise(name)}
                disabled={isDisabled}
                className="checkbox"
              />
              <span className={`text-sm font-bold ${isSelected ? "text-ink" : "text-ink"}`}>{name}</span>
              {isSelected && (
                <span className="badge text-ink bg-paper-muted ml-auto">EXPERTISE</span>
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
