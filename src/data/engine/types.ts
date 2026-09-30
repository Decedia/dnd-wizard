/**
 * Combat engine data model (D&D 5e, 2014 rules).
 *
 * This is the final shape. The rules it follows, in order of importance:
 *
 *  1. Every mechanic is a value from a closed enum in vocab.json. Authoring
 *     never invents a string, so nothing downstream parses prose.
 *  2. Numbers are resolved at authoring time. No "see class table"; a level 3
 *     barbarian has a hard 3 rages in this file, not a lookup to perform.
 *  3. Resources are top-level. Channel Divinity and Ki are pools that many
 *     features spend; keeping the count on the feature would duplicate it.
 *  4. The shape is stable. Adding an enum value, an effect kind or a feature is
 *     additive and never moves or redefines an existing field. The only change
 *     that is not allowed is changing what an existing field means.
 *
 * Effects are structured for display, not for resolution. A `damage` effect
 * carries the dice and how it resolves so the UI can read "1d8 + 4 slashing,
 * Dex save for half" - the human still rolls. See docs/ENGINE.md.
 *
 * vocab.json is the single source of truth for every closed list. The
 * assertions at the bottom of this file fail typecheck if the unions here drift
 * from it; scripts/validate-engine-data.mjs fails the build on a value that is
 * not in it. Extend the schema by editing vocab.json and adding the matching
 * union member, never by bypassing either check.
 */
import vocab from "./vocab.json";

// ---------------------------------------------------------------------------
// Closed vocabularies
// ---------------------------------------------------------------------------

/** What a creature spends to use the feature. `passive` is always-on. */
export type Activation = (typeof vocab.activation)[number];

/** Where a feature comes from. */
export type FeatureKind = (typeof vocab.featureKind)[number];

/** The 14 conditions a creature can be in, plus exhaustion. */
export type Condition = (typeof vocab.condition)[number];

/** The 13 damage types. */
export type DamageType = (typeof vocab.damageType)[number];

export type Ability = (typeof vocab.ability)[number];

/**
 * The numbers a feature can move. These are the keys the character sheet
 * computes, so a `stat_modifier` targeting one of these is applied by
 * computeDerivedStats rather than by name matching.
 */
export type Stat = (typeof vocab.stat)[number];

/** How often a limit or resource refills. */
export type Recharge = (typeof vocab.recharge)[number];

/** The window a limit counts within. */
export type LimitPer = (typeof vocab.limitPer)[number];

/** What kind of counter a resource is. */
export type ResourceKind = (typeof vocab.resourceKind)[number];

/**
 * What a reaction (or other conditional feature) waits for. Closed, because the
 * turn engine matches on it to decide whether to offer the feature.
 */
export type TriggerEvent = (typeof vocab.triggerEvent)[number];

export type TriggerAt = (typeof vocab.triggerAt)[number];

export type RangeUnit = (typeof vocab.rangeUnit)[number];

/** What a feature can be pointed at. `object` covers Magic Missile on an object,
 * Fire Shield, Haste and spells used on a door or a chest. */
export type TargetScope = (typeof vocab.targetScope)[number];
export type AreaShape = (typeof vocab.shape)[number];
export type DurationUnit = (typeof vocab.durationUnit)[number];
export type ResolutionMode = (typeof vocab.resolutionMode)[number];
export type OnSave = (typeof vocab.onSave)[number];
export type OnFailure = (typeof vocab.onFailure)[number];
export type CheckType = (typeof vocab.checkType)[number];
export type CoverKind = (typeof vocab.coverKind)[number];
export type SenseKind = (typeof vocab.senses)[number];
export type Proficiency = (typeof vocab.proficiency)[number];
export type SpellModifierChange = (typeof vocab.spellModifierChange)[number];

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export interface DiceSpec {
  /** Dice expression, e.g. "1d8", "2d6+1d4", "1". */
  dice: string;
  /** Ability whose modifier is added, if any. */
  bonusFrom?: Ability | "none";
  /** Flat bonus added after the dice. */
  flat?: number;
  /**
   * Extra dice that scale with character level, which is one of the most
   * common patterns in the game: Second Wind heals 1d10 plus 1d10 per level
   * above 1, and Eldritch Blast gains beams rather than damage. `above` is the
   * level from which the scaling starts, so 1 means "per level above 1".
   */
  perLevel?: { dice: string; above?: number };
}

/**
 * How an effect is applied. A feature is a saving throw, an attack roll, or
 * automatic - all three occur often enough that modelling only saves would
 * force a change to this file later.
 */
export type Resolution =
  | {
      mode: "save";
      ability: Ability;
      /** What happens on a success. `null` means the effect always lands. */
      onSuccess: OnSave;
      onFailure?: OnFailure;
    }
  | {
      mode: "attack";
      /** Ability used for the attack roll, when not a spell. */
      ability?: Ability;
      /** e.g. "5 ft melee", "60 ft ranged". */
      reaches?: string[];
      note?: string;
    }
  | { mode: "auto" };

export interface TargetSpec {
  scope: TargetScope;
  range?: { value: number; unit: RangeUnit };
  shape?: AreaShape;
  /** For limits such as "up to three creatures". */
  count?: number;
  description?: string;
}

/**
 * Fields every modifier-style effect shares. `duration` is written explicitly
 * rather than inferred from the activation, because "while the effect is active"
 * and "forever" are both meaningful and a reader should not have to reason about
 * whether the feature is passive to know which one applies.
 */
export interface TransientEffect {
  duration?: (typeof vocab.statModifierDuration)[number];
}

export interface DurationSpec {
  value: number;
  unit: DurationUnit;
}

/**
 * Effects are a discriminated union on `kind`. Each variant declares its own
 * required fields, so the compiler and the validator both enforce that a
 * `damage` effect carries dice, a damage type and a resolution. Adding a
 * variant is additive.
 */
export type Effect =
  | { kind: "damage"; dice: DiceSpec; damageType: DamageType; resolution: Resolution }
  | { kind: "heal"; dice: DiceSpec; resolution: Resolution }
  | { kind: "temp_hp"; dice: DiceSpec; note?: string }
  | { kind: "heal_hit_dice"; pool: string; amount: string; note?: string }
  | { kind: "reduce_damage"; dice: DiceSpec; note?: string }
  | {
      kind: "stat_modifier";
      stat: Stat;
      amount: number | string;
      duration: (typeof vocab.statModifierDuration)[number];
    }
  | ({ kind: "speed_modifier"; amount: number; unit: "ft" } & TransientEffect)
  | ({ kind: "extra_attacks"; count: number; note?: string } & TransientEffect)
  | ({ kind: "extra_action"; count: number; note?: string } & TransientEffect)
  | ({ kind: "advantage"; check: Ability | CheckType; value: (typeof vocab.advantageValue)[number] } & TransientEffect)
  | { kind: "reactions_without_cost"; count: number; note?: string }
  | ({ kind: "resistance"; damageTypes: DamageType[]; note?: string } & TransientEffect)
  | ({ kind: "immunity"; damageTypes?: DamageType[]; conditions?: Condition[]; note?: string } & TransientEffect)
  | ({ kind: "condition_immunity"; conditions: Condition[] } & TransientEffect)
  | { kind: "cover"; cover: CoverKind }
  | ({ kind: "ac_bonus"; amount: number; requires?: string } & TransientEffect)
  | { kind: "condition"; action: (typeof vocab.conditionAction)[number]; conditions: Condition[]; duration?: DurationSpec }
  | { kind: "resource"; action: (typeof vocab.resourceAction)[number]; resource: string; amount: number }
  | { kind: "slot"; action: (typeof vocab.slotAction)[number]; level: number; count: number; note?: string }
  | {
      kind: "control";
      action: (typeof vocab.controlAction)[number];
      distance?: { value: number; unit: "ft" };
      resolution?: Resolution;
    }
  | { kind: "teleport"; distance?: { value: number; unit: "ft" }; mustBeUnoccupied?: boolean }
  | { kind: "swap_places"; note?: string }
  | {
      kind: "transform";
      /**
       * A form slot from forms.json. Optional when the owning feature carries a
       * `formCap`, which is the common case for shape-shifting features whose
       * cap is the only thing that changes with level.
       */
      formId?: string;
      formTable?: string;
      hitPoints?: DiceSpec | (typeof vocab.formHitPoints)[number];
      speed?: string;
      abilities?: Ability[];
      note?: string;
    }
  | {
      kind: "summon";
      /** Feature ids that make up the summoned creature's own actions. */
      features: string[];
      formId: string;
      cr?: string;
      initiative?: (typeof vocab.initiativeMode)[number];
      /** Separate-initiative summons act on their own turn. */
      hasOwnTurn?: boolean;
      control?: (typeof vocab.summonControl)[number];
      duration?: DurationSpec;
    }
  | { kind: "terrain"; terrain: string; area?: TargetSpec; duration?: DurationSpec; note?: string }
  | { kind: "disguise"; note?: string }
  | { kind: "senses"; sense: SenseKind; range?: number }
  | { kind: "language"; languages: string[] }
  | { kind: "skill"; skills: string[]; proficiency?: Proficiency }
  | { kind: "skill_bonus"; skills: string[]; amount: number; note?: string }
  | { kind: "tool"; tools: string[]; proficiency?: Proficiency }
  | {
      kind: "spell_modifier";
      /** Which parts of a spell this can change. */
      changes: SpellModifierChange[];
      /** Minimum spell level it applies to, if restricted. */
      atLeastLevel?: number;
      /** Sorcery points, when the modifier costs a resource. */
      cost?: { resource: string; amount: number };
      note?: string;
    }
  | {
      /**
       * Grants spell access without being a spell itself, which is what Magic
       * Initiate does. Distinct from `spell_modifier`, which changes a spell you
       * can already cast.
       */
      kind: "spell_grant";
      cantrip?: { known: true };
      spells?: { level: number; from: string[] }[];
      atLevel?: number;
      note?: string;
    }
  | {
      /**
       * A choice the player makes: "choose N from a named list". Fighting Style,
       * Divine Domain, Eldritch Invocations, Sorcerer abilities, Metamagic
       * options and Mechanic are all this, and each was previously being written
       * as prose because the construct had no name.
       */
      kind: "choice";
      /** The list chosen from; must be one of vocab.choiceList. */
      of: (typeof vocab.choiceList)[number];
      /** How many entries are chosen. */
      count: number;
      /** Level at which the choice becomes available, when it is not immediate. */
      atLevel?: number;
      /** Explicit options, for a short list that does not warrant its own file. */
      from?: string[];
      note?: string;
    }
  | { kind: "restriction"; rules: string[]; note?: string }
  | { kind: "special"; note: string; reference?: string };

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** A counter shared across features. */
export interface ResourceDef {
  id: string;
  name: string;
  kind: ResourceKind;
  /** How the pool refills. `slots` and `hit_dice` reset on a rest. */
  recharge: Recharge;
  /** A flat maximum, for fixed pools like Channel Divinity. */
  max?: number;
  /**
   * A level-keyed maximum, for pools that grow. Keys are character levels and
   * must be ascending. The validator requires a value at the first key and
   * rejects levels above 20.
   */
  maxByLevel?: Record<string, number>;
  /**
   * A maximum that comes from an ability modifier rather than a number, which is
   * what Bardic Inspiration (Charisma modifier) and Lay on Hands (Charisma
   * modifier times level) need. Mutually exclusive with max and maxByLevel.
   */
  maxFromAbility?: { ability: Ability; perLevel?: number; minimum?: number };
  /**
   * Where the maximum comes from when it is neither a number nor an ability
   * modifier. Hit Dice are one per character level, and spell slots come from
   * the casting class's table, so neither can be written as a number here.
   */
  maxFrom?: "level" | "class_table";
  book: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export interface TriggerSpec {
  event: TriggerEvent;
  /** Narrow the trigger, e.g. only damage from a source you can see. */
  fromDamageType?: DamageType[];
  /** Only when the situation matches, e.g. "when reduced to 0 hp". */
  at?: TriggerAt;
  note?: string;
}

export interface LimitSpec {
  per: LimitPer;
  max: number;
}

export interface CostSpec {
  resource: string;
  amount: number;
}

export interface SourceRef {
  book: string;
  /** Sourcebook page, when known, for proofreading. */
  page?: number;
  /** Official rules reference, e.g. "PHB Barbarian 31". */
  reference?: string;
}

/**
 * A named state the character sheet tracks, e.g. `raging`, `unarmored`. Ids
 * must exist in states.json, so a typo cannot gate a feature off silently.
 */
export type GateId = string;

/**
 * What a character must already have to take a feature. Feats are where this
 * matters: Great Weapon Master needs Strength 13 *and* heavy weapon proficiency,
 * Crossbow Expert needs light crossbow proficiency, and Fighting Initiate
 * requires a martial weapon fighting style, which is itself a class feature.
 */
export interface RequiresSpec {
  /** Minimum score in each listed ability. */
  abilities?: Partial<Record<Ability, number>>;
  /** Skill proficiencies required. */
  skills?: string[];
  /** Armor, weapon or tool proficiencies required. */
  proficiencies?: string[];
  /** Ids of other features required, such as a fighting style. */
  features?: string[];
  /** Minimum character level. */
  minLevel?: number;
  note?: string;
}

/** A playable race, from races.json. */
export interface RaceDef {
  id: string;
  name: string;
  book: string;
  page?: number;
  note?: string;
  variants?: RaceVariant[];
}

/**
 * A race variant. A variant with `variantFrom` carries no traits of its own; it
 * borrows another race's variant list, which is how a 2014 half-elf takes
 * exactly one elf variant instead of all of them.
 */
export interface RaceVariant {
  id: string;
  name: string;
  book?: string;
  page?: number;
  variantFrom?: string;
  note?: string;
}

export interface RaceRegistry {
  schemaVersion: number;
  ruleset: "2014";
  books: Record<string, string>;
  races: RaceDef[];
  note?: string;
}

export interface FeatureBase {
  id: string;
  name: string;
  kind: FeatureKind;
  /** Class, subclass, race, feat, background or monster that grants it. */
  owner: string;
  /**
   * For a race variant, e.g. "Mountain" on a Dwarf feature, or "Chromatic" on a
   * Dragonborn one. 2014 splits Dragonborn, Dwarf, Elf, Gnome and Halfling into
   * variants, and the variants share most of their parent's traits; putting the
   * variant here keeps the shared traits on the parent instead of duplicating
   * darkvision across nineteen entries.
   */
  variant?: string;
  /** Level or other entry point. Absent for feats and backgrounds. */
  unlock?: number;
  activation: Activation;
  /** Resources spent to use it. */
  cost?: CostSpec[];
  /**
   * How many times it can be used in a window. Omit when the resource's
   * `max` already is the limit, which is why Wild Shape carries a cost and no
   * limit while Second Wind carries a limit and no cost.
   */
  limits?: LimitSpec;
  /** Required for every `reaction`, and for anything conditional. */
  trigger?: TriggerSpec;
  targeting?: TargetSpec;
  duration?: DurationSpec;
  /** What ends an effect before its duration runs out. */
  endsIf?: string[];
  /** States the creature must be in, e.g. `raging`. */
  gates?: GateId[];
  /** What a character must already have to take this feature. */
  requires?: RequiresSpec;
  effects: Effect[];
  /**
   * For shape-shifting features whose only level-dependent value is the
   * challenge-rating cap. Keys are character levels. This exists so Wild Shape
   * does not repeat its whole effect array at every tier.
   */
  formCap?: Record<string, string>;
  /** Level-keyed overrides. Only fields that change at that level. */
  tiers?: Tier[];
  /** Short form for badges. One sentence, no trailing period. */
  summary: string;
  /** Verbatim rules text, for proofreading against the book. */
  text: string;
  source: SourceRef;
}

export type Tier = {
  at: number;
} & Partial<Omit<FeatureBase, "id" | "name" | "tiers" | "text" | "source" | "formCap">>;

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

export interface EngineDataset {
  schemaVersion: number;
  ruleset: "2014";
  resources: ResourceDef[];
  features: FeatureBase[];
  /**
   * States a feature can be gated on. Closed so `gates` cannot reference a
   * typo; extend by adding an entry.
   */
  states: { id: string; name: string; note?: string }[];
}

// ---------------------------------------------------------------------------
// Drift tripwires
// ---------------------------------------------------------------------------

/** Fails to compile unless A and B are the same union. */
type AssertSameUnion<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

/**
 * Only the *keys* of a JSON object survive module resolution as literal types;
 * the values of a JSON array widen to `string`. So the effect vocabulary can be
 * checked in both directions here, and the flat enums cannot.
 *
 * Adding an effect kind to the Effect union without adding it to
 * vocab.effectRequired therefore fails typecheck, and the validator separately
 * rejects a dataset that uses a kind the type does not declare. The flat enums
 * (activation, condition, damageType, ...) are the validator's job: it checks
 * every value in the data against vocab.json, which the compiler never sees.
 */
type EffectKind = Effect["kind"];
type DeclaredKinds = keyof typeof vocab.effectRequired;

const _everyKindIsDeclared: AssertSameUnion<EffectKind, DeclaredKinds> = true;
const _everyDeclaredKindExists: Record<DeclaredKinds, true> = {
  spell_grant: true,
  choice: true,
  skill_bonus: true,
  damage: true,
  heal: true,
  temp_hp: true,
  heal_hit_dice: true,
  reduce_damage: true,
  stat_modifier: true,
  speed_modifier: true,
  extra_attacks: true,
  extra_action: true,
  advantage: true,
  reactions_without_cost: true,
  resistance: true,
  immunity: true,
  condition_immunity: true,
  cover: true,
  ac_bonus: true,
  condition: true,
  resource: true,
  slot: true,
  control: true,
  teleport: true,
  swap_places: true,
  transform: true,
  summon: true,
  terrain: true,
  disguise: true,
  senses: true,
  language: true,
  skill: true,
  tool: true,
  spell_modifier: true,
  restriction: true,
  special: true,
};

export {};
