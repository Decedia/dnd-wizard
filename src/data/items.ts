import mundaneDataEn from "./en/2014_items_mundane.json";

export type MundaneItemType = "weapon" | "armor" | "tool" | "gear" | "consumable" | "pack" | "mount";
export type ItemSlot = "none" | "armor" | "off-hand" | "mount" | "quiver";
export type Handedness = "light" | "one-handed" | "versatile" | "two-handed";

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

const MUNDANE_ITEMS: MundaneItem[] = (mundaneDataEn as { items: MundaneItem[] }).items;

let byIndex: Map<string, MundaneItem> | null = null;

function indexItems(): Map<string, MundaneItem> {
  if (!byIndex) {
    byIndex = new Map(MUNDANE_ITEMS.map((item) => [item.index, item]));
  }
  return byIndex;
}

export function getMundaneItem(indexOrName: string): MundaneItem | undefined {
  const wanted = indexOrName.trim().toLowerCase();
  return (
    indexItems().get(wanted) ??
    MUNDANE_ITEMS.find(
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
