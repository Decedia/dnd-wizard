// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { getStaticSpells } from "@/lib/srd-client";
import { buildTurnMenu, endEncounterPatch, optionPatch } from "@/lib/turn";
import { concentratingOn, suggestPicks, type Situation } from "@/lib/turn-suggest";
import { createEmptyCharacter, type Character } from "@/lib/storage";
import { translations as enAll } from "@/locales/en";
import { translations as idAll } from "@/locales/id";

const en = enAll as Record<string, string>;
const id = idAll as Record<string, string>;

const spells = getStaticSpells(undefined, "2014") as any[];
const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  maxHp: 40,
  currentHp: 40,
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "class" })) as Character["features"],
});
const top = (c: Character, sit: Situation, slot: "action" | "bonus" | "reaction") => suggestPicks(c, buildTurnMenu(c, spells), spells, sit)[slot][0];

const wizard = (patch: Partial<Character> = {}) => make({
  class: "Wizard", level: 5, int: 16,
  spells: [
    { id: "s1", name: "Fireball", level: 3, source: "srd", srdSpellName: "Fireball" },
    { id: "s2", name: "Shield", level: 1, source: "srd", srdSpellName: "Shield" },
    { id: "s3", name: "Misty Step", level: 2, source: "srd", srdSpellName: "Misty Step" },
    { id: "s4", name: "Magic Missile", level: 1, source: "srd", srdSpellName: "Magic Missile" },
    { id: "s5", name: "Hold Person", level: 2, source: "srd", srdSpellName: "Hold Person" },
  ] as Character["spells"],
  cantrips: [{ id: "c1", name: "Fire Bolt" }] as Character["cantrips"],
  preparedSpells: ["s1", "s2", "s3", "s4", "s5"],
  spellSlots: { 1: 4, 2: 3, 3: 2 }, spellSlotsExpended: {},
  ...patch,
});

describe("suggestions", () => {
  test("a wizard at range uses a free cantrip; a group calls for Fireball", () => {
    expect(top(wizard(), {}, "action").option.name).toBe("Fire Bolt");
    expect(top(wizard(), { many: true }, "action").option.name).toBe("Fireball");
    expect(top(wizard(), { low: true }, "action").option.name).toBe("Magic Missile");
    expect(top(wizard(), {}, "reaction").option.name).toBe("Shield");
  });

  test("spell rows carry their school", () => {
    const menu = buildTurnMenu(wizard(), spells);
    const all = menu.options;
    expect(all.find((o) => o.name === "Fireball")?.school).toBe("Evocation");
    expect(all.find((o) => o.name === "Shield")?.school).toBe("Abjuration");
    expect(all.find((o) => o.name === "Misty Step")?.school).toBe("Conjuration");
  });

  test("a hurt wizard next to an enemy teleports away", () => {
    const pick = top(wizard({ currentHp: 10 }), { near: true }, "bonus");
    expect(pick.option.name).toBe("Misty Step");
    expect(pick.why).toBe("escape");
  });

  test("a second concentration spell is marked down", () => {
    const c = wizard({ spellsUsedThisTurn: ["s5"] });
    expect(concentratingOn(c, spells)).toBe("Hold Person");
    const picks = suggestPicks(c, buildTurnMenu(c, spells), spells, {}).action;
    expect(picks.find((p) => p.option.name === "Hold Person")?.why).toBe("breaksConc");
  });

  test("a barbarian rages first, then hits; rage damage counts only while raging", () => {
    const c = make({ class: "Barbarian", level: 5, str: 16, rages: 3, maxRages: 3, rageDamage: 2, inventory: [{ id: "ga", itemId: "greataxe", name: "Greataxe", quantity: 1, equipped: true, hand: "both", source: "srd", itemType: "weapon", category: "melee", damageDice: "1d12", damageType: "slashing", properties: ["Heavy", "Two-Handed"] }] as any, attacks: [{ id: "ga", name: "Greataxe", source: "weapon" }] as any }, ["Rage", "Extra Attack"]);
    const rage = top(c, { near: true }, "bonus");
    expect(rage.option.name).toBe("Rage");
    const axe = (ch: Character) => buildTurnMenu(ch, spells).options.find((o) => o.name === "Greataxe")!;
    expect(axe(c).damage).toContain("+ 3");
    const raging = { ...c, ...optionPatch(rage.option) } as Character;
    expect(raging.activeStates).toContain("raging");
    expect(axe(raging).damage).toContain("+ 5");
    expect(top(raging, { near: true }, "action").why).toBe("meleeExtra");
    expect(buildTurnMenu(raging, spells).options.find((o) => o.name === "Rage")!.blocked).toBe("raging");
    expect(endEncounterPatch(raging).activeStates).toEqual([]);
  });

  test("a hurt fighter takes Second Wind; a healthy one does not", () => {
    const c = make({ class: "Fighter", level: 2 }, ["Second Wind"]);
    expect(top({ ...c, currentHp: 10 }, {}, "bonus").why).toBe("healSelf");
    expect(top(c, {}, "bonus").why).toBe("healLater");
  });

  test("hurt and surrounded with nothing better: Dodge", () => {
    const c = make({ class: "Fighter", level: 1, currentHp: 5 });
    const picks = suggestPicks(c, buildTurnMenu(c, spells), spells, { near: true, many: true }).action;
    expect(picks.map((p) => p.option.key).slice(0, 2)).toContain("basic:dodge");
  });

  test("every reason has English and Indonesian text", () => {
    const src = readFileSync("src/lib/turn-suggest.ts", "utf8");
    const keys = [...src.matchAll(/\bp\((?:\d+|[^()]*\([^()]*\)[^(),]*), "(\w+)"/g)].map((m) => `turn.why.${m[1]}`);
    expect(keys.length).toBeGreaterThan(40);
    expect(keys.filter((k) => !en[k] || !id[k])).toEqual([]);
    for (const k of ["near", "nearHurt", "farMelee", "farRanged"]) expect(!!en[`turn.move.${k}`] && !!id[`turn.move.${k}`]).toBe(true);
  });
});

describe("class habits in Suggest mode", () => {
  const dagger = { inventory: [{ id: "dg", itemId: "dagger", name: "Dagger", quantity: 1, equipped: true, hand: "main", source: "srd", itemType: "weapon", category: "melee", damageDice: "1d4", damageType: "piercing", properties: ["Finesse", "Light", "Thrown"] }] as any, attacks: [{ id: "dg", name: "Dagger", source: "weapon" }] as any };
  test("a wizard next to an enemy does not stab with a dagger while a cantrip is ready", () => {
    const c = wizard({ ...dagger, cantrips: [{ id: "c1", name: "Shocking Grasp" }] as Character["cantrips"] });
    const pick = suggestPicks(c, buildTurnMenu(c, spells), spells, { near: true }).action;
    expect(pick[0].option.group).not.toBe("attack");
    expect(pick.find((p) => p.option.group === "attack")!.why).toBe("casterWeapon");
  });

  test("a warlock at range leads with Eldritch Blast", () => {
    const c = make({ class: "Warlock", level: 5, cha: 16, cantrips: [{ id: "eb", name: "Eldritch Blast" }, { id: "fb", name: "Fire Bolt" }] as Character["cantrips"] });
    const pick = top(c, {}, "action");
    expect([pick.option.name, pick.why]).toEqual(["Eldritch Blast", "eldritchBlast"]);
  });

  test("a rogue who attacked steps away with Cunning Action", () => {
    const c = make({ class: "Rogue", level: 3, dex: 16, ...dagger }, ["Cunning Action", "Sneak Attack"]);
    expect(top(c, { near: true }, "bonus")?.why).not.toBe("hitAndRun");
    const after = { ...c, attackedThisTurn: true, actionUsed: true };
    expect(top(after, { near: true }, "bonus").why).toBe("hitAndRun");
  });

  test("a Moon druid shapes first; another 2014 circle keeps to spells", () => {
    const moon = make({ class: "Druid", subclass: "Moon", level: 2, wildShapeUses: 2, maxWildShapeUses: 2 }, ["Wild Shape", "Combat Wild Shape"]);
    expect(top(moon, { near: true }, "bonus").why).toBe("wildShapeMoon");
    const land = make({ class: "Druid", subclass: "Land", level: 2, wildShapeUses: 2, maxWildShapeUses: 2 }, ["Wild Shape"]);
    const ws = suggestPicks(land, buildTurnMenu(land, spells), spells, { near: true }).action.find((p) => /^Wild Shape/.test(p.option.name))!;
    expect([ws.score, ws.why]).toEqual([30, "wildShapeSupport"]);
  });
});
