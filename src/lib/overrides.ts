import type { Character } from "./storage";

/**
 * A number the player (or DM) set by hand. "set" replaces the rules' number;
 * "add" goes on top of it, so it keeps working when the rules' number changes
 * (a +1 ring of protection on AC still counts after a level-up).
 */
export interface NumberOverride {
  mode: "set" | "add";
  value: number;
  /** HP on an old save with no HP per level: the maximum before, put back when the override is cleared. */
  before?: number;
}

/**
 * The numbers that can be overridden:
 * ac, speed, initiative, maxHp, spellSaveDc, spellAttackBonus,
 * save:<str|dex|...>, skill:<Skill name>, passive:<Perception|Insight|Investigation>,
 * attack:<inventory row id>.
 */
export type OverrideKey = string;

export function overrideOf(character: Pick<Character, "overrides">, key: OverrideKey): NumberOverride | undefined {
  const o = character.overrides?.[key];
  return o && Number.isFinite(o.value) ? o : undefined;
}

/** The number to show: the rules' number with the player's override on top. */
export function withOverride(character: Pick<Character, "overrides">, key: OverrideKey, ruleValue: number): number {
  const o = overrideOf(character, key);
  if (!o) return ruleValue;
  return o.mode === "set" ? o.value : ruleValue + o.value;
}

/** The patch that sets or clears one override. */
export function setOverride(character: Pick<Character, "overrides">, key: OverrideKey, value: NumberOverride | null): Pick<Character, "overrides"> {
  const next = { ...(character.overrides || {}) };
  if (value && (value.mode === "set" || value.value !== 0)) next[key] = value;
  else delete next[key];
  return { overrides: next };
}
