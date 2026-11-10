// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticSpells } from "@/lib/srd-client";
import { attacksPerAction, buildTurnMenu, endTurnPatch, lowestOpenSlot, optionPatch, slotOfCastingTime, startTurnPatch } from "@/lib/turn";

const spells = getStaticSpells(undefined, "2014") as any[];
const base = { id: "t", name: "t", race: "Human", ruleset: "2014", sources: ["PHB"], level: 5, str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10, speed: 30, features: [], attacks: [], inventory: [], spells: [], cantrips: [], preparedSpells: [], spellSlots: {}, spellSlotsExpended: {}, spellsUsedThisTurn: [], featuresUsedThisTurn: [], activeStates: [], activeBuffs: [], skills: {}, featureSelections: {} } as any;
const find = (menu: ReturnType<typeof buildTurnMenu>, name: string) => menu.options.find((o) => o.name === name);

describe("turn menu", () => {
  test("casting time decides the slot; long casts are left out", () => {
    expect(slotOfCastingTime("1 action")).toBe("action");
    expect(slotOfCastingTime("1 Bonus Action")).toBe("bonus");
    expect(slotOfCastingTime("1 reaction, which you take when hit")).toBe("reaction");
    expect(slotOfCastingTime("10 minutes")).toBeNull();
  });

  test("a wizard's spells land in the right slot and spend the lowest open slot", () => {
    const wizard = {
      ...base, class: "Wizard", subclass: "Evocation", spellSaveDc: 14,
      spells: [
        { id: "s1", name: "Fireball", level: 3, source: "srd", srdSpellName: "Fireball" },
        { id: "s2", name: "Shield", level: 1, source: "srd", srdSpellName: "Shield" },
        { id: "s3", name: "Misty Step", level: 2, source: "srd", srdSpellName: "Misty Step" },
        { id: "s4", name: "Fire Bolt", level: 0, source: "srd", srdSpellName: "Fire Bolt" },
        { id: "s5", name: "Identify", level: 1, source: "srd", srdSpellName: "Identify" },
      ],
      preparedSpells: ["s1", "s2", "s3", "s5"],
      spellSlots: { 1: 4, 2: 3, 3: 2 }, spellSlotsExpended: { 1: 4, 2: 0, 3: 0 },
    };
    const menu = buildTurnMenu(wizard, spells);
    expect(find(menu, "Fireball")?.slot).toBe("action");
    expect(find(menu, "Fireball")?.saveDc).toBe(14);
    expect(find(menu, "Misty Step")?.slot).toBe("bonus");
    expect(find(menu, "Fire Bolt")?.cost).toBeUndefined();
    expect(find(menu, "Identify")).toBeUndefined();
    // Level 1 slots are gone, so Shield takes a level 2 slot.
    const shield = find(menu, "Shield")!;
    expect(shield.slot).toBe("reaction");
    expect(shield.cost?.values.level).toBe(2);
    expect(optionPatch(shield)).toMatchObject({ reactionUsed: true, spellSlotsExpended: { 1: 4, 2: 1, 3: 0 } });
  });

  test("no slot left blocks a leveled spell; unprepared spells are hidden", () => {
    const cleric = {
      ...base, class: "Cleric", subclass: "Life",
      spells: [
        { id: "a", name: "Guiding Bolt", level: 1, source: "srd", srdSpellName: "Guiding Bolt" },
        { id: "b", name: "Bane", level: 1, source: "srd", srdSpellName: "Bane" },
      ],
      preparedSpells: ["a"], spellSlots: { 1: 2 }, spellSlotsExpended: { 1: 2 },
    };
    const menu = buildTurnMenu(cleric, spells);
    expect(find(menu, "Guiding Bolt")?.blocked).toBe("noSlot");
    expect(find(menu, "Bane")).toBeUndefined();
    expect(lowestOpenSlot(cleric, 1)).toBeNull();
  });

  test("tabled features become options; attacks and basic actions are always there", () => {
    const barbarian = { ...base, class: "Barbarian", subclass: "Berserker", features: [{ id: "class-Rage", name: "Rage", description: "", source: "class" }, { id: "class-Primal Path feature", name: "Path feature", description: "", source: "class" }, { id: "class-Extra Attack", name: "Extra Attack", description: "", source: "class" }] };
    const menu = buildTurnMenu(barbarian, spells);
    expect(menu.features).toEqual([]);
    expect(find(menu, "Rage")?.slot).toBe("bonus");
    expect(menu.attacksPerAction).toBe(2);
    expect(attacksPerAction({ class: "Fighter", level: 11, features: barbarian.features })).toBe(3);
    expect(menu.options.some((o) => o.key === "basic:dodge" && o.slot === "action")).toBe(true);
    expect(menu.options.some((o) => o.key === "attack:unarmed" && o.toHit === 6)).toBe(true);
  });
});

describe("turn start and end", () => {
  test("start gives everything back and counts the round", () => {
    expect(startTurnPatch({ turnRound: 2 })).toEqual({ turnActive: true, turnRound: 3, actionUsed: false, bonusActionUsed: false, reactionUsed: false, moveUsed: false, objectInteractionUsed: false, swings: [] });
  });

  test("end keeps the reaction as it is", () => {
    const patch = endTurnPatch({ ...base, class: "Fighter", reactionUsed: true, featuresUsedThisTurn: ["x"] }, spells);
    expect(patch.turnActive).toBe(false);
    expect(patch.featuresUsedThisTurn).toEqual([]);
    expect("reactionUsed" in patch).toBe(false);
  });
});
