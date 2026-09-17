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
import { ALIGNMENTS, SKILLS } from "@/lib/storage";
import type { Character } from "@/lib/storage";

export interface ValidationResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  expected?: any;
  actual?: any;
}

export interface CharacterValidationReport {
  characterName: string;
  results: ValidationResult[];
  passed: number;
  failed: number;
  warnings: number;
}

function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function validateTestCharacter(character: Character): CharacterValidationReport {
  const results: ValidationResult[] = [];
  const classData = character.class ? getStaticClasses(["PHB"], "2014").find((c) => c.name === character.class) : null;
  const raceData = character.race ? getStaticRace(character.race, "2014") : null;
  const subclassData = character.class && character.subclass
    ? getStaticSubclasses(character.class, ["PHB"], "2014").find((s) => s.name === character.subclass)
    : null;
  const profBonus = getProficiencyBonus(character.level);

  // Category 1: Ability Scores and Saves
  validateAbilityScores(character, classData, profBonus, results);
  validateSavingThrows(character, classData, profBonus, results);

  // Category 2: Hit Points
  validateHitPoints(character, classData, results);

  // Category 3: Skills and Proficiency
  validateSkills(character, classData, raceData, profBonus, results);

  // Category 4: Features and Traits
  validateFeatures(character, classData, subclassData, raceData, results);

  // Category 5: Subclass Validation
  validateSubclass(character, classData, subclassData, results);

  // Category 6: Spells
  validateSpells(character, classData, subclassData, results);

  // Category 7: Prepared Spells Mechanism
  validatePreparedSpells(character, classData, results);

  // Category 8: Terrain / Natural Explorer (Ranger)
  if (character.class === "Ranger") {
    validateRangerTerrain(character, results);
  }

  // Category 9: Weapon Mastery / Fighting Style
  validateFightingStyle(character, classData, results);

  // Category 10: Equipment and Inventory
  validateEquipment(character, classData, results);

  // Category 11: Overall Completeness
  validateCompleteness(character, classData, results);

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;

  return {
    characterName: character.name,
    results,
    passed,
    failed,
    warnings,
  };
}

function validateAbilityScores(character: Character, classData: SRDClass | null | undefined, profBonus: number, results: ValidationResult[]) {
  const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
  for (const ability of abilities) {
    const score = character[ability];
    const check = `${ability.toUpperCase()} score`;
    if (typeof score !== "number" || score < 1 || score > 30) {
      results.push({
        category: "Ability Scores",
        check,
        status: "fail",
        message: `Ability score must be between 1 and 30`,
        expected: "1-30",
        actual: score,
      });
    } else {
      results.push({
        category: "Ability Scores",
        check,
        status: "pass",
        message: `${ability.toUpperCase()} is ${score}`,
      });
    }

    const mod = getModifier(score);
    const expectedMod = Math.floor((score - 10) / 2);
    if (mod !== expectedMod) {
      results.push({
        category: "Ability Scores",
        check: `${ability.toUpperCase()} modifier`,
        status: "fail",
        message: `Modifier does not match score`,
        expected: expectedMod,
        actual: mod,
      });
    } else {
      results.push({
        category: "Ability Scores",
        check: `${ability.toUpperCase()} modifier`,
        status: "pass",
        message: `${ability.toUpperCase()} modifier is ${mod >= 0 ? "+" : ""}${mod}`,
      });
    }
  }

  if (character.proficiencyBonus !== profBonus) {
    results.push({
      category: "Ability Scores",
      check: "Proficiency bonus",
      status: "fail",
      message: `Proficiency bonus at level 5 should be +3`,
      expected: 3,
      actual: character.proficiencyBonus,
    });
  } else {
    results.push({
      category: "Ability Scores",
      check: "Proficiency bonus",
      status: "pass",
      message: `Proficiency bonus is +${character.proficiencyBonus}`,
    });
  }

  const expectedInitiative = getModifier(character.dex);
  if (character.initiative !== expectedInitiative) {
    results.push({
      category: "Ability Scores",
      check: "Initiative",
      status: "fail",
      message: `Initiative should equal DEX modifier`,
      expected: expectedInitiative,
      actual: character.initiative,
    });
  } else {
    results.push({
      category: "Ability Scores",
      check: "Initiative",
      status: "pass",
      message: `Initiative is ${character.initiative >= 0 ? "+" : ""}${character.initiative}`,
    });
  }

  const perceptionProficient = character.skills["Perception"] ?? false;
  const expectedPassivePerception = 10 + getModifier(character.wis) + (perceptionProficient ? profBonus : 0);
  if (character.passivePerception !== expectedPassivePerception) {
    results.push({
      category: "Ability Scores",
      check: "Passive Perception",
      status: "fail",
      message: `Passive Perception calculation incorrect`,
      expected: expectedPassivePerception,
      actual: character.passivePerception,
    });
  } else {
    results.push({
      category: "Ability Scores",
      check: "Passive Perception",
      status: "pass",
      message: `Passive Perception is ${character.passivePerception}`,
    });
  }
}

function validateSavingThrows(character: Character, classData: SRDClass | null | undefined, profBonus: number, results: ValidationResult[]) {
  if (!classData) return;
  const expectedSaves = classData.savingThrows || [];
  const actualSaves = Object.entries(character.savingThrows)
    .filter(([, val]) => val.proficient)
    .map(([key]) => key);

  const missing = expectedSaves.filter((s) => !actualSaves.includes(s));
  const extra = actualSaves.filter((s) => !expectedSaves.includes(s));

  if (missing.length > 0 || extra.length > 0) {
    results.push({
      category: "Ability Scores",
      check: "Saving throw proficiencies",
      status: "fail",
      message: `Expected: ${expectedSaves.join(", ")}, Got: ${actualSaves.join(", ")}`,
      expected: expectedSaves,
      actual: actualSaves,
    });
  } else {
    results.push({
      category: "Ability Scores",
      check: "Saving throw proficiencies",
      status: "pass",
      message: `Saving throw proficiencies match class definition`,
    });
  }

  for (const [ability, val] of Object.entries(character.savingThrows)) {
    const mod = getModifier(character[ability as keyof Character] as number);
    const expectedValue = val.proficient ? mod + profBonus : mod;
    if (val.value !== expectedValue) {
      results.push({
        category: "Ability Scores",
        check: `${ability.toUpperCase()} save value`,
        status: "fail",
        message: `Save value calculation incorrect`,
        expected: expectedValue,
        actual: val.value,
      });
    }
  }
}

function validateHitPoints(character: Character, classData: SRDClass | null | undefined, results: ValidationResult[]) {
  if (!classData) return;

  const hitDie = classData.hitDie || 10;
  const conMod = getModifier(character.con);
  const expectedLevel1 = hitDie + conMod;
  const expectedPerLevel = Math.floor(hitDie / 2) + 1 + conMod;
  const expectedMaxHp = expectedLevel1 + expectedPerLevel * (character.level - 1);

  if (character.maxHp !== expectedMaxHp) {
    results.push({
      category: "Hit Points",
      check: "Max HP",
      status: "fail",
      message: `Max HP does not match flat-average calculation`,
      expected: expectedMaxHp,
      actual: character.maxHp,
    });
  } else {
    results.push({
      category: "Hit Points",
      check: "Max HP",
      status: "pass",
      message: `Max HP is ${character.maxHp}`,
    });
  }

  const expectedHitDiceTotal = `${character.level}d${hitDie}`;
  if (character.hitDiceTotal !== expectedHitDiceTotal) {
    results.push({
      category: "Hit Points",
      check: "Hit Dice total",
      status: "fail",
      message: `Hit Dice total does not match class`,
      expected: expectedHitDiceTotal,
      actual: character.hitDiceTotal,
    });
  } else {
    results.push({
      category: "Hit Points",
      check: "Hit Dice total",
      status: "pass",
      message: `Hit Dice total is ${character.hitDiceTotal}`,
    });
  }

  if (character.hitDiceRemaining !== character.level) {
    results.push({
      category: "Hit Points",
      check: "Hit Dice remaining",
      status: "warning",
      message: `Hit Dice remaining should equal character level at creation`,
      expected: character.level,
      actual: character.hitDiceRemaining,
    });
  }
}

function validateSkills(character: Character, classData: SRDClass | null | undefined, raceData: SRDRace | null | undefined, profBonus: number, results: ValidationResult[]) {
  if (!classData) return;

  const skillOptions = classData.skillChoices?.options || [];
  const skillCount = classData.skillChoices?.count || 0;
  const proficientSkills = Object.entries(character.skills).filter(([, val]) => val).map(([key]) => key);

  if (proficientSkills.length !== skillCount) {
    results.push({
      category: "Skills",
      check: "Proficient skill count",
      status: "warning",
      message: `Expected ${skillCount} proficient skills, got ${proficientSkills.length}`,
      expected: skillCount,
      actual: proficientSkills.length,
    });
  }

  const invalidSkills = proficientSkills.filter((s) => !skillOptions.includes(s));
  if (invalidSkills.length > 0) {
    results.push({
      category: "Skills",
      check: "Skill selection validity",
      status: "fail",
      message: `Skills not in class allowed list: ${invalidSkills.join(", ")}`,
      expected: "Only skills from class allowed list",
      actual: invalidSkills.join(", "),
    });
  }

  for (const skill of SKILLS) {
    const proficient = character.skills[skill.name] ?? false;
    const abilityMod = getModifier(character[skill.ability as keyof Character] as number);
    const expectedTotal = proficient ? abilityMod + profBonus : abilityMod;
    const actualTotal = (character as any).skills?.[`${skill.name}Total`];
    if (actualTotal !== undefined && actualTotal !== expectedTotal) {
      results.push({
        category: "Skills",
        check: `${skill.name} total`,
        status: "fail",
        message: `Skill total calculation incorrect`,
        expected: expectedTotal,
        actual: actualTotal,
      });
    }
  }

  if (character.expertise && character.expertise.length > 0) {
    const expectedExpertiseCount = character.class === "Rogue" ? 2 : character.class === "Bard" ? 2 : 0;
    if (character.expertise.length !== expectedExpertiseCount) {
      results.push({
        category: "Skills",
        check: "Expertise count",
        status: "warning",
        message: `Expected ${expectedExpertiseCount} expertise skills at level 5, got ${character.expertise.length}`,
        expected: expectedExpertiseCount,
        actual: character.expertise.length,
      });
    }
  }
}

function validateFeatures(character: Character, classData: SRDClass | null | undefined, subclassData: SRDSubclass | null | undefined, raceData: SRDRace | null | undefined, results: ValidationResult[]) {
  if (!classData) return;

  const expectedFeatures = new Set<string>();
  for (let idx = 0; idx < Math.min(character.level, classData.levels?.length || 0); idx++) {
    const levelFeatures = classData.levels[idx]?.features || [];
    for (const f of levelFeatures) {
      if (f.name && !f.name.includes("Choice") && !f.name.includes("choose")) {
        expectedFeatures.add(f.name);
      }
    }
  }

  const actualFeatures = new Set(character.features.map((f) => f.name));
  const missingFeatures = Array.from(expectedFeatures).filter((f) => !actualFeatures.has(f));
  const extraFeatures = Array.from(actualFeatures).filter((f) => !expectedFeatures.has(f) && !f.includes("Choice"));

  if (missingFeatures.length > 0) {
    results.push({
      category: "Features",
      check: "Class features present",
      status: "warning",
      message: `Missing expected features: ${missingFeatures.slice(0, 5).join(", ")}${missingFeatures.length > 5 ? ` (+${missingFeatures.length - 5} more)` : ""}`,
      expected: missingFeatures.slice(0, 5).join(", "),
      actual: "Not found in character.features",
    });
  }

  if (raceData) {
    const raceTraits = new Set((raceData.traits || []).map((t) => t.name));
    const missingRaceTraits = Array.from(raceTraits).filter((t) => !actualFeatures.has(t));
    if (missingRaceTraits.length > 0) {
      results.push({
        category: "Features",
        check: "Race traits present",
        status: "warning",
        message: `Missing race traits: ${missingRaceTraits.slice(0, 3).join(", ")}`,
        expected: missingRaceTraits.slice(0, 3).join(", "),
        actual: "Not found",
      });
    }
  }

  if (subclassData) {
    const subclassFeatures = new Set(
      (subclassData.features || [])
        .filter((f) => f.level == null || f.level <= character.level)
        .map((f) => f.name)
    );
    const missingSubclassFeatures = Array.from(subclassFeatures).filter((f) => !actualFeatures.has(f));
    if (missingSubclassFeatures.length > 0) {
      results.push({
        category: "Features",
        check: "Subclass features present",
        status: "warning",
        message: `Missing subclass features: ${missingSubclassFeatures.slice(0, 3).join(", ")}`,
        expected: missingSubclassFeatures.slice(0, 3).join(", "),
        actual: "Not found",
      });
    }
  }
}

function validateSubclass(character: Character, classData: SRDClass | null | undefined, subclassData: SRDSubclass | null | undefined, results: ValidationResult[]) {
  if (!classData || !classData.subclassLevel) return;
  if (character.level < classData.subclassLevel) return;

  if (!character.subclass) {
    results.push({
      category: "Subclass",
      check: "Subclass selected",
      status: "fail",
      message: `Character has no subclass at level ${character.level}`,
      expected: "A valid subclass name",
      actual: character.subclass,
    });
    return;
  }

  const validSubclasses = getStaticSubclasses(character.class, ["PHB"], "2014");
  const validNames = validSubclasses.map((s) => s.name);
  if (!validNames.includes(character.subclass)) {
    results.push({
      category: "Subclass",
      check: "Subclass validity",
      status: "fail",
      message: `Subclass "${character.subclass}" is not valid for ${character.class}`,
      expected: validNames.slice(0, 5).join(", ") + "...",
      actual: character.subclass,
    });
  }

  if (!character.subclassIndex) {
    results.push({
      category: "Subclass",
      check: "Subclass index",
      status: "warning",
      message: `subclassIndex is not set`,
      expected: "Normalized subclass name",
      actual: character.subclassIndex,
    });
  }
}

function validateSpells(character: Character, classData: SRDClass | null | undefined, subclassData: SRDSubclass | null | undefined, results: ValidationResult[]) {
  if (!classData?.spellcastingAbility) return;

  const spellcastingAbility = classData.spellcastingAbility as keyof typeof character;
  const abilityMod = getModifier(character[spellcastingAbility] as number);
  const profBonus = getProficiencyBonus(character.level);

  const cantripsKnown = classData.cantripsKnown as Record<number, number> | undefined;
  const expectedCantrips = cantripsKnown ? (cantripsKnown[character.level] || cantripsKnown[5] || cantripsKnown[4] || cantripsKnown[1] || 0) : 0;

  if (character.cantrips.length !== expectedCantrips) {
    results.push({
      category: "Spells",
      check: "Cantrips known count",
      status: "warning",
      message: `Expected ${expectedCantrips} cantrips, got ${character.cantrips.length}`,
      expected: expectedCantrips,
      actual: character.cantrips.length,
    });
  }

  const spellsKnown = classData.spellsKnown as Record<number, number> | undefined;
  if (spellsKnown) {
    const expectedSpellsKnown = spellsKnown[character.level] || 0;
    if (character.spells.length !== expectedSpellsKnown) {
      results.push({
        category: "Spells",
        check: "Spells known count",
        status: "warning",
        message: `Expected ${expectedSpellsKnown} spells known, got ${character.spells.length}`,
        expected: expectedSpellsKnown,
        actual: character.spells.length,
      });
    }
  }

  const levelData = classData.levels?.[character.level - 1];
  const expectedSpellSlots = levelData?.spellSlots || {};
  for (const [lvl, expected] of Object.entries(expectedSpellSlots)) {
    const actual = character.spellSlots[Number(lvl)] || 0;
    if (actual !== expected) {
      results.push({
        category: "Spells",
        check: `Spell slots level ${lvl}`,
        status: "fail",
        message: `Spell slot count mismatch`,
        expected: expected,
        actual: actual,
      });
    }
  }

  if (classData.name === "Wizard") {
    const expectedSpellbook = 6 + (character.level - 1) * 2;
    const actualSpellbook = character.spellbookSpells || character.spells.length;
    if (actualSpellbook < expectedSpellbook) {
      results.push({
        category: "Spells",
        check: "Spellbook size",
        status: "warning",
        message: `Expected at least ${expectedSpellbook} spells in spellbook, got ${actualSpellbook}`,
        expected: expectedSpellbook,
        actual: actualSpellbook,
      });
    }
  }

  if (classData.name === "Cleric" && subclassData?.expandedSpells) {
    const domainSpellNames = Object.values(subclassData.expandedSpells).flat();
    const missingDomainSpells = domainSpellNames.filter((s) => !character.spells.some((cs) => cs.name === s) && !character.domainSpells?.includes(s));
    if (missingDomainSpells.length > 0) {
      results.push({
        category: "Spells",
        check: "Domain spells",
        status: "warning",
        message: `Missing domain spells: ${missingDomainSpells.slice(0, 3).join(", ")}`,
        expected: missingDomainSpells.slice(0, 3).join(", "),
        actual: "Not found in spells or domainSpells",
      });
    }
  }
}

function validatePreparedSpells(character: Character, classData: SRDClass | null | undefined, results: ValidationResult[]) {
  if (!classData?.spellcastingAbility) return;
  const preparedClasses = ["Wizard", "Cleric", "Druid", "Paladin"];
  if (!preparedClasses.includes(character.class)) return;

  const abilityMod = getModifier(character[classData.spellcastingAbility as keyof typeof character] as number);
  const maxPrepared = Math.max(1, abilityMod + character.level);

  if (!character.preparedSpells) {
    results.push({
      category: "Prepared Spells",
      check: "Prepared spells array",
      status: "warning",
      message: `No prepared spells array found`,
      expected: "Array of prepared spell names",
      actual: "undefined",
    });
    return;
  }

  if (character.preparedSpells.length > maxPrepared) {
    results.push({
      category: "Prepared Spells",
      check: "Prepared spells count",
      status: "fail",
      message: `Too many prepared spells`,
      expected: maxPrepared,
      actual: character.preparedSpells.length,
    });
  }

  for (const spellId of character.preparedSpells) {
    const inSpellbook = character.spells.some((s) => s.id === spellId);
    const isCantrip = character.cantrips.some((c) => c.id === spellId);
    if (!inSpellbook && !isCantrip) {
      results.push({
        category: "Prepared Spells",
        check: "Prepared spell validity",
        status: "fail",
        message: `Prepared spell not in spellbook: ${spellId}`,
        expected: "Spell must be in spellbook or cantrip",
        actual: spellId,
      });
    }
  }
}

function validateRangerTerrain(character: Character, results: ValidationResult[]) {
  if (character.class !== "Ranger") return;

  const hasNaturalExplorer = character.features.some((f) => f.name.toLowerCase().includes("natural explorer"));
  if (!hasNaturalExplorer) {
    results.push({
      category: "Ranger",
      check: "Natural Explorer feature",
      status: "warning",
      message: `Natural Explorer feature not found`,
      expected: "Natural Explorer in features",
      actual: "Not found",
    });
  }

  if (character.level >= 5) {
    const hasPrimevalAwareness = character.features.some((f) => f.name.toLowerCase().includes("primeval awareness"));
    if (!hasPrimevalAwareness) {
      results.push({
        category: "Ranger",
        check: "Primeval Awareness",
        status: "warning",
        message: `Primeval Awareness not found at level 5`,
        expected: "Primeval Awareness in features",
        actual: "Not found",
      });
    }
  }
}

function validateFightingStyle(character: Character, classData: SRDClass | null | undefined, results: ValidationResult[]) {
  if (!["Fighter", "Paladin", "Ranger"].includes(character.class)) return;

  const hasFightingStyle = character.features.some((f) => f.name.toLowerCase().includes("fighting style"));
  if (!hasFightingStyle) {
    results.push({
      category: "Combat",
      check: "Fighting Style",
      status: "warning",
      message: `Fighting Style feature not found`,
      expected: "Fighting Style in features",
      actual: "Not found",
    });
  }
}

function validateEquipment(character: Character, classData: SRDClass | null | undefined, results: ValidationResult[]) {
  if (character.inventory.length === 0) {
    results.push({
      category: "Equipment",
      check: "Inventory not empty",
      status: "fail",
      message: `Character has no inventory items`,
      expected: "At least one item",
      actual: "0 items",
    });
  }

  const weaponNames = ["sword", "axe", "bow", "crossbow", "mace", "staff", "dagger", "spear", "hammer", "warhammer", "longsword", "greatsword", "rapier", "scimitar", "shortsword", "glaive", "halberd", "lance", "pike", "trident", "whip", "blowgun", "handaxe"];
  const hasWeapon = character.inventory.some((item) => {
    if (item.itemType === "weapon") return true;
    const name = (item.name || "").toLowerCase();
    return weaponNames.some((w) => name.includes(w));
  });
  const martialClasses = ["Fighter", "Paladin", "Ranger", "Barbarian"];
  if (martialClasses.includes(character.class) && !hasWeapon) {
    results.push({
      category: "Equipment",
      check: "Weapon in inventory",
      status: "warning",
      message: `Martial class has no weapon in inventory`,
      expected: "At least one weapon",
      actual: "No weapons found",
    });
  }

  if (!character.currency || typeof character.currency.gold !== "number") {
    results.push({
      category: "Equipment",
      check: "Currency fields",
      status: "warning",
      message: `Currency fields missing or invalid`,
      expected: "Object with cp, sp, ep, gp, pp numbers",
      actual: character.currency,
    });
  }
}

function validateCompleteness(character: Character, classData: SRDClass | null | undefined, results: ValidationResult[]) {
  const requiredFields = [
    "id", "name", "race", "class", "subclass", "subclassIndex", "level", "background", "alignment",
    "str", "dex", "con", "int", "wis", "cha", "savingThrows", "skills", "features", "inventory",
    "attacks", "spells", "cantrips", "spellSlots", "hitDiceTotal", "maxHp", "proficiencyBonus",
  ];

  for (const field of requiredFields) {
    if (!(field in character) || character[field as keyof Character] === undefined || character[field as keyof Character] === null) {
      results.push({
        category: "Completeness",
        check: `Field: ${field}`,
        status: "fail",
        message: `Required field is missing or null`,
        expected: "Non-null value",
        actual: "undefined/null",
      });
    }
  }

  if (!character.name || character.name === "undefined") {
    results.push({
      category: "Completeness",
      check: "Character name",
      status: "fail",
      message: `Character name is empty or invalid`,
      expected: "Non-empty string",
      actual: character.name,
    });
  }

  const validClasses = getStaticClasses(["PHB"], "2014").map((c) => c.name);
  if (!validClasses.includes(character.class)) {
    results.push({
      category: "Completeness",
      check: "Class validity",
      status: "fail",
      message: `Class "${character.class}" is not valid`,
      expected: validClasses.slice(0, 5).join(", ") + "...",
      actual: character.class,
    });
  }

  const validRaces = getStaticRaces(["PHB"], "2014").map((r) => r.name);
  if (!validRaces.includes(character.race)) {
    results.push({
      category: "Completeness",
      check: "Race validity",
      status: "fail",
      message: `Race "${character.race}" is not valid`,
      expected: validRaces.slice(0, 5).join(", ") + "...",
      actual: character.race,
    });
  }

  const validBackgrounds = backgroundsData.map((b) => b.name);
  if (!validBackgrounds.includes(character.background)) {
    results.push({
      category: "Completeness",
      check: "Background validity",
      status: "warning",
      message: `Background "${character.background}" is not valid`,
      expected: validBackgrounds.slice(0, 5).join(", ") + "...",
      actual: character.background,
    });
  }

  if (character.level < 1 || character.level > 20) {
    results.push({
      category: "Completeness",
      check: "Level range",
      status: "fail",
      message: `Level must be between 1 and 20`,
      expected: "1-20",
      actual: character.level,
    });
  }

  if (!ALIGNMENTS.includes(character.alignment)) {
    results.push({
      category: "Completeness",
      check: "Alignment validity",
      status: "warning",
      message: `Alignment "${character.alignment}" is not a standard alignment`,
      expected: ALIGNMENTS.join(", "),
      actual: character.alignment,
    });
  }
}

export function validateAllTestCharacters(characters: Character[]): CharacterValidationReport[] {
  return characters.map((c) => validateTestCharacter(c));
}

export function getValidationSummary(reports: CharacterValidationReport[]): { total: number; passed: number; failed: number; warnings: number } {
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  for (const report of reports) {
    if (report.failed === 0 && report.warnings === 0) passed++;
    if (report.failed > 0) failed++;
    if (report.warnings > 0 && report.failed === 0) warnings++;
  }
  return { total: reports.length, passed, failed, warnings };
}

export function generateAISummary(reports: CharacterValidationReport[]): string {
  const summary = getValidationSummary(reports);
  const lines: string[] = [];

  lines.push("=== D&D 5e Test Character Validation Summary ===");
  lines.push(`Total Characters: ${summary.total}`);
  lines.push(`Passed All Checks: ${summary.passed}`);
  lines.push(`Have Failures: ${summary.failed}`);
  lines.push(`Have Warnings Only: ${summary.warnings}`);
  lines.push("");

  if (summary.failed > 0) {
    lines.push("=== FAILURES BY CATEGORY ===");
    const failuresByCategory = new Map<string, { character: string; check: string; message: string; expected?: any; actual?: any }[]>();
    for (const report of reports) {
      for (const result of report.results) {
        if (result.status === "fail") {
          const existing = failuresByCategory.get(result.category) || [];
          existing.push({ character: report.characterName, check: result.check, message: result.message, expected: result.expected, actual: result.actual });
          failuresByCategory.set(result.category, existing);
        }
      }
    }
    for (const [category, failures] of failuresByCategory) {
      lines.push(`\n[${category}]`);
      for (const f of failures) {
        lines.push(`  - ${f.character}: ${f.check}`);
        lines.push(`    ${f.message}`);
        if (f.expected !== undefined && f.actual !== undefined) {
          lines.push(`    Expected: ${JSON.stringify(f.expected)}`);
          lines.push(`    Got: ${JSON.stringify(f.actual)}`);
        }
      }
    }
    lines.push("");
  }

  if (summary.warnings > 0) {
    lines.push("=== WARNINGS BY CATEGORY ===");
    const warningsByCategory = new Map<string, { character: string; check: string; message: string }[]>();
    for (const report of reports) {
      for (const result of report.results) {
        if (result.status === "warning") {
          const existing = warningsByCategory.get(result.category) || [];
          existing.push({ character: report.characterName, check: result.check, message: result.message });
          warningsByCategory.set(result.category, existing);
        }
      }
    }
    for (const [category, warnings] of warningsByCategory) {
      lines.push(`\n[${category}]`);
      for (const w of warnings) {
        lines.push(`  - ${w.character}: ${w.check}`);
        lines.push(`    ${w.message}`);
      }
    }
    lines.push("");
  }

  const failingReports = reports.filter((r) => r.failed > 0);
  if (failingReports.length > 0) {
    lines.push("=== FAILING CHARACTERS DETAIL ===");
    for (const report of failingReports) {
      lines.push(`\n${report.characterName}:`);
      lines.push(`  Failed: ${report.failed}, Warnings: ${report.warnings}, Passed: ${report.passed}`);
      for (const result of report.results) {
        if (result.status === "fail") {
          lines.push(`  [FAIL] ${result.check}: ${result.message}`);
        }
      }
    }
    lines.push("");
  }

  lines.push("=== PASSING CHARACTERS ===");
  const passingReports = reports.filter((r) => r.failed === 0 && r.warnings === 0);
  for (const report of passingReports) {
    lines.push(`  - ${report.characterName} (${report.passed} checks passed)`);
  }
  lines.push("");
  lines.push("=== END OF REPORT ===");

  return lines.join("\n");
}
