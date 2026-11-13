import { getStaticRace } from "./srd-client";
import { computeBuffModifiers } from "./spellEffects";
import { getFeatPicks, getFeaturePicks } from "./feature-groups";
import { isRaging } from "./weapon-attacks";
import type { Character } from "./storage";

/**
 * Damage the character takes less of: Resistance halves it, Immunity stops it.
 * Hand-checked against the rules, from the species, class and subclass
 * features, feats and active spells the character has.
 */

export const DAMAGE_TYPES = ["Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"] as const;

export interface Resistance {
  /** A damage type from DAMAGE_TYPES. */
  type: string;
  /** Where it comes from (a trait, feature, feat or spell name). */
  source: string;
  /** Immunity: no damage at all. */
  immune?: boolean;
  /** Only while raging (it is listed either way, with this mark). */
  whileRaging?: boolean;
}

/** Damage type words in a text, in DAMAGE_TYPES spelling. */
export function damageTypesIn(text: string): string[] {
  return DAMAGE_TYPES.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(text));
}

/** Types named in "resistance to X (and Y) damage" in a species trait. */
function traitResistances(description: string): string[] {
  const out: string[] = [];
  // "Resistance to Necrotic damage and Radiant damage": every type up to the end of the sentence.
  for (const m of description.matchAll(/resistance (?:to|against) ([^.]*?damage(?: and [a-z]+ damage)?)/gi)) out.push(...damageTypesIn(m[1]));
  return out;
}

function speciesResistances(character: Character): Resistance[] {
  const race = character.race ? getStaticRace(character.race, character.ruleset) : undefined;
  if (!race) return [];
  const out: Resistance[] = [];
  // A trait that is a choice (Fiendish Legacy lists every legacy's resistance) counts through the pick below.
  const choiceNames = new Set((race.choices || []).map((c) => c.name));
  for (const trait of race.traits || []) {
    if (choiceNames.has(trait.name)) continue;
    for (const type of traitResistances(trait.description || "")) out.push({ type, source: trait.name });
  }
  // A picked option that sets the type: Tiefling legacy (`resistance`), Dragonborn ancestry (named in its text).
  const picksType = (race.traits || []).some((t) => t.name === "Damage Resistance");
  for (const choice of race.choices || []) {
    const option = choice.options?.find((o) => o.id === character.raceChoices?.[choice.id]) as { name: string; description?: string; resistance?: string } | undefined;
    if (!option) continue;
    if (option.resistance) out.push({ type: option.resistance, source: option.name });
    else if (picksType) {
      const type = damageTypesIn(option.description || "")[0];
      if (type) out.push({ type, source: "Damage Resistance" });
    }
  }
  return out;
}

const GENIE_GIFT: Record<string, string> = { Dao: "Bludgeoning", Djinni: "Thunder", Efreeti: "Fire", Marid: "Cold" };

/** Feature rules: a feature name, and what it gives the character who has it. */
const FEATURE_RESISTANCES: { name: RegExp; types: (c: Character) => string[]; immune?: boolean; whileRaging?: boolean; ruleset?: "2014" | "2024" }[] = [
  { name: /^Rage$/, types: () => ["Bludgeoning", "Piercing", "Slashing"], whileRaging: true },
  // Path of the Totem Warrior: the Bear spirit resists everything but Psychic while raging.
  { name: /^Totem Spirit/, types: (c) => (getFeaturePicks(c, "Totem Spirit").includes("Bear") ? DAMAGE_TYPES.filter((t) => t !== "Psychic") : []), whileRaging: true },
  { name: /^Soul of the Forge/, types: () => ["Fire"] },
  { name: /^Radiant Soul/, types: (c) => (c.class === "Warlock" ? ["Radiant"] : []) },
  { name: /^Heart of the Storm/, types: () => ["Lightning", "Thunder"] },
  { name: /^Elemental Affinity/, types: (c) => getFeaturePicks(c, "Elemental Affinity").flatMap(damageTypesIn).slice(0, 1), ruleset: "2024" },
  { name: /^Elemental Gift/, types: (c) => getFeaturePicks(c, "Genie Patron").map((k) => GENIE_GIFT[k]).filter(Boolean) },
  { name: /^Purity of Body/, types: () => ["Poison"], immune: true, ruleset: "2014" },
  { name: /^Nature's Ward/, types: () => ["Poison"], immune: true, ruleset: "2014" },
  { name: /^Infernal Constitution/, types: () => ["Cold", "Poison"] },
];

/** Every resistance and immunity the character has now, one row per type and source. */
export function damageResistances(character: Character): Resistance[] {
  const out: Resistance[] = speciesResistances(character);
  const ruleset = character.ruleset === "2024" ? "2024" : "2014";
  const names = new Set((character.features || []).map((f) => f.name || ""));
  for (const rule of FEATURE_RESISTANCES) {
    if (rule.ruleset && rule.ruleset !== ruleset) continue;
    const feature = [...names].find((n) => rule.name.test(n));
    if (!feature) continue;
    for (const type of rule.types(character)) out.push({ type, source: feature.replace(/ \(.*\)$/, ""), ...(rule.immune ? { immune: true } : {}), ...(rule.whileRaging ? { whileRaging: true } : {}) });
  }
  // Boon of Energy Resistance: two types picked with the feat.
  for (const pick of getFeatPicks(character, "Boon of Energy Resistance").picks) {
    for (const type of damageTypesIn(pick)) out.push({ type, source: "Boon of Energy Resistance" });
  }
  // Spells running on the character (Protection from Energy, Stoneskin...).
  for (const buff of character.activeBuffs || []) {
    for (const type of computeBuffModifiers([buff]).resistances) {
      const known = DAMAGE_TYPES.find((t) => t.toLowerCase() === type.toLowerCase());
      if (known) out.push({ type: known, source: buff.name || "Spell" });
    }
  }
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = `${r.type}|${r.source}|${r.immune ? 1 : 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The resistances that count right now (rage-only ones only while raging). */
export function activeResistances(character: Character): Resistance[] {
  const raging = isRaging(character);
  return damageResistances(character).filter((r) => !r.whileRaging || raging);
}

/** Damage after resistance (half, rounded down) or immunity (none). */
export function reducedDamage(amount: number, how: "normal" | "resist" | "immune"): number {
  if (how === "immune") return 0;
  return how === "resist" ? Math.floor(amount / 2) : amount;
}
