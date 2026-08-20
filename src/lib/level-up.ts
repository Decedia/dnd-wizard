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

export interface LevelUpStepSection {
  type: "hp" | "features" | "subclass" | "asi" | "expertise" | "spellSlots" | "spellSelection";
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
  spellSelectionCount?: number;
  spellSelectionLevel?: number;
  level?: number;
}

export interface LevelUpStep {
  id: string;
  level: number;
  title: string;
  description?: string;
  sections: LevelUpStepSection[];
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
  currentSkills: Record<string, boolean> = {},
  includeCurrentLevel: boolean = false
): LevelUpStep[] {
  const classData = getClassData(className);
  if (!classData || !classData.levels) return [];

  const steps: LevelUpStep[] = [];
  const startLevel = includeCurrentLevel ? oldLevel : oldLevel + 1;

  for (let level = startLevel; level <= newLevel; level++) {
    const levelData = classData.levels[level - 1];
    const sections: LevelUpStepSection[] = [];

    const isCurrentLevel = includeCurrentLevel && level === oldLevel;
    if (!isCurrentLevel) {
      sections.push({
        type: "hp",
        description: `Roll or take average for your ${classData.hitDie}-sided hit die.`,
      });
    }

    if (levelData?.features?.length > 0) {
      sections.push({
        type: "features",
        features: levelData.features,
      });
    }

    if (level === classData.subclassLevel && classData.subclasses && classData.subclasses.length > 0) {
      sections.push({
        type: "subclass",
        description: `Choose your ${classData.name} subclass.`,
        subclassOptions: classData.subclasses,
      });
    }

    if (levelData?.asi) {
      sections.push({
        type: "asi",
        description: "Distribute 2 points among your abilities (max 20).",
        asiCount: 2,
      });
    }

    if (className === "Rogue") {
      const expertiseScaling = classData.scalingFeatures?.find((f) => f.type === "feature" && f.name === "Expertise");
      const totalCount = expertiseScaling?.values[level] || 0;
      const currentCount = currentExpertise.length;
      if (totalCount > currentCount) {
        sections.push({
          type: "expertise",
          description: `Choose ${totalCount - currentCount} skill${totalCount - currentCount !== 1 ? "s" : ""} to double your proficiency bonus.`,
          expertiseCount: totalCount - currentCount,
        });
      }
    }

    if (levelData?.spellSlots) {
      sections.push({
        type: "spellSlots",
        spellSlots: levelData.spellSlots,
      });
    }

    if (classData.spellcastingAbility && levelData?.spellSlots) {
      const prevLevelData = level > 1 ? classData.levels[level - 2] : null;
      const cantripsKnown = classData.cantripsKnown?.[level] || 0;
      const prevCantripsKnown = prevLevelData ? (classData.cantripsKnown?.[level - 1] || 0) : 0;
      const prevSlots = prevLevelData?.spellSlots || {};
      const slotsChanged = Object.keys(levelData.spellSlots).length !== Object.keys(prevSlots).length ||
        Object.entries(levelData.spellSlots).some(([k, v]) => prevSlots[Number(k)] !== v);
      const cantripsChanged = cantripsKnown > prevCantripsKnown;
      if (slotsChanged || cantripsChanged) {
        sections.push({
          type: "spellSelection",
          description: `Choose your spells for the spell levels you now have access to.`,
          spellSlots: levelData.spellSlots,
          spellSelectionCount: Object.values(levelData.spellSlots).reduce((a, b) => a + b, 0),
          spellSelectionLevel: level,
        });
      }
    }

    const levelTitle =
      sections.length === 0
        ? `Level ${level}`
        : sections.length === 1
          ? `Level ${level} - ${sectionLabel(sections[0].type, className)}`
          : `Level ${level}`;

    steps.push({
      id: `level-${level}`,
      level,
      title: levelTitle,
      description: sections[0]?.description,
      sections,
    });
  }

  return steps;
}

function sectionLabel(type: LevelUpStepSection["type"], className: string): string {
  switch (type) {
    case "hp":
      return "Hit Points";
    case "features":
      return "New Features";
    case "subclass":
      return "Choose Subclass";
    case "asi":
      return "Ability Score Improvement";
    case "expertise":
      return "Expertise";
    case "spellSlots":
      return "Spell Slots";
    case "spellSelection":
      return "Spell Selection";
    default:
      return "";
  }
}
