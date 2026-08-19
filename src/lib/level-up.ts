import { getClassData } from "@/data/srd";
import { getClassLevel1Hp, getClassPerLevelHp, getModifier } from "@/lib/storage";

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

export interface LevelUpStep {
  id: string;
  level: number;
  type: "hp" | "features" | "subclass" | "asi" | "expertise" | "spellSlots";
  title: string;
  description?: string;
  features?: { name: string; description: string }[];
  subclassOptions?: {
    name: string;
    description: string;
    features: { name: string; description: string }[];
  }[];
  asiCount?: number;
  expertiseCount?: number;
  spellSlots?: Record<number, number>;
}

export interface LevelUpChanges {
  level: number;
  features: { name: string; description: string }[];
  subclass?: string;
  abilityScoreChanges: { ability: string; delta: number }[];
  expertise: string[];
  spellSlots: Record<number, number> | null;
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

export function generateLevelUpSteps(
  oldLevel: number,
  newLevel: number,
  className: string,
  currentExpertise: string[] = [],
  currentSkills: Record<string, boolean> = {}
): LevelUpStep[] {
  const classData = getClassData(className);
  if (!classData || !classData.levels) return [];

  const steps: LevelUpStep[] = [];

  for (let level = oldLevel + 1; level <= newLevel; level++) {
    const levelData = classData.levels[level - 1];
    const conMod = getModifier(currentSkills || {} ? 10 : 10);

    steps.push({
      id: `hp-${level}`,
      level,
      type: "hp",
      title: `Level ${level} - Hit Points`,
      description: `Roll or take average for your ${classData.hitDie}-sided hit die.`,
    });

    if (levelData?.features?.length > 0) {
      steps.push({
        id: `features-${level}`,
        level,
        type: "features",
        title: `Level ${level} - New Features`,
        features: levelData.features,
      });
    }

    if (level === classData.subclassLevel && classData.subclasses && classData.subclasses.length > 0) {
      steps.push({
        id: `subclass-${level}`,
        level,
        type: "subclass",
        title: `Level ${level} - Choose Subclass`,
        description: `Choose your ${classData.name} subclass.`,
        subclassOptions: classData.subclasses,
      });
    }

    if (levelData?.asi) {
      steps.push({
        id: `asi-${level}`,
        level,
        type: "asi",
        title: `Level ${level} - Ability Score Improvement`,
        description: "Distribute 2 points among your abilities (max 20).",
        asiCount: 2,
      });
    }

    if (className === "Rogue" && (level === 1 || level === 6)) {
      const expertiseScaling = classData.scalingFeatures?.find((f) => f.type === "expertise");
      const totalCount = expertiseScaling?.values[level] || 0;
      const currentCount = currentExpertise.length;
      if (totalCount > currentCount) {
        steps.push({
          id: `expertise-${level}`,
          level,
          type: "expertise",
          title: `Level ${level} - Expertise`,
          description: `Choose ${totalCount - currentCount} skill${totalCount - currentCount !== 1 ? "s" : ""} to double your proficiency bonus.`,
          expertiseCount: totalCount - currentCount,
        });
      }
    }

    if (levelData?.spellSlots) {
      steps.push({
        id: `spellSlots-${level}`,
        level,
        type: "spellSlots",
        title: `Level ${level} - Spell Slots`,
        spellSlots: levelData.spellSlots,
      });
    }
  }

  return steps;
}
