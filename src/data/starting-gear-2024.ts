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
};
