import { getModifier, type Character } from "@/lib/storage";
import type { SpellDamageBonus } from "@/lib/spell-damage-bonus";
import type { BonusPart } from "@/lib/dice-roll";

/**
 * How much a healing spell or feature heals, so a tap in the turn helper can
 * add the HP instead of leaving the player to do it with the Heal button.
 */

export interface Healing {
  /** Dice to roll, e.g. "2d8"; empty for a fixed amount. */
  dice: string;
  /** Added to the roll (spellcasting modifier, fighter level, healing bonuses). */
  bonus: number;
  /** Roll every die at its highest (Supreme Healing). */
  maxDice?: boolean;
  /** Only the character can be healed (Second Wind, Wholeness of Body). */
  selfOnly?: boolean;
  /** Healing someone else also heals the caster this much (Blessed Healer). */
  selfWhenOther?: number;
  /** Where the bonus comes from, for the sheet ("Disciple of Life +4"). */
  notes: { source: string; value: number }[];
  /** All of `bonus`, part by part, for the dice tray (the modifier, the level, the notes). */
  parts?: BonusPart[];
}

export interface HealingSpell {
  name: string;
  level: number;
  heal_at_slot_level?: unknown;
}

const ABILITY_BY_CLASS: Record<string, "int" | "wis" | "cha"> = {
  Bard: "cha", Cleric: "wis", Druid: "wis", Paladin: "cha", Ranger: "wis", Sorcerer: "cha", Warlock: "cha", Wizard: "int", Artificer: "int",
};

const has = (character: Character, name: string) =>
  (character.features || []).some((f) => (f.name || "").startsWith(name));

const spellcastingKey = (character: Character) => (character.spellcastingAbility as "int" | "wis" | "cha") || ABILITY_BY_CLASS[character.class || ""];

export function spellcastingMod(character: Character): number {
  const key = spellcastingKey(character);
  return key ? getModifier((character[key] as number) ?? 10) : 0;
}

/** The spellcasting ability as a roll source ("@wis"). */
export const spellcastingSource = (character: Character) => `@${spellcastingKey(character) || "other"}`;

/** Spells that give temporary or extra max HP are not healing (False Life, Aid). */
const NOT_HEALING = new Set(["False Life", "Aid"]);

/** Healing for a spell cast with a slot of `slotLevel` (0 for a cantrip), or null when it does not heal. */
export function spellHealing(character: Character, spell: HealingSpell, slotLevel: number): Healing | null {
  if (NOT_HEALING.has(spell.name)) return null;
  const table = spell.heal_at_slot_level as Record<string, string> | undefined;
  if (!table || typeof table !== "object") return null;
  const levels = Object.keys(table).map(Number).sort((a, b) => a - b);
  const at = levels.filter((l) => l <= Math.max(slotLevel, spell.level)).pop() ?? levels[0];
  const formula = String(table[String(at)] || "");
  const dice = (/(\d+d\d+)/.exec(formula) || [])[1] || "";
  const fixed = /^\s*(\d+)\s*$/.test(formula) ? Number(formula) : 0;
  const flat = /\+\s*(\d+)/.exec(formula);
  const parts: BonusPart[] = [];
  if (fixed) parts.push({ source: spell.name, value: fixed });
  if (/MOD/.test(formula)) parts.push({ source: spellcastingSource(character), value: spellcastingMod(character) });
  else if (flat) parts.push({ source: spell.name, value: Number(flat[1]) });
  let bonus = parts.reduce((a, p) => a + p.value, 0);
  const notes: Healing["notes"] = [];
  const level = Math.max(slotLevel, spell.level);
  // Life Domain, level 1: healing spells of 1st level or higher heal 2 + the spell's level more.
  if (has(character, "Disciple of Life") && level >= 1) {
    bonus += 2 + level;
    notes.push({ source: "Disciple of Life", value: 2 + level });
  }
  const healing: Healing = { dice, bonus, notes, parts: [...parts, ...notes] };
  // Life Domain, level 17: use the highest number for each die.
  if (has(character, "Supreme Healing") && dice) healing.maxDice = true;
  // Life Domain, level 6: healing someone else with a 1st-level or higher spell heals you 2 + the spell's level.
  if (has(character, "Blessed Healer") && level >= 1) healing.selfWhenOther = 2 + level;
  return healing;
}

/** Healing for a feature tap, or null when the feature does not heal. `amount` is the Lay on Hands pick. */
export function featureHealing(character: Character, featureName: string, amount?: number): Healing | null {
  const level = character.level || 1;
  if (/^Second Wind/.test(featureName)) return { dice: "1d10", bonus: level, selfOnly: true, notes: [], parts: [{ source: "@level", value: level }] };
  if (/^Wholeness of Body/.test(featureName)) {
    if (character.ruleset !== "2024") return { dice: "", bonus: 3 * level, selfOnly: true, notes: [] };
    // 2024: a roll of the Martial Arts die plus the Wisdom modifier (at least 1).
    const die = level >= 17 ? 12 : level >= 11 ? 10 : level >= 5 ? 8 : 6;
    const wis = Math.max(1, getModifier(character.wis ?? 10));
    return { dice: `1d${die}`, bonus: wis, selfOnly: true, notes: [], parts: [{ source: "@wis", value: wis }] };
  }
  // Aasimar: a d4 per Proficiency Bonus (2024), or HP equal to the level (2014).
  if (/^Healing Hands/.test(featureName)) {
    if (character.ruleset !== "2024") return { dice: "", bonus: level, notes: [] };
    return { dice: `${2 + Math.floor((level - 1) / 4)}d4`, bonus: 0, notes: [] };
  }
  if (/^Lay on Hands/i.test(featureName) && amount) return { dice: "", bonus: amount, notes: [] };
  if (/^Hand of Healing/.test(featureName)) {
    const die = level >= 17 ? 10 : level >= 11 ? 8 : level >= 5 ? 6 : 4;
    return { dice: `1d${die}`, bonus: getModifier(character.wis ?? 10), notes: [], parts: [{ source: "@wis", value: getModifier(character.wis ?? 10) }] };
  }
  return null;
}

const parseDice = (dice: string) => {
  const m = /^(\d+)d(\d+)$/.exec(dice);
  return m ? { count: Number(m[1]), sides: Number(m[2]) } : null;
};

/** The usual result: half the die plus a half per die, rounded down, plus the bonus. */
export function averageHealing(h: Healing): number {
  const d = parseDice(h.dice);
  const dice = !d ? 0 : h.maxDice ? d.count * d.sides : Math.floor((d.count * (d.sides + 1)) / 2);
  return Math.max(0, dice + h.bonus);
}

/** A random roll of the healing dice plus the bonus. */
export function rollHealing(h: Healing, random: () => number = Math.random): { rolls: number[]; total: number } {
  const d = parseDice(h.dice);
  const rolls = d ? Array.from({ length: d.count }, () => (h.maxDice ? d.sides : Math.floor(random() * d.sides) + 1)) : [];
  return { rolls, total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + h.bonus) };
}

/** HP after healing the character: capped at the maximum, and healing never lowers HP. */
export function healSelfPatch(character: Character, amount: number): Partial<Character> {
  const max = character.effectiveMaxHp || character.maxHp || 0;
  const now = character.currentHp || 0;
  const patch: Partial<Character> = { currentHp: Math.max(now, Math.min(max, now + Math.max(0, amount))) };
  // Any healing at 0 HP wakes the character and clears the death saves.
  if (now <= 0 && amount > 0) Object.assign(patch, { deathSaveSuccesses: 0, deathSaveFailures: 0 });
  return patch;
}

/** Healing bonuses as lines for spell rows ("+4 healing · Disciple of Life"). */
export function healingBonusLines(heal: Healing | null | undefined): SpellDamageBonus[] {
  if (!heal) return [];
  const lines: SpellDamageBonus[] = heal.notes.map((n) => ({ source: n.source, ability: "wis", value: n.value, per: "heal" }));
  if (heal.maxDice) lines.push({ source: "Supreme Healing", ability: "wis", value: 0, per: "maxDice" });
  return lines;
}
