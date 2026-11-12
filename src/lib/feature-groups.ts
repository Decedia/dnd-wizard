import { getFeatOptionGroups } from "@/data/feat-options";
import { decodeFeatOptions } from "./feat-grants";
import type { Character } from "./storage";

/** The sheet's feature groups, in display order. "use" holds anything with an action cost or uses. */
export type FeatureGroup = "use" | "class" | "subclass" | "race" | "feat" | "other";
export const FEATURE_GROUP_ORDER: FeatureGroup[] = ["use", "class", "subclass", "race", "feat", "other"];

const split = (values: unknown[] | undefined) =>
  (values || []).flatMap((v) => String(v).split(", ")).map((v) => v.trim()).filter(Boolean);

/**
 * What the player picked for a class or subclass feature. Picks are stored under
 * `class-feature-<level>-<name>`, `subclass-feature-<level>-<name>` or
 * `feature-<name>`, and a feature's later picks carry its name as a prefix
 * ("Path of the Kensei: 6th-level Weapon"), so those count too.
 */
export function getFeaturePicks(character: Pick<Character, "featureSelections">, featureName: string): string[] {
  const out: string[] = [];
  for (const [key, values] of Object.entries(character.featureSelections || {})) {
    if (key.endsWith("-options")) continue;
    const m = key.match(/^(?:class-feature-|subclass-feature-)\d+-(.+)$/) || key.match(/^feature-(.+)$/);
    if (!m) continue;
    const name = m[1];
    if (name !== featureName && name.split(":")[0].trim() !== featureName) continue;
    for (const v of split(values)) if (!out.includes(v)) out.push(v);
  }
  return out;
}

/** The feats taken at Ability Score Improvement levels, in level order. */
export function getAsiFeats(character: Pick<Character, "featureSelections">): { level: number; feat: string }[] {
  const out: { level: number; feat: string }[] = [];
  for (const [key, values] of Object.entries(character.featureSelections || {})) {
    const m = key.match(/^asi-feat-(\d+)$/);
    const feat = split(values)[0];
    if (m && feat) out.push({ level: Number(m[1]), feat });
  }
  return out.sort((a, b) => a.level - b.level);
}

/** Feats the rules let a character take more than once, each time with a new pick. */
export const REPEATABLE_FEATS = new Set(["Elemental Adept"]);

/**
 * A feat's level and the options picked for it: "+1 WIS", a spell name. A feat
 * taken at an ASI level is stored as `asi-feat-<level>`, a Variant Human's as
 * `variant-human-feat`; the options sit under the same key plus `-options`.
 * A feat taken more than once (Elemental Adept) lists every pick, at its
 * first level.
 */
export function getFeatPicks(
  character: Pick<Character, "featureSelections"> & { ruleset?: string },
  featName: string
): { taken: boolean; level: number | null; picks: string[] } {
  const selections = character.featureSelections || {};
  let taken = false;
  let level: number | null = null;
  const picks: string[] = [];
  for (const [key, values] of Object.entries(selections)) {
    const asi = key.match(/^asi-feat-(\d+)$/);
    if (!asi && !/^(variant-human-feat|origin-feat-(background|species))$/.test(key)) continue;
    if (!(values || []).includes(featName)) continue;
    const at = asi ? Number(asi[1]) : 1;
    if (!taken || at < (level ?? 1)) level = asi ? at : null;
    taken = true;
    const options = decodeFeatOptions(selections[`${key}-options`]);
    for (const group of getFeatOptionGroups(featName, character.ruleset)) {
      for (const [id, value] of Object.entries(options)) {
        if (id !== group.id && id.replace(/_\d+$/, "") !== group.id) continue;
        const label = group.choices?.find((c) => c.value === value)?.label ?? value;
        const pick = group.id.startsWith("ability") ? `+1 ${label}` : label;
        if (!picks.includes(pick)) picks.push(pick);
      }
    }
  }
  return { taken, level, picks };
}

/** Whether a feature row matches the search text: its name, summary or picks. */
export function matchesFeatureSearch(query: string, parts: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => (p || "").toLowerCase().includes(q));
}

/**
 * The character field holding a pool's maximum, by the sheet's naming:
 * `rages` and `maxRages`, `kiPoints` and `maxKiPoints`. Null when the
 * character has no positive maximum for it.
 */
export function poolMax(character: Character, field: keyof Character): number | null {
  const name = String(field);
  const value = (character as any)[`max${name[0].toUpperCase()}${name.slice(1)}`];
  return typeof value === "number" && value > 0 ? value : null;
}
