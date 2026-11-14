"use client";

import { Overridable } from "./Overridable";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { SparklesIcon as Sparkle } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { spellAttackParts } from "@/lib/roll-parts";

interface SpellcastingStatsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function SpellcastingStatsSection({ character, onChange, editMode = true }: SpellcastingStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();

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

  const spendSpellSlot = (level: number) => {
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
    <SectionCard id="spellcasting" title={t("section.spellcastingStats")} icon={<Sparkle className="h-5 w-5" />}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-control-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
          {t("spellcasting.attackBonus")}
          <Overridable id="spellAttackBonus" label={t("spellcasting.attackBonus")} signed editMode={editMode} roll={character.spellAttackBonus} rollParts={spellAttackParts(character)} className="text-sm font-bold text-[var(--color-gold)]">
            {character.spellAttackBonus >= 0 ? `+${character.spellAttackBonus}` : character.spellAttackBonus}
          </Overridable>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-control-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
          {t("spellcasting.saveDc")}
          <Overridable id="spellSaveDc" label={t("spellcasting.saveDc")} editMode={editMode} className="text-sm font-bold text-[var(--color-gold)]">
            {character.spellSaveDc}
          </Overridable>
        </span>
        {character.spellcastingAbility && (
          <span className="rounded-full border border-[var(--color-control-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-primary)]">{character.spellcastingAbility.toUpperCase()}</span>
        )}
      </div>

      <div>
        <span className="field-label-light">{t("spellcasting.slots")}</span>
        {Object.keys(character.spellSlots).length > 0 ? (
          <>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {Object.entries(character.spellSlots)
                .filter(([, total]) => total > 0)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, total]) => {
                  const expended = character.spellSlotsExpended[Number(level)] ?? 0;
                  const remaining = total - expended;
                  return (
                    <div key={level} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-2">
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[var(--color-text-primary)]">{t("spellcasting.slotLevel", { level }, "Level {level}")}</span>
                        <span className="text-[var(--color-text-muted)]">{remaining}/{total}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: total }, (_, i) => {
                          const filled = i < remaining;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => (filled ? spendSpellSlot(Number(level)) : restoreSpellSlot(Number(level)))}
                              aria-label={filled ? t("spellcasting.use") : t("spellcasting.restore")}
                              className={`h-4 w-4 rounded-full border-2 transition-colors ${filled ? "border-[var(--color-gold)] bg-[var(--color-gold)]" : "border-[var(--color-control-border)] bg-transparent"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">{t("spellcasting.pipHint", "Tap a gold dot to use a slot, an empty one to get it back.")}</p>
          </>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{t("spellcasting.noSlots")}</p>
        )}
      </div>
      {character.class === "Sorcerer" && (
        <div className="mt-4">
          <span className="field-label-light">{t("spellcasting.flexibleCasting")}</span>
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
            {t("spellcasting.convertSlot")}
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
