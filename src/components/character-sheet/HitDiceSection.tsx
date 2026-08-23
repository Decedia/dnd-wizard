"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface HitDiceSectionProps {
  character: Pick<Character, "hitDiceTotal" | "hitDiceRemaining">;
  onChange: (patch: Partial<Pick<Character, "hitDiceTotal" | "hitDiceRemaining">>) => void;
  editMode?: boolean;
}

export function HitDiceSection({ character, onChange, editMode = true }: HitDiceSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="hit-dice" title="HIT DICE" icon={<DiceIcon className="h-5 w-5" />}>
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
            <span className="text-sm font-semibold text-parchment">{character.hitDiceTotal || "—"}</span>
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
            <span className="text-sm font-semibold text-accent">{character.hitDiceRemaining}</span>
          )}
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <circle cx="15.5" cy="8.5" r="1.5" />
      <circle cx="8.5" cy="15.5" r="1.5" />
      <circle cx="15.5" cy="15.5" r="1.5" />
    </svg>
  );
}
