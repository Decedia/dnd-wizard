import { getStaticClass } from "@/lib/srd-client";
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
  type: "hp" | "features" | "subclass" | "subclassInfo" | "asi" | "expertise" | "spellSlots" | "spellSelection" | "skillSelection";
  description?: string;
  features?: { name: string; description: string }[];
  featureChoices?: {
    featureName: string;
    options: string[];
    selected?: string;
    optional?: boolean;
    tigerSkillOptions?: string[];
    tigerSkillCount?: number;
  }[];
  subclassOptions?: {
    name: string;
    description: string;
    features: { name: string; description: string; level?: number }[];
  }[];
  subclassFeatureChoices?: {
    featureName: string;
    options: string[];
    selected?: string;
  }[];
  subclassInfo?: {
    name: string;
    description?: string;
    features: { name: string; description: string }[];
  };
  asiCount?: number;
  expertiseCount?: number;
  spellSlots?: Record<number, number>;
  spellSelectionCount?: number;
  spellSelectionLevel?: number;
  skillSelectionCount?: number;
  skillOptions?: string[];
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
  choices?: Record<string, string>;
  skillProficiencies?: string[];
}

export function computeLevelUp(oldLevel: number, newLevel: number, className: string): LevelUpResult {
  const classData = getStaticClass(className);
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
      addedFeatures.push(...levelData.features.map((f: any) => ({ name: f.name, description: normalizeDescription(f.description) })));
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
  includeCurrentLevel: boolean = false,
  currentSubclass?: string
): LevelUpStep[] {
  const classData = getStaticClass(className);
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

    let features = (levelData?.features || []).map((f: any) => ({ name: f.name, description: normalizeDescription(f.description) }));

    if (currentSubclass && classData.subclasses) {
      const subclassData = classData.subclasses.find((s: any) => s.name === currentSubclass);
      if (subclassData?.features) {
        const subclassFeaturesAtLevel = subclassData.features
          .filter((f: any) => (f as any).level != null && (f as any).level === level && (f as any).level !== classData.subclassLevel)
          .filter((f: any) => !features.some((cf: any) => cf.name === f.name))
          .map((f: any) => ({ name: f.name, description: normalizeDescription(f.description) }));
        features = [...features, ...subclassFeaturesAtLevel];
      }
    }

    if (features.length > 0) {
      sections.push({
        type: "features",
        features,
        featureChoices: getFeatureChoices(className, features),
      });
    }

    if (currentSubclass && classData.subclasses) {
      const subclassData = classData.subclasses.find((s: any) => s.name === currentSubclass);
      if (subclassData) {
        const featureNames = new Set(features.map((f: any) => f.name));
        const subclassFeaturesAtLevel = (subclassData.features || [])
          .filter((f: any) => (f as any).level == null || (f as any).level === level)
          .filter((f: any) => !featureNames.has(f.name))
          .map((f: any) => ({ name: f.name, description: normalizeDescription(f.description) }));
        sections.push({
          type: "subclassInfo",
          description: `Your ${classData.name} subclass: ${currentSubclass}`,
          subclassInfo: {
            name: currentSubclass,
            description: subclassData.description,
            features: subclassFeaturesAtLevel,
          },
        });
      }
    }

    if (level === classData.subclassLevel && classData.subclasses && classData.subclasses.length > 0) {
      const subclassOptions = classData.subclasses.map((sub: any) => ({
        ...sub,
        features: (sub.features || [])
          .filter((f: any) => (f as any).level == null || (f as any).level === classData.subclassLevel)
          .map((f: any) => ({ name: f.name, description: normalizeDescription(f.description), level: f.level })),
      }));
      sections.push({
        type: "subclass",
        description: `Choose your ${classData.name} subclass.`,
        subclassOptions,
        subclassFeatureChoices: getSubclassFeatureChoices(className, subclassOptions),
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
      if (expertiseScaling?.values) {
        const sortedLevels = Object.keys(expertiseScaling.values)
          .map(Number)
          .sort((a, b) => a - b);
        const currentIndex = sortedLevels.indexOf(level);
        if (currentIndex >= 0) {
          const currentValue = expertiseScaling.values[level];
          const prevValue = currentIndex > 0 ? (expertiseScaling.values[sortedLevels[currentIndex - 1]] || 0) : 0;
          if (currentValue > prevValue) {
            const currentCount = currentExpertise.length;
            const expertiseCount = Math.max(0, currentValue - Math.max(currentCount, prevValue));
            if (expertiseCount > 0) {
              const hasExisting = prevValue > 0 || currentCount > 0;
              sections.push({
                type: "expertise",
                description: `Choose ${expertiseCount} ${hasExisting ? "more " : ""}skill${expertiseCount !== 1 ? "s" : ""} to double your proficiency bonus.`,
                expertiseCount,
              });
            }
          }
        }
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

const TOTEM_FEATURES = ["Totem Spirit", "Aspect of the Beast", "Totem Attunement"] as const;
const TOTEM_ANIMALS = ["Bear", "Eagle", "Elk", "Tiger", "Wolf"] as const;
const TIGER_ASPECT_SKILLS = ["Athletics", "Acrobatics", "Stealth", "Survival"] as const;

function getFeatureChoices(className: string, features: { name: string; description: string; optional?: boolean }[]): LevelUpStepSection["featureChoices"] {
  if (className !== "Barbarian") return undefined;
  const choices: LevelUpStepSection["featureChoices"] = [];
  for (const feature of features) {
    if (TOTEM_FEATURES.includes(feature.name as any)) {
      choices.push({
        featureName: feature.name,
        options: [...TOTEM_ANIMALS],
        tigerSkillOptions: feature.name === "Aspect of the Beast" ? [...TIGER_ASPECT_SKILLS] : undefined,
        tigerSkillCount: feature.name === "Aspect of the Beast" ? 2 : undefined,
      });
    }
    if (feature.name === "Primal Knowledge") {
      choices.push({
        featureName: feature.name,
        options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
        optional: true,
      });
    }
  }
  return choices.length > 0 ? choices : undefined;
}

function getSubclassFeatureChoices(
  className: string,
  subclassOptions: { name: string; description: string; features: { name: string; description: string; level?: number }[] }[]
): LevelUpStepSection["subclassFeatureChoices"] {
  if (className !== "Barbarian") return undefined;
  const choices: LevelUpStepSection["subclassFeatureChoices"] = [];
  for (const sub of subclassOptions) {
    if (sub.name === "Totem Warrior") {
      for (const feature of sub.features || []) {
        if (TOTEM_FEATURES.includes(feature.name as any)) {
          choices.push({
            featureName: feature.name,
            options: [...TOTEM_ANIMALS],
          });
        }
      }
    }
  }
  return choices.length > 0 ? choices : undefined;
}

export function normalizeDescription(description: any): string {
  if (Array.isArray(description)) {
    return description.filter(Boolean).join("\n");
  }
  return description || "";
}

export function getAnimalDescription(description: string, animal: string): string | undefined {
  const lines = description.split("\n");
  const prefix = `${animal}.`;
  return lines.find((line) => line.trim().startsWith(prefix));
}
