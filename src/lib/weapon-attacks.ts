import { getModifier, getProficiencyBonus, hasFeat, hasFightingStyle, type Character } from "./storage";
import { addsProficiencyToAttack } from "./proficiency";
import { withOverrideParts } from "./roll-parts";
import { sumParts, type BonusPart } from "./dice-roll";
import { heldInHands, isFinesseOrRanged, weaponAbility, weaponDamageDice } from "./inventory";
import { weaponMastery } from "./weapon-mastery";

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
  // A to-hit set by hand (a +1 weapon, a DM ruling) wins.
  const ranged = weapon.category === "ranged";
  const attackParts = withOverrideParts(character, `attack:${weapon.id}`, [
    { source: `@${abilityKey}`, value: abilityMod },
    ...(addsProficiencyToAttack(character, weapon) ? [{ source: "@prof", value: profBonus }] : []),
    ...(ranged && hasFightingStyle(character, "Archery") ? [{ source: "Archery", value: 2 }] : []),
  ]);
  // Dueling: a melee weapon in one hand and no other weapon held.
  const hands = heldInHands(character.inventory || []);
  const dueling = !ranged && hands.main?.id === weapon.id && !hands.twoHanded && hands.off?.itemType !== "weapon" && hasFightingStyle(character, "Dueling");
  const damageParts: BonusPart[] = [
    { source: `@${abilityKey}`, value: abilityMod },
    ...(abilityKey === "str" && rage ? [{ source: "Rage", value: rage }] : []),
    ...(dueling ? [{ source: "Dueling", value: 2 }] : []),
    // 2024 Great Weapon Master: a Heavy weapon adds the Proficiency Bonus to damage.
    ...(character.ruleset === "2024" && (weapon.properties || []).some((p) => p.toLowerCase() === "heavy") && hasFeat(character, "Great Weapon Master")
      ? [{ source: "Great Weapon Master", value: profBonus }]
      : []),
  ];
  return {
    weapon,
    attackBonus: sumParts(attackParts),
    attackParts,
    damageDice: weaponDamageDice(weapon),
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
