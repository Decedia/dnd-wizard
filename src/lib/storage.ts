import { getClassData } from "@/data/srd";
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
  personalityTrait1: string;
  personalityTrait2: string;
  ideal: string;
  bond: string;
  flaw: string;
  abilityMethod: "standard" | "pointbuy" | "manual";
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
  initiative: number;
  speed: number;
  savingThrows: Record<string, { proficient: boolean; value: number }>;
  skills: Record<string, boolean>;
  expertise: string[];
  passivePerception: number;
  features: { id: string; name: string; description: string }[];
  inventory: { id: string; name: string; quantity: number; equipped: boolean; source: "srd" | "custom"; srdItemName?: string; itemType?: "weapon" | "armor" | "item"; category?: "melee" | "ranged"; damageDice?: string; damageType?: string; baseAC?: number; armorType?: "light" | "medium" | "heavy" | "shield"; maxDexBonus?: number | null; choiceGroupIndex?: number; choiceOptionIndex?: number; isGranted?: boolean }[];
  attacks: { id: string; name: string; attackBonus: number; damageType: string; sneakAttack?: string }[];
  otherProficiencies: string;
  languages: string[];
  spells: { id: string; name: string; level: number; source: "srd" | "custom"; srdSpellName?: string }[];
  spellcastingAbility: string;
  spellSaveDc: number;
  spellAttackBonus: number;
  cantrips: { id: string; name: string }[];
  spellSlots: Record<number, number>;
  spellSlotsExpended: Record<number, number>;
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

export const RACES = ["Human", "Elf", "Dwarf", "Halfling"];
export const CLASSES = ["Fighter", "Wizard", "Rogue"];

export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getHitDieAverage(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
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
    currentHp: 10,
    maxHp: 10,
    temporaryHp: 0,
    hitDiceTotal: "",
    hitDiceRemaining: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    initiative: 0,
    speed: 30,
    savingThrows: {},
    skills: {},
    expertise: [],
    passivePerception: 10,
    features: [],
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
    inventory: (c.inventory || []).map((item) => ({
      ...defaults.inventory[0],
      ...item,
    })),
    spells: (c.spells || []).map((spell) => ({
      ...defaults.spells[0],
      ...spell,
    })),
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
  const raceMap: Record<string, Record<string, number>> = {
    Human: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    Elf: { dex: 2 },
    Dwarf: { con: 2 },
    Halfling: { dex: 2 },
  };
  const increases = raceMap[name];
  if (!increases) return undefined;
  return { abilityScoreIncreases: increases };
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

  const profBonus = getProficiencyBonus(character.level);
  const attacks: Character["attacks"] = equippedWeapons.map((weapon) => {
    const abilityKey = weapon.category === "ranged" ? "dex" : "str";
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const isFinesseOrRanged = weapon.category === "ranged" || weapon.name === "Dagger" || weapon.name === "Rapier" || weapon.name === "Shortsword";
    const sneakDice = isFinesseOrRanged ? getSneakAttackDice(character) : undefined;
    return {
      id: weapon.id,
      name: weapon.name,
      attackBonus: abilityMod + profBonus,
      damageType: [weapon.damageDice, weapon.damageType].filter(Boolean).join(" "),
      sneakAttack: sneakDice,
    };
  });

  return { ac, attacks };
}

export function getSneakAttackDice(character: Character): string | undefined {
  if (character.class !== "Rogue") return undefined;
  const classData = getClassData("Rogue");
  const scaling = classData?.scalingFeatures?.find((f) => f.type === "sneak_attack");
  if (!scaling) return undefined;
  const diceCount = scaling.values[character.level] ?? 1;
  return `${diceCount}d6`;
}

export function computeDerivedStats(character: Character): Partial<Character> {
  const profBonus = getProficiencyBonus(character.level);
  const classData = getClassData(character.class);
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

  let maxHp = character.maxHp;
  if (character.level === 1 && classData) {
    const hitDie = classData.hitDie;
    const conMod = getModifier(character.con);
    maxHp = hitDie + conMod;
  } else if (classData && character.level > 1) {
    const hitDie = classData.hitDie;
    const conMod = getModifier(character.con);
    const flatPerLevel = getHitDieAverage(hitDie);
    const levelsAboveFirst = character.level - 1;
    const baseHpAtLevel1 = Math.max(character.maxHp - levelsAboveFirst * (flatPerLevel + conMod), hitDie + conMod);
    maxHp = baseHpAtLevel1 + levelsAboveFirst * (flatPerLevel + conMod);
  }

  return {
    proficiencyBonus: profBonus,
    savingThrows,
    initiative,
    passivePerception,
    spellcastingAbility,
    spellSaveDc,
    spellAttackBonus,
    maxHp,
  };
}
