export type Ruleset = "2014" | "2024";

/**
 * The 2024 rules are still being built. Until this is true the creator offers
 * only 2014 rules, and a draft that somehow holds "2024" is treated as 2014.
 */
export const RULESET_2024_READY = false;

/** The rule set a character uses: 2014 unless it says 2024 and 2024 is ready. */
export function rulesetOf(character: { ruleset?: string } | null | undefined): Ruleset {
  return RULESET_2024_READY && character?.ruleset === "2024" ? "2024" : "2014";
}
