import { getClassData } from "@/data/srd";
import { getClassPerLevelHp, getModifier } from "@/lib/storage";

export interface LevelUpResult {
  oldLevel: number;
  newLevel: number;
  addedFeatures: { name: string; description: string }[];
  hasASI: boolean;
  asiLevels: number[];
  spellSlots: Record<number, number> | null;
  hpGain: number;
  abilityScoreChanges?: AbilityScoreChange[];
}

export interface AbilityScoreChange {
  ability: string;
  delta: number;
}

export function computeLevelUp(oldLevel: number, newLevel: number, className: string): LevelUpResult {
  const classData = getClassData(className);
  if (!classData || !classData.levels) {
    return {
      oldLevel,
      newLevel,
      addedFeatures: [],
      hasASI: false,
      asiLevels: [],
      spellSlots: null,
      hpGain: 0,
    };
  }

  const addedFeatures: { name: string; description: string }[] = [];
  const asiLevels: number[] = [];
  let spellSlots: Record<number, number> | null = null;

  for (let level = oldLevel + 1; level <= newLevel; level++) {
    const levelData = classData.levels[level - 1];
    if (levelData) {
      addedFeatures.push(...levelData.features);
      if (levelData.asi) {
        asiLevels.push(level);
      }
      if (levelData.spellSlots) {
        spellSlots = { ...levelData.spellSlots };
      }
    }
  }

  const levelsGained = newLevel - oldLevel;
  const perLevel = getClassPerLevelHp(classData);
  const hpGain = levelsGained > 0 ? levelsGained : 0;

  return {
    oldLevel,
    newLevel,
    addedFeatures,
    hasASI: asiLevels.length > 0,
    asiLevels,
    spellSlots,
    hpGain,
  };
}
