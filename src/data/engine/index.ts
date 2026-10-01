/**
 * Generated barrel for the engine dataset. One import per feature file, because a
 * bundler cannot glob-import. Regenerate with scripts/gen-engine-index.mjs if files
 * are added, or `npm run engine:index`.
 *
 * Every entry flows into buildDataset(), which flattens the files, indexes them,
 * and hands the resolver a single lookup rather than making it walk directories.
 */

import class_barbarian from './features/class/barbarian.json';
import class_bard from './features/class/bard.json';
import class_cleric from './features/class/cleric.json';
import class_cleric_fighter from './features/class/cleric_fighter.json';
import class_druid from './features/class/druid.json';
import class_druid_monk from './features/class/druid_monk.json';
import class_fighter from './features/class/fighter.json';
import class_final_four from './features/class/final_four.json';
import class_paladin from './features/class/paladin.json';
import class_ranger_rogue from './features/class/ranger_rogue.json';
import class_sorcerer from './features/class/sorcerer.json';
import class_vocab_probe from './features/class/vocab_probe.json';
import class_vocab_probe2 from './features/class/vocab_probe2.json';
import feat_hard from './features/feat/hard.json';
import feat_mtf from './features/feat/mtf.json';
import feat_phb from './features/feat/phb.json';
import feat_tce from './features/feat/tce.json';
import race_dragonborn from './features/race/dragonborn.json';
import race_eberron from './features/race/eberron.json';
import race_extra_books from './features/race/extra_books.json';
import race_fill_gaps from './features/race/fill_gaps.json';
import race_omissions from './features/race/omissions.json';
import race_phb from './features/race/phb.json';
import race_phb_extra from './features/race/phb_extra.json';
import subclass_artificer from './features/subclass/artificer.json';
import subclass_barbarian from './features/subclass/barbarian.json';
import subclass_bard from './features/subclass/bard.json';
import subclass_cleric from './features/subclass/cleric.json';
import subclass_druid from './features/subclass/druid.json';
import subclass_fighter from './features/subclass/fighter.json';
import subclass_hard from './features/subclass/hard.json';
import subclass_monk from './features/subclass/monk.json';
import subclass_paladin from './features/subclass/paladin.json';
import subclass_ranger from './features/subclass/ranger.json';
import subclass_remaining from './features/subclass/remaining.json';
import subclass_rogue from './features/subclass/rogue.json';
import subclass_sorcerer from './features/subclass/sorcerer.json';
import subclass_warlock from './features/subclass/warlock.json';
import subclass_wizard from './features/subclass/wizard.json';

import vocabJson from "./vocab.json";
import classesJson from "./classes.json";
import racesJson from "./races.json";
import resourcesJson from "./resources.json";
import statesJson from "./states.json";
import formsJson from "./forms.json";

import type { EngineDataset, FeatureBase, ResourceDef, RaceDef } from "./types";

// JSON imports widen `kind` to string, which cannot satisfy the Effect discriminated
// union. The cast is the one place the widening is undone, and the validator is
// what guarantees these files actually conform.
const featureFiles = [
  class_barbarian,
  class_bard,
  class_cleric,
  class_cleric_fighter,
  class_druid,
  class_druid_monk,
  class_fighter,
  class_final_four,
  class_paladin,
  class_ranger_rogue,
  class_sorcerer,
  class_vocab_probe,
  class_vocab_probe2,
  feat_hard,
  feat_mtf,
  feat_phb,
  feat_tce,
  race_dragonborn,
  race_eberron,
  race_extra_books,
  race_fill_gaps,
  race_omissions,
  race_phb,
  race_phb_extra,
  subclass_artificer,
  subclass_barbarian,
  subclass_bard,
  subclass_cleric,
  subclass_druid,
  subclass_fighter,
  subclass_hard,
  subclass_monk,
  subclass_paladin,
  subclass_ranger,
  subclass_remaining,
  subclass_rogue,
  subclass_sorcerer,
  subclass_warlock,
  subclass_wizard,
] as unknown as { features: FeatureBase[] }[];

export interface BuiltDataset extends EngineDataset {
  /** Every feature, in file order. */
  all: FeatureBase[];
  /** engine id -> feature. */
  byId: Map<string, FeatureBase>;
  /**
   * "druid.wild_shape" -> feature, and "druid.wild" or "wild shape" -> the same
   * feature. Character features still carry the app's name-derived ids, so the
   * resolver needs to reach an engine feature from a display name and owner.
   */
  byName: Map<string, FeatureBase>;
}

let cached: BuiltDataset | null = null;

/** "Wild Shape" -> "wild_shape"; strips punctuation and case so the app's ids match. */
export function normaliseName(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function indexName(feature: FeatureBase): string {
  return feature.variant
    ? `${normaliseName(feature.owner)}.${normaliseName(feature.variant)}.${normaliseName(feature.name)}`
    : `${normaliseName(feature.owner)}.${normaliseName(feature.name)}`;
}

/**
 * Alias keys for one feature. The owner-scoped keys are the important ones:
 * "Rage" belongs to a barbarian, a cleric and a fighter with different
 * mechanics, so a bare name is ambiguous and the lookup has to be told the
 * owner. Both "barbarian.rage" and the kind-prefixed forms resolve.
 */
function nameAliases(feature: FeatureBase): string[] {
  const bare = normaliseName(feature.name);
  const owner = normaliseName(feature.owner);
  const variant = feature.variant ? normaliseName(feature.variant) : null;
  const stem = variant ? `${owner}.${variant}.${bare}` : `${owner}.${bare}`;
  return [
    stem,
    feature.kind === "subclass" ? `subclass.${stem}` : `${feature.kind}.${stem}`,
    bare,
    `${feature.kind}.${bare}`,
  ];
}

export function buildDataset(): BuiltDataset {
  if (cached) return cached;
  const all = featureFiles.flatMap((f) => f.features ?? []);
  const byId = new Map<string, FeatureBase>();
  const byName = new Map<string, FeatureBase>();
  for (const feature of all) {
    byId.set(feature.id, feature);
    for (const key of nameAliases(feature)) {
      if (!byName.has(key)) byName.set(key, feature);
    }
  }
  cached = {
    schemaVersion: (resourcesJson as { schemaVersion?: number }).schemaVersion ?? 1,
    ruleset: "2014",
    resources: (resourcesJson as { resources: ResourceDef[] }).resources,
    features: all,
    states: (statesJson as { states: EngineDataset["states"] }).states,
    all,
    byId,
    byName,
  };
  return cached;
}

/**
 * Find the engine feature behind a character feature. The app's own ids are
 * name-derived ("base-class-Rage"), so match on the owner and the display name
 * first and fall back to the exact engine id.
 */
export function findEngineFeature(
  owner: string | undefined,
  name: string,
  dataset: BuiltDataset = buildDataset()
): FeatureBase | null {
  if (dataset.byId.has(name)) return dataset.byId.get(name)!;
  const bare = normaliseName(name);
  if (owner) {
    const ownerKey = normaliseName(owner);
    // Try the owner-scoped key, then the kind-prefixed form of it.
    for (const prefix of ["", "subclass.", "class.", "feat.", "race."]) {
      const hit = dataset.byName.get(`${ownerKey}.${prefix}${bare}`);
      if (hit) return hit;
      const variant = dataset.byName.get(`${ownerKey}.${prefix}${bare}`);
      if (variant) return variant;
    }
  }
  // Only fall back to the bare name once the owner has failed to match, so an
  // ambiguous name still resolves to something rather than nothing.
  return dataset.byName.get(bare) ?? null;
}

export const classes = classesJson as EngineDataset extends never ? never : typeof classesJson;
export const races = racesJson as { races: RaceDef[] };
export const vocab = vocabJson;
export const forms = (formsJson as { forms: { id: string; name: string; cr: string; note?: string }[] }).forms;

