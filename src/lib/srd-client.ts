import racesDataEn from "@/data/en/2014_races.json";
import racesDataId from "@/data/id/2014_races.json";
const racesDataMap = { en: racesDataEn, id: racesDataId } as const;

import type { Character } from "@/lib/storage";

import classesDataEn from "@/data/en/2014_classes.json";
import classesDataId from "@/data/id/2014_classes.json";
const classesDataMap = { en: classesDataEn, id: classesDataId } as const;

import subclassesDataEn from "@/data/en/2014_subclasses.json";
import subclassesDataId from "@/data/id/2014_subclasses.json";
const subclassesDataMap = { en: subclassesDataEn, id: subclassesDataId } as const;

import subclassChoicesData from "@/data/subclass_feature_choices.json";
import subclassChoiceTextId from "@/data/id/subclass_feature_choices_text.json";

import spellsDataEn from "@/data/en/2014_spells.json";
import spellsDataId from "@/data/id/2014_spells.json";
const spellsDataMap = { en: spellsDataEn, id: spellsDataId } as const;

import spellLocalesEn from "@/locales/parts/en/2014_spells.json";
import spellLocalesId from "@/locales/parts/id/2014_spells.json";
const spellLocalesMap = { en: spellLocalesEn, id: spellLocalesId } as const;




import { findLocalizedItem, getCatalog, weaponPropertyText, type CatalogItem } from "@/data/item-catalog";



import featsDataEn from "@/data/en/2014_feats.json";
import featsDataId from "@/data/id/2014_feats.json";
const featsDataMap = { en: featsDataEn, id: featsDataId } as const;

import subclassSpellsData from "@/data/subclass_spells.json";

// 2024 rules (SRD 5.2, built by scripts/import-srd52.py). English only for now;
// other languages fall back to it.
import species2024En from "@/data/en/2024_species.json";
import classes2024En from "@/data/en/2024_classes.json";
import subclasses2024En from "@/data/en/2024_subclasses.json";
import spells2024En from "@/data/en/2024_spells.json";
import feats2024En from "@/data/en/2024_feats.json";
import backgrounds2024En from "@/data/en/2024_backgrounds.json";
const species2024Map: Record<string, { races: unknown[] }> = { en: species2024En };
const classes2024Map: Record<string, { classes: unknown[] }> = { en: classes2024En };
const subclasses2024Map: Record<string, { subclasses: unknown[] }> = { en: subclasses2024En };
const spells2024Map: Record<string, { spells: unknown[] }> = { en: spells2024En };
const feats2024Map: Record<string, { feats: unknown[] }> = { en: feats2024En };
const backgrounds2024Map: Record<string, { backgrounds: SRDBackground2024[] }> = { en: backgrounds2024En as { backgrounds: SRDBackground2024[] } };

/** A 2024 background: it gives the ability increases and an Origin feat. */
export interface SRDBackground2024 {
  name: string;
  ruleset: "2024";
  source: string;
  /** The three abilities the +2/+1 or +1/+1/+1 goes to. */
  abilityScores: string[];
  /** The Origin feat, with its spell list in brackets for Magic Initiate. */
  feat: string;
  skills: string[];
  tools: string[];
  toolChoice: string | null;
  equipment: string;
}

export function getStaticBackgrounds2024(locale: string = "en"): SRDBackground2024[] {
  return pickLocaleData(backgrounds2024Map, locale).backgrounds;
}

import { getFeatOptionGroups, type FeatOptionGroup } from "@/data/feat-options";

export type { FeatOptionGroup, FeatOptionChoice, FeatOptionSpellFilter } from "@/data/feat-options";

export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string; summary?: string; book?: string }[];
  languages: string[];
  languageDesc?: string;
  source?: string;
  choices?: RaceChoice[];
  flavor?: string;
  /** Languages the player picks on top of `languages`. */
  extraLanguages?: number;
  /** Skills the race always grants. */
  skillProficiencies?: string[];
  /** Skills the player picks; no options means any skill. */
  skillChoice?: { count: number; options?: string[] };
  /** "lineage": +2/+1 or +1/+1/+1 of the player's choice. "one": +1 to one other ability. */
  flexibleAsi?: "lineage" | "one";
  /** A parent race (Elf, Dwarf) that is only played through a subrace. */
  requiresSubrace?: boolean;
  /** 2024: "2024" on every species record. */
  ruleset?: string;
  /** 2024: spells every member knows, by character level (Tiefling: Thaumaturgy). */
  spells?: Record<string, string[]>;
  /** 2024 Human (Versatile): an Origin feat of the player's choice. */
  originFeat?: boolean;
  sizeOptions?: string[] | null;
}

export interface RaceChoice {
  id: string;
  name: string;
  description?: string;
  type: "single" | "language" | "proficiency" | "cantrip";
  options?: {
    id: string;
    name: string;
    description?: string;
    /** 2024 lineages: spells by character level, and what the lineage changes. */
    spells?: Record<string, string[]>;
    speed?: number;
    darkvision?: number;
    resistance?: string;
  }[];
  /** A cantrip pick from this class's list; options are built from the spell data. */
  spellList?: string;
  /** Shown only when another choice has this value (a half-elf's cantrip needs "cantrip"). */
  requires?: Record<string, string>;
}

/** A 2024 species' lineage pick (Elven Lineage, Draconic Ancestor), if it has one. */
export function lineageChoiceOf(race: Pick<SRDRace, "choices"> | undefined): RaceChoice | undefined {
  return race?.choices?.find((c) => c.id.endsWith("-2024-lineage"));
}

/** The race choices that apply given what is picked so far. */
export function activeRaceChoices(choices: RaceChoice[] | undefined, picked: Record<string, string> | undefined): RaceChoice[] {
  return (choices || []).filter((c) => !c.requires || Object.entries(c.requires).every(([k, v]) => picked?.[k] === v));
}

export interface SRDClass {
  name: string;
  hitDie: number;
  hpPerLevel: number;
  primaryAbility: string;
  savingThrows: string[];
  flavor?: string;
  /** Full class text, including the per-level feature summaries. */
  description?: string;
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
  features: { name: string; description: string; type?: string; book?: string }[];
  levels: {
    features: { name: string; description?: string | string[]; type?: string; book?: string }[];
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
    /** Extra expanded spells that depend on a subclass option, such as the Genie's kind. Keyed by option name, then class level. */
    expandedSpellsByOption?: Record<string, Record<string, string[]>>;
  }[];
  scalingFeatures?: {
    name: string;
    description: string;
    type: "feature" | "attack";
    values: Record<number, number>;
  }[];
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
  target?: string;
  effectSummary?: string;
  fullDescription?: string;
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
  target?: string;
  effectSummary?: string;
  fullDescription?: string;
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
  properties?: { index: string; name: string; desc?: string }[];
  range?: { normal: number; long?: number };
  throw_range?: { normal: number; long: number };
  special?: string;
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
  book?: string;
  summary?: string;
  options?: FeatOptionGroup[];
  /** 2024 feats: Origin, General, Fighting Style or Epic Boon. */
  category?: string;
  repeatable?: boolean;
  minLevel?: number;
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

let memoryCache: { data: SRDData; timestamp: number; locale: string; ruleset: string } | null = null;

function pickLocaleData<T>(map: Record<string, T>, locale: string): T {
  return map[locale] || map.en;
}

function getAllEquipment(): SRDEquipment[] {
  return getCatalog()
    .filter((i) => i.type !== "magic" && i.type !== "coin")
    .map((i) => toSRDEquipment(i));
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

export async function fetchSRDData(ruleset: string = "2014", locale: string = "en"): Promise<SRDData> {
  if (memoryCache && memoryCache.locale === locale && memoryCache.ruleset === ruleset && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }

  const data: SRDData = {
    races: getStaticRaces([], ruleset, locale),
    classes: getStaticClasses([], ruleset, locale),
    spells: getStaticSpells([], ruleset, locale),
    equipment: getAllEquipment(),
    languages: getAllLanguages(),
  };

  memoryCache = { data, timestamp: Date.now(), locale, ruleset };
  return data;
}

/**
 * Each lookup reads one rule set only: 2024 data never fills in for 2014 and
 * the other way round. A record without a `ruleset` field is 2014 data, and
 * no ruleset given means 2014.
 */
function ruleSetOf(ruleset?: string): "2014" | "2024" {
  return ruleset === "2024" ? "2024" : "2014";
}

function inRuleSet(record: unknown, ruleset?: string): boolean {
  return (((record as { ruleset?: string }).ruleset) || "2014") === ruleSetOf(ruleset);
}

export function getStaticRaces(sources?: string[], ruleset?: string, locale: string = "en"): SRDRace[] {
  const racesData = pickLocaleData(racesDataMap, locale) as any;
  const races2024Data = pickLocaleData(species2024Map, locale) as any;
  const races2014 = racesData.races as SRDRace[];
  const races2024 = (races2024Data as any).races as SRDRace[];
  const merged = ruleSetOf(ruleset) === "2024" ? races2024 : races2014;
  const seen = new Map<string, SRDRace>();
  for (const race of merged) {
    const key = race.name;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, race);
    } else {
      const existingHasChoices = !!(existing as any).choices;
      const raceHasChoices = !!(race as any).choices;
      if (raceHasChoices && !existingHasChoices) {
        seen.set(key, race);
      } else if (!raceHasChoices && existingHasChoices) {
        continue;
      } else {
        const existingHasFlavor = !!(existing as any).flavor;
        const raceHasFlavor = !!(race as any).flavor;
        if (raceHasFlavor && !existingHasFlavor) {
          seen.set(key, race);
        } else if (!raceHasFlavor && existingHasFlavor) {
          continue;
        } else {
          const existingLen = (existing.traits || []).length;
          const raceLen = (race.traits || []).length;
          if (raceLen > existingLen) {
            seen.set(key, race);
          }
        }
      }
    }
  }
  const allRaces = Array.from(seen.values());
  let filtered = allRaces;
  filtered = filtered.filter((r) => inRuleSet(r, ruleset));
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((r) => sources.includes(r.source || "PHB"));
}

export function getStaticRace(name: string, ruleset?: string, locale: string = "en"): SRDRace | undefined {
  const matches = getStaticRaces([], ruleset, locale).filter((r) => r.name === name);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  return matches.reduce((best, r) => {
    const bestHasFlavor = !!(best as any).flavor;
    const rHasFlavor = !!(r as any).flavor;
    if (rHasFlavor && !bestHasFlavor) return r;
    if (!rHasFlavor && bestHasFlavor) return best;
    return (r.traits || []).length > (best.traits || []).length ? r : best;
  }, matches[0]);
}

export function getStaticClasses(sources?: string[], ruleset?: string, locale: string = "en"): SRDClass[] {
  const classesData = pickLocaleData(classesDataMap, locale) as any;
  const races2024Data = pickLocaleData(classes2024Map, locale) as any;
  const classes2014 = classesData.classes as unknown as SRDClass[];
  const classes2024 = (races2024Data as any).classes as unknown as SRDClass[];
  const merged = ruleSetOf(ruleset) === "2024" ? classes2024 : classes2014;
  const seen = new Map<string, SRDClass>();
  for (const cls of merged) {
    const key = cls.name;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, cls);
    } else {
      const existingHasFlavor = !!(existing as any).flavor;
      const clsHasFlavor = !!(cls as any).flavor;
      if (clsHasFlavor && !existingHasFlavor) {
        seen.set(key, cls);
      } else if (!clsHasFlavor && existingHasFlavor) {
        continue;
      } else {
        const existingLen = (existing.levels || []).length;
        const clsLen = (cls.levels || []).length;
        if (clsLen > existingLen) {
          seen.set(key, cls);
        }
      }
    }
  }
  const allClasses = Array.from(seen.values());
  let filtered = allClasses;
  filtered = filtered.filter((c) => inRuleSet(c, ruleset));
  if (!sources || sources.length === 0) return filtered;
  return filtered.filter((c) => sources.includes(c.source || "PHB"));
}

export function getStaticClass(name: string, sourcesOrRuleset?: string[] | string, ruleset?: string, locale: string = "en"): SRDClass | undefined {
  const sources = Array.isArray(sourcesOrRuleset) ? sourcesOrRuleset : undefined;
  const actualRuleset = Array.isArray(sourcesOrRuleset) ? ruleset : sourcesOrRuleset;
  return getStaticClasses(sources, actualRuleset, locale).find((c) => c.name === name);
}

export interface SRDSubclass {
  index?: string;
  name: string;
  description: string;
  features: { name: string; description: string; level?: number; book?: string; choices?: { name: string; description: string }[]; choicesCount?: number }[];
  expandedSpells?: Record<string, string[]>;
  source?: string;
}

export function getStaticSubclasses(className: string, sources?: string[], ruleset?: string, locale: string = "en"): SRDSubclass[] {
  const subclassesData = pickLocaleData(subclassesDataMap, locale) as any;
  const is2024 = ruleSetOf(ruleset) === "2024";
  const all = is2024 ? (pickLocaleData(subclasses2024Map, locale).subclasses as any[]) : ((subclassesData as any).subclasses as any[]);
  // The pick lists are 2014 ones; 2024 subclasses that share a name (Hunter) must not get them.
  const choicesMap = is2024 ? {} : (subclassChoicesData as any)[className] || {};
  let filtered = all.filter((s) => s.class === className);
  filtered = filtered.filter((s) => inRuleSet(s, ruleset));
  return filtered
    .filter((s) => !sources || sources.length === 0 || sources.includes(s.source || "PHB"))
    .map((s) => {
      const subChoices = choicesMap[s.name] || {};
      return {
        index: s.index,
        name: s.name,
        description: Array.isArray(s.description) ? s.description.join("\n") : s.description || "",
        features: (s.features || []).flatMap((f: any) => {
          const featChoices = withSpellOptions(subChoices[f.name], sources, ruleset, locale);
          const out: any = {
            name: f.name,
            description: Array.isArray(f.description) ? f.description.join("\n") : f.description || "",
            level: f.level,
            summary: f.summary ?? null,
            featureType: f.featureType ?? null,
            actionType: f.actionType ?? null,
            uses: f.uses ?? null,
            requirement: f.requirement ?? null,
            duration: f.duration ?? null,
            endsIf: f.endsIf ?? null,
            effect: f.effect ?? null,
            onUse: f.onUse ?? null,
            scaling: f.scaling ?? null,
            grantsSpells: f.grantsSpells ?? false,
            grantsAttack: f.grantsAttack ?? false,
            grantsSkills: f.grantsSkills ?? false,
            grantsProficiency: f.grantsProficiency ?? false,
            source: f.source ?? undefined,
            book: f.book ?? undefined,
          };
          if (featChoices && Array.isArray(featChoices.options)) {
            out.choices = featChoices.options.map((opt: any) => ({
              name: opt.name,
              description: opt.description || "",
              icon: opt.icon,
              // Lowest class level at which this option can be picked.
              ...(opt.minLevel ? { minLevel: opt.minLevel } : {}),
              // A Tasha's optional class feature option: only offered when the table uses them.
              ...(opt.optional ? { optional: true } : {}),
            }));
            if (typeof featChoices.count === "number") {
              out.choicesCount = featChoices.count;
            }
            // A feature repeated at later levels can pick a different number each time.
            if (featChoices.countByLevel) out.choicesCountByLevel = featChoices.countByLevel;
            // What a picked option gives the character: a skill, a skill with
            // expertise, a language, a tool or a weapon proficiency.
            if (featChoices.grants) out.choiceGrants = featChoices.grants;
          } else if (f.choices && Array.isArray(f.choices)) {
            out.choices = f.choices.map((opt: any) => ({
              name: opt.name,
              description: opt.description || "",
              icon: opt.icon,
            }));
            if (typeof f.choicesCount === "number") {
              out.choicesCount = f.choicesCount;
            }
          }
          // A feature with a second pick (Blessings of Knowledge: skills, then
          // languages) gets one choice-only entry per extra pick, at its own level
          // when it sets one (Kensei weapons at 6, 11, 17), else the feature's.
          const extras = (featChoices?.extra || []).map((x: any) => {
            const e = withSpellOptions(x, sources, ruleset, locale);
            return {
              name: e.name,
              description: e.description || "",
              level: x.level ?? f.level,
              choiceOnly: true,
              choices: (e.options || []).map((opt: any) => ({ name: opt.name, description: opt.description || "" })),
              choicesCount: e.count ?? 1,
              ...(e.grants ? { choiceGrants: e.grants } : {}),
              source: f.source ?? undefined,
              book: f.book ?? undefined,
            };
          });
          return [out, ...extras];
        }),
        source: s.source || "PHB",
        ...(s.ruleset ? { ruleset: s.ruleset } : {}),
        ...(is2024 && s.expandedSpells ? { expandedSpells: s.expandedSpells } : {}),
        ...(is2024 && s.expandedSpellsByOption ? { expandedSpellsByOption: s.expandedSpellsByOption } : {}),
      };
    });
}

/** Subclass pick text in the reader's language; names stay as saved (they are the picks). */
function localizeChoice(choice: any, locale: string): any {
  if (!choice || locale !== "id") return choice;
  const tr = (s?: string) => (s && (subclassChoiceTextId as Record<string, string>)[s]) || s;
  return {
    ...choice,
    description: tr(choice.description),
    options: choice.options?.map((o: any) => ({ ...o, description: tr(o.description) })),
  };
}

/** A choice that names a class spell list gets its options from the spell data, filtered by book. */
function withSpellOptions(raw: any, sources?: string[], ruleset?: string, locale: string = "en"): any {
  const choice = localizeChoice(raw, locale);
  if (!choice?.spellList) return choice;
  const levels: number[] = Array.isArray(choice.spellLevel) ? choice.spellLevel : [choice.spellLevel ?? 0];
  const options = getStaticSpells(sources, ruleset, locale)
    .filter((sp) => levels.includes(sp.level ?? 0) && (sp.classes || []).includes(choice.spellList))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((sp) => ({ name: sp.name, description: `${sp.school || ""} ${(sp.level ?? 0) === 0 ? "cantrip" : `level ${sp.level}`}`.trim() }));
  return { ...choice, options };
}

export function getStaticSubclassDetails(className: string, subclassName: string, locale: string = "en"): { name: string; description: string[]; features: { name: string; description: string[]; level?: number }[] } | null {
  const subclassesData = pickLocaleData(subclassesDataMap, locale) as any;
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

export function getStaticRaceDetails(raceName: string, sources?: string[], ruleset?: string, locale: string = "en"): SRDRace | undefined {
  const race = getStaticRace(raceName, ruleset, locale);
  if (!race?.choices?.some((c) => c.spellList)) return race;
  return { ...race, choices: race.choices.map((c) => (c.spellList ? { ...c, options: getRaceCantripOptions(c.spellList, sources, ruleset, locale) } : c)) };
}

/** Every cantrip on a class list in the given books, as race choice options. Ids are name slugs. */
export function getRaceCantripOptions(spellList: string, sources?: string[], ruleset?: string, locale: string = "en"): { id: string; name: string; description?: string }[] {
  return getStaticSpells(sources, ruleset, locale)
    .filter((s) => (s.level ?? 0) === 0 && (s.classes || []).includes(spellList))
    .map((s) => ({ id: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: s.name, description: `${s.school || ""} cantrip`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStaticClassDetails(className: string, sources?: string[], ruleset?: string, locale: string = "en"): SRDClass | undefined {
  return getStaticClass(className, sources, ruleset, locale);
}

export function getStaticSpells(sources?: string[], ruleset?: string, locale: string = "en"): SRDSpell[] {
  const spellsData = pickLocaleData(spellsDataMap, locale) as any;
  const raw = Array.isArray((spellsData as any).spells) ? (spellsData as any).spells : (spellsData as any) || [];
  if (ruleSetOf(ruleset) === "2024") {
    const spells2024 = (pickLocaleData(spells2024Map, locale).spells as any[]).map(normalizeSpell) as SRDSpell[];
    if (!sources || sources.length === 0) return spells2024;
    return spells2024.filter((s) => sources.includes(s.source || "PHB"));
  }
  const spells: SRDSpell[] = raw.map(normalizeSpell);
  let filtered = applySpellLocalesOverrides(spells, locale);
  filtered = filtered.filter((s) => inRuleSet(s, ruleset));
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

// Weapons, armor and gear all come from the one item catalog (src/data/item-catalog.ts).
// These adapters keep the older SRD-shaped records the pickers read.

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function damageRef(dice: string, type: string) {
  return { damage_dice: dice, damage_type: { index: type.toLowerCase(), name: type } };
}

function toSRDWeapon(i: CatalogItem, locale: string = "en"): SRDWeapon {
  const w = i.weapon!;
  return {
    index: i.id,
    name: i.name,
    equipment_category: "Weapon",
    description: i.description,
    cost: i.cost ?? { quantity: 0, unit: "gp" },
    weight: i.weight,
    weapon_category: titleCase(w.class),
    category_range: titleCase(w.range),
    damage: w.damage ? damageRef(w.damage.dice, w.damage.type) : undefined,
    two_handed_damage: w.versatile && w.damage ? damageRef(w.versatile, w.damage.type) : undefined,
    properties: w.properties.map((name) => ({ index: name.toLowerCase().replace(/\s+/g, "-"), name, desc: weaponPropertyText(name, locale) })),
    range: w.rangeFt,
    throw_range: w.throwFt,
    special: w.special ?? "",
    source: i.source,
  };
}

function toSRDArmor(i: CatalogItem): SRDArmor {
  const a = i.armor!;
  return {
    index: i.id,
    name: i.name,
    equipment_category: "Armor",
    description: i.description,
    cost: i.cost ?? { quantity: 0, unit: "gp" },
    weight: i.weight,
    armor_category: titleCase(a.class),
    armor_class: a.dexCap === 0 ? { base: a.ac, dex_bonus: false } : a.dexCap === null ? { base: a.ac, dex_bonus: true } : { base: a.ac, dex_bonus: true, max_bonus: a.dexCap },
    str_minimum: a.strMin,
    stealth_disadvantage: a.stealthDisadvantage,
    source: i.source,
  };
}

const EQUIPMENT_CATEGORY: Record<CatalogItem["type"], string> = {
  weapon: "Weapon",
  armor: "Armor",
  shield: "Armor",
  ammo: "Adventuring Gear",
  gear: "Adventuring Gear",
  container: "Adventuring Gear",
  consumable: "Adventuring Gear",
  pack: "Adventuring Gear",
  tool: "Tools",
  mount: "Mounts and Vehicles",
  vehicle: "Mounts and Vehicles",
  coin: "Coins",
  magic: "Magic Items",
};

function toSRDEquipmentDetail(i: CatalogItem): SRDEquipmentDetail {
  const base: SRDEquipmentDetail = {
    index: i.id,
    name: i.name,
    equipment_category: i.type === "tool" && i.category === "Kits" ? "Adventuring Gear" : EQUIPMENT_CATEGORY[i.type],
    description: i.description,
    cost: i.cost ?? { quantity: 0, unit: "gp" },
    weight: i.weight,
    contents: i.contents?.map((c) => ({ item: { index: c.id, name: findLocalizedItem(c.id)?.name ?? c.id }, quantity: c.quantity })) ?? [],
    source: i.source,
  };
  if (i.weapon) {
    const w = toSRDWeapon(i);
    Object.assign(base, { weapon_category: w.weapon_category, category_range: w.category_range, damage: w.damage, two_handed_damage: w.two_handed_damage, properties: w.properties, throw_range: w.throw_range });
  }
  if (i.armor) {
    const a = toSRDArmor(i);
    Object.assign(base, { armor_category: a.armor_category, armor_class: a.armor_class, str_minimum: a.str_minimum, stealth_disadvantage: a.stealth_disadvantage });
  }
  return base;
}

function toSRDEquipment(i: CatalogItem): SRDEquipment {
  return {
    name: i.name,
    description: i.description,
    type: i.weapon ? "weapon" : i.armor ? "armor" : "item",
    category: i.weapon?.range,
    damageDice: i.weapon?.damage?.dice,
    damageType: i.weapon?.damage?.type,
    baseAC: i.armor?.ac,
    armorType: i.armor?.class,
    maxDexBonus: i.armor ? i.armor.dexCap : undefined,
    contents: i.contents
      ? i.contents.map((c) => `${c.quantity > 1 ? `${c.quantity} ` : ""}${findLocalizedItem(c.id)?.name ?? c.id}`).join(", ")
      : undefined,
  };
}

function bySources<T extends { source?: string }>(list: T[], sources?: string[]): T[] {
  if (!sources || sources.length === 0) return list;
  return list.filter((x) => sources.includes(x.source || "PHB"));
}

// The catalog is 2014 data only; a 2024 ruleset gets the same items.
export function getStaticWeapons(sources?: string[], _ruleset?: string, locale: string = "en"): SRDWeapon[] {
  return bySources(getCatalog(locale).filter((i) => i.weapon).map((i) => toSRDWeapon(i, locale)), sources);
}

export function getStaticWeapon(name: string, ruleset?: string, locale: string = "en"): SRDWeapon | undefined {
  return getStaticWeapons([], ruleset, locale).find((w) => w.name === name);
}

export function getStaticArmors(sources?: string[], _ruleset?: string, locale: string = "en"): SRDArmor[] {
  return bySources(getCatalog(locale).filter((i) => i.armor).map(toSRDArmor), sources);
}

export function getStaticArmor(name: string, ruleset?: string, locale: string = "en"): SRDArmor | undefined {
  return getStaticArmors([], ruleset, locale).find((a) => a.name === name);
}

/** Every item in the catalog except coins, magic items included. */
export function getStaticItems(sources?: string[], _ruleset?: string, locale: string = "en"): SRDItem[] {
  return bySources(
    getCatalog(locale)
      .filter((i) => i.type !== "coin")
      .map((i) => ({ index: i.id, name: i.name, equipment_category: i.magic ? i.category : EQUIPMENT_CATEGORY[i.type], description: i.description, cost: i.cost ?? { quantity: 0, unit: "gp" }, weight: i.weight, source: i.source })),
    sources,
  );
}

export function getStaticItem(name: string, ruleset?: string, locale: string = "en"): SRDItem | undefined {
  return getStaticItems([], ruleset, locale).find((i) => i.name === name);
}

/** Mundane equipment (weapons, armor, gear, tools, packs, mounts). No magic items or coins. */
export function getStaticEquipments(sources?: string[], _ruleset?: string, locale: string = "en"): SRDEquipmentDetail[] {
  return bySources(
    getCatalog(locale)
      .filter((i) => i.type !== "magic" && i.type !== "coin")
      .map(toSRDEquipmentDetail),
    sources,
  );
}

export function getStaticEquipment(name: string, ruleset?: string, locale: string = "en"): SRDEquipmentDetail | undefined {
  return getStaticEquipments([], ruleset, locale).find((e) => e.name === name);
}

export function getEquipmentData(name: string, locale: string = "en"): SRDEquipment | undefined {
  const item = findLocalizedItem(name, locale);
  return item && item.type !== "coin" ? toSRDEquipment(item) : undefined;
}

export function getEquipmentNames(sources?: string[], locale: string = "en"): string[] {
  return getStaticEquipments(sources, undefined, locale).map((e) => e.name);
}

export function getWeaponNames(sources?: string[], locale: string = "en"): string[] {
  return getStaticWeapons(sources, undefined, locale).map((w) => w.name);
}

export function getArmorNames(sources?: string[], locale: string = "en"): string[] {
  return getStaticArmors(sources, undefined, locale).map((a) => a.name);
}

export function getItemNames(sources?: string[], locale: string = "en"): string[] {
  return getStaticItems(sources, undefined, locale).map((i) => i.name);
}

export function normalizeSpell(s: any): any {
  const desc = s.description || (Array.isArray(s.desc) ? s.desc.join("\n") : (s.desc || ""));
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

function buildLocalesIndex(locale: string): Record<string, { description?: string; effectSummary?: string; fullDescription?: string; mechanics_badges?: string[]; lastUpdated?: string }> {
  const localesData = pickLocaleData(spellLocalesMap, locale) as any;
  const index: Record<string, { description?: string; effectSummary?: string; fullDescription?: string; mechanics_badges?: string[]; lastUpdated?: string }> = {};

  for (const [key, value] of Object.entries(localesData)) {
    const match = key.match(/^2014_spells\.([^.]+)\.(description|effectSummary|fullDescription|mechanics_badges|lastUpdated)$/);
    if (!match) continue;

    const spellName = match[1];
    const field = match[2] as "description" | "effectSummary" | "fullDescription" | "mechanics_badges" | "lastUpdated";

    if (!index[spellName]) {
      index[spellName] = {};
    }
    if (field === "mechanics_badges") {
      index[spellName].mechanics_badges = Array.isArray(value) ? value : [];
    } else {
      index[spellName][field] = value as string;
    }
  }

  return index;
}

const localesIndexCache = new Map<string, ReturnType<typeof buildLocalesIndex>>();

function getLocalesIndex(locale: string) {
  if (!localesIndexCache.has(locale)) {
    localesIndexCache.set(locale, buildLocalesIndex(locale));
  }
  return localesIndexCache.get(locale)!;
}

export function applySpellLocalesOverrides(spells: any[], locale: string = "en"): any[] {
  const index = getLocalesIndex(locale);

  return spells.map((spell) => {
    const name = spell.name;
    const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Locale keys are derived from the spell's index, which carries a source
    // suffix (e.g. `-egw`, `-vrgr`, `-2`) that the display name does not. Prefer
    // the index so same-named spells from different books get their own text.
    const overrides = (spell.index ? index[spell.index] : undefined) || index[normalized];
    if (!overrides) return spell;

    const next = { ...spell };

    // Most locale entries only carry fullDescription (the XGE/FXdD wave was
    // translated that way), so fall back to it instead of leaving the spell on
    // its raw English description.
    const description = overrides.description || overrides.fullDescription;
    if (description) {
      next.description = description;
    }
    if (overrides.effectSummary) {
      next.effectSummary = overrides.effectSummary;
    }
    if (overrides.fullDescription) {
      next.fullDescription = overrides.fullDescription;
    }
    if (overrides.mechanics_badges) {
      next.mechanics_badges = overrides.mechanics_badges;
    }
    if (overrides.lastUpdated) {
      next.lastUpdated = overrides.lastUpdated;
    }

    return next;
  });
}

/** The wizard spell list, read from the main spell data so the two can't drift apart. */
export function getStaticWizardSpells(sources?: string[], locale: string = "en"): SRDWizardSpell[] {
  return getStaticSpells(sources, undefined, locale).filter((s) =>
    (s.classes || []).some((c) => String(c).toLowerCase() === "wizard"),
  ) as unknown as SRDWizardSpell[];
}

export function getStaticWizardSpell(name: string, locale: string = "en"): SRDWizardSpell | undefined {
  return getStaticWizardSpells([], locale).find((s) => s.name === name);
}

export function getWizardSpellNames(sources?: string[], locale: string = "en"): string[] {
  return getStaticWizardSpells(sources, locale).map((s) => s.name);
}

/** Arcane Tricksters learn wizard spells. */
export function getStaticArcaneTricksterSpells(locale: string = "en"): SRDWizardSpell[] {
  return getStaticWizardSpells([], locale);
}

export function getClassSpells(classOrSubclassId: string, locale: string = "en"): SRDSpell[] {
  const lower = classOrSubclassId.toLowerCase().replace(/[\s-]+/g, "_");
  if (lower === "arcane_trickster") return getStaticWizardSpells([], locale) as unknown as SRDSpell[];
  return [];
}

export function getStaticFeats(sources?: string[], ruleset?: string, locale: string = "en"): SRDFeat[] {
  const featsData = pickLocaleData(featsDataMap, locale) as any;
  // 2024 feats share names with 2014 ones (Alert, Grappler) but not their options.
  if (ruleSetOf(ruleset) === "2024") {
    return (pickLocaleData(feats2024Map, locale).feats as SRDFeat[]).map((feat) => {
      const options = getFeatOptionGroups(feat.name, "2024");
      return options.length > 0 ? { ...feat, options } : feat;
    });
  }
  const feats = featsData.feats as SRDFeat[];
  let filtered = feats;
  filtered = filtered.filter((f) => inRuleSet(f, ruleset));
  if (!sources || sources.length === 0) {
    return dedupeFeats(filtered, new Set<string>());
  }
  const sourceFiltered = filtered.filter((f) => sources.includes(f.book || (typeof (f as any).source === "string" ? (f as any).source : (f as any).source?.name) || "PHB"));
  const seen = new Set<string>();
  return dedupeFeats(sourceFiltered, seen);
}

function dedupeFeats(feats: SRDFeat[], seen: Set<string>): SRDFeat[] {
  const out: SRDFeat[] = [];
  for (const feat of feats) {
    if (seen.has(feat.name)) continue;
    seen.add(feat.name);
    out.push(attachFeatOptions(feat));
  }
  return out;
}

function attachFeatOptions(feat: SRDFeat): SRDFeat {
  const options = getFeatOptionGroups(feat.name);
  return options.length > 0 ? { ...feat, options } : feat;
}

export function getStaticFeat(name: string, ruleset?: string, locale: string = "en"): SRDFeat | undefined {
  return getStaticFeats([], ruleset, locale).find((f) => f.name === name);
}

 export function clearSRDCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function getAvailableSources(locale: string = "en"): string[] {
  const subclassesData = pickLocaleData(subclassesDataMap, locale) as any;
  const racesData = pickLocaleData(racesDataMap, locale) as any;
  const spellsData = pickLocaleData(spellsDataMap, locale) as any;
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
  console.log("[getSubclassFlags] input:", subclassIndex, "data keys:", Object.keys((subclassSpellsData as any).subclassFlags || {}));
  return (subclassSpellsData as any).subclassFlags[subclassIndex] || {};
}

export function getPactBoons(): { index: string; name: string; description: string }[] {
  return (subclassSpellsData as any).pactBoons || [];
}

export function getWizardSpellsByLevel(level: number, sources?: string[], locale: string = "en"): string[] {
  const allSpells = getStaticWizardSpells(sources, locale);
  return allSpells
    .filter((s: any) => s.level === level)
    .map((s: any) => s.name)
    .sort();
}

