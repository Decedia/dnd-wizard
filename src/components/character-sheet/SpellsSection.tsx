"use client";

import { useState, useCallback, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier, getMaxPreparedSpells, isPreparationCaster, getDomainSpellNames, getCircleSpells, getMaxSpellsKnown, getMaxCantripsKnown, getMaxSpellLevel } from "@/lib/storage";
import { LightningIcon as Lightning, PlusIcon as Plus, CheckIcon as Check, CircleIcon as Circle, XIcon as X, ClockIcon as Clock, SparklesIcon as Sparkle } from "@/components/icons";
import { SpellSelectionModal } from "../modals/SpellSelectionModal";
import { BUFF_DEFINITIONS, type BuffDefinition, parseDurationToTurns, advanceTurn } from "@/lib/spellEffects";
import { SourceBadge } from "@/components/SourceBadge";
import { getSpellMechanic } from "@/lib/spell-mechanics-accessor";
import { getSpellSchoolStyle } from "@/lib/spell-schools";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { DiceText } from "@/components/DiceText";

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
  school?: string;
  effectSummary?: string;
  mechanic?: ReturnType<typeof getSpellMechanic>;
  ritual?: boolean;
  actionType?: string | null;
  components?: { verbal: boolean; somatic: boolean; material: boolean; materialDesc: string | null };
  onHit?: string | null;
  saveType?: string | null;
  onFailedSave?: string | null;
  onSuccessfulSave?: string | null;
  ongoingEffect?: string | null;
  escapeCondition?: string | null;
  immunities?: string | null;
  upcastEffect?: string | null;
  classes?: string[];
  mechanics_badges?: string[];
  lastUpdated?: string;
}

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  Conjuration: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
  Divination: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  Enchantment: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30",
  Evocation: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
  Illusion: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
  Necromancy: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
  Transmutation: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
};

function getStatBadgeStyle(text: string) {
  const t = text.toLowerCase();
  if (t.includes("str") || t.includes("athletics")) return "bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40";
  if (t.includes("dex") || t.includes("acrobatics") || t.includes("stealth") || t.includes("sleight")) return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40";
  if (t.includes("con") || t.includes("concentration")) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";
  if (t.includes("int") || t.includes("arcana") || t.includes("history") || t.includes("investigation") || t.includes("nature") || t.includes("religion")) return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40";
  if (t.includes("wis") || t.includes("perception") || t.includes("insight") || t.includes("survival") || t.includes("medicine") || t.includes("animal")) return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40";
  if (t.includes("cha") || t.includes("deception") || t.includes("intimidation") || t.includes("performance") || t.includes("persuasion")) return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40";
  return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
}

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur, showDescriptions } = useCharacterSheet();
  const { t, tDesc } = useLanguage();
  const { data } = useSRD();
  const srdSpells = data?.spells || [];
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSpell, setSelectedSpell] = useState<UnifiedSpell | null>(null);

  const preparationCaster = isPreparationCaster(character);
  const maxPrepared = getMaxPreparedSpells(character);
  const maxSpellsKnown = getMaxSpellsKnown(character);
  const maxCantripsKnown = getMaxCantripsKnown(character);
  const maxLevel = getMaxSpellLevel(character.class, character.level, character.ruleset);
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
      const srdSpell = s.srdSpellName
        ? srdSpells.find(sp => sp.name === s.srdSpellName)
        : s.source === "srd"
          ? srdSpells.find(sp => sp.name === s.name)
          : undefined;
      const desc = srdSpell?.description || s.description;
      const description = typeof desc === "string" ? desc : (Array.isArray(desc) ? desc.join("\n") : "");
      const damageDice = s.damageDice || srdSpell?.damage?.damageDice || "";
      const damageType = s.damageType || srdSpell?.damage?.damageType || "";
      const duration = srdSpell?.duration || "";
      const srdSource = (srdSpell as any)?.source || "PHB";
      const school = (srdSpell as any)?.school || "";
      const classes = (srdSpell as any)?.classes || [];
      const mechanic = s.source === "srd" && s.srdSpellName
        ? getSpellMechanic(s.srdSpellName, srdSource) || getSpellMechanic(s.srdSpellName)
        : undefined;
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
        school,
        classes,
        mechanics_badges: (srdSpell as any)?.mechanics_badges || [],
        lastUpdated: (srdSpell as any)?.lastUpdated || "",
        effectSummary: srdSpell?.effectSummary || "",
        mechanic,
        ritual: (srdSpell as any)?.ritual || false,
        actionType: (srdSpell as any)?.actionType || null,
        components: (srdSpell as any)?.components || null,
        onHit: (srdSpell as any)?.onHit || null,
        saveType: (srdSpell as any)?.saveType || null,
        onFailedSave: (srdSpell as any)?.onFailedSave || null,
        onSuccessfulSave: (srdSpell as any)?.onSuccessfulSave || null,
        ongoingEffect: (srdSpell as any)?.ongoingEffect || null,
        escapeCondition: (srdSpell as any)?.escapeCondition || null,
        immunities: (srdSpell as any)?.immunities || null,
        upcastEffect: (srdSpell as any)?.upcastEffect || null,
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
    for (const [level, spells] of map.entries()) {
      spells.sort((a, b) => {
        const sourceA = a.srdSource || "PHB";
        const sourceB = b.srdSource || "PHB";
        if (sourceA !== sourceB) {
          if (sourceA === "PHB") return -1;
          if (sourceB === "PHB") return 1;
          return sourceA.localeCompare(sourceB);
        }
        return a.name.localeCompare(b.name);
      });
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

  const getSummary = (spell: UnifiedSpell) => {
    if (spell.effectSummary) return spell.effectSummary;
    const desc = spell.description || "";
    return desc.slice(0, 180);
  };

  return (
    <SectionCard id="spells" title={t("section.spells")} icon={<Lightning className="h-5 w-5" />}>
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
          <Clock className="h-4 w-4" />
          {t("spells.resetTurn")}
        </button>
      )}

      <div className="flex flex-col gap-3">
        {activeSpells.map((spell) => {
          const spellPrepared = isPrepared(spell.id);
          const spellUsed = (character.spellsUsedThisTurn || []).includes(spell.id);
          const buffDef = getSpellBuff(spell.name);
          const summary = getSummary(spell);
          const schoolStyle = spell.school ? getSpellSchoolStyle(spell.school) : undefined;

          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => setSelectedSpell(spell)}
              className={`w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all ${
                spellPrepared ? "border-l-4 border-[var(--color-success-500)]" : ""
              } ${spellUsed ? "opacity-50" : "active:scale-[0.98] hover:border-[var(--color-border-active)]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">{spell.name}</h3>
                <div className="flex shrink-0 gap-1.5">
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    {t("glossary.level", "Level")} {spell.level}
                  </span>
                  {schoolStyle && (() => {
                    const schoolColor = spell.school ? SCHOOL_COLORS[spell.school] : undefined;
                    return (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${schoolColor || "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]"}`}>
                        {schoolStyle.label}
                      </span>
                    );
                  })()}
                </div>
                </div>

                {(spell.mechanics_badges || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 my-2">
                    {(spell.mechanics_badges || []).map((badge: string, badgeIdx: number) => (
                      <span
                        key={badgeIdx}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] shadow-sm"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {spell.duration && (() => {
                const activeBuff = buffDef ? (character.activeBuffs || []).find(b => b.spellId === buffDef.id) : undefined;
                if (activeBuff && activeBuff.turnsRemaining !== null && activeBuff.turnsRemaining !== undefined) {
                  return (
                    <span className="mt-2 text-[10px] text-[var(--color-accent)] font-semibold">
                      ⏱ {activeBuff.turnsRemaining} turn{activeBuff.turnsRemaining !== 1 ? "s" : ""}
                    </span>
                  );
                }
                return (
                  <span className="mt-2 text-[10px] text-[var(--color-text-muted)]">⏱ {spell.duration}</span>
                );
              })()}

              {summary && (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{summary}</p>
              )}

              {spell.lastUpdated && (
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Last updated: {spell.lastUpdated}</p>
              )}

              <div className="flex items-center gap-1 mt-3">
                {preparationCaster && spell.level > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePrepared(spell.id); }}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                      spellPrepared
                        ? "bg-[var(--color-success-500)] text-[var(--color-surface)]"
                        : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                    title={spellPrepared ? t("spells.clickToUnprepare") : t("spells.clickToPrepare")}
                  >
                    {spellPrepared ? t("spells.prepared") : t("spells.prepare")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSpellUsed(spell.id, buffDef, spell.duration); }}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    spellUsed
                      ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                  title={spellUsed ? t("spells.clickToMarkUnused") : buffDef ? t("spells.clickToMarkUsed") : t("spells.clickToMarkUsed")}
                >
                  {buffDef ? <Sparkle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {spellUsed ? t("spells.used") : t("spells.use")}
                  {buffDef?.concentration && <span className="text-[8px] opacity-70">C</span>}
                </button>
                {spellUsed && buffDef?.concentration && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentBuffs = character.activeBuffs || [];
                      onChange({ activeBuffs: currentBuffs.filter(b => b.spellId !== buffDef.id) });
                      const currentUsed = character.spellsUsedThisTurn || [];
                      onChange({ spellsUsedThisTurn: currentUsed.filter(id => id !== spell.id) });
                    }}
                    className="flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded border border-[var(--color-error-200)] text-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:border-[var(--color-error-300)] transition-all"
                    title={t("spells.breakConcentration")}
                  >
                    ✕
                  </button>
                )}
                {editMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSpell(spell.id); }}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-error-500)]"
                    aria-label={t("spells.remove")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </button>
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
          {t("button.addSpells", "Add Spells")}
        </button>
      )}

      {showSpellModal && (
        <SpellSelectionModal
          character={character}
          onChange={onChange}
          onClose={() => setShowSpellModal(false)}
          maxSpellsKnown={maxSpellsKnown}
          maxCantripsKnown={maxCantripsKnown}
          maxLevel={maxLevel}
        />
      )}

      {selectedSpell && (
        <BottomSheet
          isOpen={!!selectedSpell}
          onClose={() => setSelectedSpell(null)}
          title={selectedSpell.name}
          showHeader={true}
        >
          <div className="px-4 py-4 space-y-3">
            {selectedSpell.effectSummary && (
              <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">{selectedSpell.effectSummary}</p>
            )}
            {(selectedSpell.mechanics_badges || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(selectedSpell.mechanics_badges || []).map((badge: string, badgeIdx: number) => (
                  <span
                    key={badgeIdx}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] shadow-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
            {selectedSpell.lastUpdated && (
              <p className="text-[10px] text-[var(--color-text-muted)]">Last updated: {selectedSpell.lastUpdated}</p>
            )}
            <DiceText text={selectedSpell.description || ""} />
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {t("glossary.level", "Level")} {selectedSpell.level}
              </span>
              {selectedSpell.school && (() => {
                const schoolColor = SCHOOL_COLORS[selectedSpell.school];
                return (
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${schoolColor || "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]"}`}>
                    {selectedSpell.school}
                  </span>
                );
              })()}
            </div>
            {(selectedSpell.classes || []).length > 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">{(selectedSpell.classes || []).join(", ")}</p>
            )}
          </div>
        </BottomSheet>
      )}
    </SectionCard>
  );
}
