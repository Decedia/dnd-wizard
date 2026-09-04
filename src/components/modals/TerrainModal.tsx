"use client";

import { useState } from "react";
import { getCircleTerrainTypes, getCircleSpells, getStaticSpells } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import { BasePopup } from "@/components/BasePopup";
import type { Character } from "@/lib/storage";

interface TerrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  level: number;
  maxSpellLevel: number;
  selectedTerrain: string;
  onTerrainChange: (terrain: string) => void;
}

export function TerrainModal({
  isOpen,
  onClose,
  character,
  level,
  maxSpellLevel,
  selectedTerrain,
  onTerrainChange,
}: TerrainModalProps) {
  const srdSpells = getStaticSpells(character.sources);

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Terrain"
      confirmLabel={undefined}
      cancelLabel={undefined}
      showFooter={false}
    >
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">
        Choose your terrain type to gain circle spells. These spells are always prepared and do not count against your preparation limit.
      </p>
      <div className="space-y-2">
        {getCircleTerrainTypes().map((terrain) => {
          const isSelected = selectedTerrain === terrain;
          const terrainSpells = getCircleSpells(terrain, level);
          const prevLevelSpells = level > 3 ? getCircleSpells(terrain, level - 1) : [];
          const newSpells = terrainSpells.filter((name) => !prevLevelSpells.includes(name));
          return (
            <button
              key={terrain}
              type="button"
              onClick={() => { onTerrainChange(terrain); onClose(); }}
              className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                isSelected
                  ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
              }`}
            >
              <div className="font-semibold text-sm">{terrain.charAt(0).toUpperCase() + terrain.slice(1)}</div>
              {newSpells.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newSpells.map((name) => {
                    const spellData = srdSpells.find((s) => s.name?.toLowerCase() === name.toLowerCase());
                    const desc = spellData?.description ? (Array.isArray(spellData.description) ? spellData.description.join(" ") : spellData.description) : undefined;
                    return (
                      <span key={name} className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}>
                          {name}
                        </span>
                        {desc && (
                          <InfoButton title={name} description={desc} />
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
              {terrainSpells.length > 0 && newSpells.length === 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {terrainSpells.map((name) => (
                    <span key={name} className={`text-[10px] font-bold px-1.5 py-0.5 rounded opacity-60 ${isSelected ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </BasePopup>
  );
}
