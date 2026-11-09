// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import subclassSpells from "@/data/subclass_spells.json";
import { RACE_SPELLS } from "@/data/race-spells";
import { getStaticRaces, getStaticSpells, getStaticSubclasses } from "@/lib/srd-client";
import { applySubclassSpellGrants } from "@/lib/character-creation";
import { getGrantedSpellNames } from "@/lib/granted-spells";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const spellNames = new Set(getStaticSpells([]).map((s) => s.name.toLowerCase()));
const tables = subclassSpells as unknown as Record<string, Record<string, Record<string, string[]>>>;
const classOf = (cls: string) => new Set(getStaticSubclasses(cls, []).map((s) => s.index));

describe("granted spell data", () => {
  test("every listed spell exists", () => {
    const missing: string[] = [];
    for (const key of ["domainSpells", "oathSpells", "subclassSpellGrants", "wizardTraditionSpells"]) {
      for (const [sub, byLevel] of Object.entries(tables[key])) {
        for (const name of Object.values(byLevel).flat()) if (!spellNames.has(name.toLowerCase())) missing.push(`${key}/${sub}: ${name}`);
      }
    }
    for (const [race, byLevel] of Object.entries(RACE_SPELLS)) {
      for (const name of Object.values(byLevel).flat()) if (!spellNames.has(name.toLowerCase())) missing.push(`race ${race}: ${name}`);
    }
    expect(missing).toEqual([]);
  });

  test("lists are keyed by a subclass of the class that reads them", () => {
    const wrong: string[] = [];
    const clerics = classOf("Cleric"), paladins = classOf("Paladin"), wizards = classOf("Wizard");
    const all = new Set(["Artificer", "Druid", "Ranger", "Sorcerer", "Warlock", "Cleric", "Paladin", "Wizard"].flatMap((c) => [...classOf(c)]));
    for (const k of Object.keys(tables.domainSpells)) if (!clerics.has(k)) wrong.push(`domainSpells/${k}`);
    for (const k of Object.keys(tables.oathSpells)) if (!paladins.has(k)) wrong.push(`oathSpells/${k}`);
    for (const k of Object.keys(tables.wizardTraditionSpells)) if (!wizards.has(k)) wrong.push(`wizardTraditionSpells/${k}`);
    for (const k of Object.keys(tables.subclassSpellGrants)) if (!all.has(k)) wrong.push(`subclassSpellGrants/${k}`);
    expect(wrong).toEqual([]);
  });

  test("racial spell lists name real races", () => {
    const races = new Set(getStaticRaces().map((r) => r.name));
    expect(Object.keys(RACE_SPELLS).filter((r) => !races.has(r))).toEqual([]);
  });
});

const make = (patch: Partial<Character>): Character => ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", ...patch } as Character);
const names = (c: Character) => c.spells.map((s) => s.name);

describe("granting", () => {
  test("Gloom Stalker ranger 5 gets its spells up to 5th level", () => {
    const c = applySubclassSpellGrants(make({ class: "Ranger", subclass: "Gloom Stalker", level: 5, sources: ["PHB", "XGE"] }));
    expect(names(c)).toEqual(expect.arrayContaining(["Disguise Self", "Rope Trick"]));
    expect(names(c)).not.toContain("Fear");
  });

  test("Drow fighter 5 gets Drow Magic, cantrip in both lists", () => {
    const c = applySubclassSpellGrants(make({ class: "Fighter", race: "Drow", level: 5 }));
    expect(names(c)).toEqual(expect.arrayContaining(["Dancing Lights", "Faerie Fire", "Darkness"]));
    expect(c.cantrips.map((s) => s.name)).toContain("Dancing Lights");
  });

  test("a racial spell from a book the table didn't pick is still granted", () => {
    const c = applySubclassSpellGrants(make({ class: "Wizard", race: "Githzerai", level: 5, sources: ["PHB"] }));
    expect(names(c)).toEqual(expect.arrayContaining(["Mage Hand", "Shield", "Detect Thoughts"]));
  });

  test("Celestial warlock gets its bonus cantrips", () => {
    const c = applySubclassSpellGrants(make({ class: "Warlock", subclass: "The Celestial", level: 1, sources: ["PHB", "XGE"] }));
    expect(names(c)).toEqual(expect.arrayContaining(["Light", "Sacred Flame"]));
  });

  test("Oath of Glory and Circle of Wildfire lists are read", () => {
    expect(getGrantedSpellNames(make({ class: "Paladin", subclass: "Oath of Glory", level: 5, sources: ["PHB", "TCE"] }))).toEqual(
      expect.arrayContaining(["Guiding Bolt", "Heroism", "Enhance Ability", "Magic Weapon"])
    );
    expect(getGrantedSpellNames(make({ class: "Druid", subclass: "Circle of Wildfire", level: 3, sources: ["PHB", "TCE"] }))).toEqual(
      expect.arrayContaining(["Burning Hands", "Cure Wounds", "Flaming Sphere", "Scorching Ray"])
    );
  });

  test("a warlock patron's expanded list is not granted", () => {
    expect(getGrantedSpellNames(make({ class: "Warlock", subclass: "The Fathomless", level: 9, sources: ["PHB", "TCE"] }))).toEqual([]);
  });
});

describe("High Elf cantrip", () => {
  test("offers every wizard cantrip in the table's books and grants the pick", async () => {
    const { getStaticRaceDetails } = await import("@/lib/srd-client");
    const phb = getStaticRaceDetails("High Elf", ["PHB"])!.choices!.find((c) => c.id === "high-elf-cantrip")!;
    const names = phb.options!.map((o) => o.name);
    expect(names).toEqual(expect.arrayContaining(["Fire Bolt", "Shocking Grasp", "Chill Touch"]));
    expect(names).not.toContain("Toll the Dead");
    expect(names).not.toContain("Sacred Flame");
    const xge = getStaticRaceDetails("High Elf", ["PHB", "XGE"])!.choices!.find((c) => c.id === "high-elf-cantrip")!;
    expect(xge.options!.map((o) => o.name)).toContain("Toll the Dead");
    const c = applySubclassSpellGrants(make({ class: "Fighter", race: "High Elf", raceChoices: { "high-elf-cantrip": "shocking-grasp" } }));
    expect(c.spells.map((s) => s.name)).toContain("Shocking Grasp");
  });
});

describe("subclass picks", () => {
  const sub = (cls: string, name: string, sources: string[] = []) => getStaticSubclasses(cls, sources).find((s) => s.name === name)!;

  test("a second pick of a feature is its own choice at the same level", () => {
    const f = sub("Cleric", "Knowledge").features.find((x: any) => x.name === "Blessings of Knowledge: Languages") as any;
    expect(f.level).toBe(1);
    expect(f.choicesCount).toBe(2);
    expect(f.choiceOnly).toBe(true);
  });

  test("Kensei picks another weapon at 6, 11 and 17", () => {
    const picks = sub("Monk", "Way of the Kensei", ["XGE"]).features.filter((x: any) => x.name.startsWith("Path of the Kensei") && x.name !== "Path of the Kensei: Tool") as any[];
    expect(picks.map((x) => x.level)).toEqual([3, 3, 6, 11, 17]);
    expect(picks[2].choices.map((c: any) => c.name)).toEqual(expect.arrayContaining(["Longsword", "Shortbow"]));
  });

  test("cantrip pickers follow the books", () => {
    const phb = sub("Cleric", "Arcana Domain", ["PHB", "SCAG"]).features.find((x: any) => x.name === "Arcane Initiate")!;
    expect(phb.choices!.map((c) => c.name)).toContain("Fire Bolt");
    expect(phb.choices!.map((c) => c.name)).not.toContain("Booming Blade");
    const nature = sub("Cleric", "Nature").features.find((x: any) => x.name === "Acolyte of Nature: Cantrip")!;
    expect(nature.choices!.map((c) => c.name)).toEqual(expect.arrayContaining(["Druidcraft", "Shillelagh"]));
    expect(nature.choices!.map((c) => c.name)).not.toContain("Fire Bolt");
  });

  test("picks are granted", async () => {
    const { applySubclassFeatures } = await import("@/lib/character-creation");
    const knowledge = applySubclassFeatures(make({
      class: "Cleric", subclass: "Knowledge", level: 1,
      featureSelections: { "subclass-feature-1-Blessings of Knowledge": ["Arcana, History"], "subclass-feature-1-Blessings of Knowledge: Languages": ["Draconic, Giant"] },
    }));
    expect(knowledge.languages).toEqual(expect.arrayContaining(["Draconic", "Giant"]));
    expect(knowledge.expertise).toEqual(expect.arrayContaining(["Arcana", "History"]));
    expect(knowledge.features.map((f) => f.name)).not.toContain("Blessings of Knowledge: Languages");

    const kensei = applySubclassFeatures(make({
      class: "Monk", subclass: "Way of the Kensei", level: 3, sources: ["PHB", "XGE"],
      featureSelections: { "subclass-feature-3-Path of the Kensei": ["Longsword"], "subclass-feature-3-Path of the Kensei: Ranged Weapon": ["Shortbow"] },
    }));
    expect(kensei.otherProficiencies).toContain("Longsword");
    expect(kensei.otherProficiencies).toContain("Shortbow");
  });

  test("Divine Soul affinity gives its spell, free", async () => {
    const { applySubclassFeatures } = await import("@/lib/character-creation");
    const c = make({ class: "Sorcerer", subclass: "Divine Soul", level: 1, sources: ["PHB", "XGE"], featureSelections: { "subclass-feature-1-Divine Magic": ["Law"] } });
    expect(applySubclassFeatures(c).spells.map((s) => s.name)).toContain("Bless");
    expect(getGrantedSpellNames(c)).toContain("Bless");
  });

  test("Lunar Sorcery learns every phase's spells", () => {
    const names = getGrantedSpellNames(make({ class: "Sorcerer", subclass: "Lunar Sorcery", level: 3, sources: ["PHB", "DSotDQ"] }));
    expect(names).toEqual(expect.arrayContaining(["Sacred Flame", "Shield", "Ray of Sickness", "Color Spray", "Alter Self"]));
  });
});
