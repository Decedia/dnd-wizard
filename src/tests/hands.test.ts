// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { equipRow, handChoices, heldInHands, rowFromCatalog, weaponDamageDice, type InventoryRow } from "@/lib/inventory";
import { findCatalogItem } from "@/data/item-catalog";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { getStaticSpells } from "@/lib/srd-client";
import { buildTurnMenu, changeHands, handChangeCost, isSwingOption, startTurnPatch, swingPatch } from "@/lib/turn";

const item = (id: string, over: Partial<InventoryRow> = {}): InventoryRow => ({ ...rowFromCatalog(findCatalogItem(id)!), id, ...over });
const bag = () => [item("longsword"), item("shortsword"), item("dagger"), item("greatsword"), item("shield"), item("scimitar")];
const hands = (inv: InventoryRow[]) => {
  const h = heldInHands(inv);
  return { main: h.main?.id, off: h.off?.id, twoHanded: h.twoHanded };
};
const make = (inventory: InventoryRow[], over: Partial<Character> = {}): Character => {
  const c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", class: "Fighter", level: 3, str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10, maxHp: 28, currentHp: 28, inventory, ...over } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const apply = (c: Character, patch: Partial<Character>): Character => {
  const next = { ...c, ...patch } as Character;
  return { ...next, ...computeDerivedStats(next) } as Character;
};
const spells = getStaticSpells(undefined, "2014") as any[];

describe("choosing a hand", () => {
  test("which hands a weapon can go in", () => {
    expect(handChoices(item("dagger"))).toEqual(["main", "off"]);
    expect(handChoices(item("longsword"))).toEqual(["main", "off", "both"]);
    expect(handChoices(item("greatsword"))).toEqual(["both"]);
    expect(handChoices(item("shield"))).toEqual([]);
  });

  test("the chosen hand is used and only that hand is cleared", () => {
    let inv = equipRow(bag(), "shortsword", "off").inventory;
    expect(hands(inv)).toEqual({ main: undefined, off: "shortsword", twoHanded: false });
    inv = equipRow(inv, "dagger", "main").inventory;
    expect(hands(inv)).toEqual({ main: "dagger", off: "shortsword", twoHanded: false });
    const swap = equipRow(inv, "scimitar", "off");
    expect(hands(swap.inventory)).toEqual({ main: "dagger", off: "scimitar", twoHanded: false });
    expect(swap.removed).toEqual(["Shortsword"]);
  });

  test("an off-hand weapon pushes out a shield, and a shield pushes it back out", () => {
    let inv = equipRow(equipRow(bag(), "longsword", "main").inventory, "shield").inventory;
    expect(hands(inv).off).toBe("shield");
    inv = equipRow(inv, "dagger", "off").inventory;
    expect(hands(inv)).toEqual({ main: "longsword", off: "dagger", twoHanded: false });
    inv = equipRow(inv, "shield").inventory;
    expect(hands(inv)).toEqual({ main: "longsword", off: "shield", twoHanded: false });
  });

  test("a versatile weapon in both hands uses the bigger die and clears the other hand", () => {
    let inv = equipRow(equipRow(bag(), "longsword", "main").inventory, "shield").inventory;
    expect(weaponDamageDice(inv.find((r) => r.id === "longsword")!)).toBe("1d8");
    inv = equipRow(inv, "longsword", "both").inventory;
    expect(hands(inv)).toEqual({ main: "longsword", off: undefined, twoHanded: true });
    expect(weaponDamageDice(inv.find((r) => r.id === "longsword")!)).toBe("1d10");
    const c = make(inv);
    expect(c.attacks.find((a) => a.id === "longsword")?.damageType).toContain("1d10");
  });

  test("a two-handed weapon ignores a one-hand request", () => {
    const inv = equipRow(bag(), "greatsword", "off").inventory;
    expect(hands(inv)).toEqual({ main: "greatsword", off: undefined, twoHanded: true });
  });

  test("with no choice given the old automatic rule still holds", () => {
    let inv = equipRow(bag(), "longsword").inventory;
    inv = equipRow(inv, "dagger").inventory;
    expect(hands(inv)).toEqual({ main: "longsword", off: "dagger", twoHanded: false });
  });
});

describe("what a weapon change costs", () => {
  const inTurn = (inv: InventoryRow[], over: Partial<Character> = {}) => {
    const c = make(inv);
    return apply(c, { ...startTurnPatch(c), ...over });
  };

  test("outside a turn everything is free", () => {
    const c = make(equipRow(bag(), "longsword", "main").inventory);
    const { patch, cost } = changeHands(c, "greatsword", "both");
    expect(cost).toEqual({ interaction: false, action: false, blocked: false });
    expect(patch?.actionUsed).toBeUndefined();
  });

  test("drawing into an empty hand is the free interaction, once", () => {
    const c = inTurn(bag());
    const first = changeHands(c, "longsword", "main");
    expect(first.cost).toEqual({ interaction: true, action: false, blocked: false });
    const after = apply(c, first.patch!);
    expect(after.objectInteractionUsed).toBe(true);
    const second = changeHands(after, "dagger", "off");
    expect(second.cost).toEqual({ interaction: false, action: true, blocked: false });
    expect(apply(after, second.patch!).actionUsed).toBe(true);
  });

  test("stow and draw takes the free interaction and the action; drop and draw only the free one", () => {
    const c = inTurn(equipRow(bag(), "longsword", "main").inventory);
    expect(changeHands(c, "scimitar", "main").cost).toEqual({ interaction: true, action: true, blocked: false });
    expect(changeHands(c, "scimitar", "main", true).cost).toEqual({ interaction: true, action: false, blocked: false });
  });

  test("a swap that needs the action is blocked once the action is used", () => {
    const c = inTurn(equipRow(bag(), "longsword", "main").inventory, { actionUsed: true });
    const swap = changeHands(c, "scimitar", "main");
    expect(swap.cost.blocked).toBe(true);
    expect(swap.patch).toBeNull();
    expect(changeHands(c, "scimitar", "main", true).patch).not.toBeNull();
  });

  test("a shield takes the action; changing grip is free", () => {
    const c = inTurn(equipRow(bag(), "longsword", "main").inventory);
    expect(changeHands(c, "shield", "off").cost).toEqual({ interaction: false, action: true, blocked: false });
    expect(changeHands(c, "longsword", "both").cost).toEqual({ interaction: false, action: false, blocked: false });
  });

  test("two extra interactions cannot be paid in one turn", () => {
    let inv = equipRow(bag(), "longsword", "main").inventory;
    inv = equipRow(inv, "dagger", "off").inventory;
    const c = inTurn(inv);
    // Stow both (2) and draw the greatsword (1): one free, two would need two actions.
    expect(changeHands(c, "greatsword", "both").cost.blocked).toBe(true);
    // Dropping both leaves one draw: free.
    expect(changeHands(c, "greatsword", "both", true).cost).toEqual({ interaction: true, action: false, blocked: false });
  });

  test("a new turn gives the free interaction back", () => {
    const c = inTurn(bag(), { objectInteractionUsed: true });
    expect(startTurnPatch(c).objectInteractionUsed).toBe(false);
    expect(handChangeCost(c, bag(), equipRow(bag(), "dagger", "main").inventory).action).toBe(true);
  });
});

describe("off-hand attack", () => {
  const menuFor = (inv: InventoryRow[], over: Partial<Character> = {}) => buildTurnMenu(make(inv, over), spells);
  const offhand = (menu: ReturnType<typeof buildTurnMenu>) => menu.options.find((o) => o.key.startsWith("offhand:"));

  test("two light weapons give a bonus-action attack without the ability bonus", () => {
    const inv = equipRow(equipRow(bag(), "shortsword", "main").inventory, "dagger", "off").inventory;
    const o = offhand(menuFor(inv))!;
    expect(o.slot).toBe("bonus");
    expect(o.name).toBe("Dagger");
    expect(o.damage?.toLowerCase()).toBe("1d4 piercing damage");
  });

  test("a weapon that is not light gives none, unless the character has Dual Wielder", () => {
    const inv = equipRow(equipRow(bag(), "longsword", "main").inventory, "dagger", "off").inventory;
    expect(offhand(menuFor(inv))).toBeUndefined();
    expect(offhand(menuFor(inv, { features: [{ id: "f", name: "Dual Wielder", description: "" }] as any }))).toBeDefined();
  });

  test("it opens only after the Attack action, and closes on the next turn", () => {
    const inv = equipRow(equipRow(bag(), "shortsword", "main").inventory, "dagger", "off").inventory;
    let c = apply(make(inv), startTurnPatch(make(inv)));
    expect(offhand(buildTurnMenu(c, spells))!.blocked).toBe("attackFirst");
    const main = buildTurnMenu(c, spells).options.find((o) => isSwingOption(o) && o.name === "Shortsword")!;
    c = apply(c, swingPatch(c, main));
    expect(offhand(buildTurnMenu(c, spells))!.blocked).toBeUndefined();
    c = apply(c, startTurnPatch(c));
    expect(offhand(buildTurnMenu(c, spells))!.blocked).toBe("attackFirst");
  });

  test("a shield in the off hand gives none", () => {
    const inv = equipRow(equipRow(bag(), "shortsword", "main").inventory, "shield").inventory;
    expect(offhand(menuFor(inv))).toBeUndefined();
  });
});
