"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface SpellcastingStatsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function SpellcastingStatsSection({ character, onChange, editMode = true }: SpellcastingStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const updateCantrip = (id: string, name: string) => {
    onChange({
      cantrips: character.cantrips.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    });
  };

  const addCantrip = () => {
    onChange({
      cantrips: [
        ...character.cantrips,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "" },
      ],
    });
  };

  const removeCantrip = (id: string) => {
    onChange({
      cantrips: character.cantrips.filter((c) => c.id !== id),
    });
  };

  const updateSpellSlot = (level: number, field: "total" | "expended", value: number) => {
    onChange({
      [field === "total" ? "spellSlots" : "spellSlotsExpended"]: {
        ...(field === "total" ? character.spellSlots : character.spellSlotsExpended),
        [level]: Math.max(0, value),
      },
    });
  };

  return (
    <SectionCard id="spellcasting" title="SPELLCASTING STATS" icon={<SpellcastingIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="SPELLCASTING ABILITY">
          {editMode ? (
            <input
              type="text"
              value={character.spellcastingAbility}
              readOnly
              className="input bg-charcoal/60"
            />
          ) : (
            <span className="text-sm font-semibold text-parchment">{character.spellcastingAbility || "—"}</span>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SPELL SAVE DC">
            {editMode ? (
              <input
                type="number"
                value={character.spellSaveDc}
                readOnly
                className="input bg-charcoal/60"
              />
            ) : (
              <span className="text-sm font-semibold text-accent">{character.spellSaveDc}</span>
            )}
          </Field>
          <Field label="SPELL ATTACK BONUS">
            {editMode ? (
              <input
                type="number"
                value={character.spellAttackBonus}
                readOnly
                className="input bg-charcoal/60"
              />
            ) : (
              <span className="text-sm font-semibold text-accent">{character.spellAttackBonus >= 0 ? `+${character.spellAttackBonus}` : character.spellAttackBonus}</span>
            )}
          </Field>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-2">Cantrips</span>
        <div className="space-y-2">
          {character.cantrips.map((cantrip) => (
            <div key={cantrip.id} className="flex items-center gap-2 rounded-lg border border-border bg-charcoal px-3 py-2">
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={cantrip.name}
                    onChange={(e) => updateCantrip(cantrip.id, e.target.value)}
                    onBlur={onFieldBlur}
                    className="input flex-1"
                    placeholder="Cantrip name"
                  />
                  <button
                    type="button"
                    onClick={() => removeCantrip(cantrip.id)}
                    className="text-text-muted hover:text-parchment"
                    aria-label="Remove cantrip"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-sm font-medium text-parchment">{cantrip.name || "Unnamed Cantrip"}</span>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <button
            type="button"
            onClick={addCantrip}
            className="mt-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-parchment"
          >
            + Add Cantrip
          </button>
        )}
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-2">Spell Slots</span>
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
            const total = character.spellSlots[level] ?? 0;
            const expended = character.spellSlotsExpended[level] ?? 0;
            return (
              <div key={level} className="flex items-center gap-3 rounded-lg border border-border bg-charcoal px-3 py-2">
                <span className="text-sm text-parchment w-16">Level {level}</span>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={total}
                      onChange={(e) => updateSpellSlot(level, "total", parseInt(e.target.value || "0", 10))}
                      onBlur={onFieldBlur}
                      className="input w-16 text-center"
                      placeholder="Total"
                    />
                    <span className="text-text-muted">/</span>
                    <input
                      type="number"
                      value={expended}
                      onChange={(e) => updateSpellSlot(level, "expended", parseInt(e.target.value || "0", 10))}
                      onBlur={onFieldBlur}
                      className="input w-16 text-center"
                      placeholder="Used"
                    />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-parchment">
                    {total} / {expended} used
                  </span>
                )}
              </div>
            );
          })}
        </div>
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SpellcastingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
