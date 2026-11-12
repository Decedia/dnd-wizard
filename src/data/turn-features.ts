// Which features a player actively uses on a turn: what they take (action,
// bonus action, reaction, or nothing) and what they spend. Checked by hand
// against the rulebooks. The Features tab and the turn helper both read it.
// A feature with no rule stays in the "always on" list.
import type { Character } from "@/lib/storage";

export type FeatureSlot = "action" | "bonus" | "reaction" | "free";

/** When a feature applies, shown as one short line. Locale keys `turn.when.*`. */
export type FeatureWhen =
  | "onHit" | "onAttackRoll" | "afterAttack" | "afterDash" | "firstAttack" | "onFailSave" | "onDamage"
  | "whenAttacked" | "onMiss" | "whileRaging" | "afterCast" | "atZeroHp" | "onCritOrKill" | "oncePerTurn" | "onCast"
  | "onFail" | "onFailCheck" | "onInitiative";

export type PoolField =
  | "rages" | "kiPoints" | "channelDivinityUses" | "actionSurgeUses" | "indomitableUses" | "layOnHandsPool"
  | "wildShapeUses" | "sorceryPoints" | "bardicInspirationUses" | "superiorityDice" | "luckPoints" | "psionicDice";

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
  /**
   * Its own uses, counted in `character.featureUses` and refilled on a rest.
   * `shortRegain`: a long-rest feature that gets this many back on a short rest (2024 Second Wind).
   */
  uses?: { max: Count; per: "short" | "long"; shortRegain?: number };
  /** Counts its uses under this key, shared with another feature (Tactical Mind spends Second Wind). */
  usesKey?: string;
  /** Using it fills this pool back to its maximum (Uncanny Metabolism). */
  refill?: PoolField;
  /** When its own uses are gone, it can still be used by spending this pool (Psi Warrior). */
  orPool?: { field: PoolField; amount: number };
  /** Using it gives one back to this pool, up to its maximum (Psi Warrior's recovery). */
  gain?: PoolField;
  /** Spends the lowest open spell slot. */
  spellSlot?: boolean;
  /** Action Surge: the action comes back. */
  restoresAction?: boolean;
  /** A bonus action instead, when the character has a feature matching this. */
  bonusWith?: RegExp;
  /** Only for characters this returns true for (same name, different rule). */
  only?: (c: Character) => boolean;
  /** Usable once per turn: greyed out after a tap until End turn. */
  oncePerTurn?: boolean;
  /** A condition the player checks, shown as one line. Locale key `turn.cond.<condition>`. */
  condition?: string;
  /**
   * Fires by itself when its trigger happens (an attack hits): no tap, nothing to
   * spend, and nothing the app can't see. A function when it only fires in some
   * state (Divine Fury while raging). The player can still take it off the hit.
   */
  auto?: boolean | ((c: Character) => boolean);
  /** The damage dice it adds when used on a hit ("1d8"), by character level. */
  dice?: (c: Character) => string;
}

const mod = (score: number | undefined) => Math.floor(((score ?? 10) - 10) / 2);
const atLeast1 = (n: number) => Math.max(1, n);
const prof = (c: Character) => 2 + Math.floor(((c.level || 1) - 1) / 4);
const WIS = (c: Character) => atLeast1(mod(c.wis));
const CHA = (c: Character) => atLeast1(mod(c.cha));
const INT = (c: Character) => atLeast1(mod(c.int));
const lvl = (c: Character) => c.level || 1;
/** Dice that grow at set levels: byLevel([[1, "1d4"], [6, "1d6"]]). */
const byLevel = (steps: [number, string][]) => (c: Character) => steps.filter(([from]) => lvl(c) >= from).pop()?.[1] ?? steps[0][1];
const CON = (c: Character) => atLeast1(mod(c.con));
/** A count that grows at set levels: byCount([[1, 2], [5, 3]]). */
const byCount = (steps: [number, number][]) => (c: Character) => steps.filter(([at]) => lvl(c) >= at).pop()?.[1] ?? steps[0][1];

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
  { name: /^Divine Fury/, slot: "free", when: "onHit", oncePerTurn: true, condition: "firstHit", auto: (c) => (c.activeStates || []).includes("raging"), dice: (c) => `1d6+${Math.floor(lvl(c) / 2)}` },
  { name: /^Intimidating Presence/, slot: "action" },
  { name: /^Retaliation/, slot: "reaction", when: "onDamage" },
  { name: /^Spirit Shield/, slot: "reaction", when: "whileRaging" },
  { name: /^Zealous Presence/, slot: "bonus", uses: long1 },
  { name: /^Fanatical Focus/, slot: "free", when: "onFailSave" },
  { name: /^Battlerager Charge/, slot: "bonus", when: "whileRaging" },
  { name: /^Storm Aura/, slot: "bonus", when: "whileRaging" },
  { name: /^Unstable Backlash/, slot: "reaction", when: "whileRaging" },
  { name: /^Call the Hunt/, slot: "free", when: "whileRaging", uses: { max: prof, per: "long" } },
  { name: /^Mighty Impel/, slot: "bonus", when: "whileRaging" },

  // ----- Bard -----
  { name: /^Bardic Inspiration/, slot: "bonus", pool: bardic },
  { name: /^Countercharm/, slot: "action" },
  { name: /^Cutting Words/, slot: "reaction", pool: bardic },
  { name: /^Blade Flourish/, slot: "free", when: "onHit", pool: bardic, oncePerTurn: true },
  { name: /^Psychic Blades/, slot: "free", when: "onHit", pool: bardic, oncePerTurn: true, dice: byLevel([[1, "2d6"], [5, "3d6"], [10, "5d6"], [15, "8d6"]]), only: (c) => c.class === "Bard" },
  { name: /^Unsettling Words/, slot: "bonus", pool: bardic },
  { name: /^Mantle of Inspiration/, slot: "bonus", pool: bardic },
  { name: /^Tales from Beyond/, slot: "bonus", pool: bardic },
  { name: /^Mantle of Majesty/, slot: "bonus", uses: long1 },
  { name: /^Unbreakable Majesty/, slot: "bonus", uses: short1 },
  { name: /^Mantle of Whispers/, slot: "reaction", uses: short1 },

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
  { name: /^Blessing of the Trickster/, slot: "action" },
  { name: /^Corona of Light/, slot: "action" },
  { name: /^Divine Strike/, slot: "free", when: "onHit", oncePerTurn: true, condition: "weapon", auto: true, dice: byLevel([[1, "1d8"], [14, "2d8"]]) },
  { name: /^Blessed Strikes/, slot: "free", when: "onHit", oncePerTurn: true, condition: "cantripOrWeapon", auto: true, dice: () => "1d8" },
  { name: /^Embodiment of the Law/, slot: "free", when: "onCast", uses: { max: WIS, per: "long" } },

  // ----- Druid -----
  { name: /^Wild Shape/, slot: "action", pool: wild, bonusWith: /^Combat Wild Shape/ },
  { name: /^Symbiotic Entity/, slot: "action", pool: wild },
  { name: /^Starry Form/, slot: "bonus", pool: wild },
  { name: /^Summon Wildfire Spirit/, slot: "action", pool: wild },
  { name: /^Halo of Spores/, slot: "reaction" },
  { name: /^Spirit Totem/, slot: "bonus", uses: short1 },
  { name: /^Hidden Paths/, slot: "bonus", uses: { max: WIS, per: "long" } },
  { name: /^Cosmic Omen/, slot: "reaction", uses: { max: prof, per: "long" } },
  { name: /^Fungal Infestation/, slot: "reaction", uses: { max: WIS, per: "long" } },
  { name: /^Cauterizing Flames/, slot: "reaction", uses: { max: prof, per: "long" } },
  { name: /^Blazing Revival/, slot: "free", when: "atZeroHp", uses: long1 },
  { name: /^Balm of the Summer Court/, slot: "bonus" },

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
  { name: /^Arcane Shot$/, slot: "free", when: "onHit", uses: { max: 2, per: "short" }, oncePerTurn: true },
  { name: /^Runic Shield/, slot: "reaction", when: "whenAttacked", uses: { max: prof, per: "long" } },
  { name: /^Telekinetic Adept/, slot: "bonus", uses: short1, orPool: { field: "psionicDice", amount: 1 } },
  { name: /^Guarded Mind/, slot: "free", pool: { field: "psionicDice", amount: 1 } },
  { name: /^Bulwark of Force/, slot: "bonus", uses: long1, orPool: { field: "psionicDice", amount: 1 } },
  { name: /^Telekinetic Master/, slot: "action", uses: long1, orPool: { field: "psionicDice", amount: 1 } },

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
  { name: /^Hand of Harm/, slot: "free", when: "onHit", pool: ki(1), oncePerTurn: true, condition: "unarmed" },
  { name: /^Searing Arc Strike/, slot: "bonus", when: "afterAttack", pool: ki(2) },
  { name: /^Arms of the Astral Self/, slot: "bonus", pool: ki(1) },
  { name: /^Cloak of Shadows/, slot: "action" },
  { name: /^Opportunist/, slot: "reaction" },
  { name: /^Drunkard's Luck/, slot: "free", pool: ki(2) },
  { name: /^Diamond Soul/, slot: "free", when: "onFailSave", pool: ki(1) },
  { name: /^Tipsy Sway/, slot: "reaction", when: "whenAttacked", pool: ki(1) },
  { name: /^Touch of the Long Death/, slot: "action", variablePool: "kiPoints" },
  { name: /^Hand of Ultimate Mercy/, slot: "action", pool: ki(5) },
  { name: /^Searing Sunburst/, slot: "action" },
  { name: /^Sun Shield/, slot: "reaction", when: "onDamage" },
  { name: /^Breath of the Dragon/, slot: "free", when: "afterAttack", uses: { max: prof, per: "long" }, orPool: ki(2) },
  { name: /^Wings Unfurled/, slot: "free", uses: { max: prof, per: "long" } },

  // ----- Paladin -----
  { name: /^Divine Sense/, slot: "action", uses: { max: (c) => 1 + CHA(c), per: "long" } },
  { name: /^Lay on Hands/, slot: "action", variablePool: "layOnHandsPool" },
  { name: /^Divine Smite/, slot: "free", when: "onHit", spellSlot: true },
  { name: /^Improved Divine Smite/, slot: "free", when: "onHit", condition: "meleeWeapon", auto: true, dice: () => "1d8" },
  { name: /^Cleansing Touch/, slot: "action", uses: { max: CHA, per: "long" } },
  { name: /^Glorious Defense/, slot: "reaction", when: "whenAttacked", uses: { max: CHA, per: "long" } },
  { name: /^Vigilant Rebuke/, slot: "reaction" },
  { name: /^(Holy Nimbus|Elder Champion|Avenging Angel|Invincible Conqueror|Dread Lord)/, slot: "action", uses: long1 },
  { name: /^(Living Legend|Mortal Bulwark)/, slot: "bonus", uses: long1 },
  { name: /^(Soul of Vengeance|Divine Allegiance|Aura of the Guardian)/, slot: "reaction" },

  // ----- Ranger -----
  { name: /^Primeval Awareness/, slot: "action", spellSlot: true },
  { name: /^Vanish/, slot: "bonus" },
  { name: /^Planar Warrior/, slot: "bonus" },
  { name: /^Slayer's Prey/, slot: "bonus" },
  { name: /^Hunter's Sense/, slot: "action", uses: { max: WIS, per: "long" } },
  { name: /^Dreadful Strikes/, slot: "free", when: "onHit", oncePerTurn: true, auto: true, dice: byLevel([[1, "1d4"], [11, "1d6"]]) },
  { name: /^Gathered Swarm/, slot: "free", when: "onHit", oncePerTurn: true, auto: true, dice: byLevel([[1, "1d6"], [11, "1d8"]]) },
  { name: /^Stalker's Flurry/, slot: "free", when: "onMiss" },
  { name: /^Ethereal Step/, slot: "bonus", uses: short1 },
  { name: /^(Shadowy Dodge|Spectral Defense|Slayer's Counter|Beguiling Twist)/, slot: "reaction" },
  { name: /^Favored Foe/, slot: "free", when: "onHit", uses: { max: prof, per: "long" }, dice: byLevel([[1, "1d4"], [6, "1d6"], [14, "1d8"]]) },
  { name: /^Dread Ambusher/, slot: "free", when: "onHit", oncePerTurn: true, condition: "firstTurn", auto: (c) => (c.turnRound ?? 1) <= 1, dice: () => "1d8" },
  { name: /^Misty Wanderer/, slot: "bonus", uses: { max: WIS, per: "long" } },
  { name: /^Swarming Dispersal/, slot: "reaction", when: "onDamage", uses: { max: prof, per: "long" } },
  { name: /^Drake Companion/, slot: "action", uses: long1 },
  { name: /^Drake's Breath/, slot: "action", uses: long1 },

  // ----- Rogue -----
  { name: /^Sneak Attack/, slot: "free", when: "onHit", oncePerTurn: true, condition: "sneakAttack" },
  { name: /^Cunning Action/, slot: "bonus" },
  { name: /^Fast Hands/, slot: "bonus" },
  { name: /^Uncanny Dodge/, slot: "reaction", when: "whenAttacked" },
  { name: /^Stroke of Luck/, slot: "free", when: "onMiss", uses: short1 },
  { name: /^Insightful Fighting/, slot: "bonus" },
  { name: /^Master of Tactics/, slot: "bonus" },
  { name: /^Skirmisher/, slot: "reaction" },
  { name: /^Panache/, slot: "action" },
  { name: /^Misdirection/, slot: "reaction" },
  { name: /^Wails from the Grave/, slot: "free", when: "onHit", uses: { max: prof, per: "long" }, dice: (c) => `${Math.ceil(Math.ceil(lvl(c) / 2) / 2)}d6` },
  { name: /^Death Strike/, slot: "free", when: "onHit", oncePerTurn: true, condition: "surprised" },
  { name: /^Master Duelist/, slot: "free", when: "onMiss", uses: short1 },
  { name: /^Spell Thief/, slot: "reaction", uses: long1 },
  { name: /^Unerring Eye/, slot: "action", uses: { max: WIS, per: "long" } },
  { name: /^Ghost Walk/, slot: "bonus", uses: long1 },
  { name: /^Psychic Veil/, slot: "action", uses: long1 },
  { name: /^Rend Mind/, slot: "free", when: "onHit", uses: long1 },

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
  { name: /^Revelation in Flesh/, slot: "bonus", pool: sp(1) },
  { name: /^Warping Implosion/, slot: "action", uses: long1 },
  { name: /^Trance of Order/, slot: "bonus", uses: long1 },
  { name: /^Clockwork Cavalcade/, slot: "action", uses: long1 },
  { name: /^Umbral Form/, slot: "bonus", pool: sp(6) },

  // ----- Warlock -----
  { name: /^Fey Presence/, slot: "action", uses: short1 },
  { name: /^Misty Escape/, slot: "reaction", when: "onDamage", uses: short1 },
  { name: /^Dark One's Own Luck/, slot: "free", when: "onFailSave", uses: short1 },
  { name: /^Entropic Ward/, slot: "reaction", when: "whenAttacked", uses: short1 },
  { name: /^Hexblade's Curse/, slot: "bonus", uses: short1 },
  { name: /^Healing Light/, slot: "bonus", uses: { max: (c) => 1 + (c.level || 1), per: "long" } },
  { name: /^Hurl Through Hell/, slot: "free", when: "onHit", uses: long1, oncePerTurn: true },
  { name: /^Dark Delirium/, slot: "action", uses: short1 },
  { name: /^Tentacle of the Deeps/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Form of Dread/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Armor of Hexes/, slot: "reaction", when: "whenAttacked" },
  { name: /^Guardian Coil/, slot: "reaction", when: "onDamage" },
  { name: /^Grasping Tentacles/, slot: "action", uses: long1 },
  { name: /^Fathomless Plunge/, slot: "action", uses: short1 },
  { name: /^Elemental Gift/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Genie's Vessel/, slot: "action", uses: long1 },
  { name: /^(Searing Vengeance|Necrotic Husk)/, slot: "free", when: "atZeroHp", uses: long1 },
  { name: /^Indestructible Life/, slot: "bonus", uses: short1 },

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
  { name: /^Illusory Reality/, slot: "bonus" },
  { name: /^Event Horizon/, slot: "action", uses: long1 },
  { name: /^Convergent Future/, slot: "reaction" },

  // ----- Artificer -----
  { name: /^Flash of Genius/, slot: "reaction", uses: { max: INT, per: "long" } },
  { name: /^Magical Tinkering/, slot: "action" },
  { name: /^Arcane Jolt/, slot: "free", when: "onHit", uses: { max: INT, per: "long" }, oncePerTurn: true, dice: byLevel([[1, "2d6"], [15, "4d6"]]) },
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
  { name: /^Radiant Soul/, slot: "action", uses: long1, only: (c) => /Aasimar/.test(c.race || "") },
  { name: /^Chromatic Breath Weapon/, slot: "action", uses: { max: prof, per: "long" } },
  { name: /^Metallic Breath Weapon/, slot: "action", uses: long1 },
  { name: /^Third Eye/, slot: "action", uses: short1 },

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
  { name: /^Telekinetic$/, slot: "bonus" },
  { name: /^Second Chance/, slot: "reaction", when: "whenAttacked", uses: short1 },
  { name: /^Savage Attacker/, slot: "free", when: "onHit", oncePerTurn: true, condition: "rerollDamage" },
  { name: /^Crusher/, slot: "free", when: "onHit", oncePerTurn: true, condition: "bludgeoning" },
  { name: /^Piercer/, slot: "free", when: "onHit", oncePerTurn: true, condition: "piercing" },
  { name: /^Slasher/, slot: "free", when: "onHit", oncePerTurn: true, condition: "slashing" },
];

/** A pick saved for a class or subclass feature ("Divine Strike" for Blessed Strikes). */
const picked = (c: Character, feature: string, option: string) =>
  Object.entries(c.featureSelections || {}).some(([key, values]) => key.endsWith(`-${feature}`) && (values || []).some((v) => String(v).split(", ").includes(option)));
const from = (level: number) => (c: Character) => lvl(c) >= level;
const rage = { field: "rages", amount: 1 } as const;

/**
 * The same table for the 2024 rules (SRD 5.2): new action timings (Wild Shape
 * and Lay On Hands take a bonus action), uses that grow with level (Second
 * Wind, Favored Enemy) and the 2024 names. A 2024 character reads only this one.
 */
export const FEATURE_RULES_2024: FeatureRule[] = [
  // ----- Barbarian -----
  { name: /^Rage$/, slot: "bonus", pool: rage },
  { name: /^Reckless Attack/, slot: "free", when: "firstAttack" },
  { name: /^Relentless Rage/, slot: "free", when: "atZeroHp", condition: "relentlessRage" },
  { name: /^Persistent Rage/, slot: "free", when: "onInitiative", uses: long1, refill: "rages" },
  { name: /^Frenzy/, slot: "free", when: "onHit", oncePerTurn: true, condition: "frenzy", dice: (c) => `${Math.max(1, c.rageDamage || 2)}d6` },
  { name: /^Retaliation/, slot: "reaction", when: "onDamage" },
  { name: /^Intimidating Presence/, slot: "bonus", uses: long1, orPool: rage },

  // ----- Bard -----
  { name: /^Bardic Inspiration/, slot: "bonus", pool: bardic },
  { name: /^Countercharm/, slot: "reaction", when: "onFailSave", condition: "charmedOrFrightened" },
  { name: /^Cutting Words/, slot: "reaction", pool: bardic },
  { name: /^Peerless Skill/, slot: "free", when: "onFail", pool: bardic },

  // ----- Cleric -----
  { name: /^Preserve Life/, slot: "action", pool: cd },
  { name: /^Divine Intervention$/, slot: "action", uses: long1 },
  { name: /^Blessed Strikes/, slot: "free", when: "onHit", oncePerTurn: true, condition: "weapon", auto: true, dice: byLevel([[1, "1d8"], [14, "2d8"]]), only: (c) => picked(c, "Blessed Strikes", "Divine Strike") },

  // ----- Druid -----
  { name: /^Wild Shape/, slot: "bonus", pool: wild },
  { name: /^Wild Companion/, slot: "action", pool: wild },
  { name: /^Land's Aid/, slot: "action", pool: wild },
  { name: /^Nature's Sanctuary/, slot: "action", pool: wild },
  { name: /^Elemental Fury/, slot: "free", when: "onHit", oncePerTurn: true, condition: "weapon", auto: true, dice: byLevel([[1, "1d8"], [15, "2d8"]]), only: (c) => picked(c, "Elemental Fury", "Primal Strike") },

  // ----- Fighter -----
  { name: /^Second Wind/, slot: "bonus", usesKey: "secondWind", uses: { max: (c) => (lvl(c) >= 10 ? 4 : lvl(c) >= 4 ? 3 : 2), per: "long", shortRegain: 1 } },
  { name: /^Tactical Mind/, slot: "free", when: "onFailCheck", usesKey: "secondWind", uses: { max: (c) => (lvl(c) >= 10 ? 4 : lvl(c) >= 4 ? 3 : 2), per: "long", shortRegain: 1 }, dice: () => "1d10" },
  { name: /^Action Surge/, slot: "free", pool: { field: "actionSurgeUses", amount: 1 }, restoresAction: true },
  { name: /^Indomitable$/, slot: "free", when: "onFailSave", pool: { field: "indomitableUses", amount: 1 } },

  // ----- Monk -----
  { name: /^Martial Arts/, slot: "bonus" },
  { name: /^Uncanny Metabolism/, slot: "free", when: "onInitiative", uses: long1, refill: "kiPoints" },
  { name: /^Deflect Attacks/, slot: "reaction", when: "onDamage" },
  { name: /^Slow Fall/, slot: "reaction" },
  { name: /^Stunning Strike/, slot: "free", when: "onHit", oncePerTurn: true, pool: ki(1) },
  { name: /^Disciplined Survivor/, slot: "free", when: "onFailSave", pool: ki(1) },
  { name: /^Superior Defense/, slot: "free", pool: ki(3) },
  { name: /^Wholeness of Body/, slot: "bonus", uses: { max: WIS, per: "long" } },
  { name: /^Quivering Palm/, slot: "free", when: "onHit", pool: ki(4) },

  // ----- Paladin -----
  { name: /^Lay on Hands/i, slot: "bonus", variablePool: "layOnHandsPool" },
  { name: /^Paladin's Smite/, slot: "bonus", when: "onHit", uses: long1 },
  { name: /^Faithful Steed/, slot: "action", uses: long1 },
  { name: /^Abjure Foes/, slot: "action", pool: cd },
  { name: /^Sacred Weapon/, slot: "free", when: "firstAttack", pool: cd },
  { name: /^Radiant Strikes/, slot: "free", when: "onHit", condition: "meleeWeapon", auto: true, dice: () => "1d8" },
  { name: /^Holy Nimbus/, slot: "bonus", uses: long1 },

  // ----- Ranger -----
  { name: /^Favored Enemy/, slot: "bonus", uses: { max: byCount([[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]]), per: "long" } },
  { name: /^Tireless/, slot: "action", uses: { max: WIS, per: "long" } },
  { name: /^Nature's Veil/, slot: "bonus", uses: { max: WIS, per: "long" } },
  { name: /^Superior Hunter's Prey/, slot: "free", when: "onHit", oncePerTurn: true, condition: "huntersMark" },
  { name: /^Superior Hunter's Defense/, slot: "reaction", when: "onDamage" },

  // ----- Rogue -----
  { name: /^Sneak Attack/, slot: "free", when: "onHit", oncePerTurn: true, condition: "sneakAttack" },
  { name: /^Cunning Action/, slot: "bonus" },
  { name: /^Steady Aim/, slot: "bonus", condition: "notMoved" },
  { name: /^Uncanny Dodge/, slot: "reaction", when: "whenAttacked" },
  { name: /^Fast Hands/, slot: "bonus" },
  { name: /^Stroke of Luck/, slot: "free", when: "onFail", uses: short1 },

  // ----- Sorcerer -----
  // Sorcery Incarnate (level 7): with no uses left, 2 sorcery points pay for it.
  { name: /^Innate Sorcery/, slot: "bonus", uses: { max: 2, per: "long" }, orPool: sp(2), only: from(7) },
  { name: /^Innate Sorcery/, slot: "bonus", uses: { max: 2, per: "long" } },
  { name: /^Dragon Wings/, slot: "bonus", uses: long1, orPool: sp(3) },
  { name: /^Dragon Companion/, slot: "action", uses: long1 },

  // ----- Warlock -----
  { name: /^Dark One's Own Luck/, slot: "free", when: "onFailSave", uses: { max: CHA, per: "long" }, dice: () => "1d10" },
  { name: /^Hurl Through Hell/, slot: "free", when: "onHit", oncePerTurn: true, uses: long1 },

  // ----- Wizard -----
  { name: /^Overchannel/, slot: "free", when: "afterCast" },

  // ----- Species -----
  { name: /^Breath Weapon/, slot: "action", condition: "replacesAttack", uses: { max: prof, per: "long" } },
  { name: /^Draconic Flight/, slot: "bonus", uses: long1, only: from(5) },
  { name: /^Large Form/, slot: "bonus", uses: long1, only: from(5) },
  { name: /^Stonecunning/, slot: "bonus", uses: { max: prof, per: "long" } },
  { name: /^Adrenaline Rush/, slot: "bonus", uses: { max: prof, per: "short" } },
  { name: /^Relentless Endurance/, slot: "free", when: "atZeroHp", uses: long1 },

  // ----- Feats -----
  { name: /^Savage Attacker/, slot: "free", when: "onHit", oncePerTurn: true, condition: "rerollDamage" },
  { name: /^Boon of Combat Prowess/, slot: "free", when: "onMiss", oncePerTurn: true },
  { name: /^Boon of Dimensional Travel/, slot: "free", when: "afterAttack" },
  { name: /^Boon of Fate/, slot: "free", when: "onFail", uses: short1, dice: () => "2d4" },
  { name: /^Boon of the Night Spirit/, slot: "bonus" },
];

/**
 * Options inside one feature: the Metamagic, maneuvers and runes the player
 * picked, and the parts of Psionic Power. Each becomes its own row in the turn
 * helper. `summary` is our own one-line text; the Indonesian is under
 * `turn.sub.<key>` in the locale files.
 */
export interface SubOption extends Omit<FeatureRule, "name" | "bonusWith" | "only"> {
  name: string;
  key: string;
  summary: string;
  /** Only from this character level. */
  minLevel?: number;
}

export interface SubOptionGroup {
  /** The feature on the sheet these belong to. */
  feature: string;
  /** Only the options the player picked for the feature (Metamagic, maneuvers, runes); else all of them. */
  picked: boolean;
  /** Only for characters this returns true for (a Soulknife's Psionic Power is a different feature). */
  only?: (c: Character) => boolean;
  /** Where the picks are saved, when not under the feature's own name (a species choice). */
  picks?: (c: Character) => string[];
  options: SubOption[];
}

const die = { field: "superiorityDice", amount: 1 } as const;
const is2024 = (c: Character) => c.ruleset === "2024";
const giantUses = { max: prof, per: "long" } as const;
/** Goliath picks: the id ending in the species data, and the option's name. */
const GIANT_ANCESTRY: [string, string][] = [
  ["clouds-jaunt", "Cloud's Jaunt"], ["fires-burn", "Fire's Burn"], ["frosts-chill", "Frost's Chill"],
  ["hills-tumble", "Hill's Tumble"], ["stones-endurance", "Stone's Endurance"], ["storms-thunder", "Storm's Thunder"],
];
const psi = { field: "psionicDice", amount: 1 } as const;
const maneuver = (name: string, key: string, slot: FeatureSlot, summary: string, when?: FeatureWhen): SubOption => ({ name, key, slot, when, pool: die, summary });
const metamagic = (name: string, key: string, points: number, summary: string): SubOption => ({ name, key, slot: "free", when: "onCast", pool: sp(points), summary });
/** Each rune: once per short rest, twice from level 15 (Master of Runes). */
const runeUses = { max: (c: Character) => ((c.level || 1) >= 15 ? 2 : 1), per: "short" } as const;
const rune = (name: string, key: string, slot: FeatureSlot, summary: string, when?: FeatureWhen): SubOption => ({ name, key, slot, when, uses: runeUses, summary });

export const SUB_OPTIONS: SubOptionGroup[] = [
  {
    feature: "Metamagic",
    picked: true,
    only: (c) => c.ruleset !== "2024",
    options: [
      metamagic("Careful Spell", "careful", 1, "Creatures you choose automatically succeed on the spell's saving throw."),
      metamagic("Distant Spell", "distant", 1, "Double the spell's range. A touch spell reaches 30 feet."),
      metamagic("Empowered Spell", "empowered", 1, "Reroll some damage dice (up to your CHA modifier) and keep the new rolls."),
      metamagic("Extended Spell", "extended", 1, "Double the spell's duration, up to 24 hours."),
      metamagic("Heightened Spell", "heightened", 3, "One target has disadvantage on its first save against the spell."),
      metamagic("Quickened Spell", "quickened", 2, "Cast a spell that takes an action as a bonus action instead."),
      metamagic("Subtle Spell", "subtle", 1, "Cast the spell with no words and no gestures."),
      { name: "Twinned Spell", key: "twinned", slot: "free", when: "onCast", variablePool: "sorceryPoints", summary: "A spell that targets one creature also targets a second one. Costs points equal to the spell's level (1 for a cantrip)." },
      metamagic("Seeking Spell", "seeking", 2, "Reroll the d20 of a spell attack that missed."),
      metamagic("Transmuted Spell", "transmuted", 1, "Change the damage type to acid, cold, fire, lightning, poison or thunder."),
    ],
  },
  {
    feature: "Combat Superiority",
    picked: true,
    options: [
      maneuver("Commander's Strike", "commandersStrike", "bonus", "Give up one of your attacks: an ally uses its reaction to attack and adds your die to the damage."),
      maneuver("Disarming Attack", "disarmingAttack", "free", "Add the die to the damage. The target makes a STR save or drops one item it holds.", "onHit"),
      maneuver("Distracting Strike", "distractingStrike", "free", "Add the die to the damage. The next ally's attack on the target has advantage.", "onHit"),
      maneuver("Evasive Footwork", "evasiveFootwork", "free", "When you move, add the die to your AC until you stop."),
      maneuver("Feinting Attack", "feintingAttack", "bonus", "Advantage on your next attack against a creature within 5 feet. Add the die to the damage if it hits."),
      maneuver("Goading Attack", "goadingAttack", "free", "Add the die to the damage. The target makes a WIS save or has disadvantage attacking anyone but you.", "onHit"),
      maneuver("Lunging Attack", "lungingAttack", "free", "Reach 5 feet further with one melee attack. Add the die to the damage if it hits.", "onAttackRoll"),
      maneuver("Maneuvering Attack", "maneuveringAttack", "free", "Add the die to the damage. An ally can use its reaction to move half its speed without opportunity attacks.", "onHit"),
      maneuver("Menacing Attack", "menacingAttack", "free", "Add the die to the damage. The target makes a WIS save or is frightened of you until your next turn ends.", "onHit"),
      maneuver("Parry", "parry", "reaction", "When a melee attack hits you, reduce the damage by the die plus your DEX modifier.", "onDamage"),
      maneuver("Precision Attack", "precisionAttack", "free", "Add the die to an attack roll, before or after you roll.", "onAttackRoll"),
      maneuver("Pushing Attack", "pushingAttack", "free", "Add the die to the damage. A Large or smaller target makes a STR save or is pushed 15 feet.", "onHit"),
      maneuver("Rally", "rally", "bonus", "An ally who can hear you gains temporary HP equal to the die plus your CHA modifier."),
      maneuver("Riposte", "riposte", "reaction", "When a creature misses you in melee, attack it and add the die to the damage.", "whenAttacked"),
      maneuver("Sweeping Attack", "sweepingAttack", "free", "Another creature within 5 feet takes the die as damage if your attack roll would hit it.", "onHit"),
      maneuver("Trip Attack", "tripAttack", "free", "Add the die to the damage. A Large or smaller target makes a STR save or falls prone.", "onHit"),
      maneuver("Ambush", "ambush", "free", "Add the die to a Stealth check or an initiative roll."),
      maneuver("Bait and Switch", "baitAndSwitch", "free", "Swap places with an ally within 5 feet. One of you adds the die to AC until your next turn starts."),
      maneuver("Brace", "brace", "reaction", "When a creature moves into your reach, attack it and add the die to the damage."),
      maneuver("Commanding Presence", "commandingPresence", "free", "Add the die to an Intimidation, Performance or Persuasion check."),
      maneuver("Grappling Strike", "grapplingStrike", "bonus", "Right after a melee hit, try to grapple the target and add the die to the check.", "afterAttack"),
      maneuver("Quick Toss", "quickToss", "bonus", "Draw and throw a thrown weapon. Add the die to the damage if it hits."),
      maneuver("Tactical Assessment", "tacticalAssessment", "free", "Add the die to an Investigation, History or Insight check."),
    ],
  },
  {
    feature: "Rune Carver",
    picked: true,
    options: [
      rune("Cloud Rune", "cloudRune", "reaction", "When you or a creature within 30 feet is hit, the hit goes to another creature you choose instead.", "whenAttacked"),
      rune("Fire Rune", "fireRune", "free", "The target takes 2d6 fire damage at the start of each of its turns and is restrained (STR save ends).", "onHit"),
      rune("Frost Rune", "frostRune", "bonus", "+2 to STR and CON checks and saves for 10 minutes."),
      rune("Stone Rune", "stoneRune", "reaction", "A creature ending its turn within 30 feet makes a WIS save or is charmed and cannot move."),
      rune("Hill Rune", "hillRune", "bonus", "Resistance to bludgeoning, piercing and slashing damage for 1 minute."),
      rune("Storm Rune", "stormRune", "bonus", "For 1 minute, use your reaction to give advantage or disadvantage to a roll near you."),
    ],
  },
  {
    feature: "Hunter's Prey",
    picked: true,
    options: [
      { name: "Colossus Slayer", key: "colossusSlayer", slot: "free", when: "onHit", oncePerTurn: true, condition: "hurt", dice: () => "1d8", summary: "Your weapon hit deals 1d8 extra damage." },
      { name: "Giant Killer", key: "giantKiller", slot: "reaction", when: "whenAttacked", condition: "largeNear", summary: "When a Large or bigger creature within 5 feet attacks you, attack it right after." },
      { name: "Horde Breaker", key: "hordeBreaker", slot: "free", when: "afterAttack", oncePerTurn: true, condition: "nextToTarget", summary: "Make one more weapon attack against a different creature within 5 feet of the first target." },
    ],
  },
  {
    feature: "Multiattack",
    picked: true,
    only: (c) => c.class === "Ranger",
    options: [
      { name: "Volley", key: "volley", slot: "action", summary: "Make a ranged attack against every creature within 10 feet of a point you can see." },
      { name: "Whirlwind Attack", key: "whirlwindAttack", slot: "action", summary: "Make a melee attack against every creature within 5 feet of you." },
    ],
  },
  {
    feature: "Superior Hunter's Defense",
    picked: true,
    options: [
      { name: "Stand Against the Tide", key: "standAgainstTheTide", slot: "reaction", when: "whenAttacked", summary: "When a creature misses you in melee, make it repeat the attack against another creature of your choice." },
      { name: "Uncanny Dodge", key: "uncannyDodgeHunter", slot: "reaction", when: "onDamage", summary: "Halve the damage of one attack that hits you." },
    ],
  },
  {
    feature: "Psionic Power",
    picked: false,
    only: (c) => c.class === "Fighter",
    options: [
      { name: "Protective Field", key: "protectiveField", slot: "reaction", when: "onDamage", pool: psi, summary: "Reduce the damage to you or a creature within 30 feet by a psionic die plus your INT modifier." },
      { name: "Psionic Strike", key: "psionicStrike", slot: "free", when: "onHit", pool: psi, oncePerTurn: true, summary: "Once per turn, deal extra force damage: a psionic die plus your INT modifier." },
      { name: "Telekinetic Movement", key: "telekineticMovement", slot: "action", uses: short1, orPool: psi, summary: "Move an object or a willing creature up to 30 feet." },
      { name: "Recover a psionic die", key: "psionicRecover", slot: "bonus", uses: short1, gain: "psionicDice", summary: "Get one psionic die back. Once per short rest." },
    ],
  },
  // ----- 2024 rules -----
  {
    feature: "Metamagic",
    picked: true,
    only: is2024,
    options: [
      metamagic("Careful Spell", "careful", 1, "Creatures you choose automatically succeed on the spell's saving throw and take no damage from it if they would take half."),
      metamagic("Distant Spell", "distant", 1, "Add 30 feet to the spell's range, or a touch spell reaches 30 feet."),
      metamagic("Empowered Spell", "empowered", 1, "Reroll some damage dice (up to your CHA modifier) and keep the new rolls."),
      metamagic("Extended Spell", "extended", 1, "Double the spell's duration, up to 24 hours. Advantage on saves to keep concentrating on it."),
      metamagic("Heightened Spell", "heightened2024", 2, "One target has disadvantage on its saves against the spell."),
      metamagic("Quickened Spell", "quickened", 2, "Cast a spell that takes an action as a bonus action instead."),
      metamagic("Seeking Spell", "seeking2024", 1, "Reroll the d20 of a spell attack that missed."),
      metamagic("Subtle Spell", "subtle", 1, "Cast the spell with no words, no gestures and no material parts that have no cost."),
      metamagic("Transmuted Spell", "transmuted", 1, "Change the damage type to acid, cold, fire, lightning, poison or thunder."),
      metamagic("Twinned Spell", "twinned2024", 1, "A spell that can target one more creature when cast at a higher level counts as one level higher."),
    ],
  },
  {
    feature: "Monk's Focus",
    picked: false,
    only: is2024,
    options: [
      { name: "Flurry of Blows", key: "flurry2024", slot: "bonus", pool: ki(1), summary: "Make two unarmed strikes." },
      { name: "Patient Defense", key: "patientDefense2024", slot: "bonus", summary: "Take the Disengage action. No Focus needed." },
      { name: "Patient Defense + Dodge", key: "patientDefenseFocus", slot: "bonus", pool: ki(1), summary: "Take both the Disengage and the Dodge action." },
      { name: "Step of the Wind", key: "stepOfTheWind2024", slot: "bonus", summary: "Take the Dash action. No Focus needed." },
      { name: "Step of the Wind + Disengage", key: "stepOfTheWindFocus", slot: "bonus", pool: ki(1), summary: "Take both the Disengage and the Dash action, and your jump distance doubles this turn." },
    ],
  },
  {
    feature: "Cunning Strike",
    picked: false,
    only: is2024,
    options: [
      { name: "Poison", key: "cunningPoison", slot: "free", when: "onHit", condition: "sneakDice1", summary: "The target makes a CON save or is poisoned for 1 minute (it saves again at the end of each turn)." },
      { name: "Trip", key: "cunningTrip", slot: "free", when: "onHit", condition: "sneakDice1", summary: "A Large or smaller target makes a DEX save or falls prone." },
      { name: "Withdraw", key: "cunningWithdraw", slot: "free", when: "onHit", condition: "sneakDice1", summary: "Right after the attack, move up to half your speed without opportunity attacks." },
      { name: "Daze", key: "cunningDaze", slot: "free", when: "onHit", condition: "sneakDice2", minLevel: 14, summary: "The target makes a CON save or on its next turn can only move, or act, or take a bonus action." },
      { name: "Knock Out", key: "cunningKnockOut", slot: "free", when: "onHit", condition: "sneakDice6", minLevel: 14, summary: "The target makes a CON save or falls unconscious for 1 minute or until it takes damage." },
      { name: "Obscure", key: "cunningObscure", slot: "free", when: "onHit", condition: "sneakDice3", minLevel: 14, summary: "The target makes a DEX save or is blinded until the end of its next turn." },
    ],
  },
  {
    feature: "Brutal Strike",
    picked: false,
    only: is2024,
    options: [
      { name: "Forceful Blow", key: "forcefulBlow", slot: "free", when: "onHit", oncePerTurn: true, condition: "brutalStrike", dice: byLevel([[1, "1d10"], [17, "2d10"]]), summary: "Push the target 15 feet away, then move up to half your speed toward it without opportunity attacks." },
      { name: "Hamstring Blow", key: "hamstringBlow", slot: "free", when: "onHit", oncePerTurn: true, condition: "brutalStrike", dice: byLevel([[1, "1d10"], [17, "2d10"]]), summary: "The target's speed drops by 15 feet until the start of your next turn." },
      { name: "Staggering Blow", key: "staggeringBlow", slot: "free", when: "onHit", oncePerTurn: true, condition: "brutalStrike", minLevel: 13, dice: byLevel([[1, "1d10"], [17, "2d10"]]), summary: "The target has disadvantage on its next save and can't make opportunity attacks until your next turn." },
      { name: "Sundering Blow", key: "sunderingBlow", slot: "free", when: "onHit", oncePerTurn: true, condition: "brutalStrike", minLevel: 13, dice: byLevel([[1, "1d10"], [17, "2d10"]]), summary: "The next attack roll by someone else against the target before your next turn gets +5." },
    ],
  },
  {
    feature: "Channel Divinity",
    picked: false,
    only: (c) => is2024(c) && c.class === "Cleric",
    options: [
      { name: "Divine Spark", key: "divineSpark", slot: "action", pool: cd, summary: "Heal a creature within 30 feet, or deal radiant or necrotic damage to it (CON save for half)." },
      { name: "Turn Undead", key: "turnUndead2024", slot: "action", pool: cd, summary: "Undead within 30 feet make a WIS save or are frightened and flee for 1 minute." },
    ],
  },
  {
    feature: "Channel Divinity",
    picked: false,
    only: (c) => is2024(c) && c.class === "Paladin",
    options: [
      { name: "Divine Sense", key: "divineSense2024", slot: "bonus", pool: cd, summary: "For 10 minutes, sense celestials, fiends and undead within 60 feet, and places that are blessed or cursed." },
    ],
  },
  {
    feature: "Giant Ancestry",
    picked: true,
    only: is2024,
    picks: (c) => GIANT_ANCESTRY.filter(([id]) => c.raceChoices?.["goliath-2024-lineage"] === `giant-ancestry-${id}`).map(([, name]) => name),
    options: [
      { name: "Cloud's Jaunt", key: "cloudsJaunt", slot: "bonus", uses: giantUses, summary: "Teleport up to 30 feet to a space you can see." },
      { name: "Fire's Burn", key: "firesBurn", slot: "free", when: "onHit", uses: giantUses, dice: () => "1d10", summary: "Your hit deals 1d10 extra fire damage." },
      { name: "Frost's Chill", key: "frostsChill", slot: "free", when: "onHit", uses: giantUses, dice: () => "1d6", summary: "Your hit deals 1d6 extra cold damage and the target's speed drops by 10 feet until your next turn." },
      { name: "Hill's Tumble", key: "hillsTumble", slot: "free", when: "onHit", uses: giantUses, summary: "A Large or smaller target you hit falls prone." },
      { name: "Stone's Endurance", key: "stonesEndurance", slot: "reaction", when: "onDamage", uses: giantUses, dice: () => "1d12", summary: "Reduce the damage by 1d12 plus your CON modifier." },
      { name: "Storm's Thunder", key: "stormsThunder", slot: "reaction", when: "onDamage", uses: giantUses, dice: () => "1d8", summary: "The creature that hurt you, if within 60 feet, takes 1d8 thunder damage." },
    ],
  },
];

/** The group of sub-options a feature has for this character, if any. */
export function subOptionGroupFor(character: Character, featureName: string): SubOptionGroup | undefined {
  return SUB_OPTIONS.find((g) => g.feature === featureName && (!g.only || g.only(character)));
}

/** The sub-options this character can use for one feature. */
export function subOptionsFor(character: Character, group: SubOptionGroup, picks: string[]): SubOption[] {
  if (group.only && !group.only(character)) return [];
  const chosen = group.picks ? group.picks(character) : picks;
  // Picks are saved as "Feature: Option" for some features (Hunter's Prey: Colossus Slayer).
  const picked = (name: string) => chosen.includes(name) || chosen.some((p) => p.endsWith(`: ${name}`));
  return group.options.filter((o) => (!group.picked || picked(o.name)) && (!o.minLevel || (character.level || 1) >= o.minLevel));
}

/** A stable key for a rule's own uses, from its pattern. */
export function ruleKey(rule: FeatureRule | SubOption): string {
  if (rule.usesKey) return rule.usesKey;
  return "key" in rule ? `sub:${rule.key}` : rule.name.source;
}

export function usesMax(rule: FeatureRule | SubOption, character: Character): number {
  if (!rule.uses) return 0;
  return Math.max(1, typeof rule.uses.max === "function" ? rule.uses.max(character) : rule.uses.max);
}

/** The feature table for the character's rule set. */
export const rulesFor = (character: Pick<Character, "ruleset"> | undefined) => (character?.ruleset === "2024" ? FEATURE_RULES_2024 : FEATURE_RULES);

/** The rule for a feature name on this character, if it is one the player uses on a turn. */
export function ruleFor(character: Character, featureName: string): FeatureRule | undefined {
  return rulesFor(character).find((r) => r.name.test(featureName) && (!r.only || r.only(character))) ?? customRule(character, featureName);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The rule a player gave their own feature, when the table has none for that name. */
function customRule(character: Character, featureName: string): FeatureRule | undefined {
  const turn = (character.features || []).find((f) => f.source === "custom" && f.name === featureName)?.turn;
  if (!turn) return undefined;
  return {
    name: new RegExp(`^${escapeRegExp(featureName)}$`),
    slot: turn.slot,
    ...(turn.uses && turn.uses.max > 0 ? { uses: { max: turn.uses.max, per: turn.uses.per } } : {}),
  };
}

/**
 * Counted uses that a rest gives back: all of them on a long rest, the
 * short-rest ones on a short rest, and one use of a long-rest feature that
 * says so (2024 Second Wind).
 */
export function featureUsesAfterRest(used: Record<string, number> | undefined, kind: "short" | "long", character?: Character): Record<string, number> {
  if (kind === "long" || !used) return {};
  const custom = (character?.features || [])
    .filter((f) => f.source === "custom" && f.turn?.uses?.per === "short")
    .map((f) => (character ? customRule(character, f.name) : undefined))
    .filter((r): r is FeatureRule => !!r);
  const all: (FeatureRule | SubOption)[] = [...rulesFor(character), ...SUB_OPTIONS.filter((g) => !character || !g.only || g.only(character)).flatMap((g) => g.options)];
  const shortKeys = new Set([...all.filter((r) => r.uses?.per === "short").map(ruleKey), ...custom.map(ruleKey)]);
  const regain = new Map(all.filter((r) => r.uses?.shortRegain).map((r) => [ruleKey(r), r.uses!.shortRegain!]));
  return Object.fromEntries(
    Object.entries(used)
      .filter(([key]) => !shortKeys.has(key))
      .map(([key, n]): [string, number] => [key, Math.max(0, n - (regain.get(key) ?? 0))])
      .filter(([, n]) => n > 0)
  );
}
