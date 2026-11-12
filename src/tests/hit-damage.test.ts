// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { addsHitDamage, autoHitExtras, buildTurnMenu, hitPatch, lastHitIndex, removeSwingExtraPatch, swingDamagePatch, swingExtraPatch } from "@/lib/turn";

const base = { id: "t", name: "t", race: "Human", ruleset: "2014", sources: ["PHB"], level: 5, str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10, speed: 30, attacks: [], inventory: [], spells: [], cantrips: [], preparedSpells: [], spellSlots: {}, spellSlotsExpended: {}, spellsUsedThisTurn: [], featuresUsedThisTurn: [], activeStates: [], activeBuffs: [], skills: {} } as any;

const optionFor = (c: any, name: string) => buildTurnMenu(c, []).options.find((o) => o.name === name);

describe("damage a feature adds on a hit", () => {
  test("Colossus Slayer rolls 1d8 and joins the hit", () => {
    const ranger = { ...base, class: "Ranger", subclass: "Hunter", features: [{ id: "f", name: "Hunter's Prey" }], featureSelections: { "subclass-feature-3-Hunter's Prey": ["Colossus Slayer"] } };
    const o = optionFor(ranger, "Colossus Slayer");
    expect(o?.featureDice).toBe("1d8");
    expect(addsHitDamage(o!)).toBe(true);
  });

  test("dice grow with level", () => {
    const at = (level: number, cls: string, sub: string, feature: string) => optionFor({ ...base, level, class: cls, subclass: sub, features: [{ id: "f", name: feature }] }, feature)?.featureDice;
    expect(at(8, "Cleric", "Life", "Divine Strike")).toBe("1d8");
    expect(at(14, "Cleric", "Life", "Divine Strike")).toBe("2d8");
    expect(at(10, "Barbarian", "Zealot", "Divine Fury")).toBe("1d6+5");
    expect(at(6, "Ranger", "", "Favored Foe")).toBe("1d6");
    expect(at(10, "Bard", "Whispers", "Psychic Blades")).toBe("5d6");
    expect(at(9, "Rogue", "Thief", "Sneak Attack")).toBe("5d6");
  });

  test("the dice go on the newest swing that hit", () => {
    const c = { ...base, swings: [{ key: "a", name: "A", result: "hit" }, { key: "a", name: "A", result: "miss" }] };
    expect(lastHitIndex(c)).toBe(0);
    expect(lastHitIndex({ ...base, swings: [{ key: "a", name: "A", result: "miss" }] })).toBe(-1);
    const patch = swingExtraPatch(c, 0, "Colossus Slayer", "1d8");
    expect(patch.swings?.[0].extras).toEqual([{ name: "Colossus Slayer", dice: "1d8" }]);
    expect(patch.swings?.[1].extras).toBeUndefined();
  });
});

describe("features that fire by themselves on a hit", () => {
  const cleric = { ...base, level: 8, class: "Cleric", subclass: "Life", features: [{ id: "f", name: "Divine Strike" }], swings: [{ key: "a", name: "A", result: "pending" }] };

  test("Divine Strike joins the hit and is used for the turn", () => {
    const patch = hitPatch(cleric, 0, "hit");
    expect(patch.swings?.[0].extras).toEqual([{ name: "Divine Strike", dice: "1d8", auto: true, mark: patch.featuresUsedThisTurn?.[0] }]);
    // Once per turn: the second hit gets nothing.
    const second = { ...cleric, ...patch, swings: [...patch.swings!, { key: "a", name: "A", result: "pending" }] } as any;
    expect(hitPatch(second, 1, "hit").swings?.[1].extras).toBeUndefined();
  });

  test("a miss fires nothing", () => {
    expect(hitPatch(cleric, 0, "miss").swings?.[0].extras).toBeUndefined();
  });

  test("taking it off gives the use and the damage back", () => {
    const hit = { ...cleric, ...hitPatch(cleric, 0, "hit") } as any;
    const rolled = { ...hit, ...swingDamagePatch(hit, 0, ["Damage", "Divine Strike"], [7, 5]) } as any;
    expect(rolled.swings[0].damage).toBe(12);
    const off = removeSwingExtraPatch(rolled, 0, "Divine Strike");
    expect(off.swings?.[0].damage).toBe(7);
    expect(off.swings?.[0].extras).toEqual([]);
    expect(off.featuresUsedThisTurn).toEqual([]);
  });

  test("features with a cost or a condition the app can't see stay a tap", () => {
    const ranger = { ...base, class: "Ranger", subclass: "Hunter", features: [{ id: "f", name: "Hunter's Prey" }, { id: "g", name: "Favored Foe" }], featureSelections: { "subclass-feature-3-Hunter's Prey": ["Colossus Slayer"] } };
    expect(autoHitExtras(ranger).extras).toEqual([]);
  });

  test("Divine Fury only while raging; Hunter's Mark while its timer runs", () => {
    const zealot = { ...base, class: "Barbarian", subclass: "Zealot", level: 6, features: [{ id: "f", name: "Divine Fury" }] };
    expect(autoHitExtras(zealot).extras).toEqual([]);
    expect(autoHitExtras({ ...zealot, activeStates: ["raging"] }).extras.map((x) => x.dice)).toEqual(["1d6+3"]);
    const marked = { ...base, class: "Ranger", activeBuffs: [{ spellId: "spell:hunter's mark", name: "Hunter's Mark", concentration: true, turnsRemaining: 600 }] };
    expect(autoHitExtras(marked).extras).toEqual([{ name: "Hunter's Mark", dice: "1d6", auto: true }]);
  });
});
