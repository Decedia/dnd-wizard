import { overrideOf, withOverride, type NumberOverride } from "./overrides";
import type { LevelPicks } from "./level-choices";
import { getStaticClass, getStaticRace, getStaticSubclasses, getDomainSpells, getCircleSpells as getJsonCircleSpells, getCircleTerrainTypes as getJsonCircleTerrainTypes, getOathSpells, getWizardTraditionSpells, getSubclassFlags, getPactBoons } from "@/lib/srd-client";
import { computeBuffModifiers, type ActiveBuff } from "@/lib/spellEffects";
import { getSpellMechanic } from "@/lib/spell-mechanics-accessor";
import { coinRows, coinsFromInventory, isFinesseOrRanged, weaponAbility, weaponDamageDice, withCatalogStats, withChoiceInfo } from "@/lib/inventory";
import { findCatalogItem } from "@/data/item-catalog";
import { addsProficiencyToAttack } from "@/lib/proficiency";
import { db, type CharacterRecord, dbGetCharacters, dbGetCharacter, dbSaveCharacter, dbDeleteCharacter, dbTouchCharacterOpened } from "@/lib/db";
import { SAVE_VERSION, upgradeSave } from "./save-upgrade";
import { getFreeCastSpells } from "./granted-spells";
import { initiativeParts, saveParts, spellAttackParts } from "./roll-parts";
import { sumParts } from "./dice-roll";
export interface Character {
  id: string;
  name: string;
  playerName: string;
  race: string;
  raceVariant?: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  /** Free-form and optional: gender is personal, so it is never gated on. */
  gender?: string;
  experiencePoints: number;
  maxExperiencePoints: number;
  isCustomHp: boolean;
  levelHp: Record<number, number>;
  personalityTrait1: string;
  personalityTrait2: string;
  ideal: string;
  bond: string;
  flaw: string;
  abilityMethod: "standard" | "pointbuy" | "manual" | "freebuy";
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  inspiration: boolean;
  proficiencyBonus: number;
  ac: number;
  currentHp: number;
  maxHp: number;
  // Max HP after effects such as exhaustion 4. Derived; never saved over maxHp.
  effectiveMaxHp?: number;
  temporaryHp: number;
  hitDiceTotal: string;
  hitDiceRemaining: number;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  // Combat action tracking
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  /** Turn panel: movement spent this turn, whether a turn is running, and the round number of the fight. */
  moveUsed?: boolean;
  /** The one free object interaction of the turn (draw or stow a weapon) is spent. */
  objectInteractionUsed?: boolean;
  turnActive?: boolean;
  turnRound?: number;
  /** Wild Shape: the beast form the druid is in and the form's HP left. */
  wildShape?: { form: string; hp: number };
  /** True once the Attack action was taken this turn (unlocks the off-hand bonus attack). */
  attackedThisTurn?: boolean;
  /** This turn's weapon swings with the Attack action, in order; "pending" until the player taps Hit, Crit or Miss. */
  swings?: { key: string; name: string; result: "pending" | "hit" | "crit" | "miss"; smite?: number }[];
  /** Quick taps in the turn helper: an enemy next to you, a group of enemies, an enemy almost down. Cleared when the fight ends. */
  turnSituation?: { near?: boolean; many?: boolean; low?: boolean };
  // Exhaustion
  exhaustionLevel: number;
  rages: number;
  maxRages: number;
  rageDamage: number;
  sorceryPoints: number;
  maxSorceryPoints: number;
  initiative: number;
  speed: number;
  /** Race and feat spells whose free cast (no slot) is used until the next rest, by lowercase name. */
  freeCastsUsed?: string[];
  /** Uses spent of features that count their own uses (Second Wind), by rule key from turn-features. */
  featureUses?: Record<string, number>;
  /** Which one-time save upgrades have run (see save-upgrade.ts). */
  saveVersion?: number;
  /** Walking speed the player set by hand; bonuses are added on top. */
  baseSpeed?: number;
  savingThrows: Record<string, { proficient: boolean; value: number }>;
  skills: Record<string, boolean>;
  toolProficiencies: string[];
  expertise: string[];
  passivePerception: number;
  features: { id: string; name: string; description: string; source?: "race" | "class" | "subclass" | "custom"; locked?: boolean; actionType?: "action" | "bonus_action" | "reaction" | "free" | "passive"; value?: string; summary?: string | null; featureType?: string | null; uses?: { total: number | string; recharge: string; current: number } | null; requirement?: string | null; duration?: string | null; endsIf?: string | null; effect?: string | null; onUse?: string | null; scaling?: string | null; grantsSpells?: boolean; grantsAttack?: boolean; grantsSkills?: boolean; grantsProficiency?: boolean; /** A custom feature's turn use, set by the player: what it takes and how often. */ turn?: CustomFeatureTurn | null; /** Made or changed by the player on the sheet (not a feat or a rule feature). */ byPlayer?: boolean }[];
  /** Rule features the player removed by hand (by name); syncing and level-up leave them out. */
  removedFeatures?: string[];
  /** The character as it was just before the last level-up, for "Undo level-up". */
  levelUpSnapshot?: LevelUpSnapshot;
  /** Numbers set by hand (AC, saves, skills...), by key; they win over the rules. See overrides.ts. */
  overrides?: Record<string, NumberOverride>;
  /** Creation only: this draft picks the class again for a character at this level. */
  rebuildOf?: { level: number };
  /** Each level's picks as the level-up wizard took them (src/lib/level-choices.ts). */
  levelChoices?: Record<number, LevelPicks>;
  costumeSpells: { id: string; name: string; description: string }[];
  subclass?: string;
  subclassIndex?: string;
  inventory: { id: string; /** Catalog id (src/data/en/2014_item_catalog.json). Absent on custom items and old saves. */ itemId?: string; name: string; quantity: number; equipped: boolean; hand?: "main" | "off" | "both"; /** Dropped in a fight: still the character's, but lying on the ground (not carried, not in a hand). */ onGround?: boolean; source: "srd" | "custom"; srdItemName?: string; itemType?: "weapon" | "armor" | "item" | "instrument" | "consumable" | "coin"; /** What is inside, for a pouch of coins. Using the row takes it out. */ contents?: { id: string; quantity: number }[]; category?: "melee" | "ranged" | string; damageDice?: string; damageType?: string; baseAC?: number; armorType?: "light" | "medium" | "heavy" | "shield"; maxDexBonus?: number | null; choiceGroupIndex?: number; choiceOptionIndex?: number; isGranted?: boolean; /** The class or background line this row came from (one pack line makes many rows). */ grantedFrom?: string; description?: string; properties?: string[]; ammoQuantity?: number; maxAmmo?: number; range?: { normal: number; long: number }; weight?: number | null; value?: string | null; versatileDice?: string | null; stealthDisadvantage?: boolean; strengthRequirement?: number; toolUse?: string; associatedAbility?: string; effect?: string; uses?: number; rarity?: string; attunement?: boolean; maxUses?: number; icon?: string }[];
  attacks: { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source?: "weapon" | "class" | "grapple" | "shove"; classFeatureName?: string; description?: string }[];
  otherProficiencies: string;
  languages: string[];
  spells: { id: string; name: string; level: number; source: "srd" | "custom"; srdSpellName?: string; damageDice?: string; damageType?: string; description?: string; summary?: string; /** Given free by subclass, race or an optional feature; removed when that source is gone. */ granted?: boolean }[];
  spellcastingAbility: string;
  spellSaveDc: number;
  spellAttackBonus: number;
  cantrips: { id: string; name: string }[];
  spellSlots: Record<number, number>;
  spellSlotsExpended: Record<number, number>;
  spellsUsedThisTurn: string[];
  featuresUsedThisTurn: string[];
  preparedSpells: string[];
  domainSpells: string[];
  circleTerrain: string;
  circleSpells: string[];
  bonusCantrips: string[];
  bardicInspirationUses: number;
  maxBardicInspirationUses: number;
  magicalSecretsSpells: string[];
  featureSelections: Record<string, string[]>;
  variantHumanAbilities?: string[];
  variantHumanSkill?: string;
  /** Half-Elf: the two ability scores that get +1, and the two chosen skills. */
  halfElfAbilities?: string[];
  halfElfSkills?: string[];
  raceChoices?: Record<string, string>;
  /** Skills picked from the race's own skill choice (Kenku Training, Hunter's Lore). */
  raceSkillPicks?: string[];
  /** Ability increases the player placed for a race with a flexible increase. */
  flexAsi?: Record<string, number>;
  /** Saving throw proficiencies from outside the class (Resilient). */
  bonusSaves?: string[];
  /** Tasha's optional class features are on for this character (needs TCE in sources). */
  optionalClassFeatures?: boolean;
  appliedAsi: number[];
  activeStates: string[];
  activeBuffs: ActiveBuff[];
  sources: string[];
  ruleset?: "2014" | "2024";
  /** Creation wizard order: story steps before ("concept") or after ("gameplay") the mechanical steps. */
  creationOrder?: "concept" | "gameplay";
  buffModifiers?: Record<string, unknown>;
  /** Coin totals. Derived from the coin rows in `inventory`; edit those rows, not this. */
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  /** Creation only: gear or gold instead, and extra gold for a higher starting level (see starting-gold.ts). */
  startingGold?: { mode: "gear" | "gold"; gold: number; extra: number };
  /** Set once old `currency` numbers have been moved into coin rows. */
  coinsInInventory?: boolean;
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    characterAppearance: string;
    personality: string;
    backstory: string;
    alliesOrganizations: string;
    additionalFeaturesTraits: string;
    treasure: string;
  };
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  // Class resource fields
  kiPoints?: number;
  maxKiPoints?: number;
  channelDivinityUses?: number;
  maxChannelDivinityUses?: number;
  actionSurgeUses?: number;
  maxActionSurgeUses?: number;
  indomitableUses?: number;
  maxIndomitableUses?: number;
  layOnHandsPool?: number;
  maxLayOnHandsPool?: number;
  wildShapeUses?: number;
  /** Lucky feat: luck points, regained on a long rest. */
  luckPoints?: number;
  maxLuckPoints?: number;
  /** Battle Master: superiority dice, regained on a short rest. */
  superiorityDice?: number;
  maxSuperiorityDice?: number;
  /** Psi Warrior: Psionic Energy dice (2 x proficiency bonus), regained on a long rest. */
  psionicDice?: number;
  maxPsionicDice?: number;
  /** Artificer Arcane Pool (Tasha's Cauldron). */
  arcanePool?: number;
  maxWildShapeUses?: number;
  invocationsKnown?: number;
  maxInvocationsKnown?: number;
  spellbookSpells?: number;
  maxSpellbookSpells?: number;
  arcaneRecoveryUsed?: boolean;
  bardicInspirationDie?: string;
}

export const SKILLS = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
] as const;

export const ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

export const MAX_ABILITY_SCORE = 20;

export const CLASSES = ["Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];

export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getFeatureValue(featureName: string, character: Character): string | undefined {
  const level = character.level || 1;
  const classData = getStaticClass(character.class, character.ruleset);
  if (!classData) return undefined;

  const lower = featureName.toLowerCase();

  if (lower.includes("lay on hands") && classData.name === "Paladin") {
    return `${level * 5} HP`;
  }

  if (lower.includes("bardic inspiration") && classData.name === "Bard") {
    const chaMod = getModifier(character.cha);
    if (lower.includes("uses")) return `${Math.max(1, chaMod)}`;
    const die = getBardicInspirationDie(character);
    return die;
  }

  if (lower.includes("song of rest") && classData.name === "Bard") {
    return level >= 2 ? getSongOfRestDie(character) : undefined;
  }

  if (lower.includes("rage uses")) {
    const uses = classData.rageUses?.[String(level)];
    return uses !== undefined ? String(uses) : undefined;
  }

  if (lower.includes("rage damage")) {
    const bonus = classData.rageDamageBonus?.[String(level)];
    return bonus !== undefined ? `+${bonus}` : undefined;
  }

  if (lower.includes("ki points")) {
    const points = classData.kiPoints?.[String(level)];
    return points ? String(points) : undefined;
  }

  if (lower.includes("martial arts")) {
    const die = classData.martialArtsDie?.[String(level)];
    return die ? `d${die}` : undefined;
  }

  if (lower.includes("sneak attack")) {
    const dice = classData.sneakAttackDice?.[String(level)];
    return dice ? `${dice}d6` : undefined;
  }

  if (lower.includes("sorcery points")) {
    const points = classData.sorceryPoints?.[String(level)];
    return points ? String(points) : undefined;
  }

  if (lower.includes("action surge") && classData.name === "Fighter") {
    const uses = (classData as any).actionSurgeUses?.[String(level)];
    return uses ? `${uses}/short rest` : undefined;
  }

  if (lower.includes("indomitable")) {
    const uses = classData.indomitableUses?.[String(level)];
    return uses ? `${uses}/long rest` : undefined;
  }

  if (lower.includes("channel divinity")) {
    const uses = classData.channelDivinityUses?.[String(level)];
    return uses ? `${uses}/short rest` : undefined;
  }

  if (lower.includes("wild shape")) {
    const uses = classData.wildShapeUses?.[String(level)];
    if (uses === "Unlimited") return "Unlimited";
    return uses ? `${uses}/short rest` : undefined;
  }

  return undefined;
}

export function clampAbilityScore(score: number): number {
  return Math.min(Math.max(score, 1), MAX_ABILITY_SCORE);
}

/** Fighters and rogues cast only as an Eldritch Knight or Arcane Trickster. */
export function castsSpells(character: Pick<Character, "class" | "subclass">): boolean {
  if (character.class === "Fighter" || character.class === "Rogue") return isThirdCaster(character.subclass);
  return true;
}

export function getMaxSpellsKnown(character: Character): number {
  const classData = getStaticClass(character.class, character.ruleset);
  if (!classData || !castsSpells(character)) return 0;

  const level = character.level || 1;
  const className = character.class;

  if (classData.spellsKnown) {
    const spellsKnown = classData.spellsKnown as Record<string, number>;
    if (spellsKnown[level] !== undefined) {
      return spellsKnown[level];
    }
    const levels = Object.keys(spellsKnown).map(Number).sort((a, b) => a - b);
    let max = 0;
    for (const l of levels) {
      if (level >= l) max = spellsKnown[l];
    }
    if (max > 0) return max;
  }

  if (className === "Wizard") {
    if (level === 1) return 6;
    return 6 + (level - 1) * 2;
  }

  if (className === "Cleric" || className === "Druid") {
    const abilityKey = classData.spellcastingAbility as keyof Character;
    const abilityMod = getModifier(character[abilityKey] as number || 10);
    return Math.max(1, abilityMod + level);
  }

  if (className === "Paladin" || className === "Artificer") {
    const abilityKey = classData.spellcastingAbility as keyof Character;
    const abilityMod = getModifier(character[abilityKey] as number || 10);
    return Math.max(1, abilityMod + Math.floor(level / 2));
  }

  return 0;
}

export function getMaxCantripsKnown(character: Character): number {
  const classData = getStaticClass(character.class, character.ruleset);
  if (!classData?.cantripsKnown || !castsSpells(character)) return 0;

  const level = character.level || 1;

  if (Array.isArray(classData.cantripsKnown)) {
    const idx = Math.min(level - 1, classData.cantripsKnown.length - 1);
    return classData.cantripsKnown[idx >= 0 ? idx : 0];
  }

  const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
  let cantrips = 0;
  for (const l of levels) {
    if (level >= l) cantrips = (classData.cantripsKnown as Record<number, number>)[l];
  }
  return cantrips;
}

/**
 * Third casters (Eldritch Knight, Arcane Trickster) keep their slot table on
 * the class, outside the level table, because the rest of the class has none.
 */
const THIRD_CASTER_SLOT_KEYS: Record<string, string> = {
  "arcane trickster": "arcaneTricksterSpellSlots",
  "eldritch knight": "eldritchKnightSpellSlots",
};

export function isThirdCaster(subclass?: string | null): boolean {
  return !!subclass && subclass.toLowerCase() in THIRD_CASTER_SLOT_KEYS;
}

/** Spell slots for a class level, including third-caster subclasses. */
export function getSpellSlotTable(classData: any, level: number, subclass?: string | null): Record<number, number> | undefined {
  const own = classData?.levels?.[level - 1]?.spellSlots;
  if (own && Object.keys(own).length > 0) return own;
  const key = subclass ? THIRD_CASTER_SLOT_KEYS[subclass.toLowerCase()] : undefined;
  return (key && classData?.[key]?.[String(level)]) || undefined;
}

export function getMaxSpellLevel(className: string, level: number, ruleset?: string, subclass?: string | null): number {
  const classData = getStaticClass(className, ruleset);
  if (!classData?.levels) return 0;

  const slots = getSpellSlotTable(classData, level, subclass);
  if (!slots) return 0;

  const levels = Object.keys(slots).map(Number);
  if (levels.length === 0) return 0;

  return Math.max(...levels);
}

export function getClassLevel1Hp(classData: { hitDie: number } | undefined): number {
  if (!classData) return 10;
  return classData.hitDie;
}

export function getClassPerLevelHp(classData: { hpPerLevel: number } | undefined): number {
  if (!classData) return 5;
  return classData.hpPerLevel;
}

export function getHitDieAverage(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

export function getMaxHpFromLevelHp(levelHp: Record<number, number> | undefined): number {
  if (!levelHp) return 0;
  return Object.values(levelHp).reduce((sum, v) => sum + (v || 0), 0);
}

/**
 * A CON change made on the sheet moves max HP by the change in modifier at
 * every level, as the rules say. Level-up handles its own CON changes. A
 * custom max HP, or a patch that sets max HP itself, is left alone. Per-level
 * values shift without clamping, so typing through a low score and back
 * returns to the same HP; only the total keeps 1 HP per level.
 */
export function applyConChangeToHp(prev: Character, next: Character, patch: Partial<Character>): Partial<Character> {
  if (patch.con === undefined || "maxHp" in patch || "levelHp" in patch || next.isCustomHp) return {};
  if (!Number.isFinite(prev.con) || !Number.isFinite(next.con)) return {};
  const delta = getModifier(next.con) - getModifier(prev.con);
  if (!delta) return {};
  const level = Math.max(1, next.level || 1);
  const levelHp = next.levelHp && Object.keys(next.levelHp).length > 0
    ? Object.fromEntries(Object.entries(next.levelHp).map(([lvl, hp]) => [lvl, (hp || 0) + delta]))
    : undefined;
  const maxHp = Math.max(level, levelHp ? getMaxHpFromLevelHp(levelHp) : (next.maxHp || 0) + delta * level);
  const currentHp = Math.min(maxHp, Math.max(0, (next.currentHp || 0) + (maxHp - (next.maxHp || 0))));
  return { ...(levelHp ? { levelHp } : {}), maxHp, currentHp };
}

export function getMaxExpertiseCount(character: Character): number {
  if (character.class !== "Rogue") return 0;
  const classData = getStaticClass("Rogue", character.ruleset);
  const scaling = classData?.scalingFeatures?.find((f) => f.type === "feature" && f.name === "Expertise");
  if (!scaling) return 0;
  let maxCount = 0;
  for (const [level, count] of Object.entries(scaling.values)) {
    if (Number(level) <= character.level) {
      maxCount = Math.max(maxCount, count);
    }
  }
  return maxCount;
}

export function createEmptyCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    playerName: "",
    race: "",
    class: "",
    level: 1,
    background: "",
    alignment: "",
    gender: "",
    experiencePoints: 0,
    maxExperiencePoints: 300,
    isCustomHp: false,
    levelHp: {},
    personalityTrait1: "",
    personalityTrait2: "",
    ideal: "",
    bond: "",
    flaw: "",
    abilityMethod: "standard",
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    inspiration: false,
    proficiencyBonus: 2,
    ac: 10,
    currentHp: 0,
    maxHp: 0,
    temporaryHp: 0,
    hitDiceTotal: "",
    hitDiceRemaining: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    exhaustionLevel: 0,
    saveVersion: SAVE_VERSION,
    rages: 0,
    maxRages: 0,
    rageDamage: 0,
    sorceryPoints: 0,
    maxSorceryPoints: 0,
    initiative: 0,
    speed: 30,
    savingThrows: {},
    skills: {},
    toolProficiencies: [],
    expertise: [],
    passivePerception: 10,
    features: [],
    costumeSpells: [],
    subclass: "",
    inventory: [],
    attacks: [],
    otherProficiencies: "",
    languages: [],
    spells: [],
    spellcastingAbility: "",
    spellSaveDc: 0,
    spellAttackBonus: 0,
    cantrips: [],
    spellSlots: {},
    spellSlotsExpended: {},
    spellsUsedThisTurn: [],
    featuresUsedThisTurn: [],
    activeStates: [],
    activeBuffs: [],
    sources: ["PHB"],
    ruleset: "2014",
    preparedSpells: [],
    domainSpells: [],
    circleTerrain: "",
    circleSpells: [],
    bonusCantrips: [],
    bardicInspirationUses: 0,
    maxBardicInspirationUses: 0,
    magicalSecretsSpells: [],
    featureSelections: {},
    variantHumanAbilities: undefined,
    variantHumanSkill: undefined,
    appliedAsi: [],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
    coinsInInventory: true,
    appearance: {
      age: "",
      height: "",
      weight: "",
      eyes: "",
      skin: "",
      hair: "",
      characterAppearance: "",
      personality: "",
      backstory: "",
      alliesOrganizations: "",
      additionalFeaturesTraits: "",
      treasure: "",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Class resource fields
    kiPoints: 0,
    maxKiPoints: 0,
    channelDivinityUses: 0,
    maxChannelDivinityUses: 0,
    actionSurgeUses: 0,
    maxActionSurgeUses: 0,
    indomitableUses: 0,
    maxIndomitableUses: 0,
    layOnHandsPool: 0,
    maxLayOnHandsPool: 0,
    wildShapeUses: 0,
    luckPoints: 0,
    superiorityDice: 0,
    arcanePool: 0,
    maxWildShapeUses: 0,
    invocationsKnown: 0,
    maxInvocationsKnown: 0,
    spellbookSpells: 0,
    maxSpellbookSpells: 0,
    arcaneRecoveryUsed: false,
    bardicInspirationDie: "d6",
    ...overrides,
  };
}

const STORAGE_KEY = "dnd-wizard-characters";
const AUTO_BACKUP_KEY = "dnd-wizard-autobackup";
const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * Sourcebook tags in the data were corrected (e.g. Bladesinging moved from XGE
 * to TCE). A character saved before that may not list the new book, and every
 * lookup filtered by its sources would then lose its own class, subclass or
 * race. Add the books the character's existing picks now live in.
 */
function withOwnBooks(c: Character): Character {
  const sources = (c as any).sources as string[] | undefined;
  if (!Array.isArray(sources) || sources.length === 0) return c;
  const books = new Set(sources);
  const add = (book: unknown) => {
    if (typeof book === "string" && book) books.add(book);
  };
  try {
    if (c.class) {
      add((getStaticClass(c.class, (c as any).ruleset) as any)?.source);
      if (c.subclass) add(getStaticSubclasses(c.class, [], (c as any).ruleset).find((s) => s.name === c.subclass)?.source);
    }
    if (c.race) add((getStaticRace(c.race, (c as any).ruleset) as any)?.source);
  } catch {
    return c;
  }
  return books.size === sources.length ? c : ({ ...c, sources: [...books] } as Character);
}

export function normalizeCharacter(c: Character): Character {
  return upgradeSave(withOwnBooks(normalizeCharacterFields(c)));
}

/**
 * Coins are inventory rows. Old saves kept them only as numbers in `currency`;
 * move those numbers into rows once, then `currency` is read from the rows.
 */
export function migrateCoins(c: Character): Pick<Character, "inventory" | "currency" | "coinsInInventory"> {
  let inventory = (c.inventory || []).map((row) => {
    // Consumables are used, not equipped; old saves may have them equipped.
    const item = withChoiceInfo(row.itemType === "consumable" && row.equipped ? { ...row, equipped: false } : row);
    if (item.itemId || item.source !== "srd") return withCatalogStats({ ...item });
    // Old rows were matched by name; stamp the catalog id so Use and lookups work.
    const match = findCatalogItem(item.srdItemName || item.name);
    return match ? withCatalogStats({ ...item, itemId: match.id }) : { ...item };
  });
  if (!c.coinsInInventory) inventory = [...inventory, ...coinRows((c as any).currency ?? {})];
  return { inventory, currency: coinsFromInventory(inventory), coinsInInventory: true };
}

export interface CustomFeatureTurn {
  slot: "action" | "bonus" | "reaction" | "free";
  /** Uses before a rest gives them back; absent means no limit. */
  uses?: { max: number; per: "short" | "long" };
}

export interface LevelUpSnapshot {
  /** The level the character was at before. */
  level: number;
  /** What made it: a level-up (default) or picking the class or subclass again. */
  kind?: "levelUp" | "class" | "subclass" | "choice";
  at: number;
  character: Omit<Character, "levelUpSnapshot">;
}

function normalizeCharacterFields(c: Character): Character {
  const defaults = createEmptyCharacter();
  return {
    ...defaults,
    ...c,
    appearance: {
      ...defaults.appearance,
      ...(c as any).appearance,
    },
    savingThrows: {
      ...defaults.savingThrows,
      ...(c as any).savingThrows,
    },
    spellSlots: {
      ...defaults.spellSlots,
      ...(c as any).spellSlots,
    },
    spellSlotsExpended: {
      ...defaults.spellSlotsExpended,
      ...(c as any).spellSlotsExpended,
    },
    spellsUsedThisTurn: (c as any).spellsUsedThisTurn || [],
    featuresUsedThisTurn: (c as any).featuresUsedThisTurn || [],
    activeStates: (c as any).activeStates || [],
    activeBuffs: (c as any).activeBuffs || [],
    levelHp: (c as any).levelHp || {},
    ...migrateCoins(c),
    spells: (c.spells || []).map((saved) => {
      // Old saves link feat spells to the retired combat engine data; nothing reads it.
      const { grantsFeatureId: _retired, ...spell } = saved as typeof saved & { grantsFeatureId?: string };
      const srdSpellName = spell.srdSpellName || spell.name;
      const mechanic = spell.source === "srd" ? getSpellMechanic(srdSpellName) : undefined;
      
      let summary = spell.summary || "";
      if (!summary && mechanic) {
        const effectTypes = mechanic.effects.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i);
        const resolution = mechanic.resolution ? `${mechanic.resolution.type}: ${mechanic.resolution.ability || ""}`.trim() : "none";
        const target = mechanic.targeting.type;
        const duration = mechanic.casting.duration;
        const concentration = mechanic.casting.concentration ? "concentration" : "";
        
        const mechanismParts = [
          ...effectTypes,
          resolution,
          target,
          duration.toLowerCase(),
          concentration
        ].filter(Boolean);
        
        summary = mechanismParts.join(", ");
      }
      if (!summary && spell.description) {
        const firstSentence = spell.description.split(/[.\n]/)[0].trim();
        summary = firstSentence;
      }
      const summaryWords = summary.split(/\s+/);
      if (summaryWords.length > 30) summary = summaryWords.slice(0, 30).join(" ");
      
      return {
        ...defaults.spells[0],
        ...spell,
        summary,
      };
    }),
    costumeSpells: (c.costumeSpells || []).map((cs) => ({ ...cs })),
    variantHumanAbilities: (c as any).variantHumanAbilities,
    variantHumanSkill: (c as any).variantHumanSkill,
    // A row with no name and no text is an abandoned "Add feature" tap.
    features: (c.features || []).filter((f) => f.name?.trim() || f.description?.trim()).map((saved) => {
      // Old saves carry an id into the retired combat engine data; nothing reads it.
      const { engineId: _retired, ...feature } = saved as typeof saved & { engineId?: string };
      const description = feature.description || "";
      const actionType = (feature as any).actionType;
      const uses = (feature as any).uses;
      const requirement = (feature as any).requirement;
      const duration = (feature as any).duration;
      const featureType = (feature as any).featureType || "Passive";
      const onUse = (feature as any).onUse;
      const scaling = (feature as any).scaling;

      const mechanismParts: string[] = [];
      if (actionType && actionType !== "passive") mechanismParts.push(actionType.toLowerCase());
      if (uses) {
        const total = typeof uses.total === "number" ? uses.total : uses.total;
        const recharge = uses.recharge;
        mechanismParts.push(`${total}/${recharge}`);
      }
      if (requirement) mechanismParts.push(requirement.toLowerCase());
      if (duration && duration !== "Instantaneous") mechanismParts.push(duration.toLowerCase());
      if (featureType === "Active" && !actionType) mechanismParts.push("action");
      if (onUse) mechanismParts.push(onUse.toLowerCase());
      if (scaling) mechanismParts.push("scales");

      const mechanismStr = mechanismParts.length > 0 ? ` (${mechanismParts.join(", ")})` : "";

      const summary = (feature as any).summary || (() => {
        const firstSentence = description.split(/[.\n]/)[0].trim();
        let s = firstSentence + mechanismStr;
        const words = s.split(/\s+/);
        if (words.length > 30) s = words.slice(0, 30).join(" ");
        return s;
      })();
      return {
        ...feature,
        summary,
        featureType: featureType,
        actionType: actionType || null,
        uses: uses || null,
        requirement: requirement || null,
        duration: duration || null,
        endsIf: (feature as any).endsIf || null,
        onUse: onUse || null,
        scaling: scaling || null,
        grantsSpells: (feature as any).grantsSpells ?? false,
        grantsAttack: (feature as any).grantsAttack ?? false,
        grantsSkills: (feature as any).grantsSkills ?? false,
        grantsProficiency: (feature as any).grantsProficiency ?? false,
      };
    }),
  };
}

export async function getCharacters(): Promise<Character[]> {
  if (typeof window === "undefined") return [];
  try {
    const records = await dbGetCharacters();
    return records.map((c) => normalizeCharacter(c));
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Character[];
      return parsed.map((c) => normalizeCharacter(c));
    } catch {
      return [];
    }
  }
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const found = await dbGetCharacter(id);
    return found ? upgradeSave(withOwnBooks({ ...found, ...migrateCoins(found) })) : found;
  } catch {
    return (await getCharacters()).find((c) => c.id === id);
  }
}

export async function saveCharacter(character: Character): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await dbSaveCharacter(character);
  } catch {
    const characters = (await getCharacters()).filter((c) => c.id !== character.id);
    const now = Date.now();
    const updated = { ...character, updatedAt: now };
    characters.push(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }
  await maybeAutoBackup();
}

export async function deleteCharacter(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await dbDeleteCharacter(id);
  } catch {
    const characters = (await getCharacters()).filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }
}

// Stamps lastOpenedAt on open. Deliberately does not bump updatedAt (that would
// conflate "opened" with "edited") and does not run maybeAutoBackup, so simply
// viewing a character does not churn backups.
export async function touchCharacterOpened(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const now = Date.now();
  try {
    await dbTouchCharacterOpened(id, now);
  } catch {
    try {
      const characters = await getCharacters();
      const next = characters.map((c) => (c.id === id ? { ...c, lastOpenedAt: now } : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore tracking failures; opening the character must still work
    }
  }
}

async function maybeAutoBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const last = localStorage.getItem(AUTO_BACKUP_KEY);
    const now = Date.now();
    if (last && now - Number(last) < AUTO_BACKUP_INTERVAL) return;
    const characters = await getCharacters();
    if (characters.length === 0) return;
    const { downloadBackupJson } = await import("@/lib/character-io");
    downloadBackupJson(characters);
    localStorage.setItem(AUTO_BACKUP_KEY, String(now));
  } catch {
    // ignore auto-backup failures
  }
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getRaceData(name: string): { abilityScoreIncreases: Record<string, number> } | undefined {
  const race = getStaticRace(name);
  if (!race) return undefined;
  return { abilityScoreIncreases: race.abilityScoreIncreases };
}

export function computeEquippedEffects(character: Character): { ac: number; attacks: Character["attacks"] } {
  const equippedWeapons = character.inventory.filter((item) => item.equipped && item.itemType === "weapon");
  const equippedShields = character.inventory.filter((item) => item.equipped && item.armorType === "shield");

  let ac = 10 + getModifier(character.dex);

  const bodyArmor = character.inventory.find((item) => item.equipped && item.itemType === "armor" && item.armorType !== "shield");
  if (bodyArmor) {
    let baseAC = bodyArmor.baseAC;
    let maxDexBonus = bodyArmor.maxDexBonus;

    // Parse description field if baseAC is not directly set
    if (baseAC === undefined && bodyArmor.description) {
      try {
        const info = JSON.parse(bodyArmor.description);
        baseAC = info.baseAC;
        maxDexBonus = info.maxDex ?? info.maxDexBonus ?? null;
      } catch {
        // Ignore parse errors
      }
    }

    if (baseAC !== undefined) {
      const maxDex = maxDexBonus ?? null;
      let dexMod = 0;
      if (maxDex === null) {
        // Light armor: full dex bonus
        dexMod = getModifier(character.dex);
      } else if (maxDex > 0) {
        // Medium armor: dex bonus up to max
        dexMod = Math.min(getModifier(character.dex), maxDex);
      }
      // Heavy armor (maxDex === 0): no dex bonus
      ac = baseAC + dexMod;
    }
  }

  ac += equippedShields.length * 2;

  const hasArmor = bodyArmor !== undefined;
  if (character.features && character.features.length > 0) {
    for (const feature of character.features) {
      const fname = feature.name.toLowerCase();
      if (fname.includes("defense") && hasArmor) {
        ac += 1;
      } else if (fname.includes("dueling")) {
        // Dueling gives +2 to damage rolls with single weapon, handled in attacks
      } else if (fname.includes("shield mastery")) {
        ac += 1;
      }
    }
  }

  const profBonus = getProficiencyBonus(character.level);
  const weaponAttacks: Character["attacks"] = equippedWeapons.map((weapon) => {
    const abilityKey = weaponAbility(weapon, getModifier(character.str), getModifier(character.dex));
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const sneakDice = isFinesseOrRanged(weapon) ? getSneakAttackDice(character) : undefined;
    // No proficiency bonus with a weapon the character isn't proficient with.
    const attackBonus = abilityMod + (addsProficiencyToAttack(character, weapon) ? profBonus : 0);
    const damageBonus = abilityMod;
    const damageDice = weaponDamageDice(weapon);
    const damageTypeName = weapon.damageType || "";
    const damageText = [damageDice, damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`, damageTypeName].filter(Boolean).join(" ");
    return {
      id: weapon.id,
      name: weapon.name,
      attackBonus,
      damageType: damageText,
      sneakAttack: sneakDice,
      description: `+${attackBonus} to hit, ${damageText}`,
      source: "weapon" as const,
    };
  });

  const classAttacks = getClassGrantedAttacks(character);

  return { ac, attacks: [...classAttacks, ...weaponAttacks] };
}

export function getSneakAttackDice(character: Character): string | undefined {
  if (character.class !== "Rogue") return undefined;
  const classData = getStaticClass("Rogue", character.ruleset);
  const scaling = classData?.scalingFeatures?.find((f) => f.type === "attack");
  if (!scaling) return undefined;
  const diceCount = scaling.values[character.level] ?? 1;
  return `${diceCount}d6`;
}

export function getClassGrantedAttacks(character: Character): { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source: "class"; classFeatureName: string }[] {
  const classData = getStaticClass(character.class, character.ruleset);
  if (!classData) return [];
  const attacks: { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source: "class"; classFeatureName: string }[] = [];
  const profBonus = getProficiencyBonus(character.level);
  for (const feature of classData.features ?? []) {
    if (feature.type === "attack") {
      if (feature.name === "Sneak Attack") {
        const sneakDice = getSneakAttackDice(character);
        attacks.push({
          id: `class-attack-${feature.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: feature.name,
          attackBonus: profBonus,
          damageType: sneakDice ? `${sneakDice} damage` : "",
          sneakAttack: sneakDice,
          source: "class",
          classFeatureName: feature.name,
        });
      }
    }
  }
  return attacks;
}

// Helper to get class resource value by level
function getClassResourceValue(classData: any, resourceName: string, level: number): number | "Unlimited" {
  const resource = classData?.[resourceName];
  if (!resource) return 0;
  const val = resource[String(level)];
  if (val === "Unlimited") return 999;
  return typeof val === "number" ? val : 0;
}

/** Walking speed before bonuses: the player's own base, else the race's, else 30. */
export function getBaseSpeed(character: Pick<Character, "baseSpeed" | "race" | "ruleset"> & { raceChoices?: Record<string, string> }): number {
  if (typeof character.baseSpeed === "number" && character.baseSpeed > 0) return character.baseSpeed;
  const raceSpeed = character.race ? getStaticRace(character.race, character.ruleset)?.speed : undefined;
  const base = typeof raceSpeed === "number" && raceSpeed > 0 ? raceSpeed : 30;
  // A wood half-elf who takes Fleet of Foot walks 35 feet.
  const fleet = character.race?.startsWith("Half-Elf (") && character.raceChoices?.["half-elf-versatility"] === "fleet-of-foot";
  return base + (fleet ? 5 : 0);
}

/**
 * Hit points a character gains on top of the die and CON at every level:
 * Tough (+2), Hill Dwarf's Dwarven Toughness (+1), Draconic Resilience (+1).
 */
export function getHpBonusPerLevel(character: Character): number {
  const picks = Object.entries(character.featureSelections || {});
  const tookTough =
    hasFeat(character, "Tough") ||
    picks.some(([key, value]) => (/^asi-feat-\d+$/.test(key) || key === "variant-human-feat") && value?.[0] === "Tough");
  return (tookTough ? 2 : 0) +
    (character.race === "Hill Dwarf" ? 1 : 0) +
    (character.class === "Sorcerer" && character.subclass === "Draconic Bloodline" ? 1 : 0);
}

/**
 * Passive Perception, Insight or Investigation: 10 + ability modifier +
 * proficiency (twice with expertise). Observant adds 5 to Perception and
 * Investigation.
 */
export function getPassiveScore(
  character: Pick<Character, "level" | "wis" | "int" | "skills" | "expertise" | "features">,
  skill: "Perception" | "Insight" | "Investigation"
): number {
  const profBonus = getProficiencyBonus(character.level || 1);
  const proficient = character.skills?.[skill] ?? false;
  const expert = proficient && (character.expertise || []).includes(skill);
  const ability = skill === "Investigation" ? character.int : character.wis;
  const observant = skill !== "Insight" && hasFeat(character as Character, "Observant");
  return 10 + getModifier(ability) + (proficient ? profBonus : 0) + (expert ? profBonus : 0) + (observant ? 5 : 0);
}

/** Whether the character has taken a feat, by its name ("Heavy Armor Master"). */
export function hasFeat(character: Character, featName: string): boolean {
  const name = normaliseFeatureName(featName);
  return (character.features ?? []).some((f) => normaliseFeatureName(f.name) === name);
}

/** "Heavy Armor Master" and "heavy_armor_master" are the same feat. */
function normaliseFeatureName(name: string | undefined): string {
  return String(name ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Every level's HP added up, or null for an old save that has no HP per level. */
export function ruleMaxHp(character: Pick<Character, "levelHp" | "level">): number | null {
  const levels = character.levelHp ? Object.keys(character.levelHp).length : 0;
  return levels >= (character.level || 1) ? getMaxHpFromLevelHp(character.levelHp) : null;
}

/**
 * The HP maximum with a number set by hand. "Add" needs the per-level HP to
 * add to (adding to the saved maximum would add again on every change).
 */
function hpMaxOf(character: Character): number {
  const o = overrideOf(character, "maxHp");
  if (!o) return character.maxHp || 0;
  if (o.mode === "set") return o.value;
  const rule = ruleMaxHp(character);
  return rule === null ? character.maxHp || 0 : rule + o.value;
}

export function computeDerivedStats(character: Character): Partial<Character> {
  // Clamp ability scores to max 20
  const clampedAbilities: Partial<Character> = {};
  for (const key of ["str", "dex", "con", "int", "wis", "cha"] as const) {
    const current = character[key] as number;
    if (current > MAX_ABILITY_SCORE) {
      clampedAbilities[key] = MAX_ABILITY_SCORE;
    }
  }

  const profBonus = getProficiencyBonus(character.level);
  const classData = getStaticClass(character.class, character.ruleset);
  const savingThrowProfs = classData?.savingThrows || [];
  const activeStates = character.activeStates || [];
  // Compute cover bonuses
  let acBonusFromCover = 0;
  let dexSaveBonusFromCover = 0;
  let isDifficultTerrain = false;
  for (const state of activeStates) {
    const lower = state.toLowerCase().trim();
    if (lower === "half cover") {
      acBonusFromCover = Math.max(acBonusFromCover, 2);
      dexSaveBonusFromCover = Math.max(dexSaveBonusFromCover, 2);
    } else if (lower === "three-quarters cover") {
      acBonusFromCover = Math.max(acBonusFromCover, 5);
      dexSaveBonusFromCover = Math.max(dexSaveBonusFromCover, 5);
    } else if (lower === "total cover") {
      // total cover gives +5 to AC and Dex saves (though can't be targeted)
      acBonusFromCover = Math.max(acBonusFromCover, 5);
      dexSaveBonusFromCover = Math.max(dexSaveBonusFromCover, 5);
    } else if (lower === "difficult terrain") {
      isDifficultTerrain = true;
    }
  }

  const savingThrows: Record<string, { proficient: boolean; value: number }> = {};
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
    const isProficient = savingThrowProfs.includes(key) || (character.bonusSaves || []).includes(key);
    // Ability, proficiency, a number set by hand, then cover on Dexterity saves.
    savingThrows[key] = {
      proficient: isProficient,
      value: sumParts(saveParts(character, key, isProficient)),
    };
  }

  // Dexterity, +5 with Alert.
  const initiative = sumParts(initiativeParts(character));

  const passivePerception = withOverride(character, "passive:Perception", getPassiveScore(character, "Perception"));

  // Fighters and rogues only cast with Eldritch Knight or Arcane Trickster.
  const castsWithoutSubclass = character.class !== "Fighter" && character.class !== "Rogue";
  const spellcastingAbility = castsWithoutSubclass || isThirdCaster(character.subclass) ? classData?.spellcastingAbility || "" : "";
  const spellcastingAbilityMod = spellcastingAbility ? getModifier(character[spellcastingAbility as keyof Character] as number) : 0;
  const spellSaveDc = withOverride(character, "spellSaveDc", 8 + profBonus + spellcastingAbilityMod);
  const spellAttackBonus = sumParts(spellAttackParts(character, spellcastingAbility));

  const hitDie = classData?.hitDie || 10;
  const hitDiceTotal = `${character.level}d${hitDie}`;

  // ===== CLASS RESOURCES FROM CLASS DATA =====
  let rages = 0;
  let maxRages = 0;
  let rageDamage = 0;
  let kiPoints = 0;
  let maxKiPoints = 0;
  let channelDivinityUses = 0;
  let maxChannelDivinityUses = 0;
  let actionSurgeUses = 0;
  let maxActionSurgeUses = 0;
  let indomitableUses = 0;
  let maxIndomitableUses = 0;
  let layOnHandsPool = 0;
  let maxLayOnHandsPool = 0;
  let wildShapeUses = 0;
  let maxWildShapeUses = 0;
  let sorceryPoints = 0;
  let maxSorceryPoints = 0;
  let invocationsKnown = 0;
  let maxInvocationsKnown = 0;
  let spellbookSpells = 0;
  let maxSpellbookSpells = 0;
  let arcaneRecoveryUsed = false;
  let bardicInspirationDie = "d6";
  let bardicInspirationUses = 0;
  let maxBardicInspirationUses = 0;
  let superiorityDice = 0;
  let maxSuperiorityDice = 0;
  let luckPoints = 0;

  // Luck points come from the Lucky feat, not a class table.
  {
    const level = character.level;
    if (hasFeat(character, "Lucky")) luckPoints = 3;
  }

  if (classData) {
    const level = character.level;

    // Barbarian
    if (classData.name === "Barbarian") {
      maxRages = getClassResourceValue(classData, "rageUses", level) as number;
      rages = maxRages;
      rageDamage = getClassResourceValue(classData, "rageDamageBonus", level) as number;
    }

    // Monk
    if (classData.name === "Monk") {
      maxKiPoints = getClassResourceValue(classData, "kiPoints", level) as number;
      kiPoints = maxKiPoints;
    }

    // Cleric
    if (classData.name === "Cleric") {
      maxChannelDivinityUses = getClassResourceValue(classData, "channelDivinityUses", level) as number;
      channelDivinityUses = maxChannelDivinityUses;
    }

    // Druid
    if (classData.name === "Druid") {
      const wsVal = getClassResourceValue(classData, "wildShapeUses", level);
      maxWildShapeUses = wsVal === "Unlimited" ? 999 : (wsVal as number);
      wildShapeUses = maxWildShapeUses;
    }

    // Fighter
    if (classData.name === "Fighter") {
      maxActionSurgeUses = getClassResourceValue(classData, "actionSurgeUses", level) as number;
      actionSurgeUses = maxActionSurgeUses;
      maxIndomitableUses = getClassResourceValue(classData, "indomitableUses", level) as number;
      indomitableUses = maxIndomitableUses;
    }

    // Sorcerer
    if (classData.name === "Sorcerer") {
      maxSorceryPoints = getClassResourceValue(classData, "sorceryPoints", level) as number;
      sorceryPoints = maxSorceryPoints;
    }

    // Warlock
    if (classData.name === "Warlock") {
      maxInvocationsKnown = getClassResourceValue(classData, "invocationsKnown", level) as number;
      invocationsKnown = maxInvocationsKnown;
    }

    // Wizard
    if (classData.name === "Wizard") {
      maxSpellbookSpells = getClassResourceValue(classData, "spellbookSpells", level) as number;
      spellbookSpells = maxSpellbookSpells;
    }

    // Paladin - Lay on Hands pool = level * 5
    if (classData.name === "Paladin") {
      maxLayOnHandsPool = level * 5;
      layOnHandsPool = maxLayOnHandsPool;
    }

    // Fighter, Battle Master: 4 superiority dice at level 3, 5 at 7, 6 at 15.
    if (classData.name === "Fighter" && character.subclass === "Battle Master" && level >= 3) {
      maxSuperiorityDice = level >= 15 ? 6 : level >= 7 ? 5 : 4;
      superiorityDice = maxSuperiorityDice;
    }

    // Bard
    if (classData.name === "Bard") {
      bardicInspirationDie = getBardicInspirationDie(character);
      maxBardicInspirationUses = getMaxBardicInspirationUses(character);
      bardicInspirationUses = maxBardicInspirationUses;
    }
  }

  // Paladin: one Channel Divinity from level 3 (Sacred Oath).
  if (classData?.name === "Paladin" && character.level >= 3) maxChannelDivinityUses = 1;

  // What is left in a pool belongs to the player; only its ceiling is derived.
  // Without this every change to the sheet refilled every pool.
  rages = keepPool(character.rages, character.maxRages, maxRages);
  kiPoints = keepPool(character.kiPoints, character.maxKiPoints, maxKiPoints);
  channelDivinityUses = keepPool(character.channelDivinityUses, character.maxChannelDivinityUses, maxChannelDivinityUses);
  actionSurgeUses = keepPool(character.actionSurgeUses, character.maxActionSurgeUses, maxActionSurgeUses);
  indomitableUses = keepPool(character.indomitableUses, character.maxIndomitableUses, maxIndomitableUses);
  layOnHandsPool = keepPool(character.layOnHandsPool, character.maxLayOnHandsPool, maxLayOnHandsPool);
  wildShapeUses = keepPool(character.wildShapeUses, character.maxWildShapeUses, maxWildShapeUses);
  sorceryPoints = keepPool(character.sorceryPoints, character.maxSorceryPoints, maxSorceryPoints);
  superiorityDice = keepPool(character.superiorityDice, character.maxSuperiorityDice, maxSuperiorityDice);
  // Psi Warrior (Tasha's), level 3: psionic dice equal to twice the proficiency bonus.
  const maxPsionicDice = character.class === "Fighter" && character.subclass === "Psi Warrior" && (character.level || 1) >= 3 ? 2 * getProficiencyBonus(character.level || 1) : 0;
  const psionicDice = keepPool(character.psionicDice, character.maxPsionicDice, maxPsionicDice);
  bardicInspirationUses = keepPool(character.bardicInspirationUses, character.maxBardicInspirationUses, maxBardicInspirationUses);
  const maxLuckPoints = luckPoints;
  luckPoints = keepPool(character.luckPoints, character.maxLuckPoints, maxLuckPoints);
  const hitDiceRemaining = keepPool(character.hitDiceRemaining, parseInt(character.hitDiceTotal || "", 10) || 0, character.level);
  arcaneRecoveryUsed = classData?.name === "Wizard" && !!character.arcaneRecoveryUsed;

  // ===== AC CALCULATION (with Unarmored Defense fixes) =====
  const equippedShields = character.inventory.filter((item) => item.equipped && item.armorType === "shield");
  const bodyArmor = character.inventory.find((item) => item.equipped && item.itemType === "armor" && item.armorType !== "shield");
  const hasArmor = bodyArmor !== undefined;

  let ac: number;

  // Check for Unarmored Defense features
  // Both classes call it Unarmored Defense; the class decides the formula.
  // A monk loses it with a shield, a barbarian keeps it.
  const hasUnarmoredDefense = character.features?.some(f => f.name.toLowerCase().includes("unarmored defense") && f.source === "class") ?? false;
  const hasShield = equippedShields.length > 0;
  const hasBarbarianUnarmored = hasUnarmoredDefense && character.class === "Barbarian";
  const hasMonkUnarmored = hasUnarmoredDefense && character.class === "Monk" && !hasShield;
  // Dragon Hide (feat) sets unarmored AC the same way as Draconic Resilience.
  const hasDraconicResilience = (character.features?.some(f => f.name.toLowerCase().includes("draconic resilience")) ?? false) || hasFeat(character, "Dragon Hide");
  const hasNaturalArmor = character.features?.some(f => f.name.toLowerCase().includes("natural armor")) ?? false;
  const hasBladesong = character.features?.some(f => f.name.toLowerCase().includes("bladesong")) ?? false;

  if (hasArmor) {
    // Wearing armor - use armor AC
    let baseAC = bodyArmor!.baseAC;
    let maxDexBonus = bodyArmor!.maxDexBonus;

    if (baseAC === undefined && bodyArmor!.description) {
      try {
        const info = JSON.parse(bodyArmor!.description);
        baseAC = info.baseAC;
        maxDexBonus = info.maxDex ?? info.maxDexBonus ?? null;
      } catch {
        // Ignore parse errors
      }
    }

    if (baseAC !== undefined) {
      const maxDex = maxDexBonus ?? null;
      let dexMod = 0;
      if (maxDex === null) {
        dexMod = getModifier(character.dex);
      } else if (maxDex > 0) {
        dexMod = Math.min(getModifier(character.dex), maxDex);
      }
      ac = baseAC + dexMod;
    } else {
      ac = 10 + getModifier(character.dex);
    }
  } else if (hasBarbarianUnarmored) {
    // Barbarian Unarmored Defense: 10 + Dex + Con
    ac = 10 + getModifier(character.dex) + getModifier(character.con);
  } else if (hasMonkUnarmored) {
    // Monk Unarmored Defense: 10 + Dex + Wis
    ac = 10 + getModifier(character.dex) + getModifier(character.wis);
  } else if (hasDraconicResilience) {
    // Draconic Resilience (Sorcerer): 13 + Dex
    ac = 13 + getModifier(character.dex);
  } else if (hasNaturalArmor) {
    // Natural Armor (Lizardfolk, Tortle): 13 + Dex (max 2) - simplified
    ac = 13 + Math.min(getModifier(character.dex), 2);
  } else if (hasBladesong) {
    // Bladesong (Wizard): AC = 10 + Dex + Int (when not wearing armor)
    ac = 10 + getModifier(character.dex) + getModifier(character.int);
  } else {
    // No armor, no unarmored defense
    ac = 10 + getModifier(character.dex);
  }

  // Shield bonus
  ac += equippedShields.length * 2;

  // Feature-based AC bonuses
  if (character.features && character.features.length > 0) {
    for (const feature of character.features) {
      const fname = feature.name.toLowerCase();
      if (fname.includes("defense") && fname.includes("fighting style") && hasArmor) {
        ac += 1; // Defense Fighting Style (only with armor)
      } else if (fname.includes("shield mastery")) {
        ac += 1; // Shield Master feat (works with or without armor)
      }
    }
  }

  // Buff modifiers
  const buffMods = computeBuffModifiers(character.activeBuffs || []);
  // A number set by hand wins over the rules; spells (Shield) and cover still add on top.
  ac = withOverride(character, "ac", ac);
  ac += buffMods.acBonus;

  // Cover AC bonus
  ac += acBonusFromCover;

  // ===== BASE SPEED =====
  // The race's walking speed, or the base the player typed; never the last
  // derived value, which already carries the bonuses below.
  let speed = getBaseSpeed(character);
  if (hasFeat(character, "Mobile")) speed += 10;
  if (hasFeat(character, "Squat Nimbleness")) speed += 5;
  // Monk unarmored movement bonus
  if (classData?.name === "Monk" && !hasArmor && equippedShields.length === 0) {
    const umVal = getClassResourceValue(classData, "unarmoredMovement", character.level);
    if (umVal && typeof umVal === "number" && umVal > 0) {
      speed += umVal;
    }
  }
  speed = withOverride(character, "speed", speed);
  // Buff speed bonus
  speed += buffMods.speedBonus;

  // Difficult terrain halves speed
  if (isDifficultTerrain) {
    speed = Math.floor(speed / 2);
  }

  // ===== CONDITION MECHANICAL EFFECTS =====
  // Parse activeStates for conditions and apply mechanical effects
  const conditions = new Set(
    activeStates
      .map((s) => s.toLowerCase().trim())
      .filter((s) => s)
  );

  // Exhaustion level (exhaustion 1, exhaustion 2, etc.)
  const exhaustionLevel = activeStates
    .map((s) => {
      const match = s.toLowerCase().match(/exhaustion\s*(\d)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0)
    .reduce((max, n) => Math.max(max, n), character.exhaustionLevel || 0);

  // Speed modifications from conditions
  const speedZeroConditions = [
    "grappled",
    "restrained",
    "paralyzed",
    "petrified",
    "stunned",
    "unconscious",
  ];
  const hasSpeedZero = speedZeroConditions.some((c) => conditions.has(c));

  // Exhaustion level 5 = speed 0
  if (exhaustionLevel >= 5) {
    conditions.add("exhaustion_5_speed_zero");
  }

  // Prone: speed 0 but can crawl (handled in UI)
  if (conditions.has("prone")) {
    // Prone doesn't set speed to 0 in 5e - you can crawl at half speed
    // We'll note it for UI
  }

  // Disadvantage on attack rolls
  const disadvantageAttackConditions = [
    "poisoned",
    "frightened", // while source in sight
    "restrained",
    "prone", // ranged attacks only
  ];
  const hasDisadvantageAttacks = disadvantageAttackConditions.some((c) => conditions.has(c));

  // Advantage on attacks against this creature
  const advantageAttackAgainstConditions = [
    "invisible",
    "paralyzed",
    "petrified",
    "stunned",
    "unconscious",
    "restrained", // attacks against have advantage
  ];
  const hasAdvantageAttacksAgainst = advantageAttackAgainstConditions.some((c) => conditions.has(c));

  // Auto-fail Strength/Dex saves
  const autoFailStrDexConditions = [
    "paralyzed",
    "petrified",
    "stunned",
    "unconscious",
  ];
  const autoFailStrDex = autoFailStrDexConditions.some((c) => conditions.has(c));

  // Disadvantage on ability checks
  const disadvantageCheckConditions = ["poisoned"];
  if (exhaustionLevel >= 1) disadvantageCheckConditions.push("exhaustion");
  const hasDisadvantageChecks = disadvantageCheckConditions.some((c) => conditions.has(c));

  // Disadvantage on saving throws
  const hasDisadvantageSaves = exhaustionLevel >= 3;

  // Exhaustion level 4: HP max halved (applied elsewhere)
  // Exhaustion level 6: death (handled elsewhere)

  // Apply speed modifications
  if (hasSpeedZero || conditions.has("exhaustion_5_speed_zero")) {
    speed = 0;
  } else if (exhaustionLevel >= 2) {
    // Exhaustion level 2: speed halved
    speed = Math.floor(speed / 2);
  }

  // Apply exhaustion HP max reduction (level 4 halves max HP)
  const baseMaxHp = hpMaxOf(character);
  const effectiveMaxHp = exhaustionLevel >= 4 ? Math.floor(baseMaxHp / 2) : baseMaxHp;

  // Cover tracking
  const hasHalfCover = activeStates.includes("cover-half");
  const hasThreeQuartersCover = activeStates.includes("cover-three-quarters");
  const hasTotalCover = activeStates.includes("cover-total");

  // Difficult terrain tracking

  // Apply cover AC bonuses
  acBonusFromCover = 0;
  if (hasHalfCover) acBonusFromCover = 2;
  else if (hasThreeQuartersCover) acBonusFromCover = 5;
  else if (hasTotalCover) acBonusFromCover = 0; // Can't be targeted

  // Apply cover Dex save bonuses
  dexSaveBonusFromCover = 0;
  if (hasHalfCover) dexSaveBonusFromCover = 2;
  else if (hasThreeQuartersCover) dexSaveBonusFromCover = 5;
  else if (hasTotalCover) dexSaveBonusFromCover = 0;

  // Apply temporary HP from buffs (take max, don't stack)
  const buffTempHp = buffMods.tempHpBonus || 0;
  const newTemporaryHp = Math.max(character.temporaryHp || 0, buffTempHp);

  // ===== INITIATIVE WITH FEATURES =====
  // Alert feat, Feral Instinct, etc. handled via buffs

  // ===== RETURN ALL COMPUTED VALUES =====
  return {
    proficiencyBonus: profBonus,
    currency: coinsFromInventory(character.inventory || []),
    savingThrows,
    initiative,
    passivePerception,
    spellcastingAbility,
    spellSaveDc,
    spellAttackBonus,
    hitDiceTotal,
    hitDiceRemaining,
    rages,
    maxRages,
    rageDamage,
    kiPoints,
    maxKiPoints,
    channelDivinityUses,
    maxChannelDivinityUses,
    actionSurgeUses,
    maxActionSurgeUses,
    indomitableUses,
    maxIndomitableUses,
    layOnHandsPool,
    maxLayOnHandsPool,
    wildShapeUses,
    maxWildShapeUses,
    luckPoints,
    maxLuckPoints,
    superiorityDice,
    maxSuperiorityDice,
    psionicDice,
    maxPsionicDice,
    sorceryPoints,
    maxSorceryPoints,
    invocationsKnown,
    maxInvocationsKnown,
    spellbookSpells,
    maxSpellbookSpells,
    arcaneRecoveryUsed,
    bardicInspirationDie,
    bardicInspirationUses,
    maxBardicInspirationUses,
    ac,
    speed,
    effectiveMaxHp,
    ...(overrideOf(character, "maxHp") ? { maxHp: baseMaxHp, ...((character.currentHp || 0) > baseMaxHp ? { currentHp: baseMaxHp } : {}) } : {}),
    // Current HP can't sit above the reduced maximum.
    ...(exhaustionLevel >= 4 && (character.currentHp || 0) > effectiveMaxHp ? { currentHp: effectiveMaxHp } : {}),
    temporaryHp: newTemporaryHp,
    buffModifiers: buffMods as any,
    // Universal grapple/shove attacks
    // Weapon and class attacks always follow what is equipped now; saved
    // copies from older versions or imports are replaced.
    attacks: [
      ...computeEquippedEffects(character).attacks,
      ...(character.attacks || []).filter((a) => a.source !== "weapon" && a.source !== "class"),
      ...(character.attacks?.some(a => a.source === "grapple") ? [] : [{
        id: "grapple",
        name: "Grapple",
        attackBonus: character.proficiencyBonus + (character.skills?.Athletics ? character.proficiencyBonus + getModifier(character.str) : getModifier(character.str)),
        damageType: "",
        source: "grapple" as const,
        description: "Special melee attack. Athletics vs target's Athletics or Acrobatics. On success, target is Grappled (speed 0, can't benefit from speed bonuses). Escape: Athletics or Acrobatics vs your Athletics DC."
      }]),
      ...(character.attacks?.some(a => a.source === "shove") ? [] : [{
        id: "shove",
        name: "Shove",
        attackBonus: character.proficiencyBonus + (character.skills?.Athletics ? character.proficiencyBonus + getModifier(character.str) : getModifier(character.str)),
        damageType: "",
        source: "shove" as const,
        description: "Special melee attack. Athletics vs target's Athletics or Acrobatics. On success, target is either knocked Prone or pushed 5 feet away from you."
      }]),
    ],
    ...slotsForLevel(character, classData),
    ...clampedAbilities,
  };
}

/**
 * Spell slots always follow the class table for the current level, so a
 * level-up, an import or an old save can never leave them behind. What is
 * spent is kept, capped at the new total. Non-casters keep what they have.
 */
function slotsForLevel(character: Character, classData: any): Pick<Character, "spellSlots" | "spellSlotsExpended"> | Record<string, never> {
  const table = getSpellSlotTable(classData, character.level || 1, character.subclass);
  if (!table || Object.keys(table).length === 0) return {};
  const spent = character.spellSlotsExpended || {};
  const spellSlots: Record<number, number> = {};
  const spellSlotsExpended: Record<number, number> = {};
  for (const [level, count] of Object.entries(table)) {
    spellSlots[Number(level)] = count as number;
    spellSlotsExpended[Number(level)] = Math.min(count as number, Math.max(0, spent[Number(level)] || 0));
  }
  return { spellSlots, spellSlotsExpended };
}

/**
 * What is left in a pool after its ceiling is re-derived: the saved amount,
 * plus any growth of the ceiling (a level-up gives the new uses right away),
 * never above the ceiling.
 */
function keepPool(current: number | undefined, oldMax: number | undefined, max: number): number {
  const before = typeof oldMax === "number" ? oldMax : 0;
  const held = typeof current === "number" ? current : 0;
  return Math.max(0, Math.min(max, held + Math.max(0, max - before)));
}

export function getMaxPreparedSpells(character: Character): number {
  const classData = getStaticClass(character.class, character.ruleset);
  if (!classData?.spellcastingAbility) return 0;
  const abilityScore = character[classData.spellcastingAbility as keyof Character] as number;
  const abilityMod = getModifier(abilityScore || 10);
  if (character.class === "Cleric" || character.class === "Druid") {
    return Math.max(1, abilityMod + character.level);
  }
  if (character.class === "Paladin" || character.class === "Artificer") {
    return Math.max(1, abilityMod + Math.floor(character.level / 2));
  }
  if (character.class === "Wizard") {
    return Math.max(1, abilityMod + character.level);
  }
  return 0;
}

export function isPreparationCaster(character: Character): boolean {
  return ["Cleric", "Druid", "Paladin", "Wizard", "Artificer"].includes(character.class);
}

export function getBardicInspirationDie(character: Character): string {
  if (character.level >= 15) return "d12";
  if (character.level >= 10) return "d10";
  if (character.level >= 5) return "d8";
  return "d6";
}

export function getMaxBardicInspirationUses(character: Character): number {
  return Math.max(1, getModifier(character.cha));
}

export function getSongOfRestDie(character: Character): string {
  if (character.level >= 17) return "d12";
  if (character.level >= 13) return "d10";
  if (character.level >= 9) return "d8";
  return "d6";
}

export function hasFontOfInspiration(character: Character): boolean {
  return character.level >= 5;
}

export function getDomainSpellNames(character: Character): string[] {
  if (character.class !== "Cleric" || !character.subclassIndex) return [];
  return getDomainSpells(character.subclassIndex, character.level || 1);
}

export function getCircleSpells(terrain: string, level: number): string[] {
  return getJsonCircleSpells(terrain, level);
}

export function getCircleTerrainTypes(): string[] {
  return getJsonCircleTerrainTypes();
}

export function getOathSpellNames(character: Character): string[] {
  if (character.class !== "Paladin" || !character.subclassIndex) return [];
  return getOathSpells(character.subclassIndex, character.level || 1);
}

/**
 * Spells a warlock's patron adds to the warlock spell list at the character's level.
 * They are extra options for spells known, not spells the warlock learns for free.
 * Keys are class levels. The Genie adds more spells by genie kind, read from the
 * patron option the player picked (a feature named "Dao (Earth)" and so on).
 */
export function getWarlockExpandedSpellNames(character: Partial<Character>, subclassName?: string): string[] {
  const sub = subclassName || character.subclass;
  if (character.class !== "Warlock" || !sub) return [];
  const level = character.level || 1;
  const classData = getStaticClass("Warlock", character.ruleset);
  const subclass = classData?.subclasses?.find((s) => s.name.toLowerCase() === sub.toLowerCase());
  if (!subclass) return [];
  const tables = [subclass.expandedSpells || {}];
  if (subclass.expandedSpellsByOption) {
    const picked = [
      ...(character.features || []).map((f) => f.name),
      ...Object.values(character.featureSelections || {}).flat(),
    ];
    for (const [option, table] of Object.entries(subclass.expandedSpellsByOption)) {
      if (picked.some((name) => name === option || name.startsWith(option + " "))) tables.push(table);
    }
  }
  const spells: string[] = [];
  for (const table of tables) {
    for (const [lvlStr, lvlSpells] of Object.entries(table)) {
      if (level >= Number(lvlStr)) spells.push(...lvlSpells);
    }
  }
  return spells;
}

export function getWizardTraditionSpellNames(character: Character): string[] {
  if (character.class !== "Wizard" || !character.subclassIndex) return [];
  return getWizardTraditionSpells(character.subclassIndex, character.level || 1);
}

