// The one item catalog: every weapon, armor, gear, tool, pack, coin and magic
// item lives in src/data/en/2014_item_catalog.json. The Indonesian file only
// carries names and descriptions, so stats can never drift between languages.
import catalogEn from "./en/2014_item_catalog.json";
import catalogIdOverlay from "./id/2014_item_catalog.json";

export type CatalogItemType =
  | "weapon"
  | "armor"
  | "shield"
  | "ammo"
  | "gear"
  | "tool"
  | "pack"
  | "container"
  | "consumable"
  | "coin"
  | "mount"
  | "vehicle"
  | "magic";

export type CoinId = "cp" | "sp" | "ep" | "gp" | "pp";
export const COIN_IDS: CoinId[] = ["cp", "sp", "ep", "gp", "pp"];

export interface ItemStack {
  id: string;
  quantity: number;
}

export type ItemUse =
  /** Roll the dice and regain that many hit points, then the item is used up. */
  | { action: "heal"; dice: string }
  /** Take out what is inside (coins in a pouch). The container stays. */
  | { action: "open" }
  /** Spend one; the description says what it does. */
  | { action: "consume" };

export interface CatalogItem {
  id: string;
  name: string;
  type: CatalogItemType;
  /** SRD category label, e.g. "Martial Melee", "Standard Gear", "Artisan's Tools". */
  category: string;
  cost: { quantity: number; unit: string } | null;
  /** Pounds, for one item (or for one bundle when `bundle` is set). */
  weight: number;
  /** Sold in bundles of this many (20 arrows for 1 gp). */
  bundle?: number;
  description: string;
  icon: string;
  source: string;
  weapon?: {
    class: "simple" | "martial";
    range: "melee" | "ranged";
    damage?: { dice: string; type: string };
    versatile?: string;
    properties: string[];
    rangeFt?: { normal: number; long: number };
    throwFt?: { normal: number; long: number };
    reachFt?: number;
    special?: string;
  };
  armor?: {
    class: "light" | "medium" | "heavy" | "shield";
    ac: number;
    /** null: full Dex bonus. 0: none. Otherwise the cap. */
    dexCap: number | null;
    strMin: number;
    stealthDisadvantage: boolean;
  };
  tool?: { kind: "artisan" | "instrument" | "gaming" | "kit" };
  focus?: "arcane" | "holy" | "druidic";
  magic?: { kind: string; rarity: string; attunement: boolean };
  coin?: { cpValue: number };
  contents?: ItemStack[];
  use?: ItemUse;
  /** Uses before it is spent (a healer's kit has 10). */
  charges?: number;
  speed?: string;
  capacity?: string;
}

const BASE: CatalogItem[] = (catalogEn as { items: CatalogItem[] }).items;
const OVERLAY: Record<string, Record<string, { name?: string; description?: string }>> = {
  id: (catalogIdOverlay as { items: Record<string, { name?: string; description?: string }> }).items,
};

type PropertyText = Record<string, string>;
const PROPERTY_TEXT: Record<string, PropertyText> = {
  en: (catalogEn as { weaponProperties: PropertyText }).weaponProperties,
  id: (catalogIdOverlay as { weaponProperties: PropertyText }).weaponProperties,
};

/** Rule text for a weapon property ("Finesse"), in the given language. */
export function weaponPropertyText(name: string, locale: string = "en"): string {
  return PROPERTY_TEXT[locale]?.[name] ?? PROPERTY_TEXT.en[name] ?? "";
}

const cache = new Map<string, CatalogItem[]>();

export function getCatalog(locale: string = "en"): CatalogItem[] {
  const overlay = OVERLAY[locale];
  if (!overlay) return BASE;
  let list = cache.get(locale);
  if (!list) {
    list = BASE.map((item) => {
      const text = overlay[item.id];
      return text ? { ...item, ...text } : item;
    });
    cache.set(locale, list);
  }
  return list;
}

let byKey: Map<string, CatalogItem> | null = null;

export function normalizeItemKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^(a|an|the)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Names the class and background text uses that differ from the SRD name. */
const ALIASES: Record<string, string> = {
  "light crossbow": "crossbow-light",
  "hand crossbow": "crossbow-hand",
  "heavy crossbow": "crossbow-heavy",
  "crossbow bolt": "crossbow-bolt",
  "bolt": "crossbow-bolt",
  "arrows": "arrow",
  "bolts": "crossbow-bolt",
  "potion of healing": "potion-of-healing-common",
  "dice set": "dice-set",
  "playing card set": "playing-card-set",
  "common clothes": "clothes-common",
  "set of common clothes": "clothes-common",
  "fine clothes": "clothes-fine",
  "set of fine clothes": "clothes-fine",
  "traveler's clothes": "clothes-travelers",
  "set of traveler's clothes": "clothes-travelers",
  "costume": "clothes-costume",
  "belt pouch": "pouch",
  "purse": "pouch",
};

function buildIndex(): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>();
  for (const item of BASE) {
    map.set(item.id, item);
    const key = normalizeItemKey(item.name);
    if (!map.has(key)) map.set(key, item);
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    const item = map.get(id);
    if (item && !map.has(alias)) map.set(alias, item);
  }
  return map;
}

/** Look an item up by id, SRD name (any case), or a known alias. English record. */
export function findCatalogItem(idOrName: string | undefined | null): CatalogItem | undefined {
  if (!idOrName) return undefined;
  if (!byKey) byKey = buildIndex();
  return byKey.get(idOrName) ?? byKey.get(normalizeItemKey(idOrName));
}

/** Same as findCatalogItem, with the name and description in the given language. */
export function findLocalizedItem(idOrName: string | undefined | null, locale: string = "en"): CatalogItem | undefined {
  const base = findCatalogItem(idOrName);
  if (!base || locale === "en") return base;
  const text = OVERLAY[locale]?.[base.id];
  return text ? { ...base, ...text } : base;
}

export function getCatalogByType(type: CatalogItemType | CatalogItemType[], locale: string = "en"): CatalogItem[] {
  const types = Array.isArray(type) ? type : [type];
  return getCatalog(locale).filter((i) => types.includes(i.type));
}

/** A potion, a scroll, or a mundane item that is used up. */
export function isConsumable(item: CatalogItem): boolean {
  if (item.type === "consumable") return true;
  return item.type === "magic" && (item.magic?.kind === "potion" || item.magic?.kind === "scroll");
}

export function formatCost(cost: CatalogItem["cost"]): string | null {
  if (!cost || !cost.quantity) return null;
  return `${cost.quantity} ${cost.unit}`;
}

export function weaponHandedness(item: CatalogItem): "light" | "one-handed" | "versatile" | "two-handed" | undefined {
  const props = item.weapon?.properties ?? [];
  if (!item.weapon) return undefined;
  if (props.includes("Two-Handed")) return "two-handed";
  if (props.includes("Versatile")) return "versatile";
  if (props.includes("Light")) return "light";
  return "one-handed";
}
