"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { ShieldStat } from "./styled/ShieldStat";
import { SpeedStat } from "./styled/SpeedStat";
import { Sword, Sparkle, Heart, Drop } from "phosphor-react";
import type { Character } from "@/lib/storage";
import { useState, useCallback } from "react";
import { X } from "phosphor-react";

interface CombatStatsSectionProps {
  character: Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp" | "class" | "sorceryPoints" | "maxSorceryPoints">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp" | "sorceryPoints" | "maxSorceryPoints">>) => void;
  editMode?: boolean;
}

export function CombatStatsSection({ character, onChange, editMode = true }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const hpPercent = character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0;
  const isSorcerer = character.class === "Sorcerer";
  const [hpModal, setHpModal] = useState<{ mode: "heal" | "damage" } | null>(null);
  const [hpAmount, setHpAmount] = useState("");

  const handleHpAction = useCallback(() => {
    const amount = parseInt(hpAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    if (hpModal?.mode === "heal") {
      onChange({ currentHp: Math.min(character.maxHp, character.currentHp + amount) });
    } else if (hpModal?.mode === "damage") {
      const tempHp = character.temporaryHp || 0;
      let remainingDamage = amount;
      let newTempHp = tempHp;
      let newHp = character.currentHp;
      if (tempHp > 0) {
        if (tempHp >= amount) {
          newTempHp = tempHp - amount;
          remainingDamage = 0;
        } else {
          newTempHp = 0;
          remainingDamage = amount - tempHp;
        }
      }
      if (remainingDamage > 0) {
        newHp = Math.max(0, character.currentHp - remainingDamage);
      }
      onChange({ currentHp: newHp, temporaryHp: newTempHp });
    }
    setHpModal(null);
    setHpAmount("");
  }, [hpModal, hpAmount, character, onChange]);

  return (
    <SectionCard id="combat-stats" title="Combat Stats" icon={<Sword weight="regular" className="h-5 w-5" />}>
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
          <label htmlFor="custom-hp" className="text-xs font-semibold text-ink cursor-pointer select-none">
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

      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="field-label-light mb-0">HP</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-ink-muted">
                {character.currentHp} / {character.maxHp}
              </span>
            </div>
          </div>
          <div className="progress-track" style={{ height: "12px" }}>
            <div
              className="progress-fill"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="field-label-light mb-0">Temp HP</span>
            <span className="text-[10px] font-semibold text-ink-muted">{character.temporaryHp}</span>
          </div>
          <div className="progress-track" style={{ height: "12px" }}>
            <div
              className="progress-fill"
              style={{ width: character.temporaryHp > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>

        {isSorcerer && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="field-label-light mb-0 flex items-center gap-1">
                <Sparkle weight="regular" className="h-3 w-3" />
                Sorcery Points
              </span>
              <span className="text-[10px] font-semibold text-ink-muted">
                {character.sorceryPoints} / {character.maxSorceryPoints}
              </span>
            </div>
            <div className="progress-track" style={{ height: "12px" }}>
              <div
                className="progress-fill"
                style={{ width: character.maxSorceryPoints > 0 ? `${Math.min(100, Math.max(0, (character.sorceryPoints / character.maxSorceryPoints) * 100))}%` : "0%" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setHpModal({ mode: "heal" })}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-success-200)] text-[var(--color-success-700)] hover:bg-[var(--color-success-50)] transition-all"
        >
          <Heart className="h-4 w-4" weight="fill" />
          <span className="text-xs font-semibold">Heal</span>
        </button>
        <button
          type="button"
          onClick={() => setHpModal({ mode: "damage" })}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-error-200)] text-[var(--color-error-700)] hover:bg-[var(--color-error-50)] transition-all"
        >
          <Drop className="h-4 w-4" weight="fill" />
          <span className="text-xs font-semibold">Damage</span>
        </button>
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
          {isSorcerer && (
            <>
              <Field label="Sorcery Points">
                <input
                  type="number"
                  value={character.sorceryPoints}
                  onChange={(e) => onChange({ sorceryPoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                  onBlur={onFieldBlur}
                  className="input"
                />
              </Field>
              <Field label="Max Sorcery Points">
                <input
                  type="number"
                  value={character.maxSorceryPoints}
                  onChange={(e) => onChange({ maxSorceryPoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                  onBlur={onFieldBlur}
                  className="input"
                />
              </Field>
            </>
          )}
        </div>
      )}
      {hpModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setHpModal(null); setHpAmount(""); } }}
        >
          <div className="w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                {hpModal.mode === "heal" ? "Heal" : "Take Damage"}
              </div>
              <button
                type="button"
                onClick={() => { setHpModal(null); setHpAmount(""); }}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-4 py-4">
              <label className="field-label-light">Amount</label>
              <input
                type="number"
                value={hpAmount}
                onChange={(e) => setHpAmount(e.target.value)}
                placeholder="Enter amount..."
                className="input w-full mt-1"
                autoFocus
                min={1}
              />
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
              <button
                type="button"
                onClick={() => { setHpModal(null); setHpAmount(""); }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHpAction}
                disabled={!hpAmount || parseInt(hpAmount, 10) <= 0}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  hpAmount && parseInt(hpAmount, 10) > 0
                    ? hpModal.mode === "heal"
                      ? "bg-[var(--color-success-600)] text-white hover:opacity-90"
                      : "bg-[var(--color-error-600)] text-white hover:opacity-90"
                    : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
                }`}
              >
                {hpModal.mode === "heal" ? "Heal" : "Apply"}
              </button>
            </div>
          </div>
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
