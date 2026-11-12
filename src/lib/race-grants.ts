import { getStaticRace, type SRDRace } from "./srd-client";
import type { Character } from "./storage";
import { backgroundAsi } from "./origin-2024";

export const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

/** Whether a flexible increase is placed legally: +2/+1 or +1/+1/+1 for a lineage, one +1 otherwise. */
export function isFlexAsiValid(race: SRDRace | undefined, flex: Record<string, number> | undefined): boolean {
  if (!race?.flexibleAsi) return true;
  const values = Object.values(flex || {}).filter((v) => v > 0).sort((a, b) => b - a);
  if (race.flexibleAsi === "one") {
    const fixed = Object.keys(race.abilityScoreIncreases || {});
    return values.length === 1 && values[0] === 1 && !Object.keys(flex || {}).some((k) => (flex![k] || 0) > 0 && fixed.includes(k));
  }
  return values.join(",") === "2,1" || values.join(",") === "1,1,1";
}

/**
 * Every origin ability increase: the race's fixed ones plus a valid flexible
 * placement. Under 2024 rules the species gives none and the background's
 * +2/+1 or +1/+1/+1 (kept in flexAsi too) is the whole increase.
 */
export function getRaceAsi(character: Pick<Character, "race" | "ruleset" | "flexAsi"> & { background?: string }): Record<string, number> {
  if (character.ruleset === "2024") return backgroundAsi({ ruleset: character.ruleset, background: character.background || "", flexAsi: character.flexAsi });
  const race = getStaticRace(character.race, character.ruleset);
  const out: Record<string, number> = { ...(race?.abilityScoreIncreases || {}) };
  if (race?.flexibleAsi && isFlexAsiValid(race, character.flexAsi)) {
    for (const [k, v] of Object.entries(character.flexAsi || {})) if (v > 0) out[k] = (out[k] || 0) + v;
  }
  return out;
}

/** Skills the race gives: fixed ones plus the player's picks, limited to the allowed count and options. */
export function getRaceSkills(character: Pick<Character, "race" | "ruleset" | "raceSkillPicks">): string[] {
  const race = getStaticRace(character.race, character.ruleset);
  if (!race) return [];
  const fixed = race.skillProficiencies || [];
  const choice = race.skillChoice;
  const picks = choice
    ? (character.raceSkillPicks || []).filter((s) => !choice.options || choice.options.includes(s)).slice(0, choice.count)
    : [];
  return [...new Set([...fixed, ...picks])];
}
