"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DiceIcon as DiceFive } from "@/components/icons";
import type { Character } from "@/lib/storage";

interface HitDiceSectionProps {
  character: Pick<Character, "hitDiceTotal" | "hitDiceRemaining">;
  onChange: (patch: Partial<Pick<Character, "hitDiceTotal" | "hitDiceRemaining">>) => void;
  editMode?: boolean;
}

export function HitDiceSection({ character, onChange, editMode = true }: HitDiceSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="hit-dice" title="Hit Dice" icon={<DiceFive className="h-5 w-5" />}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="TOTAL">
          {editMode ? (
            <input
              type="text"
              value={character.hitDiceTotal}
              onChange={(e) => onChange({ hitDiceTotal: e.target.value })}
              onBlur={onFieldBlur}
              className="input"
              placeholder="e.g. 10d8"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.hitDiceTotal || "—"}</span>
          )}
        </Field>
        <Field label="REMAINING">
          {editMode ? (
            <input
              type="number"
              value={character.hitDiceRemaining}
              onChange={(e) => onChange({ hitDiceRemaining: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.hitDiceRemaining}</span>
          )}
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="field-label-light">{label}</span>
      {children}
    </div>
  );
}

