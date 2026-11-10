// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { equipRow, rowFromCatalog, type InventoryRow } from "@/lib/inventory";
import { findCatalogItem } from "@/data/item-catalog";
import { createEmptyCharacter, type Character } from "@/lib/storage";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";
import { applyFeatGrants, featAbilityIncreases } from "@/lib/feat-grants";

const item = (id: string): InventoryRow => ({ ...rowFromCatalog(findCatalogItem(id)!), id });

describe("rage damage", () => {
  const barbarian = (over: Partial<Character> = {}) => ({
    ...createEmptyCharacter(), class: "Barbarian", level: 5, str: 16, dex: 14, rageDamage: 2,
    inventory: equipRow([item("greataxe"), item("dagger")], "greataxe", "both").inventory, ...over,
  }) as Character;

  test("is added to Strength weapon damage only while raging", () => {
    expect(getWeaponAttackDetails(barbarian(), { id: "greataxe" } as any)!.damageBonus).toBe(3);
    expect(getWeaponAttackDetails(barbarian({ activeStates: ["raging"] }), { id: "greataxe" } as any)!.damageBonus).toBe(5);
  });

  test("is never added to a Dexterity attack", () => {
    const c = barbarian({ str: 10, dex: 16, activeStates: ["raging"] });
    expect(getWeaponAttackDetails(c, { id: "dagger" } as any)!.rageBonus).toBe(0);
  });
});

describe("feat ability increases", () => {
  test("fixed and picked +1s are counted once", () => {
    expect(featAbilityIncreases("Resilient", { ability: "con" })).toEqual({ con: 1 });
    expect(featAbilityIncreases("Alert")).toEqual({});
    const c = applyFeatGrants({ ...createEmptyCharacter(), con: 15 } as Character, "Resilient", { ability: "con" });
    expect(c.con).toBe(16);
  });
});
