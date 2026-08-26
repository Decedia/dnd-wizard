"use client";

import { useState, useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier } from "@/lib/storage";
import { PencilSimple, Info, X, Lightning, Plus } from "phosphor-react";

interface SpellsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { data, loading } = useSRD();
  const srdSpells = data?.spells || [];
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);
  const [editingCostumeSpellId, setEditingCostumeSpellId] = useState<string | null>(null);
  const [isAddingCostumeSpell, setIsAddingCostumeSpell] = useState(false);
  const [newCostumeSpell, setNewCostumeSpell] = useState({ name: "", description: "" });

  const updateItem = useCallback((id: string, patch: Partial<Character["spells"][number]>) => {
    onChange({
      spells: character.spells.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  }, [character.spells, onChange]);

  const addItem = useCallback((srdSpellName?: string) => {
    const srdSpell = srdSpellName ? srdSpells.find((s) => s.name === srdSpellName) : undefined;
    const newSpell: Character["spells"][number] = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: srdSpell?.name ?? "",
      level: srdSpell?.level ?? 0,
      source: srdSpell ? "srd" : "custom",
      srdSpellName: srdSpell?.name,
      damageDice: "",
      damageType: "",
      description: "",
    };
    onChange({
      spells: [...character.spells, newSpell],
    });
  }, [character.spells, onChange, srdSpells]);

  const removeItem = useCallback((id: string) => {
    onChange({
      spells: character.spells.filter((s) => s.id !== id),
    });
  }, [character.spells, onChange]);

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
      spells: character.spells.map((s) => (s.id === spellId ? updated : s)),
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

  return (
    <SectionCard id="spells" title="SPELLS" icon={<Lightning weight="regular" className="h-5 w-5" />}>
      <div className="mt-3 space-y-2">
            {character.spells.map((spell) => {
              const description = spell.srdSpellName ? srdSpells.find((s) => s.name === spell.srdSpellName)?.description : undefined;
              const descriptionText = typeof description === "string" ? description : Array.isArray(description) ? description.join("\n") : undefined;
              const isCustom = spell.source === "custom";
              const dropdownValue = isCustom ? "Custom Spell" : (spell.srdSpellName || "");
              return (
                <div key={spell.id} className="list-row flex flex-wrap items-center gap-2">
                  {editMode ? (
                    <>
                      <select
                        value={dropdownValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Custom Spell") {
                            updateItem(spell.id, { source: "custom", srdSpellName: undefined, name: spell.name || "" });
                          } else if (val) {
                            handleSrdSelect(spell.id, val);
                          } else {
                            updateItem(spell.id, { source: "srd", srdSpellName: undefined, name: "" });
                          }
                        }}
                        onBlur={onFieldBlur}
                        className="input flex-1 min-w-[120px]"
                      >
                        <option value="">Select spell...</option>
                        {srdSpells.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                        <option value="Custom Spell">Custom Spell</option>
                      </select>
                      {isCustom && (
                        <>
                          <input
                            type="text"
                            value={spell.name}
                            onChange={(e) => updateItem(spell.id, { name: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input flex-1 min-w-[120px]"
                            placeholder="Enter custom spell name"
                          />
                          <input
                            type="text"
                            value={spell.description || ""}
                            onChange={(e) => updateItem(spell.id, { description: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input flex-1 min-w-[120px]"
                            placeholder="Spell description / effect"
                          />
                        </>
                      )}
                      <input
                        type="number"
                        value={spell.level}
                        onChange={(e) => updateItem(spell.id, { level: parseInt(e.target.value || "0", 10) })}
                        onBlur={onFieldBlur}
                        className="input w-14 text-center"
                        placeholder="Lvl"
                      />
                      {isCustom && (
                        <>
                          <input
                            type="text"
                            value={spell.damageDice || ""}
                            onChange={(e) => updateItem(spell.id, { damageDice: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input w-20 text-center"
                            placeholder="Dice (e.g. 2d6)"
                          />
                          <input
                            type="text"
                            value={spell.damageType || ""}
                            onChange={(e) => updateItem(spell.id, { damageType: e.target.value })}
                            onBlur={onFieldBlur}
                            className="input w-20 text-center"
                            placeholder="Type"
                          />
                        </>
                      )}
                      {description && !isCustom && (
                        <button
                          type="button"
                          onClick={() => setTooltip({ name: spell.name, description: descriptionText || "" })}
                          className="text-paper-muted hover:text-paper shrink-0"
                          aria-label={`Info about ${spell.name}`}
                        >
                          <Info weight="regular" className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(spell.id)}
                        className="text-paper-muted hover:text-paper shrink-0"
                        aria-label="Remove spell"
                      >
                                <X weight="regular" className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-paper">{spell.name}</span>
                        <span className="text-xs text-paper-muted font-medium">Level {spell.level}</span>
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
                        <span className="text-sm text-paper font-medium">
                          {spell.damageDice}{spell.damageType ? ` ${spell.damageType}` : ""}
                        </span>
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
              onClick={() => addItem()}
              className="mt-3 btn-secondary flex items-center gap-1.5"
            >
              <Plus weight="regular" size={16} />
              Add Spell
            </button>
          )}

          {character.costumeSpells.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-paper mb-2">Costume Spells</h3>
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
                                className="text-paper-muted hover:text-paper"
                                aria-label="Edit costume spell"
                              >
                                <PencilSimple weight="regular" className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCostumeSpell(costumeSpell.id)}
                                className="text-paper-muted hover:text-paper"
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
