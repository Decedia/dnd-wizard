// The 2024 Player's Handbook content beyond SRD 5.2 (hand-written, source "PHB2024"):
// every expected subclass is there once, it only shows with the book on, and
// Eldritch Knight / Arcane Trickster casting works from the Wizard list.
// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import phb from "@/data/en/2024_phb_subclasses.json";
import srd from "@/data/en/2024_subclasses.json";
import spells2024 from "@/data/en/2024_spells.json";
import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import { buildLevelInfos } from "@/components/level-up/level-infos";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { spellChoicePool } from "@/lib/spell-pool";
import { upgradeSave } from "@/lib/save-upgrade";
import { defaultSources, PHB_2024 } from "@/lib/rulesets";

/** The 2024 book's subclasses, four per class (SRD 5.2 has the first of each). */
const EXPECTED: Record<string, string[]> = {
  Barbarian: ["Path of the Berserker", "Path of the Wild Heart", "Path of the World Tree", "Path of the Zealot"],
  Fighter: ["Battle Master", "Champion", "Eldritch Knight", "Psi Warrior"],
  Monk: ["Warrior of Mercy", "Warrior of Shadow", "Warrior of the Elements", "Warrior of the Open Hand"],
  Rogue: ["Arcane Trickster", "Assassin", "Soulknife", "Thief"],
  Bard: ["College of Dance", "College of Glamour", "College of Lore", "College of Valor"],
  Cleric: ["Life Domain", "Light Domain", "Trickery Domain", "War Domain"],
  Paladin: ["Oath of Devotion", "Oath of Glory", "Oath of Vengeance", "Oath of the Ancients"],
  Ranger: ["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"],
  Druid: ["Circle of the Land", "Circle of the Moon", "Circle of the Sea", "Circle of the Stars"],
  Sorcerer: ["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"],
  Warlock: ["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"],
  Wizard: ["Abjurer", "Diviner", "Evoker", "Illusionist"],
};

/** Always-prepared spells from the 2024 book that SRD 5.2 lacks; the spells PR adds them. */
const SPELLS_STILL_MISSING = [
  "Arms of Hadar", "Crusader's Mantle", "Fount of Moonlight", "Hunger of Hadar", "Mind Sliver", "Steel Wind Strike",
  "Summon Aberration", "Summon Beast", "Summon Celestial", "Summon Construct", "Summon Fey", "Yolande's Regal Presence",
];

describe("2024 Player's Handbook subclasses", () => {
  test("each class has the book's subclasses, once each", () => {
    const all = [...srd.subclasses, ...phb.subclasses];
    for (const [cls, names] of Object.entries(EXPECTED)) {
      expect([cls, all.filter((s) => s.class === cls).map((s) => s.name).sort()]).toEqual([cls, names]);
    }
    expect(new Set(phb.subclasses.map((s) => s.index)).size).toBe(phb.subclasses.length);
  });

  test("every feature has a level and text; levels fit the class's subclass levels", () => {
    const levels: Record<string, number[]> = {
      Barbarian: [3, 6, 10, 14], Fighter: [3, 7, 10, 15, 18], Monk: [3, 6, 11, 17], Rogue: [3, 9, 13, 17],
      Bard: [3, 6, 14], Cleric: [3, 6, 17], Paladin: [3, 7, 15, 20], Ranger: [3, 7, 11, 15],
      Druid: [3, 6, 10, 14], Sorcerer: [3, 6, 14, 18], Warlock: [3, 6, 10, 14], Wizard: [3, 6, 10, 14],
    };
    for (const s of phb.subclasses) {
      for (const f of s.features) {
        expect([s.name, f.name, levels[s.class]?.includes(f.level), f.description.length > 15]).toEqual([s.name, f.name, true, true]);
      }
    }
  });

  test("always-prepared spells are real 2024 spells at levels the class can cast", () => {
    const known = new Set((spells2024 as any).spells.map((x: any) => x.name));
    const unknown = phb.subclasses.flatMap((s: any) => Object.values(s.expandedSpells || {}).flat() as string[]).filter((n) => !known.has(n));
    expect([...new Set(unknown)].sort()).toEqual(SPELLS_STILL_MISSING);
    const firstSlot: Record<string, number> = { Bard: 3, Cleric: 3, Paladin: 3, Ranger: 3, Druid: 3, Sorcerer: 3, Warlock: 3, Wizard: 3 };
    for (const s of phb.subclasses as any[]) {
      for (const lvl of Object.keys(s.expandedSpells || {})) expect([s.name, Number(lvl) >= (firstSlot[s.class] ?? 99)]).toEqual([s.name, true]);
    }
  });

  test("shown with the book on, hidden with core rules only", () => {
    const names = (sources: string[]) => getStaticSubclasses("Fighter", sources, "2024").map((s) => s.name);
    expect(names(defaultSources("2024"))).toContain("Battle Master");
    expect(names(["PHB"])).toEqual(["Champion"]);
    expect(getStaticClass("Fighter", "2024")!.subclasses!.map((s) => s.name)).toContain("Psi Warrior");
  });

  test("Battle Master learns 3 maneuvers, then 2 more at 7, 10 and 15", () => {
    const bm = getStaticSubclasses("Fighter", undefined, "2024").find((s) => s.name === "Battle Master")!;
    const cs = bm.features.find((f) => f.name === "Combat Superiority") as any;
    expect(cs.choicesCount).toBe(3);
    expect(cs.choicesCountByLevel).toEqual({ "3": 3, "7": 2, "10": 2, "15": 2 });
    expect(cs.choices.length).toBe(20);
  });

  test("an old 2024 save gets the book turned on; 2014 and all-books saves stay as they are", () => {
    const c = (patch: Partial<Character>) => upgradeSave({ ...createEmptyCharacter(), saveVersion: 2, ...patch });
    expect(c({ ruleset: "2024", sources: ["PHB"] }).sources).toEqual(["PHB", PHB_2024]);
    expect(c({ ruleset: "2014", sources: ["PHB"] }).sources).toEqual(["PHB"]);
    expect(c({ ruleset: "2024", sources: [] }).sources).toEqual([]);
  });
});

describe("2024 Eldritch Knight and Arcane Trickster", () => {
  const fighter = (subclass: string, level: number): Character => ({ ...createEmptyCharacter(), ruleset: "2024", sources: defaultSources("2024"), class: "Fighter", subclass, level, int: 16 });
  const info = (cls: string, subclass: string, level: number) =>
    buildLevelInfos({ ...fighter(subclass, level - 1), class: cls }, level, getStaticClass(cls, "2024"), subclass, level - 1, false, "en").at(-1)!;

  test("level 3 Eldritch Knight: 2 cantrips, 3 spells, two level 1 slots; a Champion gets none", () => {
    const ek = info("Fighter", "Eldritch Knight", 3);
    expect([ek.cantripSelectionCount, ek.spellSelectionCount, ek.maxSpellLevel]).toEqual([2, 3, 1]);
    const champ = info("Fighter", "Champion", 3);
    expect([champ.cantripSelectionCount ?? 0, champ.spellSelectionCount, champ.hasSpellSelection]).toEqual([0, 0, false]);
    expect(computeDerivedStats(fighter("Eldritch Knight", 3)).spellSlots).toEqual({ 1: 2 });
    expect(computeDerivedStats(fighter("Champion", 3)).spellSlots ?? {}).toEqual({});
  });

  test("level 3 Arcane Trickster: 3 cantrips and 3 spells; level 7 adds one", () => {
    const at = info("Rogue", "Arcane Trickster", 3);
    expect([at.cantripSelectionCount, at.spellSelectionCount]).toEqual([3, 3]);
    expect(info("Rogue", "Arcane Trickster", 7).spellSelectionCount).toBe(1);
  });

  test("picks come from the whole Wizard list, any school", () => {
    const pool = spellChoicePool(fighter("Eldritch Knight", 3), { maxLevel: 1, selectionType: "prepare" }).map((s: any) => s.name);
    expect(pool).toContain("Magic Missile");
    expect(pool).toContain("Sleep");
    expect(pool).not.toContain("Cure Wounds");
  });
});
