"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { ShieldStat } from "./styled/ShieldStat";
import { SpeedStat } from "./styled/SpeedStat";
import type { Character } from "@/lib/storage";

interface CombatStatsSectionProps {
  character: Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp">>) => void;
  editMode?: boolean;
}

export function CombatStatsSection({ character, onChange, editMode = true }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const hpPercent = character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0;

  return (
    <SectionCard id="combat-stats" title="COMBAT STATS" icon={<CombatIcon className="h-5 w-5" />}>
      {editMode ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="custom-hp"
            checked={character.isCustomHp || false}
            onChange={(e) => onChange({ isCustomHp: e.target.checked })}
            onBlur={onFieldBlur}
            className="checkbox"
          />
          <label htmlFor="custom-hp" className="text-xs font-semibold text-paper cursor-pointer select-none">
            Custom HP
          </label>
        </div>
      ) : (
        character.isCustomHp && (
          <div className="mb-3 text-xs font-semibold text-ink-muted">Custom HP enabled</div>
        )
      )}

      <div className="flex items-center justify-center gap-4 mb-3">
        <ShieldStat value={character.ac} />
        <SpeedStat value={character.speed} />
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="field-label-light mb-0">HP</span>
            <span className="text-[10px] font-semibold text-ink-muted">
              {character.currentHp} / {character.maxHp}
            </span>
          </div>
          <div className="progress-track-light">
            <div
              className="progress-fill-light"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="field-label-light mb-0">Temp HP</span>
            <span className="text-[10px] font-semibold text-ink-muted">{character.temporaryHp}</span>
          </div>
          <div className="progress-track-light">
            <div
              className="progress-fill-light"
              style={{ width: character.temporaryHp > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>
      </div>

      {editMode && (
        <div className="grid grid-cols-2 gap-2.5 mt-3.5">
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
          <Field label="Temp HP">
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
      )}
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

function CombatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  );
}
