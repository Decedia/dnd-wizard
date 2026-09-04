"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells, getSubclassFlags, deduplicateSpells } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import type { Character } from "@/lib/storage";
import { getModifier, isPreparationCaster, getDomainSpellNames, getCircleTerrainTypes, getCircleSpells, getMaxSpellLevel } from "@/lib/storage";
import { InfoButton } from "@/components/InfoButton";
import { StarIcon as Star } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";

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
    const spellsKnownByLevel: Record<number, number> = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 20, 19: 21, 20: 22 };
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
  } else if (classNameLower === "artificer") {
    // Artificer: Intelligence modifier + half artificer level, rounded down (minimum 1)
    spells = Math.max(1, abilityMod + Math.floor(level / 2));
  }

  return { cantrips, spells };
}

export function StepSpells({ data, onChange }: StepSpellsProps) {
  const idCounter = useRef(0);
  const classData = data.class ? getStaticClass(data.class) : null;
  const spellcastingAbility = classData?.spellcastingAbility || "int";
  const abilityKey = spellcastingAbility === "intelligence" ? "int" : spellcastingAbility === "wisdom" ? "wis" : spellcastingAbility === "charisma" ? "cha" : spellcastingAbility === "strength" ? "str" : spellcastingAbility === "dexterity" ? "dex" : spellcastingAbility === "constitution" ? "con" : "int";
  const abilityMod = getModifier(data[abilityKey as keyof Character] as number || 10);

  const allSpells = deduplicateSpells(getStaticSpells(data.sources).filter((s) => s.classes?.includes(data.class)));
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
  // Sort each level's spells by source (PHB first), then alphabetically
  for (const level in spellLevels) {
    spellLevels[level].sort((a, b) => {
      const sourceA = (a as any).source || "PHB";
      const sourceB = (b as any).source || "PHB";
      if (sourceA !== sourceB) {
        if (sourceA === "PHB") return -1;
        if (sourceB === "PHB") return 1;
        return sourceA.localeCompare(sourceB);
      }
      return a.name.localeCompare(b.name);
    });
  }
  // Sort cantrips too
  cantrips.sort((a, b) => {
    const sourceA = (a as any).source || "PHB";
    const sourceB = (b as any).source || "PHB";
    if (sourceA !== sourceB) {
      if (sourceA === "PHB") return -1;
      if (sourceB === "PHB") return 1;
      return sourceA.localeCompare(sourceB);
    }
    return a.name.localeCompare(b.name);
  });

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
      const spellId = selectedSpells.find((s) => s.name === spellName && s.level === level)?.id;
      onChange({
        spells: selectedSpells.filter((s) => !(s.name === spellName && s.level === level)),
        preparedSpells: (data.preparedSpells || []).filter((id) => id !== spellId),
      });
    } else {
      if (selectedLevelSpells.length >= maxSpells) return;
      const id = `spell-${idCounter.current++}`;
      const spell = levelSpells.find((s) => s.name === spellName);
      onChange({
        spells: [...selectedSpells, { id, name: spellName, level, source: "srd" as const, description: Array.isArray(spell?.description) ? spell.description.join("\n") : (spell?.description || "") }],
        preparedSpells: prepCaster ? [...(data.preparedSpells || []), id] : data.preparedSpells,
      });
    }
  };

  useEffect(() => {
    if (data.class !== "Cleric" || !data.subclass) return;
    const domainSpellNames = getDomainSpellNames(data);
    if (domainSpellNames.length === 0) return;

    const currentSpellNames = (data.spells || []).map((s) => s.name?.toLowerCase());
    const missingDomainSpells = domainSpellNames.filter(
      (name) => !currentSpellNames.includes(name.toLowerCase())
    );

    if (missingDomainSpells.length > 0) {
      const newSpells: Character["spells"] = [];
      const newPreparedIds: string[] = [];
      for (const name of missingDomainSpells) {
        const spell = getStaticSpells(data.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
        if (spell) {
          const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
          newSpells.push({
            id,
            name: spell.name,
            level: spell.level || 0,
            source: "srd" as const,
            srdSpellName: spell.name,
            description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
          });
          if ((spell.level || 0) > 0) newPreparedIds.push(id);
        }
      }
      onChange({
        spells: [...(data.spells || []), ...newSpells],
        preparedSpells: [...(data.preparedSpells || []), ...newPreparedIds],
        domainSpells: domainSpellNames,
      });
    }
  }, [data.subclass]);

  if (!classData?.spellcastingAbility) {
    return (
      <StepCard title="Spells">
        <p className="text-description">Your class does not have spellcasting abilities.</p>
      </StepCard>
    );
  }

  const prepCaster = isPreparationCaster(data);
  const circleFlags = data.subclassIndex ? getSubclassFlags(data.subclassIndex) : {};
  const isCircleOfLand = data.class === "Druid" && circleFlags.requiresTerrainSelection;
  const selectedTerrain = data.circleTerrain || "";
  const circleSpells = selectedTerrain ? getCircleSpells(selectedTerrain, data.level) : [];

  const handleTerrainChange = (terrain: string) => {
    const currentSpellNames = (data.spells || []).map((s) => s.name?.toLowerCase());
    const currentCircleSpells = data.circleSpells || [];

    if (terrain) {
      const newCircleSpellNames = getCircleSpells(terrain, data.level);
      const spellsToAdd: Character["spells"] = [];
      const preparedIdsToAdd: string[] = [];

      for (const name of newCircleSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(data.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
          if (spell) {
            const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
            spellsToAdd.push({
              id,
              name: spell.name,
              level: spell.level || 0,
              source: "srd" as const,
              srdSpellName: spell.name,
              description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
            });
            if ((spell.level || 0) > 0) preparedIdsToAdd.push(id);
          }
        }
      }

      const spellsToRemove = (data.spells || []).filter((s) =>
        currentCircleSpells.some((cs) => cs.toLowerCase() === s.name?.toLowerCase())
      );
      const remainingSpells = (data.spells || []).filter((s) =>
        !spellsToRemove.some((sr) => sr.id === s.id)
      );
      const remainingPrepared = (data.preparedSpells || []).filter((id) =>
        !spellsToRemove.some((sr) => sr.id === id)
      );

      onChange({
        circleTerrain: terrain,
        circleSpells: newCircleSpellNames,
        spells: [...remainingSpells, ...spellsToAdd],
        preparedSpells: [...remainingPrepared, ...preparedIdsToAdd],
      });
    } else {
      const spellsToRemove = (data.spells || []).filter((s) =>
        currentCircleSpells.some((cs) => cs.toLowerCase() === s.name?.toLowerCase())
      );
      const remainingSpells = (data.spells || []).filter((s) =>
        !spellsToRemove.some((sr) => sr.id === s.id)
      );
      const remainingPrepared = (data.preparedSpells || []).filter((id) =>
        !spellsToRemove.some((sr) => sr.id === id)
      );

      onChange({
        circleTerrain: "",
        circleSpells: [],
        spells: remainingSpells,
        preparedSpells: remainingPrepared,
      });
    }
  };

  return (
    <StepCard
      title="Spells"
      hint={prepCaster
        ? `Choose your prepared spells. You prepare ${maxCantrips} cantrips and ${maxSpells} spells. You can change prepared spells after a long rest.`
        : `Choose your starting spells. You know ${maxCantrips} cantrips and ${maxSpells} spells. Spells are from the D&D 5e SRD.`
      }
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
                        : "btn-secondary"
                    }`}
                  >
                      <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <SourceBadge source={(spell as any).source || "PHB"} size="sm" />
                         <span className="text-sm font-bold text-inherit flex items-center gap-1">
                          {spell.name}
                          {isRecommended("spell", spell.name) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                        </span>
                      </div>
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

        {/* Circle of Land Terrain Selection */}
        {isCircleOfLand && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Circle Spells - Terrain
              </h3>
            </div>
            <select
              value={selectedTerrain}
              onChange={(e) => handleTerrainChange(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            >
              <option value="">Select terrain...</option>
              {getCircleTerrainTypes().map((terrain) => (
                <option key={terrain} value={terrain}>{terrain.charAt(0).toUpperCase() + terrain.slice(1)}</option>
              ))}
            </select>
            {selectedTerrain && circleSpells.length > 0 && (
              <div className="mt-2 p-2 bg-[var(--color-success-50)] border border-[var(--color-success-200)] rounded-lg">
                <p className="text-[10px] text-[var(--color-success-700)] font-semibold mb-1">Circle Spells (always prepared, do not count against limit):</p>
                <div className="flex flex-wrap gap-1">
                  {circleSpells.map((name) => (
                    <span key={name} className="text-[10px] font-bold text-[var(--color-success-600)] bg-[var(--color-success-100)] px-1.5 py-0.5 rounded">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                            : "btn-secondary"
                        }`}
                      >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                               <span className="text-sm font-bold text-inherit flex items-center gap-1">
                          {spell.name}
                          {isRecommended("spell", spell.name) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                        </span>
                              <SourceBadge source={(spell as any).source || "PHB"} size="sm" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                                {spell.school || ""}
                              </span>
                            </div>
                          </div>
<div className="flex items-center gap-2 mt-1">
                            {spell.damage?.damageDice && spell.damage?.damageType && (
                              <DamageBadge type={spell.damage.damageType} size="sm" showLabel={false} />
                            )}
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
