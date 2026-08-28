import { createEmptyCharacter, saveCharacter, computeDerivedStats, generateId, type Character } from "./storage";
import { getStaticClass, getStaticRace, getStaticSubclasses, getStaticEquipments, getStaticWeapons, getStaticArmors, getStaticItems } from "./srd-client";
import type { CreationStep } from "./creation-types";

const ARCANE_FOCUS_NAMES = ["crystal", "orb", "rod", "staff", "wand"];
const HOLY_SYMBOL_NAMES = ["amulet", "emblem", "reliquary"];
const DRUIDIC_FOCUS_NAMES = ["sprig of mistletoe", "totem", "wooden staff", "yew wand"];
const INSTRUMENT_NAMES = ["bagpipes", "drum", "flute", "horn", "lute", "lyre", "pan flute", "shawm", "viol"];

interface SRDItemMatch {
  name: string;
  type: "weapon" | "armor" | "item";
  isChoice?: boolean;
  choiceType?: "weapon" | "instrument" | "arcane_focus" | "holy_symbol" | "druidic_focus";
  weaponType?: string;
}

function normalizeItemName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function findSRDItemMatch(rawName: string): SRDItemMatch | null {
  const normalized = normalizeItemName(rawName);

  const allEquipments = getStaticEquipments();
  const allWeapons = getStaticWeapons();
  const allArmors = getStaticArmors();
  const allItems = getStaticItems();

  if (ARCANE_FOCUS_NAMES.includes(normalized)) {
    const match = allEquipments.find(e => normalizeItemName(e.name) === normalized);
    if (match) {
      return { name: match.name, type: "item", isChoice: false };
    }
    return { name: rawName.charAt(0).toUpperCase() + rawName.slice(1), type: "item", isChoice: false };
  }

  if (HOLY_SYMBOL_NAMES.includes(normalized)) {
    const match = allEquipments.find(e => normalizeItemName(e.name) === normalized);
    if (match) {
      return { name: match.name, type: "item", isChoice: false };
    }
    return { name: rawName.charAt(0).toUpperCase() + rawName.slice(1), type: "item", isChoice: false };
  }

  if (DRUIDIC_FOCUS_NAMES.includes(normalized)) {
    const match = allEquipments.find(e => normalizeItemName(e.name) === normalized);
    if (match) {
      return { name: match.name, type: "item", isChoice: false };
    }
    return { name: rawName.charAt(0).toUpperCase() + rawName.slice(1), type: "item", isChoice: false };
  }

  if (INSTRUMENT_NAMES.includes(normalized)) {
    return { name: rawName.charAt(0).toUpperCase() + rawName.slice(1), type: "item", isChoice: false };
  }

  if (normalized === "arcane focus" || normalized === "an arcane focus" || normalized === "a arcane focus") {
    return { name: "Arcane Focus", type: "item", isChoice: true, choiceType: "arcane_focus" };
  }
  if (normalized === "holy symbol" || normalized === "a holy symbol") {
    return { name: "Holy Symbol", type: "item", isChoice: true, choiceType: "holy_symbol" };
  }
  if (normalized === "druidic focus" || normalized === "a druidic focus") {
    return { name: "Druidic Focus", type: "item", isChoice: true, choiceType: "druidic_focus" };
  }
  if (normalized === "musical instrument" || normalized === "a musical instrument" || normalized === "any other musical instrument") {
    return { name: "Musical Instrument", type: "item", isChoice: true, choiceType: "instrument" };
  }

  const weaponChoiceMatch = rawName.match(/^(?:any|a|two)\s+(?:(simple|martial)\s+)?(?:(melee|ranged)\s+)?(?:weapon|weapons)/i);
  if (weaponChoiceMatch || normalized.includes("weapon")) {
    let weaponType = "";
    if (normalized.includes("martial melee")) weaponType = "martial_melee";
    else if (normalized.includes("martial ranged")) weaponType = "martial_ranged";
    else if (normalized.includes("martial")) weaponType = "martial";
    else if (normalized.includes("simple melee")) weaponType = "simple_melee";
    else if (normalized.includes("simple ranged")) weaponType = "simple_ranged";
    else if (normalized.includes("simple")) weaponType = "simple";
    return { name: "Weapon", type: "weapon", isChoice: true, choiceType: "weapon", weaponType };
  }

  for (const w of allWeapons) {
    if (normalizeItemName(w.name) === normalized || normalized.includes(normalizeItemName(w.name))) {
      return { name: w.name, type: "weapon" };
    }
  }

  for (const a of allArmors) {
    if (normalizeItemName(a.name) === normalized || normalized.includes(normalizeItemName(a.name))) {
      return { name: a.name, type: "armor" };
    }
  }

  for (const e of allEquipments) {
    if (normalizeItemName(e.name) === normalized || normalized.includes(normalizeItemName(e.name))) {
      const type = e.equipment_category === "weapon" ? "weapon" : e.equipment_category === "armor" ? "armor" : "item";
      return { name: e.name, type };
    }
  }

  for (const i of allItems) {
    if (normalizeItemName(i.name) === normalized || normalized.includes(normalizeItemName(i.name))) {
      return { name: i.name, type: "item" };
    }
  }

  let bestMatch: { name: string; type: "weapon" | "armor" | "item"; score: number } | null = null;
  for (const e of allEquipments) {
    const eqName = normalizeItemName(e.name);
    if (eqName.includes(normalized) || normalized.includes(eqName)) {
      const score = Math.min(eqName.length, normalized.length) / Math.max(eqName.length, normalized.length);
      if (!bestMatch || score > bestMatch.score) {
        const type = e.equipment_category === "weapon" ? "weapon" : e.equipment_category === "armor" ? "armor" : "item";
        bestMatch = { name: e.name, type, score };
      }
    }
  }

  if (bestMatch && bestMatch.score > 0.5) {
    return { name: bestMatch.name, type: bestMatch.type };
  }

  return null;
}

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
  isInstrumentChoice?: boolean;
  isArcaneFocusChoice?: boolean;
  isHolySymbolChoice?: boolean;
  isDruidicFocusChoice?: boolean;
  isSimpleChoice?: boolean;
  selectionCount?: number;
}

export interface ChoiceGroup {
  id: string;
  description: string;
  options: EquipmentOption[];
}

function parseOptionLetter(part: string): string {
  const letterMatch = part.match(/^\(([a-z])\)/);
  return letterMatch ? letterMatch[1] : "";
}

function getOptionDisplayText(part: string): string {
  const withoutLetter = part.replace(/^\(([a-z])\)\s*/, "").trim();
  const withoutTrailingOr = withoutLetter.replace(/[,\s]+or\s*$/, "").replace(/[,\s]+$/, "");
  return withoutTrailingOr;
}

function parseSelectionCount(text: string): number {
  const lower = text.toLowerCase();
  if (lower.startsWith("two ")) return 2;
  if (lower.startsWith("three ")) return 3;
  if (lower.startsWith("four ")) return 4;
  if (lower.startsWith("five ")) return 5;
  if (lower.startsWith("six ")) return 6;
  if (lower.startsWith("seven ")) return 7;
  if (lower.startsWith("eight ")) return 8;
  if (lower.startsWith("nine ")) return 9;
  if (lower.startsWith("ten ")) return 10;
  const numMatch = lower.match(/^(\d+)\s+/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 1;
}

function findOptionItems(optionLetter: string, allItems: any[], optionText: string): any[] {
  const matched: any[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const itemDesc = (item.description || "").toLowerCase();
    if (itemDesc.includes(`(${optionLetter})`) || itemDesc.includes(`(${optionLetter.toUpperCase()})`)) {
      matched.push(item);
      usedIndices.add(i);
    }
  }

  if (matched.length > 0) {
    return matched;
  }

  const normalizedOption = normalizeItemName(optionText);
  const optionWords = normalizedOption.split(/\s+/).filter(w => w.length > 2);

  for (let i = 0; i < allItems.length; i++) {
    if (usedIndices.has(i)) continue;
    const item = allItems[i];
    const itemName = normalizeItemName(item.name);
    const itemDesc = normalizeItemName(item.description || "");

    for (const word of optionWords) {
      if (itemName.includes(word) || itemDesc.includes(word)) {
        matched.push(item);
        usedIndices.add(i);
        break;
      }
    }
  }

  return matched;
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
      const optionTexts = optionMatches.map(getOptionDisplayText);
      const optionLetters = optionMatches.map(parseOptionLetter);

      const options: EquipmentOption[] = optionMatches.map((part: string, idx: number) => {
        const optionLetter = optionLetters[idx];
        const optionText = optionTexts[idx];
        const nameWithoutLetter = part.trim().replace(/^\(([a-z])\)\s*/, "").trim().replace(/[,\s]+or\s*$/, "").replace(/[,\s]+$/, "");

        const optionItems = findOptionItems(optionLetter, items, optionText);

        const srdMatch = findSRDItemMatch(nameWithoutLetter);

        let isWeaponChoice = false;
        let isInstrumentChoice = false;
        let isArcaneFocusChoice = false;
        let isHolySymbolChoice = false;
        let isDruidicFocusChoice = false;
        let weaponType: string | undefined;
        let selectionCount: number | undefined;

        if (srdMatch?.isChoice && srdMatch.choiceType === "weapon") {
          isWeaponChoice = true;
          weaponType = srdMatch.weaponType;
          selectionCount = parseSelectionCount(nameWithoutLetter);
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "instrument") {
          isInstrumentChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "arcane_focus") {
          isArcaneFocusChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "holy_symbol") {
          isHolySymbolChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "druidic_focus") {
          isDruidicFocusChoice = true;
        }

        const displayDescription = srdMatch ? srdMatch.name : nameWithoutLetter.charAt(0).toUpperCase() + nameWithoutLetter.slice(1);

        return {
          description: displayDescription,
          items: optionItems,
          weaponType,
          isWeaponChoice,
          isInstrumentChoice,
          isArcaneFocusChoice,
          isHolySymbolChoice,
          isDruidicFocusChoice,
          selectionCount,
        };
      });

      const assignedItems = new Set(options.flatMap(o => o.items));
      const unmatched = items.filter((item: any) => !assignedItems.has(item));

      if (unmatched.length > 0) {
        const firstNonWeaponIdx = options.findIndex((o) => !o.isWeaponChoice && !o.isArcaneFocusChoice && !o.isHolySymbolChoice && !o.isDruidicFocusChoice && !o.isInstrumentChoice);
        if (firstNonWeaponIdx >= 0) {
          options[firstNonWeaponIdx].items.push(...unmatched);
        }
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
        const optionLetter = parseOptionLetter(trimmed);
        const displayText = getOptionDisplayText(trimmed);

        const optionItems = optionLetter ? findOptionItems(optionLetter, items, displayText) : [];

        const srdMatch = findSRDItemMatch(displayText);

        let isWeaponChoice = false;
        let isInstrumentChoice = false;
        let isArcaneFocusChoice = false;
        let isHolySymbolChoice = false;
        let isDruidicFocusChoice = false;
        let weaponType: string | undefined;
        let selectionCount: number | undefined;

        if (srdMatch?.isChoice && srdMatch.choiceType === "weapon") {
          isWeaponChoice = true;
          weaponType = srdMatch.weaponType;
          selectionCount = parseSelectionCount(displayText);
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "instrument") {
          isInstrumentChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "arcane_focus") {
          isArcaneFocusChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "holy_symbol") {
          isHolySymbolChoice = true;
        } else if (srdMatch?.isChoice && srdMatch.choiceType === "druidic_focus") {
          isDruidicFocusChoice = true;
        }

        const displayDescription = srdMatch ? srdMatch.name : displayText.charAt(0).toUpperCase() + displayText.slice(1);

        return {
          description: displayDescription,
          items: optionItems,
          weaponType,
          isWeaponChoice,
          isInstrumentChoice,
          isArcaneFocusChoice,
          isHolySymbolChoice,
          isDruidicFocusChoice,
          selectionCount,
        };
      });

      const assignedItems = new Set(options.flatMap(o => o.items));
      const unmatched = items.filter((item: any) => !assignedItems.has(item));

      if (unmatched.length > 0) {
        const firstNonWeaponIdx = options.findIndex((o) => !o.isWeaponChoice && !o.isArcaneFocusChoice && !o.isHolySymbolChoice && !o.isDruidicFocusChoice && !o.isInstrumentChoice);
        if (firstNonWeaponIdx >= 0) {
          options[firstNonWeaponIdx].items.push(...unmatched);
        }
      }

      groups.push({
        id: `choice-${groupCounter++}`,
        description: desc,
        options,
      });
    } else if (items.length > 0) {
      groups.push({
        id: `choice-${groupCounter++}`,
        description: desc || "Starting equipment",
        options: items.map((item: any) => {
          const srdMatch = findSRDItemMatch(item.name);
          return {
            description: srdMatch ? srdMatch.name : item.name,
            items: [item],
          };
        }),
      });
    }
  });

  return groups;
}

export function getValidationMessage(step: CreationStep, character?: Character): string {
  switch (step.type) {
    case "origin":
      if (!character?.name?.trim()) return "Please enter your character's name.";
      return "Please select a class and race for your character.";
    case "personality":
      return "Please select a background and choose an alignment.";
    case "abilities":
      return "Please set all six ability scores before continuing.";
    case "skills":
      return "Please select the required number of skills.";
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

  const originCompleted = !!character.name.trim() && !!character.class && !!character.race;
  const personalityCompleted = !!character.background && !!character.alignment;
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
      id: "origin",
      title: "Origin",
      description: "Choose class and race",
      hint: "Choose your character's class and race. Your class defines your abilities and role, while your race provides unique traits and ability bonuses.",
      type: "origin",
      required: true,
      completed: originCompleted,
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
  );

  steps.push(
    {
      id: "appearance",
      title: "Appearance",
      description: "Final details",
      hint: "Add the finishing touches to your character - appearance, personality, and any other details that bring them to life.",
      type: "appearance",
      required: false,
      completed: appearanceCompleted,
    },
    {
      id: "personality",
      title: "Personality",
      description: "Background and traits",
      hint: "Define your character's personality, background, and the languages they speak. Your background provides skill proficiencies and special features.",
      type: "personality",
      required: true,
      completed: personalityCompleted,
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
