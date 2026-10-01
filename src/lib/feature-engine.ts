/**
 * The resolver: one function that turns an engine feature plus a character's
 * current state into everything a consumer needs.
 *
 * This exists so the turn modal and the character sheet badges cannot disagree.
 * Both call `resolve`; neither reads the dataset itself. A badge that says
 * "3 / long rest" and a modal row that says the same thing come from one place,
 * so they cannot drift.
 *
 * It answers four questions and nothing more:
 *   - which action slot does this go in?
 *   - can this character use it right now?
 *   - how much is left?
 *   - what should a badge say?
 *
 * It deliberately does not resolve dice or apply effects. The player rolls
 * real dice; `effects` is carried through for display.
 */
import type { Character } from "@/lib/storage";
import type {
  Ability,
  Activation,
  Effect,
  FeatureBase,
  GateId,
  LimitSpec,
  ResourceDef,
  TargetSpec,
  TriggerSpec,
} from "@/data/engine/types";
import { buildDataset, findEngineFeature, normaliseName, type BuiltDataset } from "@/data/engine/index";

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

export interface ResourcePool {
  id: string;
  available: number;
}

export interface ResolveContext {
  /** Character level, used to pick the tier a feature has reached. */
  level: number;
  /** The character itself, for checks that need a field the pools do not carry. */
  character: Character;
  /** Resources the character currently holds, keyed by resource id. */
  pools: ResourcePool[];
  /** Engine ids already used this turn. */
  usedThisTurn: string[];
  /** States currently active, e.g. "raging", "unarmored". */
  activeStates: string[];
  /** Whether the action / bonus action / reaction has been spent this turn. */
  actionUsed?: boolean;
  bonusActionUsed?: boolean;
  reactionUsed?: boolean;
  dataset?: BuiltDataset;
}

export type BadgeTone =
  | "action"
  | "bonus"
  | "reaction"
  | "free"
  | "passive"
  | "charge"
  | "duration"
  | "book"
  | "gated"
  | "requirement";

export interface Badge {
  /**
   * A translation key, not a rendered string. The engine holds no locale and no
   * language, so it must not bake English into anything a player reads; the
   * sheet renders these through t(). `values` fills the placeholders.
   */
  key: string;
  values?: Record<string, string | number>;
  tone: BadgeTone;
}

/** Human-readable English, for contexts with no locale available. */
function renderBadge(badge: Badge): string {
  if (!badge.values) return badge.key;
  return badge.key.replace(/\{(\w+)\}/g, (_, k) =>
    badge.values?.[k] !== undefined ? String(badge.values[k]) : `{${k}}`
  );
}

export interface ResolvedFeature {
  id: string;
  name: string;
  owner: string;
  variant?: string;
  kind: FeatureBase["kind"];
  /** The action slot this belongs in, taken from the tier in force at this level. */
  activation: Activation;
  summary: string;
  text: string;
  /** Unlock level, with any tier applied. */
  level: number;
  /** False when the feature cannot be used right now; see `blockedBy`. */
  available: boolean;
  /** True when the character has already used this feature this turn. */
  used: boolean;
  /** Human-readable reason the feature is unavailable, or null. */
  blockedBy: string | null;
  /** Uses remaining under the feature's own limit, or null if unlimited. */
  uses: { current: number; max: number; per: LimitSpec["per"] } | null;
  /** Resources this spends, and whether the character has them. */
  resources: {
    id: string;
    required: number;
    available: number;
    tracked: boolean;
    ok: boolean;
    /** True when the player sizes the spend, as with Lay on Hands. */
    sized?: boolean;
    /** The floor the rules set on that spend. */
    spendMin?: number;
  }[];
  targeting: TargetSpec | null;
  trigger: TriggerSpec | null;
  /** Duration as a value, which the sheet can render without parsing prose. */
  duration: FeatureBase["duration"] | null;
  effects: Effect[];
  /** Gates this feature requires, and which of them are not currently met. */
  gates: GateId[];
  gatesUnmet: GateId[];
  badges: Badge[];
}

/* ------------------------------------------------------------------ *
 * Tier resolution
 * ------------------------------------------------------------------ */

/**
 * Overlay the highest tier at or below the character's level, matching the tier's
 * semantics: a field the tier sets replaces the base value, and a field it
 * leaves out is inherited.
 *
 * Tier lists are validated as strictly ascending, so "the last one at or below
 * level" is the correct one to take. Nested tiers are not merged - a tier's
 * `effects` replaces the base list wholesale, which is what the data says.
 */
export function applyTier(feature: FeatureBase, level: number): FeatureBase {
  const tiers = feature.tiers ?? [];
  if (tiers.length === 0) return feature;
  let active: (typeof tiers)[number] | null = null;
  for (const tier of tiers) {
    if (tier.at <= level && (active === null || tier.at > active.at)) active = tier;
  }
  if (!active) return feature;
  const { at: _at, ...overrides } = active;
  return { ...feature, ...overrides };
}

/* ------------------------------------------------------------------ *
 * Limits and pools
 * ------------------------------------------------------------------ */

/** The maximum a limit allows at a given character level. */
export function limitMaxAt(limit: LimitSpec, level: number): number {
  if (!limit.perLevel) return limit.max;
  const scaled = limit.max + limit.perLevel.plus * level;
  return limit.perLevel.round === "down" ? Math.floor(scaled) : scaled;
}

/** How many uses a limit allows at this level, after tiers. */
export function limitAt(feature: FeatureBase, level: number): LimitSpec | null {
  const tiered = applyTier(feature, level);
  return tiered.limits ?? null;
}

/**
 * The maximum a resource holds, resolving `max`, `maxByLevel` and
 * `maxFromAbility`. Returns null when the resource's maximum lives elsewhere -
 * hit dice and spell slots, whose counts are on the character.
 */
export function resourceMaximum(resource: ResourceDef, level: number, abilityModifier = 0): number | null {
  if (typeof resource.max === "number") return resource.max;
  if (resource.maxByLevel) {
    // Keys are validated as strictly ascending, so the highest key at or below
    // the character's level is the one that applies.
    let winningKey = -1;
    let result: number | null = null;
    for (const [key, value] of Object.entries(resource.maxByLevel)) {
      const keyLevel = Number(key);
      if (keyLevel <= level && keyLevel > winningKey) {
        winningKey = keyLevel;
        result = value;
      }
    }
    return result;
  }
  if (resource.maxFromLevel) {
    const { times, above = 0 } = resource.maxFromLevel;
    return Math.floor(times * Math.max(0, level - above));
  }
  if (resource.maxFromAbility) {
    const { ability, perLevel = 0, minimum = 0 } = resource.maxFromAbility;
    // "Fighter level or twice your Charisma modifier, whichever is greater" is
    // not expressible as one formula, so the level term is used and the
    // alternative is recorded in the resource's note.
    const scaled = level * perLevel + abilityModifier;
    void ability;
    return Math.max(scaled, minimum);
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Availability
 * ------------------------------------------------------------------ */

/** A slot is spent, but a `free` feature does not need one. */
function slotSpent(feature: FeatureBase, ctx: ResolveContext): boolean {
  switch (feature.activation) {
    case "action":
      return ctx.actionUsed === true;
    case "bonus_action":
      return ctx.bonusActionUsed === true;
    case "reaction":
      return ctx.reactionUsed === true;
    default:
      return false;
  }
}

export function slotLabel(activation: Activation): string {
  switch (activation) {
    case "action":
      return "Action";
    case "bonus_action":
      return "Bonus Action";
    case "reaction":
      return "Reaction";
    case "free":
      return "Free";
    default:
      return "Passive";
  }
}

/* ------------------------------------------------------------------ *
 * Badges
 * ------------------------------------------------------------------ */

/**
 * The badge row. Only what a player needs at a glance: which slot it occupies,
 * what it costs to use, how long it lasts, and where it came from.
 */
export function badgesFor(resolved: {
  activation: Activation;
  uses: { current: number; max: number; per: LimitSpec["per"] } | null;
  resources: { id: string; required: number; available: number; tracked: boolean; ok: boolean }[];
  duration: { value: number; unit: string } | null;
  source: { book: string };
  gatesUnmet: GateId[];
}): Badge[] {
  const badges: Badge[] = [];
  if (resolved.activation !== "passive") {
    const tone: BadgeTone =
      resolved.activation === "action"
        ? "action"
        : resolved.activation === "bonus_action"
          ? "bonus"
          : resolved.activation === "reaction"
            ? "reaction"
            : "free";
    badges.push({ key: `engine.badge.${resolved.activation}`, tone });
  }
  if (resolved.uses) {
    badges.push({
      key: "engine.badge.charge",
      values: {
        current: resolved.uses.current,
        max: resolved.uses.max,
        per: resolved.uses.per,
      },
      tone: "charge",
    });
  }
  for (const pool of resolved.resources ?? []) {
    // Only a pool the character actually tracks earns a badge. Printing "Ki: 0"
    // on a character whose sheet has no Ki field says something untrue.
    if (pool.tracked === false) continue;
    badges.push({
      key: "engine.badge.resource",
      values: { resource: pool.id, available: pool.available },
      tone: "charge",
    });
  }
  if (resolved.duration) {
    badges.push({
      key: "engine.badge.duration",
      values: { value: resolved.duration.value, unit: resolved.duration.unit },
      tone: "duration",
    });
  }
  if (resolved.gatesUnmet.length > 0) {
    badges.push({ key: "engine.badge.gated", tone: "gated" });
  }
  // The sourcebook is a proper noun in every locale.
  badges.push({ key: "engine.badge.book", values: { book: resolved.source.book }, tone: "book" });
  return badges;
}

/* ------------------------------------------------------------------ *
 * resolve
 * ------------------------------------------------------------------ */

export function resolve(input: FeatureBase, ctx: ResolveContext): ResolvedFeature {
  const dataset = ctx.dataset ?? buildDataset();
  const feature = applyTier(input, ctx.level);
  const limit = feature.limits ?? null;
  const gates = feature.gates ?? [];
  const gatesUnmet = gates.filter((g) => !ctx.activeStates.includes(g));

  const resources = (feature.cost ?? []).map((cost) => {
    const pool = ctx.pools.find((p) => p.id === cost.resource);
    // A pool the character does not track at all is not the same as an empty
    // one, and reporting "not enough" for the first is a lie.
    const tracked = pool !== undefined;
    const held = pool?.available ?? 0;
    // "A slot of 2nd level or higher" is satisfied by any unspent slot at or
    // above that level, not by a count of slots.
    if (cost.chooseTier) {
      return {
        id: cost.resource,
        required: cost.amount,
        available: held,
        tracked,
        ok: hasSlotAtLeast(ctx.character, cost.chooseTier.minLevel),
      };
    }
    return {
      id: cost.resource,
      required: cost.amount,
      available: held,
      tracked,
      ok: held >= cost.amount,
      // A sized cost is usable while the pool holds anything at or above the
      // floor, not while it holds the full base amount.
      sized: cost.choose !== undefined,
      spendMin: cost.choose?.min,
    };
  });

  const usedHere = ctx.usedThisTurn.includes(feature.id);
  const limitMax = limit ? limitMaxAt(limit, ctx.level) : 0;
  const uses = limit
    ? { current: Math.max(0, limitMax - ctx.usedThisTurn.filter((id) => id === feature.id).length), max: limitMax, per: limit.per }
    : null;

  // Order matters, because only one reason is shown. A missing resource or a
  // spent charge is the actionable problem; a gate on a self-granted state is a
  // consequence of not having done the thing yet. Barbarian Rage gated on
  // "raging" reported "Requires raging" while the real problem was no rages left.
  let blockedBy: string | null = null;
  if (feature.unlock !== undefined && ctx.level < feature.unlock) {
    blockedBy = `Unlocks at level ${feature.unlock}`;
  } else if (resources.some((r) => !r.ok && r.tracked)) {
    const missing = resources.find((r) => !r.ok && r.tracked)!;
    blockedBy = `Not enough ${missing.id.replace(/_/g, " ")}`;
  } else if (uses && uses.current <= 0) {
    blockedBy = "No uses remaining";
  } else if (gatesUnmet.length > 0) {
    blockedBy = `Requires ${gatesUnmet.join(", ")}`;
  } else if (usedHere && feature.activation !== "passive" && feature.activation !== "free") {
    blockedBy = `Already used this ${limit?.per === "round" ? "round" : "turn"}`;
  } else if (slotSpent(feature, ctx)) {
    blockedBy = `${slotLabel(feature.activation)} already spent this turn`;
  }

  const resolved: ResolvedFeature = {
    id: feature.id,
    name: feature.name,
    owner: feature.owner,
    variant: feature.variant,
    kind: feature.kind,
    activation: feature.activation,
    summary: feature.summary,
    text: feature.text,
    level: feature.unlock ?? 0,
    available: blockedBy === null,
    used: usedHere,
    blockedBy,
    uses,
    resources,
    targeting: feature.targeting ?? null,
    trigger: feature.trigger ?? null,
    duration: feature.duration ?? null,
    effects: feature.effects ?? [],
    gates,
    gatesUnmet,
    badges: [],
  };

  resolved.badges = badgesFor({
    activation: resolved.activation,
    uses: resolved.uses,
    resources: resolved.resources,
    duration: feature.duration ?? null,
    source: feature.source,
    gatesUnmet,
  });
  return resolved;
}

/* ------------------------------------------------------------------ *
 * Turn menu
 * ------------------------------------------------------------------ */

export type TurnSlot = "action" | "bonus_action" | "reaction" | "free";

export interface TurnOption extends ResolvedFeature {
  /** For reactions, which in-world event this is waiting on. */
  waitingFor: string | null;
}

export interface TurnMenu {
  action: TurnOption[];
  bonus_action: TurnOption[];
  reaction: TurnOption[];
  free: TurnOption[];
  passive: ResolvedFeature[];
}

const SLOT_LABELS: Record<TriggerSpec["event"] | string, string> = {
  self_damaged: "When you are damaged",
  ally_damaged: "When an ally is damaged",
  save_succeeded: "When you succeed on a save",
  save_failed: "When you fail a save",
  self_hit_by_attack: "When you are hit",
  attack_hit: "On a hit",
  attack_missed: "On a miss",
  turn_start: "At the start of your turn",
  turn_end: "At the end of your turn",
  round_start: "At the start of the round",
  creature_killed: "When you kill a creature",
  reduced_to_0_hp: "When you drop to 0 HP",
  targeted_by_spell: "When a spell targets you",
  damaged_by_visible_source: "When damaged by a source you can see",
  falling: "When you fall",
  sight: "When you gain sight of something",
  start_encounter: "When a fight begins",
};

export function triggerLabel(trigger: TriggerSpec | null): string | null {
  if (!trigger) return null;
  return SLOT_LABELS[trigger.event] ?? trigger.event.replace(/_/g, " ");
}

/**
 * Group a character's features into the slots a turn menu shows. Features that
 * are unavailable stay in the list with a reason, because "why is this greyed
 * out" is the question the modal exists to answer.
 */
export function buildTurnMenu(features: FeatureBase[], ctx: ResolveContext): TurnMenu {
  const menu: TurnMenu = { action: [], bonus_action: [], reaction: [], free: [], passive: [] };
  for (const feature of features) {
    const resolved = resolve(feature, ctx);
    if (resolved.activation === "passive") {
      menu.passive.push(resolved);
      continue;
    }
    const option: TurnOption = { ...resolved, waitingFor: triggerLabel(resolved.trigger) };
    menu[resolved.activation as TurnSlot].push(option);
  }
  return menu;
}

/**
 * Resolve a character's stored features against the engine. The app's feature
 * ids are name-derived, so each is matched by owner and name.
 */
export function resolveCharacterFeatures(
  stored: { id: string; name: string; owner?: string }[],
  ctx: Omit<ResolveContext, "dataset">,
  dataset: BuiltDataset = buildDataset()
): { storedId: string; feature: FeatureBase }[] {
  const out: { storedId: string; feature: FeatureBase }[] = [];
  for (const entry of stored) {
    const owner = entry.owner ?? guessOwner(entry.name, ctx);
    const feature = findEngineFeature(owner, entry.name, dataset);
    if (feature) out.push({ storedId: entry.id, feature });
  }
  return out;
}

/**
 * Character features do not carry their owner, and a name like "Extra Attack"
 * belongs to six different classes. The caller supplies the class and subclass,
 * which is what actually disambiguates them.
 */
function guessOwner(name: string, ctx: Omit<ResolveContext, "dataset"> & { className?: string; subclassName?: string }): string | undefined {
  if (ctx.subclassName) return ctx.subclassName;
  return ctx.className;
}

/**
 * Stamps the combat engine id onto a character feature at creation time.
 *
 * The app's own feature ids are derived from display names ("subclass-Rage"),
 * which collide across subclasses and break if a name is ever reworded. The
 * engine id is stable, so it is recorded once here rather than matched by name
 * every time the sheet renders.
 *
 * A feature with no engine counterpart - a homebrew or custom feature - is left
 * unstamped, and the sheet falls back to its own data for those.
 */
export function engineIdFor(
  kind: "class" | "subclass" | "race" | "feat",
  owner: string | undefined,
  name: string
): string | undefined {
  return findEngineFeature(owner, name)?.id;
}

export { buildDataset, findEngineFeature, normaliseName, renderBadge, type BuiltDataset };

/* ------------------------------------------------------------------ *
 * Character pools
 * ------------------------------------------------------------------ */

/**
 * The character's remaining resources, as the resolver reads them.
 *
 * The sheet used to hardcode most of these to zero, so a badge said "Rages: 0"
 * on a barbarian with four rages banked, and Lay on Hands - a pool the character
 * has always tracked - was not shown at all. Each entry names the character field
 * that holds it, so a pool the sheet does not track yet is simply absent rather
 * than falsely zero.
 */
const CHARACTER_POOL_FIELDS: Record<string, keyof Character> = {
  rages: "rages",
  ki: "kiPoints",
  channel_divinity: "channelDivinityUses",
  channel_divinity_paladin: "channelDivinityUses",
  sorcery_points: "sorceryPoints",
  bardic_inspiration: "bardicInspirationUses",
  lay_on_hands: "layOnHandsPool",
  wild_shape_uses: "wildShapeUses",
  action_surge: "actionSurgeUses",
  indomitable: "indomitableUses",
  hit_dice: "hitDiceRemaining",
  arcane_pool: "arcanePool" as keyof Character,
};

/**
 * Read the pools off a character. A pool the sheet does not track is omitted,
 * which the badge renders as "0" only if the feature actually costs it - the
 * alternative, reporting a fabricated zero, is what this replaces.
 */
export function characterPools(character: Character, dataset: BuiltDataset = buildDataset()): ResourcePool[] {
  const pools: ResourcePool[] = [];
  for (const resource of dataset.resources) {
    const field = CHARACTER_POOL_FIELDS[resource.id];
    if (!field) continue;
    // Spell slots are tracked per level, not as one number.
    if (resource.id === "spell_slots") continue;
    const value = character[field];
    if (typeof value !== "number") continue;
    pools.push({ id: resource.id, available: Math.max(0, value) });
  }
  pools.push({ id: "spell_slots", available: remainingSpellSlots(character) });
  return pools;
}

/** Spell slots left across every level. */
function remainingSpellSlots(character: Character): number {
  const remaining = character.spellSlots ?? {};
  const spent = character.spellSlotsExpended ?? {};
  return Object.keys(remaining).reduce(
    (sum, key) => sum + Math.max(0, (remaining[Number(key)] ?? 0) - (spent[Number(key)] ?? 0)),
    0
  );
}

/** Whether a slot of at least `minLevel` is still unspent. */
export function hasSlotAtLeast(character: Character, minLevel: number): boolean {
  const remaining = character.spellSlots ?? {};
  const spent = character.spellSlotsExpended ?? {};
  return Object.keys(remaining).some((key) => {
    const level = Number(key);
    return level >= minLevel && (remaining[level] ?? 0) - (spent[level] ?? 0) > 0;
  });
}

/**
 * The ceiling for a pool at this character's level, from the engine's tables.
 * Returns null when the ceiling lives on the character instead, as hit dice
 * and spell slots do.
 */
export function poolCeiling(
  resourceId: string,
  character: Pick<Character, "level" | "int" | "wis" | "cha">,
  dataset: BuiltDataset = buildDataset()
): number | null {
  const resource = dataset.resources.find((r) => r.id === resourceId);
  if (!resource) return null;
  if (resource.kind === "slots" || resource.maxFrom === "level") return null;
  // An ability modifier is only meaningful where one is named.
  const ability = resource.maxFromAbility?.ability as Ability | undefined;
  const score = ability ? (character as Record<string, number | undefined>)[ability] : undefined;
  const modifier = typeof score === "number" ? Math.floor((score - 10) / 2) : 0;
  return resourceMaximum(resource, character.level || 1, modifier);
}
