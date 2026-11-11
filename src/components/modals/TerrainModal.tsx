"use client";

import { getCircleTerrainTypes, getCircleSpells } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { optionIcon } from "@/components/option-icons";
import { optionLine } from "@/lib/option-line";
import type { Character } from "@/lib/storage";
import { OptionPicker } from "./OptionPicker";

interface TerrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  level: number;
  maxSpellLevel: number;
  selectedTerrain: string;
  onTerrainChange: (terrain: string) => void;
}

/** Circle of the Land: pick the terrain whose circle spells you get. */
export function TerrainModal({ isOpen, onClose, level, selectedTerrain, onTerrainChange }: TerrainModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const options = getCircleTerrainTypes().map((terrain) => {
    const label = terrain.charAt(0).toUpperCase() + terrain.slice(1);
    const spells = getCircleSpells(terrain, level);
    const before = level > 3 ? getCircleSpells(terrain, level - 1) : [];
    const added = spells.filter((name) => !before.includes(name));
    const place = optionLine("Natural Explorer", { name: label }, language);
    const list = added.length && added.length < spells.length ? t("picker.newSpells", { spells: added.join(", ") }, "New: {spells}") : t("picker.spells", { spells: spells.join(", ") }, "Spells: {spells}");
    return {
      name: terrain,
      label,
      line: [place, list].filter(Boolean).join(" "),
      info: t("picker.circleSpells", { spells: spells.join(", ") }, "Circle spells: {spells}"),
      Icon: optionIcon("Terrain", label),
    };
  });
  return (
    <OptionPicker
      isOpen={isOpen}
      onClose={onClose}
      title={t("creator.chooseTerrain", "Choose Terrain")}
      hint={t("creator.terrainHint", "Choose your terrain type to gain circle spells. These spells are always prepared and do not count against your preparation limit.")}
      options={options}
      selected={selectedTerrain ? [selectedTerrain] : []}
      onPick={([terrain]) => onTerrainChange(terrain)}
    />
  );
}
