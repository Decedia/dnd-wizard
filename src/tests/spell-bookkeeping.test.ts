// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getFreeCastSpells, syncGrantedSpells } from "@/lib/granted-spells";
import { applyLongRest, applyShortRest, createEmptyCharacter, type Character } from "@/lib/storage";
import mechanics from "@/data/en/2014_spell_mechanics.json";
import { getStaticSpells } from "@/lib/srd-client";

const make = (extra: Partial<Character>): Character => ({ ...createEmptyCharacter(), class: "Fighter", level: 5, ...extra });
const names = (c: Character) => c.spells.map((s) => s.name).sort();

describe("granted spells follow their source", () => {
  test("a race change removes the old race's spells and adds the new ones", () => {
    const drow = syncGrantedSpells(make({ race: "Drow" }));
    expect(names(drow)).toEqual(["Dancing Lights", "Darkness", "Faerie Fire"]);
    const tiefling = syncGrantedSpells({ ...drow, race: "Tiefling" });
    expect(names(tiefling)).toEqual(["Darkness", "Hellish Rebuke", "Thaumaturgy"]);
    expect(tiefling.cantrips.map((c) => c.name)).toEqual(["Thaumaturgy"]);
  });

  test("a level drop removes spells the old level gave", () => {
    const c = syncGrantedSpells(make({ race: "Drow" }));
    expect(names(syncGrantedSpells({ ...c, level: 2 }))).toEqual(["Dancing Lights"]);
  });

  test("a spell the player picked stays", () => {
    const own = { id: "spell-Shield-1", name: "Shield", level: 1, source: "srd" as const };
    const c = syncGrantedSpells(make({ race: "Drow", spells: [own] }));
    expect(names(syncGrantedSpells({ ...c, race: "Human" }))).toEqual(["Shield"]);
  });
});

describe("free casts of race and feat spells", () => {
  test("race spells above cantrips, feat spells and picks", () => {
    const c = make({
      race: "Tiefling",
      featureSelections: { "asi-feat-4": ["Fey Touched"], "asi-feat-4-options": ["first_level_spell=Bless"] },
    });
    expect(getFreeCastSpells(c).map((f) => f.name).sort()).toEqual(["Bless", "Darkness", "Hellish Rebuke", "Misty Step"]);
  });

  test("at-will spells have no free cast", () => {
    expect(getFreeCastSpells(make({ race: "Yuan-ti Pureblood" })).map((f) => f.name)).toEqual(["Suggestion"]);
  });

  test("a long rest gives every free cast back, a short rest only Firbolg's", () => {
    const c = make({ race: "Firbolg", freeCastsUsed: ["detect magic", "suggestion"] });
    expect(applyShortRest(c).freeCastsUsed).toEqual(["suggestion"]);
    expect(applyLongRest(c).freeCastsUsed).toEqual([]);
  });
});

describe("spell mechanics data", () => {
  test("every entry names a spell in the spell data, once", () => {
    const spells = new Set(getStaticSpells([]).map((s) => s.name.toLowerCase()));
    const list = (mechanics as any).spells as { spell: string; source?: string }[];
    expect(list.filter((m) => !spells.has(m.spell.toLowerCase())).map((m) => m.spell)).toEqual([]);
    const keys = list.map((m) => `${m.spell.toLowerCase()}|${m.source}`);
    expect(keys.length).toBe(new Set(keys).size);
  });
});
