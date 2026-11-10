// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticSpells } from "@/lib/srd-client";
import { averageHealing, featureHealing, healSelfPatch, rollHealing, spellHealing } from "@/lib/healing";
import { buildTurnMenu } from "@/lib/turn";
import { arcaneRecoveryBudget, shortRestPatch } from "@/lib/rest";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const spells = getStaticSpells(undefined, "2014") as any[];
const srd = (name: string) => spells.find((s) => s.name === name);
const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  maxHp: 40,
  currentHp: 10,
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "class" })) as Character["features"],
});

describe("healing", () => {
  const cleric = (features: string[] = []) => make({ class: "Cleric", level: 5, wis: 16, spellcastingAbility: "wis" }, features);

  test("Cure Wounds heals its dice plus the spellcasting modifier, more with a higher slot", () => {
    expect(spellHealing(cleric(), srd("Cure Wounds"), 1)).toMatchObject({ dice: "1d8", bonus: 3 });
    expect(spellHealing(cleric(), srd("Cure Wounds"), 3)).toMatchObject({ dice: "3d8", bonus: 3 });
    expect(spellHealing(cleric(), srd("Heal"), 6)).toMatchObject({ dice: "", bonus: 70 });
    expect(spellHealing(cleric(), srd("False Life"), 1)).toBeNull();
    expect(averageHealing({ dice: "2d8", bonus: 3, notes: [] })).toBe(12);
  });

  test("Life Domain: Disciple of Life adds 2 + spell level, Supreme Healing maxes the dice, Blessed Healer heals you too", () => {
    const h = spellHealing(cleric(["Disciple of Life", "Blessed Healer", "Supreme Healing"]), srd("Cure Wounds"), 2)!;
    expect(h.bonus).toBe(3 + 4);
    expect(h.notes).toEqual([{ source: "Disciple of Life", value: 4 }]);
    expect(h.maxDice).toBe(true);
    expect(averageHealing(h)).toBe(16 + 7);
    expect(rollHealing(h).total).toBe(16 + 7);
    expect(h.selfWhenOther).toBe(4);
  });

  test("features: Second Wind is self only; Lay on Hands heals the amount spent", () => {
    expect(featureHealing(make({ class: "Fighter", level: 3 }), "Second Wind")).toMatchObject({ dice: "1d10", bonus: 3, selfOnly: true });
    expect(featureHealing(make({ class: "Paladin", level: 3 }), "Lay on Hands", 7)).toMatchObject({ dice: "", bonus: 7 });
    expect(featureHealing(make({ class: "Paladin", level: 3 }), "Divine Smite")).toBeNull();
  });

  test("healing myself stops at max HP and wakes me at 0", () => {
    expect(healSelfPatch(make({ currentHp: 35 }), 10)).toEqual({ currentHp: 40 });
    expect(healSelfPatch(make({ currentHp: 0, deathSaveFailures: 2 }), 3)).toEqual({ currentHp: 3, deathSaveSuccesses: 0, deathSaveFailures: 0 });
  });

  test("the turn menu marks healing spells with their healing at the slot they use", () => {
    const c = { ...cleric(), spells: [{ id: "s1", name: "Cure Wounds", level: 1, source: "srd", srdSpellName: "Cure Wounds" }], preparedSpells: ["s1"], spellSlots: { 1: 4, 2: 3 }, spellSlotsExpended: { 1: 4 } } as Character;
    const o = buildTurnMenu(c, spells).options.find((x) => x.name === "Cure Wounds")!;
    expect(o.heal).toMatchObject({ dice: "2d8", bonus: 3 });
  });
});

describe("Arcane Recovery", () => {
  const wizard = (patch: Partial<Character> = {}) => make({ class: "Wizard", level: 6, spellSlotsExpended: { 1: 2, 2: 1, 3: 1 }, ...patch });

  test("gets back slots up to half the wizard level, once per long rest", () => {
    expect(arcaneRecoveryBudget(wizard())).toBe(3);
    const p = shortRestPatch(wizard(), 0, 0, { 1: 1, 2: 1 });
    expect(p.spellSlotsExpended).toEqual({ 1: 1, 2: 0, 3: 1 });
    expect(p.arcaneRecoveryUsed).toBe(true);
    expect(arcaneRecoveryBudget(wizard({ arcaneRecoveryUsed: true }))).toBe(0);
  });

  test("a pick over the limit does nothing", () => {
    const p = shortRestPatch(wizard(), 0, 0, { 3: 1, 1: 1 });
    expect(p.arcaneRecoveryUsed).toBeUndefined();
  });
});
