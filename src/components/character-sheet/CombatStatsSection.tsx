"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Overridable } from "./Overridable";
import { SpeedStat } from "./styled/SpeedStat";
import { SwordIcon as Sword, SparklesIcon as Sparkle } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBaseSpeed, type Character } from "@/lib/storage";
import { StateTracker } from "./StateTracker";
import { Timers } from "./Timers";
import { RichInline } from "@/components/RichText";
import { damageResistances, DAMAGE_TYPES, resistanceChoicesFor, type Resistance } from "@/lib/resistances";
import { BuffTracker } from "./BuffTracker";
import { initiativeParts } from "@/lib/roll-parts";

interface CombatStatsSectionProps {
  character: Pick<Character, "turnRound" | "turnActive" | "ac" | "currentHp" | "maxHp" | "effectiveMaxHp" | "temporaryHp" | "speed" | "baseSpeed" | "race" | "ruleset" | "isCustomHp" | "class" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel" | "initiative" | "hitDiceRemaining" | "hitDiceTotal" | "level" | "dex" | "con" | "savingThrows" | "overrides" | "chosenResistances">;
  onChange: (patch: Partial<Pick<Character, "ac" | "currentHp" | "maxHp" | "temporaryHp" | "speed" | "baseSpeed" | "isCustomHp" | "sorceryPoints" | "maxSorceryPoints" | "activeStates" | "activeBuffs" | "features" | "actionUsed" | "bonusActionUsed" | "reactionUsed" | "exhaustionLevel">>) => void;
  editMode?: boolean;
  /** Opens the turn panel; starts a new turn when none is running. */
  onOpenTurn?: () => void;
}

export function CombatStatsSection({ character, onChange, editMode = true, onOpenTurn }: CombatStatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();
  const isSorcerer = character.class === "Sorcerer";
  const resistances = damageResistances(character as Character);
  const resistanceChoices = resistanceChoicesFor(character as Character);

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

      {(resistances.length > 0 || resistanceChoices.length > 0) && (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <span className="field-label-light mb-1 block">{t("combat.resistances", "Resistances")}</span>
          {resistanceChoices.map((choice) => (
            <label key={choice.feature} className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{choice.feature}</span>
                <span className="block text-[10px] text-[var(--color-text-muted)]">{t(choice.whileRaging ? "combat.pickEachRage" : "combat.pickAfterRest", choice.whileRaging ? "Pick when you rage" : "Pick after each rest")}</span>
              </span>
              <select
                className="input w-36 text-xs"
                value={choice.pick}
                onChange={(e) => onChange({ chosenResistances: { ...(character.chosenResistances || {}), [choice.feature]: e.target.value } } as Partial<Character>)}
              >
                <option value="">{t("combat.pickNone", "Not picked")}</option>
                {choice.options(character as Character).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
          <ul className="space-y-1">
            {resistanceLines(resistances).map((line) => (
              <li key={line.source + line.mark} className="text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{line.source}</span>
                {line.mark === "immune" && <span className="ml-1 text-[10px] uppercase text-[var(--color-text-muted)]">{t("combat.immune", "immune")}</span>}
                {line.mark === "raging" && <span className="ml-1 text-[10px] uppercase text-[var(--color-text-muted)]">{t("combat.whileRaging", "while raging")}</span>}
                <span className="mx-1">·</span>
                {line.allBut ? t("combat.allBut", { types: line.allBut.join(", ") }, "all but {types}") : <RichInline text={line.types.join(", ")} />}
              </li>
            ))}
          </ul>
        </div>
      )}

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

/** Resistances as one line per source: "Rage (while raging) · Bludgeoning, Piercing, Slashing". */
function resistanceLines(rows: Resistance[]) {
  const lines: { source: string; mark: "" | "immune" | "raging"; types: string[]; allBut?: string[] }[] = [];
  for (const r of rows) {
    const mark = r.immune ? "immune" : r.whileRaging ? "raging" : "";
    const line = lines.find((l) => l.source === r.source && l.mark === mark);
    if (line) line.types.push(r.type);
    else lines.push({ source: r.source, mark, types: [r.type] });
  }
  for (const line of lines) {
    if (line.types.length >= DAMAGE_TYPES.length - 3) line.allBut = DAMAGE_TYPES.filter((t) => !line.types.includes(t));
  }
  return lines;
}
