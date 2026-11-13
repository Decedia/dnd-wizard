import type { BackgroundGear } from "@/data/backgrounds";

/**
 * 2024 starting gear (SRD 5.2): each class and background offers set packages
 * or gold instead. Written out by hand with item catalog ids from the class
 * and background tables, the way the 2014 backgrounds are.
 */
export interface GearPackage {
  /** "A", "B", "C" as the book letters them. */
  letter: string;
  items: BackgroundGear[];
  /** Gold that comes with the package (all of it for the gold-only one). */
  gold: number;
}

const holy: BackgroundGear = { choice: "holy", label: "Holy symbol" };

export const CLASS_GEAR_2024: Record<string, GearPackage[]> = {
  Barbarian: [
    { letter: "A", items: [{ id: "greataxe" }, { id: "handaxe", quantity: 4 }, { id: "explorers-pack" }], gold: 15 },
    { letter: "B", items: [], gold: 75 },
  ],
  Bard: [
    { letter: "A", items: [{ id: "leather-armor" }, { id: "dagger", quantity: 2 }, { choice: "instrument", label: "Musical instrument" }, { id: "entertainers-pack" }], gold: 19 },
    { letter: "B", items: [], gold: 90 },
  ],
  Cleric: [
    { letter: "A", items: [{ id: "chain-shirt" }, { id: "shield" }, { id: "mace" }, holy, { id: "priests-pack" }], gold: 7 },
    { letter: "B", items: [], gold: 110 },
  ],
  Druid: [
    // The quarterstaff is the Druidic Focus.
    { letter: "A", items: [{ id: "leather-armor" }, { id: "shield" }, { id: "sickle" }, { id: "quarterstaff" }, { id: "explorers-pack" }, { id: "herbalism-kit" }], gold: 9 },
    { letter: "B", items: [], gold: 50 },
  ],
  Fighter: [
    { letter: "A", items: [{ id: "chain-mail" }, { id: "greatsword" }, { id: "flail" }, { id: "javelin", quantity: 8 }, { id: "dungeoneers-pack" }], gold: 4 },
    { letter: "B", items: [{ id: "studded-leather-armor" }, { id: "scimitar" }, { id: "shortsword" }, { id: "longbow" }, { id: "arrow", quantity: 20 }, { id: "quiver" }, { id: "dungeoneers-pack" }], gold: 11 },
    { letter: "C", items: [], gold: 155 },
  ],
  Monk: [
    { letter: "A", items: [{ id: "spear" }, { id: "dagger", quantity: 5 }, { choice: "artisan", label: "Artisan's tools or musical instrument" }, { id: "explorers-pack" }], gold: 11 },
    { letter: "B", items: [], gold: 50 },
  ],
  Paladin: [
    { letter: "A", items: [{ id: "chain-mail" }, { id: "shield" }, { id: "longsword" }, { id: "javelin", quantity: 6 }, holy, { id: "priests-pack" }], gold: 9 },
    { letter: "B", items: [], gold: 150 },
  ],
  Ranger: [
    { letter: "A", items: [{ id: "studded-leather-armor" }, { id: "scimitar" }, { id: "shortsword" }, { id: "longbow" }, { id: "arrow", quantity: 20 }, { id: "quiver" }, { id: "sprig-of-mistletoe" }, { id: "explorers-pack" }], gold: 7 },
    { letter: "B", items: [], gold: 150 },
  ],
  Rogue: [
    { letter: "A", items: [{ id: "leather-armor" }, { id: "dagger", quantity: 2 }, { id: "shortsword" }, { id: "shortbow" }, { id: "arrow", quantity: 20 }, { id: "quiver" }, { id: "thieves-tools" }, { id: "burglars-pack" }], gold: 8 },
    { letter: "B", items: [], gold: 100 },
  ],
  Sorcerer: [
    { letter: "A", items: [{ id: "spear" }, { id: "dagger", quantity: 2 }, { id: "crystal" }, { id: "dungeoneers-pack" }], gold: 28 },
    { letter: "B", items: [], gold: 50 },
  ],
  Warlock: [
    { letter: "A", items: [{ id: "leather-armor" }, { id: "sickle" }, { id: "dagger", quantity: 2 }, { id: "orb" }, { id: "book" }, { id: "scholars-pack" }], gold: 15 },
    { letter: "B", items: [], gold: 100 },
  ],
  Wizard: [
    // The quarterstaff is the Arcane Focus.
    { letter: "A", items: [{ id: "dagger", quantity: 2 }, { id: "quarterstaff" }, { id: "robes" }, { id: "spellbook" }, { id: "scholars-pack" }], gold: 5 },
    { letter: "B", items: [], gold: 55 },
  ],
};

const travelers: BackgroundGear = { id: "clothes-travelers" };
const gold50: GearPackage = { letter: "B", items: [], gold: 50 };

export const BACKGROUND_GEAR_2024: Record<string, GearPackage[]> = {
  Acolyte: [
    { letter: "A", items: [{ id: "calligraphers-supplies" }, { id: "book" }, holy, { id: "parchment-one-sheet", quantity: 10 }, { id: "robes" }], gold: 8 },
    { letter: "B", items: [], gold: 50 },
  ],
  Criminal: [
    { letter: "A", items: [{ id: "dagger", quantity: 2 }, { id: "thieves-tools" }, { id: "crowbar" }, { id: "pouch", quantity: 2 }, { id: "clothes-travelers" }], gold: 16 },
    { letter: "B", items: [], gold: 50 },
  ],
  Sage: [
    { letter: "A", items: [{ id: "quarterstaff" }, { id: "calligraphers-supplies" }, { id: "book" }, { id: "parchment-one-sheet", quantity: 8 }, { id: "robes" }], gold: 8 },
    { letter: "B", items: [], gold: 50 },
  ],
  Soldier: [
    // The gaming set is the same kind as the background's tool proficiency.
    { letter: "A", items: [{ id: "spear" }, { id: "shortbow" }, { id: "arrow", quantity: 20 }, { choice: "gaming", label: "Gaming set" }, { id: "healers-kit" }, { id: "quiver" }, { id: "clothes-travelers" }], gold: 14 },
    { letter: "B", items: [], gold: 50 },
  ],
  // 2024 Player's Handbook backgrounds. A "same as above" tool is a pick-one row.
  Artisan: [{ letter: "A", items: [{ choice: "artisan", label: "Artisan's tools" }, { id: "pouch", quantity: 2 }, travelers], gold: 32 }, gold50],
  Charlatan: [{ letter: "A", items: [{ id: "forgery-kit" }, { id: "clothes-costume" }, { id: "clothes-fine" }], gold: 15 }, gold50],
  Entertainer: [{ letter: "A", items: [{ choice: "instrument", label: "Musical instrument" }, { id: "clothes-costume", quantity: 2 }, { id: "mirror-steel" }, { id: "perfume-vial" }, travelers], gold: 11 }, gold50],
  Farmer: [{ letter: "A", items: [{ id: "sickle" }, { id: "carpenters-tools" }, { id: "healers-kit" }, { id: "pot-iron" }, { id: "shovel" }, travelers], gold: 30 }, gold50],
  Guard: [{ letter: "A", items: [{ id: "spear" }, { id: "crossbow-light" }, { id: "crossbow-bolt", quantity: 20 }, { choice: "gaming", label: "Gaming set" }, { id: "lantern-hooded" }, { id: "manacles" }, { id: "quiver" }, travelers], gold: 12 }, gold50],
  Guide: [{ letter: "A", items: [{ id: "shortbow" }, { id: "arrow", quantity: 20 }, { id: "cartographers-tools" }, { id: "bedroll" }, { id: "quiver" }, { id: "tent-two-person" }, travelers], gold: 3 }, gold50],
  Hermit: [{ letter: "A", items: [{ id: "quarterstaff" }, { id: "herbalism-kit" }, { id: "bedroll" }, { id: "book" }, { id: "lamp" }, { id: "oil-flask", quantity: 3 }, travelers], gold: 16 }, gold50],
  Merchant: [{ letter: "A", items: [{ id: "navigators-tools" }, { id: "pouch", quantity: 2 }, travelers], gold: 22 }, gold50],
  Noble: [{ letter: "A", items: [{ choice: "gaming", label: "Gaming set" }, { id: "clothes-fine" }, { id: "perfume-vial" }], gold: 29 }, gold50],
  Sailor: [{ letter: "A", items: [{ id: "dagger" }, { id: "navigators-tools" }, { id: "rope-hempen-50-feet" }, travelers], gold: 20 }, gold50],
  Scribe: [{ letter: "A", items: [{ id: "calligraphers-supplies" }, { id: "clothes-fine" }, { id: "lamp" }, { id: "oil-flask", quantity: 3 }, { id: "parchment-one-sheet", quantity: 12 }], gold: 23 }, gold50],
  Wayfarer: [{ letter: "A", items: [{ id: "dagger", quantity: 2 }, { id: "thieves-tools" }, { choice: "gaming", label: "Gaming set" }, { id: "bedroll" }, { id: "pouch", quantity: 2 }, travelers], gold: 16 }, gold50],
};
