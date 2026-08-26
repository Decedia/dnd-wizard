import { createEmptyCharacter, saveCharacter, computeDerivedStats, generateId, type Character } from "./storage";
import { getStaticClass, getStaticRace, getStaticSubclasses } from "./srd-client";
import type { CreationStep } from "./creation-types";

export type { Character } from "./storage";

interface FeatureSelection {
  featureName: string;
  description: string;
  type: "single" | "multiple" | "skills" | "spells" | "invocations";
  options: string[];
  optionDescriptions?: Record<string, string>;
  count?: number;
  level: number;
  storageKey: string;
  optional?: boolean;
  source?: "class" | "subclass";
}

export interface EquipmentItemRef {
  name: string;
  quantity: number;
  description?: string;
}

export interface EquipmentOption {
  description: string;
  items: EquipmentItemRef[];
  weaponType?: string;
  isWeaponChoice?: boolean;
}

export interface ChoiceGroup {
  id: string;
  description: string;
  options: EquipmentOption[];
}

export function buildChoiceGroups(startingEquipment: any[]): ChoiceGroup[] {
  const groups: ChoiceGroup[] = [];
  let groupCounter = 0;

  startingEquipment.forEach((entry: any) => {
    if (entry.granted) return;
    const desc = entry.description || "";
    const items = entry.items || [];

      const optionMatches = desc.match(/\([a-z]\)\s*[^()]*/g);
      if (optionMatches && optionMatches.length > 1) {
        const options: EquipmentOption[] = optionMatches.map((part: string) => {
          const trimmed = part.trim().replace(/[,\s]+or\s*$/, "").replace(/[,\s]+$/, "");
          const letterMatch = trimmed.match(/^\(([a-z])\)\s*/);
          const optionLetter = letterMatch ? letterMatch[1] : "";
          // Format as "(a) ItemName" with capitalized name
          const nameWithoutLetter = trimmed.replace(/^\(([a-z])\)\s*/, "").trim();
          const capitalizedName = nameWithoutLetter.charAt(0).toUpperCase() + nameWithoutLetter.slice(1);
          const formattedDescription = `(${optionLetter}) ${capitalizedName}`;

          const isWeaponChoice = /(?:any\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapon|two\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapons|a\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapon)/.test(
            trimmed
          );

        let weaponType: string | undefined;
        if (isWeaponChoice) {
          if (trimmed.includes("martial melee")) weaponType = "martial_melee";
          else if (trimmed.includes("martial ranged")) weaponType = "martial_ranged";
          else if (trimmed.includes("martial")) weaponType = "martial";
          else if (trimmed.includes("simple melee")) weaponType = "simple_melee";
          else if (trimmed.includes("simple ranged")) weaponType = "simple_ranged";
          else if (trimmed.includes("simple")) weaponType = "simple";
        }

        const optionItems = items.filter((item: any) => {
          const itemDesc = (item.description || "").toLowerCase();
          return itemDesc.includes(`(${optionLetter})`) || itemDesc.includes(`(${optionLetter.toUpperCase()})`);
        });

        return {
          description: formattedDescription,
          items: optionItems,
          weaponType,
          isWeaponChoice,
        };
      });

      const assignedLetters = new Set(
        options.filter((o) => !o.isWeaponChoice).flatMap((o) => {
          const m = o.description.match(/^\(([a-z])\)/);
          return m ? [m[1]] : [];
        })
      );

      const unmatched = items.filter((item: any) => {
        const itemDesc = (item.description || "").toLowerCase();
        return !Array.from(assignedLetters).some((l) => itemDesc.includes(`(${l})`) || itemDesc.includes(`(${l.toUpperCase()})`));
      });

      const firstNonWeaponIdx = options.findIndex((o) => !o.isWeaponChoice);
      if (firstNonWeaponIdx >= 0 && unmatched.length > 0) {
        options[firstNonWeaponIdx].items.push(...unmatched);
      }

      groups.push({
        id: `choice-${groupCounter++}`,
        description: desc,
        options,
      });
      return;
    }

    if (desc.includes(" or ")) {
      const parts = desc.split(" or ");
      const options: EquipmentOption[] = parts.map((part: string) => {
        const trimmed = part.trim();
        // Capitalize first letter of item name
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        const isWeaponChoice = /(?:any\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapon|two\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapons|a\s+(?:simple|martial)\s*(?:melee|ranged)?\s*weapon)/.test(
          trimmed
        );

        let weaponType: string | undefined;
        if (isWeaponChoice) {
          if (trimmed.includes("martial melee")) weaponType = "martial_melee";
          else if (trimmed.includes("martial ranged")) weaponType = "martial_ranged";
          else if (trimmed.includes("martial")) weaponType = "martial";
          else if (trimmed.includes("simple melee")) weaponType = "simple_melee";
          else if (trimmed.includes("simple ranged")) weaponType = "simple_ranged";
          else if (trimmed.includes("simple")) weaponType = "simple";
        }

        return {
          description: capitalized,
          items: items.length > 0 ? [items[0]] : [],
          weaponType,
          isWeaponChoice,
        };
      });

      groups.push({
        id: `choice-${groupCounter++}`,
        description: desc,
        options,
      });
    } else if (items.length > 0) {
      groups.push({
        id: `choice-${groupCounter++}`,
        description: desc || "Starting equipment",
        options: items.map((item: any) => ({
          description: item.name,
          items: [item],
        })),
      });
    }
  });

  return groups;
}

export function getValidationMessage(step: CreationStep, character?: Character): string {
  switch (step.type) {
    case "identity":
      return "Please enter your character's name, select a background, and choose an alignment.";
    case "class":
      return "Please select a class for your character.";
    case "race":
      return "Please select a race for your character.";
    case "abilities":
      return "Please set all six ability scores before continuing.";
    case "skills":
      return "Please select the required number of skills.";
    case "equipment":
      return "Please choose all required equipment options.";
    case "spells":
      return "Please select your starting spells.";
    case "level":
      if (!character?.level || character.level < 1) return "Please choose a starting level.";
      if (!character.maxHp || character.maxHp <= 0) return "Please enter your character's HP.";
      if ((Object.keys(character.levelHp || {}).length) < (character.level || 1)) return "Please confirm HP for all levels.";
      const classData = character.class ? getStaticClass(character.class) : null;
      const asiLevels = classData?.levels
        .map((lvl, idx) => ({ level: idx + 1, asi: !!lvl.asi }))
        .filter((entry) => entry.asi)
        .map((entry) => entry.level) || [];
      const pendingAsiCount = asiLevels.filter((asiLevel) => !(character.appliedAsi || []).includes(asiLevel) && asiLevel <= character.level).length;
      if (pendingAsiCount > 0) return `Please complete ${pendingAsiCount} pending Ability Score Improvement${pendingAsiCount > 1 ? 's' : ''}.`;
      return "Please complete this step before continuing.";
    case "feature-selections":
      return "Please make all required feature selections.";
    case "appearance":
    default:
      return "Please complete this step before continuing.";
  }
}

export function getCreationSteps(character: Character): CreationStep[] {
  const classData = character.class ? getStaticClass(character.class) : null;

  const identityCompleted = !!character.name.trim() && !!character.background && !!character.alignment;
  const classCompleted = !!character.class;
  const raceCompleted = !!character.race;
  const abilitiesCompleted = [character.str, character.dex, character.con, character.int, character.wis, character.cha].every((s) => s > 0);
  const skillsCompleted = !classData?.skillChoices || Object.entries(character.skills || {}).filter(([name, proficient]) => proficient && classData.skillChoices.options.includes(name)).length >= classData.skillChoices.count;
  const equipmentCompleted = character.inventory.length > 0 && isEquipmentComplete(character, classData);
  const appearanceCompleted = true;

  const asiLevels = classData?.levels
    .map((lvl, idx) => ({ level: idx + 1, asi: !!lvl.asi }))
    .filter((entry) => entry.asi)
    .map((entry) => entry.level) || [];

  const pendingAsiCount = asiLevels.filter((asiLevel) => !character.appliedAsi.includes(asiLevel) && asiLevel <= character.level).length;
  const levelCompleted =
    character.level >= 1 &&
    character.maxHp > 0 &&
    pendingAsiCount === 0 &&
    (Object.keys(character.levelHp || {}).length >= character.level);

  const steps: CreationStep[] = [
    {
      id: "identity",
      title: "Identity",
      description: "Basic character information",
      hint: "Enter your character's name, choose a background, and set their alignment. This is who your character is in the world.",
      type: "identity",
      required: true,
      completed: identityCompleted,
    },
    {
      id: "class",
      title: "Class",
      description: "Choose your character's class",
      hint: "Your class defines your character's core abilities, hit dice, and progression. Choose carefully - this determines what you can do in combat and exploration.",
      type: "class",
      required: true,
      completed: classCompleted,
    },
    {
      id: "race",
      title: "Race",
      description: "Choose your character's race",
      hint: "Your race determines your character's base abilities, traits, and place in the world. Each race has unique features like darkvision, weapon proficiencies, or special abilities.",
      type: "race",
      required: true,
      completed: raceCompleted,
    },
    {
      id: "abilities",
      title: "Ability Scores",
      description: "Set your character's abilities",
      hint: "Ability scores represent your character's physical and mental capabilities. Strength for muscle, Dexterity for agility, Constitution for health, Intelligence for reasoning, Wisdom for perception, and Charisma for presence.",
      type: "abilities",
      required: true,
      completed: abilitiesCompleted,
    },
  ];

  steps.push(
    {
      id: "skills",
      title: "Skills & Proficiencies",
      description: "Choose your character's skills",
      hint: "Skills represent your character's training and expertise. Choose skills that match your character's background and class. Proficient skills add your proficiency bonus to related checks.",
      type: "skills",
      required: true,
      completed: skillsCompleted,
    },
    {
      id: "equipment",
      title: "Equipment",
      description: "Choose starting equipment",
      hint: "Your class determines your starting equipment. Choose weapons, armor, and gear that fit your character's playstyle.",
      type: "equipment",
      required: true,
      completed: equipmentCompleted,
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Final details",
      hint: "Add the finishing touches to your character - appearance, personality, and any other details that bring them to life.",
      type: "appearance",
      required: false,
      completed: appearanceCompleted,
    }
  );

  if (character.class) {
    steps.push({
      id: "level",
      title: "Starting Level",
      description: "Choose your character's starting level",
      hint: "Higher levels mean more abilities and power. Your subclass becomes available when you reach the required level for your class.",
      type: "level",
      required: true,
      completed: levelCompleted,
    });
  }

  // Note: Spell selection is now handled within the LevelUpWizard
  // No separate spell selection step needed in character creation

  const featureSelections = getFeatureSelections(character).filter(s => s.source !== "subclass" && s.source !== "class");
  featureSelections.forEach((selection, index) => {
    const existing = (character as any).featureSelections?.[selection.storageKey];
    const isComplete = selection.optional
      ? true
      : Array.isArray(existing) && existing.length >= (selection.count || 1);

    steps.push({
      id: `feature-selection-${index}`,
      title: `${selection.featureName} (Level ${selection.level})`,
      description: selection.description,
      hint: `You must make a selection for ${selection.featureName}. This is a class feature that requires you to choose from the available options.`,
      type: "feature-selections",
      required: true,
      completed: isComplete,
    });
  });

  return steps;
}

function isEquipmentComplete(character: Character, classData: ReturnType<typeof getStaticClass> | null): boolean {
  if (!classData?.startingEquipment) return character.inventory.length > 0;

  const choiceGroups = buildChoiceGroups(classData.startingEquipment);

  if (choiceGroups.length === 0) return true;

  return choiceGroups.every((group) => {
    const groupIndex = parseInt(group.id.replace("choice-", ""), 10);
    return character.inventory.some((item) => item.choiceGroupIndex === groupIndex);
  });
}

export function getFeatureSelections(character: Character): FeatureSelection[] {
  const classData = character.class ? getStaticClass(character.class) : null;
  if (!classData) return [];

  const selections: FeatureSelection[] = [];

  classData.levels.forEach((level, index) => {
    const levelNumber = index + 1;
    if (levelNumber > character.level) return;
    
    level.features?.forEach((feature: any) => {
      if (feature.choices) {
        const raw = feature.choices;
        const optionNames = Array.isArray(raw?.options) ? raw.options : [];
        const descriptions: Record<string, string> = {};
        if (Array.isArray(raw?.options)) {
          raw.options.forEach((opt: any) => {
            if (typeof opt === "string") return;
            if (opt && typeof opt === "object" && opt.name) {
              descriptions[opt.name] = opt.description || "";
            }
          });
        }
        selections.push({
          featureName: feature.name,
          description: raw?.description || feature.description || `Make a selection for ${feature.name}`,
          type: raw?.type || "single",
          options: optionNames,
          optionDescriptions: descriptions,
          count: raw?.count,
          level: levelNumber,
          storageKey: `feature-${feature.name}`,
          optional: raw?.optional || false,
          source: "class",
        });
      }
    });
  });

  return [...selections, ...getSubclassFeatureSelections(character)];
}

/**
 * Subclass feature choices (e.g. Barbarian Totem animal, Fighter fighting style).
 * Only relevant once a subclass has actually been chosen.
 */
export function getSubclassFeatureSelections(character: Character): FeatureSelection[] {
  if (!character.subclass || !character.class) return [];

  const classData = getStaticClass(character.class);
  const unlockLevel = classData?.subclassLevel ?? 3;
  if (character.level < unlockLevel) return [];

  const subclasses = getStaticSubclasses(character.class);
  const subclass = subclasses.find((s) => s.name === character.subclass);
  if (!subclass) return [];

  const selections: FeatureSelection[] = [];
  const optionDescriptions: Record<string, string> = {};
  for (const feature of subclass.features) {
    if (!feature.choices || feature.choices.length === 0) continue;
    if (feature.level != null && feature.level > character.level) continue;
    feature.choices.forEach((c: any) => {
      if (c?.name) optionDescriptions[c.name] = c.description || "";
    });
    selections.push({
      featureName: feature.name,
      description: (feature.description as string) || `Make a selection for ${feature.name}`,
      type: "single",
      options: feature.choices.map((c: any) => c.name),
      optionDescriptions,
      count: (feature as any).choicesCount,
      level: feature.level ?? unlockLevel,
      storageKey: `subclass-feature-${feature.name}`,
      source: "subclass",
    });
  }

  return selections;
}

export function initializeCharacter(): Character {
  return createEmptyCharacter();
}

function normalizeDescription(description: any): string {
  if (Array.isArray(description)) {
    return description.filter(Boolean).join("\n");
  }
  return description || "";
}

function getClassFeaturesAtLevel(character: Character): { name: string; description: string }[] {
  const classData = character.class ? getStaticClass(character.class) : null;
  if (!classData) return [];
  const features: { name: string; description: string }[] = [];
  classData.levels.forEach((level, index) => {
    if (index + 1 > character.level) return;
    (level.features || []).forEach((f: any) => {
      features.push({ name: f.name, description: normalizeDescription(f.description) });
    });
  });
  return features;
}

function getRaceTraits(character: Character): { name: string; description: string }[] {
  const race = character.race ? getStaticRace(character.race) : null;
  if (!race) return [];
  return (race.traits || []).map((t: any) => ({
    name: t.name,
    description: normalizeDescription(t.description),
  }));
}

/**
 * Rebuilds the character's locked "default" class & race features so that the
 * Features & Traits list always reflects what the character already owns.
 * Subclass and custom features are preserved; class/race features are
 * regenerated from the SRD data for the character's current level.
 */
export function syncBaseFeatures(character: Character): Character {
  const classFeatures = getClassFeaturesAtLevel(character).map((f) => ({ ...f, source: "class" as const }));
  const raceFeatures = getRaceTraits(character).map((f) => ({ ...f, source: "race" as const }));
  const base = [...classFeatures, ...raceFeatures];

  const unlockLevel = getStaticClass(character.class)?.subclassLevel ?? 3;
  const subclassStillValid = !!character.subclass && character.level >= unlockLevel;

  const kept = character.features.filter(
    (f) =>
      !f.source ||
      f.source === "custom" ||
      (f.source === "subclass" && subclassStillValid)
  );

  const baseFeatures: Character["features"] = base.map((f) => ({
    id: `base-${f.source}-${f.name}`.replace(/\s+/g, "-"),
    name: f.name,
    description: f.description,
    source: f.source,
    locked: true,
  }));

  return { ...character, features: [...baseFeatures, ...kept] };
}

/**
 * Returns the subclass features the character has actually earned: every
 * feature at or above the subclass unlock level and at or below the character's
 * current level. This drives both the selection UI and the final feature list.
 */
function getEarnedSubclassFeatures(
  subclass: { features: { name: string; description: string; level?: number; choices?: { name: string; description: string }[] }[] },
  characterLevel: number,
  unlockLevel: number
) {
  return subclass.features.filter(
    (f) => f.level == null || (f.level >= unlockLevel && f.level <= characterLevel)
  );
}

/**
 * Adds the selected subclass's features (every feature earned from the unlock
 * level up through the character's current level) to the Features & Traits list
 * (marked locked/default) when the subclass step is confirmed. For features
 * with choices, only the selected option(s) are added.
 */
export function applySubclassFeatures(character: Character): Character {
  if (!character.subclass) return character;
  const classData = character.class ? getStaticClass(character.class) : null;
  const unlockLevel = classData?.subclassLevel ?? 3;
  if (character.level < unlockLevel) return character;

  const subclasses = getStaticSubclasses(character.class);
  const subclass = subclasses.find((s) => s.name === character.subclass);
  if (!subclass) return character;

  const earnedFeatures = getEarnedSubclassFeatures(subclass, character.level, unlockLevel);

  const newFeatures: Character["features"] = [];
  for (const feature of earnedFeatures) {
    if (feature.choices && feature.choices.length > 0) {
      const key = `subclass-feature-${feature.name}`;
      const selected = (character as any).featureSelections?.[key];
      if (selected && Array.isArray(selected) && selected.length > 0) {
        for (const optName of selected) {
          const opt = feature.choices.find((c: any) => c.name === optName);
          if (opt && !newFeatures.some((f) => f.name === opt.name)) {
            newFeatures.push({
              id: `subclass-${opt.name}`.replace(/\s+/g, "-"),
              name: opt.name,
              description: opt.description,
              source: "subclass" as const,
              locked: true,
            });
          }
        }
      }
    } else {
      if (!newFeatures.some((f) => f.name === feature.name)) {
        newFeatures.push({
          id: `subclass-${feature.name}`.replace(/\s+/g, "-"),
          name: feature.name,
          description: feature.description,
          source: "subclass" as const,
          locked: true,
        });
      }
    }
  }

  const existingNames = new Set(character.features.map((f) => f.name));
  const toAdd = newFeatures.filter((f) => !existingNames.has(f.name));
  return { ...character, features: [...character.features, ...toAdd] };
}

/**
 * Returns true when the subclass step is truly complete:
 * a subclass is selected AND every choice-requiring feature has a selection.
 */
export function isSubclassStepComplete(character: Character): boolean {
  if (!character.subclass) return false;
  const classData = character.class ? getStaticClass(character.class) : null;
  const unlockLevel = classData?.subclassLevel ?? 3;
  if (character.level < unlockLevel) return false;

  const subclasses = getStaticSubclasses(character.class);
  const subclass = subclasses.find((s) => s.name === character.subclass);
  if (!subclass) return false;

  return true;
}

export function finalizeCreation(character: Character): Character {
  let final = applySubclassFeatures(character);
  final = syncBaseFeatures(final);
  const derived = computeDerivedStats(final);
  const finalCharacter = { ...final, ...derived };
  saveCharacter(finalCharacter);
  return finalCharacter;
}
