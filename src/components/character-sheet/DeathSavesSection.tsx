"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { SkullIcon as Skull, CircleIcon as Circle, DiceIcon as DiceD20 } from "@/components/icons";
import { Dice } from "@/components/Dice";
import type { Character } from "@/lib/storage";

interface DeathSavesSectionProps {
  character: Pick<Character, "deathSaveSuccesses" | "deathSaveFailures" | "currentHp" | "maxHp">;
  onChange: (patch: Partial<Pick<Character, "deathSaveSuccesses" | "deathSaveFailures" | "currentHp">>) => void;
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

  const handleDeathSaveRoll = (roll: number) => {
    if (roll === 20) {
      // Natural 20: regain 1 HP, become stable (clear death saves)
      onChange({
        currentHp: 1,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
      });
    } else if (roll === 1) {
      // Natural 1: two failures
      const newFailures = Math.min(3, character.deathSaveFailures + 2);
      onChange({ deathSaveFailures: newFailures });
    } else if (roll >= 10) {
      // Success (10-19)
      const newSuccesses = Math.min(3, character.deathSaveSuccesses + 1);
      onChange({ deathSaveSuccesses: newSuccesses });
    } else {
      // Failure (2-9)
      const newFailures = Math.min(3, character.deathSaveFailures + 1);
      onChange({ deathSaveFailures: newFailures });
    }
    onFieldBlur();
  };

  return (
    <SectionCard id="death-saves" title="Death Saves" icon={<Skull className="h-5 w-5" />}>
      <div className="flex flex-col items-center gap-4">
        <Dice type="d20" size={64} onRoll={handleDeathSaveRoll} />
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          20 = 1 HP & stable | 1 = 2 failures | 10+ = success | 2-9 = failure
        </p>
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
                       ? <Circle size={12} color="var(--color-success-500)" />
                       : <Circle size={12} color="var(--color-border)" />}
                  </span>
                ))}
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
                       ? <Circle size={12} color="var(--color-error-500)" />
                       : <Circle size={12} color="var(--color-border)" />}
                  </span>
                ))}
          </div>
        </div>
        {(character.deathSaveSuccesses >= 3 || character.deathSaveFailures >= 3) && (
          <p className="text-xs text-center font-semibold text-[var(--color-error-500)]">
            {character.deathSaveSuccesses >= 3 ? "Stable" : "Dead"}
          </p>
        )}
      </div>
    </SectionCard>
  );
}

