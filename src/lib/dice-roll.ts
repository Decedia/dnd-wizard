/**
 * What a dice roll asks for and how its result adds up. The 3D tray
 * (src/components/dice) throws the dice; this file only does the counting.
 */

export const DIE_KINDS = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;
export type DieKind = (typeof DIE_KINDS)[number];

/**
 * Where part of a flat bonus comes from. `source` is a name shown as it is
 * ("Empowered Evocation", "Rage") or a token starting with "@" that the tray
 * turns into words: "@str".."@cha" (ability modifier), "@prof", "@expertise",
 * "@byHand" (a number set by hand), "@other".
 */
export interface BonusPart {
  source: string;
  value: number;
}

/** One line of a roll: "To hit" is 1d20+7, "Damage" is 8d6+4. */
export interface RollGroup {
  label: string;
  dice: DieKind[];
  mod: number;
  /** Where `mod` comes from, part by part; they add up to `mod`. */
  parts?: BonusPart[];
  /** An attack roll, ability check or saving throw: advantage and disadvantage apply to it. */
  d20Test?: boolean;
  /** Advantage or disadvantage the roll always has (War Caster on concentration), whatever the tray is set to. */
  mode?: D20Mode;
}

export type D20Mode = "normal" | "adv" | "dis";

const isKind = (k: string): k is DieKind => (DIE_KINDS as readonly string[]).includes(k);

/**
 * Dice and flat bonus from text such as "1d20+7", "2d6 + 1d8 - 1", "3 × 1d4+1"
 * (three rolls of 1d4+1) or "d20". Words after the numbers ("slashing damage")
 * are ignored. Null when there is no die the tray has.
 */
export function parseRoll(text: string): { dice: DieKind[]; mod: number } | null {
  let src = text.replace(/[−–]/g, "-").replace(/\s+/g, "").toLowerCase();
  let times = 1;
  const rep = /^(\d+)[×x*]\(?(.*)$/.exec(src);
  if (rep && /d\d/.test(rep[2])) {
    times = Number(rep[1]);
    src = rep[2];
  }
  const head = /^(?:[+-]?(?:\d*d\d+|\d+))+/.exec(src)?.[0] ?? "";
  const dice: DieKind[] = [];
  let mod = 0;
  for (const term of head.match(/[+-]?[^+-]+/g) || []) {
    const die = /^([+-]?)(\d*)d(\d+)$/.exec(term);
    if (die) {
      const kind = `d${die[3]}`;
      if (!isKind(kind) || die[1] === "-") return null;
      for (let i = 0; i < (die[2] ? Number(die[2]) : 1); i++) dice.push(kind);
    } else {
      mod += Number(term);
    }
  }
  if (!dice.length) return null;
  const all: DieKind[] = [];
  for (let i = 0; i < times; i++) all.push(...dice);
  return { dice: all, mod: mod * times };
}

/**
 * Parts that add up to `total`: zero parts are left out, and anything the
 * parts do not explain goes into one "@other" part.
 */
export function partsFor(total: number, parts: BonusPart[] = []): BonusPart[] {
  const out = parts.filter((p) => p.value !== 0);
  const rest = total - out.reduce((a, p) => a + p.value, 0);
  if (rest !== 0) out.push({ source: "@other", value: rest });
  return out;
}

export const sumParts = (parts: BonusPart[]) => parts.reduce((a, p) => a + p.value, 0);

/** An attack roll, check or save: one d20 plus a bonus, with where the bonus comes from. */
export const d20Group = (label: string, bonus: number, parts?: BonusPart[]): RollGroup => ({ label, dice: ["d20"], mod: bonus, d20Test: true, parts: partsFor(bonus, parts) });

/** Dice from text ("1d8", "2d6") plus bonus parts (ability, Rage), or null when the text has no dice. */
export function damageGroup(label: string, diceText: string, parts: BonusPart[] = []): RollGroup | null {
  const parsed = parseRoll(diceText);
  if (!parsed) return null;
  const mod = parsed.mod + sumParts(parts);
  return { label, dice: parsed.dice, mod, parts: partsFor(mod, parts) };
}

/** A group from text, or null when the text has no dice. */
export function groupFrom(label: string, text: string): RollGroup | null {
  const parsed = parseRoll(text);
  return parsed ? { label, ...parsed } : null;
}

/**
 * The number one die counts as, from the face(s) it landed on. A d10 showing 0
 * counts 10. A d100 is a tens die (0-9) and a d10; 00 and 0 together make 100.
 */
export function dieValue(kind: DieKind, faces: number[]): number {
  if (kind === "d100") {
    const v = faces[0] * 10 + faces[1];
    return v === 0 ? 100 : v;
  }
  if (kind === "d10" && faces[0] === 0) return 10;
  return faces[0];
}

/**
 * Total of a group from each die's value. With advantage or disadvantage a
 * d20 test throws two d20s (values[0] and values[1]) and keeps one.
 */
export function groupTotal(group: RollGroup, values: number[], mode: D20Mode = "normal"): number {
  if (group.d20Test && mode !== "normal" && values.length === 2) {
    return (mode === "adv" ? Math.max(values[0], values[1]) : Math.min(values[0], values[1])) + group.mod;
  }
  return values.reduce((a, b) => a + b, 0) + group.mod;
}

/** Index of the d20 that does not count under advantage or disadvantage, or -1. */
export function droppedIndex(group: RollGroup, values: number[], mode: D20Mode): number {
  if (!group.d20Test || mode === "normal" || values.length !== 2) return -1;
  const keep = mode === "adv" ? (values[0] >= values[1] ? 0 : 1) : (values[0] <= values[1] ? 0 : 1);
  return 1 - keep;
}

/**
 * "1d20 + 7", "8d6 + 4", "1d100". With parts and a `name` for their sources:
 * "1d20 + 3 STR + 3 proficiency".
 */
export function groupText(group: RollGroup, name?: (source: string) => string): string {
  const counts = new Map<string, number>();
  for (const d of group.dice) counts.set(d, (counts.get(d) || 0) + 1);
  const dice = [...counts].map(([k, n]) => `${n}${k}`).join(" + ");
  const signed = (n: number) => `${n > 0 ? "+" : "−"} ${Math.abs(n)}`;
  if (name && group.parts?.length) return [dice, ...group.parts.filter((p) => p.value).map((p) => `${signed(p.value)} ${name(p.source)}`)].join(" ");
  return group.mod ? `${dice} ${signed(group.mod)}` : dice;
}

/** Doubles the dice of a damage group for a critical hit; the bonus stays. */
export const critGroup = (group: RollGroup, label = group.label): RollGroup => ({ ...group, label, dice: [...group.dice, ...group.dice] });

/**
 * Groups for a spell's damage line: the parts dealt on the cast, one group
 * each ("8d6+4 fire"); rays and darts repeat their dice and bonus.
 * Parts for later turns, other targets or weapon hits are left out.
 */
export function spellDamageGroups(parts: { dice: string; type: string; count: number; when?: string; bonuses?: BonusPart[] }[], label: string, spellName?: string): RollGroup[] {
  const out: RollGroup[] = [];
  for (const part of parts) {
    if (part.when) continue;
    const parsed = parseRoll(part.dice);
    if (!parsed) continue;
    const dice: DieKind[] = [];
    for (let i = 0; i < part.count; i++) dice.push(...parsed.dice);
    const type = part.type && !["choice", "random"].includes(part.type) ? ` ${part.type.split("|")[0]}` : "";
    const mod = parsed.mod * part.count;
    // What the spell itself adds (Magic Missile's +1 a dart) is named after the spell.
    const named = (part.bonuses || []).map((b) => ({ source: b.source, value: b.value * part.count }));
    const own = mod - sumParts(named);
    out.push({ label: `${label}${type}`, dice, mod, parts: partsFor(mod, own && spellName ? [...named, { source: spellName, value: own }] : named) });
  }
  return out;
}
