"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Skull, Circle } from "phosphor-react";
import type { Character } from "@/lib/storage";

interface DeathSavesSectionProps {
  character: Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">;
  onChange: (patch: Partial<Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">>) => void;
  editMode?: boolean;
}

export function DeathSavesSection({ character, onChange, editMode = true }: DeathSavesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const renderDot = (filled: boolean) => (
    <span
      className={`inline-block h-4 w-4 rounded-sm border-2 ${
        filled
          ? "border-ink bg-ink"
          : "border-paper bg-transparent"
      }`}
    />
  );

  return (
    <SectionCard id="death-saves" title="DEATH SAVES" icon={<Skull weight="regular" className="h-5 w-5" />}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-paper-muted uppercase tracking-wider">Successes</span>
          {editMode
            ? [0, 1, 2].map((i) => (
                <label key={`ds-s-${i}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={character.deathSaveSuccesses > i}
                    onChange={(e) => onChange({ deathSaveSuccesses: e.target.checked ? i + 1 : i })}
                    onBlur={onFieldBlur}
                    className="checkbox"
                  />
                </label>
              ))
            : [0, 1, 2].map((i) => (
                <span key={`ds-s-${i}`}>
                  {character.deathSaveSuccesses > i
                    ? <Circle weight="fill" size={12} color="#111111" />
                    : <Circle weight="regular" size={12} color="#cccccc" />}
                </span>
              ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-paper-muted uppercase tracking-wider">Failures</span>
          {editMode
            ? [0, 1, 2].map((i) => (
                <label key={`ds-f-${i}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={character.deathSaveFailures > i}
                    onChange={(e) => onChange({ deathSaveFailures: e.target.checked ? i + 1 : i })}
                    onBlur={onFieldBlur}
                    className="checkbox"
                  />
                </label>
              ))
            : [0, 1, 2].map((i) => (
                <span key={`ds-f-${i}`}>
                  {character.deathSaveFailures > i
                    ? <Circle weight="fill" size={12} color="#111111" />
                    : <Circle weight="regular" size={12} color="#cccccc" />}
                </span>
              ))}
        </div>
      </div>
    </SectionCard>
  );
}

