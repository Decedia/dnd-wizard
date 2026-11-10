import type { Character } from "@/lib/storage";

/**
 * Starting gold. A new character either takes the class and background gear
 * or, as the rulebook allows, gold instead of all of it. A character made
 * above level 1 also gets extra gold for the adventures it already had.
 */

/** Gold instead of gear, by class: roll `count`d4 and multiply (PHB chapter 5; Artificer from Tasha's). */
export const STARTING_WEALTH: Record<string, { count: number; times: number }> = {
  Barbarian: { count: 2, times: 10 },
  Bard: { count: 5, times: 10 },
  Cleric: { count: 5, times: 10 },
  Druid: { count: 2, times: 10 },
  Fighter: { count: 5, times: 10 },
  Monk: { count: 5, times: 1 },
  Paladin: { count: 5, times: 10 },
  Ranger: { count: 5, times: 10 },
  Rogue: { count: 4, times: 10 },
  Sorcerer: { count: 3, times: 10 },
  Warlock: { count: 4, times: 10 },
  Wizard: { count: 4, times: 10 },
  Artificer: { count: 5, times: 10 },
};

export interface GoldRoll {
  /** Fixed gold on top of the dice. */
  base: number;
  count: number;
  sides: number;
  times: number;
}

export interface StartingGold {
  /** "gear": the class and background gear. "gold": gold instead of all of it. */
  mode: "gear" | "gold";
  /** Gold taken instead of gear (mode "gold"). */
  gold: number;
  /** Extra gold for starting above level 1. */
  extra: number;
}

export function wealthRoll(className: string | undefined): GoldRoll | null {
  const w = className ? STARTING_WEALTH[className] : undefined;
  return w ? { base: 0, count: w.count, sides: 4, times: w.times } : null;
}

/** Extra gold for a character made at a higher level (DMG "Starting at Higher Level"); null below level 5. */
export function higherLevelRoll(level: number): GoldRoll | null {
  if (level >= 17) return { base: 20000, count: 1, sides: 10, times: 250 };
  if (level >= 11) return { base: 5000, count: 1, sides: 10, times: 250 };
  if (level >= 5) return { base: 500, count: 1, sides: 10, times: 25 };
  return null;
}

/** The usual result: the dice average times the multiplier (rounded down), plus the base. */
export function averageGold(r: GoldRoll): number {
  return r.base + Math.floor(((r.count * (r.sides + 1)) / 2) * r.times);
}

export function rollGold(r: GoldRoll, random: () => number = Math.random): { rolls: number[]; total: number } {
  const rolls = Array.from({ length: r.count }, () => Math.floor(random() * r.sides) + 1);
  return { rolls, total: r.base + rolls.reduce((a, b) => a + b, 0) * r.times };
}

/** "4d4 x 10 gp", "500 gp + 1d10 x 25 gp". */
export function goldFormula(r: GoldRoll): string {
  const dice = `${r.count}d${r.sides}${r.times > 1 ? ` x ${r.times}` : ""} gp`;
  return r.base ? `${r.base.toLocaleString("en-US")} gp + ${dice}` : dice;
}

/** The choice as saved during creation, with defaults: gear, the usual extra gold for the level. */
export function startingGoldOf(character: Pick<Character, "startingGold" | "class" | "level">): StartingGold {
  const saved = character.startingGold;
  const extraRoll = higherLevelRoll(character.level || 1);
  const wealth = wealthRoll(character.class);
  return {
    mode: saved?.mode === "gold" && wealth ? "gold" : "gear",
    gold: saved?.gold ?? (wealth ? averageGold(wealth) : 0),
    extra: extraRoll ? saved?.extra ?? averageGold(extraRoll) : 0,
  };
}

/** Rows that are starting gear from the class or the background (what "gold instead" gives up). */
export const isStartingGear = (row: Character["inventory"][number]) => row.isGranted || row.choiceGroupIndex !== undefined || !!row.grantedFrom?.startsWith("background:");

/** At the end of creation: drop the gear when gold was taken, and add the gold. */
export function applyStartingGold(character: Character): Character {
  const choice = startingGoldOf(character);
  const inventory = choice.mode === "gold" ? (character.inventory || []).filter((row) => !isStartingGear(row)) : character.inventory;
  const add = (choice.mode === "gold" ? choice.gold : 0) + choice.extra;
  const currency = { ...character.currency, gold: (character.currency?.gold || 0) + add };
  return { ...character, inventory, currency };
}
