import type { Character } from "./storage";

/**
 * Fields that are not about the level: changes made to them after a level-up
 * survive an undo (gear bought, coins spent, the backstory written since).
 */
const KEEP_ON_UNDO = [
  "name", "playerName", "gender", "alignment", "background", "experiencePoints", "inspiration",
  "personalityTrait1", "personalityTrait2", "ideal", "bond", "flaw", "appearance",
  "inventory", "currency", "coinsInInventory", "otherProficiencies",
] as const satisfies readonly (keyof Character)[];

/** The level-up result, carrying the character as it was before, for one undo. */
export function withLevelSnapshot(before: Character, after: Character): Character {
  if ((after.level || 1) <= (before.level || 1)) return after;
  const { levelUpSnapshot: _older, ...plain } = before;
  return { ...after, levelUpSnapshot: { level: before.level || 1, at: Date.now(), character: plain } };
}

/** The character from before the last level-up, keeping the non-level fields as they are now. */
export function undoLevelUp(current: Character): Character | null {
  const snap = current.levelUpSnapshot;
  if (!snap || snap.level >= (current.level || 1)) return null;
  const kept = Object.fromEntries(KEEP_ON_UNDO.map((k) => [k, current[k]])) as Partial<Character>;
  // Features the player made or removed by hand since stay that way.
  const removed = new Set(current.removedFeatures || []);
  const features = [
    ...(snap.character.features || []).filter((f) => !f.byPlayer && (f.source === "custom" || !removed.has(f.name))),
    ...(current.features || []).filter((f) => f.byPlayer),
  ];
  const restored: Character = { ...(snap.character as Character), ...kept, features, removedFeatures: current.removedFeatures, id: current.id, createdAt: current.createdAt, levelUpSnapshot: undefined };
  // Damage taken since can't leave more HP than the old maximum.
  return { ...restored, currentHp: Math.min(restored.maxHp, current.currentHp ?? restored.currentHp) };
}
