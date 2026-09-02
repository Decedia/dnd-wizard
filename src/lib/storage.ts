import { getStaticClass, getStaticRace, getDomainSpells, getCircleSpells as getJsonCircleSpells, getCircleTerrainTypes as getJsonCircleTerrainTypes, getOathSpells, getWizardTraditionSpells, getSubclassFlags, getPactBoons } from "@/lib/srd-client";
import { computeBuffModifiers, type ActiveBuff } from "@/lib/spellEffects";
import { db, type CharacterRecord, dbGetCharacters, dbGetCharacter, dbSaveCharacter, dbDeleteCharacter } from "@/lib/db";
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
  experiencePoints: number;
  maxExperiencePoints: number;
  isCustomHp: boolean;
  levelHp: Record<number, number>;
  personalityTrait1: string;
  personalityTrait2: string;
  ideal: string;
  bond: string;
  flaw: string;
  abilityMethod: "standard" | "pointbuy";
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
  temporaryHp: number;
  hitDiceTotal: string;
  hitDiceRemaining: number;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  rages: number;
  maxRages: number;
  rageDamage: number;
  sorceryPoints: number;
  maxSorceryPoints: number;
  draconicAncestor: string;
  initiative: number;
  speed: number;
  savingThrows: Record<string, { proficient: boolean; value: number }>;
  skills: Record<string, boolean>;
  toolProficiencies: string[];
  expertise: string[];
  passivePerception: number;
  features: { id: string; name: string; description: string; source?: "race" | "class" | "subclass" | "custom"; locked?: boolean }[];
  costumeSpells: { id: string; name: string; description: string }[];
  subclass?: string;
  subclassIndex?: string;
  inventory: { id: string; name: string; quantity: number; equipped: boolean; hand?: "main" | "off" | "both"; source: "srd" | "custom"; srdItemName?: string; itemType?: "weapon" | "armor" | "item" | "instrument"; category?: "melee" | "ranged"; damageDice?: string; damageType?: string; baseAC?: number; armorType?: "light" | "medium" | "heavy" | "shield"; maxDexBonus?: number | null; choiceGroupIndex?: number; choiceOptionIndex?: number; isGranted?: boolean; description?: string; properties?: string[] }[];
  attacks: { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source?: "weapon" | "class"; classFeatureName?: string; description?: string }[];
  otherProficiencies: string;
  languages: string[];
  spells: { id: string; name: string; level: number; source: "srd" | "custom"; srdSpellName?: string; damageDice?: string; damageType?: string; description?: string }[];
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
  raceChoices?: Record<string, string>;
  appliedAsi: number[];
  activeStates: string[];
  activeBuffs: ActiveBuff[];
  sources: string[];
  buffModifiers?: Record<string, unknown>;
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
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

export const CLASSES = ["Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];

export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getMaxSpellsKnown(character: Character): number {
  const classData = getStaticClass(character.class);
  if (!classData) return 0;

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
  const classData = getStaticClass(character.class);
  if (!classData?.cantripsKnown) return 0;

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

export function getMaxSpellLevel(className: string, level: number): number {
  const classData = getStaticClass(className);
  if (!classData?.levels) return 0;

  const levelData = classData.levels[level - 1];
  if (!levelData?.spellSlots) return 0;

  const levels = Object.keys(levelData.spellSlots).map(Number);
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

export function getMaxExpertiseCount(character: Character): number {
  if (character.class !== "Rogue") return 0;
  const classData = getStaticClass("Rogue");
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
    rages: 0,
    maxRages: 0,
    rageDamage: 0,
    sorceryPoints: 0,
    maxSorceryPoints: 0,
    draconicAncestor: "",
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

function normalizeCharacter(c: Character): Character {
  const defaults = createEmptyCharacter();
  return {
    ...defaults,
    ...c,
    currency: {
      ...defaults.currency,
      ...(c as any).currency,
    },
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
    inventory: (c.inventory || []).map((item) => ({
      ...defaults.inventory[0],
      ...item,
    })),
    spells: (c.spells || []).map((spell) => ({
      ...defaults.spells[0],
      ...spell,
    })),
    costumeSpells: (c.costumeSpells || []).map((cs) => ({ ...cs })),
    variantHumanAbilities: (c as any).variantHumanAbilities,
    variantHumanSkill: (c as any).variantHumanSkill,
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
    return await dbGetCharacter(id);
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
    const abilityKey = weapon.category === "ranged" ? "dex" : "str";
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const isFinesseOrRanged = weapon.category === "ranged" || weapon.name === "Dagger" || weapon.name === "Rapier" || weapon.name === "Shortsword";
    const sneakDice = isFinesseOrRanged ? getSneakAttackDice(character) : undefined;
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;
    const damageDice = weapon.damageDice || "";
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
  const classData = getStaticClass("Rogue");
  const scaling = classData?.scalingFeatures?.find((f) => f.type === "attack");
  if (!scaling) return undefined;
  const diceCount = scaling.values[character.level] ?? 1;
  return `${diceCount}d6`;
}

export function getClassGrantedAttacks(character: Character): { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source: "class"; classFeatureName: string }[] {
  const classData = getStaticClass(character.class);
  if (!classData) return [];
  const attacks: { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string; source: "class"; classFeatureName: string }[] = [];
  const profBonus = getProficiencyBonus(character.level);
  for (const feature of classData.features) {
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

export function computeDerivedStats(character: Character): Partial<Character> {
  const profBonus = getProficiencyBonus(character.level);
  const classData = getStaticClass(character.class);
  const savingThrowProfs = classData?.savingThrows || [];

  const savingThrows: Record<string, { proficient: boolean; value: number }> = {};
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
    const isProficient = savingThrowProfs.includes(key);
    const abilityMod = getModifier(character[key as keyof Character] as number);
    savingThrows[key] = {
      proficient: isProficient,
      value: isProficient ? abilityMod + profBonus : abilityMod,
    };
  }

  const initiative = getModifier(character.dex);

  const perceptionProficient = character.skills["Perception"] ?? false;
  const passivePerception = 10 + getModifier(character.wis) + (perceptionProficient ? profBonus : 0);

  const spellcastingAbility = classData?.spellcastingAbility || "";
  const spellcastingAbilityMod = spellcastingAbility ? getModifier(character[spellcastingAbility as keyof Character] as number) : 0;
  const spellSaveDc = 8 + profBonus + spellcastingAbilityMod;
  const spellAttackBonus = profBonus + spellcastingAbilityMod;

  const hitDie = classData?.hitDie || 10;
  const hitDiceTotal = `${character.level}d${hitDie}`;
  const hitDiceRemaining = character.level;

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

    // Bard
    if (classData.name === "Bard") {
      bardicInspirationDie = getBardicInspirationDie(character);
      maxBardicInspirationUses = getMaxBardicInspirationUses(character);
      bardicInspirationUses = maxBardicInspirationUses;
    }
  }

  // ===== AC CALCULATION (with Unarmored Defense fixes) =====
  const equippedShields = character.inventory.filter((item) => item.equipped && item.armorType === "shield");
  const bodyArmor = character.inventory.find((item) => item.equipped && item.itemType === "armor" && item.armorType !== "shield");
  const hasArmor = bodyArmor !== undefined;

  let ac: number;

  // Check for Unarmored Defense features
  const hasBarbarianUnarmored = character.features?.some(f => f.name.toLowerCase().includes("unarmored defense") && f.source === "class") ?? false;
  const hasMonkUnarmored = character.features?.some(f => f.name.toLowerCase().includes("unarmored defense") && f.source === "class") ?? false;
  const hasDraconicResilience = character.features?.some(f => f.name.toLowerCase().includes("draconic resilience")) ?? false;
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

  // Feature-based AC bonuses (only with armor for Defense Fighting Style)
  if (hasArmor && character.features && character.features.length > 0) {
    for (const feature of character.features) {
      const fname = feature.name.toLowerCase();
      if (fname.includes("defense") && fname.includes("fighting style")) {
        ac += 1; // Defense Fighting Style
      } else if (fname.includes("shield mastery")) {
        ac += 1; // Shield Master feat
      }
    }
  }

  // Buff modifiers
  const buffMods = computeBuffModifiers(character.activeBuffs || []);
  ac += buffMods.acBonus;

  // ===== BASE SPEED =====
  let speed = character.speed || 30;
  // Monk unarmored movement bonus
  if (classData?.name === "Monk" && !hasArmor) {
    const umVal = getClassResourceValue(classData, "unarmoredMovement", character.level);
    if (umVal && typeof umVal === "number" && umVal > 0) {
      speed += umVal;
    }
  }
  // Buff speed bonus
  speed += buffMods.speedBonus;

  // ===== CONDITION MECHANICAL EFFECTS =====
  // Parse activeStates for conditions and apply mechanical effects
  const activeStates = character.activeStates || [];
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
    .reduce((max, n) => Math.max(max, n), 0);

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

  // Apply exhaustion HP max reduction (level 4)
  // Note: This is applied in the character sheet display, not here

  // ===== INITIATIVE WITH FEATURES =====
  // Alert feat, Feral Instinct, etc. handled via buffs

  // ===== RETURN ALL COMPUTED VALUES =====
  return {
    proficiencyBonus: profBonus,
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
    buffModifiers: buffMods as any,
  };
}

export function getMaxPreparedSpells(character: Character): number {
  const classData = getStaticClass(character.class);
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

export function getWarlockExpandedSpellNames(character: Character): string[] {
  if (character.class !== "Warlock" || !character.subclass) return [];
  const level = character.level || 1;
  const classData = getStaticClass("Warlock");
  if (!classData?.subclasses) return [];
  const subclass = classData.subclasses.find((s) => s.name.toLowerCase() === character.subclass?.toLowerCase());
  if (!subclass?.expandedSpells) return [];

  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(subclass.expandedSpells)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getWizardTraditionSpellNames(character: Character): string[] {
  if (character.class !== "Wizard" || !character.subclassIndex) return [];
  return getWizardTraditionSpells(character.subclassIndex, character.level || 1);
}

// ===== REST RECOVERY FUNCTIONS =====

export function applyShortRest(character: Character): Partial<Character> {
  const classData = getStaticClass(character.class);
  const draft: Partial<Character> = {
    // Hit Dice recovery: can spend up to half level (min 1)
    hitDiceRemaining: Math.min(character.level, character.hitDiceRemaining + Math.max(1, Math.floor(character.level / 2))),
  };

  // Warlock: recover all Pact Magic spell slots on short rest
  if (classData?.name === "Warlock") {
    const warlockSlots: Record<number, number> = {};
    const classData = getStaticClass("Warlock");
    if (classData?.levels) {
      const levelData = classData.levels[character.level - 1];
      if (levelData?.spellSlots) {
        for (const [slotLevel, count] of Object.entries(levelData.spellSlots)) {
          warlockSlots[Number(slotLevel)] = count;
        }
      }
    }
    draft.spellSlots = warlockSlots;
    draft.spellSlotsExpended = Object.fromEntries(
      Object.entries(warlockSlots).map(([k]) => [k, 0])
    );
  }

  // Fighter: Action Surge (short rest recovery)
  if (classData?.name === "Fighter" && character.maxActionSurgeUses) {
    draft.actionSurgeUses = character.maxActionSurgeUses;
  }

  // Cleric: Channel Divinity (short rest recovery at level 2+)
  if (classData?.name === "Cleric" && character.maxChannelDivinityUses) {
    draft.channelDivinityUses = character.maxChannelDivinityUses;
  }

  // Paladin: Channel Divinity (short rest recovery at level 3+ via subclass)
  if (classData?.name === "Paladin" && character.maxChannelDivinityUses) {
    draft.channelDivinityUses = character.maxChannelDivinityUses;
  }

  // Monk: Ki points (short rest recovery at level 2+)
  if (classData?.name === "Monk" && character.maxKiPoints) {
    draft.kiPoints = character.maxKiPoints;
  }

  // Sorcerer: Sorcery Points (short rest recovery at level 20 via Sorcerous Restoration)
  if (classData?.name === "Sorcerer" && character.level >= 20 && character.maxSorceryPoints) {
    draft.sorceryPoints = character.maxSorceryPoints;
  }

  // Bard: Bardic Inspiration (short rest recovery at level 5 via Font of Inspiration)
  if (classData?.name === "Bard" && character.level >= 5 && character.maxBardicInspirationUses) {
    draft.bardicInspirationUses = character.maxBardicInspirationUses;
  }

  // Druid: Wild Shape (short rest recovery at level 2+)
  if (classData?.name === "Druid" && character.maxWildShapeUses) {
    draft.wildShapeUses = character.maxWildShapeUses;
  }

  // Fighter: Second Wind (handled via hit dice, but also a bonus action heal)

  return draft;
}

export function applyLongRest(character: Character): Partial<Character> {
  const classData = getStaticClass(character.class);
  
  // Full HP recovery
  const draft: Partial<Character> = {
    currentHp: character.maxHp,
    temporaryHp: 0,
    // Full hit dice recovery (half level, min 1, max level)
    hitDiceRemaining: Math.min(character.level, Math.floor(character.level / 2)),
    // Reset death saves
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    // Reset spell slots
    spellSlotsExpended: Object.fromEntries(
      Object.entries(character.spellSlots || {}).map(([k]) => [k, 0])
    ),
    // Reset per-turn tracking
    spellsUsedThisTurn: [],
    featuresUsedThisTurn: [],
    // Exhaustion recovery
    activeStates: character.activeStates?.filter(s => !s.toLowerCase().includes("exhaustion")) || [],
    // Reset class resources
    rages: character.maxRages || 0,
    kiPoints: character.maxKiPoints || 0,
    channelDivinityUses: character.maxChannelDivinityUses || 0,
    actionSurgeUses: character.maxActionSurgeUses || 0,
    indomitableUses: character.maxIndomitableUses || 0,
    layOnHandsPool: character.maxLayOnHandsPool || 0,
    wildShapeUses: character.maxWildShapeUses || 0,
    sorceryPoints: character.maxSorceryPoints || 0,
    bardicInspirationUses: character.maxBardicInspirationUses || 0,
    arcaneRecoveryUsed: false,
    // Reset buff durations
    activeBuffs: [],
  };

  // Warlock: Pact Magic slots recover on both short and long rest
  if (classData?.name === "Warlock") {
    const warlockSlots: Record<number, number> = {};
    const classData = getStaticClass("Warlock");
    if (classData?.levels) {
      const levelData = classData.levels[character.level - 1];
      if (levelData?.spellSlots) {
        for (const [slotLevel, count] of Object.entries(levelData.spellSlots)) {
          warlockSlots[Number(slotLevel)] = count;
        }
      }
    }
    draft.spellSlots = warlockSlots;
    draft.spellSlotsExpended = Object.fromEntries(
      Object.entries(warlockSlots).map(([k]) => [k, 0])
    );
  }

  // Fighter: Action Surge recovers
  if (classData?.name === "Fighter" && character.maxActionSurgeUses) {
    draft.actionSurgeUses = character.maxActionSurgeUses;
  }

  // Cleric/Paladin: Channel Divinity recovers
  if ((classData?.name === "Cleric" || classData?.name === "Paladin") && character.maxChannelDivinityUses) {
    draft.channelDivinityUses = character.maxChannelDivinityUses;
  }

  // Monk: Ki recovers
  if (classData?.name === "Monk" && character.maxKiPoints) {
    draft.kiPoints = character.maxKiPoints;
  }

  // Sorcerer: Sorcery Points recover (all levels on long rest, level 20 also short rest)
  if (classData?.name === "Sorcerer" && character.maxSorceryPoints) {
    draft.sorceryPoints = character.maxSorceryPoints;
  }

  // Bard: Bardic Inspiration recovers (all levels on long rest, level 5+ also short rest)
  if (classData?.name === "Bard" && character.maxBardicInspirationUses) {
    draft.bardicInspirationUses = character.maxBardicInspirationUses;
  }

  // Druid: Wild Shape recovers
  if (classData?.name === "Druid" && character.maxWildShapeUses) {
    draft.wildShapeUses = character.maxWildShapeUses;
  }

  // Barbarian: Rages recover
  if (classData?.name === "Barbarian" && character.maxRages) {
    draft.rages = character.maxRages;
  }

  // Wizard: Arcane Recovery (once per long rest)
  if (classData?.name === "Wizard") {
    draft.arcaneRecoveryUsed = false;
  }

  return draft;
}
