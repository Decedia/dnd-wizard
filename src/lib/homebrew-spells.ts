// Spells the player makes up (homebrew): the hero keeps the numbers on the
// spell row, and the rest of the app reads them as if they were book spells.
import type { DicePart } from "@/data/spell-dice";
import { spellDamage, cantripTier, type DamagePart } from "./spell-dice";
import { spellcastingMod, spellcastingSource, spellHealing, type Healing } from "./healing";
import { spellNumbersFor } from "./roll-parts";
import type { BonusPart } from "./dice-roll";
import type { Character } from "./storage";

export type HomebrewCast = "action" | "bonus" | "reaction";
export type HomebrewHit = "attack" | "save" | "auto";
export type HomebrewDuration = "instant" | "1 round" | "1 minute" | "10 minutes" | "1 hour" | "8 hours" | "24 hours";
export type SaveAbility = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

export const HOMEBREW_CASTS: HomebrewCast[] = ["action", "bonus", "reaction"];
export const HOMEBREW_HITS: HomebrewHit[] = ["attack", "save", "auto"];
export const HOMEBREW_DURATIONS: HomebrewDuration[] = ["instant", "1 round", "1 minute", "10 minutes", "1 hour", "8 hours", "24 hours"];
export const HOMEBREW_RANGES = ["Self", "Touch", "30 ft", "60 ft", "120 ft"];
export const SAVE_ABILITIES: SaveAbility[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
export const HOMEBREW_DICE = [4, 6, 8, 10, 12];
export const HOMEBREW_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder", "healing"];

const SAVE_NAMES: Record<SaveAbility, string> = { STR: "Strength", DEX: "Dexterity", CON: "Constitution", INT: "Intelligence", WIS: "Wisdom", CHA: "Charisma" };

export interface HomebrewSpell {
  castingTime: HomebrewCast;
  /** "Self", "Touch", "60 ft" or anything the player typed. */
  range: string;
  hit: HomebrewHit;
  /** Attack roll: true adds `attackBonus` to the hero's spell attack, false uses `attackBonus` alone. */
  useSpellAttack: boolean;
  attackBonus: number;
  saveAbility: SaveAbility;
  halfOnSave: boolean;
  /** Damage (or healing) dice; 0 for a spell that deals none. */
  diceCount: number;
  die: number;
  /** A damage type, or "healing". */
  damageType: string;
  /** Adds the spellcasting ability modifier to the roll. */
  addMod: boolean;
  /** Gets more dice: per slot level above for a leveled spell, at levels 5, 11 and 17 for a cantrip. */
  scales: boolean;
  /** Dice added per slot level above the spell's level. */
  scaleDice: number;
  duration: HomebrewDuration;
  concentration: boolean;
  /** Takes a known or prepared spot like a book spell. Off: always ready, never counted. */
  counts: boolean;
}

type SpellRow = Character["spells"][number];

export const isHomebrew = (row: Pick<SpellRow, "homebrew"> | undefined): row is SpellRow & { homebrew: HomebrewSpell } => !!row?.homebrew;

/** False for a homebrew spell the player set to stay out of the known and prepared counts. */
export const countsTowardLimit = (row: Pick<SpellRow, "homebrew">) => !row.homebrew || row.homebrew.counts;

/** A fresh form: one action, a spell attack, 1d10 fire, instant. Non-casters type their own to-hit bonus. */
export function newHomebrew(character: Pick<Character, "spellcastingAbility">): HomebrewSpell {
  const caster = !!character.spellcastingAbility;
  return {
    castingTime: "action",
    range: "60 ft",
    hit: "attack",
    useSpellAttack: caster,
    attackBonus: caster ? 0 : 5,
    saveAbility: "DEX",
    halfOnSave: true,
    diceCount: 1,
    die: 10,
    damageType: "fire",
    addMod: false,
    scales: true,
    scaleDice: 1,
    duration: "instant",
    concentration: false,
    counts: false,
  };
}

/** A new spell row for the hero. */
export function homebrewRow(id: string, name: string, level: number, effect: string, homebrew: HomebrewSpell): SpellRow & { homebrew: HomebrewSpell } {
  return { id, name: name.trim(), level, source: "custom", description: effect.trim(), summary: effect.trim(), homebrew: cleanHomebrew(homebrew, level) };
}

/** Numbers kept in range; the spell level decides what scaling means. */
export function cleanHomebrew(h: HomebrewSpell, level: number): HomebrewSpell {
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));
  return {
    ...h,
    attackBonus: clamp(h.attackBonus, -5, 20),
    diceCount: clamp(h.diceCount, 0, 40),
    die: HOMEBREW_DICE.includes(h.die) ? h.die : 6,
    scaleDice: level === 0 ? 0 : clamp(h.scaleDice, 0, 10),
    range: (h.range || "").trim() || "Self",
  };
}

const CAST_TEXT: Record<HomebrewCast, string> = { action: "1 action", bonus: "1 bonus action", reaction: "1 reaction" };

/** Duration in the words the timers read ("Concentration, up to 1 minute"). */
export function homebrewDurationText(h: Pick<HomebrewSpell, "duration" | "concentration">): string {
  if (h.duration === "instant") return "Instantaneous";
  return h.concentration ? `Concentration, up to ${h.duration}` : h.duration;
}

const heals = (h: HomebrewSpell) => h.damageType === "healing";

/** Healing dice by slot level, in the shape book spells use ("2d8 + MOD"). */
function healTable(h: HomebrewSpell, level: number, characterLevel: number): Record<string, string> | undefined {
  if (!heals(h) || h.diceCount <= 0) return undefined;
  const mod = h.addMod ? " + MOD" : "";
  if (level === 0) return { "0": `${h.diceCount * (h.scales ? cantripTier(characterLevel) : 1)}d${h.die}${mod}` };
  const table: Record<string, string> = {};
  for (let slot = level; slot <= 9; slot++) table[String(slot)] = `${h.diceCount + (h.scales ? h.scaleDice * (slot - level) : 0)}d${h.die}${mod}`;
  return table;
}

/**
 * The spell in the shape of the spell data, so the turn helper, timers and
 * suggestions read it like a book spell. `homebrew` stays on it for the numbers.
 */
export function homebrewAsSrd(row: SpellRow & { homebrew: HomebrewSpell }, characterLevel = 1) {
  const h = row.homebrew;
  const damage = h.diceCount > 0 && !heals(h) ? { damageType: h.damageType, damageDice: `${h.diceCount}d${h.die}` } : undefined;
  return {
    name: row.name,
    level: row.level,
    castingTime: CAST_TEXT[h.castingTime],
    range: h.range,
    duration: homebrewDurationText(h),
    concentration: h.concentration,
    description: row.description || "",
    effectSummary: row.description || "",
    saveType: h.hit === "save" ? SAVE_NAMES[h.saveAbility] : null,
    attackType: h.hit === "attack" ? (/^touch$/i.test(h.range) ? "melee" : "ranged") : undefined,
    onHit: h.hit === "auto" ? "automatically hits" : null,
    damage,
    heal_at_slot_level: healTable(h, row.level, characterLevel),
    homebrew: h,
    homebrewId: row.id,
  };
}

/**
 * Spell data with the hero's homebrew spells in it. A homebrew spell with a
 * book spell's name hides the book one for this hero.
 */
export function withHomebrew<T extends { name: string }>(character: Pick<Character, "spells" | "level">, srdSpells: T[]): (T | ReturnType<typeof homebrewAsSrd>)[] {
  const own = (character.spells || []).filter(isHomebrew);
  if (!own.length) return srdSpells;
  const names = new Set(own.map((s) => s.name.toLowerCase()));
  return [...srdSpells.filter((s) => !names.has(s.name.toLowerCase())), ...own.map((s) => homebrewAsSrd(s, character.level || 1))];
}

/** Damage dice at the slot it is cast with (its own level when left out). Null when it deals none. */
export function homebrewDamage(character: Character, row: SpellRow & { homebrew: HomebrewSpell }, slot = row.level): DamagePart[] | null {
  const h = row.homebrew;
  if (h.diceCount <= 0 || heals(h)) return null;
  const part: DicePart = { dice: `${h.diceCount}d${h.die}`, type: h.damageType };
  if (h.addMod) part.mod = true;
  if (h.scales && row.level === 0) part.cantrip = true;
  if (h.scales && row.level > 0 && h.scaleDice > 0) part.up = `${h.scaleDice}d${h.die}`;
  return spellDamage(row.name, row.level, { slot: Math.max(slot, row.level), characterLevel: character.level || 1, mod: spellcastingMod(character), modSource: spellcastingSource(character) }, [], [part]);
}

/** Healing at the slot it is cast with, Life Domain bonuses included. Null when it does not heal. */
export function homebrewHealing(character: Character, row: SpellRow & { homebrew: HomebrewSpell }, slot = row.level): Healing | null {
  const table = healTable(row.homebrew, row.level, character.level || 1);
  return table ? spellHealing(character, { name: row.name, level: row.level, heal_at_slot_level: table }, slot) : null;
}

/** The to-hit bonus for an attack-roll spell, with where each part comes from. */
export function homebrewAttack(character: Character, row: SpellRow & { homebrew: HomebrewSpell }): { attack: number; parts: BonusPart[] } | null {
  const h = row.homebrew;
  if (h.hit !== "attack") return null;
  if (!h.useSpellAttack) return { attack: h.attackBonus, parts: [{ source: row.name, value: h.attackBonus }] };
  const numbers = spellNumbersFor(character);
  return {
    attack: numbers.attack + h.attackBonus,
    parts: [...numbers.parts, ...(h.attackBonus ? [{ source: row.name, value: h.attackBonus }] : [])],
  };
}

/** The save DC for a saving-throw spell. */
export function homebrewSaveDc(character: Character, row: SpellRow & { homebrew: HomebrewSpell }): number | undefined {
  return row.homebrew.hit === "save" ? spellNumbersFor(character).dc || undefined : undefined;
}
