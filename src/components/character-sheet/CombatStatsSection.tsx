"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { ShieldStat } from "./styled/ShieldStat";
import type { Character } from "@/lib/storage";

interface CombatStatsSectionProps {
  character: Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp">>) => void;
  editMode?: boolean;
}

export function CombatStatsSection({ character, onChange, editMode = true }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="combat" title="COMBAT STATS" icon={<CombatIcon className="h-5 w-5" />}>
      {editMode ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="custom-hp"
            checked={character.isCustomHp || false}
            onChange={(e) => onChange({ isCustomHp: e.target.checked })}
            onBlur={onFieldBlur}
            className="h-4 w-4 rounded border-border bg-charcoal text-burgundy focus:ring-burgundy/50"
          />
          <label htmlFor="custom-hp" className="text-xs font-medium text-text-secondary cursor-pointer select-none">
            Custom HP
          </label>
        </div>
      ) : (
        character.isCustomHp && (
          <div className="mb-3 text-xs font-medium text-text-muted">Custom HP enabled</div>
        )
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center">
          <ShieldStat value={character.ac} />
        </div>
        <Field label="Current HP">
          {editMode ? (
            <input
              type="number"
              value={character.currentHp}
              onChange={(e) => onChange({ currentHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-burgundy">{character.currentHp}</span>
          )}
        </Field>
        <Field label="Max HP">
          {editMode ? (
            <input
              type="number"
              value={character.maxHp}
              onChange={(e) => onChange({ maxHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-burgundy">{character.maxHp}</span>
          )}
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Temporary HP">
          {editMode ? (
            <input
              type="number"
              value={character.temporaryHp}
              onChange={(e) => onChange({ temporaryHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-burgundy">{character.temporaryHp}</span>
          )}
        </Field>
        <Field label="Speed">
          {editMode ? (
            <input
              type="number"
              value={character.speed}
              onChange={(e) => onChange({ speed: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-burgundy">{character.speed}ft</span>
          )}
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
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
