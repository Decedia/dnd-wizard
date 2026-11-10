// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticSpells } from "@/lib/srd-client";
import { buildTurnMenu, endEncounterPatch, endTurnPatch, optionPatch, startTurnPatch } from "@/lib/turn";
import { endTimerPatch, roundsText, spellRounds, RAGE_TIMER } from "@/lib/timers";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const spells = getStaticSpells(undefined, "2014") as any[];
const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  maxHp: 40,
  currentHp: 40,
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "class" })) as Character["features"],
});
const apply = (c: Character, patch: Partial<Character>) => ({ ...c, ...patch }) as Character;
const use = (c: Character, name: string) => {
  const o = buildTurnMenu(c, spells).options.find((x) => x.name === name);
  if (!o) throw new Error(`no option ${name}`);
  return apply(c, optionPatch(o));
};
const endTurn = (c: Character) => apply(apply(c, endTurnPatch(c, spells)), startTurnPatch(c));

describe("timers", () => {
  test("Rage counts down 10 rounds and then ends the raging state", () => {
    let c = make({ class: "Barbarian", level: 3, rages: 3, maxRages: 3, turnActive: true }, ["Rage"]);
    c = use(c, "Rage");
    expect(c.activeStates).toContain("raging");
    expect(c.activeBuffs.find((b) => b.spellId === RAGE_TIMER)?.turnsRemaining).toBe(10);
    for (let i = 0; i < 9; i++) c = endTurn(c);
    expect(c.activeBuffs.find((b) => b.spellId === RAGE_TIMER)?.turnsRemaining).toBe(1);
    expect(c.activeStates).toContain("raging");
    c = endTurn(c);
    expect(c.activeBuffs.some((b) => b.spellId === RAGE_TIMER)).toBe(false);
    expect(c.activeStates || []).not.toContain("raging");
  });

  test("ending the fight or ending the timer by hand stops rage", () => {
    let c = use(make({ class: "Barbarian", level: 3, rages: 3, maxRages: 3, turnActive: true }, ["Rage"]), "Rage");
    expect(apply(c, endEncounterPatch(c)).activeBuffs.some((b) => b.spellId === RAGE_TIMER)).toBe(false);
    c = apply(c, endTimerPatch(c, RAGE_TIMER));
    expect(c.activeStates || []).not.toContain("raging");
  });

  const cleric = () => make({
    class: "Cleric", level: 5, wis: 16, turnActive: true,
    spells: [
      { id: "s1", name: "Bless", level: 1, source: "srd", srdSpellName: "Bless" },
      { id: "s2", name: "Spiritual Weapon", level: 2, source: "srd", srdSpellName: "Spiritual Weapon" },
      { id: "s3", name: "Shield of Faith", level: 1, source: "srd", srdSpellName: "Shield of Faith" },
    ] as Character["spells"],
    preparedSpells: ["s1", "s2", "s3"],
  });

  test("casting a spell from the turn panel starts its timer", () => {
    const c = use(cleric(), "Spiritual Weapon");
    expect(c.activeBuffs.find((b) => b.name === "Spiritual Weapon")).toMatchObject({ concentration: false, turnsRemaining: 10 });
  });

  test("a new concentration spell ends the old one, and the row says so", () => {
    let c = use(cleric(), "Bless");
    expect(c.activeBuffs.find((b) => b.name === "Bless")?.concentration).toBe(true);
    c = apply(c, { bonusActionUsed: false, actionUsed: false });
    const sof = buildTurnMenu(c, spells).options.find((o) => o.name === "Shield of Faith")!;
    expect(sof.endsConcentration).toBe("Bless");
    c = apply(c, optionPatch(sof));
    expect(c.activeBuffs.map((b) => b.name)).toEqual(["Shield of Faith"]);
    // Shield of Faith is a buff definition, so its AC bonus applies.
    expect(c.activeBuffs[0].spellId).toBe("shield-of-faith");
  });

  test("short and instant spells get no timer", () => {
    expect(spellRounds("Instantaneous", false)).toBeNull();
    expect(spellRounds("1 round", false)).toBeNull();
    expect(spellRounds("Concentration, up to 1 minute", true)).toBe(10);
    expect(roundsText(7)).toEqual({ unit: "rounds", n: 7 });
    expect(roundsText(95)).toEqual({ unit: "minutes", n: 10 });
    expect(roundsText(4800)).toEqual({ unit: "hours", n: 8 });
  });
});
