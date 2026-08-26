import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import { getModifier } from "@/lib/storage";
import {
  Heart,
  Lightning,
  ChartBar,
  Target,
  Sparkle,
  MagicWand,
  Shield,
  Crown,
  ClipboardText,
} from "phosphor-react";

export interface LevelUpStepSection {
  type: "hp" | "features" | "asi" | "expertise" | "spellSlots" | "spellSelection" | "skillSelection" | "subclassSelection";
  description?: string;
  features?: { name: string; description: string }[];
  featureChoices?: {
    featureName: string;
    options: string[];
    selected?: string;
    optional?: boolean;
    tigerSkillOptions?: string[];
    tigerSkillCount?: number;
    storageKey?: string;
    descriptions?: Record<string, string>;
  }[];
  asiCount?: number;
  expertiseCount?: number;
  spellSlots?: Record<number, number>;
  spellSelectionCount?: number;
  spellSelectionLevel?: number;
  skillSelectionCount?: number;
  skillOptions?: string[];
  subclassOptions?: { name: string; description: string }[];
  level?: number;
}

export interface LevelUpStep {
  id: string;
  level: number;
  title: string;
  description?: string;
  sections: LevelUpStepSection[];
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
  const unlockLevel = classData.subclassLevel ?? 3;

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

    if (level === unlockLevel && !currentSubclass && (classData.subclasses?.length ?? 0) > 0) {
      const subclasses = getStaticSubclasses(className);
      sections.push({
        type: "subclassSelection",
        subclassOptions: subclasses.map((s) => ({ name: s.name, description: s.description })),
      });
    }

    const classFeatureChoices = (levelData?.features || [])
      .filter((f: any) => f.choices && f.choices.options && f.choices.options.length > 0)
      .map((f: any) => {
        const descriptions: Record<string, string> = {};
        (f.choices.options || []).forEach((opt: any) => {
          if (opt && typeof opt === "object" && opt.name) descriptions[opt.name] = opt.description || "";
        });
        return {
          featureName: f.name,
          options: f.choices.options,
          storageKey: `feature-${f.name}`,
          count: f.choices.count,
          descriptions,
        };
      });

    let features = (levelData?.features || []).map((f: any) => ({ name: f.name, description: normalizeDescription(f.description) }));

    let featureChoices = [...(getFeatureChoices(className, features) || []), ...classFeatureChoices];

    if (currentSubclass && level >= unlockLevel) {
      const subclasses = getStaticSubclasses(className);
      const sub = subclasses.find((s) => s.name === currentSubclass);
      if (sub) {
        const earned = sub.features.filter((f) => f.level === level);
        features = [
          ...features,
          ...earned.map((f) => ({ name: f.name, description: normalizeDescription(f.description) })),
        ];
        const subChoices = earned
          .filter((f) => f.choices && f.choices.length > 0)
          .map((f) => {
            const descriptions: Record<string, string> = {};
            (f.choices || []).forEach((c: any) => { if (c?.name) descriptions[c.name] = c.description || ""; });
            return {
              featureName: f.name,
              options: f.choices!.map((c: any) => c.name),
              storageKey: `subclass-feature-${f.name}`,
              descriptions,
            };
          });
        if (subChoices.length > 0) {
          featureChoices = [...(featureChoices || []), ...subChoices];
        }
      }
    }

    if (features.length > 0) {
      sections.push({
        type: "features",
        features,
        featureChoices,
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

export function sectionTitle(type: LevelUpStepSection["type"]): string {
  switch (type) {
    case "hp":
      return "Hit Points";
    case "features":
      return "New Features";
    case "asi":
      return "Ability Score Improvement";
    case "expertise":
      return "Expertise";
    case "spellSlots":
      return "Spell Slots";
    case "spellSelection":
      return "Spell Selection";
    case "skillSelection":
      return "Skill Selection";
    case "subclassSelection":
      return "Subclass Selection";
    default:
      return "";
  }
}

export function sectionIcon(type: LevelUpStepSection["type"]): React.ReactNode {
  switch (type) {
    case "hp":
      return <Heart weight="regular" className="h-4 w-4" />;
    case "features":
      return <Lightning weight="regular" className="h-4 w-4" />;
    case "asi":
      return <ChartBar weight="regular" className="h-4 w-4" />;
    case "expertise":
      return <Target weight="regular" className="h-4 w-4" />;
    case "spellSlots":
      return <Sparkle weight="regular" className="h-4 w-4" />;
    case "spellSelection":
      return <MagicWand weight="regular" className="h-4 w-4" />;
    case "skillSelection":
      return <Shield weight="regular" className="h-4 w-4" />;
    case "subclassSelection":
      return <Crown weight="regular" className="h-4 w-4" />;
    default:
      return <ClipboardText weight="regular" className="h-4 w-4" />;
  }
}

function sectionLabel(type: LevelUpStepSection["type"], className: string): string {
  switch (type) {
    case "hp":
      return "Hit Points";
    case "features":
      return "New Features";
    case "asi":
      return "Ability Score Improvement";
    case "expertise":
      return "Expertise";
    case "spellSlots":
      return "Spell Slots";
    case "spellSelection":
      return "Spell Selection";
    case "subclassSelection":
      return "Subclass Selection";
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
        storageKey: `feature-${feature.name}`,
        tigerSkillOptions: feature.name === "Aspect of the Beast" ? [...TIGER_ASPECT_SKILLS] : undefined,
        tigerSkillCount: feature.name === "Aspect of the Beast" ? 2 : undefined,
      });
    }
    if (feature.name === "Primal Knowledge") {
      choices.push({
        featureName: feature.name,
        options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
        storageKey: `feature-${feature.name}`,
        optional: true,
      });
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
