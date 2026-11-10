import { getModifier, getProficiencyBonus, type Character } from "./storage";
import { addsProficiencyToAttack } from "./proficiency";
import { isFinesseOrRanged, weaponAbility } from "./inventory";

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
  const finesseOrRanged = isFinesseOrRanged(weapon);
  const strMod = getModifier(character.str);
  const dexMod = getModifier(character.dex);
  const abilityKey = weaponAbility(weapon, strMod, dexMod);
  const abilityMod = getModifier(character[abilityKey] as number);
  return {
    weapon,
    attackBonus: abilityMod + (addsProficiencyToAttack(character, weapon) ? profBonus : 0),
    damageDice: weapon.damageDice || "",
    damageBonus: abilityMod + (isBarbarian && abilityKey === "str" ? rageDamage : 0),
    damageType: weapon.damageType || "",
    abilityKey,
    abilityMod,
    isFinesseOrRanged: finesseOrRanged,
    strMod,
    dexMod,
    rageBonus: isBarbarian && abilityKey === "str" ? rageDamage : 0,
  };
}
