// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getTakenSpellNames, isSpellTakenElsewhere, spellNamesIn } from "@/lib/taken-spells";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const make = (patch: Partial<Character>): Character => ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", ...patch } as Character);

describe("taken spells", () => {
  test("reads spell names out of stored pick values and skips other picks", () => {
    expect(spellNamesIn(["Bless, Archery", "spell=Shield", "Fire Bolt:0", "Stealth"])).toEqual(["bless", "shield", "fire bolt"]);
  });

  test("counts the spell list, cantrips, free spells, feature and feat picks, and pending picks", () => {
    const c = make({
      class: "Cleric",
      subclass: "Life",
      level: 3,
      race: "High Elf",
      raceChoices: { "high-elf-cantrip": "fire-bolt" },
      spells: [{ id: "a", name: "Guiding Bolt", level: 1, source: "srd" } as Character["spells"][number]],
      cantrips: [{ id: "b", name: "Sacred Flame" }],
      featureSelections: { "asi-feat-4-options": ["spell=Find Familiar"], "pact-tome-cantrips": ["Mage Hand"] },
    });
    const taken = getTakenSpellNames(c, ["Healing Word:1"]);
    for (const name of ["guiding bolt", "sacred flame", "bless", "fire bolt", "find familiar", "mage hand", "healing word"]) {
      expect(taken.has(name)).toBe(true);
    }
    expect(taken.has("shield")).toBe(false);
  });

  test("a picker's own picks stay pickable", () => {
    const taken = new Set(["bless", "shield"]);
    expect(isSpellTakenElsewhere(taken, "Bless", ["Bless:1"])).toBe(false);
    expect(isSpellTakenElsewhere(taken, "Shield", ["Bless:1"])).toBe(true);
    expect(isSpellTakenElsewhere(taken, "Magic Missile")).toBe(false);
  });
});
