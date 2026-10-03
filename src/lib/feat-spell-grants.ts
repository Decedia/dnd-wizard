/**
 * Extracts the spell-grant *selections* recorded on a feat's `spell_grant` effect.
 *
 * Unlike a fixed grant (exact named spells), a selection says "learn N spells
 * of this type from these class lists". This is what Magic Initiate, Ritual
 * Caster, Fey Touched, Shadow Touched and Aberrant Dragonmark use. The
 * `count` field states how many must be chosen; the `from` lists are the valid
 * class lists to choose from.
 *
 * Returns a flat list of individual spell slots the character must fill, each
 * carrying the pool it may be taken from. Example for Magic Initiate (PHB):
 *   [ { kind: "cantrip", count: 2, from: [bard, cleric, ...] },
 *     { kind: "spell", level: 1, count: 1, from: [bard, cleric, ...] } ]
 * Total selection size = sum of all counts.
 */
import type { Effect, FeatureBase } from "@/data/engine/types";

export interface SpellGrantSelection {
  kind: "cantrip" | "spell";
  level: number;
  count: number;
  from: string[];
  ritual?: boolean;
}

/** Return the flat list of spell slots granted as a selection, or [] if this effect is a fixed grant. */
export function getFeatSpellSelections(feature: FeatureBase): SpellGrantSelection[] {
  const selections: SpellGrantSelection[] = [];
  for (const effect of feature.effects ?? []) {
    if (effect.kind !== "spell_grant") continue;
    const cantripEntry = effect.cantrip;
    if (cantripEntry) {
      const classList = collectFromClassLists(effect);
      selections.push({
        kind: "cantrip",
        level: 0,
        count: cantripEntry.count ?? 1,
        from: classList,
      });
    }
    for (const spellEntry of effect.spells ?? []) {
      if (!spellEntry.level) continue;
      const classList = collectFromClassLists(effect);
      selections.push({
        kind: "spell",
        level: spellEntry.level,
        count: spellEntry.count ?? 1,
        from: classList,
        ritual: spellEntry.ritual ?? false,
      });
    }
  }
  return selections;
}

function collectFromClassLists(effect: Extract<Effect, { kind: "spell_grant" }>): string[] {
  const seen = new Set<string>();
  for (const s of effect.spells ?? []) {
    for (const c of s.from ?? []) seen.add(c);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Sum the total number of spell slots this feat grants as a selection. */
export function getFeatSpellSelectionSize(feature: FeatureBase): number {
  return getFeatSpellSelections(feature).reduce((sum, s) => sum + s.count, 0);
}
