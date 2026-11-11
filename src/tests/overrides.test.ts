// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { setOverride, withOverride } from "@/lib/overrides";
import { overridePatch, ruleValueOf, canAddTo } from "@/lib/override-rules";
import { skillBonus, passiveScore } from "@/lib/skill-bonus";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";

const make = (over: Partial<Character> = {}): Character => {
  const c = { ...createEmptyCharacter(), ruleset: "2014", class: "Fighter", level: 3, race: "Human", str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8, maxHp: 28, currentHp: 28, ...over } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const apply = (c: Character, patch: Partial<Character>): Character => {
  const next = { ...c, ...patch } as Character;
  return { ...next, ...computeDerivedStats(next) } as Character;
};

describe("numbers set by hand", () => {
  test("an add of 0 is cleared; set stays even at 0", () => {
    const c = make();
    expect(setOverride(c, "ac", { mode: "add", value: 0 }).overrides).toEqual({});
    expect(setOverride(c, "ac", { mode: "set", value: 0 }).overrides?.ac).toEqual({ mode: "set", value: 0 });
    expect(withOverride(c, "ac", 12)).toBe(12);
  });

  test("set AC always wins, even after a level-up; add stays on top of the rules", () => {
    const c = make();
    const rule = ruleValueOf(c, "ac");
    let s = apply(c, overridePatch(c, "ac", { mode: "set", value: 19 }));
    expect(s.ac).toBe(19);
    s = apply(s, { level: 4, dex: 18 });
    expect(s.ac).toBe(19);
    let a = apply(c, overridePatch(c, "ac", { mode: "add", value: 1 }));
    expect(a.ac).toBe(rule + 1);
    a = apply(a, { dex: 18 });
    expect(a.ac).toBe(ruleValueOf(a, "ac") + 1);
    expect(ruleValueOf(a, "ac")).toBeGreaterThan(rule);
  });

  test("speed, initiative, spell DC and saves take the override", () => {
    const c = make({ class: "Wizard", int: 16 });
    const s = apply(c, { overrides: { speed: { mode: "set", value: 40 }, initiative: { mode: "add", value: 5 }, spellSaveDc: { mode: "set", value: 17 }, "save:wis": { mode: "add", value: 1 } } });
    expect(s.speed).toBe(40);
    expect(s.initiative).toBe(ruleValueOf(s, "initiative") + 5);
    expect(s.spellSaveDc).toBe(17);
    expect(s.savingThrows?.wis?.value).toBe(ruleValueOf(s, "save:wis") + 1);
  });

  test("skills and passives", () => {
    const c = make({ skills: { Perception: true } as any });
    const s = apply(c, { overrides: { "skill:Stealth": { mode: "set", value: 9 }, "passive:Perception": { mode: "add", value: 5 } } });
    expect(skillBonus(s, "Stealth", "dex")).toBe(9);
    expect(ruleValueOf(s, "skill:Stealth")).toBe(2);
    expect(skillBonus(s, "Perception", "wis")).toBe(3);
    expect(passiveScore(s, "Perception")).toBe(13 + 5);
  });

  test("max HP add uses HP per level and does not grow on every change", () => {
    const c = make({ levelHp: { 1: 12, 2: 8, 3: 8 } });
    expect(canAddTo(c, "maxHp")).toBe(true);
    let s = apply(c, overridePatch(c, "maxHp", { mode: "add", value: 3 }));
    expect(s.maxHp).toBe(31);
    s = apply(s, {});
    s = apply(s, { name: "again" });
    expect(s.maxHp).toBe(31);
    s = apply(s, overridePatch(s, "maxHp", null));
    expect(s.maxHp).toBe(28);
  });

  test("an old save with no HP per level can set max HP, and clearing puts the old maximum back", () => {
    const c = make({ levelHp: {}, maxHp: 30, currentHp: 30 });
    expect(canAddTo(c, "maxHp")).toBe(false);
    let s = apply(c, overridePatch(c, "maxHp", { mode: "add", value: 5 }));
    expect(s.overrides?.maxHp?.mode).toBe("set");
    s = apply(c, overridePatch(c, "maxHp", { mode: "set", value: 20 }));
    expect(s.maxHp).toBe(20);
    expect(s.currentHp).toBe(20);
    s = apply(s, overridePatch(s, "maxHp", null));
    expect(s.maxHp).toBe(30);
    expect(s.overrides?.maxHp).toBeUndefined();
  });

  test("a weapon's to-hit", () => {
    const row = { id: "w1", name: "Longsword", itemId: "longsword", quantity: 1, equipped: true, source: "srd", itemType: "weapon", damageDice: "1d8", damageType: "slashing", properties: ["Versatile"] } as any;
    const c = make({ inventory: [row] });
    const attack = (c.attacks || []).find((a) => a.id === "w1") ?? { id: "w1", name: "Longsword", attackBonus: 0, damageType: "" };
    const rule = getWeaponAttackDetails(c, attack)!.attackBonus;
    const s = apply(c, { overrides: { "attack:w1": { mode: "add", value: 1 } } });
    expect(getWeaponAttackDetails(s, attack)!.attackBonus).toBe(rule + 1);
    expect(ruleValueOf(s, "attack:w1")).toBe(rule);
  });
});
