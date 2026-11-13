// Short and long rests: what comes back, as patches for the character sheet.
// The character passed in must carry its derived stats (pool ceilings).
import { getFreeCastSpells } from "./granted-spells";
import { getStaticClass } from "./srd-client";
import { getModifier, hpMaxBonus, type Character } from "./storage";
import { getFeatPicks } from "./feature-groups";
import { endEncounterPatch } from "./turn";
import { featureUsesAfterRest } from "@/data/turn-features";

export type RestKind = "short" | "long";

/** Pools that refill on a rest: the field, its ceiling field, and which rest refills it. */
const POOLS: { field: keyof Character; max: keyof Character; rest: RestKind; label: string }[] = [
  { field: "kiPoints", max: "maxKiPoints", rest: "short", label: "ki" },
  { field: "channelDivinityUses", max: "maxChannelDivinityUses", rest: "short", label: "channelDivinity" },
  { field: "actionSurgeUses", max: "maxActionSurgeUses", rest: "short", label: "actionSurge" },
  { field: "wildShapeUses", max: "maxWildShapeUses", rest: "short", label: "wildShape" },
  { field: "superiorityDice", max: "maxSuperiorityDice", rest: "short", label: "superiorityDice" },
  { field: "rages", max: "maxRages", rest: "long", label: "rages" },
  { field: "indomitableUses", max: "maxIndomitableUses", rest: "long", label: "indomitable" },
  { field: "layOnHandsPool", max: "maxLayOnHandsPool", rest: "long", label: "layOnHands" },
  { field: "sorceryPoints", max: "maxSorceryPoints", rest: "long", label: "sorceryPoints" },
  { field: "bardicInspirationUses", max: "maxBardicInspirationUses", rest: "long", label: "bardicInspiration" },
  { field: "luckPoints", max: "maxLuckPoints", rest: "long", label: "luckPoints" },
  { field: "psionicDice", max: "maxPsionicDice", rest: "long", label: "psionicDice" },
];

const num = (character: Character, field: keyof Character) => (typeof character[field] === "number" ? (character[field] as number) : 0);

/** Bards get Bardic Inspiration back on a short rest from level 5 (Font of Inspiration). */
function refillsOn(character: Character, pool: (typeof POOLS)[number], kind: RestKind): boolean {
  if (kind === "long") return true;
  if (pool.rest === "short") return true;
  if (character.ruleset === "2024" && ONE_BACK_2024.has(pool.field)) return true;
  return pool.field === "bardicInspirationUses" && character.class === "Bard" && character.level >= 5;
}

/** 2024 pools that get one use back on a short rest and all on a long rest. */
const ONE_BACK_2024 = new Set<keyof Character>(["rages", "channelDivinityUses", "wildShapeUses", "psionicDice"]);

/** A pool's value after the rest. */
function poolAfter(character: Character, pool: (typeof POOLS)[number], kind: RestKind): number {
  const max = num(character, pool.max);
  if (kind === "short" && character.ruleset === "2024" && ONE_BACK_2024.has(pool.field)) return Math.min(max, num(character, pool.field) + 1);
  return max;
}

/** Sorcerous Restoration: the sorcery points a short rest gives back (2014 level 20: 4; 2024 level 5: half the level, once per long rest). */
const RESTORATION_KEY = "rest:sorcerousRestoration";
function sorcerousRestoration(character: Character): number {
  if (character.class !== "Sorcerer") return 0;
  const level = character.level || 1;
  const missing = num(character, "maxSorceryPoints") - num(character, "sorceryPoints");
  if (character.ruleset === "2024") return level >= 5 && !character.featureUses?.[RESTORATION_KEY] ? Math.min(missing, Math.floor(level / 2)) : 0;
  return level >= 20 ? Math.min(missing, 4) : 0;
}

/** The rest line for a pool: a 2024 Monk's pool is Focus Points. */
const poolLabel = (character: Character, pool: (typeof POOLS)[number]) => (pool.field === "kiPoints" && character.ruleset === "2024" ? "focus" : pool.label);

function zeroSpent(character: Character): Record<number, number> {
  return Object.fromEntries(Object.keys(character.spellSlots || {}).map((k) => [Number(k), 0]));
}

function slotsSpent(character: Character): number {
  return Object.values(character.spellSlotsExpended || {}).reduce((sum, n) => sum + (n || 0), 0);
}

function maxHpNow(character: Character): number {
  return character.effectiveMaxHp || character.maxHp || 0;
}

/** Sides of the class hit die. */
export function hitDieSides(character: Character): number {
  return (getStaticClass(character.class, character.ruleset) as any)?.hitDie || 8;
}

/** Hit points from spending `count` hit dice: each is a roll plus the Constitution modifier, never below 0. */
export function rollHitDice(character: Character, count: number, random: () => number = Math.random): { rolls: number[]; healed: number } {
  const sides = hitDieSides(character);
  const con = getModifier(character.con ?? 10);
  const rolls = Array.from({ length: Math.max(0, count) }, () => Math.floor(random() * sides) + 1);
  return { rolls, healed: rolls.reduce((sum, r) => sum + Math.max(0, r + con), 0) };
}

/**
 * A short rest (about an hour). The player may spend hit dice to heal;
 * `hitDiceSpent` and `healed` carry that roll.
 */
export function shortRestPatch(character: Character, hitDiceSpent = 0, healed = 0, recovered: Record<number, number> = {}): Partial<Character> {
  const spent = Math.max(0, Math.min(hitDiceSpent, num(character, "hitDiceRemaining")));
  const shortCasts = new Set(getFreeCastSpells(character).filter((c) => c.rest === "short").map((c) => c.name.toLowerCase()));
  const patch: Partial<Character> = {
    ...endEncounterPatch(character),
    currentHp: Math.min(maxHpNow(character), (character.currentHp || 0) + (spent > 0 ? Math.max(0, healed) : 0)),
    hitDiceRemaining: num(character, "hitDiceRemaining") - spent,
    freeCastsUsed: (character.freeCastsUsed || []).filter((n) => !shortCasts.has(n)),
    featureUses: featureUsesAfterRest(character.featureUses, "short", character),
  };
  const leader = inspiringLeaderTempHp(character);
  if (leader > (character.temporaryHp || 0)) patch.temporaryHp = leader;
  for (const pool of POOLS) {
    if (num(character, pool.max) > 0 && refillsOn(character, pool, "short")) (patch as any)[pool.field] = poolAfter(character, pool, "short");
  }
  // Pact Magic slots come back on a short rest.
  if (character.class === "Warlock") patch.spellSlotsExpended = zeroSpent(character);
  // Arcane Recovery (Wizard): chosen slots come back, once per long rest.
  const picked = Object.entries(recovered).filter(([, n]) => n > 0);
  const levels = picked.reduce((sum, [lvl, n]) => sum + Number(lvl) * n, 0);
  if (picked.length > 0 && levels <= arcaneRecoveryBudget(character) && picked.every(([lvl]) => Number(lvl) <= 5)) {
    const spent = { ...(character.spellSlotsExpended || {}) } as Record<number, number>;
    for (const [lvl, n] of picked) spent[Number(lvl)] = Math.max(0, (spent[Number(lvl)] || 0) - n);
    patch.spellSlotsExpended = spent;
    patch.arcaneRecoveryUsed = true;
  }
  // Sorcerous Restoration: sorcery points back (2024: once per long rest).
  const restored = sorcerousRestoration(character);
  if (restored > 0) {
    patch.sorceryPoints = num(character, "sorceryPoints") + restored;
    if (character.ruleset === "2024") patch.featureUses = { ...patch.featureUses, [RESTORATION_KEY]: 1 };
  }
  return patch;
}

/**
 * Inspiring Leader: a speech after a rest gives temporary hit points equal to the
 * character level plus the Charisma modifier (2024: the Wisdom or Charisma one the
 * feat raised). 0 without the feat.
 */
export function inspiringLeaderTempHp(character: Character): number {
  const feat = getFeatPicks(character, "Inspiring Leader");
  if (!feat.taken && !(character.features || []).some((f) => f.name === "Inspiring Leader")) return 0;
  const ability = character.ruleset === "2024" && feat.picks.includes("+1 WIS") ? character.wis : character.cha;
  return Math.max(0, (character.level || 1) + getModifier(ability ?? 10));
}

/** A long rest (8 hours). */
export function longRestPatch(character: Character): Partial<Character> {
  const level = character.level || 1;
  const patch: Partial<Character> = {
    ...endEncounterPatch(character),
    currentHp: (character.maxHp || 0) + hpMaxBonus(character),
    temporaryHp: inspiringLeaderTempHp(character),
    // Spent hit dice come back up to half the total (at least one), not all.
    hitDiceRemaining: Math.min(level, num(character, "hitDiceRemaining") + Math.max(1, Math.floor(level / 2))),
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    spellSlotsExpended: zeroSpent(character),
    // One level of exhaustion goes away, not all of it.
    exhaustionLevel: Math.max(0, (character.exhaustionLevel || 0) - 1),
    arcaneRecoveryUsed: false,
    freeCastsUsed: [],
    wildShape: undefined,
    featureUses: {},
    spellsUsedThisTurn: [],
    featuresUsedThisTurn: [],
    activeBuffs: [],
  };
  for (const pool of POOLS) {
    if (num(character, pool.max) > 0) (patch as any)[pool.field] = num(character, pool.max);
  }
  return patch;
}

/**
 * Arcane Recovery: once per long rest, on a short rest, a wizard gets back
 * spent slots whose levels add up to half the wizard level (rounded up).
 * No slot of 6th level or higher. 0 when it is not available now.
 */
export function arcaneRecoveryBudget(character: Character): number {
  if (character.class !== "Wizard" || character.arcaneRecoveryUsed) return 0;
  return Math.ceil((character.level || 1) / 2);
}

/** Spent slots Arcane Recovery can bring back, by level (1st to 5th). */
export function recoverableSlots(character: Character): { level: number; spent: number }[] {
  const spent = (character.spellSlotsExpended || {}) as Record<number, number>;
  return [1, 2, 3, 4, 5].map((level) => ({ level, spent: spent[level] || 0 })).filter((s) => s.spent > 0);
}

export interface RestGain {
  /** Locale key under `rest.gain.`. */
  id: string;
  values?: Record<string, string | number>;
}

/** What this rest would give back right now, for the confirm screen. Empty lines are left out. */
export function restGains(character: Character, kind: RestKind): RestGain[] {
  const gains: RestGain[] = [];
  const level = character.level || 1;
  if (kind === "long") {
    const hp = (character.maxHp || 0) + hpMaxBonus(character) - (character.currentHp || 0);
    if (hp > 0) gains.push({ id: "hp", values: { amount: hp } });
    if (slotsSpent(character) > 0) gains.push({ id: "slots", values: { count: slotsSpent(character) } });
    const dice = Math.min(level, num(character, "hitDiceRemaining") + Math.max(1, Math.floor(level / 2))) - num(character, "hitDiceRemaining");
    if (dice > 0) gains.push({ id: "hitDice", values: { count: dice } });
    if ((character.exhaustionLevel || 0) > 0) gains.push({ id: "exhaustion" });
    if (character.class === "Wizard" && character.arcaneRecoveryUsed) gains.push({ id: "arcaneRecovery" });
  } else if (character.class === "Warlock" && slotsSpent(character) > 0) {
    gains.push({ id: "slots", values: { count: slotsSpent(character) } });
  }
  for (const pool of POOLS) {
    const max = num(character, pool.max);
    if (max <= 0 || !refillsOn(character, pool, kind)) continue;
    const back = poolAfter(character, pool, kind) - num(character, pool.field);
    if (back > 0) gains.push({ id: poolLabel(character, pool), values: { count: back } });
  }
  if (kind === "short") {
    const back = sorcerousRestoration(character);
    if (back > 0) gains.push({ id: "sorceryPoints", values: { count: back } });
  }
  const leader = inspiringLeaderTempHp(character);
  if (leader > (kind === "long" ? 0 : character.temporaryHp || 0)) gains.push({ id: "inspiringLeader", values: { amount: leader } });
  const used = new Set(character.freeCastsUsed || []);
  const casts = getFreeCastSpells(character).filter((c) => used.has(c.name.toLowerCase()) && (kind === "long" || c.rest === "short"));
  if (casts.length > 0) gains.push({ id: "freeCasts", values: { names: casts.map((c) => c.name).join(", ") } });
  return gains;
}
