"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { X, Sparkle, Plus } from "phosphor-react";
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
    <SectionCard id="spellcasting" title="SPELLCASTING STATS" icon={<Sparkle weight="regular" className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="SPELLCASTING ABILITY">
          {editMode ? (
            <input
              type="text"
              value={character.spellcastingAbility}
              readOnly
              className="input bg-paper-muted"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.spellcastingAbility || "—"}</span>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SPELL SAVE DC">
            {editMode ? (
              <input
                type="number"
                value={character.spellSaveDc}
                readOnly
                className="input bg-paper-muted"
              />
            ) : (
              <span className="text-sm font-bold text-ink">{character.spellSaveDc}</span>
            )}
          </Field>
          <Field label="SPELL ATTACK BONUS">
            {editMode ? (
              <input
                type="number"
                value={character.spellAttackBonus}
                readOnly
                className="input bg-paper-muted"
              />
            ) : (
              <span className="text-sm font-bold text-ink">{character.spellAttackBonus >= 0 ? `+${character.spellAttackBonus}` : character.spellAttackBonus}</span>
            )}
          </Field>
        </div>
      </div>

      <div className="mt-4">
        <span className="field-label-light">Cantrips</span>
        <div className="space-y-2">
          {character.cantrips.map((cantrip) => (
            <div key={cantrip.id} className="list-row flex items-center gap-2">
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
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    aria-label="Remove cantrip"
                  >
                    <X weight="regular" className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{cantrip.name || "Unnamed Cantrip"}</span>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <button
            type="button"
            onClick={addCantrip}
            className="mt-2 btn-secondary flex items-center gap-1.5"
          >
            <Plus weight="regular" size={16} />
            Add Cantrip
          </button>
        )}
      </div>

      <div className="mt-4">
        <span className="field-label-light">Spell Slots</span>
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
            const total = character.spellSlots[level] ?? 0;
            const expended = character.spellSlotsExpended[level] ?? 0;
            return (
               <div key={level} className="list-row flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--color-text-primary)] w-16">Level {level}</span>
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
                    <span className="text-[var(--color-text-secondary)] font-bold">/</span>
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
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {total} / {expended} used
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {character.class === "Sorcerer" && (
        <div className="mt-4">
          <span className="field-label-light">Creating Spell Slots (Flexible Casting)</span>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {[
              { level: "1st", cost: 2 },
              { level: "2nd", cost: 3 },
              { level: "3rd", cost: 5 },
              { level: "4th", cost: 6 },
              { level: "5th", cost: 7 },
            ].map((slot) => (
              <div key={slot.level} className="text-center p-2 bg-[var(--color-bg)] rounded">
                <div className="text-xs font-bold text-[var(--color-text-primary)]">{slot.level}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{slot.cost} SP</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
            You can also convert a spell slot into sorcery points equal to the slot&apos;s level.
          </p>
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
