// Turning catalog items into inventory rows, and the things a row can do:
// packs open into their items, coins are rows, and potions or pouches can be used.
import {
  COIN_IDS,
  findCatalogItem,
  formatCost,
  isConsumable,
  type CatalogItem,
  type CoinId,
  type ItemStack,
} from "@/data/item-catalog";
import type { Character } from "./storage";

export type InventoryRow = Character["inventory"][number];
export type Currency = Character["currency"];

const COIN_FIELD: Record<CoinId, keyof Currency> = {
  cp: "copper",
  sp: "silver",
  ep: "electrum",
  gp: "gold",
  pp: "platinum",
};

let idCounter = 0;
export function newRowId(): string {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : null;
  return uuid ?? `item-${Date.now()}-${idCounter++}-${Math.random().toString(36).slice(2, 7)}`;
}

function rowItemType(item: CatalogItem): NonNullable<InventoryRow["itemType"]> {
  if (item.type === "weapon") return "weapon";
  if (item.type === "armor" || item.type === "shield") return "armor";
  if (item.type === "coin") return "coin";
  if (item.tool?.kind === "instrument") return "instrument";
  if (isConsumable(item)) return "consumable";
  return "item";
}

/** One inventory row for a catalog item, with every stat the sheet reads filled in. */
export function rowFromCatalog(item: CatalogItem, quantity = 1, extra: Partial<InventoryRow> = {}): InventoryRow {
  const row: InventoryRow = {
    id: newRowId(),
    itemId: item.id,
    name: item.name,
    quantity,
    equipped: false,
    source: "srd",
    srdItemName: item.name,
    itemType: rowItemType(item),
    description: item.description,
    icon: item.icon,
    weight: item.weight,
    value: formatCost(item.cost),
  };
  if (item.weapon) {
    row.category = item.weapon.range;
    row.damageDice = item.weapon.damage?.dice ?? "";
    row.damageType = item.weapon.damage?.type ?? "";
    row.properties = item.weapon.properties.map((p) => p.toLowerCase());
    if (item.weapon.versatile) row.versatileDice = item.weapon.versatile;
    const range = item.weapon.rangeFt ?? item.weapon.throwFt;
    if (range) row.range = range;
  }
  if (item.armor) {
    row.armorType = item.armor.class;
    row.baseAC = item.armor.ac;
    row.maxDexBonus = item.armor.dexCap;
    row.stealthDisadvantage = item.armor.stealthDisadvantage;
    row.strengthRequirement = item.armor.strMin;
  }
  if (item.magic) {
    row.rarity = item.magic.rarity;
    row.attunement = item.magic.attunement;
  }
  if (row.itemType === "consumable") row.effect = item.description;
  if (item.charges) {
    row.uses = item.charges;
    row.maxUses = item.charges;
  }
  return { ...row, ...extra };
}

/**
 * Rows for `quantity` of an item. A pack becomes the items inside it, so an
 * explorer's pack adds a backpack, a bedroll, ten torches and so on.
 * Unknown names become a plain custom row so nothing the player was given is lost.
 */
export function expandToRows(idOrName: string, quantity = 1, extra: Partial<InventoryRow> = {}): InventoryRow[] {
  const item = findCatalogItem(idOrName);
  if (!item) {
    return [{ id: newRowId(), name: idOrName, quantity, equipped: false, source: "custom", itemType: "item", ...extra }];
  }
  if (item.type === "pack" && item.contents) {
    return item.contents.flatMap((c) => expandToRows(c.id, c.quantity * quantity, extra));
  }
  return [rowFromCatalog(item, quantity, extra)];
}

function canStack(row: InventoryRow): boolean {
  if (!row.itemId || row.contents?.length) return false;
  return row.itemType !== "weapon" && row.itemType !== "armor" && row.maxUses === undefined;
}

/** Adds rows, stacking each onto a matching row (same item, same grant group). */
export function addRows(inventory: InventoryRow[], rows: InventoryRow[]): InventoryRow[] {
  const next = [...inventory];
  for (const row of rows) {
    const match = canStack(row)
      ? next.findIndex(
          (r) =>
            canStack(r) &&
            r.itemId === row.itemId &&
            r.choiceGroupIndex === row.choiceGroupIndex &&
            !!r.isGranted === !!row.isGranted,
        )
      : -1;
    if (match >= 0) next[match] = { ...next[match], quantity: next[match].quantity + row.quantity };
    else next.push(row);
  }
  return next;
}

// ---------------------------------------------------------------------------
// Coins

export function isCoinRow(row: InventoryRow): boolean {
  return !!row.itemId && (COIN_IDS as string[]).includes(row.itemId);
}

/** Coin totals, read from the coin rows in the inventory. */
export function coinsFromInventory(inventory: InventoryRow[]): Currency {
  const totals: Currency = { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  for (const row of inventory) {
    if (!isCoinRow(row)) continue;
    totals[COIN_FIELD[row.itemId as CoinId]] += row.quantity || 0;
  }
  return totals;
}

export function coinRows(currency: Partial<Currency>): InventoryRow[] {
  const rows: InventoryRow[] = [];
  for (const id of COIN_IDS) {
    const amount = Math.max(0, Math.floor(currency[COIN_FIELD[id]] ?? 0));
    if (amount > 0) rows.push(rowFromCatalog(findCatalogItem(id)!, amount));
  }
  return rows;
}

/** Sets how many of one coin the character carries; all rows of that coin become one. */
export function setCoinAmount(inventory: InventoryRow[], coin: CoinId, amount: number): InventoryRow[] {
  const value = Math.max(0, Math.floor(amount || 0));
  const firstIndex = inventory.findIndex((r) => r.itemId === coin);
  const next: InventoryRow[] = [];
  inventory.forEach((row, index) => {
    if (row.itemId !== coin) next.push(row);
    else if (index === firstIndex && value > 0) next.push({ ...row, quantity: value });
  });
  if (firstIndex === -1 && value > 0) next.push(rowFromCatalog(findCatalogItem(coin)!, value));
  return next;
}

export const COIN_BY_FIELD: Record<keyof Currency, CoinId> = {
  copper: "cp",
  silver: "sp",
  electrum: "ep",
  gold: "gp",
  platinum: "pp",
};

// ---------------------------------------------------------------------------
// Using items

export type UseResult =
  | { kind: "heal"; rolled: number; healed: number }
  | { kind: "open"; taken: ItemStack[] }
  | { kind: "consume"; usesLeft: number | null };

export function getRowUse(row: InventoryRow): "heal" | "open" | "consume" | null {
  if (row.contents && row.contents.length > 0) return "open";
  const item = findCatalogItem(row.itemId ?? row.srdItemName ?? row.name);
  if (!item?.use) return null;
  if (item.use.action === "open") return null; // nothing inside any more
  return item.use.action;
}

/** Rolls "2d4+2" style dice. `random` returns [0, 1). */
export function rollDice(expr: string, random: () => number = Math.random): number {
  const m = expr.replace(/\s+/g, "").match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return Number.parseInt(expr, 10) || 0;
  const count = Number(m[1] || 1);
  const sides = Number(m[2]);
  let total = Number(m[3] || 0);
  for (let i = 0; i < count; i++) total += 1 + Math.floor(random() * sides);
  return total;
}

function spendOne(inventory: InventoryRow[], row: InventoryRow): InventoryRow[] {
  if (row.maxUses !== undefined && row.uses !== undefined) {
    const uses = row.uses - 1;
    return uses <= 0 ? inventory.filter((r) => r.id !== row.id) : inventory.map((r) => (r.id === row.id ? { ...r, uses } : r));
  }
  const quantity = (row.quantity || 1) - 1;
  return quantity <= 0
    ? inventory.filter((r) => r.id !== row.id)
    : inventory.map((r) => (r.id === row.id ? { ...r, quantity } : r));
}

/**
 * Uses one item: a healing potion heals and is used up, a pouch gives what is
 * inside it, anything else used up loses one. Returns the character patch.
 */
export function applyItemUse(
  character: Pick<Character, "inventory" | "currentHp" | "maxHp" | "effectiveMaxHp">,
  rowId: string,
  random: () => number = Math.random,
): { patch: Partial<Character>; result: UseResult } | null {
  const row = character.inventory.find((r) => r.id === rowId);
  if (!row) return null;
  const action = getRowUse(row);
  if (action === "open") {
    const taken = row.contents ?? [];
    const emptied = character.inventory.map((r) => (r.id === row.id ? { ...r, contents: [] } : r));
    const added = taken.flatMap((s) => expandToRows(s.id, s.quantity));
    return { patch: { inventory: addRows(emptied, added) }, result: { kind: "open", taken } };
  }
  if (action === "heal") {
    const item = findCatalogItem(row.itemId ?? row.srdItemName ?? row.name)!;
    const dice = item.use?.action === "heal" ? item.use.dice : "0";
    const rolled = rollDice(dice, random);
    const max = character.effectiveMaxHp ?? character.maxHp;
    const currentHp = Math.min(max, (character.currentHp || 0) + rolled);
    return {
      patch: { inventory: spendOne(character.inventory, row), currentHp },
      result: { kind: "heal", rolled, healed: currentHp - (character.currentHp || 0) },
    };
  }
  if (action === "consume") {
    const inventory = spendOne(character.inventory, row);
    const after = inventory.find((r) => r.id === row.id);
    const usesLeft = after ? (after.maxUses !== undefined ? after.uses ?? 0 : after.quantity) : 0;
    return { patch: { inventory }, result: { kind: "consume", usesLeft } };
  }
  return null;
}

/** Plain-text description of a row: the catalog text, or the old JSON blob some saves carry. */
export function rowInfo(row: InventoryRow): Record<string, any> {
  const raw = row.description || "";
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // fall through to plain text
    }
  }
  const item = findCatalogItem(row.itemId ?? row.srdItemName ?? row.name);
  return { description: raw || item?.description || "", icon: row.icon || item?.icon };
}

// ---------------------------------------------------------------------------
// Background gear

type BackgroundGearLine = { id: string; quantity?: number; contents?: ItemStack[] } | { choice: string; label: string };

/** Rows for one background gear line. A choice becomes a row the player replaces with their pick. */
export function backgroundGearRows(line: BackgroundGearLine, grantedFrom: string): InventoryRow[] {
  const extra = { isGranted: true, grantedFrom };
  if ("choice" in line) {
    return [{ id: newRowId(), name: line.label, quantity: 1, equipped: false, source: "custom", itemType: "item", ...extra }];
  }
  const rows = expandToRows(line.id, line.quantity ?? 1, extra);
  if (line.contents && rows.length === 1) rows[0] = { ...rows[0], contents: line.contents };
  return rows;
}

/** "Pouch (15 gp)", "Stick of incense ×5", or the choice label. */
export function backgroundGearLabel(
  line: BackgroundGearLine,
  nameOf: (id: string) => string = (id) => findCatalogItem(id)?.name ?? id,
): string {
  if ("choice" in line) return line.label;
  const name = nameOf(line.id);
  const inside = line.contents?.map((c) => (findCatalogItem(c.id)?.type === "coin" ? `${c.quantity} ${c.id}` : `${nameOf(c.id)} ×${c.quantity}`));
  if (inside?.length) return `${name} (${inside.join(", ")})`;
  if (findCatalogItem(line.id)?.type === "coin") return `${line.quantity ?? 1} ${line.id}`;
  return line.quantity && line.quantity > 1 ? `${name} ×${line.quantity}` : name;
}

// ---------------------------------------------------------------------------
// Equipping: two hands, one body

type Hand = "main" | "off" | "both";

function handling(row: InventoryRow): "two-handed" | "one-hand" {
  const props = row.properties ?? [];
  return props.includes("two-handed") ? "two-handed" : "one-hand";
}

const isShield = (r: InventoryRow) => r.itemType === "armor" && r.armorType === "shield";
const isBodyArmor = (r: InventoryRow) => r.itemType === "armor" && r.armorType !== "shield";

/**
 * Equips one row and takes off whatever it pushes out. A shield needs the off
 * hand, a two-handed weapon needs both, and a new weapon in a full main hand
 * replaces the old one. Returns the names of what was taken off.
 */
export function equipRow(inventory: InventoryRow[], id: string): { inventory: InventoryRow[]; removed: string[] } {
  const row = inventory.find((r) => r.id === id);
  if (!row || row.equipped) return { inventory, removed: [] };
  const off = new Set<string>();
  let hand: Hand | undefined;

  const held = inventory.filter((r) => r.equipped && r.id !== id);
  const inHand = (h: Hand) => held.find((r) => r.itemType === "weapon" && r.hand === h);

  if (isBodyArmor(row)) {
    held.filter(isBodyArmor).forEach((r) => off.add(r.id));
  } else if (isShield(row)) {
    held.filter(isShield).forEach((r) => off.add(r.id));
    const both = inHand("both");
    const offHand = inHand("off");
    if (both) off.add(both.id);
    if (offHand) off.add(offHand.id);
  } else if (row.itemType === "weapon") {
    if (handling(row) === "two-handed") {
      hand = "both";
      held.filter((r) => r.itemType === "weapon" || isShield(r)).forEach((r) => off.add(r.id));
    } else {
      const both = inHand("both");
      const main = inHand("main");
      const offHand = inHand("off");
      const shield = held.some(isShield);
      if (both) {
        off.add(both.id);
        hand = "main";
      } else if (!main) {
        hand = "main";
      } else if (!offHand && !shield) {
        hand = "off";
      } else {
        off.add(main.id);
        hand = "main";
      }
    }
  }

  const next = inventory.map((r) => {
    if (r.id === id) return { ...r, equipped: true, hand };
    if (off.has(r.id)) return { ...r, equipped: false, hand: undefined };
    return r;
  });
  return { inventory: next, removed: inventory.filter((r) => off.has(r.id)).map((r) => r.name) };
}
