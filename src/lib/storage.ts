import { getStaticClass, getStaticRace } from "@/lib/srd-client";
export interface Character {
  id: string;
  name: string;
  playerName: string;
  race: string;
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
  preparedSpells: string[];
  domainSpells: string[];
  circleTerrain: string;
  circleSpells: string[];
  bonusCantrips: string[];
  bardicInspirationUses: number;
  maxBardicInspirationUses: number;
  magicalSecretsSpells: string[];
  featureSelections: Record<string, string[]>;
  appliedAsi: number[];
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

export const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];

export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getMaxSpellsKnown(character: Character): number {
  const classData = getStaticClass(character.class);
  if (!classData) return 0;

  const spellsKnownByLevel: Record<string, Record<number, number>> = {
    Sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
    Bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 16, 15: 18, 16: 18, 17: 19, 18: 19, 19: 20, 20: 22 },
    Warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
    Ranger: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
    Paladin: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
  };

  const className = character.class;
  const level = character.level || 1;

  if (spellsKnownByLevel[className] && spellsKnownByLevel[className][level]) {
    return spellsKnownByLevel[className][level];
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
    preparedSpells: [],
    domainSpells: [],
    circleTerrain: "",
    circleSpells: [],
    bonusCantrips: [],
    bardicInspirationUses: 0,
    maxBardicInspirationUses: 0,
    magicalSecretsSpells: [],
    featureSelections: {},
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
    ...overrides,
  };
}

const STORAGE_KEY = "dnd-wizard-characters";

export function getCharacters(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Character[];
    return parsed.map((c) => normalizeCharacter(c));
  } catch {
    return [];
  }
}

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
  };
}

export function getCharacter(id: string): Character | undefined {
  return getCharacters().find((c) => c.id === id);
}

export function saveCharacter(character: Character): void {
  const characters = getCharacters();
  const index = characters.findIndex((c) => c.id === character.id);
  const now = Date.now();
  const updated = { ...character, updatedAt: now };
  if (index >= 0) {
    characters[index] = updated;
  } else {
    characters.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function deleteCharacter(id: string): void {
  const characters = getCharacters().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
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
  if (bodyArmor && bodyArmor.baseAC !== undefined) {
    const maxDex = bodyArmor.maxDexBonus ?? null;
    const dexMod = maxDex !== null ? Math.min(getModifier(character.dex), maxDex) : getModifier(character.dex);
    ac = bodyArmor.baseAC + dexMod;
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

  let rages = 0;
  let maxRages = 0;
  let rageDamage = 0;
  if (classData?.name === "Barbarian") {
    if (character.level >= 17) maxRages = 6;
    else if (character.level >= 12) maxRages = 5;
    else if (character.level >= 6) maxRages = 4;
    else if (character.level >= 3) maxRages = 3;
    else maxRages = 2;
    rages = maxRages;
    if (character.level >= 16) rageDamage = 4;
    else if (character.level >= 9) rageDamage = 3;
    else rageDamage = 2;
  }

  const equippedShields = character.inventory.filter((item) => item.equipped && item.armorType === "shield");
  let ac = 10 + getModifier(character.dex);
  const bodyArmor = character.inventory.find((item) => item.equipped && item.itemType === "armor" && item.armorType !== "shield");
  if (bodyArmor && bodyArmor.baseAC !== undefined) {
    const maxDex = bodyArmor.maxDexBonus ?? null;
    const dexMod = maxDex !== null ? Math.min(getModifier(character.dex), maxDex) : getModifier(character.dex);
    ac = bodyArmor.baseAC + dexMod;
  }
  ac += equippedShields.length * 2;

  const hasArmor = bodyArmor !== undefined;
  if (character.features && character.features.length > 0) {
    for (const feature of character.features) {
      const fname = feature.name.toLowerCase();
      if (fname.includes("defense") && hasArmor) {
        ac += 1;
      } else if (fname.includes("shield mastery")) {
        ac += 1;
      }
    }
  }

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
    ac,
  };
}

export function getMaxPreparedSpells(character: Character): number {
  const classData = getStaticClass(character.class);
  if (!classData?.spellcastingAbility) return 0;
  const abilityMod = getModifier(character[classData.spellcastingAbility as keyof Character] as number);
  if (character.class === "Cleric" || character.class === "Druid") {
    return Math.max(1, abilityMod + character.level);
  }
  if (character.class === "Paladin") {
    return Math.max(1, abilityMod + Math.floor(character.level / 2));
  }
  if (character.class === "Wizard") {
    return Math.max(1, abilityMod + character.level);
  }
  return 0;
}

export function isPreparationCaster(character: Character): boolean {
  return ["Cleric", "Druid", "Paladin", "Wizard"].includes(character.class);
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
  if (character.class !== "Cleric" || !character.subclass) return [];
  const domainSpells: Record<string, string[]> = {
    life: ["bless", "cure wounds", "lesser restoration", "spiritual weapon", "beacon of hope", "death ward", "guardian of faith", "healing word"],
    knowledge: ["command", "identify", "augury", "suggestion", "nondetection", "speak with dead", "arcane eye", "confusion"],
    light: ["burning hands", "faerie fire", "flaming sphere", "scorching ray", "fireball", "daylight", "flame strike", "wall of fire"],
    nature: ["animal friendship", "speak with animals", "barkskin", "spike growth", "plant growth", "wall of stone", "dominate beast", "insect plague"],
    tempest: ["fog cloud", "gust of wind", "shatter", "call lightning", "sleet storm", "control water", "ice storm", "destructive wave"],
    trickery: ["charm person", "disguise self", "mirror image", "pass without trace", "blink", "dimension door", "polymorph", "dominate person"],
    war: ["divine favor", "shield of faith", "magic weapon", "spiritual weapon", "freedom of movement", "stoneskin", "flame strike", "hold monster"],
  };
  return domainSpells[character.subclass] || [];
}

export function getCircleSpells(terrain: string, level: number): string[] {
  const circleSpells: Record<string, Record<number, string[]>> = {
    arctic: { 3: ["hold person", "spike growth"], 5: ["sleet storm", "slow"], 7: ["freedom of movement", "ice storm"], 9: ["commune with nature", "cone of cold"] },
    coast: { 3: ["mirror image", "misty step"], 5: ["water breathing", "water walk"], 7: ["control water", "freedom of movement"], 9: ["conjure elemental", "scrying"] },
    desert: { 3: ["blur", "silence"], 5: ["create food and water", "protection from energy"], 7: ["blight", "hallucinatory terrain"], 9: ["insect plague", "wall of stone"] },
    forest: { 3: ["barkskin", "spider climb"], 5: ["call lightning", "plant growth"], 7: ["divination", "freedom of movement"], 9: ["commune with nature", "tree stride"] },
    grassland: { 3: ["invisibility", "pass without trace"], 5: ["daylight", "haste"], 7: ["divination", "freedom of movement"], 9: ["dream", "insect plague"] },
    mountain: { 3: ["spider climb", "spike growth"], 5: ["lightning bolt", "meld into stone"], 7: ["stone shape", "stoneskin"], 9: ["passwall", "wall of stone"] },
    swamp: { 3: ["darkness", "melf's acid arrow"], 5: ["water walk", "stinking cloud"], 7: ["freedom of movement", "locate creature"], 9: ["insect plague", "scrying"] },
    underdark: { 3: ["spider climb", "web"], 5: ["gaseous form", "stinking cloud"], 7: ["greater invisibility", "stone shape"], 9: ["cloudkill", "insect plague"] },
  };

  const terrainSpells = circleSpells[terrain.toLowerCase()];
  if (!terrainSpells) return [];

  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(terrainSpells)) {
    if (level >= Number(lvlStr)) {
      spells.push(...lvlSpells);
    }
  }
  return spells;
}

export function getCircleTerrainTypes(): string[] {
  return ["arctic", "coast", "desert", "forest", "grassland", "mountain", "swamp", "underdark"];
}
