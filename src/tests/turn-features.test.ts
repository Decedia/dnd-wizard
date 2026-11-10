// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { FEATURE_RULES, featureUsesAfterRest, ruleFor, ruleKey } from "@/data/turn-features";
import { amountPatch, buildTurnMenu, optionPatch } from "@/lib/turn";
import { longRestPatch, shortRestPatch } from "@/lib/rest";
import { createEmptyCharacter, type Character } from "@/lib/storage";
import { allFeatureNames } from "./all-feature-names";

const make = (patch: Partial<Character>, features: string[]): Character => ({
  ...createEmptyCharacter(),
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: `${name} text`, source: "class" })) as Character["features"],
});
const option = (c: Character, name: string) => buildTurnMenu(c, []).options.find((o) => o.group === "feature" && o.name === name);

describe("turn feature table", () => {
  const names = allFeatureNames();

  test("every rule matches a feature that exists in the app", () => {
    const dead = FEATURE_RULES.filter((r) => !names.some((n) => r.name.test(n))).map(ruleKey);
    expect(dead).toEqual([]);
  });

  test("rules that count their own uses have distinct keys", () => {
    const keys = FEATURE_RULES.filter((r) => r.uses && !r.only).map(ruleKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("the slots a new player is most likely to get wrong", () => {
    const c = make({ class: "Paladin", level: 5 }, []);
    expect(ruleFor(c, "Rage")?.slot).toBe("bonus");
    expect(ruleFor(c, "Divine Sense")?.slot).toBe("action");
    expect(ruleFor(c, "Divine Smite")?.slot).toBe("free");
    expect(ruleFor(c, "Second Wind")?.slot).toBe("bonus");
    expect(ruleFor(c, "Action Surge")?.slot).toBe("free");
    expect(ruleFor(c, "Cunning Action")?.slot).toBe("bonus");
    expect(ruleFor(c, "Uncanny Dodge")?.slot).toBe("reaction");
    expect(ruleFor(c, "Unarmored Defense")).toBeUndefined();
  });
});

describe("features in the turn menu", () => {
  test("Rage is a bonus action and spends one rage", () => {
    const c = make({ class: "Barbarian", level: 3, rages: 3, maxRages: 3 }, ["Rage", "Unarmored Defense", "Reckless Attack"]);
    const rage = option(c, "Rage")!;
    expect(rage.slot).toBe("bonus");
    expect(optionPatch(rage)).toEqual({ rages: 2, activeStates: ["raging"], bonusActionUsed: true });
    expect(option({ ...c, rages: 0 }, "Rage")!.blocked).toBe("empty");
    // Free features take no slot; untabled ones stay in the reading list.
    expect(optionPatch(option(c, "Reckless Attack")!)).toEqual({});
    expect(buildTurnMenu(c, []).features.map((f) => f.name)).toEqual(["Unarmored Defense"]);
  });

  test("Second Wind counts its own use and a short rest gives it back", () => {
    const c = make({ class: "Fighter", level: 2, actionSurgeUses: 1, maxActionSurgeUses: 1 }, ["Second Wind", "Action Surge"]);
    const patch = optionPatch(option(c, "Second Wind")!);
    expect(patch.bonusActionUsed).toBe(true);
    const after = { ...c, ...patch } as Character;
    expect(option(after, "Second Wind")!.blocked).toBe("empty");
    expect(shortRestPatch(after).featureUses).toEqual({});
    expect(longRestPatch(after).featureUses).toEqual({});
  });

  test("Action Surge gives the action back, once it has been used", () => {
    const c = make({ class: "Fighter", level: 2, actionSurgeUses: 1, maxActionSurgeUses: 1 }, ["Action Surge"]);
    expect(option(c, "Action Surge")!.blocked).toBe("actionFirst");
    const surge = option({ ...c, actionUsed: true }, "Action Surge")!;
    expect(surge.blocked).toBeUndefined();
    expect(optionPatch(surge)).toEqual({ actionSurgeUses: 0, swings: [], actionUsed: false });
  });

  test("Divine Smite spends the lowest open slot and takes no action", () => {
    const c = make({ class: "Paladin", level: 5, spellSlots: { 1: 4, 2: 2 }, spellSlotsExpended: { 1: 4, 2: 0 } }, ["Divine Smite"]);
    expect(optionPatch(option(c, "Divine Smite")!)).toEqual({ spellSlotsExpended: { 1: 4, 2: 1 } });
    expect(option({ ...c, spellSlotsExpended: { 1: 4, 2: 2 } }, "Divine Smite")!.blocked).toBe("noSlot");
  });

  test("Lay on Hands spends the amount the player picks", () => {
    const c = make({ class: "Paladin", level: 5, layOnHandsPool: 25, maxLayOnHandsPool: 25 }, ["Lay on Hands"]);
    const lay = option(c, "Lay on Hands")!;
    expect(lay.amount).toEqual({ field: "layOnHandsPool", max: 25 });
    expect(amountPatch(c, lay, 7)).toEqual({ layOnHandsPool: 18, actionUsed: true });
    expect(amountPatch(c, lay, 99).layOnHandsPool).toBe(0);
  });

  test("Wild Shape is a bonus action for a Moon druid", () => {
    const c = make({ class: "Druid", level: 2, wildShapeUses: 2, maxWildShapeUses: 2 }, ["Wild Shape"]);
    expect(option(c, "Wild Shape")!.slot).toBe("action");
    expect(option(make({ ...c }, ["Wild Shape", "Combat Wild Shape"]), "Wild Shape")!.slot).toBe("bonus");
  });

  test("long-rest uses survive a short rest", () => {
    const longKey = ruleKey(FEATURE_RULES.find((r) => r.uses?.per === "long")!);
    const shortKey = ruleKey(FEATURE_RULES.find((r) => r.uses?.per === "short")!);
    expect(featureUsesAfterRest({ [longKey]: 1, [shortKey]: 1 }, "short")).toEqual({ [longKey]: 1 });
    expect(featureUsesAfterRest({ [longKey]: 1 }, "long")).toEqual({});
  });
});
