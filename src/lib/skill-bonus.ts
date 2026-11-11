import { getPassiveScore, type Character } from "./storage";
import { withOverride } from "./overrides";
import { ruleSkillParts } from "./roll-parts";
import { sumParts } from "./dice-roll";

/** A skill's bonus by the rules: ability modifier, plus proficiency (twice with expertise). */
export function ruleSkillBonus(character: Character, skill: string, ability: string): number {
  return sumParts(ruleSkillParts(character, skill, ability));
}

/** The skill bonus the sheet shows: a number set by hand wins. */
export function skillBonus(character: Character, skill: string, ability: string): number {
  return withOverride(character, `skill:${skill}`, ruleSkillBonus(character, skill, ability));
}

/** A passive score (10 + the skill) with a number set by hand on top. */
export function passiveScore(character: Character, skill: "Perception" | "Insight" | "Investigation"): number {
  return withOverride(character, `passive:${skill}`, getPassiveScore(character, skill));
}
