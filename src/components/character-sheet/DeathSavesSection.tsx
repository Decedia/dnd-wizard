"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { SkullIcon as Skull, CircleIcon as Circle, CheckIcon as Check, XIcon as X } from "@/components/icons";
import type { Character } from "@/lib/storage";

interface DeathSavesSectionProps {
  character: Pick<Character, "deathSaveSuccesses" | "deathSaveFailures" | "currentHp" | "maxHp">;
  onChange: (patch: Partial<Pick<Character, "deathSaveSuccesses" | "deathSaveFailures" | "currentHp">>) => void;
  editMode?: boolean;
}

export function DeathSavesSection({ character, onChange, editMode = true }: DeathSavesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const renderDot = (filled: boolean, color: string) => (
    <span
      className={`inline-block h-4 w-4 rounded-sm border-2 ${
        filled
          ? `border-[${color}] bg-[${color}]`
          : "border-[var(--color-border)] bg-transparent"
      }`}
    />
  );

  const addSuccess = () => {
    const newSuccesses = Math.min(3, (character.deathSaveSuccesses || 0) + 1);
    onChange({ deathSaveSuccesses: newSuccesses });
    onFieldBlur();
  };

  const removeSuccess = () => {
    const newSuccesses = Math.max(0, (character.deathSaveSuccesses || 0) - 1);
    onChange({ deathSaveSuccesses: newSuccesses });
    onFieldBlur();
  };

  const addFailure = () => {
    const newFailures = Math.min(3, (character.deathSaveFailures || 0) + 1);
    onChange({ deathSaveFailures: newFailures });
    onFieldBlur();
  };

  const removeFailure = () => {
    const newFailures = Math.max(0, (character.deathSaveFailures || 0) - 1);
    onChange({ deathSaveFailures: newFailures });
    onFieldBlur();
  };

  const resetDeathSaves = () => {
    onChange({ deathSaveSuccesses: 0, deathSaveFailures: 0 });
    onFieldBlur();
  };

  return (
    <SectionCard id="death-saves" title="Death Saves" icon={<Skull className="h-5 w-5" />}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addSuccess}
            disabled={editMode || (character.deathSaveSuccesses || 0) >= 3}
            className={`btn flex items-center gap-1.5 ${
              (character.deathSaveSuccesses || 0) >= 3
                ? "bg-[var(--color-success-100)] border-[var(--color-success-300)] text-[var(--color-success-700)] cursor-not-allowed opacity-50"
                : "btn-secondary"
            }`}
            title="Add Success"
          >
            <Check className="h-4 w-4" />
            <span>Success</span>
          </button>
          <button
            type="button"
            onClick={addFailure}
            disabled={editMode || (character.deathSaveFailures || 0) >= 3}
            className={`btn flex items-center gap-1.5 ${
              (character.deathSaveFailures || 0) >= 3
                ? "bg-[var(--color-error-100)] border-[var(--color-error-300)] text-[var(--color-error-700)] cursor-not-allowed opacity-50"
                : "btn-secondary"
            }`}
            title="Add Failure"
          >
            <X className="h-4 w-4" />
            <span>Failure</span>
          </button>
        </div>
        {(character.deathSaveSuccesses >= 3 || character.deathSaveFailures >= 3) && (
          <p className="text-xs text-center font-semibold text-[var(--color-error-500)]">
            {character.deathSaveSuccesses >= 3 ? "Stable" : "Dead"}
          </p>
        )}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Successes</span>
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
                       ? <Check className="h-4 w-4" color="var(--color-success-500)" />
                       : <Circle className="h-4 w-4" color="var(--color-border)" />}
                  </span>
                ))}
            {editMode && (
              <button
                type="button"
                onClick={removeSuccess}
                disabled={(character.deathSaveSuccesses || 0) === 0}
                className="btn-ghost ml-2 px-2 py-1"
                title="Remove Success"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Failures</span>
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
                       ? <X className="h-4 w-4" color="var(--color-error-500)" />
                       : <Circle className="h-4 w-4" color="var(--color-border)" />}
                  </span>
                ))}
            {editMode && (
              <button
                type="button"
                onClick={removeFailure}
                disabled={(character.deathSaveFailures || 0) === 0}
                className="btn-ghost ml-2 px-2 py-1"
                title="Remove Failure"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {editMode && (
          <button
            type="button"
            onClick={resetDeathSaves}
            className="btn-ghost text-xs"
          >
            Reset
          </button>
        )}
      </div>
    </SectionCard>
  );
}

