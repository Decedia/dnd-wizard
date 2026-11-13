// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/srd52-checked.json";
import weaponMastery from "@/data/en/2024_weapon_mastery.json";
import { THIRD_CASTERS_2024 } from "@/data/phb2024-third-casters";
import { getStaticBackgrounds2024, getStaticClasses, getStaticFeats, getStaticRaces, getStaticSpells, getStaticSubclasses, lineageChoiceOf } from "@/lib/srd-client";

// The 2024 rules data (SRD 5.2) is locked to a checked copy. A change here
// means the data changed: check it against the rules text before updating
// src/tests/fixtures/srd52-checked.json.

const classes = getStaticClasses([], "2024");

describe("2024 classes", () => {
  test("all 12 classes, nothing else", () => {
    expect(classes.map((c) => c.name).sort()).toEqual(Object.keys(fixture.classes).sort());
  });
  for (const [name, want] of Object.entries(fixture.classes)) {
    test(name, () => {
      const c = classes.find((x) => x.name === name) as any;
      expect(c.hitDie).toBe(want.hitDie);
      expect(c.savingThrows).toEqual(want.savingThrows);
      expect(c.skillChoices.count).toBe(want.skillCount);
      expect(c.proficiencies.armor).toEqual(want.armor);
      expect(c.proficiencies.weapons).toEqual(want.weapons);
      // Eldritch Knight and Arcane Trickster casting is Player's Handbook data on top of the SRD.
      const srdOnly = (key: string) => (key in (THIRD_CASTERS_2024[name] || {}) ? undefined : c[key]);
      expect(srdOnly("cantripsKnown") ?? null).toEqual(want.cantrips ?? null);
      expect(srdOnly("preparedSpells") ?? null).toEqual(want.prepared ?? null);
      expect(c.weaponMastery ?? null).toEqual(want.weaponMastery ?? null);
      expect(c.subclassLevel).toBe(3);
      expect(c.levels).toHaveLength(20);
      c.levels.forEach((lvl: any, i: number) => {
        // Picks added on top of the table (more invocations, more mastery weapons) are left out;
        // Mystic Arcanum carries its spell level in the name.
        const fromTable = lvl.features.filter((f: any) => !f.added).map((f: any) => f.name.replace(/^Mystic Arcanum \(\dth level\)$/, "Mystic Arcanum"));
        expect([i + 1, fromTable]).toEqual([i + 1, want.levels[i].features]);
        expect([i + 1, lvl.spellSlots ?? {}]).toEqual([i + 1, want.levels[i].slots]);
        expect([i + 1, lvl.classSpecific ?? null]).toEqual([i + 1, want.levels[i].classSpecific ?? null]);
        // The Epic Boon level is a feat pick too.
        expect(lvl.asi).toBe(want.levels[i].features.includes("Ability Score Improvement") || want.levels[i].features.includes("Epic Boon"));
        for (const f of lvl.features) expect(f.description.length).toBeGreaterThan(0);
      });
    });
  }
});

describe("2024 subclasses", () => {
  for (const [name, want] of Object.entries(fixture.subclasses)) {
    test(`${want.class}: ${name}`, () => {
      const s = getStaticSubclasses(want.class, [], "2024").find((x) => x.name === name) as any;
      expect(s).toBeDefined();
      expect(s.features.map((f: any) => [f.level, f.name])).toEqual(want.features);
      expect(s.expandedSpells ?? null).toEqual(want.spells ?? null);
    });
  }
  test("every always-prepared subclass spell is a 2024 spell", () => {
    const names = new Set(getStaticSpells([], "2024").map((s) => s.name));
    // SRD subclasses only; the 2024 Player's Handbook ones are checked in phb2024.test.ts.
    const subclasses = (classes.flatMap((c) => getStaticSubclasses(c.name, [], "2024")) as any[]).filter((s) => (s.source || "PHB") === "PHB");
    const lists = subclasses.flatMap((s) => [s.expandedSpells, ...Object.values(s.expandedSpellsByOption || {})]).filter(Boolean);
    for (const list of lists) for (const spell of Object.values(list).flat() as string[]) expect([spell, names.has(spell)]).toEqual([spell, true]);
  });
});

describe("2024 species, backgrounds, feats", () => {
  test("species", () => {
    const got = Object.fromEntries(
      getStaticRaces([], "2024").map((s: any) => [s.name, { size: s.size, speed: s.speed, darkvision: s.darkvision, traits: s.traits.map((t: any) => t.name), options: (s.choices?.[0]?.id.endsWith("-lineage") ? s.choices[0].options : []).map((o: any) => o.name) }]),
    );
    expect(got).toEqual(fixture.species);
    for (const s of getStaticRaces([], "2024")) expect(s.abilityScoreIncreases).toEqual({});
  });
  test("lineage spells by character level", () => {
    const got: Record<string, unknown> = {};
    for (const s of getStaticRaces([], "2024")) for (const o of lineageChoiceOf(s)?.options || []) if (o.spells) got[o.name] = o.spells;
    expect(got).toEqual(fixture.lineageSpells);
  });
  test("species picks: Keen Senses, Skillful, size, Wood Elf speed", () => {
    const race = (name: string) => getStaticRaces([], "2024").find((r) => r.name === name)!;
    expect(race("Elf").skillChoice).toEqual({ count: 1, options: ["Insight", "Perception", "Survival"] });
    expect(race("Human").skillChoice).toEqual({ count: 1 });
    expect(race("Human").originFeat).toBe(true);
    expect(race("Tiefling").spells).toEqual({ "1": ["Thaumaturgy"] });
    for (const name of ["Human", "Tiefling"]) expect(race(name).choices?.find((c) => c.id.endsWith("-size"))?.options?.map((o) => o.name)).toEqual(["Medium", "Small"]);
    for (const name of ["Elf", "Gnome", "Tiefling"]) expect(race(name).choices?.find((c) => c.id.endsWith("-spell-ability"))?.options?.map((o) => o.id)).toEqual(["int", "wis", "cha"]);
    expect(lineageChoiceOf(race("Elf"))?.options?.find((o) => o.name === "Wood Elf")?.speed).toBe(35);
  });
  test("weapon mastery properties", () => {
    expect(weaponMastery.weapons).toEqual(fixture.weaponMastery);
  });
  test("backgrounds", () => {
    const got = Object.fromEntries(getStaticBackgrounds2024("en", ["PHB"]).map((b) => [b.name, { abilityScores: b.abilityScores, feat: b.feat, skills: b.skills, tools: b.tools }]));
    expect(got).toEqual(fixture.backgrounds);
  });
  test("feats", () => {
    expect(Object.fromEntries(getStaticFeats(["PHB"], "2024").map((f: any) => [f.name, f.category]))).toEqual(fixture.feats);
  });
});

describe("2024 spells", () => {
  const spells = getStaticSpells([], "2024");
  test("339 spells, matching the checked list", () => {
    const got = Object.fromEntries(spells.map((s: any) => [s.name, [s.level, s.school, s.classes, s.concentration, s.ritual, s.castingTime]]));
    expect(got).toEqual(fixture.spells);
  });
  test("every class list has spells, and text has no PDF line-break hyphens", () => {
    for (const cls of ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"]) {
      expect(spells.some((s) => s.classes.includes(cls))).toBe(true);
    }
    for (const s of spells) expect([s.name, /\b[a-z]+- [a-z]+/.test(String(s.description))]).toEqual([s.name, false]);
  });
});
