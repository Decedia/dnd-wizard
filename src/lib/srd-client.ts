export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
}

export interface SRDClass {
  name: string;
  hitDie: number;
  hpPerLevel: number;
  primaryAbility: string;
  savingThrows: string[];
  flavorText: string;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
  };
  skillChoices: {
    count: number;
    options: string[];
  };
  startingEquipment: {
    description: string;
    items: any[];
  }[];
  features: { name: string; description: string; type?: string }[];
  levels: {
    features: string[];
    asi: boolean;
    spellSlots?: Record<number, number>;
  }[];
  spellcastingAbility?: string;
  cantripsKnown?: Record<number, number>;
  subclassLevel?: number;
  subclasses: {
    name: string;
    description: string;
    features: { name: string; description: string }[];
  }[];
}

export interface SRDSpell {
  name: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  effect: string;
}

export interface SRDEquipment {
  name: string;
  description: string;
  type: "weapon" | "armor" | "item";
  category?: "melee" | "ranged";
  damageDice?: string;
  damageType?: string;
  baseAC?: number;
  armorType?: "light" | "medium" | "heavy" | "shield";
  maxDexBonus?: number | null;
}

export interface SRDLanguage {
  name: string;
  description?: string;
}

export interface SRDData {
  races: SRDRace[];
  classes: SRDClass[];
  spells: SRDSpell[];
  equipment: SRDEquipment[];
  languages: SRDLanguage[];
}

const CACHE_KEY = "srd-cache";
const CACHE_TTL = 5 * 60 * 1000;

let memoryCache: { data: SRDData; timestamp: number } | null = null;

export async function fetchSRDData(): Promise<SRDData> {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }

  try {
    const res = await fetch("/api/srd", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch SRD data: ${res.status}`);
    }
    const data = (await res.json()) as SRDData;
    memoryCache = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    if (memoryCache) {
      return memoryCache.data;
    }
    throw error;
  }
}

export function getCachedSRDData(): SRDData | null {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }
  return null;
}

export function clearSRDCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}
