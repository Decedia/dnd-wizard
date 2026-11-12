// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { createEmptyCharacter, getBaseSpeed, type Character } from "@/lib/storage";
import {
  applyBackground2024,
  applyClassChoices2024,
  applyOrigin2024,
  backgroundAsiValid,
  backgroundLanguageCount,
  backgroundSkillsOf,
  gear2024Complete,
  origin2024Complete,
  originFeatComplete,
  originFeatPatch,
  originFeats,
  pickGearPatch,
  speciesSpells2024,
} from "@/lib/origin-2024";
import { getRaceAsi } from "@/lib/race-grants";
import { getGrantedSpellNames, getFreeCastSpells } from "@/lib/granted-spells";
import { getCreationSteps, racePatch, syncBaseFeatures } from "@/lib/character-creation";
import { buildLevelInfos } from "@/components/level-up/level-infos";
import { getStaticClass } from "@/lib/srd-client";
import { CLASS_GEAR_2024, BACKGROUND_GEAR_2024 } from "@/data/starting-gear-2024";
import { findCatalogItem } from "@/data/item-catalog";
import { applyFeatGrants, featAbilityIncreases } from "@/lib/feat-grants";

const base = (patch: Partial<Character> = {}): Character => ({ ...createEmptyCharacter(), ruleset: "2024", sources: ["PHB"], ...patch });

function woodElfWizard(): Character {
  let c = base({ class: "Wizard", name: "Test", alignment: "Neutral Good" });
  c = { ...c, ...racePatch(c, { name: "Elf", configChoice: { parentChoiceId: "elf-2024-lineage", featureData: { id: "elven-lineage-wood-elf" } } }) };
  c = { ...c, raceChoices: { ...c.raceChoices, "elf-2024-spell-ability": "int" } };
  c = { ...c, ...applyBackground2024(c, "Sage") };
  return c;
}

describe("2024 background", () => {
  test("gives its skills, tool and Origin feat, and takes the old one's back", () => {
    let c = base({ skills: { Perception: true } });
    c = { ...c, ...applyBackground2024(c, "Criminal") };
    expect(c.skills).toEqual({ Perception: true, "Sleight of Hand": true, Stealth: true });
    expect(c.toolProficiencies).toEqual(["Thieves' Tools"]);
    expect(originFeats(c).map((f) => f.name)).toEqual(["Alert"]);
    c = { ...c, ...applyBackground2024(c, "Acolyte") };
    expect(c.skills).toEqual({ Perception: true, Insight: true, Religion: true });
    const [feat] = originFeats(c);
    expect(feat.name).toBe("Magic Initiate");
    expect(feat.options.spell_class).toBe("cleric");
  });

  test("its skills come from the 2024 list, and it gives no languages", () => {
    // The 2014 Criminal has Deception; the 2024 one has Sleight of Hand.
    expect(backgroundSkillsOf(base({ background: "Criminal" }))).toEqual(["Sleight of Hand", "Stealth"]);
    expect(backgroundLanguageCount(base({ background: "Acolyte" }))).toBe(0);
  });

  test("the increase is +2/+1 or +1/+1/+1 among its three abilities only", () => {
    const soldier = base({ background: "Soldier" });
    expect(backgroundAsiValid({ ...soldier, flexAsi: { str: 2, con: 1 } })).toBe(true);
    expect(backgroundAsiValid({ ...soldier, flexAsi: { str: 1, dex: 1, con: 1 } })).toBe(true);
    expect(backgroundAsiValid({ ...soldier, flexAsi: { str: 2, wis: 1 } })).toBe(false);
    expect(backgroundAsiValid({ ...soldier, flexAsi: { str: 2, dex: 2 } })).toBe(false);
    expect(getRaceAsi({ ...soldier, race: "Dwarf", flexAsi: { str: 2, con: 1 } })).toEqual({ str: 2, con: 1 });
    // No species bonus under 2024 rules, and nothing until the placement is legal.
    expect(getRaceAsi({ ...soldier, race: "Dwarf", flexAsi: {} })).toEqual({});
  });
});

describe("2024 species", () => {
  test("a lineage gives its spells by level, and Wood Elf walks 35 feet", () => {
    const c = woodElfWizard();
    expect(speciesSpells2024({ ...c, level: 1 })).toEqual(["Druidcraft"]);
    expect(speciesSpells2024({ ...c, level: 5 })).toEqual(["Druidcraft", "Longstrider", "Pass without Trace"]);
    expect(getGrantedSpellNames({ ...c, level: 3 })).toEqual(["Druidcraft", "Longstrider"]);
    expect(getFreeCastSpells({ ...c, level: 3 }).map((s) => s.name)).toEqual(["Longstrider"]);
    expect(getBaseSpeed(c)).toBe(35);
  });

  test("a Tiefling knows Thaumaturgy, and 2014 race spells don't leak in", () => {
    const c = base({ race: "Tiefling", raceChoices: { "tiefling-2024-lineage": "fiendish-legacy-chthonic" }, level: 3 });
    expect(getGrantedSpellNames(c)).toEqual(["Thaumaturgy", "Chill Touch", "False Life"]);
  });

  test("only the lineage becomes a trait row; size and spell ability don't", () => {
    const c = syncBaseFeatures(woodElfWizard());
    const race = c.features.filter((f) => f.source === "race").map((f) => f.name);
    expect(race).toContain("Wood Elf");
    expect(race).not.toContain("Intelligence");
    expect(race).toContain("Magic Initiate");
  });
});

describe("2024 Origin feats", () => {
  test("the background's Magic Initiate keeps its list; picks finish it", () => {
    let c = woodElfWizard();
    const [feat] = originFeats(c);
    expect(originFeatComplete(feat)).toBe(false);
    c = { ...c, ...originFeatPatch(c, feat, "Magic Initiate", { spell_ability: "int", cantrip_1: "Light", cantrip_2: "Mage Hand", first_level_spell: "Shield" }) };
    const [done] = originFeats(c);
    expect(done.options.spell_class).toBe("wizard");
    expect(originFeatComplete(done)).toBe(true);
    const out = applyOrigin2024(c);
    expect(out.cantrips.map((s) => s.name).sort()).toEqual(["Light", "Mage Hand"]);
    expect(out.spells.map((s) => s.name)).toContain("Shield");
    // The spellcasting ability pick is not an increase.
    expect(out.int).toBe(c.int);
  });

  test("a Human also picks one Origin feat (Versatile)", () => {
    let c = base({ race: "Human", class: "Fighter" });
    c = { ...c, ...applyBackground2024(c, "Soldier") };
    const feats = originFeats(c);
    expect(feats.map((f) => [f.source, f.name])).toEqual([["background", "Savage Attacker"], ["species", ""]]);
    c = { ...c, ...originFeatPatch(c, feats[1], "Skilled", { skill_or_tool_1: "Arcana", skill_or_tool_2: "History", skill_or_tool_3: "Dice Set" }) };
    const out = applyOrigin2024(c);
    expect(out.skills.Arcana).toBe(true);
    expect(out.toolProficiencies).toContain("Dice Set");
  });

  test("the Origin step needs species answers, the Soldier's gaming set and every feat pick", () => {
    let c = base({ race: "Human", class: "Fighter" });
    c = { ...c, ...applyBackground2024(c, "Soldier") };
    c = { ...c, raceChoices: { "human-2024-size": "medium" } };
    c = { ...c, ...originFeatPatch(c, originFeats(c)[1], "Alert", {}) };
    expect(origin2024Complete(c)).toBe(false);
    c = { ...c, featureSelections: { ...c.featureSelections, "background-tool-2024": ["Dice Set"] } };
    expect(origin2024Complete(c)).toBe(true);
    expect(getCreationSteps(c).find((s) => s.id === "origin")?.completed).toBe(true);
    expect(applyOrigin2024(c).toolProficiencies).toContain("Dice Set");
  });
});

describe("2024 starting gear", () => {
  test("every package item is in the catalog", () => {
    for (const table of [CLASS_GEAR_2024, BACKGROUND_GEAR_2024]) {
      for (const [name, packages] of Object.entries(table)) {
        for (const pkg of packages) for (const line of pkg.items) if ("id" in line) expect([name, line.id, !!findCatalogItem(line.id)]).toEqual([name, line.id, true]);
      }
    }
    expect(Object.keys(CLASS_GEAR_2024).sort()).toEqual(["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"]);
  });

  test("picking a package swaps the last pick's items and gold", () => {
    let c = base({ class: "Fighter", background: "Soldier" });
    c = { ...c, ...pickGearPatch(c, "class", "A") };
    expect(c.inventory.some((r) => r.itemId === "greatsword")).toBe(true);
    c = { ...c, ...pickGearPatch(c, "class", "C") };
    expect(c.inventory.some((r) => r.itemId === "greatsword")).toBe(false);
    expect(c.inventory.filter((r) => r.itemId === "gp").reduce((n, r) => n + r.quantity, 0)).toBe(155);
    expect(gear2024Complete(c)).toBe(false);
    c = { ...c, ...pickGearPatch(c, "background", "B") };
    expect(gear2024Complete(c)).toBe(true);
    expect(c.inventory.filter((r) => r.itemId === "gp").reduce((n, r) => n + r.quantity, 0)).toBe(205);
  });
});

describe("2024 level 1", () => {
  const level1 = (className: string, patch: Partial<Character> = {}) => {
    const c = base({ class: className, level: 1, int: 16, wis: 16, cha: 16, ...patch });
    return buildLevelInfos(c, 1, getStaticClass(className, "2024"), "", 0, true, "en")[0];
  };

  test("spell counts come from the 2024 tables", () => {
    expect([level1("Wizard").cantripSelectionCount, level1("Wizard").spellSelectionCount]).toEqual([3, 6]);
    expect([level1("Cleric").cantripSelectionCount, level1("Cleric").spellSelectionCount]).toEqual([3, 4]);
    expect([level1("Sorcerer").cantripSelectionCount, level1("Sorcerer").spellSelectionCount]).toEqual([4, 2]);
    expect([level1("Paladin").cantripSelectionCount, level1("Paladin").spellSelectionCount]).toEqual([0, 2]);
    expect(level1("Paladin").hasSpellSelection).toBe(true);
  });

  test("Weapon Mastery, Fighting Style, Divine Order and Rogue Expertise are asked", () => {
    const choice = (info: ReturnType<typeof level1>, name: string) => info.classFeatureChoices?.find((c) => c.name === name);
    expect(choice(level1("Fighter"), "Weapon Mastery")?.count).toBe(3);
    expect(choice(level1("Fighter"), "Fighting Style")?.options.map((o) => o.name)).toContain("Defense");
    expect(choice(level1("Barbarian"), "Weapon Mastery")?.options.map((o) => o.name)).not.toContain("Longbow");
    expect(choice(level1("Rogue"), "Weapon Mastery")?.options.map((o) => o.name)).toContain("Rapier");
    expect(choice(level1("Rogue"), "Weapon Mastery")?.options.map((o) => o.name)).not.toContain("Longsword");
    expect(choice(level1("Cleric"), "Divine Order")?.options.map((o) => o.name)).toEqual(["Protector", "Thaumaturge"]);
    expect(level1("Rogue", { skills: { Stealth: true, Acrobatics: true } }).expertise?.count).toBe(2);
  });

  test("Protector and Warden train armor and weapons", () => {
    const c = applyClassChoices2024(base({ class: "Cleric", featureSelections: { "class-feature-1-Divine Order": ["Protector"] } }));
    expect(c.otherProficiencies).toBe("Martial Weapons, Heavy Armor");
  });
});

describe("2024 level-up", () => {
  const infoAt = (className: string, level: number, patch: Partial<Character> = {}, subclass = "") => {
    const c = base({ class: className, level: level - 1, int: 16, wis: 16, cha: 16, subclass, ...patch });
    return buildLevelInfos(c, level, getStaticClass(className, "2024"), subclass, level - 1, false, "en").at(-1)!;
  };
  const choice = (info: ReturnType<typeof infoAt>, name: string) => info.classFeatureChoices?.find((c) => c.name === name);
  const names = (info: ReturnType<typeof infoAt>, name: string) => choice(info, name)?.options.map((o) => o.name) || [];

  test("Warlock invocations follow the table, their level and their pact", () => {
    expect(choice(infoAt("Warlock", 2), "Eldritch Invocations")?.count).toBe(2);
    expect(names(infoAt("Warlock", 2), "Eldritch Invocations")).toContain("Devil's Sight");
    expect(names(infoAt("Warlock", 2), "Eldritch Invocations")).not.toContain("Thirsting Blade");
    expect(choice(infoAt("Warlock", 3), "Eldritch Invocations")).toBeUndefined();
    const blade = { featureSelections: { "class-feature-1-Eldritch Invocations": ["Pact of the Blade"] } };
    expect(names(infoAt("Warlock", 5, blade), "Eldritch Invocations")).toContain("Thirsting Blade");
    expect(names(infoAt("Warlock", 5, blade), "Eldritch Invocations")).not.toContain("Pact of the Blade");
    expect(names(infoAt("Warlock", 5), "Eldritch Invocations")).not.toContain("Thirsting Blade");
    expect(infoAt("Warlock", 5).classFeatures.find((v) => v.name === "Invocations")?.value).toBe("5");
  });

  test("Mystic Arcanum offers that level's Warlock spells", () => {
    const opts = names(infoAt("Warlock", 11), "Mystic Arcanum (6th level)");
    expect(opts.length).toBeGreaterThan(0);
    expect(opts).toContain("Circle of Death");
  });

  test("Metamagic at 2, 10 and 17, two each, never twice", () => {
    expect(choice(infoAt("Sorcerer", 2), "Metamagic")?.count).toBe(2);
    expect(names(infoAt("Sorcerer", 2), "Metamagic")).toHaveLength(10);
    const later = infoAt("Sorcerer", 10, { featureSelections: { "class-feature-2-Metamagic": ["Quickened Spell, Subtle Spell"] } });
    expect(names(later, "Metamagic")).not.toContain("Quickened Spell");
    expect(names(later, "Metamagic")).toHaveLength(8);
  });

  test("Fighters train more mastery weapons at 4, 10 and 16", () => {
    const at4 = infoAt("Fighter", 4, { featureSelections: { "class-feature-1-Weapon Mastery": ["Longsword, Shortbow, Greataxe"] } });
    expect(choice(at4, "Weapon Mastery")?.count).toBe(1);
    expect(names(at4, "Weapon Mastery")).not.toContain("Longsword");
    expect(choice(infoAt("Fighter", 5), "Weapon Mastery")).toBeUndefined();
    expect(choice(infoAt("Fighter", 16), "Weapon Mastery")?.count).toBe(1);
  });

  test("subclass picks: Champion's second style skips the first, Hunter's Prey, Draconic affinity", () => {
    const champ = infoAt("Fighter", 7, { featureSelections: { "class-feature-1-Fighting Style": ["Defense"] } }, "Champion");
    const style = champ.subclassFeatureChoices?.find((c) => c.name === "Additional Fighting Style");
    expect(style?.options.map((o) => o.name)).not.toContain("Defense");
    expect(style?.options.map((o) => o.name)).toContain("Archery");
    expect(infoAt("Ranger", 3, {}, "Hunter").subclassFeatureChoices?.find((c) => c.name === "Hunter's Prey")?.options.map((o) => o.name)).toEqual(["Colossus Slayer", "Horde Breaker"]);
    expect(infoAt("Sorcerer", 6, {}, "Draconic Sorcery").subclassFeatureChoices?.[0].options).toHaveLength(5);
    expect(infoAt("Bard", 3, {}, "College of Lore").subclassFeatureChoices?.[0].count).toBe(3);
  });

  test("level 19 is a feat pick, and Bard's Magical Secrets adds no extra spells", () => {
    const l19 = infoAt("Rogue", 19);
    expect([l19.asi, l19.epicBoon]).toEqual([true, true]);
    expect(infoAt("Rogue", 18).asi).toBe(false);
    const bard10 = infoAt("Bard", 10);
    expect([bard10.magicalSecretsCount, bard10.spellSelectionCount]).toEqual([0, 1]);
  });

  test("Ranger and Wizard expertise; class numbers come from the 2024 table", () => {
    const skills = { skills: { Arcana: true, Stealth: true, History: true } };
    expect(infoAt("Ranger", 2, skills).expertise?.count).toBe(1);
    expect(infoAt("Wizard", 2, skills).expertise?.availableOptions.sort()).toEqual(["Arcana", "History"]);
    expect(infoAt("Barbarian", 5).classFeatures.find((v) => v.name === "Rage Uses")?.value).toBe("3");
    expect(infoAt("Barbarian", 5).features.map((f) => f.name)).not.toContain("Barbarian Subclass");
  });

  test("Primal Knowledge and Deft Explorer picks are applied", () => {
    const barb = applyClassChoices2024(base({ class: "Barbarian", level: 3, featureSelections: { "class-feature-3-Primal Knowledge": ["Perception"] } }));
    expect(barb.skills.Perception).toBe(true);
    const ranger = applyClassChoices2024(base({ class: "Ranger", level: 2, featureSelections: { "class-feature-2-Deft Explorer": ["Elvish, Sylvan"] } }));
    expect(ranger.languages).toEqual(expect.arrayContaining(["Elvish", "Sylvan"]));
  });

  test("an Epic Boon raises a score past 20, Grappler doesn't", () => {
    expect(applyFeatGrants(base({ str: 20 }), "Boon of Combat Prowess", { ability: "str" }).str).toBe(21);
    expect(applyFeatGrants(base({ str: 20 }), "Grappler", { ability: "str" }).str).toBe(20);
    expect(featAbilityIncreases("Grappler", { ability: "dex" }, "2024")).toEqual({ dex: 1 });
  });
});
