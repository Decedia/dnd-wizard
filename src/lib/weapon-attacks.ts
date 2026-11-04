import { getModifier, getProficiencyBonus, type Character } from "./storage";

/**
 * Attack and damage numbers for an equipped weapon attack, as the sheet shows
 * them. `rageDamage` is the Barbarian's current rage bonus (0 when not raging).
 * Returns null when the attack isn't a weapon in the inventory.
 */
export function getWeaponAttackDetails(character: Character, attack: Character["attacks"][number], rageDamage = 0) {
  const weapon = character.inventory.find((i) => i.id === attack.id);
  if (!weapon || weapon.itemType !== "weapon") return null;
  const profBonus = getProficiencyBonus(character.level);
  const isBarbarian = character.class === "Barbarian";
  const isFinesseOrRanged = weapon.category === "ranged" || weapon.name === "Dagger" || weapon.name === "Rapier" || weapon.name === "Shortsword";
  const strMod = getModifier(character.str);
  const dexMod = getModifier(character.dex);
  let abilityKey: "str" | "dex";
  if (isFinesseOrRanged) abilityKey = dexMod >= strMod ? "dex" : "str";
  else abilityKey = weapon.category === "ranged" ? "dex" : "str";
  const abilityMod = getModifier(character[abilityKey] as number);
  return {
    weapon,
    attackBonus: abilityMod + profBonus,
    damageDice: weapon.damageDice || "",
    damageBonus: abilityMod + (isBarbarian && abilityKey === "str" ? rageDamage : 0),
    damageType: weapon.damageType || "",
    abilityKey,
    abilityMod,
    isFinesseOrRanged,
    strMod,
    dexMod,
    rageBonus: isBarbarian && abilityKey === "str" ? rageDamage : 0,
  };
}
