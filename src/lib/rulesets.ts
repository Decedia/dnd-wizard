export type Ruleset = "2014" | "2024";

/**
 * The 2024 rules (SRD 5.2) are released: the creator offers both rule sets.
 * Set to false to hide 2024 again; drafts holding "2024" then load as 2014.
 */
export const RULESET_2024_READY = true;

/**
 * Testing 2024 before it ships: open the creator with ?rules2024 to turn it on
 * on this device, ?rules2024=off to turn it off again. Stored in localStorage.
 */
export const RULES_2024_PREVIEW_KEY = "dnd-rules-2024-preview";

function previewOn(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(RULES_2024_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether 2024 rules can be picked: shipped, or the preview is on for this device. */
export function rules2024Available(): boolean {
  return RULESET_2024_READY || previewOn();
}

/** Reads ?rules2024 from the page address and saves the preview setting. */
export function syncRules2024Preview(search: string): void {
  const params = new URLSearchParams(search);
  if (!params.has("rules2024")) return;
  try {
    if (params.get("rules2024") === "off") localStorage.removeItem(RULES_2024_PREVIEW_KEY);
    else localStorage.setItem(RULES_2024_PREVIEW_KEY, "1");
  } catch {}
}

/** The rule set a character uses: 2014 unless it says 2024 and 2024 can be picked. */
export function rulesetOf(character: { ruleset?: string } | null | undefined): Ruleset {
  return character?.ruleset === "2024" && rules2024Available() ? "2024" : "2014";
}

/** The source id of the 2024 Player's Handbook content beyond SRD 5.2 (written in our own words). */
export const PHB_2024 = "PHB2024";

/** The books a new character starts with: the 2024 Player's Handbook is on by default for 2024. */
export function defaultSources(ruleset: Ruleset): string[] {
  return ruleset === "2024" ? ["PHB", PHB_2024] : ["PHB"];
}
