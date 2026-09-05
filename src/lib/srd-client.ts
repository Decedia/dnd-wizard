import racesData from "@/data/2014_races.json";
import classesData from "@/data/2014_classes.json";
import subclassesData from "@/data/2014_subclasses.json";
import subclassChoicesData from "@/data/subclass_feature_choices.json";
import spellsData from "@/data/2014_spells.json";
import weaponsData from "@/data/2014_weapon.json";
import armorsData from "@/data/2014_armor.json";
import itemsData from "@/data/2014_items.json";
import equipmentsData from "@/data/2014_equipments.json";
import wizardSpellsData from "@/data/2014_wizard_spells.json";
import arcaneTricksterSpellsData from "@/data/2014_arcane_trickster_spells.json";
import featsData from "@/data/2014_feats.json";
import subclassSpellsData from "@/data/subclass_spells.json";
import { equipment as srdEquipment } from "@/data/srd";

// 2024 ruleset data (scaffold)
import races2024Data from "@/data/2024_phb.json";

export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
  languages: string[];
  languageDesc?: string;
  source?: string;
  choices?: RaceChoice[];
}

export interface RaceChoice {
  id: string;
  name: string;
  description?: string;
  type: "single" | "language" | "proficiency";
  options?: { id: string; name: string; description?: string }[];
}

export interface SRDClass {
  name: string;
  hitDie: number;
  hpPerLevel: number;
  primaryAbility: string;
  savingThrows: string[];
  flavorText: string;
  source?: string;
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
    granted?: boolean;
    description: string;
    items: any[];
  }[];
  features: { name: string; description: string; type?: string }[];
  levels: {
    features: { name: string; description?: string | string[]; type?: string }[];
    asi: boolean;
    spellSlots?: Record<string, number>;
  }[];
  spellcastingAbility?: string;
  cantripsKnown?: Record<number, number> | number[];
  spellsKnown?: Record<number, number>;
  subclassLevel?: number;
  subclasses: {
    name: string;
    description: string;
    features: { name: string; description: string; level?: number }[];
    expandedSpells?: Record<string, string[]>;
  }[];
  scalingFeatures?: {
    name: string;
    description: string;
    type: "feature" | "attack";
    values: Record<number, number>;
  }[];
  // Level-up progression features
  rageUses?: Record<string, number | string>;
  rageDamageBonus?: Record<string, number>;
  channelDivinityUses?: Record<string, number>;
  wildShapeUses?: Record<string, number | string>;
  actionSurgeUses?: Record<string, number>;
  indomitableUses?: Record<string, number>;
  kiPoints?: Record<string, number>;
  unarmoredMovement?: Record<string, number>;
  martialArtsDie?: Record<string, number>;
  sneakAttackDice?: Record<string, number>;
  sorceryPoints?: Record<string, number>;
  invocationsKnown?: Record<string, number>;
  spellbookSpells?: Record<string, number>;
}

export interface SRDClassSelection {
  name: string;
  description: string;
}

export interface SRDSpell {
  index: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string | string[];
  effect: string;
  higherLevel?: string[];
  components: string[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  classes: string[];
  subclasses?: string[];
  damage?: {
    damageType?: string;
    damageDice?: string;
  };
  attackType?: string;
  source?: string;
}

export interface SRDWizardSpell {
  index: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string[];
  effect: string;
  higherLevel?: string[];
  components: string[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  classes: string[];
  source?: string;
}

export interface SRDWeapon {
  index: string;
  name: string;
  equipment_category: string;
  description: string;
  cost: { quantity: number; unit: string };
  weight: number;
  weapon_category: string;
  category_range: string;
  damage?: { damage_dice: string; damage_type: { index: string; name: string } };
  two_handed_damage?: { damage_dice: string; damage_type: { index: string; name: string } };
  properties?: { index: string; name: string }[];
  throw_range?: { normal: number; long: number };
  source?: string;
}

export interface SRDArmor {
  index: string;
  name: string;
  equipment_category: string;
  description: string;
  cost: { quantity: number; unit: string };
  weight: number;
  armor_category: string;
  armor_class: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum: number;
  stealth_disadvantage: boolean;
  source?: string;
}

export interface SRDItem {
  index: string;
  name: string;
  equipment_category: string;
  description: string;
  cost: { quantity: number; unit: string };
  weight: number;
  source?: string;
}

export interface SRDEquipmentDetail {
  index: string;
  name: string;
  equipment_category: string;
  description: string;
  cost: { quantity: number; unit: string };
  weight: number;
  weapon_category?: string;
  category_range?: string;
  damage?: { damage_dice: string; damage_type: { index: string; name: string } };
  two_handed_damage?: { damage_dice: string; damage_type: { index: string; name: string } };
  properties?: { index: string; name: string }[];
  throw_range?: { normal: number; long: number };
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  contents?: any;
  source?: string;
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
   contents?: string;
 }

export interface SRDFeat {
  name: string;
  description: string;
  prerequisites: string | null;
  source?: string;
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

function getAllEquipment(): SRDEquipment[] {
  return getStaticEquipments().map((detail) => {
    const contents = detail.contents;
    const contentsStr = Array.isArray(contents)
      ? contents.map((c: any) => c.item?.name || c.name).filter(Boolean).join(", ")
      : typeof contents === "string"
        ? contents
        : undefined;
    const fallback = srdEquipment.find((e) => e.name === detail.name);
    return {
      name: detail.name,
      description: detail.description || fallback?.description || "",
      type: mapEquipmentCategory(detail.equipment_category),
      category: mapWeaponCategory(detail.category_range),
      damageDice: detail.damage?.damage_dice,
      damageType: detail.damage?.damage_type?.name,
      baseAC: detail.armor_class?.base,
      armorType: mapArmorType(detail.armor_category || ""),
      maxDexBonus: detail.armor_class?.max_bonus ?? (detail.armor_class?.dex_bonus ? null : 0),
      contents: contentsStr,
    };
  });
}

function getAllLanguages(): SRDLanguage[] {
  return [
    { name: "Common" },
    { name: "Dwarvish" },
    { name: "Elvish" },
    { name: "Giant" },
    { name: "Gnomish" },
    { name: "Goblin" },
    { name: "Halfling" },
    { name: "Orc" },
    { name: "Abyssal" },
    { name: "Celestial" },
    { name: "Draconic" },
    { name: "Deep Speech" },
    { name: "Infernal" },
    { name: "Primordial" },
    { name: "Sylvan" },
    { name: "Undercommon" },
  ];
}

export async function fetchSRDData(ruleset: string = "2014"): Promise<SRDData> {
  const cacheKey = `${CACHE_KEY}-${ruleset}`;
  const cached = memoryCache;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data: SRDData = {
    races: getStaticRaces([], ruleset),
    classes: getStaticClasses([], ruleset),
    spells: getStaticSpells([], ruleset),
    equipment: getAllEquipment(),
    languages: getAllLanguages(),
  };

  memoryCache = { data, timestamp: Date.now() };
  return data;
}

export function getStaticRaces(sources?: string[], ruleset?: string): SRDRace[] {
  const races2014 = (racesData as any).races as SRDRace[];
  const races2024 = (races2024Data as any).races as SRDRace[];
  const allRaces = [...races2014, ...races2024];
  let filtered = allRaces;
  if (ruleset) {
    filtered = filtered.filter((r) => (r as any).ruleset === ruleset || (!(r as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((r) => sources.includes(r.source || "PHB"));
}

export function getStaticRace(name: string, ruleset?: string): SRDRace | undefined {
  return getStaticRaces([], ruleset).find((r) => r.name === name);
}

export function getStaticClasses(sources?: string[], ruleset?: string): SRDClass[] {
  const classes2014 = (classesData as any).classes as unknown as SRDClass[];
  const classes2024 = (races2024Data as any).classes as unknown as SRDClass[];
  const allClasses = [...classes2014, ...classes2024];
  let filtered = allClasses;
  if (ruleset) {
    filtered = filtered.filter((c) => (c as any).ruleset === ruleset || (!(c as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((c) => sources.includes(c.source || "PHB"));
}

export function getStaticClass(name: string, ruleset?: string): SRDClass | undefined {
  return getStaticClasses([], ruleset).find((c) => c.name === name);
}

export interface SRDSubclass {
  index?: string;
  name: string;
  description: string;
  features: { name: string; description: string; level?: number; choices?: { name: string; description: string }[]; choicesCount?: number }[];
  expandedSpells?: Record<string, string[]>;
  source?: string;
}

export function getStaticSubclasses(className: string, sources?: string[], ruleset?: string): SRDSubclass[] {
  const all = (subclassesData as any).subclasses as any[];
  const choicesMap = (subclassChoicesData as any)[className] || {};
  let filtered = all.filter((s) => s.class === className);
  if (ruleset) {
    filtered = filtered.filter((s) => (s.ruleset || "2014") === ruleset);
  }
  return filtered
    .filter((s) => !sources || sources.length === 0 || sources.includes(s.source || "PHB"))
    .map((s) => {
      const subChoices = choicesMap[s.name] || {};
      return {
        index: s.index,
        name: s.name,
        description: Array.isArray(s.description) ? s.description.join("\n") : s.description || "",
        features: (s.features || []).map((f: any) => {
          const featChoices = subChoices[f.name];
          const out: any = {
            name: f.name,
            description: Array.isArray(f.description) ? f.description.join("\n") : f.description || "",
            level: f.level,
          };
          if (featChoices && Array.isArray(featChoices.options)) {
            out.choices = featChoices.options.map((opt: any) => ({
              name: opt.name,
              description: opt.description || "",
            }));
            if (typeof featChoices.count === "number") {
              out.choicesCount = featChoices.count;
            }
          } else if (f.choices && Array.isArray(f.choices)) {
            out.choices = f.choices.map((opt: any) => ({
              name: opt.name,
              description: opt.description || "",
            }));
            if (typeof f.choicesCount === "number") {
              out.choicesCount = f.choicesCount;
            }
          }
          return out;
        }),
        source: s.source || "PHB",
      };
    });
}

export function getStaticSubclassDetails(className: string, subclassName: string): { name: string; description: string[]; features: { name: string; description: string[]; level?: number }[] } | null {
  const all = (subclassesData as any).subclasses as any[];
  const found = all.find((s) => s.class === className && s.name === subclassName);
  if (!found) return null;

  return {
    name: found.name,
    description: Array.isArray(found.description) ? found.description : [found.description || ""],
    features: (found.features || []).map((f: any) => ({
      name: f.name,
      description: Array.isArray(f.description) ? f.description : [f.description || ""],
      level: f.level,
    })),
  };
}

export function getStaticSpells(sources?: string[], ruleset?: string): SRDSpell[] {
  const raw = Array.isArray((spellsData as any).spells) ? (spellsData as any).spells : (spellsData as any) || [];
  const spells: SRDSpell[] = raw.map(normalizeSpell);
  let filtered = spells;
  if (ruleset) {
    filtered = filtered.filter((s) => (s as any).ruleset === ruleset || (!(s as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((s) => sources.includes(s.source || "PHB"));
}

export function deduplicateSpells(spells: SRDSpell[]): SRDSpell[] {
  const map = new Map<string, SRDSpell & { sources: string[] }>();
  for (const sp of spells) {
    const key = `${sp.name}-${sp.level}`;
    const existing = map.get(key);
    if (existing) {
      const src = sp.source || "PHB";
      if (!existing.sources.includes(src)) {
        existing.sources.push(src);
      }
    } else {
      map.set(key, { ...sp, sources: [sp.source || "PHB"] });
    }
  }
  return Array.from(map.values());
}

export function getCachedSRDData(): SRDData | null {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }
  return null;
}

export function getStaticWeapons(sources?: string[], ruleset?: string): SRDWeapon[] {
  const weapons = weaponsData.weapons as SRDWeapon[];
  let filtered = weapons;
  if (ruleset) {
    filtered = filtered.filter((w) => (w as any).ruleset === ruleset || (!(w as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((w) => sources.includes(w.source || "PHB"));
}

export function getStaticWeapon(name: string, ruleset?: string): SRDWeapon | undefined {
  return getStaticWeapons([], ruleset).find((w) => w.name === name);
}

export function getStaticArmors(sources?: string[], ruleset?: string): SRDArmor[] {
  const armors = armorsData.armors as SRDArmor[];
  let filtered = armors;
  if (ruleset) {
    filtered = filtered.filter((a) => (a as any).ruleset === ruleset || (!(a as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((a) => sources.includes(a.source || "PHB"));
}

export function getStaticArmor(name: string, ruleset?: string): SRDArmor | undefined {
  return getStaticArmors([], ruleset).find((a) => a.name === name);
}

export function getStaticItems(sources?: string[], ruleset?: string): SRDItem[] {
  const items = itemsData.items as SRDItem[];
  let filtered = items;
  if (ruleset) {
    filtered = filtered.filter((i) => (i as any).ruleset === ruleset || (!(i as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((i) => sources.includes(i.source || "PHB"));
}

export function getStaticItem(name: string, ruleset?: string): SRDItem | undefined {
  return getStaticItems([], ruleset).find((i) => i.name === name);
}

export function getStaticEquipments(sources?: string[], ruleset?: string): SRDEquipmentDetail[] {
  const equipments = equipmentsData.equipments as SRDEquipmentDetail[];
  let filtered = equipments;
  if (ruleset) {
    filtered = filtered.filter((e) => (e as any).ruleset === ruleset || (!(e as any).ruleset && ruleset === "2014"));
  }
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((e) => sources.includes(e.source || "PHB"));
}

export function getStaticEquipment(name: string, ruleset?: string): SRDEquipmentDetail | undefined {
  return getStaticEquipments([], ruleset).find((e) => e.name === name);
}

function mapEquipmentCategory(category: string): "weapon" | "armor" | "item" {
  if (category === "weapon") return "weapon";
  if (category === "armor") return "armor";
  return "item";
}

function mapArmorType(category: string): "light" | "medium" | "heavy" | "shield" | undefined {
  if (category === "Light") return "light";
  if (category === "Medium") return "medium";
  if (category === "Heavy") return "heavy";
  if (category === "Shield") return "shield";
  return undefined;
}

function mapWeaponCategory(range: string | undefined): "melee" | "ranged" | undefined {
  if (!range) return undefined;
  if (range.includes("Melee")) return "melee";
  if (range.includes("Ranged")) return "ranged";
  return undefined;
}

export function getEquipmentData(name: string): SRDEquipment | undefined {
  const detail = getStaticEquipment(name);
  if (!detail) return undefined;
  const contents = detail.contents;
  const contentsStr = Array.isArray(contents)
    ? contents.map((c: any) => c.item?.name || c.name).filter(Boolean).join(", ")
    : typeof contents === "string"
      ? contents
      : undefined;
  const fallback = srdEquipment.find((e) => e.name === name);
  return {
    name: detail.name,
    description: detail.description || fallback?.description || "",
    type: mapEquipmentCategory(detail.equipment_category),
    category: mapWeaponCategory(detail.category_range),
    damageDice: detail.damage?.damage_dice,
    damageType: detail.damage?.damage_type?.name,
    baseAC: detail.armor_class?.base,
    armorType: mapArmorType(detail.armor_category || ""),
    maxDexBonus: detail.armor_class?.max_bonus ?? (detail.armor_class?.dex_bonus ? null : 0),
    contents: contentsStr,
  };
}

export function getEquipmentNames(sources?: string[]): string[] {
  return getStaticEquipments(sources).map((e) => e.name);
}

export function getWeaponNames(): string[] {
  return getStaticWeapons().map((w) => w.name);
}

export function getArmorNames(): string[] {
  return getStaticArmors().map((a) => a.name);
}

export function getItemNames(): string[] {
  return getStaticItems().map((i) => i.name);
}

export function normalizeSpell(s: any): any {
  const desc = Array.isArray(s.desc) ? s.desc.join("\n") : (s.desc || s.description || "");
  const damage = s.damage || {};
  const damageType = damage.damage_type?.name || "";
  const damageAtLevel = damage.damage_at_character_level || {};
  const damageDice = damage.damage_dice || damageAtLevel["1"] || "";
  return {
    ...s,
    description: typeof desc === "string" ? desc : String(desc),
    school: typeof s.school === "object" ? s.school?.name || "" : (s.school || ""),
    castingTime: s.castingTime || s.casting_time || "",
    damage: {
      damageType,
      damageDice,
    },
  };
}

export function getStaticWizardSpells(sources?: string[]): SRDWizardSpell[] {
  const raw = (wizardSpellsData as any).spells || [];
  const spells: SRDWizardSpell[] = raw.map(normalizeSpell);
  if (!sources || sources.length === 0) return spells;
  return spells.filter((s) => sources.includes(s.source || "PHB"));
}

export function getStaticWizardSpell(name: string): SRDWizardSpell | undefined {
  return getStaticWizardSpells().find((s) => s.name === name);
}

export function getWizardSpellNames(): string[] {
  return getStaticWizardSpells().map((s) => s.name);
}

export function getStaticArcaneTricksterSpells(): SRDWizardSpell[] {
   const raw = (arcaneTricksterSpellsData as any).spells || [];
   return raw.map(normalizeSpell);
 }

export function getStaticFeats(sources?: string[]): SRDFeat[] {
  const feats = featsData.feats as SRDFeat[];
  if (!sources || sources.length === 0) {
    // Deduplicate by name, keeping first occurrence (prefer PHB)
    const seen = new Set<string>();
    return feats.filter((f) => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
  }
  const filtered = feats.filter((f) => sources.includes(f.source || "PHB"));
  // Deduplicate filtered results
  const seen = new Set<string>();
  return filtered.filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });
}

export function getStaticFeat(name: string): SRDFeat | undefined {
  return getStaticFeats().find((f) => f.name === name);
}

 export function clearSRDCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function getAvailableSources(): string[] {
  const sources = new Set<string>();
  (subclassesData as any).subclasses.forEach((s: any) => sources.add(s.source || "PHB"));
  (racesData as any).races.forEach((r: any) => sources.add(r.source || "PHB"));
  (spellsData as any).spells.forEach((s: any) => sources.add(s.source || "PHB"));
  return Array.from(sources).sort();
}

export function getDomainSpells(subclassIndex: string, level: number): string[] {
  const domain = (subclassSpellsData as any).domainSpells[subclassIndex];
  if (!domain) return [];
  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(domain)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getCircleSpells(terrain: string, level: number): string[] {
  const terrains = (subclassSpellsData as any).circleSpells?.land?.terrains;
  if (!terrains) return [];
  const terrainSpells = terrains[terrain.toLowerCase()];
  if (!terrainSpells) return [];
  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(terrainSpells)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getCircleTerrainTypes(): string[] {
  const terrains = (subclassSpellsData as any).circleSpells?.land?.terrains;
  return terrains ? Object.keys(terrains) : [];
}

export function getOathSpells(subclassIndex: string, level: number): string[] {
  const oath = (subclassSpellsData as any).oathSpells[subclassIndex];
  if (!oath) return [];
  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(oath)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getWizardTraditionSpells(subclassIndex: string, level: number): string[] {
  const tradition = (subclassSpellsData as any).wizardTraditionSpells[subclassIndex];
  if (!tradition) return [];
  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(tradition)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getSubclassSpellGrants(subclassIndex: string, level: number): string[] {
  const grants = (subclassSpellsData as any).subclassSpellGrants[subclassIndex];
  if (!grants) return [];
  const spells: string[] = [];
  for (const [lvlStr, lvlSpells] of Object.entries(grants)) {
    if (level >= Number(lvlStr)) {
      spells.push(...(lvlSpells as string[]));
    }
  }
  return spells;
}

export function getSubclassFlags(subclassIndex: string): Record<string, boolean> {
  return (subclassSpellsData as any).subclassFlags[subclassIndex] || {};
}

export function getPactBoons(): { index: string; name: string; description: string }[] {
  return (subclassSpellsData as any).pactBoons || [];
}

export function getWizardSpellsByLevel(level: number, sources?: string[]): string[] {
  const allSpells = getStaticWizardSpells(sources);
  return allSpells
    .filter((s: any) => s.level === level)
    .map((s: any) => s.name)
    .sort();
}
