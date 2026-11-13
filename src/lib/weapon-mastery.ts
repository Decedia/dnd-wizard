// 2024 Weapon Mastery: each weapon kind has one mastery property, and a
// character uses it only with the kinds they trained (picked at level-up).
import mastery from "@/data/en/2024_weapon_mastery.json";
import { findCatalogItem } from "@/data/item-catalog";
import { getFeatPicks, getFeaturePicks } from "./feature-groups";
import type { Character } from "./storage";

export type MasteryName = "Cleave" | "Graze" | "Nick" | "Push" | "Sap" | "Slow" | "Topple" | "Vex";

const BY_WEAPON = mastery.weapons as Record<string, MasteryName>;

type WeaponRow = Pick<Character["inventory"][number], "itemId" | "srdItemName" | "name">;

/** The weapon kind's English name, as the mastery table lists it. */
const weaponKind = (row: WeaponRow) => findCatalogItem(row.itemId ?? row.srdItemName ?? row.name)?.name ?? row.name;

/** The mastery property this character can use with the weapon, if they trained it (2024 rules only). */
export function weaponMastery(character: Pick<Character, "ruleset" | "featureSelections">, row: WeaponRow): MasteryName | undefined {
  if (character.ruleset !== "2024") return undefined;
  const kind = weaponKind(row);
  const property = BY_WEAPON[kind];
  if (!property) return undefined;
  // The Weapon Mastery feature's picks, or the kind chosen with the Weapon Master feat.
  const trained = getFeaturePicks(character, "Weapon Mastery").includes(kind) || getFeatPicks(character, "Weapon Master").picks.includes(kind);
  return trained ? property : undefined;
}
