"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { ShieldStat } from "./styled/ShieldStat";
import { SpeedStat } from "./styled/SpeedStat";
import { SwordIcon as Sword, SparklesIcon as Sparkle, HeartBottleIcon as Heart, DropIcon as Drop } from "@/components/icons";
import type { Character } from "@/lib/storage";
import { useState, useCallback } from "react";
import { XIcon as X } from "@/components/icons";
import { StateTracker } from "./StateTracker";
import { BuffTracker } from "./BuffTracker";
import { Dice } from "@/components/Dice";

interface CombatStatsSectionProps {
  character: Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp" | "class" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "isCustomHp" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel">>) => void;
  editMode?: boolean;
}

export function CombatStatsSection({ character, onChange, editMode = true }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const hpPercent = character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0;
  const isSorcerer = character.class === "Sorcerer";
  const [hpModal, setHpModal] = useState<{ mode: "heal" | "damage" } | null>(null);
  const [hpAmount, setHpAmount] = useState("");
  const [concentrationCheck, setConcentrationCheck] = useState<{ damage: number; roll?: number } | null>(null);

  // Check if character has active concentration spells
  const hasConcentration = (character.activeBuffs || []).some((b) => b.concentration);
  const isWarCaster = (character.features || []).some((f) => f.name.toLowerCase().includes("war caster"));

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
      
      // Trigger concentration check if taking damage while concentrating
      if (hasConcentration && remainingDamage > 0) {
        setConcentrationCheck({ damage: remainingDamage });
      }
    }
    setHpModal(null);
    setHpAmount("");
  }, [hpModal, hpAmount, character, onChange, hasConcentration]);

  return (
    <SectionCard id="combat-stats" title="Combat Stats" icon={<Sword className="h-5 w-5" />}>
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
                <Sparkle className="h-3 w-3" />
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
          <Heart className="h-4 w-4" />
          <span className="text-xs font-semibold">Heal</span>
        </button>
        <button
          type="button"
          onClick={() => setHpModal({ mode: "damage" })}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-error-200)] text-[var(--color-error-700)] hover:bg-[var(--color-error-50)] transition-all"
        >
          <Drop className="h-4 w-4" />
          <span className="text-xs font-semibold">Damage</span>
        </button>
      </div>

      {/* Combat Action Tracker */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onChange({ actionUsed: !character.actionUsed })}
          disabled={!editMode}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all ${
            character.actionUsed
              ? "bg-[var(--color-success-100)] border-[var(--color-success-300)] text-[var(--color-success-700)]"
              : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {character.actionUsed ? "✓" : "○"}
          </span>
          <span>Action</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ bonusActionUsed: !character.bonusActionUsed })}
          disabled={!editMode}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all ${
            character.bonusActionUsed
              ? "bg-[var(--color-info-100)] border-[var(--color-info-300)] text-[var(--color-info-700)]"
              : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {character.bonusActionUsed ? "✓" : "○"}
          </span>
          <span>Bonus Action</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ reactionUsed: !character.reactionUsed })}
          disabled={!editMode}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all ${
            character.reactionUsed
              ? "bg-[var(--color-warning-100)] border-[var(--color-warning-300)] text-[var(--color-warning-700)]"
              : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {character.reactionUsed ? "✓" : "○"}
          </span>
          <span>Reaction</span>
        </button>
      </div>

      {/* Exhaustion Level Tracker */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="field-label-light mb-0">Exhaustion</span>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Level {character.exhaustionLevel || 0} / 6
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ exhaustionLevel: level })}
              disabled={!editMode}
              className={`flex-1 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border text-xs font-semibold transition-all ${
                (character.exhaustionLevel || 0) >= level && level > 0
                  ? "bg-[var(--color-error-100)] border-[var(--color-error-300)] text-[var(--color-error-700)]"
                  : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)]"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        {(character.exhaustionLevel || 0) > 0 && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {(() => {
              const l = character.exhaustionLevel || 0;
              const effects = [
                "Disadvantage on ability checks",
                "Speed halved",
                "Disadvantage on attack rolls and saving throws",
                "Hit point maximum halved",
                "Speed reduced to 0",
                "Death"
              ];
              return effects.slice(0, l).join("; ");
            })()}
          </p>
        )}
      </div>

      <StateTracker
        activeStates={character.activeStates || []}
        onToggle={(stateId) => {
          const current = character.activeStates || [];
          if (current.includes(stateId)) {
            onChange({ activeStates: current.filter((s) => s !== stateId) });
          } else {
            onChange({ activeStates: [...current, stateId] });
          }
        }}
        onReset={() => onChange({ activeStates: [] })}
        editMode={editMode}
      />

      <BuffTracker
        activeBuffs={character.activeBuffs || []}
        onToggleBuff={(spellId, name, concentration) => {
          const current = character.activeBuffs || [];
          if (current.some((b) => b.spellId === spellId)) {
            onChange({ activeBuffs: current.filter((b) => b.spellId !== spellId) });
          } else {
            onChange({ activeBuffs: [...current, { spellId, name, concentration, turnsRemaining: null }] });
          }
        }}
        onClearAll={() => onChange({ activeBuffs: [] })}
        onBreakConcentration={() => {
          const current = character.activeBuffs || [];
          onChange({ activeBuffs: current.filter((b) => !b.concentration) });
        }}
        editMode={editMode}
        className="mt-3"
        filterClass={character.class}
      />

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
            {hpModal?.mode === "damage" && (character.activeBuffs || []).some(b => b.concentration) && !concentrationCheck && (
              <div className="mx-4 mb-3 px-3 py-2 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs">⚠️</span>
                  <span className="text-[10px] font-semibold text-[var(--color-warning-700)]">
                    Concentration check required! Roll DC {Math.max(10, Math.floor(parseInt(hpAmount || "0", 10) / 2))} CON save
                  </span>
                </div>
                <div className="mt-2">
                  <Dice type="d20" size={56} advantage={isWarCaster ? "advantage" : "normal"} onRoll={(roll) => setConcentrationCheck({ damage: parseInt(hpAmount || "0", 10), roll })} />
                  {isWarCaster && <p className="text-center text-[10px] text-[var(--color-success-600)] mt-1">War Caster: rolling with advantage</p>}
                </div>
              </div>
            )}
            {concentrationCheck && (
              <div className="mx-4 mb-3 px-3 py-2 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🎲</span>
                  <span className="text-[10px] font-semibold text-[var(--color-warning-700)]">
                    Rolled: {concentrationCheck.roll}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = character.activeBuffs || [];
                      onChange({ activeBuffs: current.filter((b) => !b.concentration) });
                      handleHpAction();
                    }}
                    className="flex-1 text-[10px] font-semibold text-[var(--color-error-600)] hover:text-[var(--color-error-700)] underline py-1"
                  >
                    Failed — Break Concentration
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConcentrationCheck(null); handleHpAction(); }}
                    className="flex-1 text-[10px] font-semibold text-[var(--color-success-600)] hover:text-[var(--color-success-700)] underline py-1"
                  >
                    Success — Maintain
                  </button>
                </div>
              </div>
            )}
            <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
              <button
                type="button"
                onClick={() => { setHpModal(null); setHpAmount(""); setConcentrationCheck(null); }}
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
