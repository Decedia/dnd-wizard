import { createEmptyCharacter, saveCharacter, computeDerivedStats, generateId, type Character } from "./storage";
import { getStaticClass, getStaticRace } from "./srd-client";
import type { CreationStep } from "./creation-types";

export type { Character } from "./storage";

interface FeatureSelection {
  featureName: string;
  description: string;
  type: "single" | "multiple" | "skills" | "spells" | "invocations";
  options: string[];
  count?: number;
  level: number;
}

export function getCreationSteps(character: Character): CreationStep[] {
  const steps: CreationStep[] = [
    {
      id: "identity",
      title: "Identity",
      description: "Basic character information",
      hint: "Enter your character's name, background, and alignment. This is who your character is in the world.",
      type: "identity",
      required: true,
      completed: !!character.name.trim(),
    },
    {
      id: "race",
      title: "Race",
      description: "Choose your character's race",
      hint: "Your race determines your character's base abilities, traits, and place in the world. Each race has unique features like darkvision, weapon proficiencies, or special abilities.",
      type: "race",
      required: true,
      completed: !!character.race,
    },
    {
      id: "class",
      title: "Class",
      description: "Choose your character's class",
      hint: "Your class defines your character's core abilities, hit dice, and progression. Choose carefully - this determines what you can do in combat and exploration.",
      type: "class",
      required: true,
      completed: !!character.class,
    },
  ];

  if (character.class) {
    steps.push({
      id: "level",
      title: "Starting Level",
      description: "Choose your character's starting level",
      hint: "Higher levels mean more abilities and power. Your subclass becomes available when you reach the required level for your class.",
      type: "level",
      required: true,
      completed: character.level >= 1,
    });
  }

  const classData = character.class ? getStaticClass(character.class) : null;
  const subclassLevel = classData?.subclassLevel;

  if (subclassLevel && classData?.subclasses && classData.subclasses.length > 0 && character.level >= subclassLevel) {
    steps.push({
      id: "subclass",
      title: `Subclass (Level ${subclassLevel})`,
      description: `Choose your ${classData.name} subclass`,
      hint: `At level ${subclassLevel}, you choose a subclass that defines your character's archetype. Each subclass grants unique features and abilities that shape how your character plays.`,
      type: "subclass",
      required: true,
      completed: !!character.subclass,
    });
  }

  steps.push(
    {
      id: "abilities",
      title: "Ability Scores",
      description: "Set your character's abilities",
      hint: "Ability scores represent your character's physical and mental capabilities. Strength for muscle, Dexterity for agility, Constitution for health, Intelligence for reasoning, Wisdom for perception, and Charisma for presence.",
      type: "abilities",
      required: true,
      completed: [character.str, character.dex, character.con, character.int, character.wis, character.cha].every((s) => s > 0),
    },
    {
      id: "skills",
      title: "Skills & Proficiencies",
      description: "Choose your character's skills",
      hint: "Skills represent your character's training and expertise. Choose skills that match your character's background and class. Proficient skills add your proficiency bonus to related checks.",
      type: "skills",
      required: true,
      completed: true,
    },
    {
      id: "equipment",
      title: "Equipment",
      description: "Choose starting equipment",
      hint: "Your class determines your starting equipment. Choose weapons, armor, and gear that fit your character's playstyle.",
      type: "equipment",
      required: true,
      completed: character.inventory.length > 0,
    },
    {
      id: "spells",
      title: "Spells",
      description: "Choose your starting spells",
      hint: "If your class can cast spells, choose your starting spells here. Spells are divided by level and can be changed when you level up.",
      type: "spells",
      required: classData?.spellcastingAbility ? true : false,
      completed: true,
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Final details",
      hint: "Add the finishing touches to your character - appearance, personality, and any other details that bring them to life.",
      type: "appearance",
      required: false,
      completed: true,
    }
  );

  const featureSelections = getFeatureSelections(character);
  featureSelections.forEach((selection, index) => {
    const key = `feature-${selection.featureName}`;
    const existing = (character as any).featureSelections?.[key];
    const isComplete = selection.type === "single" 
      ? !!existing 
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

export function getFeatureSelections(character: Character): FeatureSelection[] {
  const classData = character.class ? getStaticClass(character.class) : null;
  if (!classData) return [];

  const selections: FeatureSelection[] = [];

  classData.levels.forEach((level, index) => {
    const levelNumber = index + 1;
    if (levelNumber > character.level) return;
    
    level.features?.forEach((feature: any) => {
      if (feature.choices) {
        selections.push({
          featureName: feature.name,
          description: feature.choices.description || feature.description || `Make a selection for ${feature.name}`,
          type: feature.choices.type || "single",
          options: feature.choices.options || [],
          count: feature.choices.count,
          level: levelNumber,
        });
      }
    });
  });

  return selections;
}

export function initializeCharacter(): Character {
  return createEmptyCharacter();
}

export function finalizeCreation(character: Character): Character {
  const derived = computeDerivedStats(character);
  const finalCharacter = { ...character, ...derived };
  saveCharacter(finalCharacter);
  return finalCharacter;
}
