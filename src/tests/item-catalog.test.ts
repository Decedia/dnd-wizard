// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { COIN_IDS, findCatalogItem, findLocalizedItem, getCatalog } from "@/data/item-catalog";
import { backgroundsData } from "@/data/backgrounds";
import classesData from "@/data/en/2014_classes.json";
import {
  addRows,
  applyItemUse,
  backgroundGearLabel,
  coinsFromInventory,
  expandToRows,
  getRowUse,
  setCoinAmount,
} from "@/lib/inventory";
import { applyBackground } from "@/lib/character-creation";
import { computeEquippedEffects, createEmptyCharacter, migrateCoins, type Character } from "@/lib/storage";
import { getStaticArmors, getStaticWeapons } from "@/lib/srd-client";

const make = (patch: Partial<Character> = {}): Character =>
  ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", class: "Fighter", level: 1, str: 10, dex: 14, con: 12, int: 10, wis: 12, cha: 10, ...patch }) as Character;

// Placeholders the class picker turns into a choice, not catalog items.
const CHOICE_NAMES = new Set(["Arcane Focus", "Musical Instrument"]);

describe("item catalog", () => {
  const catalog = getCatalog();

  test("ids are unique and every pack item exists", () => {
    const ids = catalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of catalog) {
      for (const c of item.contents ?? []) expect(findCatalogItem(c.id)).toBeDefined();
    }
  });

  test("the SRD weapons and armor are all here with their stats", () => {
    expect(getStaticWeapons().length).toBe(37);
    expect(getStaticArmors().length).toBe(13);
    const longbow = findCatalogItem("Longbow")!;
    expect(longbow.weapon?.damage).toEqual({ dice: "1d8", type: "Piercing" });
    expect(longbow.weapon?.rangeFt).toEqual({ normal: 150, long: 600 });
    expect(findCatalogItem("Shield")!.armor).toMatchObject({ class: "shield", ac: 2 });
    expect(findCatalogItem("Half Plate Armor")!.armor).toMatchObject({ ac: 15, dexCap: 2 });
    expect(findCatalogItem("Chain Mail")!.armor).toMatchObject({ ac: 16, dexCap: 0, strMin: 13 });
  });

  test("every class starting item resolves", () => {
    const classes = (Array.isArray(classesData) ? classesData : (classesData as any).classes) as any[];
    const missing: string[] = [];
    for (const cls of classes) {
      for (const group of cls.startingEquipment ?? []) {
        for (const item of group.items ?? []) {
          if (!CHOICE_NAMES.has(item.name) && !findCatalogItem(item.name)) missing.push(`${cls.name}: ${item.name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test("five coins, 50 to the pound", () => {
    for (const id of COIN_IDS) {
      const coin = findCatalogItem(id)!;
      expect(coin.type).toBe("coin");
      expect(coin.weight * 50).toBeCloseTo(1);
    }
  });

  test("Indonesian keeps English stats and swaps text", () => {
    const en = findCatalogItem("gp")!;
    const id = findLocalizedItem("gp", "id")!;
    expect(id.name).toBe("Keping emas");
    expect(id.coin).toEqual(en.coin);
    expect(id.weight).toBe(en.weight);
  });
});

describe("packs open into their items", () => {
  test("explorer's pack adds each item, with its count", () => {
    const rows = expandToRows("Explorer's Pack");
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.quantity]));
    expect(rows.some((r) => r.name === "Explorer's Pack")).toBe(false);
    expect(byName["Backpack"]).toBe(1);
    expect(byName["Torch"]).toBe(10);
    expect(byName["Rations (1 day)"]).toBe(10);
    expect(byName["Rope, hempen (50 feet)"]).toBe(1);
  });

  test("weapon rows carry their stats so attacks work", () => {
    const [row] = expandToRows("Crossbow, light");
    expect(row).toMatchObject({ itemType: "weapon", category: "ranged", damageDice: "1d8", damageType: "Piercing" });
    const [armor] = expandToRows("Chain Mail");
    const fighter = make({ inventory: [{ ...armor, equipped: true }] });
    expect(computeEquippedEffects(fighter).ac).toBe(16);
  });

  test("the same gear stacks, separate choice groups do not", () => {
    const a = expandToRows("Torch", 2);
    const b = expandToRows("Torch", 3);
    expect(addRows(a, b)).toHaveLength(1);
    expect(addRows(a, b)[0].quantity).toBe(5);
    const c = expandToRows("Torch", 1, { choiceGroupIndex: 2 });
    expect(addRows(a, c)).toHaveLength(2);
  });

  test("an unknown name is kept as a custom row", () => {
    const [row] = expandToRows("Mysterious locket");
    expect(row).toMatchObject({ source: "custom", name: "Mysterious locket" });
  });
});

describe("background gear", () => {
  test("every background item resolves", () => {
    for (const bg of backgroundsData) {
      for (const line of bg.equipment) {
        if ("choice" in line) continue;
        expect(findCatalogItem(line.id)).toBeDefined();
        for (const c of line.contents ?? []) expect(findCatalogItem(c.id)).toBeDefined();
      }
    }
  });

  test("acolyte gets a pouch of 15 gp that opens into coins", () => {
    const start = make({ background: "" });
    const patch = applyBackground(start, "Acolyte");
    const pouch = patch.inventory!.find((r) => r.itemId === "pouch")!;
    expect(pouch.contents).toEqual([{ id: "gp", quantity: 15 }]);
    expect(patch.inventory!.find((r) => r.itemId === "stick-of-incense")!.quantity).toBe(5);
    expect(coinsFromInventory(patch.inventory!).gold).toBe(0);

    const character = make({ ...patch });
    expect(getRowUse(pouch)).toBe("open");
    const used = applyItemUse(character, pouch.id)!;
    expect(used.result).toEqual({ kind: "open", taken: [{ id: "gp", quantity: 15 }] });
    expect(coinsFromInventory(used.patch.inventory!).gold).toBe(15);
    const emptied = used.patch.inventory!.find((r) => r.id === pouch.id)!;
    expect(getRowUse(emptied)).toBeNull();
  });

  test("hermit gets 5 gp as coins straight away", () => {
    const patch = applyBackground(make(), "Hermit");
    expect(coinsFromInventory(patch.inventory!).gold).toBe(5);
  });

  test("switching background swaps the gear, picking it again does not double it", () => {
    const acolyte = make({ ...applyBackground(make(), "Acolyte") });
    const again = applyBackground(acolyte, "Acolyte");
    expect(again.inventory!.length).toBe(acolyte.inventory.length);
    const sage = applyBackground(acolyte, "Sage");
    expect(sage.inventory!.some((r) => r.itemId === "prayer-book")).toBe(false);
    expect(sage.inventory!.some((r) => r.itemId === "ink-pen")).toBe(true);
  });

  test("labels read like the book", () => {
    expect(backgroundGearLabel({ id: "pouch", contents: [{ id: "gp", quantity: 15 }] })).toBe("Pouch (15 gp)");
    expect(backgroundGearLabel({ id: "stick-of-incense", quantity: 5 })).toBe("Stick of incense ×5");
  });
});

describe("using items", () => {
  test("a potion of healing heals 2d4+2, capped at max HP, and is used up", () => {
    const [potion] = expandToRows("Potion of Healing", 2);
    const hurt = make({ inventory: [potion], currentHp: 3, maxHp: 20 });
    // random 0.99 rolls a 4 on each d4: 4 + 4 + 2 = 10
    const used = applyItemUse(hurt, potion.id, () => 0.99)!;
    expect(used.result).toEqual({ kind: "heal", rolled: 10, healed: 10 });
    expect(used.patch.currentHp).toBe(13);
    expect(used.patch.inventory![0].quantity).toBe(1);

    const almostFull = make({ inventory: [potion], currentHp: 18, maxHp: 20 });
    expect(applyItemUse(almostFull, potion.id, () => 0.99)!.patch.currentHp).toBe(20);
  });

  test("the last potion leaves the inventory", () => {
    const [potion] = expandToRows("Potion of Healing", 1);
    const used = applyItemUse(make({ inventory: [potion], currentHp: 1, maxHp: 10 }), potion.id, () => 0)!;
    expect(used.patch.inventory).toEqual([]);
  });

  test("a healer's kit spends one of its ten uses", () => {
    const [kit] = expandToRows("Healer's Kit");
    expect(kit).toMatchObject({ uses: 10, maxUses: 10 });
    const used = applyItemUse(make({ inventory: [kit] }), kit.id)!;
    expect(used.result).toEqual({ kind: "consume", usesLeft: 9 });
  });

  test("a sword cannot be used", () => {
    const [sword] = expandToRows("Longsword");
    expect(getRowUse(sword)).toBeNull();
  });
});

describe("coins are inventory rows", () => {
  test("setting a coin edits its row", () => {
    let inv = setCoinAmount([], "gp", 12);
    expect(inv).toHaveLength(1);
    expect(coinsFromInventory(inv).gold).toBe(12);
    inv = setCoinAmount(inv, "gp", 0);
    expect(inv).toHaveLength(0);
  });

  test("old saves move their coin numbers into rows once", () => {
    const old = make({ inventory: [], currency: { copper: 3, silver: 0, electrum: 0, gold: 20, platinum: 1 } });
    delete (old as any).coinsInInventory;
    const first = migrateCoins(old);
    expect(first.inventory.map((r) => [r.itemId, r.quantity])).toEqual([["cp", 3], ["gp", 20], ["pp", 1]]);
    expect(first.currency.gold).toBe(20);
    const second = migrateCoins({ ...old, ...first });
    expect(second.inventory).toHaveLength(3);
  });

  test("old rows get their catalog id", () => {
    const old = make({ inventory: [{ id: "x", name: "Potion of Healing", quantity: 1, equipped: false, source: "srd" }] });
    delete (old as any).coinsInInventory;
    expect(migrateCoins(old).inventory[0].itemId).toBe("potion-of-healing-common");
  });
});
