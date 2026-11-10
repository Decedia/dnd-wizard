// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { beastsFor, wildShapeLimits } from "@/data/wild-shapes";
import { buildTurnMenu, critDamage, leaveShapePatch, optionPatch, smiteChoices, smitePatch, swingPatch, swingResultPatch, swingsLeft, wildDamagePatch, wildShapePatch } from "@/lib/turn";
import { longRestPatch } from "@/lib/rest";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  maxHp: 40,
  currentHp: 40,
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "class" })) as Character["features"],
});
const apply = (c: Character, patch: Partial<Character>) => ({ ...c, ...patch }) as Character;

describe("swings", () => {
  const paladin = make({ class: "Paladin", level: 5, str: 16, spellSlots: { 1: 4, 2: 2 }, spellSlotsExpended: { 1: 3 } }, ["Divine Smite", "Extra Attack"]);

  test("the first swing takes the action, the Extra Attack swing does not", () => {
    const menu = buildTurnMenu(paladin, []);
    const fist = menu.options.find((o) => o.key === "attack:unarmed")!;
    let c = apply(paladin, swingPatch(paladin, fist));
    expect(c.actionUsed).toBe(true);
    expect(swingsLeft(c, menu.attacksPerAction)).toBe(1);
    c = apply(c, swingResultPatch(c, 0, "hit"));
    const second = swingPatch(c, fist);
    expect(second.actionUsed).toBeUndefined();
    c = apply(c, second);
    expect(swingsLeft(c, menu.attacksPerAction)).toBe(0);
    expect(c.swings!.map((s) => s.result)).toEqual(["hit", "pending"]);
  });

  test("smite: 2d8 at level 1, +1d8 per level, doubled on a crit, spends the slot", () => {
    expect(smiteChoices(paladin, false)).toEqual([{ level: 1, dice: "2d8" }, { level: 2, dice: "3d8" }]);
    expect(smiteChoices(paladin, true).map((c) => c.dice)).toEqual(["4d8", "6d8"]);
    const c = apply(paladin, { swings: [{ key: "attack:unarmed", name: "", result: "hit" }] });
    const patch = smitePatch(c, 0, 2);
    expect(patch.spellSlotsExpended).toEqual({ 1: 3, 2: 1 });
    expect(patch.swings![0].smite).toBe(2);
    expect(smiteChoices(make({ class: "Fighter", spellSlots: { 1: 2 } }), false)).toEqual([]);
  });

  test("a crit doubles the dice, not the bonus", () => {
    expect(critDamage("1d8 + 3 slashing damage")).toBe("2d8 + 3 slashing damage");
    expect(critDamage("2d6 + 4 piercing plus 1d10 poison")).toBe("4d6 + 4 piercing plus 2d10 poison");
  });

  test("Action Surge starts a new count of swings", () => {
    const fighter = make({ class: "Fighter", level: 2, actionSurgeUses: 1, maxActionSurgeUses: 1, actionUsed: true, swings: [{ key: "attack:unarmed", name: "", result: "miss" }] }, ["Action Surge"]);
    const surge = buildTurnMenu(fighter, []).options.find((o) => o.name === "Action Surge")!;
    expect(optionPatch(surge).swings).toEqual([]);
  });
});

describe("wild shape", () => {
  test("form limits by level and circle", () => {
    expect(wildShapeLimits({ level: 2, subclass: "Land", features: [] })).toEqual({ cr: 0.25, swim: false, fly: false });
    expect(wildShapeLimits({ level: 4, subclass: "Land", features: [] }).cr).toBe(0.5);
    expect(wildShapeLimits({ level: 2, subclass: "Circle of the Moon", features: [] }).cr).toBe(1);
    expect(wildShapeLimits({ level: 9, subclass: "Circle of the Moon", features: [] }).cr).toBe(3);
    const names = beastsFor({ level: 2, subclass: "Land", features: [] }).map((b) => b.name);
    expect(names).toContain("Wolf");
    expect(names).not.toContain("Constrictor Snake"); // swims: level 4
    expect(beastsFor({ level: 6, subclass: "Moon", features: [] }).map((b) => b.name)).not.toContain("Giant Eagle"); // flies: level 8
  });

  test("turning into a brown bear: its attacks, Multiattack, no spells; damage carries over at 0", () => {
    const druid = make({ class: "Druid", subclass: "Moon", level: 2, wildShapeUses: 2, maxWildShapeUses: 2, currentHp: 18, cantrips: [{ id: "c", name: "Produce Flame" }] as any }, ["Wild Shape", "Combat Wild Shape"]);
    const ws = buildTurnMenu(druid, []).options.find((o) => o.name === "Wild Shape")!;
    expect(ws.slot).toBe("bonus");
    const bear = beastsFor(druid).find((b) => b.name === "Brown Bear")!;
    let c = apply(druid, wildShapePatch(ws, bear));
    expect(c.wildShapeUses).toBe(1);
    expect(c.wildShape).toEqual({ form: "Brown Bear", hp: 34 });
    const menu = buildTurnMenu(c, []);
    expect(menu.attacksPerAction).toBe(2);
    expect(menu.options.filter((o) => o.group === "attack").map((o) => o.name)).toEqual(["Bite", "Claws"]);
    expect(menu.options.some((o) => o.group === "spell")).toBe(false);
    expect(menu.options.find((o) => o.name === "Wild Shape")!.blocked).toBe("shaped");
    c = apply(c, wildDamagePatch(c, 30).patch);
    expect(c.wildShape!.hp).toBe(4);
    const drop = wildDamagePatch(c, 10);
    expect(drop.reverted).toBe(true);
    expect(drop.carried).toBe(6);
    c = apply(c, drop.patch);
    expect(c.wildShape).toBeUndefined();
    expect(c.currentHp).toBe(12);
  });

  test("changing back takes the bonus action on your turn; a long rest ends the form", () => {
    expect(leaveShapePatch({ turnActive: true })).toEqual({ wildShape: undefined, bonusActionUsed: true, swings: [] });
    expect(longRestPatch(make({ wildShape: { form: "Wolf", hp: 3 } })).wildShape).toBeUndefined();
  });
});
