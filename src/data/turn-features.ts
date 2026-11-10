// Which features a player actively uses on a turn: what they take (action,
// bonus action, reaction, or nothing) and what they spend. Checked by hand
// against the rulebooks; the combat engine data is not used here because it
// has wrong entries. A feature with no rule stays in the "always on" list.
import type { Character } from "@/lib/storage";

export type FeatureSlot = "action" | "bonus" | "reaction" | "free";

/** When a feature applies, shown as one short line. Locale keys `turn.when.*`. */
export type FeatureWhen =
  | "onHit" | "onAttackRoll" | "afterAttack" | "afterDash" | "firstAttack" | "onFailSave" | "onDamage"
  | "whenAttacked" | "onMiss" | "whileRaging" | "afterCast" | "atZeroHp" | "onCritOrKill" | "oncePerTurn";

export type PoolField =
  | "rages" | "kiPoints" | "channelDivinityUses" | "actionSurgeUses" | "indomitableUses" | "layOnHandsPool"
  | "wildShapeUses" | "sorceryPoints" | "bardicInspirationUses" | "superiorityDice" | "luckPoints";

type Count = number | ((c: Character) => number);

export interface FeatureRule {
  /** Matched against the start of the feature's name. */
  name: RegExp;
  slot: FeatureSlot;
  when?: FeatureWhen;
  /** Spends from a pool the sheet tracks. */
  pool?: { field: PoolField; amount: number };
  /** The player chooses how much of the pool to spend (Lay on Hands). */
  variablePool?: PoolField;
  /** Its own uses, counted in `character.featureUses` and refilled on a rest. */
  uses?: { max: Count; per: "short" | "long" };
  /** Spends the lowest open spell slot. */
  spellSlot?: boolean;
  /** Action Surge: the action comes back. */
  restoresAction?: boolean;
  /** A bonus action instead, when the character has a feature matching this. */
  bonusWith?: RegExp;
  /** Only for characters this returns true for (same name, different rule). */
  only?: (c: Character) => boolean;
}

const mod = (score: number | undefined) => Math.floor(((score ?? 10) - 10) / 2);
const atLeast1 = (n: number) => Math.max(1, n);
const prof = (c: Character) => 2 + Math.floor(((c.level || 1) - 1) / 4);
const WIS = (c: Character) => atLeast1(mod(c.wis));
const CHA = (c: Character) => atLeast1(mod(c.cha));
const INT = (c: Character) => atLeast1(mod(c.int));
const CON = (c: Character) => atLeast1(mod(c.con));

const cd = { field: "channelDivinityUses", amount: 1 } as const;
const ki = (amount: number) => ({ field: "kiPoints", amount }) as const;
const bardic = { field: "bardicInspirationUses", amount: 1 } as const;
const wild = { field: "wildShapeUses", amount: 1 } as const;
const sp = (amount: number) => ({ field: "sorceryPoints", amount }) as const;
const short1 = { max: 1, per: "short" } as const;
const long1 = { max: 1, per: "long" } as const;

// Order matters: the first rule whose name (and `only`) matches wins.
export const FEATURE_RULES: FeatureRule[] = [
  // ----- Channel Divinity options (one use each) -----
  { name: /^Channel Divinity: (Vow of Enmity|Champion Challenge|Turn the Tide|Emissary of Peace|Peerless Athlete|Inspiring Smite)/, slot: "bonus", pool: cd },
  { name: /^Channel Divinity: (Guided Strike)/, slot: "free", when: "onAttackRoll", pool: cd },
  { name: /^Channel Divinity: (Destructive Wrath)/, slot: "free", when: "onHit", pool: cd },
  { name: /^Channel Divinity: (Touch of Death)/, slot: "free", when: "onHit", pool: cd },
  { name: /^Channel Divinity: (War God's Blessing|Rebuke the Violent)/, slot: "reaction", pool: cd },
  { name: /^Channel Divinity: (Turn Undead|Preserve Life|Radiance of the Dawn|Invoke Duplicity|Cloak of Shadows|Charm Animals and Plants|Knowledge of the Ages|Read Thoughts|Arcane Abjuration|Order's Demand|Balm of Peace|Twilight Sanctuary|Sacred Weapon|Turn the Unholy|Nature's Wrath|Turn the Faithless|Abjure Enemy|Conquering Presence|Control Undead|Dreadful Aspect|Watcher's Will|Abjure the Extraplanar)/, slot: "action", pool: cd },
  { name: /^Path to the Grave/, slot: "action", pool: cd },

  // ----- Barbarian -----
  { name: /^Rage$/, slot: "bonus", pool: { field: "rages", amount: 1 } },
  { name: /^Reckless Attack/, slot: "free", when: "firstAttack" },
  { name: /^Frenzy/, slot: "bonus", when: "whileRaging" },
  { name: /^Divine Fury/, slot: "free", when: "onHit" },
  { name: /^Intimidating Presence/, slot: "action" },
  { name: /^Retaliation/, slot: "reaction", when: "onDamage" },
  { name: /^Spirit Shield/, slot: "reaction", when: "whileRaging" },
  { name: /^Zealous Presence/, slot: "bonus", uses: long1 },

  // ----- Bard -----
  { name: /^Bardic Inspiration/, slot: "bonus", pool: bardic },
  { name: /^Countercharm/, slot: "action" },
  { name: /^Cutting Words/, slot: "reaction", pool: bardic },
  { name: /^Blade Flourish/, slot: "free", when: "onHit", pool: bardic },
  { name: /^Psychic Blades/, slot: "free", when: "onHit", pool: bardic, only: (c) => c.class === "Bard" },
  { name: /^Unsettling Words/, slot: "bonus", pool: bardic },
  { name: /^Mantle of Inspiration/, slot: "bonus", pool: bardic },

  // ----- Cleric -----
  { name: /^War Priest/, slot: "bonus", when: "afterAttack", uses: { max: WIS, per: "long" } },
  { name: /^Warding Flare/, slot: "reaction", when: "whenAttacked", uses: { max: WIS, per: "long" } },
  { name: /^Wrath of the Storm/, slot: "reaction", when: "onDamage", uses: { max: WIS, per: "long" } },
  { name: /^Dampen Elements/, slot: "reaction" },
  { name: /^Divine Intervention$/, slot: "action", uses: long1 },
  { name: /^Eyes of the Grave/, slot: "action", uses: { max: WIS, per: "long" } },
  { name: /^Sentinel at Death's Door/, slot: "reaction", uses: { max: WIS, per: "long" } },
  { name: /^Emboldening Bond/, slot: "action", uses: { max: prof, per: "long" } },
  { name: /^Steps of Night/, slot: "bonus", uses: { max: prof, per: "long" } },

  // ----- Druid -----
  { name: /^Wild Shape/, slot: "action", pool: wild, bonusWith: /^Combat Wild Shape/ },
  { name: /^Symbiotic Entity/, slot: "action", pool: wild },
  { name: /^Starry Form/, slot: "bonus", pool: wild },
  { name: /^Summon Wildfire Spirit/, slot: "action", pool: wild },
  { name: /^Halo of Spores/, slot: "reaction" },
  { name: /^Spirit Totem/, slot: "bonus", uses: short1 },
  { name: /^Hidden Paths/, slot: "bonus", uses: { max: WIS, per: "long" } },
  { name: /^Cosmic Omen/, slot: "reaction", uses: { max: prof, per: "long" } },

  // ----- Fighter -----
  { name: /^Second Wind/, slot: "bonus", uses: short1 },
  { name: /^Action Surge/, slot: "free", pool: { field: "actionSurgeUses", amount: 1 }, restoresAction: true },
  { name: /^Indomitable \(/, slot: "free", when: "onFailSave", pool: { field: "indomitableUses", amount: 1 } },
  { name: /^Combat Superiority/, slot: "free", when: "onAttackRoll", pool: { field: "superiorityDice", amount: 1 } },
  { name: /^(Improved )?War Magic/, slot: "bonus", when: "afterCast" },
  { name: /^Fighting Spirit/, slot: "bonus", uses: { max: 3, per: "long" } },
  { name: /^Manifest Echo/, slot: "bonus" },
  { name: /^Unleash Incarnation/, slot: "free", when: "afterAttack", uses: { max: CON, per: "long" } },
  { name: /^Giant's Might/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Warding Maneuver/, slot: "reaction", uses: { max: CON, per: "long" } },
  { name: /^Arcane Shot$/, slot: "free", when: "onHit", uses: { max: 2, per: "short" } },

  // ----- Monk -----
  { name: /^Flurry of Blows/, slot: "bonus", when: "afterAttack", pool: ki(1) },
  { name: /^Patient Defense/, slot: "bonus", pool: ki(1) },
  { name: /^Step of the Wind/, slot: "bonus", pool: ki(1) },
  { name: /^Martial Arts/, slot: "bonus", when: "afterAttack" },
  { name: /^Deflect Missiles/, slot: "reaction", when: "whenAttacked" },
  { name: /^Slow Fall/, slot: "reaction" },
  { name: /^Stunning Strike/, slot: "free", when: "onHit", pool: ki(1) },
  { name: /^Stillness of Mind/, slot: "action" },
  { name: /^Empty Body/, slot: "action", pool: ki(4) },
  { name: /^Wholeness of Body/, slot: "action", uses: long1 },
  { name: /^Quivering Palm/, slot: "free", when: "onHit", pool: ki(3) },
  { name: /^Shadow Arts/, slot: "action", pool: ki(2) },
  { name: /^Shadow Step/, slot: "bonus" },
  { name: /^Hand of Healing/, slot: "action", pool: ki(1) },
  { name: /^Hand of Harm/, slot: "free", when: "onHit", pool: ki(1) },
  { name: /^Searing Arc Strike/, slot: "bonus", when: "afterAttack", pool: ki(2) },
  { name: /^Arms of the Astral Self/, slot: "bonus", pool: ki(1) },
  { name: /^Cloak of Shadows/, slot: "action" },
  { name: /^Opportunist/, slot: "reaction" },
  { name: /^Drunkard's Luck/, slot: "free", pool: ki(2) },

  // ----- Paladin -----
  { name: /^Divine Sense/, slot: "action", uses: { max: (c) => 1 + CHA(c), per: "long" } },
  { name: /^Lay on Hands/, slot: "action", variablePool: "layOnHandsPool" },
  { name: /^Divine Smite/, slot: "free", when: "onHit", spellSlot: true },
  { name: /^Cleansing Touch/, slot: "action", uses: { max: CHA, per: "long" } },
  { name: /^Glorious Defense/, slot: "reaction", when: "whenAttacked", uses: { max: CHA, per: "long" } },
  { name: /^Vigilant Rebuke/, slot: "reaction" },
  { name: /^(Holy Nimbus|Elder Champion|Avenging Angel)/, slot: "action", uses: long1 },

  // ----- Ranger -----
  { name: /^Primeval Awareness/, slot: "action", spellSlot: true },
  { name: /^Vanish/, slot: "bonus" },
  { name: /^Planar Warrior/, slot: "bonus" },
  { name: /^Slayer's Prey/, slot: "bonus" },
  { name: /^Hunter's Sense/, slot: "action", uses: { max: WIS, per: "long" } },
  { name: /^Dreadful Strikes/, slot: "free", when: "onHit" },
  { name: /^Gathered Swarm/, slot: "free", when: "onHit" },
  { name: /^Stalker's Flurry/, slot: "free", when: "onMiss" },
  { name: /^Ethereal Step/, slot: "bonus", uses: short1 },
  { name: /^(Shadowy Dodge|Spectral Defense|Slayer's Counter)/, slot: "reaction" },

  // ----- Rogue -----
  { name: /^Sneak Attack/, slot: "free", when: "oncePerTurn" },
  { name: /^Cunning Action/, slot: "bonus" },
  { name: /^Fast Hands/, slot: "bonus" },
  { name: /^Uncanny Dodge/, slot: "reaction", when: "whenAttacked" },
  { name: /^Stroke of Luck/, slot: "free", when: "onMiss", uses: short1 },
  { name: /^Insightful Fighting/, slot: "bonus" },
  { name: /^Master of Tactics/, slot: "bonus" },
  { name: /^Skirmisher/, slot: "reaction" },
  { name: /^Panache/, slot: "action" },
  { name: /^Misdirection/, slot: "reaction" },
  { name: /^Wails from the Grave/, slot: "free", when: "onHit", uses: { max: prof, per: "long" } },

  // ----- Sorcerer -----
  { name: /^Favored by the Gods/, slot: "free", when: "onFailSave", uses: short1 },
  { name: /^Tides of Chaos/, slot: "free", when: "onAttackRoll", uses: long1 },
  { name: /^Bend Luck/, slot: "reaction", pool: sp(2) },
  { name: /^Hound of Ill Omen/, slot: "bonus", pool: sp(3) },
  { name: /^Empowered Healing/, slot: "free", pool: sp(1) },
  { name: /^Draconic Presence/, slot: "action", pool: sp(5) },
  { name: /^(Dragon Wings|Otherworldly Wings)/, slot: "bonus" },
  { name: /^Unearthly Recovery/, slot: "bonus", uses: long1 },
  { name: /^Restore Balance/, slot: "reaction", uses: { max: prof, per: "long" } },
  { name: /^Tempestuous Magic/, slot: "bonus", when: "afterCast" },
  { name: /^Storm's Fury/, slot: "reaction", when: "onDamage" },

  // ----- Warlock -----
  { name: /^Fey Presence/, slot: "action", uses: short1 },
  { name: /^Misty Escape/, slot: "reaction", when: "onDamage", uses: short1 },
  { name: /^Dark One's Own Luck/, slot: "free", when: "onFailSave", uses: short1 },
  { name: /^Entropic Ward/, slot: "reaction", when: "whenAttacked", uses: short1 },
  { name: /^Hexblade's Curse/, slot: "bonus", uses: short1 },
  { name: /^Healing Light/, slot: "bonus", uses: { max: (c) => 1 + (c.level || 1), per: "long" } },
  { name: /^Hurl Through Hell/, slot: "free", when: "onHit", uses: long1 },
  { name: /^Dark Delirium/, slot: "action", uses: short1 },
  { name: /^Tentacle of the Deeps/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Form of Dread/, slot: "bonus", uses: { max: prof, per: "long" } },

  // ----- Wizard -----
  { name: /^Portent/, slot: "free", when: "onAttackRoll", uses: { max: (c) => ((c.level || 1) >= 14 ? 3 : 2), per: "long" } },
  { name: /^Arcane Deflection/, slot: "reaction", when: "whenAttacked" },
  { name: /^Instinctive Charm/, slot: "reaction", when: "whenAttacked" },
  { name: /^Hypnotic Gaze/, slot: "action" },
  { name: /^Benign Transposition/, slot: "action", uses: long1 },
  { name: /^Illusory Self/, slot: "reaction", when: "whenAttacked", uses: short1 },
  { name: /^Overchannel/, slot: "free", when: "afterCast" },
  { name: /^Chronal Shift/, slot: "reaction", uses: { max: 2, per: "long" } },
  { name: /^Momentary Stasis/, slot: "action", uses: { max: INT, per: "long" } },
  { name: /^Projected Ward/, slot: "reaction" },
  { name: /^Command Undead/, slot: "action" },
  { name: /^Song of Defense/, slot: "reaction", when: "onDamage", spellSlot: true },
  { name: /^Violent Attraction/, slot: "reaction", uses: { max: INT, per: "long" } },
  { name: /^Manifest Mind/, slot: "bonus" },
  { name: /^Bladesong/, slot: "bonus", uses: { max: prof, per: "long" } },

  // ----- Artificer -----
  { name: /^Flash of Genius/, slot: "reaction", uses: { max: INT, per: "long" } },
  { name: /^Magical Tinkering/, slot: "action" },
  { name: /^Arcane Jolt/, slot: "free", when: "onHit", uses: { max: INT, per: "long" } },
  { name: /^Eldritch Cannon/, slot: "action" },
  { name: /^Steel Defender/, slot: "bonus" },

  // ----- Races -----
  { name: /^Breath Weapon/, slot: "action", uses: short1, only: (c) => c.race === "Dragonborn" },
  { name: /^Breath Weapon/, slot: "action", uses: { max: prof, per: "long" } },
  { name: /^Relentless Endurance/, slot: "free", when: "atZeroHp", uses: long1 },
  { name: /^Hidden Step/, slot: "bonus", uses: short1 },
  { name: /^Fury of the Small/, slot: "free", when: "onHit", uses: short1 },
  { name: /^Nimble Escape/, slot: "bonus" },
  { name: /^Aggressive/, slot: "bonus" },
  { name: /^Shifting/, slot: "bonus", uses: short1 },
  { name: /^Fey Step/, slot: "bonus", uses: short1 },
  { name: /^Blessing of the Raven Queen/, slot: "bonus", uses: long1 },
  { name: /^Hungry Jaws/, slot: "bonus", uses: short1 },
  { name: /^Shell Defense/, slot: "action" },
  { name: /^Saving Face/, slot: "free", when: "onMiss", uses: short1 },
  { name: /^(Goring Rush|Charge)$/, slot: "bonus", when: "afterDash" },
  { name: /^Healing Hands/, slot: "action", uses: long1 },
  { name: /^(Radiant Consumption|Necrotic Shroud)/, slot: "action", uses: long1 },
  { name: /^Stone's Endurance/, slot: "reaction", when: "onDamage", uses: short1 },
  { name: /^Grovel, Cower, and Beg/, slot: "action", uses: short1 },
  { name: /^Hammering Horns/, slot: "bonus", when: "afterAttack" },

  // ----- Feats -----
  { name: /^Lucky$/, slot: "free", when: "onAttackRoll", pool: { field: "luckPoints", amount: 1 }, only: (c) => (c.maxLuckPoints || 0) > 0 },
  { name: /^Great Weapon Master/, slot: "bonus", when: "onCritOrKill" },
  { name: /^Polearm Master/, slot: "bonus", when: "afterAttack" },
  { name: /^Crossbow Expert/, slot: "bonus", when: "afterAttack" },
  { name: /^Shield Master/, slot: "bonus", when: "afterAttack" },
  { name: /^Charger/, slot: "bonus", when: "afterDash" },
  { name: /^Tavern Brawler/, slot: "bonus", when: "onHit" },
  { name: /^Sentinel$/, slot: "reaction" },
  { name: /^War Caster/, slot: "reaction" },
  { name: /^Mage Slayer/, slot: "reaction" },
  { name: /^Defensive Duelist/, slot: "reaction", when: "whenAttacked" },
  { name: /^Healer$/, slot: "action" },
  { name: /^Telekinetic/, slot: "bonus" },
  { name: /^Second Chance/, slot: "reaction", when: "whenAttacked", uses: short1 },
];

/** A stable key for a rule's own uses, from its pattern. */
export function ruleKey(rule: FeatureRule): string {
  return rule.name.source;
}

export function usesMax(rule: FeatureRule, character: Character): number {
  if (!rule.uses) return 0;
  return Math.max(1, typeof rule.uses.max === "function" ? rule.uses.max(character) : rule.uses.max);
}

/** The rule for a feature name on this character, if it is one the player uses on a turn. */
export function ruleFor(character: Character, featureName: string): FeatureRule | undefined {
  return FEATURE_RULES.find((r) => r.name.test(featureName) && (!r.only || r.only(character)));
}

/** Counted uses that a rest gives back: all of them on a long rest, the short-rest ones on a short rest. */
export function featureUsesAfterRest(used: Record<string, number> | undefined, kind: "short" | "long"): Record<string, number> {
  if (kind === "long" || !used) return {};
  const shortKeys = new Set(FEATURE_RULES.filter((r) => r.uses?.per === "short").map(ruleKey));
  return Object.fromEntries(Object.entries(used).filter(([key]) => !shortKeys.has(key)));
}
