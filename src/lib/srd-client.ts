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

export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
  languages: string[];
  languageDesc?: string;
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
  cantripsKnown?: Record<number, number>;
  subclassLevel?: number;
  subclasses: {
    name: string;
    description: string;
    features: { name: string; description: string; level?: number }[];
  }[];
  scalingFeatures?: {
    name: string;
    description: string;
    type: "feature" | "attack";
    values: Record<number, number>;
  }[];
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
}

export interface SRDItem {
  index: string;
  name: string;
  equipment_category: string;
  description: string;
  cost: { quantity: number; unit: string };
  weight: number;
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

export function getStaticRaces(): SRDRace[] {
  return racesData.races as SRDRace[];
}

export function getStaticRace(name: string): SRDRace | undefined {
  return getStaticRaces().find((r) => r.name === name);
}

export function getStaticClasses(): SRDClass[] {
  return classesData.classes as unknown as SRDClass[];
}

export function getStaticClass(name: string): SRDClass | undefined {
  return getStaticClasses().find((c) => c.name === name);
}

export interface SRDSubclass {
  name: string;
  description: string;
  features: { name: string; description: string; level?: number; choices?: { name: string; description: string }[]; choicesCount?: number }[];
}

export function getStaticSubclasses(className: string): SRDSubclass[] {
  const all = (subclassesData as any).subclasses as any[];
  const choicesMap = (subclassChoicesData as any)[className] || {};
  return all
    .filter((s) => s.class === className)
    .map((s) => {
      const subChoices = choicesMap[s.name] || {};
      return {
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
          }
          return out;
        }),
      };
    });
}

export function getStaticSpells(): SRDSpell[] {
  return Array.isArray((spellsData as any).spells) ? (spellsData as any).spells : (spellsData as any) || [];
}

export function getCachedSRDData(): SRDData | null {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }
  return null;
}

export function getStaticWeapons(): SRDWeapon[] {
  return weaponsData.weapons as SRDWeapon[];
}

export function getStaticWeapon(name: string): SRDWeapon | undefined {
  return getStaticWeapons().find((w) => w.name === name);
}

export function getStaticArmors(): SRDArmor[] {
  return armorsData.armors as SRDArmor[];
}

export function getStaticArmor(name: string): SRDArmor | undefined {
  return getStaticArmors().find((a) => a.name === name);
}

export function getStaticItems(): SRDItem[] {
  return itemsData.items as SRDItem[];
}

export function getStaticItem(name: string): SRDItem | undefined {
  return getStaticItems().find((i) => i.name === name);
}

export function getStaticEquipments(): SRDEquipmentDetail[] {
  return equipmentsData.equipments as SRDEquipmentDetail[];
}

export function getStaticEquipment(name: string): SRDEquipmentDetail | undefined {
  return getStaticEquipments().find((e) => e.name === name);
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
  return {
    name: detail.name,
    description: detail.description,
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

export function getEquipmentNames(): string[] {
  return getStaticEquipments().map((e) => e.name);
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

export function getStaticWizardSpells(): SRDWizardSpell[] {
  return (wizardSpellsData as any).spells as SRDWizardSpell[];
}

export function getStaticWizardSpell(name: string): SRDWizardSpell | undefined {
  return getStaticWizardSpells().find((s) => s.name === name);
}

export function getWizardSpellNames(): string[] {
  return getStaticWizardSpells().map((s) => s.name);
}

export function clearSRDCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}
