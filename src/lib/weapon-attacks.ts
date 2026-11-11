import { getModifier, getProficiencyBonus, type Character } from "./storage";
import { addsProficiencyToAttack } from "./proficiency";
import { withOverride } from "./overrides";
import { isFinesseOrRanged, weaponAbility, weaponDamageDice } from "./inventory";

export const isRaging = (character: Pick<Character, "activeStates">) => (character.activeStates || []).includes("raging");

/**
 * Attack and damage numbers for an equipped weapon attack, as the sheet and the
 * turn helper show them. Rage damage is added only while the Barbarian is raging
 * (`rageDamage` defaults to the saved rage bonus for the character's level).
 * Returns null when the attack isn't a weapon in the inventory.
 */
export function getWeaponAttackDetails(character: Character, attack: Character["attacks"][number], rageDamage = character.rageDamage || 0) {
  const weapon = character.inventory.find((i) => i.id === attack.id);
  if (!weapon || weapon.itemType !== "weapon") return null;
  const profBonus = getProficiencyBonus(character.level);
  const rage = character.class === "Barbarian" && isRaging(character) ? rageDamage : 0;
  const finesseOrRanged = isFinesseOrRanged(weapon);
  const strMod = getModifier(character.str);
  const dexMod = getModifier(character.dex);
  const abilityKey = weaponAbility(weapon, strMod, dexMod);
  const abilityMod = getModifier(character[abilityKey] as number);
  return {
    weapon,
    // A to-hit set by hand (a +1 weapon, a DM ruling) wins.
    attackBonus: withOverride(character, `attack:${weapon.id}`, abilityMod + (addsProficiencyToAttack(character, weapon) ? profBonus : 0)),
    damageDice: weaponDamageDice(weapon),
    damageBonus: abilityMod + (abilityKey === "str" ? rage : 0),
    damageType: weapon.damageType || "",
    abilityKey,
    abilityMod,
    isFinesseOrRanged: finesseOrRanged,
    strMod,
    dexMod,
    rageBonus: abilityKey === "str" ? rage : 0,
  };
}
