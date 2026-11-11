import type { Character, CustomFeatureTurn } from "./storage";
import { applySubclassFeatures, syncBaseFeatures } from "./character-creation";

type Feature = Character["features"][number];

/** What the player types in the feature form. */
export interface FeatureDraft {
  name: string;
  description: string;
  /** Absent: always on, nothing to tap. */
  turn?: CustomFeatureTurn | null;
}

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isCustom = (f: Feature) => !f.source || f.source === "custom";

/** Rule features with this name the player took off; syncing leaves them out. */
function withRemoved(character: Character, name: string): string[] {
  return [...new Set([...(character.removedFeatures || []), name])];
}

/**
 * Saves the feature form. A new feature or an edit of the player's own one is
 * stored as typed. An edit of a rule feature (Rage, Darkvision) becomes the
 * player's own copy, and the rule one is marked removed, so a level-up or a
 * sync doesn't put the old text back next to it.
 */
export function saveFeatureEdit(character: Character, editingId: string | null, draft: FeatureDraft): Partial<Character> {
  const name = draft.name.trim();
  if (!name) return {};
  const features = character.features || [];
  const old = editingId ? features.find((f) => f.id === editingId) : undefined;
  const row: Feature = {
    ...(old && isCustom(old) ? old : {}),
    id: old && isCustom(old) ? old.id : newId(),
    name,
    description: draft.description.trim(),
    source: "custom",
    byPlayer: true,
    locked: false,
    // Recomputed from the new text on load.
    summary: null,
    turn: draft.turn ?? null,
  };
  if (!old) return { features: [...features, row] };
  const patch: Partial<Character> = { features: features.map((f) => (f.id === old.id ? row : f)) };
  if (!isCustom(old)) patch.removedFeatures = withRemoved(character, old.name);
  return patch;
}

/** Deletes a feature. A rule feature stays gone after a level-up until restored. */
export function removeFeature(character: Character, id: string): Partial<Character> {
  const features = character.features || [];
  const target = features.find((f) => f.id === id);
  if (!target) return {};
  // Every row of that rule feature goes (Ability Score Improvement repeats).
  const kept = isCustom(target) ? features.filter((f) => f.id !== id) : features.filter((f) => isCustom(f) || f.name !== target.name);
  const patch: Partial<Character> = { features: kept };
  if (!isCustom(target)) patch.removedFeatures = withRemoved(character, target.name);
  return patch;
}

/**
 * Puts a removed rule feature back as the rules give it. The player's own copy
 * with the same name goes, since the rule one replaces it.
 */
export function restoreFeature(character: Character, name: string, language = "en"): Character {
  const next: Character = {
    ...character,
    removedFeatures: (character.removedFeatures || []).filter((n) => n !== name),
    features: (character.features || []).filter((f) => !(isCustom(f) && f.name === name)),
  };
  return syncBaseFeatures(applySubclassFeatures(next, language), language);
}
