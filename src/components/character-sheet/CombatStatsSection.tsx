"use client";

import { GiCampfire, GiNightSleep } from "react-icons/gi";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Overridable } from "./Overridable";
import { ShieldStat } from "./styled/ShieldStat";
import { SpeedStat } from "./styled/SpeedStat";
import { SwordIcon as Sword, SparklesIcon as Sparkle, HeartBottleIcon as Heart, DropIcon as Drop, LightningBoltIcon as LightningBolt, ClockIcon as Clock, ShieldCheckIcon as ShieldCheck } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBaseSpeed, type Character } from "@/lib/storage";
import { useState, useCallback } from "react";
import { XIcon as X } from "@/components/icons";
import { StateTracker } from "./StateTracker";
import { Timers } from "./Timers";
import { BuffTracker } from "./BuffTracker";
import { BasePopup } from "@/components/BasePopup";
import { initiativeParts, saveParts } from "@/lib/roll-parts";
import { useDice } from "@/contexts/DiceContext";
import { d20Group } from "@/lib/dice-roll";
import { GiRollingDices } from "react-icons/gi";

interface CombatStatsSectionProps {
  character: Pick<Character, "turnRound" | "turnActive" | "ac" | "currentHp" | "maxHp" | "effectiveMaxHp" | "temporaryHp" | "speed" | "baseSpeed" | "race" | "ruleset" | "isCustomHp" | "class" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel" | "initiative" | "hitDiceRemaining" | "hitDiceTotal" | "level" | "dex" | "con" | "savingThrows" | "overrides">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "baseSpeed" | "isCustomHp" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel">>) => void;
  editMode?: boolean;
  /** Opens the turn panel; starts a new turn when none is running. */
  onOpenTurn?: () => void;
  onRest?: (kind: "short" | "long") => void;
}

export function CombatStatsSection({ character, onChange, editMode = true, onOpenTurn, onRest }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();
  const maxHp = character.effectiveMaxHp ?? character.maxHp;
  const hpPercent = maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / maxHp) * 100)) : 0;
  const isSorcerer = character.class === "Sorcerer";
  const [hpModal, setHpModal] = useState<{ mode: "heal" | "damage" } | null>(null);
  const [hpAmount, setHpAmount] = useState("");
  const [concentrationCheck, setConcentrationCheck] = useState<{ damage: number; roll?: number } | null>(null);

  // Check if character has active concentration spells
  const hasConcentration = (character.activeBuffs || []).some((b) => b.concentration);
  const dice = useDice();
  const isWarCaster = (character.features || []).some((f) => f.name.toLowerCase().includes("war caster"));

  const handleHpAction = useCallback(() => {
    const amount = parseInt(hpAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    if (hpModal?.mode === "heal") {
      onChange({ currentHp: Math.min(maxHp, character.currentHp + amount) });
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
  }, [hpModal, hpAmount, character, onChange, hasConcentration, maxHp]);

  return (
    <SectionCard id="combat-stats" title={t("section.combatStats", "Combat Stats")} icon={<Sword className="h-5 w-5" />}>
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
            {t("button.customHp", "Custom HP")}
          </label>
        </div>
      ) : (
        character.isCustomHp && (
          <div className="mb-3 text-xs font-semibold text-ink-muted">{t("sheet.customHpEnabled")}</div>
        )
      )}

      <div className="flex items-center justify-center gap-4 mb-3">
        <Overridable id="ac" label={t("sheet.armorClass", "Armor Class")} editMode={editMode} className="no-underline">
          <ShieldStat value={character.ac} />
        </Overridable>
        <Overridable id="speed" label={t("sheet.speed", "Speed")} editMode={editMode} className="no-underline">
          <SpeedStat value={character.speed} />
        </Overridable>
        <Overridable id="initiative" label={t("sheet.initiative", "Initiative")} signed editMode={editMode} roll={character.initiative ?? 0} rollParts={initiativeParts(character)} className="no-underline">
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-[72px] w-[72px]" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="var(--color-border)" strokeWidth="1" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{t("sheet.initiativeShort", "Init")}</span>
            <span className="text-2xl font-bold text-ink">{(character.initiative ?? 0) >= 0 ? `+${character.initiative ?? 0}` : character.initiative}</span>
          </div>
        </div>
        </Overridable>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="field-label-light mb-0">HP</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-ink-muted">
                {character.currentHp} / <Overridable id="maxHp" label={t("override.maxHp", "Max HP")} editMode={editMode}>{maxHp}</Overridable>
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

        <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted">
          <span>{t("sheet.tempHp", "Temp HP")} {character.temporaryHp || 0}</span>
          <span>{t("sheet.hitDiceLeft", { left: character.hitDiceRemaining ?? character.level, total: character.hitDiceTotal ?? "" }, "Hit dice {left} left ({total})")}</span>
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
          <span className="text-xs font-semibold">{t("character.heal")}</span>
        </button>
        <button
          type="button"
          onClick={() => setHpModal({ mode: "damage" })}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-error-200)] text-[var(--color-error-700)] hover:bg-[var(--color-error-50)] transition-all"
        >
          <Drop className="h-4 w-4" />
          <span className="text-xs font-semibold">{t("character.damage")}</span>
        </button>
      </div>

      {/* Turn tracker: opens the turn panel */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--color-text-primary)]">
              {character.turnRound ? t("turn.round", { round: character.turnRound }, "Round {round}") : t("turn.notStarted", "Fight not started")}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {([
                [t("spell.action"), character.actionUsed],
                [t("spell.bonusAction"), character.bonusActionUsed],
                [t("spell.reaction"), character.reactionUsed],
              ] as [string, boolean][]).map(([label, used]) => (
                <span
                  key={label}
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${used ? "border-[var(--color-border)] text-[var(--color-text-muted)] line-through" : "border-[var(--color-border-active)] text-[var(--color-text-primary)]"}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenTurn}
            className="shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-xs font-bold text-[var(--color-surface)] hover:opacity-90"
          >
            {character.turnActive ? t("turn.continue", "Continue turn") : t("turn.start", "Start my turn")}
          </button>
        </div>
        {!character.turnRound && <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{t("turn.cardHint", "Shows everything you can do this turn, one tap each.")}</p>}
      </div>

      {onRest && (
        <div className="mt-3 flex items-center justify-center gap-3">
          {(["short", "long"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onRest(kind)}
              className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-primary)] transition-all hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)]"
            >
              {kind === "short" ? <GiCampfire className="h-4 w-4" aria-hidden="true" /> : <GiNightSleep className="h-4 w-4" aria-hidden="true" />}
              <span className="whitespace-nowrap text-xs font-semibold">{t(`rest.${kind}.title`)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Exhaustion Level Tracker */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-2">
          <span className="field-label-light mb-0">{t("combat.exhaustion")}</span>
          <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("combat.exhaustionDown", "Less exhaustion")}
            disabled={(character.exhaustionLevel || 0) <= 0}
            onClick={() => onChange({ exhaustionLevel: Math.max(0, (character.exhaustionLevel || 0) - 1) })}
            className="btn btn-secondary h-9 w-11 disabled:opacity-40"
          >
            −
          </button>
          <span
            className={`flex h-9 w-12 items-center justify-center rounded-full border-2 text-sm font-bold ${
              (character.exhaustionLevel || 0) > 0 ? "border-[var(--color-error-300)] bg-[var(--color-error-100)] text-[var(--color-error-700)]" : "border-[var(--color-border)] text-ink"
            }`}
          >
            {character.exhaustionLevel || 0}/6
          </span>
          <button
            type="button"
            aria-label={t("combat.exhaustionUp", "More exhaustion")}
            disabled={(character.exhaustionLevel || 0) >= 6}
            onClick={() => onChange({ exhaustionLevel: Math.min(6, (character.exhaustionLevel || 0) + 1) })}
            className="btn btn-secondary h-9 w-11 disabled:opacity-40"
          >
            +
          </button>
          </div>
        </div>
        {(character.exhaustionLevel || 0) > 0 && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {(() => {
              const l = character.exhaustionLevel || 0;
              const effects = [
                t("combat.exhaustion.effect.1"),
                t("combat.exhaustion.effect.2"),
                t("combat.exhaustion.effect.3"),
                t("combat.exhaustion.effect.4"),
                t("combat.exhaustion.effect.5"),
                t("combat.exhaustion.effect.6"),
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

      {!editMode && <Timers character={character as Character} onChange={onChange as (patch: Partial<Character>) => void} className="mt-3" />}
      {editMode && <BuffTracker
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
      />}

      {editMode && (
        <div className="grid grid-cols-2 gap-2.5 mt-3.5">
          <Field label={t("sheet.currentHp", "Current HP")}>
            <input
              type="number"
              value={character.currentHp}
              onChange={(e) => onChange({ currentHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          </Field>
          <Field label={t("sheet.maxHp", "Max HP")}>
            <input
              type="number"
              value={character.maxHp}
              onChange={(e) => onChange({ maxHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          </Field>
          <Field label={t("sheet.tempHp", "Temp HP")}>
            <input
              type="number"
              value={character.temporaryHp}
              onChange={(e) => onChange({ temporaryHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          </Field>
          <Field label={t("sheet.baseSpeed", "Base speed")}>
            <input
              type="number"
              value={getBaseSpeed(character)}
              onChange={(e) => onChange({ baseSpeed: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              onBlur={onFieldBlur}
              className="input"
            />
          </Field>
          {isSorcerer && (
            <>
              <Field label={t("sheet.sorceryPoints", "Sorcery Points")}>
                <input
                  type="number"
                  value={character.sorceryPoints}
                  onChange={(e) => onChange({ sorceryPoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                  onBlur={onFieldBlur}
                  className="input"
                />
              </Field>
              <Field label={t("sheet.maxSorceryPoints", "Max Sorcery Points")}>
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
        <BasePopup
          isOpen={true}
          onClose={() => { setHpModal(null); setHpAmount(""); setConcentrationCheck(null); }}
          title={hpModal.mode === "heal" ? t("character.heal") : t("button.takeDamage", "Take Damage")}
          confirmLabel={hpModal.mode === "heal" ? t("character.heal") : t("button.apply")}
          cancelLabel={t("common.cancel")}
          onConfirm={handleHpAction}
          confirmDisabled={!hpAmount || parseInt(hpAmount, 10) <= 0}
          showFooter={true}
        >
          <div className="px-4 py-4">
            <label className="field-label-light">{t("equipment.amount")}</label>
            <input
              type="number"
              value={hpAmount}
              onChange={(e) => setHpAmount(e.target.value)}
              placeholder={t("equipment.enterAmount")}
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
                  {t("combat.concentrationCheck", { dc: Math.max(10, Math.floor(parseInt(hpAmount || "0", 10) / 2)) })}
                 </span>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  disabled={!dice}
                  onClick={() => {
                    const damage = parseInt(hpAmount || "0", 10);
                    const label = t("override.save", { ability: "CON" }, "{ability} saving throw");
                    const st = character.savingThrows?.con ?? { proficient: false, value: 0 };
                    // A Constitution save; War Caster gives advantage on it.
                    const group = { ...d20Group(label, st.value, saveParts(character, "con", st.proficient)), ...(isWarCaster ? { mode: "adv" as const } : {}) };
                    dice?.roll(t("dice.concentration", "Concentration"), [group], (result) => setConcentrationCheck({ damage, roll: result[0]?.total }));
                  }}
                  className="btn btn-secondary inline-flex w-full items-center justify-center gap-1.5 !py-1.5 text-xs"
                >
                  <GiRollingDices className="h-4 w-4" aria-hidden="true" />
                  {t("dice.rollConSave", "Roll CON save")}
                </button>
                 {isWarCaster && <p className="text-center text-[10px] text-[var(--color-success-600)] mt-1">{t("combat.warCasterAdvantage")}</p>}
              </div>
            </div>
          )}
          {concentrationCheck && (
            <div className="mx-4 mb-3 px-3 py-2 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs">🎲</span>
                <span className="text-[10px] font-semibold text-[var(--color-warning-700)]">
                  {t("dice.concRolled", { roll: concentrationCheck.roll ?? "", dc: Math.max(10, Math.floor(concentrationCheck.damage / 2)) }, "Rolled {roll} against DC {dc}.")}
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
                   className="flex-1 text-[10px] font-semibold text-[var(--color-success-600)] hover:text-[var(--color-success-700)] underline py-1"
                >
                  {t("combat.failedBreakConcentration")}
                </button>
                <button
                  type="button"
                  onClick={() => { setConcentrationCheck(null); handleHpAction(); }}
                   className="flex-1 text-[10px] font-semibold text-[var(--color-success-600)] hover:text-[var(--color-success-700)] underline py-1"
                >
                  {t("combat.successMaintain")}
                </button>
              </div>
            </div>
          )}
        </BasePopup>
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
