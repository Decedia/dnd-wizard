"use client";

import { useState } from "react";
import { getCircleTerrainTypes, getCircleSpells, getStaticSpells } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const srdSpells = getStaticSpells(character.sources, undefined, language);

  const terrains = getCircleTerrainTypes();
  const filteredTerrains = terrains.filter((terrain) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const terrainSpells = getCircleSpells(terrain, level);
    return terrain.toLowerCase().includes(q) || terrainSpells.some((name) => name.toLowerCase().includes(q));
  });

  const handleSelect = (terrain: string) => {
    onTerrainChange(terrain);
    onClose();
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-full font-bold text-sm transition-colors bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
      >
        {t("common.close", "Close")}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("creator.chooseTerrain", "Choose Terrain")} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-2">
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          {t("creator.terrainHint", "Choose your terrain type to gain circle spells. These spells are always prepared and do not count against your preparation limit.")}
        </p>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terrain..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredTerrains.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No terrains match your search.</p>
        )}
        {filteredTerrains.map((terrain) => {
          const isSelected = selectedTerrain === terrain;
          const terrainSpells = getCircleSpells(terrain, level);
          const prevLevelSpells = level > 3 ? getCircleSpells(terrain, level - 1) : [];
          const newSpells = terrainSpells.filter((name) => !prevLevelSpells.includes(name));
          const subtitle = newSpells.length > 0 ? `New: ${newSpells.join(", ")}` : `Spells: ${terrainSpells.join(", ")}`;
          return (
            <SplitSelectionCard
              key={terrain}
              title={terrain.charAt(0).toUpperCase() + terrain.slice(1)}
              subtitle={subtitle}
              isSelected={isSelected}
              onSelect={() => handleSelect(terrain)}
              infoType="expand"
              isExpanded={isSelected}
              expandedContent={
                <div className="flex flex-wrap gap-1">
                  {terrainSpells.map((name) => {
                    const spellData = srdSpells.find((s) => s.name?.toLowerCase() === name.toLowerCase());
                    return (
                      <span
                        key={name}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-green-500 text-white" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              }
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}
