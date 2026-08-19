"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface CombatStatsSectionProps {
  character: Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed">>) => void;
}

export function CombatStatsSection({ character, onChange }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="combat" title="Combat Stats" icon={<CombatIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="AC">
          <input
            type="number"
            value={character.ac}
            onChange={(e) => onChange({ ac: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Current HP">
          <input
            type="number"
            value={character.currentHp}
            onChange={(e) => onChange({ currentHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Max HP">
          <input
            type="number"
            value={character.maxHp}
            onChange={(e) => onChange({ maxHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Temporary HP">
          <input
            type="number"
            value={character.temporaryHp}
            onChange={(e) => onChange({ temporaryHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Speed">
          <input
            type="number"
            value={character.speed}
            onChange={(e) => onChange({ speed: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function CombatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  );
}
