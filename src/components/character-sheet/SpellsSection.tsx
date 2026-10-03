"use client";

import { useState, useCallback, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier, getMaxPreparedSpells, isPreparationCaster, getDomainSpellNames, getCircleSpells, getMaxSpellsKnown, getMaxCantripsKnown, getMaxSpellLevel } from "@/lib/storage";
import { getStaticSpells, deduplicateSpells } from "@/lib/srd-client";
import { LightningIcon as Lightning, PlusIcon as Plus, CheckIcon as Check, CircleIcon as Circle, XIcon as X, ClockIcon as Clock, SparklesIcon as Sparkle, CaretRightIcon as CaretRight } from "@/components/icons";
import { SpellSelectionModal } from "../modals/SpellSelectionModal";
import { BUFF_DEFINITIONS, type BuffDefinition, parseDurationToTurns, advanceTurn } from "@/lib/spellEffects";
import { SourceBadge } from "@/components/SourceBadge";
import { getSpellMechanic } from "@/lib/spell-mechanics-accessor";
import { getStatBadgeStyle, getSchoolBadgeStyle } from "@/lib/badge-styles";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { DiceText } from "@/components/DiceText";
import { buildDataset, findEngineFeature } from "@/data/engine/index";
import { getFeatSpellSelections, type SpellGrantSelection } from "@/lib/feat-spell-grants";

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

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur, showDescriptions } = useCharacterSheet();
  const { t, tDesc, language } = useLanguage();
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

  const featSpellIds = useMemo(
    () => new Set((character.spells ?? []).filter((s) => s.grantsFeatureId).map((s) => s.id)),
    [character.spells]
  );

  const spellsByLevel = useMemo(() => {
    const map = new Map<number, UnifiedSpell[]>();
    for (const spell of unifiedSpells) {
      if (featSpellIds.has(spell.id)) continue;
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
  }, [unifiedSpells, featSpellIds]);

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

  const dataset = buildDataset();

  const featGrantedSpells = useMemo(() => {
    const list: Array<{ spell: UnifiedSpell; engineId: string; featureName: string; owner: string }> = [];
    for (const s of character.spells ?? []) {
      if (!s.grantsFeatureId) continue;
      const engineFeature = dataset.byId.get(s.grantsFeatureId);
      if (!engineFeature) continue;
      list.push({
        spell: s,
        engineId: s.grantsFeatureId,
        featureName: engineFeature.name,
        owner: engineFeature.owner,
      });
    }
    return list;
  }, [character.spells, dataset]);

  const getFeatsWithUnfilledSelections = () => {
    const result: Array<{ engineId: string; featureName: string; owner: string; selections: Array<{ selection: SpellGrantSelection; chosen: number }> }> = [];
    const chosenByFeat = new Map<string, Map<string, number>>();

    for (const fg of featGrantedSpells) {
      const f = character.features.find((feat) => feat.engineId === fg.engineId);
      if (!f?.engineId) continue;
      const engineFeature = dataset.byId.get(fg.engineId);
      if (!engineFeature) continue;
      const selections = getFeatSpellSelections(engineFeature);
      const m = chosenByFeat.get(fg.engineId) ?? new Map();
      for (const s of selections) {
        if (fg.spell.level === s.level) {
          const key = `${s.kind}|${s.level}`;
          m.set(key, (m.get(key) ?? 0) + 1);
        }
      }
      chosenByFeat.set(fg.engineId, m);
    }

    for (const f of character.features ?? []) {
      if (!f.engineId) continue;
      const engineFeature = dataset.byId.get(f.engineId);
      if (!engineFeature) continue;
      const selections = getFeatSpellSelections(engineFeature);
      if (selections.length === 0) continue;
      const chosen = chosenByFeat.get(f.engineId) ?? new Map();
      const unfilled: Array<{ selection: SpellGrantSelection; chosen: number }> = [];
      for (const s of selections) {
        const key = `${s.kind}|${s.level}`;
        const n = chosen.get(key) ?? 0;
        if (n < s.count) unfilled.push({ selection: s, chosen: n });
      }
      if (unfilled.length > 0) {
        result.push({ engineId: f.engineId, featureName: engineFeature.name, owner: engineFeature.owner, selections: unfilled });
      }
    }
    return result;
  };

  const getSpellForSelection = (selection: SpellGrantSelection) => {
    const from = selection.from;
    const filtered = deduplicateSpells(
      getStaticSpells(character.sources, character.ruleset, language).filter(
        (s) => from.some((c) => s.classes?.map((x) => x.toLowerCase()).includes(c.toLowerCase())) && s.level === selection.level
      )
    );
    return filtered;
  };

  const addFeatSpell = (featEngineId: string, selection: SpellGrantSelection, spellName: string) => {
    const spellEntry = getSpellForSelection(selection).find((s) => s.name === spellName);
    if (!spellEntry) return;
    const featId = featEngineId.replace(/\./g, "_");
    const id = `spell-${spellEntry.index || spellEntry.name}-${selection.level}-${featId}`;
    const newSpell = {
      id,
      name: spellEntry.name,
      level: spellEntry.level,
      source: "srd" as const,
      srdSpellName: spellEntry.name,
      grantsFeatureId: featEngineId,
      description: Array.isArray(spellEntry.description) ? spellEntry.description.join("\n") : (spellEntry.description || ""),
    };
    const newSpells = [...(character.spells ?? []), newSpell];
    if (selection.kind === "cantrip") {
      onChange({ spells: newSpells, cantrips: [...(character.cantrips ?? []), { id, name: spellEntry.name }] });
    } else {
      onChange({ spells: newSpells });
    }
  };

  return (
    <SectionCard id="spells" title={t("section.spells")} icon={<Lightning className="h-5 w-5" />}>
      {preparationCaster && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">{t("sheet.preparedSpells")}: {preparedCount}/{maxPrepared}</span>
          <span className="text-xs text-ink ml-2">{t("sheet.spellcastingModHint")}</span>
        </div>
      )}
      {!preparationCaster && maxSpellsKnown > 0 && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">{t("sheet.spellsKnown")}: {currentSpellsKnown}/{maxSpellsKnown}</span>
          <span className="text-xs text-ink ml-2">{t("sheet.cantrips")}: {currentCantripsKnown}/{maxCantripsKnown}</span>
        </div>
      )}
      {preparationCaster && maxCantripsKnown > 0 && (
        <div className="mb-2 surface bg-paper-muted px-4 py-2">
          <span className="text-sm font-bold text-ink">{t("sheet.cantrips")}: {currentCantripsKnown}/{maxCantripsKnown}</span>
        </div>
      )}

      {featGrantedSpells.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Learned via Feats
          </div>
          {(() => {
            const byFeat = new Map<string, typeof featGrantedSpells>();
            for (const f of featGrantedSpells) {
              const group = byFeat.get(f.engineId) ?? [];
              group.push(f);
              byFeat.set(f.engineId, group);
            }
            return [...byFeat.entries()].map(([engineId, group]) => {
              const feat = dataset.byId.get(engineId);
              const entries = group.map((f) => (
                <div key={f.spell.id} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-[var(--color-text-primary)]">{f.spell.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                    Level {f.spell.level}
                  </span>
                  <span className="text-[10px] text-[var(--color-accent-indigo-600)] font-semibold">
                    via {f.featureName}
                  </span>
                </div>
              ));
              return (
                <div key={engineId} className="surface bg-paper-muted px-4 py-3 rounded-2xl">
                  <div className="text-xs font-bold text-[var(--color-text-primary)] mb-2">
                    {feat ? feat.name : engineId}
                  </div>
                  {entries}
                </div>
              );
            });
          })()}
        </div>
      )}

      {editMode && (() => {
        const unfilled = getFeatsWithUnfilledSelections();
        if (unfilled.length === 0) return null;
        return (
          <div className="mb-4">
            <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Manage feat spell selections
            </div>
            {unfilled.map((feat) => {
              const cls = feat.owner.charAt(0).toUpperCase() + feat.owner.slice(1);
              return (
                <div key={feat.engineId} className="surface bg-paper-muted px-4 py-3 rounded-2xl mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">
                      {feat.featureName}
                    </div>
                  </div>
                  {feat.selections.map((sel, idx) => {
                    const spells = getSpellForSelection(sel.selection);
                    const label =
                      sel.selection.kind === "cantrip"
                        ? "cantrips"
                        : `${sel.selection.level}${sel.selection.level === 1 ? "st" : sel.selection.level === 2 ? "nd" : sel.selection.level === 3 ? "rd" : "th"}-level spells`;
                    const classes = sel.selection.from.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
                    return (
                      <div key={idx} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                            {label}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            from {classes}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--color-text-secondary)] ml-auto">
                            {sel.chosen} / {sel.selection.count} chosen
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {spells.map((s) => {
                            const already = featGrantedSpells.some(
                              (f) => f.spell.name === s.name && f.spell.level === s.level
                            );
                            const disabled = already || sel.chosen >= sel.selection.count;
                            return (
                              <button
                                key={s.name}
                                type="button"
                                disabled={disabled}
                                onClick={() => addFeatSpell(feat.engineId, sel.selection, s.name)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                  disabled
                                    ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                                    : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                                }`}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

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

          return (
            <div
              key={spell.id}
              onClick={() => setSelectedSpell(spell)}
              className="relative block w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm cursor-pointer active:scale-[0.98] active:border-[var(--color-border-active)] transition-all duration-75 overflow-hidden mb-4 group"
            >
              {/* Content Body */}
              <div className="p-4 pb-3">
                {/* Title Block */}
                <div className="mb-2">
                  <h3 className="font-bold text-lg text-[var(--color-text-primary)] leading-tight">
                    {spell.name}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] block mt-0.5">
                    {t("glossary.level", "Level")} {spell.level} {spell.school || ""}
                  </span>
                </div>

                {/* Mechanics Badges Row */}
                {(spell.mechanics_badges || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(spell.mechanics_badges || []).map((badge: string, badgeIdx: number) => (
                      <span
                        key={badgeIdx}
                        style={getStatBadgeStyle(badge)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {spell.duration && (
                  <span className="block text-[10px] text-[var(--color-text-muted)] mb-2">⏱ {spell.duration}</span>
                )}

                {/* Summary Text */}
                {summary && (
                  <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 [&>p]:line-clamp-3">
                    <DiceText text={summary} />
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] px-4 py-2.5 flex justify-between items-center group-active:bg-[var(--color-border-muted)] transition-colors">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-accent-indigo-600)] tracking-wide uppercase">
                    {t("glossary.viewDetails", "Lihat Detail")}
                  </span>
                  <CaretRight size={16} className="text-[var(--color-accent-indigo-500)]" />
                </div>
              </div>
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
                    style={getStatBadgeStyle(badge)}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-md border shadow-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
            {selectedSpell.lastUpdated && (
              <p className="text-[10px] text-[var(--color-text-muted)]">{t("glossary.lastUpdated")}: {selectedSpell.lastUpdated}</p>
            )}
            <DiceText text={selectedSpell.description || ""} />
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {t("glossary.level", "Level")} {selectedSpell.level}
              </span>
              {selectedSpell.school && (() => {
                const schoolStyle = getSchoolBadgeStyle(selectedSpell.school);
                return (
                  <span
                    style={schoolStyle}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${schoolStyle ? "" : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]"}`}
                  >
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
