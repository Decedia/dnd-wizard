// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { longRestPatch, restGains, rollHitDice, shortRestPatch } from "@/lib/rest";

/** A character as the sheet holds it: saved fields plus derived stats. */
const make = (over: Partial<Character>): Character => {
  const c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14, maxHp: 40, currentHp: 40, ...over } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
/** Apply a patch the way the sheet does: merge, then derive again. */
const apply = (c: Character, patch: Partial<Character>): Character => {
  const next = { ...c, ...patch } as Character;
  return { ...next, ...computeDerivedStats(next) } as Character;
};

describe("pools keep what was spent", () => {
  test("a spent rage stays spent when the sheet recomputes", () => {
    const barbarian = make({ class: "Barbarian", level: 5 });
    expect(barbarian.rages).toBe(3);
    const after = apply(apply(barbarian, { rages: 1 }), { currentHp: 30 });
    expect(after.rages).toBe(1);
    expect(after.maxRages).toBe(3);
  });

  test("a level-up adds the new uses without refilling the rest", () => {
    const monk = apply(make({ class: "Monk", level: 4 }), { kiPoints: 1 });
    const leveled = apply(monk, { level: 5 });
    expect(leveled.maxKiPoints).toBe(5);
    expect(leveled.kiPoints).toBe(2);
  });

  test("spent hit dice stay spent; a new level adds one", () => {
    const fighter = apply(make({ class: "Fighter", level: 6 }), { hitDiceRemaining: 2 });
    expect(apply(fighter, { currentHp: 10 }).hitDiceRemaining).toBe(2);
    expect(apply(fighter, { level: 7 }).hitDiceRemaining).toBe(3);
  });

  test("a paladin has one Channel Divinity from level 3", () => {
    expect(make({ class: "Paladin", level: 2 }).maxChannelDivinityUses).toBe(0);
    expect(make({ class: "Paladin", level: 3 }).channelDivinityUses).toBe(1);
  });
});

describe("short rest", () => {
  test("spends hit dice, heals up to the maximum, and never refills long-rest pools", () => {
    const barbarian = apply(make({ class: "Barbarian", level: 5 }), { rages: 0, currentHp: 10, hitDiceRemaining: 3 });
    const after = apply(barbarian, shortRestPatch(barbarian, 2, 100));
    expect(after.currentHp).toBe(40);
    expect(after.hitDiceRemaining).toBe(1);
    expect(after.rages).toBe(0);
  });

  test("no hit dice spent means no healing and none given back", () => {
    const fighter = apply(make({ class: "Fighter", level: 4 }), { currentHp: 10, hitDiceRemaining: 1, actionSurgeUses: 0 });
    const after = apply(fighter, shortRestPatch(fighter));
    expect(after.currentHp).toBe(10);
    expect(after.hitDiceRemaining).toBe(1);
    expect(after.actionSurgeUses).toBe(1);
  });

  test("ki, Channel Divinity and Wild Shape come back", () => {
    const monk = apply(make({ class: "Monk", level: 5 }), { kiPoints: 0 });
    expect(apply(monk, shortRestPatch(monk)).kiPoints).toBe(5);
    const cleric = apply(make({ class: "Cleric", level: 6 }), { channelDivinityUses: 0 });
    expect(apply(cleric, shortRestPatch(cleric)).channelDivinityUses).toBe(2);
    const druid = apply(make({ class: "Druid", level: 2 }), { wildShapeUses: 0 });
    expect(apply(druid, shortRestPatch(druid)).wildShapeUses).toBe(2);
  });

  test("a warlock gets pact slots back; a wizard does not", () => {
    const warlock = apply(make({ class: "Warlock", level: 5 }), { spellSlotsExpended: { 3: 2 } });
    expect(apply(warlock, shortRestPatch(warlock)).spellSlotsExpended).toEqual({ 3: 0 });
    const wizard = apply(make({ class: "Wizard", level: 5 }), { spellSlotsExpended: { 1: 4, 2: 1, 3: 0 } });
    expect(apply(wizard, shortRestPatch(wizard)).spellSlotsExpended).toEqual({ 1: 4, 2: 1, 3: 0 });
  });

  test("Bardic Inspiration comes back only from bard level 5", () => {
    const low = apply(make({ class: "Bard", level: 4 }), { bardicInspirationUses: 0 });
    expect(apply(low, shortRestPatch(low)).bardicInspirationUses).toBe(0);
    const high = apply(make({ class: "Bard", level: 5 }), { bardicInspirationUses: 0 });
    expect(apply(high, shortRestPatch(high)).bardicInspirationUses).toBe(2);
  });

  test("a level 20 sorcerer gets 4 sorcery points, lower levels none", () => {
    const top = apply(make({ class: "Sorcerer", level: 20 }), { sorceryPoints: 1 });
    expect(apply(top, shortRestPatch(top)).sorceryPoints).toBe(5);
    const mid = apply(make({ class: "Sorcerer", level: 10 }), { sorceryPoints: 1 });
    expect(apply(mid, shortRestPatch(mid)).sorceryPoints).toBe(1);
  });
});

describe("long rest", () => {
  test("full HP, all slots, half the hit dice, one exhaustion level", () => {
    const wizard = apply(make({ class: "Wizard", level: 8 }), {
      currentHp: 3, temporaryHp: 5, hitDiceRemaining: 1, exhaustionLevel: 2, arcaneRecoveryUsed: true,
      spellSlotsExpended: { 1: 4, 2: 3, 3: 3, 4: 2 }, deathSaveFailures: 2,
    });
    const after = apply(wizard, longRestPatch(wizard));
    expect(after.currentHp).toBe(40);
    expect(after.temporaryHp).toBe(0);
    expect(after.hitDiceRemaining).toBe(5);
    expect(after.exhaustionLevel).toBe(1);
    expect(after.arcaneRecoveryUsed).toBe(false);
    expect(after.deathSaveFailures).toBe(0);
    expect(Object.values(after.spellSlotsExpended).every((n) => n === 0)).toBe(true);
  });

  test("hit dice never pass the level, and level 1 still gets one back", () => {
    const full = make({ class: "Fighter", level: 6 });
    expect(apply(full, longRestPatch(full)).hitDiceRemaining).toBe(6);
    const one = apply(make({ class: "Fighter", level: 1 }), { hitDiceRemaining: 0 });
    expect(apply(one, longRestPatch(one)).hitDiceRemaining).toBe(1);
  });

  test("every pool refills", () => {
    const paladin = apply(make({ class: "Paladin", level: 6 }), { layOnHandsPool: 0, channelDivinityUses: 0 });
    const after = apply(paladin, longRestPatch(paladin));
    expect(after.layOnHandsPool).toBe(30);
    expect(after.channelDivinityUses).toBe(1);
  });
});

describe("rest summary and dice", () => {
  test("lists only what would come back", () => {
    const fresh = make({ class: "Fighter", level: 5 });
    expect(restGains(fresh, "long")).toEqual([]);
    const worn = apply(fresh, { currentHp: 10, actionSurgeUses: 0, hitDiceRemaining: 0 });
    expect(restGains(worn, "long").map((g) => g.id)).toEqual(["hp", "hitDice", "actionSurge"]);
    expect(restGains(worn, "short").map((g) => g.id)).toEqual(["actionSurge"]);
  });

  test("each hit die heals its roll plus Constitution, never less than 0", () => {
    const frail = make({ class: "Wizard", level: 3, con: 3 });
    expect(rollHitDice(frail, 2, () => 0)).toEqual({ rolls: [1, 1], healed: 0 });
    const tough = make({ class: "Barbarian", level: 3, con: 16 });
    expect(rollHitDice(tough, 2, () => 0.999)).toEqual({ rolls: [12, 12], healed: 30 });
  });
});
