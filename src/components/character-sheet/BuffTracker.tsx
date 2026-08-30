"use client";

import { Sparkle, X } from "phosphor-react";
import { BUFF_DEFINITIONS, type BuffDefinition } from "@/lib/spellEffects";

interface BuffTrackerProps {
  activeBuffs: { spellId: string; name: string; concentration: boolean }[];
  onToggleBuff: (spellId: string, name: string, concentration: boolean) => void;
  onClearAll: () => void;
  className?: string;
  editMode?: boolean;
  filterClass?: string;
}

export function BuffTracker({ activeBuffs, onToggleBuff, onClearAll, className = "", editMode = true, filterClass }: BuffTrackerProps) {
  const allBuffs = Object.values(BUFF_DEFINITIONS);
  const availableBuffs = filterClass
    ? allBuffs.filter(b => b.classes.includes(filterClass))
    : allBuffs;
  const activeSpellIds = activeBuffs.map((b) => b.spellId);
  const hasConcentration = activeBuffs.some((b) => b.concentration);

  if (!editMode && activeBuffs.length === 0) return null;

  return (
    <div className={className}>
      {editMode && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {availableBuffs.map((buff) => {
            const isActive = activeSpellIds.includes(buff.id);
            if (isActive && !editMode) return null;
            return (
              <button
                key={buff.id}
                type="button"
                onClick={() => onToggleBuff(buff.id, buff.name, buff.concentration)}
                disabled={!isActive && hasConcentration && buff.concentration}
                className={`inline-flex items-center gap-1 rounded border text-[10px] font-semibold transition-all px-2 py-1 ${
                  isActive
                    ? "opacity-100 border-[var(--color-border-active)] bg-[var(--color-accent)] text-[var(--color-surface)]"
                    : "opacity-50 hover:opacity-70 border-[var(--color-border)] text-[var(--color-text-muted)]"
                } ${!isActive && hasConcentration && buff.concentration ? "cursor-not-allowed opacity-30" : ""}`}
                title={!isActive && hasConcentration && buff.concentration ? "Concentration already active" : buff.effects.map((e) => e.description).join("; ")}
              >
                <Sparkle className="h-3 w-3" />
                <span>{buff.name}</span>
                {buff.concentration && <span className="text-[8px] opacity-70">C</span>}
              </button>
            );
          })}
        </div>
      )}
      {activeBuffs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeBuffs.map((buff) => {
            const def = BUFF_DEFINITIONS[buff.spellId];
            const effectDesc = def?.effects.map(e => e.description).join("; ") || "";
            return (
              <span
                key={buff.spellId}
                className="inline-flex items-center gap-1 rounded border border-[var(--color-border-active)] bg-[var(--color-accent)] text-[var(--color-surface)] text-[10px] font-semibold px-2 py-1"
                title={effectDesc}
              >
                <Sparkle className="h-3 w-3" />
                <span>{buff.name}</span>
                {buff.concentration && <span className="text-[8px] opacity-70">C</span>}
                {editMode && (
                  <button
                    type="button"
                    onClick={() => onToggleBuff(buff.spellId, buff.name, buff.concentration)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}
          {editMode && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
