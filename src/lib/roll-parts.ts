/**
 * Where each bonus on the sheet comes from, part by part, so a roll in the
 * dice tray can show "1d20 + 3 DEX + 3 proficiency". The sheet's numbers are
 * the sums of these parts.
 */
import { getModifier, getProficiencyBonus, hasFeat, type Character } from "./storage";
import { overrideOf } from "./overrides";
import type { BonusPart } from "./dice-roll";

type Abilities = Pick<Character, "str" | "dex" | "con" | "int" | "wis" | "cha">;
const abilityPart = (character: Partial<Abilities>, key: string): BonusPart => ({ source: `@${key}`, value: getModifier((character[key as keyof Abilities] as number) ?? 10) });

/** A number set by hand replaces the parts ("set") or goes on top of them ("add"). */
export function withOverrideParts(character: Pick<Character, "overrides">, key: string, parts: BonusPart[]): BonusPart[] {
  const o = overrideOf(character, key);
  if (!o) return parts;
  return o.mode === "set" ? [{ source: "@byHand", value: o.value }] : [...parts, { source: "@byHand", value: o.value }];
}

/** Ability modifier, plus proficiency when proficient (twice with expertise). Without the number set by hand. */
export function ruleSkillParts(character: Character, skill: string, ability: string): BonusPart[] {
  const parts = [abilityPart(character, ability)];
  if (!character.skills?.[skill]) return parts;
  const prof = getProficiencyBonus(character.level || 1);
  parts.push({ source: "@prof", value: prof });
  if (character.expertise?.includes(skill)) parts.push({ source: "@expertise", value: prof });
  return parts;
}

export const skillParts = (character: Character, skill: string, ability: string) => withOverrideParts(character, `skill:${skill}`, ruleSkillParts(character, skill, ability));

/** Cover adds to Dexterity saving throws: +2 half cover, +5 three-quarters or total. */
export function dexSaveCover(character: { activeStates?: string[] }): number {
  let cover = 0;
  for (const state of character.activeStates || []) {
    const s = state.toLowerCase().trim();
    if (s === "half cover") cover = Math.max(cover, 2);
    else if (s === "three-quarters cover" || s === "total cover") cover = Math.max(cover, 5);
  }
  return cover;
}

/** A saving throw: ability modifier, proficiency when proficient, a number set by hand, then cover (Dexterity). */
export function saveParts(character: Partial<Abilities> & Partial<Pick<Character, "level" | "activeStates" | "overrides">>, key: string, proficient: boolean): BonusPart[] {
  const parts = [abilityPart(character, key)];
  if (proficient) parts.push({ source: "@prof", value: getProficiencyBonus(character.level || 1) });
  const out = withOverrideParts(character, `save:${key}`, parts);
  const cover = key === "dex" ? dexSaveCover(character) : 0;
  return cover ? [...out, { source: "@cover", value: cover }] : out;
}

/** Initiative: Dexterity modifier, plus Alert (+5, or the Proficiency Bonus under the 2024 rules). */
export function initiativeParts(character: Pick<Character, "dex" | "features" | "overrides"> & { ruleset?: string; level?: number }): BonusPart[] {
  const parts = [abilityPart(character, "dex")];
  if (hasFeat(character as Character, "Alert")) parts.push({ source: "Alert", value: character.ruleset === "2024" ? getProficiencyBonus(character.level || 1) : 5 });
  return withOverrideParts(character, "initiative", parts);
}

/** Spell attack: proficiency plus the spellcasting ability modifier. */
export function spellAttackParts(character: Character, ability = character.spellcastingAbility): BonusPart[] {
  const parts: BonusPart[] = ability ? [abilityPart(character, ability)] : [];
  parts.push({ source: "@prof", value: getProficiencyBonus(character.level || 1) });
  return withOverrideParts(character, "spellAttackBonus", parts);
}

/** An ability check: the ability modifier. */
export const abilityCheckParts = (character: Abilities, key: string): BonusPart[] => [abilityPart(character, key)];

/**
 * Spell attack bonus and save DC for one spell: a 2024 species spell uses the
 * ability picked for the species, everything else the class numbers.
 */
export function spellNumbersFor(character: Character, ability?: string): { attack: number; dc: number; parts: BonusPart[] } {
  if (!ability || ability === character.spellcastingAbility) {
    return { attack: character.spellAttackBonus ?? 0, dc: character.spellSaveDc || 0, parts: spellAttackParts(character) };
  }
  const mod = getModifier(((character as unknown as Record<string, number>)[ability]) ?? 10);
  const prof = getProficiencyBonus(character.level || 1);
  return { attack: mod + prof, dc: 8 + mod + prof, parts: [abilityPart(character, ability), { source: "@prof", value: prof }] };
}
