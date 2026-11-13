import { getFeatureValue, getModifier, getProficiencyBonus, hasFeat, hasFightingStyle, type Character } from "./storage";
import { findCatalogItem } from "@/data/item-catalog";
import { addsProficiencyToAttack } from "./proficiency";
import { withOverrideParts } from "./roll-parts";
import { sumParts, type BonusPart } from "./dice-roll";
import { heldInHands, isFinesseOrRanged, weaponAbility, weaponDamageDice } from "./inventory";
import { weaponMastery } from "./weapon-mastery";

/** The Martial Arts die ("1d6") of a Monk wearing no armor and holding no Shield; undefined otherwise. */
export function martialArtsDie(character: Character): string | undefined {
  if (character.class !== "Monk") return undefined;
  if ((character.inventory || []).some((r) => r.equipped && (r.itemType === "armor" || !!r.armorType))) return undefined;
  const die = getFeatureValue("Martial Arts", character);
  return die ? `1${die}` : undefined;
}

type Row = Character["inventory"][number];

/**
 * A Monk weapon. 2014: a shortsword, or a simple melee weapon without Two-Handed or Heavy.
 * 2024: a simple melee weapon, or a martial melee weapon with the Light property.
 */
export function isMonkWeapon(character: Character, weapon: Row): boolean {
  const item = findCatalogItem(weapon.itemId || weapon.srdItemName || weapon.name);
  const kind = item?.weapon?.class;
  if ((item?.weapon?.range ?? weapon.category) !== "melee") return false;
  const props = (weapon.properties || []).map((p) => p.toLowerCase());
  if (character.ruleset === "2024") return kind === "simple" || (kind === "martial" && props.includes("light"));
  return props.includes("monk") || (kind === "simple" && !props.includes("two-handed") && !props.includes("heavy"));
}

/** The bigger of two dice ("1d6" vs "1d8"); an empty one loses. */
export const biggerDie = (a: string, b: string) => {
  const sides = (d: string) => Number(/d(\d+)/.exec(d)?.[1] || 0);
  return sides(b) > sides(a) ? b : a;
};

/** A weapon with the Thrown property. */
export const isThrowable = (weapon: Row) => (weapon.properties || []).some((p) => p.toLowerCase() === "thrown");

export const isRaging = (character: Pick<Character, "activeStates">) => (character.activeStates || []).includes("raging");

/**
 * Attack and damage numbers for an equipped weapon attack, as the sheet and the
 * turn helper show them. Rage damage is added only while the Barbarian is raging
 * (`rageDamage` defaults to the saved rage bonus for the character's level).
 * Returns null when the attack isn't a weapon in the inventory.
 */
export function getWeaponAttackDetails(character: Character, attack: Character["attacks"][number], rageDamage = character.rageDamage || 0, opts: { thrown?: boolean } = {}) {
  const weapon = character.inventory.find((i) => i.id === attack.id);
  if (!weapon || weapon.itemType !== "weapon") return null;
  const profBonus = getProficiencyBonus(character.level);
  // A melee weapon thrown is a ranged attack: no Dueling, and Rage only in 2024 (any Strength attack).
  const thrown = !!opts.thrown && weapon.category !== "ranged";
  const rage = character.class === "Barbarian" && isRaging(character) && (!thrown || character.ruleset === "2024") ? rageDamage : 0;
  const finesseOrRanged = isFinesseOrRanged(weapon);
  const strMod = getModifier(character.str);
  const dexMod = getModifier(character.dex);
  // Martial Arts: a Monk weapon may use Dexterity and the Martial Arts die.
  const martialDie = martialArtsDie(character);
  const monkWeapon = !!martialDie && isMonkWeapon(character, weapon);
  const abilityKey = monkWeapon ? (dexMod >= strMod ? "dex" : "str") : weaponAbility(weapon, strMod, dexMod);
  const abilityMod = getModifier(character[abilityKey] as number);
  // A to-hit set by hand (a +1 weapon, a DM ruling) wins.
  const ranged = weapon.category === "ranged";
  const attackParts = withOverrideParts(character, `attack:${weapon.id}`, [
    { source: `@${abilityKey}`, value: abilityMod },
    ...(addsProficiencyToAttack(character, weapon) ? [{ source: "@prof", value: profBonus }] : []),
    ...(ranged && hasFightingStyle(character, "Archery") ? [{ source: "Archery", value: 2 }] : []),
  ]);
  // Dueling: a melee weapon in one hand and no other weapon held.
  const hands = heldInHands(character.inventory || []);
  const dueling = !ranged && !thrown && hands.main?.id === weapon.id && !hands.twoHanded && hands.off?.itemType !== "weapon" && hasFightingStyle(character, "Dueling");
  const damageParts: BonusPart[] = [
    { source: `@${abilityKey}`, value: abilityMod },
    ...(abilityKey === "str" && rage ? [{ source: "Rage", value: rage }] : []),
    ...(dueling ? [{ source: "Dueling", value: 2 }] : []),
    // Thrown Weapon Fighting: +2 damage on a ranged attack with a Thrown weapon.
    ...((ranged || thrown) && isThrowable(weapon) && hasFightingStyle(character, "Thrown Weapon Fighting")
      ? [{ source: "Thrown Weapon Fighting", value: 2 }]
      : []),
    // 2024 Great Weapon Master: a Heavy weapon adds the Proficiency Bonus to damage.
    ...(character.ruleset === "2024" && (weapon.properties || []).some((p) => p.toLowerCase() === "heavy") && hasFeat(character, "Great Weapon Master")
      ? [{ source: "Great Weapon Master", value: profBonus }]
      : []),
  ];
  return {
    weapon,
    attackBonus: sumParts(attackParts),
    attackParts,
    damageDice: monkWeapon ? biggerDie(weaponDamageDice(weapon), martialDie!) : weaponDamageDice(weapon),
    damageBonus: sumParts(damageParts),
    damageParts,
    damageType: weapon.damageType || "",
    abilityKey,
    abilityMod,
    isFinesseOrRanged: finesseOrRanged,
    strMod,
    dexMod,
    rageBonus: abilityKey === "str" ? rage : 0,
    /** The 2024 mastery property the character can use with this weapon. */
    mastery: weaponMastery(character, weapon),
  };
}
