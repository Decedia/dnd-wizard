import { NO_DAMAGE_LINE, SPELL_DICE, type DicePart, type DiceWhen } from "@/data/spell-dice";
import { spellDamageBonuses, type SpellDamageBonus, type SpellForBonus } from "@/lib/spell-damage-bonus";
import { spellcastingMod, spellcastingSource } from "@/lib/healing";
import type { BonusPart } from "@/lib/dice-roll";
import type { Character } from "@/lib/storage";

/** Dice as counts per die size plus a flat number: "2d8+1d6+3" is {8: 2, 6: 1} and 3. */
interface Pool {
  dice: Record<number, number>;
  flat: number;
}

export function parseDice(text: string): Pool {
  const pool: Pool = { dice: {}, flat: 0 };
  for (const term of text.replace(/\s+/g, "").split("+").filter(Boolean)) {
    const m = /^(\d+)d(\d+)$/.exec(term);
    if (m) pool.dice[Number(m[2])] = (pool.dice[Number(m[2])] || 0) + Number(m[1]);
    else if (/^\d+$/.test(term)) pool.flat += Number(term);
  }
  return pool;
}

const addPools = (a: Pool, b: Pool, times = 1): Pool => {
  const dice = { ...a.dice };
  for (const [size, n] of Object.entries(b.dice)) dice[Number(size)] = (dice[Number(size)] || 0) + n * times;
  return { dice, flat: a.flat + b.flat * times };
};

const scalePool = (a: Pool, times: number): Pool => addPools({ dice: {}, flat: 0 }, a, times);

const isEmpty = (a: Pool) => a.flat === 0 && Object.values(a.dice).every((n) => n === 0);

/** "2d8+1d6+3", bigger dice first. A negative flat part reads "1d8-1". */
export function formatDice(a: Pool): string {
  const dice = Object.entries(a.dice)
    .filter(([, n]) => n > 0)
    .sort(([x], [y]) => Number(y) - Number(x))
    .map(([size, n]) => `${n}d${size}`)
    .join("+");
  if (!dice) return String(a.flat);
  return a.flat > 0 ? `${dice}+${a.flat}` : a.flat < 0 ? `${dice}${a.flat}` : dice;
}

/** Cantrip tier by character level: 1, then 2 at 5, 3 at 11, 4 at 17. */
export const cantripTier = (characterLevel: number) => (characterLevel >= 17 ? 4 : characterLevel >= 11 ? 3 : characterLevel >= 5 ? 2 : 1);

export interface DamagePart {
  /** "8d6+4" */
  dice: string;
  /** Damage type, "a|b" for one of several, "choice", "random", or "" (the weapon's). */
  type: string;
  /** Separate rolls of these dice (rays, darts, beams). 1 for one roll. */
  count: number;
  when?: DiceWhen;
  /** Where the flat bonus of one roll comes from (the spellcasting modifier, Empowered Evocation). */
  bonuses?: BonusPart[];
}

export interface CastContext {
  /** Slot level the spell is cast with; the spell's own level for a cantrip. */
  slot: number;
  /** Total character level, for cantrip dice. */
  characterLevel: number;
  /** Spellcasting ability modifier, for spells that add it. */
  mod: number;
  /** Which ability `mod` is, as a roll source ("@wis"). */
  modSource?: string;
}

export const hasDiceTable = (name: string) => name in SPELL_DICE;

/**
 * True when the spell deals damage itself (not only extra damage on weapon hits, like Hex),
 * false when the table knows it deals none, undefined when the spell is not in the table.
 */
export function dealsDirectDamage(name: string): boolean | undefined {
  if (NO_DAMAGE_LINE.has(name)) return false;
  const parts = SPELL_DICE[name];
  return parts ? parts.some((p) => p.when !== "hit") : undefined;
}

function resolvePart(part: DicePart, spellLevel: number, ctx: CastContext): { pool: Pool; count: number; bonuses: BonusPart[] } {
  const above = Math.max(0, ctx.slot - spellLevel);
  let pool = parseDice(part.at?.[ctx.slot] ?? part.dice);
  if (part.up && !part.at) pool = addPools(pool, parseDice(part.up), Math.floor(above / (part.every || 1)));
  const tier = cantripTier(ctx.characterLevel);
  if (part.cantrip === true) pool = scalePool(pool, tier);
  if (part.cantrip === "late") pool = scalePool(pool, tier - 1);
  const bonuses: BonusPart[] = [];
  if (part.mod) {
    pool = addPools(pool, { dice: {}, flat: ctx.mod });
    bonuses.push({ source: ctx.modSource || "@other", value: ctx.mod });
  }
  const count = part.beams ? tier : (part.count || 1) + (part.countUp || 0) * above;
  return { pool, count, bonuses };
}

const typeMatches = (type: string, wanted?: string[]) => !wanted?.length || type.split("|").some((t) => wanted.includes(t)) || type === "choice";

/**
 * The spell's damage at this casting, with the modifier bonuses already added:
 * a "roll" bonus joins the first matching single-roll part, a "beam" bonus joins every beam.
 * Bonuses that only count sometimes (once per turn, one target) stay out of the total.
 * Null when the spell has no entry in the checked dice table. A homebrew spell passes its own `parts`.
 */
export function spellDamage(name: string, spellLevel: number, ctx: CastContext, bonuses: SpellDamageBonus[] = [], parts: DicePart[] | undefined = SPELL_DICE[name]): DamagePart[] | null {
  if (!parts) return null;
  const resolved = parts.map((part) => ({ part, ...resolvePart(part, spellLevel, ctx) }));

  for (const bonus of bonuses) {
    const extra = bonus.dice ? parseDice(bonus.dice.split(" ")[0]) : { dice: {}, flat: bonus.value };
    if (bonus.per === "beam") {
      for (const r of resolved) if (r.part.beams) {
        r.pool = addPools(r.pool, extra);
        if (!bonus.dice) r.bonuses.push({ source: bonus.source, value: bonus.value });
      }
    } else if (bonus.per === "roll") {
      const target = resolved.find((r) => r.count === 1 && r.part.when !== "hurt" && typeMatches(r.part.type, bonus.types) && !isEmpty(r.pool));
      if (!target) continue;
      target.pool = addPools(target.pool, extra);
      if (!bonus.dice) target.bonuses.push({ source: bonus.source, value: bonus.value });
      // Toll the Dead: the bigger die is the same roll, so it gets the bonus too.
      for (const r of resolved) if (r.part.when === "hurt") {
        r.pool = addPools(r.pool, extra);
        if (!bonus.dice) r.bonuses.push({ source: bonus.source, value: bonus.value });
      }
    }
  }

  return resolved.filter((r) => !isEmpty(r.pool)).map((r) => ({ dice: formatDice(r.pool), type: r.part.type, count: r.count, ...(r.part.when ? { when: r.part.when } : {}), ...(r.bonuses.length ? { bonuses: r.bonuses } : {}) }));
}

/** The character's damage line for a spell cast at `slot` (its own level when left out), bonuses included. */
export function characterSpellDamage(character: Character, spell: SpellForBonus, slot = spell.level, bonuses: SpellDamageBonus[] = spellDamageBonuses(character, spell)): DamagePart[] | null {
  return spellDamage(spell.name, spell.level, { slot: Math.max(slot, spell.level), characterLevel: character.level || 1, mod: spellcastingMod(character), modSource: spellcastingSource(character) }, bonuses);
}
