"use client";

import { useState, useRef } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { getModifier } from "@/lib/storage";
import { InfoButton } from "@/components/InfoButton";

interface StepSpellsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

function getSpellCountForClass(className: string, level: number, abilityMod: number): { cantrips: number; spells: number } {
  const classData = getStaticClass(className);
  if (!classData?.spellcastingAbility) return { cantrips: 0, spells: 0 };

  const cantripsKnown = classData.cantripsKnown;
  let cantrips = 0;
  if (cantripsKnown) {
    if (Array.isArray(cantripsKnown)) {
      if (level >= 1 && level <= cantripsKnown.length) {
        cantrips = cantripsKnown[level - 1];
      }
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

export function StepSpells({ data, onChange }: StepSpellsProps) {
  const idCounter = useRef(0);
  const classData = data.class ? getStaticClass(data.class) : null;
  const spellcastingAbility = classData?.spellcastingAbility || "int";
  const abilityMod = getModifier(data[spellcastingAbility as keyof Character] as number || 10);

  const allSpells = getStaticSpells().filter((s) => s.classes?.includes(data.class));
  const maxSpellLevel = getMaxSpellLevel(data.class, data.level);

  const { cantrips: maxCantrips, spells: maxSpells } = getSpellCountForClass(data.class, data.level, abilityMod);

  const selectedSpells = data.spells || [];
  const selectedCantrips = selectedSpells.filter((s) => s.level === 0);
  const selectedLevelSpells = selectedSpells.filter((s) => s.level > 0);

  const cantrips = allSpells.filter((s) => s.level === 0);
  const levelSpells = allSpells.filter((s) => s.level > 0 && s.level <= maxSpellLevel);

  const spellLevels: { [key: number]: typeof allSpells } = {};
  for (const spell of levelSpells) {
    const level = spell.level || 1;
    if (!spellLevels[level]) spellLevels[level] = [];
    spellLevels[level].push(spell);
  }

  const toggleCantrip = (spellName: string) => {
    const isSelected = selectedSpells.some((s) => s.name === spellName && s.level === 0);
    if (isSelected) {
      onChange({
        spells: selectedSpells.filter((s) => !(s.name === spellName && s.level === 0)),
        cantrips: (data.cantrips || []).filter((c) => c.name !== spellName),
      });
    } else {
      if (selectedCantrips.length >= maxCantrips) return;
      const id = `spell-${idCounter.current++}`;
      const spell = cantrips.find((s) => s.name === spellName);
      onChange({
        spells: [...selectedSpells, { id, name: spellName, level: 0, source: "srd" as const, description: Array.isArray(spell?.description) ? spell.description.join("\n") : (spell?.description || "") }],
        cantrips: [...(data.cantrips || []), { id, name: spellName }],
      });
    }
  };

  const toggleSpell = (spellName: string, level: number) => {
    const isSelected = selectedSpells.some((s) => s.name === spellName && s.level === level);
    if (isSelected) {
      onChange({
        spells: selectedSpells.filter((s) => !(s.name === spellName && s.level === level)),
      });
    } else {
      if (selectedLevelSpells.length >= maxSpells) return;
      const id = `spell-${idCounter.current++}`;
      const spell = levelSpells.find((s) => s.name === spellName);
      onChange({
        spells: [...selectedSpells, { id, name: spellName, level, source: "srd" as const, description: Array.isArray(spell?.description) ? spell.description.join("\n") : (spell?.description || "") }],
      });
    }
  };

  if (!classData?.spellcastingAbility) {
    return (
      <StepCard title="Spells">
        <p className="text-description">Your class does not have spellcasting abilities.</p>
      </StepCard>
    );
  }

  return (
    <StepCard
      title="Spells"
      hint={`Choose your starting spells. You know ${maxCantrips} cantrips and ${maxSpells} spells. Spells are from the D&D 5e SRD.`}
    >
      <div className="space-y-6">
        {/* Cantrips Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Cantrips
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {selectedCantrips.length} / {maxCantrips}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {cantrips.map((spell) => {
              const isSelected = selectedSpells.some((s) => s.name === spell.name && s.level === 0);
              const isDisabled = !isSelected && selectedCantrips.length >= maxCantrips;
              const spellDesc = Array.isArray(spell.description) ? spell.description.join(" ") : spell.description;
              return (
                <div key={spell.name} className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleCantrip(spell.name)}
                    disabled={isDisabled}
                    className={`flex-1 btn w-full px-3 py-2 text-left ${
                      isSelected
                        ? "btn-primary"
                        : isDisabled
                          ? "btn-secondary opacity-50 cursor-not-allowed"
                          : "btn-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-inherit">{spell.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)] font-medium">
                        {spell.school || ""}
                      </span>
                    </div>
                  </button>
                  {spellDesc && (
                    <InfoButton title={spell.name} description={spellDesc} />
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
                <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Level {level} Spells
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {selectedLevelSpells.filter((s) => s.level === Number(level)).length} / {maxSpells}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {spells.map((spell) => {
                  const isSelected = selectedSpells.some((s) => s.name === spell.name && s.level === Number(level));
                  const isDisabled = !isSelected && selectedLevelSpells.length >= maxSpells;
                  const spellDesc = Array.isArray(spell.description) ? spell.description.join(" ") : spell.description;
                  return (
                    <div key={spell.name} className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSpell(spell.name, Number(level))}
                        disabled={isDisabled}
                        className={`flex-1 btn w-full px-3 py-2 text-left ${
                          isSelected
                            ? "btn-primary"
                            : isDisabled
                              ? "btn-secondary opacity-50 cursor-not-allowed"
                              : "btn-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-inherit">{spell.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-text-muted)] font-medium">
                              {spell.school || ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                            {spell.castingTime}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                            {spell.range}
                          </span>
                        </div>
                      </button>
                      {spellDesc && (
                        <InfoButton title={spell.name} description={spellDesc} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </StepCard>
  );
}
