"use client";

import { useState, useCallback, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier, getMaxPreparedSpells, isPreparationCaster, getDomainSpellNames, getCircleSpells } from "@/lib/storage";
import { PencilSimple, Info, X, Lightning, Plus, Check, Circle, Leaf } from "phosphor-react";
import { DamageBadge } from "./DamageBadge";

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
  damageDice?: string;
  damageType?: string;
  description?: string;
  isCantrip: boolean;
}

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { data } = useSRD();
  const srdSpells = data?.spells || [];
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);
  const [editingCostumeSpellId, setEditingCostumeSpellId] = useState<string | null>(null);
  const [isAddingCostumeSpell, setIsAddingCostumeSpell] = useState(false);
  const [newCostumeSpell, setNewCostumeSpell] = useState({ name: "", description: "" });
  const [activeTab, setActiveTab] = useState(0);

  const preparationCaster = isPreparationCaster(character);
  const maxPrepared = getMaxPreparedSpells(character);
  const domainSpells = getDomainSpellNames(character);
  const circleTerrain = character.circleTerrain || "";
  const circleSpellsList = circleTerrain ? getCircleSpells(circleTerrain, character.level) : [];
  const preparedCount = (character.preparedSpells || []).filter(id => {
    const spell = character.spells.find(s => s.id === id);
    return spell && spell.level > 0 && !circleSpellsList.some(cs => cs.toLowerCase() === spell.name?.toLowerCase());
  }).length;

  const unifiedSpells: UnifiedSpell[] = useMemo(() => {
    const cantrips: UnifiedSpell[] = character.cantrips.map(c => ({
      id: c.id,
      name: c.name,
      level: 0,
      source: "custom" as const,
      isCantrip: true,
    }));
    const spells: UnifiedSpell[] = character.spells.map(s => ({
      id: s.id,
      name: s.name,
      level: s.level,
      source: s.source,
      srdSpellName: s.srdSpellName,
      damageDice: s.damageDice,
      damageType: s.damageType,
      description: s.description,
      isCantrip: false,
    }));
    return [...cantrips, ...spells];
  }, [character.cantrips, character.spells]);

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

  const togglePrepared = useCallback((spellId: string) => {
    const current = character.preparedSpells || [];
    const isPrepared = current.includes(spellId);
    const spell = character.spells.find(s => s.id === spellId);
    if (spell && domainSpells.some(d => d.toLowerCase() === spell.name?.toLowerCase())) return;
    if (spell && circleSpellsList.some(cs => cs.toLowerCase() === spell.name?.toLowerCase())) return;

    if (isPrepared) {
      onChange({ preparedSpells: current.filter(id => id !== spellId) });
    } else {
      if (preparedCount >= maxPrepared && spell && spell.level > 0) return;
      onChange({ preparedSpells: [...current, spellId] });
    }
  }, [character.preparedSpells, character.spells, preparedCount, maxPrepared, domainSpells, circleSpellsList, onChange]);

  const isCircleSpell = useCallback((spell: UnifiedSpell) => {
    return circleSpellsList.some(cs => cs.toLowerCase() === spell.name?.toLowerCase());
  }, [circleSpellsList]);

  const isDomainSpell = useCallback((spell: UnifiedSpell) => {
    return domainSpells.some(d => d.toLowerCase() === spell.name?.toLowerCase());
  }, [domainSpells]);

  const isPrepared = useCallback((spellId: string) => {
    return (character.preparedSpells || []).includes(spellId);
  }, [character.preparedSpells]);

  const updateSpell = useCallback((id: string, patch: Partial<Character["spells"][number]>) => {
    onChange({
      spells: character.spells.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  }, [character.spells, onChange]);

  const updateCantrip = useCallback((id: string, name: string) => {
    onChange({
      cantrips: character.cantrips.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    });
  }, [character.cantrips, onChange]);

  const addSpell = useCallback((level: number) => {
    if (level === 0) {
      onChange({
        cantrips: [
          ...character.cantrips,
          { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "" },
        ],
      });
    } else {
      const newSpell: Character["spells"][number] = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: "",
        level,
        source: "custom",
        damageDice: "",
        damageType: "",
        description: "",
      };
      onChange({ spells: [...character.spells, newSpell] });
    }
  }, [character.spells, character.cantrips, onChange]);

  const removeSpell = useCallback((id: string, isCantrip: boolean) => {
    if (isCantrip) {
      onChange({ cantrips: character.cantrips.filter(c => c.id !== id) });
    } else {
      onChange({ spells: character.spells.filter(s => s.id !== id) });
    }
  }, [character.spells, character.cantrips, onChange]);

  const handleSrdSelect = useCallback((spellId: string, srdName: string) => {
    const srdSpell = srdSpells.find((s) => s.name === srdName);
    if (!srdSpell) return;
    const updated = {
      ...character.spells.find((s) => s.id === spellId)!,
      name: srdSpell.name,
      level: srdSpell.level,
      source: "srd" as const,
      srdSpellName: srdSpell.name,
    };
    onChange({
      spells: character.spells.map(s => (s.id === spellId ? updated : s)),
    });
  }, [character.spells, onChange, srdSpells]);

  const addCostumeSpell = useCallback(() => {
    if (!newCostumeSpell.name.trim()) return;
    const newCostume: Character["costumeSpells"][number] = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: newCostumeSpell.name.trim(),
      description: newCostumeSpell.description.trim(),
    };
    onChange({
      costumeSpells: [...character.costumeSpells, newCostume],
    });
    setNewCostumeSpell({ name: "", description: "" });
    setIsAddingCostumeSpell(false);
  }, [character.costumeSpells, newCostumeSpell, onChange]);

  const updateCostumeSpell = useCallback((id: string, patch: Partial<Character["costumeSpells"][number]>) => {
    onChange({
      costumeSpells: character.costumeSpells.map((cs) =>
        cs.id === id ? { ...cs, ...patch } : cs
      ),
    });
  }, [character.costumeSpells, onChange]);

  const removeCostumeSpell = useCallback((id: string) => {
    onChange({
      costumeSpells: character.costumeSpells.filter((cs) => cs.id !== id),
    });
    if (editingCostumeSpellId === id) {
      setEditingCostumeSpellId(null);
    }
  }, [character.costumeSpells, editingCostumeSpellId, onChange]);

  const saveCostumeSpellEdit = useCallback((id: string) => {
    setEditingCostumeSpellId(null);
  }, []);

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Cantrips";
    if (level === 1) return "1st";
    if (level === 2) return "2nd";
    if (level === 3) return "3rd";
    return `${level}th`;
  };

  return (
    <SectionCard id="spells" title="Spells" icon={<Lightning weight="regular" className="h-5 w-5" />}>
      {preparationCaster && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Prepared Spells: {preparedCount}/{maxPrepared}</span>
          <span className="text-xs text-ink ml-2">(Spellcasting ability mod + level; domain spells always prepared)</span>
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

      <div className="mt-3 space-y-2">
            {activeSpells.map((spell) => {
              const description = spell.srdSpellName ? srdSpells.find((s) => s.name === spell.srdSpellName)?.description : undefined;
              const descriptionText = typeof description === "string" ? description : Array.isArray(description) ? description.join("\n") : undefined;
              const isCustom = spell.source === "custom";
              const dropdownValue = isCustom ? "Custom Spell" : (spell.srdSpellName || "");
              const domainSpell = isDomainSpell(spell);
              const spellPrepared = isPrepared(spell.id);
              const isCantrip = spell.isCantrip;
              return (
                <div key={spell.id} className={`list-row flex flex-wrap items-center gap-2 ${spellPrepared ? "border-l-4 border-[var(--color-success-500)]" : ""}`}>
                  {editMode ? (
                    <>
                      {preparationCaster && !isCantrip && spell.level > 0 && (
                        <button
                          type="button"
                          onClick={() => togglePrepared(spell.id)}
                          className={`shrink-0 ${domainSpell ? "cursor-default" : "cursor-pointer"}`}
                          title={domainSpell ? "Domain spell (always prepared)" : (spellPrepared ? "Click to unprepare" : "Click to prepare")}
                          disabled={domainSpell}
                        >
                          {spellPrepared ? (
                            <Check weight="fill" size={18} className={domainSpell ? "text-[var(--color-warning-500)]" : "text-[var(--color-success-500)]"} />
                          ) : (
                            <Circle weight="regular" size={18} className="text-[var(--color-text-muted)]" />
                          )}
                        </button>
                      )}
                      {isCantrip ? (
                        <input
                          type="text"
                          value={spell.name}
                          onChange={(e) => updateCantrip(spell.id, e.target.value)}
                          onBlur={onFieldBlur}
                          className="input flex-1 min-w-[120px]"
                          placeholder="Cantrip name"
                        />
                      ) : (
                        <select
                          value={dropdownValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Custom Spell") {
                              updateSpell(spell.id, { source: "custom", srdSpellName: undefined, name: spell.name || "" });
                            } else if (val) {
                              handleSrdSelect(spell.id, val);
                            } else {
                              updateSpell(spell.id, { source: "srd", srdSpellName: undefined, name: "" });
                            }
                          }}
                          onBlur={onFieldBlur}
                          className="input flex-1 min-w-[120px]"
                        >
                          <option value="">Select spell...</option>
                          {srdSpells.filter(s => s.level === activeLevel).map((s) => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                          <option value="Custom Spell">Custom Spell</option>
                        </select>
                      )}
                      {isCustom && !isCantrip && (
                        <>
                          <input
                            type="text"
                            value={spell.name}
                            onChange={(e) => updateSpell(spell.id, { name: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input flex-1 min-w-[120px]"
                            placeholder="Enter custom spell name"
                          />
                          <input
                            type="text"
                            value={spell.description || ""}
                            onChange={(e) => updateSpell(spell.id, { description: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input flex-1 min-w-[120px]"
                            placeholder="Spell description / effect"
                          />
                        </>
                      )}
                      {!isCantrip && (
                        <input
                          type="number"
                          value={spell.level}
                          onChange={(e) => updateSpell(spell.id, { level: parseInt(e.target.value || "0", 10) })}
                          onBlur={onFieldBlur}
                          className="input w-14 text-center"
                          placeholder="Lvl"
                        />
                      )}
                      {isCustom && !isCantrip && (
                        <>
                          <input
                            type="text"
                            value={spell.damageDice || ""}
                            onChange={(e) => updateSpell(spell.id, { damageDice: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input w-20 text-center"
                            placeholder="Dice (e.g. 2d6)"
                          />
                          <input
                            type="text"
                            value={spell.damageType || ""}
                            onChange={(e) => updateSpell(spell.id, { damageType: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input w-20 text-center"
                            placeholder="Type"
                          />
                        </>
                      )}
                      {description && !isCustom && (
                        <div className="w-full mt-1">
                          <DescriptionText>{descriptionText}</DescriptionText>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSpell(spell.id, isCantrip)}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shrink-0"
                        aria-label="Remove spell"
                      >
                        <X weight="regular" className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        {preparationCaster && !isCantrip && spell.level > 0 && (
                          <>
                            {spellPrepared ? (
                              <Check weight="fill" size={16} className="text-[var(--color-success-500)] shrink-0" />
                            ) : (
                              <Circle weight="regular" size={16} className="text-[var(--color-text-muted)] shrink-0" />
                            )}
                          </>
                        )}
                          {domainSpell && (
                            <span className="text-[10px] font-bold text-[var(--color-warning-600)] bg-[var(--color-warning-50)] px-1.5 py-0.5 rounded">DOMAIN</span>
                          )}
                          {isCircleSpell(spell) && (
                            <span className="text-[10px] font-bold text-[var(--color-success-600)] bg-[var(--color-success-50)] px-1.5 py-0.5 rounded">CIRCLE</span>
                          )}
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{spell.name}</span>
                        {!isCantrip && <span className="text-xs text-[var(--color-text-secondary)] font-medium">Level {spell.level}</span>}
                        {character.spellcastingAbility && (() => {
                          const castingAbility = character.spellcastingAbility as keyof Character;
                          const castingMod = getModifier(character[castingAbility] as number);
                          return (
                            <span className="badge text-ink bg-paper-muted">
                              {character.spellcastingAbility.toUpperCase()} {castingMod >= 0 ? `+${castingMod}` : castingMod}
                            </span>
                          );
                        })()}
                      </div>
                      {(spell.damageDice || spell.damageType) && (
                        <div className="flex items-center gap-2 mt-1">
                          <DamageBadge type={spell.damageType} size="sm" />
                          {spell.damageDice && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#64748b", backgroundColor: "#64748b15" }}>
                              {spell.damageDice}
                            </span>
                          )}
                        </div>
                      )}
                      {description && <DescriptionText>{description}</DescriptionText>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {editMode && (
            <button
              type="button"
              onClick={() => addSpell(activeLevel)}
              className="mt-3 btn-secondary flex items-center gap-1.5"
            >
              <Plus weight="regular" size={16} />
              Add {activeLevel === 0 ? "Cantrip" : `Level ${activeLevel} Spell`}
            </button>
          )}

          {character.costumeSpells.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Costume Spells</h3>
              <div className="space-y-2">
                {character.costumeSpells.map((costumeSpell) => {
                  const isEditing = editingCostumeSpellId === costumeSpell.id;
                  return (
                    <div key={costumeSpell.id} className="card p-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={costumeSpell.name}
                            onChange={(e) => updateCostumeSpell(costumeSpell.id, { name: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input flex-1"
                            placeholder="Costume spell name"
                          />
                          <textarea
                            value={costumeSpell.description}
                            onChange={(e) => updateCostumeSpell(costumeSpell.id, { description: e.target.value })}
                            onBlur={onFieldBlur}
                            className="textarea min-h-[60px]"
                            placeholder="Description"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveCostumeSpellEdit(costumeSpell.id)}
                               className="btn-primary px-3 py-1.5 text-xs"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCostumeSpellId(null)}
                               className="btn btn-secondary px-3 py-1.5 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-[var(--color-text-primary)]">{costumeSpell.name || "Unnamed Costume Spell"}</div>
                            {costumeSpell.description && (
                              <DescriptionText>{costumeSpell.description}</DescriptionText>
                            )}
                          </div>
                          {editMode && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingCostumeSpellId(costumeSpell.id)}
                                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                aria-label="Edit costume spell"
                              >
                                <PencilSimple weight="regular" className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCostumeSpell(costumeSpell.id)}
                                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                aria-label="Remove costume spell"
                              >
                        <X weight="regular" className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {editMode && !isAddingCostumeSpell && (
                <button
                  type="button"
                  onClick={() => setIsAddingCostumeSpell(true)}
                  className="mt-3 btn-secondary flex items-center gap-1.5"
                >
                  <Plus weight="regular" size={16} />
                  Add Costume Spell
                </button>
              )}
              {isAddingCostumeSpell && (
                  <div className="mt-3 surface bg-ink p-3 space-y-2">
                  <input
                    type="text"
                    value={newCostumeSpell.name}
                    onChange={(e) => setNewCostumeSpell({ ...newCostumeSpell, name: e.target.value })}
                    onBlur={onFieldBlur}
                    className="input"
                    placeholder="Costume spell name"
                  />
                  <textarea
                    value={newCostumeSpell.description}
                    onChange={(e) => setNewCostumeSpell({ ...newCostumeSpell, description: e.target.value })}
                    onBlur={onFieldBlur}
                    className="textarea min-h-[60px]"
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCostumeSpell}
                               className="btn-primary px-3 py-1.5 text-xs"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCostumeSpell(false);
                        setNewCostumeSpell({ name: "", description: "" });
                      }}
                               className="btn btn-secondary px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

      {tooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80" onClick={() => setTooltip(null)}>
          <div className="max-w-sm surface bg-ink p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-paper">{tooltip.name}</h3>
              <button onClick={() => setTooltip(null)} className="text-paper-muted hover:text-paper">
                <X weight="regular" className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-paper">{tooltip.description}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
