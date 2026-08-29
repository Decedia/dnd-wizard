"use client";

import { useState, useMemo } from "react";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { getModifier, isPreparationCaster } from "@/lib/storage";
import { X, Check, Circle, Info } from "phosphor-react";
import { InfoButton } from "@/components/InfoButton";

interface SpellSelectionModalProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  onClose: () => void;
}

function getSpellCountForClass(className: string, level: number, abilityMod: number): { cantrips: number; spells: number } {
  const classData = getStaticClass(className);
  if (!classData?.spellcastingAbility) return { cantrips: 0, spells: 0 };

  const cantripsKnown = classData.cantripsKnown;
  let cantrips = 0;
  if (cantripsKnown) {
    if (Array.isArray(cantripsKnown)) {
      const idx = Math.min(level - 1, cantripsKnown.length - 1);
      cantrips = cantripsKnown[idx >= 0 ? idx : 0];
    } else {
      const levels = Object.keys(cantripsKnown).map(Number).sort((a, b) => a - b);
      for (const l of levels) {
        if (level >= l) cantrips = (cantripsKnown as Record<number, number>)[l];
      }
    }
  }

  let spells = 0;
  const classNameLower = className.toLowerCase();

  if (classNameLower === "wizard") {
    spells = 6;
  } else if (classNameLower === "sorcerer") {
    const spellsKnownByLevel: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 };
    spells = spellsKnownByLevel[level] || 2;
  } else if (classNameLower === "bard") {
    const spellsKnownByLevel: Record<number, number> = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 16, 15: 18, 16: 18, 17: 19, 18: 19, 19: 20, 20: 22 };
    spells = spellsKnownByLevel[level] || 4;
  } else if (classNameLower === "cleric" || classNameLower === "druid") {
    spells = abilityMod + level;
  } else if (classNameLower === "paladin") {
    if (level < 2) spells = 0;
    else {
      const spellsKnownByLevel: Record<number, number> = { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 };
      spells = spellsKnownByLevel[level] || 2;
    }
  } else if (classNameLower === "ranger") {
    if (level < 2) spells = 0;
    else {
      const spellsKnownByLevel: Record<number, number> = { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 };
      spells = spellsKnownByLevel[level] || 2;
    }
  } else if (classNameLower === "warlock") {
    const spellsKnownByLevel: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 };
    spells = spellsKnownByLevel[level] || 2;
  }

  return { cantrips, spells };
}

function getMaxSpellLevel(className: string, level: number): number {
  const classData = getStaticClass(className);
  if (!classData?.levels) return 0;

  const levelData = classData.levels[level - 1];
  if (!levelData?.spellSlots) return 0;

  return Math.max(...Object.keys(levelData.spellSlots).map(Number));
}

export function SpellSelectionModal({ character, onChange, onClose }: SpellSelectionModalProps) {
  const classData = character.class ? getStaticClass(character.class) : null;
  const spellcastingAbility = classData?.spellcastingAbility || "int";
  const abilityMod = getModifier(character[spellcastingAbility as keyof Character] as number || 10);
  const prepCaster = isPreparationCaster(character);

  const allSpells = getStaticSpells().filter((s) => s.classes?.includes(character.class));
  const maxSpellLevel = getMaxSpellLevel(character.class, character.level);
  const { cantrips: maxCantrips, spells: maxSpells } = getSpellCountForClass(character.class, character.level, abilityMod);

  const selectedSpellIds = new Set((character.preparedSpells || []));
  const selectedSpellNames = new Set((character.spells || []).map(s => s.name?.toLowerCase()));

  const cantrips = allSpells.filter((s) => s.level === 0);
  const levelSpells = allSpells.filter((s) => s.level > 0 && s.level <= maxSpellLevel);

  const spellLevels: { [key: number]: typeof allSpells } = {};
  for (const spell of levelSpells) {
    const level = spell.level || 1;
    if (!spellLevels[level]) spellLevels[level] = [];
    spellLevels[level].push(spell);
  }

  const selectedCantripsCount = (character.spells || []).filter(s => s.level === 0).length;
  const selectedLevelSpellsCount = (character.spells || []).filter(s => s.level > 0).length;

  const toggleSpell = (spellName: string, level: number) => {
    const isSelected = selectedSpellNames.has(spellName.toLowerCase());
    const existingSpell = (character.spells || []).find(s => s.name?.toLowerCase() === spellName.toLowerCase() && s.level === level);

    if (isSelected) {
      const spellId = existingSpell?.id;
      onChange({
        spells: (character.spells || []).filter(s => !(s.name?.toLowerCase() === spellName.toLowerCase() && s.level === level)),
        preparedSpells: (character.preparedSpells || []).filter((id) => id !== spellId),
      });
    } else {
      if (level === 0) {
        if (selectedCantripsCount >= maxCantrips) return;
      } else {
        if (selectedLevelSpellsCount >= maxSpells) return;
      }
      const id = `spell-${spellName}-${level}`.replace(/\s+/g, "-");
      const spell = allSpells.find((s) => s.name === spellName);
      const description = Array.isArray(spell?.description) ? spell.description.join("\n") : (spell?.description || "");
      const damageDice = spell?.damage?.damageDice || "";
      const damageType = spell?.damage?.damageType || "";
      onChange({
        spells: [...(character.spells || []), { id, name: spellName, level, source: "srd" as const, srdSpellName: spellName, description, damageDice, damageType }],
        preparedSpells: prepCaster && level > 0 ? [...(character.preparedSpells || []), id] : character.preparedSpells,
      });
    }
  };

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Cantrips";
    if (level === 1) return "1st Level";
    if (level === 2) return "2nd Level";
    if (level === 3) return "3rd Level";
    return `${level}th Level`;
  };

  if (!classData?.spellcastingAbility) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80" onClick={onClose}>
        <div className="max-w-lg w-full surface bg-ink p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-paper">Spells</h3>
            <button onClick={onClose} className="text-paper-muted hover:text-paper">
              <X weight="regular" className="h-5 w-5" />
            </button>
          </div>
          <p className="text-description text-paper">Your class does not have spellcasting abilities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80" onClick={onClose}>
      <div className="max-w-lg w-full max-h-[80vh] overflow-y-auto surface bg-ink p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-paper">Select Spells</h3>
          <button onClick={onClose} className="text-paper-muted hover:text-paper">
            <X weight="regular" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Cantrips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-paper-muted uppercase tracking-wider">Cantrips</h4>
              <span className="text-xs text-paper-muted">{selectedCantripsCount} / {maxCantrips}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {cantrips.map((spell) => {
                const isSelected = selectedSpellNames.has(spell.name.toLowerCase());
                const isDisabled = !isSelected && selectedCantripsCount >= maxCantrips;
                const desc = Array.isArray(spell.description) ? spell.description.join(" ") : spell.description;
                return (
                  <div key={spell.name} className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSpell(spell.name, 0)}
                      disabled={isDisabled}
                      className={`flex-1 px-3 py-1.5 text-left rounded transition-colors ${
                        isSelected
                          ? "bg-paper text-ink"
                          : isDisabled
                            ? "bg-paper/10 text-paper/30 cursor-not-allowed"
                            : "bg-paper/10 text-paper hover:bg-paper/20"
                      }`}
                    >
                      <span className="text-xs font-bold">{spell.name}</span>
                    </button>
                    {desc && (
                      <InfoButton title={spell.name} description={desc} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spells by Level */}
          {Object.entries(spellLevels)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, spells]) => (
              <div key={level}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-paper-muted uppercase tracking-wider">{getLevelLabel(Number(level))}</h4>
                  <span className="text-xs text-paper-muted">
                    {(character.spells || []).filter(s => s.level === Number(level)).length} / {maxSpells}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {spells.map((spell) => {
                    const isSelected = selectedSpellNames.has(spell.name.toLowerCase());
                    const isDisabled = !isSelected && selectedLevelSpellsCount >= maxSpells;
                    const desc = Array.isArray(spell.description) ? spell.description.join(" ") : spell.description;
                    return (
                      <div key={spell.name} className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSpell(spell.name, Number(level))}
                          disabled={isDisabled}
                          className={`flex-1 px-3 py-1.5 text-left rounded transition-colors ${
                            isSelected
                              ? "bg-paper text-ink"
                              : isDisabled
                                ? "bg-paper/10 text-paper/30 cursor-not-allowed"
                                : "bg-paper/10 text-paper hover:bg-paper/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{spell.name}</span>
                            <span className="text-[10px] text-paper-muted">{spell.school || ""}</span>
                          </div>
                        </button>
                        {desc && (
                          <InfoButton title={spell.name} description={desc} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
