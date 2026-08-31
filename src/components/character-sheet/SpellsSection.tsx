"use client";

import { useState, useCallback, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier, getMaxPreparedSpells, isPreparationCaster, getDomainSpellNames, getCircleSpells, getMaxSpellsKnown, getMaxCantripsKnown } from "@/lib/storage";
import { LightningIcon as Lightning, PlusIcon as Plus, CheckIcon as Check, CircleIcon as Circle, XIcon as X, ClockIcon as Clock, SparklesIcon as Sparkle } from "@/components/icons";
import { ConditionBadges } from "./ConditionBadge";
import { DamageDisplay, getSpellDamageInfo } from "./DamageExtractor";
import { SpellSelectionModal } from "./SpellSelectionModal";
import { BUFF_DEFINITIONS, type BuffDefinition, parseDurationToTurns, advanceTurn } from "@/lib/spellEffects";
import { SourceBadge } from "@/components/SourceBadge";

interface SpellsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

interface UnifiedSpell {
  id: string;
  name: string;
  level: number;
  source: "srd" | "custom";
  srdSpellName?: string;
  srdSource?: string;
  damageDice?: string;
  damageType?: string;
  description?: string;
  duration?: string;
}

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { data } = useSRD();
  const srdSpells = data?.spells || [];
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const preparationCaster = isPreparationCaster(character);
  const maxPrepared = getMaxPreparedSpells(character);
  const maxSpellsKnown = getMaxSpellsKnown(character);
  const maxCantripsKnown = getMaxCantripsKnown(character);
  const currentSpellsKnown = (character.spells || []).filter(s => s.level > 0).length;
  const currentCantripsKnown = (character.spells || []).filter(s => s.level === 0).length;
  const domainSpells = getDomainSpellNames(character);
  const circleTerrain = character.circleTerrain || "";
  const circleSpellsList = circleTerrain ? getCircleSpells(circleTerrain, character.level) : [];
  const preparedCount = (character.preparedSpells || []).filter(id => {
    const spell = character.spells.find(s => s.id === id);
    return spell && spell.level > 0 && !circleSpellsList.some(cs => cs.toLowerCase() === spell.name?.toLowerCase());
  }).length;

  const unifiedSpells: UnifiedSpell[] = useMemo(() => {
    return (character.spells || []).map(s => {
      const srdSpell = s.srdSpellName ? srdSpells.find(sp => sp.name === s.srdSpellName) : undefined;
      const desc = s.description || srdSpell?.description;
      const description = typeof desc === "string" ? desc : (Array.isArray(desc) ? desc.join("\n") : "");
      const damageDice = s.damageDice || srdSpell?.damage?.damageDice || "";
      const damageType = s.damageType || srdSpell?.damage?.damageType || "";
      const duration = srdSpell?.duration || "";
      const srdSource = (srdSpell as any)?.source || "PHB";
      return {
        id: s.id,
        name: s.name,
        level: s.level,
        source: s.source,
        srdSpellName: s.srdSpellName,
        damageDice,
        damageType,
        description,
        duration,
        srdSource,
      };
    });
  }, [character.spells, srdSpells]);

  const spellsByLevel = useMemo(() => {
    const map = new Map<number, UnifiedSpell[]>();
    for (const spell of unifiedSpells) {
      const existing = map.get(spell.level) || [];
      existing.push(spell);
      map.set(spell.level, existing);
    }
    return map;
  }, [unifiedSpells]);

  const levels = useMemo(() => {
    return Array.from(spellsByLevel.keys()).sort((a, b) => a - b);
  }, [spellsByLevel]);

  const activeLevel = levels[activeTab] ?? 0;
  const activeSpells = spellsByLevel.get(activeLevel) || [];

  const isPrepared = useCallback((spellId: string) => {
    return (character.preparedSpells || []).includes(spellId);
  }, [character.preparedSpells]);

  const togglePrepared = useCallback((spellId: string) => {
    const current = character.preparedSpells || [];
    const isPrep = current.includes(spellId);
    if (isPrep) {
      onChange({ preparedSpells: current.filter(id => id !== spellId) });
    } else {
      onChange({ preparedSpells: [...current, spellId] });
    }
  }, [character.preparedSpells, onChange]);

  const toggleSpellUsed = useCallback((spellId: string, buffDef?: BuffDefinition, duration?: string) => {
    const currentUsed = character.spellsUsedThisTurn || [];
    const isUsed = currentUsed.includes(spellId);
    if (isUsed) {
      onChange({ spellsUsedThisTurn: currentUsed.filter(id => id !== spellId) });
      if (buffDef) {
        const currentBuffs = character.activeBuffs || [];
        onChange({ activeBuffs: currentBuffs.filter(b => b.spellId !== buffDef.id) });
      }
    } else {
      onChange({ spellsUsedThisTurn: [...currentUsed, spellId] });
      if (buffDef) {
        const currentBuffs = character.activeBuffs || [];
        if (!currentBuffs.some(b => b.spellId === buffDef.id)) {
          const turnsRemaining = duration ? parseDurationToTurns(duration) : null;
          onChange({ activeBuffs: [...currentBuffs, { spellId: buffDef.id, name: buffDef.name, concentration: buffDef.concentration, turnsRemaining }] });
        }
      }
    }
  }, [character.spellsUsedThisTurn, character.activeBuffs, onChange]);

  const resetSpellsUsed = useCallback(() => {
    const currentUsed = character.spellsUsedThisTurn || [];
    const spells = character.spells || [];
    const keptInUse: string[] = [];
    for (const spellId of currentUsed) {
      const charSpell = spells.find(s => s.id === spellId);
      if (!charSpell) continue;
      const srdSpell = charSpell.srdSpellName ? srdSpells.find(sp => sp.name === charSpell.srdSpellName) : undefined;
      const duration = srdSpell?.duration || "";
      const turns = duration ? parseDurationToTurns(duration) : null;
      if (turns !== null && turns > 1) {
        keptInUse.push(spellId);
      }
    }
    onChange({ spellsUsedThisTurn: keptInUse, activeBuffs: advanceTurn(character.activeBuffs || []) });
  }, [onChange, character.activeBuffs, character.spells, srdSpells]);

  const removeSpell = useCallback((id: string) => {
    onChange({
      spells: (character.spells || []).filter(s => s.id !== id),
      preparedSpells: (character.preparedSpells || []).filter(pid => pid !== id),
    });
  }, [character.spells, character.preparedSpells, onChange]);

  const getSpellBuff = useCallback((spellName: string): BuffDefinition | undefined => {
    const normalized = spellName.toLowerCase();
    return Object.values(BUFF_DEFINITIONS).find(b => b.id === normalized || b.name.toLowerCase() === normalized);
  }, []);

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Cantrips";
    if (level === 1) return "1st";
    if (level === 2) return "2nd";
    if (level === 3) return "3rd";
    return `${level}th`;
  };

  return (
    <SectionCard id="spells" title="Spells" icon={<Lightning className="h-5 w-5" />}>
      {preparationCaster && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Prepared Spells: {preparedCount}/{maxPrepared}</span>
          <span className="text-xs text-ink ml-2">(Spellcasting ability mod + level)</span>
        </div>
      )}
      {!preparationCaster && maxSpellsKnown > 0 && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Spells Known: {currentSpellsKnown}/{maxSpellsKnown}</span>
          <span className="text-xs text-ink ml-2">Cantrips: {currentCantripsKnown}/{maxCantripsKnown}</span>
        </div>
      )}
      {preparationCaster && maxCantripsKnown > 0 && (
        <div className="mb-2 surface bg-paper-muted px-4 py-2">
          <span className="text-sm font-bold text-ink">Cantrips: {currentCantripsKnown}/{maxCantripsKnown}</span>
        </div>
      )}

      {levels.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {levels.map((level, idx) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
              }`}
            >
              {getLevelLabel(level)}
            </button>
          ))}
        </div>
      )}

      {(character.spellsUsedThisTurn || []).length > 0 && (
        <button
          type="button"
          onClick={resetSpellsUsed}
          className="mb-3 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)] transition-colors"
        >
          <Clock className="h-3 w-3" />
          Reset Turn
        </button>
      )}

      <div className="space-y-2">
        {activeSpells.map((spell) => {
          const spellPrepared = isPrepared(spell.id);
          const spellUsed = (character.spellsUsedThisTurn || []).includes(spell.id);
          const spellDamages = getSpellDamageInfo(spell);
          const buffDef = getSpellBuff(spell.name);
          return (
            <div key={spell.id} className={`list-row ${spellPrepared ? "border-l-4 border-[var(--color-success-500)]" : ""} ${spellUsed ? "opacity-50" : ""}`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {preparationCaster && spell.level > 0 && (
                    <button
                      type="button"
                      onClick={() => togglePrepared(spell.id)}
                      className={`shrink-0 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                        spellPrepared
                          ? "bg-[var(--color-success-500)] text-[var(--color-surface)]"
                          : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                      title={spellPrepared ? "Click to unprepare" : "Click to prepare"}
                    >
                      {spellPrepared ? "Prepared" : "Prepare"}
                    </button>
                  )}
                   <button
                    type="button"
                    onClick={() => toggleSpellUsed(spell.id, buffDef, spell.duration)}
                    className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                      spellUsed
                        ? "bg-[var(--color-warning-500)] text-[var(--color-surface)]"
                        : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                    title={spellUsed ? "Click to mark as unused" : buffDef ? `Use: ${buffDef.effects.map(e => e.description).join("; ")}` : "Click to mark as used this turn"}
                  >
                    {buffDef ? <Sparkle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {spellUsed ? "Used" : "Use"}
                    {buffDef?.concentration && <span className="text-[8px] opacity-70">C</span>}
                  </button>
                  {spellUsed && buffDef?.concentration && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentBuffs = character.activeBuffs || [];
                        onChange({ activeBuffs: currentBuffs.filter(b => b.spellId !== buffDef.id) });
                        const currentUsed = character.spellsUsedThisTurn || [];
                        onChange({ spellsUsedThisTurn: currentUsed.filter(id => id !== spell.id) });
                      }}
                      className="shrink-0 flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded border border-[var(--color-error-200)] text-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:border-[var(--color-error-300)] transition-all"
                      title="Break concentration"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-bold ${spellUsed ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-primary)]"}`}>{spell.name}</span>
                  {spell.srdSource && spell.srdSource !== "PHB" && <SourceBadge source={spell.srdSource} size="sm" />}
                  {spell.duration && (() => {
                    const activeBuff = buffDef ? (character.activeBuffs || []).find(b => b.spellId === buffDef.id) : undefined;
                    if (activeBuff && activeBuff.turnsRemaining !== null && activeBuff.turnsRemaining !== undefined) {
                      return (
                        <span className="text-[10px] text-[var(--color-accent)] font-semibold">
                          ⏱ {activeBuff.turnsRemaining} turn{activeBuff.turnsRemaining !== 1 ? "s" : ""}
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] text-[var(--color-text-muted)]">⏱ {spell.duration}</span>
                    );
                  })()}
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => removeSpell(spell.id)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-error-500)] shrink-0"
                      aria-label="Remove spell"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {spell.description && (
                <>
                  <DescriptionText>{spell.description}</DescriptionText>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <DamageDisplay damages={spellDamages} size="sm" />
                    <ConditionBadges text={spell.description} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <button
          type="button"
          onClick={() => setShowSpellModal(true)}
          className="mt-3 btn-secondary flex items-center gap-1.5"
        >
          <Plus size={16} />
          Add Spells
        </button>
      )}

      {showSpellModal && (
        <SpellSelectionModal
          character={character}
          onChange={onChange}
          onClose={() => setShowSpellModal(false)}
          maxSpellsKnown={maxSpellsKnown}
          maxCantripsKnown={maxCantripsKnown}
        />
      )}
    </SectionCard>
  );
}
