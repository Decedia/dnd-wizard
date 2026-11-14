// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticSpells } from "@/lib/srd-client";
import { buildTurnMenu, endTurnPatch, optionPatch } from "@/lib/turn";
import { optionRollGroups } from "@/lib/turn-rolls";
import { preparableSpells } from "@/lib/prepared-spells";
import { homebrewAsSrd, homebrewDamage, homebrewHealing, homebrewRow, newHomebrew, withHomebrew, type HomebrewSpell } from "@/lib/homebrew-spells";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const spells = getStaticSpells(undefined, "2014") as any[];
const labels = { toHit: "To hit", damage: "Damage", heal: "Healing" };

const wizard = (rows: Character["spells"], patch: Partial<Character> = {}): Character => ({
  ...createEmptyCharacter(),
  class: "Wizard",
  level: 5,
  int: 18,
  spellcastingAbility: "int",
  spellAttackBonus: 7,
  spellSaveDc: 15,
  spellSlots: { 1: 4, 2: 3, 3: 2 },
  spellSlotsExpended: {},
  spells: rows,
  preparedSpells: [],
  ...patch,
});

const lance = (patch: Partial<HomebrewSpell> = {}, level = 1) =>
  homebrewRow("hb1", "Ember Lance", level, "On a hit, the target catches fire.", { ...newHomebrew({ spellcastingAbility: "int" }), diceCount: 3, die: 6, damageType: "fire", scaleDice: 1, ...patch });

const option = (c: Character, name = "Ember Lance") => buildTurnMenu(c, spells).options.find((o) => o.name === name)!;

describe("homebrew spells", () => {
  test("an attack-roll spell uses the spell attack plus the extra bonus, or its own bonus", () => {
    expect(option(wizard([lance()]))).toMatchObject({ slot: "action", spellAttack: 7, homebrew: true });
    expect(option(wizard([lance({ attackBonus: 2 })])).spellAttack).toBe(9);
    expect(option(wizard([lance({ useSpellAttack: false, attackBonus: 4 })])).spellAttack).toBe(4);
  });

  test("damage grows per slot level above, and the turn helper casts with the lowest open slot", () => {
    const c = wizard([lance()], { spellSlotsExpended: { 1: 4 } });
    const o = option(c);
    expect(o.cost).toMatchObject({ key: "turn.cost.slot", values: { level: 2 } });
    expect(o.spellDamage).toEqual([{ dice: "4d6", type: "fire", count: 1 }]);
    expect(optionRollGroups(o, o.name, labels).map((g) => g.label)).toEqual(["To hit", "Damage fire"]);
    expect(homebrewDamage(c, lance({ scales: false }), 3)).toEqual([{ dice: "3d6", type: "fire", count: 1 }]);
  });

  test("a cantrip grows at hero levels 5, 11 and 17 and uses no slot", () => {
    const c = wizard([lance({}, 0)]);
    const o = option(c);
    expect(o.cost).toBeUndefined();
    expect(o.spellDamage?.[0].dice).toBe("6d6");
  });

  test("a saving-throw spell shows its save and DC; an always-hit spell rolls damage only", () => {
    const save = option(wizard([lance({ hit: "save", saveAbility: "CON", halfOnSave: true })]));
    expect(save).toMatchObject({ saveDc: 15, saveAbility: "CON", halfOnSave: true, spellAttack: undefined });
    const auto = option(wizard([lance({ hit: "auto", addMod: true })]));
    expect(auto.tags).toContain("autoHit");
    expect(auto.spellAttack).toBeUndefined();
    expect(optionRollGroups(auto, auto.name, labels).map((g) => g.label)).toEqual(["Damage fire"]);
    expect(auto.spellDamage?.[0]).toMatchObject({ dice: "3d6+4", bonuses: [{ value: 4 }] });
  });

  test("a healing spell heals instead of dealing damage", () => {
    const c = wizard([lance({ damageType: "healing", diceCount: 2, die: 8, addMod: true, hit: "auto" })]);
    const o = option(c);
    expect(o.spellDamage).toBeNull();
    expect(o.heal).toMatchObject({ dice: "2d8", bonus: 4 });
    expect(homebrewHealing(c, c.spells[0] as any, 3)).toMatchObject({ dice: "4d8" });
  });

  test("a spell that lasts starts a timer; concentration and duration come from the form", () => {
    const c = wizard([lance({ duration: "1 minute", concentration: true })]);
    const o = option(c);
    expect(o).toMatchObject({ lastsRounds: 10, concentration: true });
    const after = { ...c, ...optionPatch(o) } as Character;
    expect(after.activeBuffs?.[0]).toMatchObject({ spellId: "spell:ember lance", concentration: true, turnsRemaining: 10 });
    expect(endTurnPatch(after, spells).spellsUsedThisTurn).toEqual(["hb1"]);
  });

  test("the spell limit: off means always ready; on means it must be prepared like a book spell", () => {
    expect(option(wizard([lance()]))).toBeDefined();
    expect(preparableSpells(wizard([lance()]))).toEqual([]);
    const counted = wizard([lance({ counts: true })]);
    expect(option(counted)).toBeUndefined();
    expect(preparableSpells(counted).map((s) => s.id)).toEqual(["hb1"]);
    expect(option({ ...counted, preparedSpells: ["hb1"] })).toBeDefined();
  });

  test("a homebrew spell with a book spell's name replaces it for this hero only", () => {
    const fake = homebrewRow("hb2", "Fireball", 3, "", { ...newHomebrew({ spellcastingAbility: "int" }), diceCount: 1, die: 4 });
    const list = withHomebrew(wizard([fake]), spells);
    expect(list.filter((s) => s.name === "Fireball")).toHaveLength(1);
    expect(option(wizard([fake]), "Fireball").spellDamage?.[0].dice).toBe("1d4");
    expect(withHomebrew(wizard([]), spells)).toBe(spells);
  });

  test("the spell reads like spell data: casting time, range, duration, save", () => {
    const row = lance({ castingTime: "bonus", range: "Touch", hit: "save", saveAbility: "WIS", duration: "10 minutes", concentration: true }, 2);
    expect(homebrewAsSrd(row as any)).toMatchObject({ castingTime: "1 bonus action", range: "Touch", duration: "Concentration, up to 10 minutes", saveType: "Wisdom", attackType: undefined });
    expect(homebrewRow("x", "  Spark ", 0, " Zap. ", newHomebrew({ spellcastingAbility: "" })).name).toBe("Spark");
    expect(newHomebrew({ spellcastingAbility: "" }).useSpellAttack).toBe(false);
  });
});
