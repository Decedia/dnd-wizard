import {
  getStaticClasses,
  getStaticSubclasses,
  getStaticRaces,
  getStaticRace,
  getStaticSpells,
  getStaticEquipments,
  type SRDClass,
  type SRDSubclass,
  type SRDRace,
} from "@/lib/srd-client";
import { backgroundsData } from "@/data/backgrounds";
import { createEmptyCharacter, saveCharacter, getCharacters, type Character } from "@/lib/storage";
import { finalizeCreation } from "@/lib/character-creation";
import { validateTestCharacter, type CharacterValidationReport } from "@/lib/test-character-validator";

const TEST_RACES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
  "Aarakocra",
];

const STANDARD_ARRAY = {
  str: 13,
  dex: 15,
  con: 14,
  int: 10,
  wis: 12,
  cha: 8,
} as const;

export interface GenerationResult {
  name: string;
  success: boolean;
  error?: string;
}

export interface TestGenerationOutput {
  results: GenerationResult[];
  validationReports: CharacterValidationReport[];
}

export async function generateTestCharacters(onProgress?: (current: number, total: number, name: string) => void): Promise<TestGenerationOutput> {
  const classes = getStaticClasses(["PHB"], "2014");
  const backgrounds = backgroundsData;
  const firstBackground = backgrounds[0]?.name || "Acolyte";
  const races = getStaticRaces(["PHB"], "2014");
  const raceNames = races.map((r) => r.name);

  const results: GenerationResult[] = [];
  const validationReports: CharacterValidationReport[] = [];
  let total = 0;

  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ["PHB"], "2014");
    total += subclasses.length;
  }

  let current = 0;

  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ["PHB"], "2014");
    const validSubclasses = subclasses.filter((s) => s.name && s.name.trim().length > 0);

    for (let subIdx = 0; subIdx < validSubclasses.length; subIdx++) {
      const subclass = validSubclasses[subIdx];
      const raceName = raceNames[current % raceNames.length];
      current++;
      const displayName = `${cls.name} ${subclass.name} Test`;
      onProgress?.(current, total, displayName);

      try {
        const character = await generateSingleCharacter({
          className: cls.name,
          subclassName: subclass.name,
          raceName,
          background: firstBackground,
          classData: cls,
          subclassData: subclass,
        });
        await saveCharacter(character);
        validationReports.push(validateTestCharacter(character));
        results.push({ name: displayName, success: true });
      } catch (err) {
        results.push({
          name: displayName,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return { results, validationReports };
}

async function generateSingleCharacter({
  className,
  subclassName,
  raceName,
  background,
  classData,
  subclassData,
}: {
  className: string;
  subclassName: string;
  raceName: string;
  background: string;
  classData: SRDClass;
  subclassData: SRDSubclass;
}): Promise<Character> {
  const character = createEmptyCharacter({
    name: `${className} ${subclassName} Test`,
    playerName: "Test Generator",
    race: raceName,
    class: className,
    subclass: subclassName,
    background,
    alignment: "True Neutral",
    level: 5,
    abilityMethod: "standard",
    sources: ["PHB"],
    ruleset: "2014",
  });

  character.subclassIndex = subclassData.index;

  const raceData = getStaticRace(raceName, "2014");
  const abilityBonuses = raceData?.abilityScoreIncreases || {};

  character.str = STANDARD_ARRAY.str + (abilityBonuses.str || 0);
  character.dex = STANDARD_ARRAY.dex + (abilityBonuses.dex || 0);
  character.con = STANDARD_ARRAY.con + (abilityBonuses.con || 0);
  character.int = STANDARD_ARRAY.int + (abilityBonuses.int || 0);
  character.wis = STANDARD_ARRAY.wis + (abilityBonuses.wis || 0);
  character.cha = STANDARD_ARRAY.cha + (abilityBonuses.cha || 0);

  const skillCount = classData.skillChoices?.count || 0;
  const skillOptions = classData.skillChoices?.options || [];
  character.skills = {};
  for (let i = 0; i < Math.min(skillCount, skillOptions.length); i++) {
    character.skills[skillOptions[i]] = true;
  }

  character.inventory = [];
  const startingEquipment = classData.startingEquipment || [];
  for (const group of startingEquipment) {
    if (group.granted && group.items && group.items.length > 0) {
      for (const item of group.items) {
        character.inventory.push({
          id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: item.name,
          quantity: item.quantity || 1,
          equipped: false,
          source: "srd",
          srdItemName: item.name,
          isGranted: true,
        });
      }
    } else if (!group.granted && group.items && group.items.length > 0) {
      const firstOption = group.items[0];
      character.inventory.push({
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: firstOption.name,
        quantity: firstOption.quantity || 1,
        equipped: false,
        source: "srd",
        srdItemName: firstOption.name,
        isGranted: false,
        choiceGroupIndex: startingEquipment.indexOf(group),
        choiceOptionIndex: 0,
      });
    }
  }

  if (classData.spellcastingAbility) {
    const spellcastingAbility = classData.spellcastingAbility as keyof typeof STANDARD_ARRAY;
    const abilityMod = Math.floor((character[spellcastingAbility] - 10) / 2);
    const profBonus = Math.floor((5 - 1) / 4) + 2;
    character.spellcastingAbility = classData.spellcastingAbility;
    character.spellSaveDc = 8 + profBonus + abilityMod;
    character.spellAttackBonus = profBonus + abilityMod;

    const cantripsKnown = classData.cantripsKnown as Record<number, number> | undefined;
    const cantripCount = cantripsKnown ? (cantripsKnown[5] || cantripsKnown[4] || cantripsKnown[1] || 0) : 0;
    if (cantripCount > 0) {
      const allSpells = getStaticSpells(["PHB"], "2014");
      const uniqueCantrips = Array.from(new Set(allSpells.filter((s) => s.level === 0).map((s) => s.name)));
      character.cantrips = uniqueCantrips.slice(0, cantripCount).map((name) => ({
        id: `cantrip-test-${name}`.replace(/\s+/g, "-"),
        name,
      }));
    }

    const spellsKnown = classData.spellsKnown as Record<number, number> | undefined;
    const spellCount = spellsKnown ? (spellsKnown[5] || 0) : 0;
    if (spellCount > 0) {
      const allSpells = getStaticSpells(["PHB"], "2014");
      const uniqueSpells = Array.from(new Set(allSpells.filter((s) => s.level >= 1 && s.level <= 5).map((s) => s.name)));
      character.spells = uniqueSpells.slice(0, spellCount).map((name) => {
        const srdSpell = allSpells.find((s) => s.name === name);
        return {
          id: `spell-test-${name}`.replace(/\s+/g, "-"),
          name,
          level: srdSpell?.level || 1,
          source: "srd",
          srdSpellName: name,
        };
      });
    }

    const spellSlots: Record<number, number> = {};
    const levelData = classData.levels?.[4];
    if (levelData?.spellSlots) {
      for (const [lvl, count] of Object.entries(levelData.spellSlots)) {
        spellSlots[Number(lvl)] = count;
      }
    }
    character.spellSlots = spellSlots;
    character.spellSlotsExpended = Object.fromEntries(Object.keys(spellSlots).map((k) => [k, 0]));
  }

  character.featureSelections = {};

  const classFeatureChoices = collectFeatureChoices(classData, 5);
  for (const choice of classFeatureChoices) {
    const selected = pickFirstOptions(choice.options, choice.count || 1);
    if (selected.length === 1) {
      character.featureSelections[`class-feature-${choice.level}-${choice.name}`] = [selected[0]];
    } else {
      character.featureSelections[`class-feature-${choice.level}-${choice.name}`] = selected;
    }
  }

  const subclassFeatureChoices = collectSubclassFeatureChoices(subclassData, classData.subclassLevel || 3, 5);
  for (const choice of subclassFeatureChoices) {
    const selected = pickFirstOptions(choice.options, choice.count || 1);
    character.featureSelections[`subclass-feature-${choice.name}`] = selected;
  }

  if (className === "Warlock") {
    const pactBoonChoice = subclassFeatureChoices.find((c) => c.name === "Pact Boon");
    if (pactBoonChoice && !character.featureSelections["pact-boon"]) {
      character.featureSelections["pact-boon"] = [pactBoonChoice.options[0]];
    }

    const invocationFeatures = classFeatureChoices.filter((c) => c.name === "Eldritch Invocations");
    const allInvocations: string[] = [];
    for (const invFeature of invocationFeatures) {
      const selected = pickFirstOptions(invFeature.options, invFeature.count || 1);
      allInvocations.push(...selected);
    }
    if (allInvocations.length > 0) {
      character.featureSelections["warlock-invocations"] = allInvocations;
    }
  }

  const hitDie = classData.hitDie || 10;
  const conMod = Math.floor((character.con - 10) / 2);
  const levelHp: Record<number, number> = {
    1: hitDie + conMod,
  };
  for (let lvl = 2; lvl <= 5; lvl++) {
    levelHp[lvl] = Math.floor(hitDie / 2) + 1 + conMod;
  }
  character.levelHp = levelHp;
  character.maxHp = Object.values(levelHp).reduce((sum, v) => sum + v, 0);
  character.currentHp = character.maxHp;
  character.hitDiceTotal = `${character.level}d${hitDie}`;
  character.hitDiceRemaining = character.level;

  const finalized = await finalizeCreation(character);
  return finalized;
}

interface FeatureChoice {
  name: string;
  level: number;
  options: string[];
  count: number;
}

function collectFeatureChoices(classData: SRDClass, maxLevel: number): FeatureChoice[] {
  const choices: FeatureChoice[] = [];
  for (let idx = 0; idx < classData.levels?.length; idx++) {
    const lvl = idx + 1;
    if (lvl > maxLevel) break;
    const levelData = classData.levels[idx];
    for (const feature of (levelData?.features || []) as any[]) {
      if (feature.choices && feature.choices.options && feature.choices.options.length > 0) {
        const optionNames = feature.choices.options.map((o: any) => (typeof o === "string" ? o : o.name || o)).filter(Boolean);
        choices.push({
          name: feature.name,
          level: lvl,
          options: optionNames,
          count: feature.choices.count || 1,
        });
      }
    }
  }
  return choices;
}

function collectSubclassFeatureChoices(subclassData: SRDSubclass, unlockLevel: number, maxLevel: number): FeatureChoice[] {
  const choices: FeatureChoice[] = [];
  for (const feature of (subclassData.features || []) as any[]) {
    if (feature.level == null || feature.level < unlockLevel || feature.level > maxLevel) continue;
    if (feature.choices && feature.choices.length > 0) {
      const optionNames = feature.choices.map((c: any) => c.name).filter(Boolean);
      choices.push({
        name: feature.name,
        level: feature.level,
        options: optionNames,
        count: feature.choicesCount || 1,
      });
    }
  }
  return choices;
}

function pickFirstOptions(options: string[], count: number): string[] {
  return options.slice(0, Math.min(count, options.length));
}

export function getTestCharacterCount(): number {
  const classes = getStaticClasses(["PHB"], "2014");
  let total = 0;
  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ["PHB"], "2014");
    total += subclasses.filter((s) => s.name && s.name.trim().length > 0).length;
  }
  return total;
}

export async function removeTestCharacters(): Promise<number> {
  const { getCharacters, deleteCharacter } = await import("@/lib/storage");
  const characters = await getCharacters();
  const testCharacters = characters.filter((c) => (c.name || "").endsWith("Test"));
  for (const char of testCharacters) {
    await deleteCharacter(char.id);
  }
  return testCharacters.length;
}
