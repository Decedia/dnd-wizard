"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { SparklesIcon as Sparkle } from "@/components/icons";
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

  const useSpellSlot = (level: number) => {
    const total = character.spellSlots[level] ?? 0;
    const expended = character.spellSlotsExpended[level] ?? 0;
    if (expended < total) {
      updateSpellSlot(level, "expended", expended + 1);
    }
  };

  const restoreSpellSlot = (level: number) => {
    const expended = character.spellSlotsExpended[level] ?? 0;
    if (expended > 0) {
      updateSpellSlot(level, "expended", expended - 1);
    }
  };

  return (
    <SectionCard id="spellcasting" title="Spellcasting Stats" icon={<Sparkle className="h-5 w-5" />}>
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
        <span className="field-label-light">Spell Slots</span>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Spell slots represent your magical energy for casting spells. Higher level slots can cast lower level spells, and some spells can be upcast using higher level slots.</p>
        {Object.keys(character.spellSlots).length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(character.spellSlots)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, total]) => {
                const expended = character.spellSlotsExpended[Number(level)] ?? 0;
                const remaining = total - expended;
                return (
                  <div key={level} className="list-row flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--color-text-primary)] w-16">Level {level}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${remaining > 0 ? "text-[var(--color-success-600)]" : "text-[var(--color-error-500)]"}`}>
                        {remaining}
                      </span>
                      <span className="text-sm text-[var(--color-text-muted)]">/</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{total}</span>
                      <button
                        type="button"
                        onClick={() => useSpellSlot(Number(level))}
                        disabled={remaining <= 0}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                          remaining > 0
                            ? "bg-[var(--color-ink)] text-[var(--color-surface)] hover:bg-[var(--color-text-primary)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40 cursor-not-allowed"
                        }`}
                      >
                        Use
                      </button>
                      <button
                        type="button"
                        onClick={() => restoreSpellSlot(Number(level))}
                        disabled={expended <= 0}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                          expended > 0
                            ? "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40 cursor-not-allowed"
                        }`}
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">No spell slots</p>
        )}
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
