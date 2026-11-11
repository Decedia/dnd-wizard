import { getModifier, getPassiveScore, getProficiencyBonus, type Character } from "./storage";
import { withOverride } from "./overrides";

/** A skill's bonus by the rules: ability modifier, plus proficiency (twice with expertise). */
export function ruleSkillBonus(character: Character, skill: string, ability: string): number {
  const mod = getModifier(character[ability as keyof Character] as number);
  if (!character.skills?.[skill]) return mod;
  const prof = getProficiencyBonus(character.level || 1);
  return mod + (character.expertise?.includes(skill) ? prof * 2 : prof);
}

/** The skill bonus the sheet shows: a number set by hand wins. */
export function skillBonus(character: Character, skill: string, ability: string): number {
  return withOverride(character, `skill:${skill}`, ruleSkillBonus(character, skill, ability));
}

/** A passive score (10 + the skill) with a number set by hand on top. */
export function passiveScore(character: Character, skill: "Perception" | "Insight" | "Investigation"): number {
  return withOverride(character, `passive:${skill}`, getPassiveScore(character, skill));
}
