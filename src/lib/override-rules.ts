import { computeDerivedStats, getPassiveScore, SKILLS, type Character } from "./storage";
import { ruleMaxHp } from "./storage";
import { ruleSkillBonus } from "./skill-bonus";
import { getWeaponAttackDetails } from "./weapon-attacks";
import { overrideOf, setOverride, type NumberOverride, type OverrideKey } from "./overrides";

/** The character with one override taken off, to see what the rules say. */
function without(character: Character, key: OverrideKey): Character {
  const overrides = { ...(character.overrides || {}) };
  delete overrides[key];
  return { ...character, overrides };
}

/** What the rules give for a number, ignoring the player's override of it. */
export function ruleValueOf(character: Character, key: OverrideKey): number {
  const c = without(character, key);
  const [kind, name] = key.split(":");
  if (kind === "skill") return ruleSkillBonus(c, name, SKILLS.find((s) => s.name === name)?.ability || "str");
  if (kind === "passive") return getPassiveScore(c, name as "Perception" | "Insight" | "Investigation");
  if (kind === "attack") {
    const attack = (c.attacks || []).find((a) => a.id === name) ?? { id: name, name, attackBonus: 0, damageType: "" };
    return getWeaponAttackDetails(c, attack)?.attackBonus ?? 0;
  }
  if (key === "maxHp") return ruleMaxHp(c) ?? overrideOf(character, "maxHp")?.before ?? c.maxHp ?? 0;
  const derived = computeDerivedStats(c);
  if (kind === "save") return derived.savingThrows?.[name]?.value ?? 0;
  return Number((derived as Record<string, unknown>)[key] ?? 0);
}

/** "Add" works only where there's a rules number to add to. */
export function canAddTo(character: Character, key: OverrideKey): boolean {
  return key !== "maxHp" || ruleMaxHp(character) !== null;
}

/** The patch for saving or clearing an override, putting an old save's HP back when cleared. */
export function overridePatch(character: Character, key: OverrideKey, value: NumberOverride | null): Partial<Character> {
  const old = overrideOf(character, key);
  if (key === "maxHp") {
    if (value && ruleMaxHp(character) === null) {
      return { ...setOverride(character, key, { ...value, mode: "set", before: old?.before ?? character.maxHp }) };
    }
    // The override was written into the saved maximum; put the rules' number back.
    if (!value && old) {
      const maxHp = ruleMaxHp(character) ?? old.before ?? character.maxHp;
      return { ...setOverride(character, key, null), maxHp, currentHp: Math.min(character.currentHp || 0, maxHp) };
    }
  }
  return setOverride(character, key, value);
}
