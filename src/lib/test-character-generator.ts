import {
  getStaticClasses,
  getStaticSubclasses,
  getStaticRaces,
  getStaticRace,
  getStaticSpells,
  getStaticWizardSpells,
  getStaticArcaneTricksterSpells,
  getStaticFeats,
  getStaticWeapons,
  getSubclassSpellGrants,
  type SRDClass,
  type SRDSubclass,
  type SRDRace,
} from "@/lib/srd-client";
import { backgroundsData } from "@/data/backgrounds";
import { createEmptyCharacter, saveCharacter, getCharacters, type Character } from "@/lib/storage";
import { finalizeCreation } from "@/lib/character-creation";
import { validateTestCharacter, type CharacterValidationReport } from "@/lib/test-character-validator";

const ALL_SOURCES = ["PHB", "EGW", "XGE", "TCE", "SCAG", "VGTM", "VRGR", "FTD"];

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

function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function randomChoices<T>(options: T[], count: number): T[] {
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, options.length));
}

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
  const classes = getStaticClasses(ALL_SOURCES, "2014");
  const backgrounds = backgroundsData;
  const raceNames = getStaticRaces(ALL_SOURCES, "2014").map((r) => r.name);

  const results: GenerationResult[] = [];
  const validationReports: CharacterValidationReport[] = [];
  let total = 0;

  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
    total += subclasses.filter((s) => s.name && s.name.trim().length > 0).length;
  }

  let current = 0;

  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
    const validSubclasses = subclasses.filter((s) => s.name && s.name.trim().length > 0);

    for (let subIdx = 0; subIdx < validSubclasses.length; subIdx++) {
      const subclass = validSubclasses[subIdx];
      const raceName = randomChoice(raceNames);
      const background = randomChoice(backgrounds).name;
      current++;
      const displayName = `${cls.name} ${subclass.name} Test`;
      onProgress?.(current, total, displayName);

      try {
        const character = await generateSingleCharacter({
          className: cls.name,
          subclassName: subclass.name,
          raceName,
          background,
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
    sources: ALL_SOURCES,
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
  const selectedSkills = randomChoices(skillOptions, skillCount);
  character.skills = {};
  for (const skill of selectedSkills) {
    character.skills[skill] = true;
  }

  character.inventory = [];
  const startingEquipment = classData.startingEquipment || [];
  for (const group of startingEquipment) {
    const eg = group as any;
    if (eg.isWeaponChoice && eg.weaponType && eg.selectionCount) {
      const weapons = getStaticWeapons(ALL_SOURCES);
      const category = eg.weaponType.toLowerCase().replace(/_/g, " ");
      const matching = weapons.filter((w) => {
        const wCat = (w.weapon_category || "").toLowerCase();
        const wRange = (w.category_range || "").toLowerCase();
        return wCat === category || wRange === category;
      });
      const chosen = randomChoices(matching, eg.selectionCount);
      for (const weapon of chosen) {
        character.inventory.push({
          id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: weapon.name,
          quantity: 1,
          equipped: false,
          source: "srd",
          srdItemName: weapon.name,
          isGranted: false,
        });
      }
    } else if (group.granted && group.items && group.items.length > 0) {
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
      const option = randomChoice(group.items);
      character.inventory.push({
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: option.name,
        quantity: option.quantity || 1,
        equipped: false,
        source: "srd",
        srdItemName: option.name,
        isGranted: false,
        choiceGroupIndex: startingEquipment.indexOf(group),
        choiceOptionIndex: group.items.indexOf(option),
      });
    }
  }

  const martialClasses = ["Fighter", "Paladin", "Ranger", "Barbarian"];
  const hasWeapon = character.inventory.some((item) => {
    const name = item.name.toLowerCase();
    return name.includes("sword") || name.includes("axe") || name.includes("bow") || name.includes("crossbow") || name.includes("mace") || name.includes("staff") || name.includes("dagger") || name.includes("spear") || name.includes("hammer") || name.includes("warhammer") || name.includes("longsword") || name.includes("greatsword") || name.includes("rapier") || name.includes("scimitar") || name.includes("shortsword") || name.includes("glaive") || name.includes("halberd") || name.includes("lance") || name.includes("pike") || name.includes("trident") || name.includes("whip") || name.includes("blowgun") || name.includes("handaxe");
  });
  if (martialClasses.includes(className) && !hasWeapon) {
    const defaultWeapon = "Longsword";
    character.inventory.push({
      id: `test-weapon-${Date.now()}`,
      name: defaultWeapon,
      quantity: 1,
      equipped: false,
      source: "srd",
      srdItemName: defaultWeapon,
      isGranted: false,
    });
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
      let cantripList: { name: string; level: number }[] = [];
      if (className === "Wizard") {
        cantripList = getStaticWizardSpells(ALL_SOURCES).filter((s) => s.level === 0);
      } else if (className === "Artificer") {
        const allSpells = getStaticSpells(ALL_SOURCES, "2014");
        cantripList = allSpells.filter((s) => s.level === 0 && s.classes?.includes("Artificer"));
      } else {
        const allSpells = getStaticSpells(ALL_SOURCES, "2014");
        cantripList = allSpells.filter((s) => s.level === 0);
      }
      const uniqueCantrips = Array.from(new Set(cantripList.map((s) => s.name)));
      const selectedCantrips = randomChoices(uniqueCantrips, cantripCount);
      character.cantrips = selectedCantrips.map((name) => ({
        id: `cantrip-test-${name}`.replace(/\s+/g, "-"),
        name,
      }));
    }

    let totalSpellCount = 0;
    let preparedCount = 0;

    if (className === "Wizard") {
      const spellbookSpells = classData.spellbookSpells as Record<string, number> | undefined;
      totalSpellCount = spellbookSpells ? (spellbookSpells[5] || spellbookSpells[4] || spellbookSpells[1] || 0) : 0;
      preparedCount = Math.max(1, abilityMod + character.level);
    } else if (className === "Rogue" && subclassName === "Arcane Trickster") {
      const spellsKnown = classData.spellsKnown as Record<number, number> | undefined;
      totalSpellCount = spellsKnown ? (spellsKnown[5] || 0) : 0;
      preparedCount = totalSpellCount;
    } else if (className === "Artificer") {
      const formula = (classData as any).spellsPreparedFormula || "";
      const halfLevel = Math.floor(character.level / 2);
      const intMod = abilityMod;
      preparedCount = Math.max(1, intMod + halfLevel);
      totalSpellCount = Math.max(preparedCount, 8);
    } else {
      const spellsKnown = classData.spellsKnown as Record<number, number> | undefined;
      totalSpellCount = spellsKnown ? (spellsKnown[5] || 0) : 0;
      preparedCount = totalSpellCount;
    }

    if (totalSpellCount > 0) {
      let spellList: { name: string; level: number }[] = [];
      if (className === "Wizard") {
        spellList = getStaticWizardSpells(ALL_SOURCES).filter((s) => s.level >= 1 && s.level <= 5);
      } else if (className === "Rogue" && subclassName === "Arcane Trickster") {
        spellList = getStaticArcaneTricksterSpells().filter((s) => s.level >= 1 && s.level <= 5);
      } else if (className === "Artificer") {
        const allSpells = getStaticSpells(ALL_SOURCES, "2014");
        spellList = allSpells.filter((s) => s.level >= 1 && s.level <= 5 && s.classes?.includes("Artificer"));
      } else {
        const allSpells = getStaticSpells(ALL_SOURCES, "2014");
        spellList = allSpells.filter((s) => s.level >= 1 && s.level <= 5);
      }
      let uniqueSpells = Array.from(new Set(spellList.map((s) => s.name)));
      const subclassGrants = subclassData?.index ? getSubclassSpellGrants(subclassData.index, character.level) : [];
      const grantSet = new Set(subclassGrants.map((n) => n.toLowerCase()));
      const availableSpells = uniqueSpells.filter((name) => !grantSet.has(name.toLowerCase()));
      const pickFrom = availableSpells.length >= totalSpellCount ? availableSpells : uniqueSpells;
      const selectedSpellNames = randomChoices(pickFrom, totalSpellCount);
      const selectedSpells = selectedSpellNames.map((name) => {
        const srdSpell = spellList.find((s) => s.name === name);
        return {
          id: `spell-test-${name}`.replace(/\s+/g, "-"),
          name,
          level: srdSpell?.level || 1,
          source: "srd" as const,
          srdSpellName: name,
        };
      });
      character.spells = selectedSpells;
      if (className === "Wizard") {
        character.spellbookSpells = selectedSpells.length;
        character.maxSpellbookSpells = selectedSpells.length;
        const preparedSpellNames = randomChoices(selectedSpells, preparedCount).map((s) => s.id);
        character.preparedSpells = preparedSpellNames;
      } else if (className === "Artificer") {
        const preparedSpellNames = randomChoices(selectedSpells, preparedCount).map((s) => s.id);
        character.preparedSpells = preparedSpellNames;
      }
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
    const selected = randomChoices(choice.options, choice.count || 1);
    if (selected.length === 1) {
      character.featureSelections[`class-feature-${choice.level}-${choice.name}`] = [selected[0]];
    } else {
      character.featureSelections[`class-feature-${choice.level}-${choice.name}`] = selected;
    }
  }

  const subclassFeatureChoices = collectSubclassFeatureChoices(subclassData, classData.subclassLevel || 3, 5);
  for (const choice of subclassFeatureChoices) {
    const selected = randomChoices(choice.options, choice.count || 1);
    character.featureSelections[`subclass-feature-${choice.name}`] = selected;
  }

  if (className === "Warlock") {
    const pactBoonChoice = subclassFeatureChoices.find((c) => c.name === "Pact Boon");
    if (pactBoonChoice && !character.featureSelections["pact-boon"]) {
      character.featureSelections["pact-boon"] = [randomChoice(pactBoonChoice.options)];
    }

    const invocationFeatures = classFeatureChoices.filter((c) => c.name === "Eldritch Invocations");
    const allInvocations: string[] = [];
    for (const invFeature of invocationFeatures) {
      const selected = randomChoices(invFeature.options, invFeature.count || 1);
      allInvocations.push(...selected);
    }
    if (allInvocations.length > 0) {
      character.featureSelections["warlock-invocations"] = allInvocations;
    }
  }

  const hasAsiByLevel5 = (classData.levels || []).some((lvl) => {
    const names = (lvl.features || []).map((f: any) => f.name || "");
    return names.some((n: string) => /Ability Score Improvement|ASI/.test(n));
  });
  if (hasAsiByLevel5) {
    const feats = getStaticFeats(ALL_SOURCES, "2014");
    if (feats.length > 0) {
      const featName = randomChoice(feats).name;
      character.featureSelections["class-feature-4-Ability Score Improvement"] = [featName];
      character.featureSelections["feat-selection"] = [featName];
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
      const optionNames = feature.choices.map((c: any) => (typeof c === "string" ? c : c.name || c)).filter(Boolean);
      choices.push({
        name: feature.name,
        level: feature.level,
        options: optionNames,
        count: feature.choicesCount || 1,
      });
    } else if (feature.choices === false && feature.description) {
      const desc = feature.description;
      const afterChoice = desc.split("of your choice.")[1] || desc.split("your choice.")[1] || "";
      const lines = afterChoice.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0 && l !== "Colossus Slayer" && l !== "Giant Killer" && l !== "Horde Breaker" && l !== "Volley" && l !== "Whirlwind Attack");
      const optionNames = lines.filter((l: string) => !l.includes(":") && !l.includes("(") && l.length > 2);
      if (optionNames.length > 0) {
        choices.push({
          name: feature.name,
          level: feature.level,
          options: optionNames,
          count: 1,
        });
      }
    }
  }
  return choices;
}

export function getTestCharacterCount(): number {
  const classes = getStaticClasses(ALL_SOURCES, "2014");
  let total = 0;
  for (const cls of classes) {
    const subclasses = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
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
