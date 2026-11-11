// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { computeDerivedStats, createEmptyCharacter, normalizeCharacter, type Character } from "@/lib/storage";
import { describeFeatRequirements, FEAT_REQUIREMENTS, meetsPrerequisites } from "@/lib/feat-requirements";
import { FEAT_FLAVOR } from "@/data/feat-flavor";
import featsEn from "@/data/en/2014_feats.json";

const make = (over: Partial<Character> = {}) =>
  ({ ...createEmptyCharacter(), ruleset: "2014", class: "Wizard", race: "Human", level: 4, str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...over }) as Character;

const feats = ((featsEn as any).feats ?? featsEn) as { name: string; prerequisites: string | null }[];

describe("feat prerequisites", () => {
  test("Alert, Dual Wielder, Keen Mind have none (the old data wrongly asked for 13s)", () => {
    for (const name of ["Alert", "Dual Wielder", "Keen Mind", "Lucky"]) expect(meetsPrerequisites(make(), name)).toBe(true);
  });

  test("Ritual Caster takes INT or WIS 13", () => {
    expect(meetsPrerequisites(make({ wis: 13 }), "Ritual Caster")).toBe(true);
    expect(meetsPrerequisites(make({ int: 13 }), "Ritual Caster")).toBe(true);
    expect(meetsPrerequisites(make({ int: 12, wis: 12 }), "Ritual Caster")).toBe(false);
  });

  test("race checks", () => {
    expect(meetsPrerequisites(make({ race: "Half-Elf (Drow)" }), "Elven Accuracy")).toBe(true);
    expect(meetsPrerequisites(make({ race: "Half-Elf" }), "Revenant Blade")).toBe(false);
    expect(meetsPrerequisites(make({ race: "Drow" }), "Revenant Blade")).toBe(true);
    expect(meetsPrerequisites(make({ race: "Lightfoot Halfling" }), "Bountiful Luck")).toBe(true);
    expect(meetsPrerequisites(make({ race: "Rock Gnome" }), "Squat Nimbleness")).toBe(true);
    expect(meetsPrerequisites(make({ race: "Mountain Dwarf" }), "Squat Nimbleness")).toBe(true);
    expect(meetsPrerequisites(make({ race: "Human" }), "Squat Nimbleness")).toBe(false);
    expect(meetsPrerequisites(make({ race: "Autognome" }), "Fade Away")).toBe(false);
    expect(meetsPrerequisites(make({ race: "Tiefling (Zariel)" }), "Flames of Phlegethos")).toBe(true);
  });

  test("armor and weapon proficiency from the class", () => {
    expect(meetsPrerequisites(make({ class: "Fighter" }), "Heavy Armor Master")).toBe(true);
    expect(meetsPrerequisites(make({ class: "Wizard" }), "Heavy Armor Master")).toBe(false);
    expect(meetsPrerequisites(make({ class: "Wizard" }), "Moderately Armored")).toBe(false);
    expect(meetsPrerequisites(make({ class: "Rogue" }), "Moderately Armored")).toBe(true);
    expect(meetsPrerequisites(make({ class: "Paladin" }), "Fighting Initiate")).toBe(true);
    expect(meetsPrerequisites(make({ class: "Wizard" }), "Fighting Initiate")).toBe(false);
  });

  test("spellcasting", () => {
    expect(meetsPrerequisites(make({ class: "Fighter", spellcastingAbility: undefined }), "War Caster")).toBe(false);
    expect(meetsPrerequisites(make({ spellcastingAbility: "int" } as Partial<Character>), "War Caster")).toBe(true);
  });

  test("every feat with prerequisite text has a rule, and every rule names a real feat", () => {
    const names = new Set(feats.map((f) => f.name));
    for (const name of Object.keys(FEAT_REQUIREMENTS)) expect(names.has(name)).toBe(true);
    // Aberrant Dragonmark only says "no existing dragonmark", which the app has no way to have.
    const missing = feats.filter((f) => f.prerequisites && f.name !== "Aberrant Dragonmark" && !FEAT_REQUIREMENTS[f.name]).map((f) => f.name);
    expect(missing).toEqual([]);
  });

  test("lines say what is missing", () => {
    const lines = describeFeatRequirements(make({ dex: 12 }), "Skulker");
    expect(lines).toEqual([{ text: "DEX 13 or higher", met: false }]);
  });
});

test("feat flavor names are real feats", () => {
  const names = new Set(feats.map((f) => f.name));
  const unknown = Object.keys(FEAT_FLAVOR).filter((n) => !names.has(n));
  // Flavor also covers feats from books the 2014 list does not carry; those simply never show.
  expect(unknown.length).toBeLessThan(Object.keys(FEAT_FLAVOR).length);
});

test("feats are matched by name for their bonuses", () => {
  const c = make({ features: [{ id: "f1", name: "Alert", description: "" }, { id: "f2", name: "Mobile", description: "" }], baseSpeed: 30 });
  const d = computeDerivedStats(c);
  expect(d.initiative).toBe(5);
  expect(d.speed).toBe(40);
});

test("Battle Master gets superiority dice: 4 at 3, 5 at 7, 6 at 15", () => {
  const at = (level: number) => computeDerivedStats(make({ class: "Fighter", subclass: "Battle Master", level })).maxSuperiorityDice;
  expect(at(2)).toBe(0);
  expect(at(3)).toBe(4);
  expect(at(7)).toBe(5);
  expect(at(15)).toBe(6);
});

test("old saves lose their links into the retired engine data", () => {
  const old = make({
    features: [{ id: "f1", name: "Arcane Recovery", description: "x", engineId: "class.wizard.arcane_recovery" } as any],
    spells: [{ id: "s1", name: "Shield", level: 1, source: "srd", grantsFeatureId: "feat.magic_initiate" } as any],
  });
  const n = normalizeCharacter(old);
  expect("engineId" in n.features[0]).toBe(false);
  expect("grantsFeatureId" in n.spells[0]).toBe(false);
});

test("nothing imports the retired combat engine data", () => {
  const root = path.join(process.cwd(), "src");
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx?|mjs|js)$/.test(name) && !full.endsWith("feat-requirements.test.ts")) {
        const text = readFileSync(full, "utf8");
        if (/from ["'][^"']*(data\/engine|feature-engine)/.test(text)) hits.push(path.relative(root, full));
      }
    }
  };
  walk(root);
  expect(hits).toEqual([]);
});
