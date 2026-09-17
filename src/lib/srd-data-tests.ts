import {
  getStaticClasses,
  getStaticClass,
  getStaticSubclasses,
  getStaticSubclassDetails,
  getStaticRaces,
  getStaticRace,
  getStaticSpells,
  getStaticWizardSpells,
  getStaticArcaneTricksterSpells,
  getStaticWeapons,
  getStaticArmors,
  getStaticItems,
  getStaticEquipments,
  getStaticFeats,
  getStaticFeat,
  getEquipmentData,
  getEquipmentNames,
  getWeaponNames,
  getArmorNames,
  getItemNames,
  getSubclassSpellGrants,
  getDomainSpells,
  getOathSpells,
  getWizardTraditionSpells,
  getAvailableSources,
  deduplicateSpells,
} from "@/lib/srd-client";
import { buildChoiceGroups } from "@/lib/character-creation";

const ALL_SOURCES = ["PHB", "EGW", "XGE", "TCE", "SCAG", "VGTM", "VRGR", "FTD"];

export interface SrdTestResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  expected?: any;
  actual?: any;
}

export interface SrdTestCategory {
  category: string;
  results: SrdTestResult[];
}

export interface SrdTestReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  categories: SrdTestCategory[];
}

function result(category: string, status: "pass" | "fail" | "warn", message?: string, expected?: any, actual?: any): SrdTestResult {
  return { status, message, expected, actual, name: message || category };
}

export function runSrdDataIntegrityTests(): SrdTestReport {
  const categories: SrdTestCategory[] = [];
  const push = (category: string, r: SrdTestResult) => {
    const cat = categories.find((c) => c.category === category);
    if (cat) {
      cat.results.push(r);
    } else {
      categories.push({ category, results: [r] });
    }
  };

  // getAvailableSources
  do {
    const sources = getAvailableSources();
    if (sources.length < 1) push("Sources", result("Sources", "fail", "Expected at least one source"));
    else if (!sources.includes("PHB")) push("Sources", result("Sources", "fail", "Expected PHB to be available"));
    else push("Sources", result("Sources", "pass", "PHB and other sources available"));
  } while (false);

  // getStaticClasses
  do {
    const cat = "Classes";
    const classes = getStaticClasses(ALL_SOURCES, "2014");
    if (classes.length === 0) {
      push(cat, result("Class count", "fail", "No classes returned"));
      break;
    }
    const names = classes.map((c) => c.name);
    push(cat, result("Class count", "pass", `${names.length} classes available`));
    push(cat, result("Wizard present", names.includes("Wizard") ? "pass" : "fail", "Wizard in class list"));
    push(cat, result("Rogue present", names.includes("Rogue") ? "pass" : "fail", "Rogue in class list"));
    push(cat, result("Artificer present", names.includes("Artificer") ? "pass" : "fail", "Artificer in class list with EGW"));

    for (const cls of classes) {
      if (!cls.name) push(cat, result(`${cls.name || "Unnamed"} fields`, "fail", "Missing class name"));
      if (!cls.hitDie || cls.hitDie <= 0) push(cat, result(`${cls.name} fields`, "fail", "Invalid hitDie", { hitDie: cls.hitDie }));
      if (!Array.isArray(cls.savingThrows)) push(cat, result(`${cls.name} fields`, "fail", "savingThrows not array"));
      if (!cls.skillChoices || typeof cls.skillChoices.count !== "number" || !Array.isArray(cls.skillChoices.options)) {
        push(cat, result(`${cls.name} fields`, "fail", "Invalid skillChoices"));
      }
      if (!Array.isArray(cls.startingEquipment)) push(cat, result(`${cls.name} fields`, "fail", "startingEquipment not array"));
      if (cls.features && !Array.isArray(cls.features)) push(cat, result(`${cls.name} fields`, "fail", "features not array"));
      if (!Array.isArray(cls.levels)) push(cat, result(`${cls.name} fields`, "fail", "levels not array"));
      if (Array.isArray(cls.levels) && cls.levels.length < 20) push(cat, result(`${cls.name} levels`, "warn", `Only ${cls.levels.length} levels`));

      if (cls.spellcastingAbility) {
        const hasProgression = cls.spellsKnown || cls.spellbookSpells || cls.cantripsKnown;
        if (!hasProgression) push(cat, result(`${cls.name} spells`, "warn", "Spellcaster missing progression fields"));
      }
    }
  } while (false);

  // getStaticRaces
  do {
    const cat = "Races";
    const races = getStaticRaces(ALL_SOURCES, "2014");
    if (races.length === 0) {
      push(cat, result("Race count", "fail", "No races returned"));
      break;
    }
    push(cat, result("Race count", "pass", `${races.length} races available`));
    const hasExpanded = races.some((r) => r.name.includes("("));
    push(cat, result("Expanded races", hasExpanded ? "pass" : "warn", "Expanded race variants present"));

    for (const race of races) {
      if (!race.name) push(cat, result(`${race.name || "Unnamed"} fields`, "fail", "Missing race name"));
      if (typeof race.speed !== "number") push(cat, result(`${race.name} fields`, "fail", "Invalid speed"));
      if (!race.size) push(cat, result(`${race.name} fields`, "fail", "Missing size"));
      if (!Array.isArray(race.traits)) push(cat, result(`${race.name} fields`, "fail", "traits not array"));
      else if (race.traits.length === 0) push(cat, result(`${race.name} traits`, "warn", "Race has no traits"));
      if (!Array.isArray(race.languages)) push(cat, result(`${race.name} fields`, "fail", "languages not array"));
      if (race.abilityScoreIncreases && typeof race.abilityScoreIncreases === "object") {
        for (const bonus of Object.values(race.abilityScoreIncreases)) {
          if (!Number.isInteger(bonus)) push(cat, result(`${race.name} bonuses`, "fail", "Non-integer ability bonus"));
        }
      }
    }
  } while (false);

  // getStaticRace lookup
  do {
    const cat = "Race Lookup";
    const human = getStaticRace("Human", "2014");
    push(cat, result("Human", human?.name === "Human" ? "pass" : "fail", "Resolve Human"));
    const chromatic = getStaticRace("Dragonborn (Chromatic)", "2014");
    push(cat, result("Dragonborn (Chromatic)", chromatic ? "pass" : "fail", "Resolve expanded race variant"));
  } while (false);

  // getStaticSubclasses
  do {
    const cat = "Subclasses";
    const wizardSubs = getStaticSubclasses("Wizard", ALL_SOURCES, "2014");
    const wizardNames = wizardSubs.map((s) => s.name);
    push(cat, result("Wizard Illusion", wizardNames.includes("Illusion") ? "pass" : "fail", "Wizard Illusion available"));
    push(cat, result("Wizard Necromancy", wizardNames.includes("Necromancy") ? "pass" : "fail", "Wizard Necromancy available"));
    push(cat, result("Wizard War Magic", wizardNames.includes("War Magic") ? "pass" : "fail", "Wizard War Magic available"));
    push(cat, result("Wizard Order of Scribes", wizardNames.includes("Order of Scribes") ? "pass" : "fail", "Wizard Order of Scribes available"));

    const artSubs = getStaticSubclasses("Artificer", ALL_SOURCES, "2014");
    push(cat, result("Artificer subclasses", artSubs.length > 0 ? "pass" : "fail", `Artificer has ${artSubs.length} subclasses`));
    push(cat, result("Artificer Alchemist", artSubs.map((s) => s.name).includes("Alchemist") ? "pass" : "fail", "Artificer Alchemist available"));

    for (const cls of getStaticClasses(ALL_SOURCES, "2014")) {
      const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
      if (subs.length === 0) push(cat, result(`${cls.name} subclasses`, "warn", "No subclasses"));
      for (const sub of subs) {
        if (!sub.name) push(cat, result(`${cls.name} subclass fields`, "fail", "Missing subclass name"));
        if (!sub.description) push(cat, result(`${cls.name} subclass fields`, "warn", `Missing description for ${sub.name}`));
        if (!Array.isArray(sub.features)) push(cat, result(`${cls.name} ${sub.name} features`, "fail", "features not array"));
        for (const feature of sub.features) {
          if (!feature.name) push(cat, result(`${cls.name} ${sub.name} feature`, "fail", "Feature missing name"));
          if (!feature.description) push(cat, result(`${cls.name} ${sub.name} feature`, "warn", `Feature missing description: ${feature.name}`));
        }
      }
    }
  } while (false);

  // getStaticSubclassDetails
  do {
    const cat = "Subclass Details";
    const details = getStaticSubclassDetails("Wizard", "Illusion");
    if (!details || details.name !== "Illusion") push(cat, result("Illusion details", "fail", "Could not load Illusion details"));
    else if (details.features.length === 0) push(cat, result("Illusion features", "warn", "Illusion has no features"));
    else push(cat, result("Illusion details", "pass", `Illusion has ${details.features.length} features`));
  } while (false);

  // getStaticSpells
  do {
    const cat = "Spells";
    const phb = getStaticSpells(["PHB"], "2014");
    const expanded = getStaticSpells(ALL_SOURCES, "2014");
    push(cat, result("PHB spells", phb.length > 0 ? "pass" : "fail", `${phb.length} PHB spells`));
    push(cat, result("Expanded spells", expanded.length > 0 ? "pass" : "fail", `${expanded.length} total spells`));

    for (const spell of expanded) {
      if (!spell.name) push(cat, result("Spell fields", "fail", "Spell missing name"));
      if (typeof spell.level !== "number" || spell.level < 0) push(cat, result("Spell fields", "fail", `Invalid level for ${spell.name}`));
      if (!spell.school) push(cat, result("Spell fields", "warn", `Missing school for ${spell.name}`));
      if (!Array.isArray(spell.classes) || spell.classes.length === 0) push(cat, result("Spell fields", "warn", `Missing classes for ${spell.name}`));
      if (!spell.description) push(cat, result("Spell fields", "warn", `Missing description for ${spell.name}`));
    }

    const deduped = deduplicateSpells(expanded);
    const seen = new Set<string>();
    for (const spell of deduped) {
      const key = `${spell.name}|${spell.level}`;
      if (seen.has(key)) push(cat, result("Spell uniqueness", "fail", `Duplicate after dedup: ${key}`));
      seen.add(key);
    }
  } while (false);

  // Wizard / Arcane Trickster spell lists
  do {
    const cat = "Special Spell Lists";
    const wizardSpells = getStaticWizardSpells(ALL_SOURCES);
    push(cat, result("Wizard spells", wizardSpells.length > 0 ? "pass" : "fail", `${wizardSpells.length} wizard spells`));
    const nonWizard = wizardSpells.filter((s) => !s.classes.includes("Wizard"));
    if (nonWizard.length > 0) push(cat, result("Wizard spell filter", "warn", `${nonWizard.length} non-wizard spells in wizard list`));

    const atSpells = getStaticArcaneTricksterSpells();
    push(cat, result("Arcane Trickster spells", atSpells.length > 0 ? "pass" : "fail", `${atSpells.length} arcane trickster spells`));
  } while (false);

  // Equipment
  do {
    const cat = "Equipment";
    const weapons = getStaticWeapons(ALL_SOURCES);
    const armors = getStaticArmors(ALL_SOURCES);
    const items = getStaticItems(ALL_SOURCES);
    push(cat, result("Weapons", weapons.length > 0 ? "pass" : "fail", `${weapons.length} weapons`));
    push(cat, result("Armors", armors.length > 0 ? "pass" : "fail", `${armors.length} armors`));
    push(cat, result("Items", items.length > 0 ? "pass" : "fail", `${items.length} items`));

    for (const weapon of weapons) {
      if (weapon.equipment_category.toLowerCase() !== "weapon") push(cat, result("Weapon category", "fail", `${weapon.name} category=${weapon.equipment_category}`));
      if (!["Simple", "Martial"].includes(weapon.weapon_category)) push(cat, result("Weapon category", "fail", `${weapon.name} invalid weapon_category=${weapon.weapon_category}`));
      if (!["Melee", "Ranged"].includes(weapon.category_range)) push(cat, result("Weapon range", "fail", `${weapon.name} invalid category_range=${weapon.category_range}`));
    }

    for (const armor of armors) {
      if (armor.equipment_category.toLowerCase() !== "armor") push(cat, result("Armor category", "fail", `${armor.name} category=${armor.equipment_category}`));
      if (typeof armor.armor_class.base !== "number") push(cat, result("Armor AC", "fail", `${armor.name} missing armor_class.base`));
    }

    const longsword = getEquipmentData("Longsword");
    if (!longsword) push(cat, result("Equipment mapping", "fail", "Longsword not found"));
    else if (longsword.type.toLowerCase() !== "weapon") push(cat, result("Equipment mapping", "fail", `Longsword type=${longsword.type}`));
    const chainmail = getEquipmentData("Chain Mail");
    if (!chainmail) push(cat, result("Equipment mapping", "fail", "Chain Mail not found"));
    else if (chainmail.type.toLowerCase() !== "armor") push(cat, result("Equipment mapping", "fail", `Chain Mail type=${chainmail.type}`));
  } while (false);

  // Feats
  do {
    const cat = "Feats";
    const feats = getStaticFeats(ALL_SOURCES, "2014");
    push(cat, result("Feat count", feats.length > 0 ? "pass" : "fail", `${feats.length} feats available`));
    for (const feat of feats) {
      if (!feat.name) push(cat, result("Feat fields", "fail", "Feat missing name"));
      if (!feat.description) push(cat, result("Feat fields", "warn", `Missing description for ${feat.name}`));
    }
    const grappler = getStaticFeat("Grappler", "2014");
    push(cat, result("Feat lookup", grappler?.name === "Grappler" ? "pass" : "fail", "Lookup Grappler"));
  } while (false);

  // Subclass spell grants
  do {
    const cat = "Subclass Spell Grants";
    const aberrant = getStaticSubclasses("Sorcerer", ALL_SOURCES, "2014").find((s) => s.name === "Aberrant Mind");
    if (!aberrant) push(cat, result("Aberrant Mind", "fail", "Subclass not found"));
    else {
      const grants = getSubclassSpellGrants(aberrant.index!, 1);
      if (grants.length === 0) push(cat, result("Aberrant Mind grants", "fail", "Expected spell grants"));
      else push(cat, result("Aberrant Mind grants", "pass", `${grants.length} granted spells at level 1`));
    }

    const assassin = getStaticSubclasses("Rogue", ALL_SOURCES, "2014").find((s) => s.name === "Assassin");
    if (!assassin) push(cat, result("Assassin", "fail", "Subclass not found"));
    else {
      const grants = getSubclassSpellGrants(assassin.index!, 5);
      if (grants.length !== 0) push(cat, result("Assassin grants", "fail", "Expected no spell grants"));
      else push(cat, result("Assassin grants", "pass", "No spell grants as expected"));
    }

    const life = getStaticSubclasses("Cleric", ALL_SOURCES, "2014").find((s) => s.name === "Life");
    if (!life) push(cat, result("Life domain", "fail", "Subclass not found"));
    else {
      const spells = getDomainSpells(life.index!, 1);
      if (!Array.isArray(spells)) push(cat, result("Life domain spells", "fail", "getDomainSpells did not return array"));
      else push(cat, result("Life domain spells", "pass", `${spells.length} domain spells`));
    }

    const devotion = getStaticSubclasses("Paladin", ALL_SOURCES, "2014").find((s) => s.name === "Devotion");
    if (!devotion) push(cat, result("Devotion", "fail", "Subclass not found"));
    else {
      const spells = getOathSpells(devotion.index!, 1);
      if (!Array.isArray(spells)) push(cat, result("Devotion oath spells", "fail", "getOathSpells did not return array"));
      else push(cat, result("Devotion oath spells", "pass", `${spells.length} oath spells`));
    }

    const illusion = getStaticSubclasses("Wizard", ALL_SOURCES, "2014").find((s) => s.name === "Illusion");
    if (!illusion) push(cat, result("Illusion", "fail", "Subclass not found"));
    else {
      const spells = getWizardTraditionSpells(illusion.index!, 1);
      if (!Array.isArray(spells)) push(cat, result("Illusion tradition spells", "fail", "getWizardTraditionSpells did not return array"));
      else push(cat, result("Illusion tradition spells", "pass", `${spells.length} tradition spells`));
    }
  } while (false);

  // UI completeness
  do {
    const cat = "UI Completeness";
    for (const cls of getStaticClasses(ALL_SOURCES, "2014")) {
      const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
      if (subs.length === 0) push(cat, result(`${cls.name} subclasses`, "fail", "No subclasses available"));
    }

    for (const race of getStaticRaces(ALL_SOURCES, "2014")) {
      if (race.languages.length === 0) push(cat, result(`${race.name} languages`, "fail", "Race has no languages"));
    }

    for (const cls of getStaticClasses(ALL_SOURCES, "2014")) {
      if (cls.spellcastingAbility) {
        const spells = getStaticSpells(ALL_SOURCES, "2014").filter((s) => s.classes.includes(cls.name));
        if (spells.length === 0) push(cat, result(`${cls.name} spells`, "fail", "No spells available for spellcasting class"));
      }
    }

    for (const cls of getStaticClasses(ALL_SOURCES, "2014")) {
      const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
      for (const sub of subs) {
        const choiceFeatures = sub.features.filter((f) => f.choices && f.choices.length > 0);
        for (const feature of choiceFeatures) {
          if (feature.choices!.length === 0) push(cat, result(`${sub.name} choices`, "fail", `Feature ${feature.name} has empty choices`));
        }
      }
    }
  } while (false);

  const allResults = categories.flatMap((c) => c.results);
  return {
    totalTests: allResults.length,
    passed: allResults.filter((r) => r.status === "pass").length,
    failed: allResults.filter((r) => r.status === "fail").length,
    warnings: allResults.filter((r) => r.status === "warn").length,
    categories,
  };
}
