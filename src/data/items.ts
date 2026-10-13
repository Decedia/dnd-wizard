import mundaneDataEn from "./en/2014_items_mundane.json";
import magicDataEn from "./en/2014_items_magic.json";

export type MundaneItemType = "weapon" | "armor" | "tool" | "gear" | "consumable" | "pack" | "mount";
export type MagicItemType = "wondrous" | "armor" | "weapon" | "consumable";
export type ItemSlot = "none" | "armor" | "off-hand" | "mount" | "quiver";
export type Handedness = "light" | "one-handed" | "versatile" | "two-handed";
export type Rarity = "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact" | "varies";

export interface MundaneItemDamage {
  dice: string;
  type: string;
  twoHanded?: string;
}

export interface MundaneItemArmorClass {
  base: number;
  maxDex: number | null;
  shield: boolean;
}

export interface MundaneItemPackContents {
  name: string;
  quantity: number;
}

export interface MundaneItem {
  index: string;
  name: string;
  type: MundaneItemType;
  slot: ItemSlot;
  cost: { quantity: number; unit: string } | null;
  weight: number;
  // weapon
  damage?: MundaneItemDamage;
  properties?: string[];
  handedness?: Handedness;
  training?: "simple" | "martial";
  range?: "melee" | "ranged";
  ammunition?: boolean;
  usesAmmo?: boolean;

  // armor
  armorClass?: MundaneItemArmorClass;
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;
  weightClass?: string;

  // packs and stacking
  pack?: { contents: MundaneItemPackContents[] };
  stackable?: number | false;
  proficiency?: "tool";

  description: string;
  source: string;
}

export interface MagicItem {
  index: string;
  name: string;
  type: MagicItemType;
  slot: ItemSlot;
  rarity: Rarity;
  attunement: boolean;
  stackable?: number;
  cost: { quantity: number; unit: string } | null;
  weight: number;
  description: string;
  source: string;
}

const MUNDANE_ITEMS: MundaneItem[] = (mundaneDataEn as { items: MundaneItem[] }).items;
const MAGIC_ITEMS: MagicItem[] = (magicDataEn as { items: MagicItem[] }).items;

let byIndex: Map<string, MundaneItem | MagicItem> | null = null;

function indexItems(): Map<string, MundaneItem | MagicItem> {
  if (!byIndex) {
    byIndex = new Map<string, MundaneItem | MagicItem>();
    for (const item of MUNDANE_ITEMS) byIndex.set(item.index, item);
    for (const item of MAGIC_ITEMS) byIndex.set(item.index, item);
  }
  return byIndex;
}

export function isMagicItem(item: MundaneItem | MagicItem): item is MagicItem {
  return "rarity" in item;
}

export function getMagicItem(indexOrName: string): MagicItem | undefined {
  const wanted = indexOrName.trim().toLowerCase();
  return (
    MAGIC_ITEMS.find((item) => item.index === wanted) ??
    MAGIC_ITEMS.find((item) => item.name.trim().toLowerCase() === wanted)
  );
}

export function getMagicItems(rarity?: Rarity): MagicItem[] {
  return rarity ? MAGIC_ITEMS.filter((item) => item.rarity === rarity) : MAGIC_ITEMS;
}

export function getMundaneItem(indexOrName: string): MundaneItem | MagicItem | undefined {
  const wanted = indexOrName.trim().toLowerCase();
  return (
    indexItems().get(wanted) ??
    [...MUNDANE_ITEMS, ...MAGIC_ITEMS].find(
      (item) => item.name.trim().toLowerCase() === wanted || item.index === wanted,
    )
  );
}

export function getMundaneItems(type?: MundaneItemType): MundaneItem[] {
  return type ? MUNDANE_ITEMS.filter((item) => item.type === type) : MUNDANE_ITEMS;
}

export const MUNDANE_ITEM_TYPES: { key: MundaneItemType; labelKey: string }[] = [
  { key: "weapon", labelKey: "items.type.weapon" },
  { key: "armor", labelKey: "items.type.armor" },
  { key: "tool", labelKey: "items.type.tool" },
  { key: "gear", labelKey: "items.type.gear" },
  { key: "consumable", labelKey: "items.type.consumable" },
  { key: "pack", labelKey: "items.type.pack" },
  { key: "mount", labelKey: "items.type.mount" },
];

/** Carrying capacity, in pounds. 5e: STR x 15. */
export function carryingCapacity(strength: number): number {
  return Math.max(0, strength) * 15;
}

export function totalWeight(items: { name: string; quantity: number }[]): number {
  return items.reduce((sum, item) => {
    const record = getMundaneItem(item.name);
    return sum + (record ? record.weight * item.quantity : 0);
  }, 0);
}

/** Magic items are lighter than the mundane gear they replace. */
export const MAGIC_ITEM_TYPES: { key: MagicItemType; labelKey: string }[] = [
  { key: "wondrous", labelKey: "items.type.wondrous" },
  { key: "armor", labelKey: "items.type.armor" },
  { key: "weapon", labelKey: "items.type.weapon" },
  { key: "consumable", labelKey: "items.type.consumable" },
];

export const RARITIES: { key: Rarity; labelKey: string }[] = [
  { key: "common", labelKey: "items.rarity.common" },
  { key: "uncommon", labelKey: "items.rarity.uncommon" },
  { key: "rare", labelKey: "items.rarity.rare" },
  { key: "very rare", labelKey: "items.rarity.veryRare" },
  { key: "legendary", labelKey: "items.rarity.legendary" },
  { key: "artifact", labelKey: "items.rarity.artifact" },
  { key: "varies", labelKey: "items.rarity.varies" },
];
