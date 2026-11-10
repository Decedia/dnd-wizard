"use client";

import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { WizardNav, WIZARD_NAV_SPACE } from "./WizardNav";
import { getStaticClass, getStaticSubclasses, getStaticSpells, getStaticSubclassDetails, getSubclassFlags, getPactBoons, getStaticFeat, getStaticEquipments, getStaticRace } from "@/lib/srd-client";
import { SourceBadge } from "./SourceBadge";
import { getHitDieAverage, getModifier, computeDerivedStats, getMaxBardicInspirationUses, getBardicInspirationDie, hasFontOfInspiration, getDomainSpellNames, getCircleTerrainTypes, getCircleSpells, getOathSpellNames, getWizardTraditionSpellNames, getMaxSpellLevel, isThirdCaster, getSpellSlotTable, getFeatureValue, getWarlockExpandedSpellNames, getHpBonusPerLevel, castsSpells, getMaxPreparedSpells, isPreparationCaster, type Character } from "@/lib/storage";
import { fillPrepared, preparableSpells } from "@/lib/prepared-spells";
import { PrepareSpellsSheet } from "@/components/PrepareSpellsSheet";
import { applySubclassFeatures, applySubclassSpellGrants, syncBaseFeatures } from "@/lib/character-creation";
import { normalizeDescription } from "@/lib/level-up";
import invocationsData from "@/data/warlock_invocations.json";
import { SpellSelectionModal } from "./modals/SpellSelectionModal";
import { applyFeatGrants, encodeFeatOptions } from "@/lib/feat-grants";
import { REPEATABLE_FEATS } from "@/lib/feature-groups";
import { getOptionalClassFeatures, getOptionalChoiceOptions, isReplacedFeature, usesOptionalClassFeatures } from "@/data/optional-class-features";
import { FeatSelectionModal } from "./modals/FeatSelectionModal";
import { getTakenSpellNames } from "@/lib/taken-spells";
import { SubclassDetailsModal } from "./modals/SubclassDetailsModal";
import { SubclassSelectionModal } from "./modals/SubclassSelectionModal";
import { FeatureSelectionModal } from "./modals/FeatureSelectionModal";
import { FeatureChipSelector } from "./FeatureChipSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations as enTranslations } from "@/locales/en";
import { translations as idTranslations } from "@/locales/id";
import { HumanoidRacesModal } from "./modals/HumanoidRacesModal";
import { TerrainModal } from "./modals/TerrainModal";
import { BonusCantripModal } from "./modals/BonusCantripModal";
import { SpellMasteryModal } from "./modals/SpellMasteryModal";
import { SignatureSpellsModal } from "./modals/SignatureSpellsModal";
import {
  HeartBottleIcon as Heart,
  LightningIcon as Lightning,
  ChartBarIcon as ChartBar,
  SparklesIcon as Sparkle,
  MagicWandIcon as MagicWand,
  CrownIcon as Crown,
  SwordIcon as Sword,
  BookIcon as Book,
  StarIcon as Star,
  CheckIcon as Check,
  MinusIcon as Minus,
  PlusIcon as Plus,
  InfoIcon as Info,
  XIcon as X,
  CaretDownIcon as CaretDown,
  BellIcon as Bell,
  LeafIcon as Leaf,
  SwapIcon as Swap,
  MagnifyingGlassIcon as MagnifyingGlass,
  TargetIcon as Target,
  XIcon as XIcon,
} from "@/components/icons";
import { InfoIcon } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
import { useSRD } from "@/contexts/SRDContext";
import { RichText, RichInline } from "@/components/RichText";
import { toPlainText } from "@/lib/rich-text";
import { isRecommended } from "@/lib/recommendations";
import { GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { getStaticFeats } from "@/lib/srd-client";
import { getFeatOptionGroups } from "@/data/feat-options";
import { SUBCLASS_PICKS, FIGHTING_STYLE_PICKS, METAMAGIC_PICKS, MANEUVER_PICKS, INVOCATION_PICKS, asiPicks, expertisePicks, spellPicks, topPicks, type Pick as SuggestedPick, type Why } from "@/lib/level-up-picks";
import { PickCards, type PickCard } from "./level-up/PickCards";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getSubclassFlagsByName(className: string, subclassName: string, sources: string[] | undefined, language: string): Record<string, boolean> {
  if (!subclassName) return {};
  const subclasses = getStaticSubclasses(className, sources, undefined, language);
  const found = subclasses.find(s => s.name.toLowerCase() === subclassName.toLowerCase());
  if (!found?.index) return {};
  return getSubclassFlags(found.index);
}

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

interface InvocationPrerequisite {
  level: number;
  requires?: string;
  source?: string;
}

const invocationPrereqs: Record<string, InvocationPrerequisite> = (invocationsData as any).invocations || {};

function getAvailableInvocations(level: number, pactBoon: string, knownInvocations: string[], knowsEldritchBlast: boolean, sources: string[] | undefined, usesTasha: boolean): { name: string; available: boolean; reason?: string }[] {
  // Xanathar's invocations need that book; Tasha's ones are optional class features.
  const allInvocations = Object.keys(invocationPrereqs).filter((name) => {
    const src = invocationPrereqs[name]?.source;
    if (!src) return true;
    if (src === "TCE") return usesTasha;
    return !sources || sources.length === 0 || sources.includes(src);
  });
  return allInvocations.map((name) => {
    const prereq = invocationPrereqs[name];
    if (!prereq) return { name, available: true };
    if (level < prereq.level) return { name, available: false, reason: `Requires level ${prereq.level}` };
    if (prereq.requires) {
      const req = prereq.requires.toLowerCase();
      if (req.includes("pact of the blade") && pactBoon !== "Pact of the Blade") return { name, available: false, reason: "Requires Pact of the Blade" };
      if (req.includes("pact of the chain") && pactBoon !== "Pact of the Chain") return { name, available: false, reason: "Requires Pact of the Chain" };
      if (req.includes("pact of the tome") && pactBoon !== "Pact of the Tome") return { name, available: false, reason: "Requires Pact of the Tome" };
      if (req.includes("pact of the talisman") && pactBoon !== "Pact of the Talisman") return { name, available: false, reason: "Requires Pact of the Talisman" };
      if (req.includes("eldritch blast") && !knowsEldritchBlast) return { name, available: false, reason: "Requires the Eldritch Blast cantrip" };
    }
    return { name, available: true };
  });
}

const TOOL_EMOJI_MAP: Record<string, string> = {
  "Alchemist's Supplies": "⚗️",
  "Brewer's Supplies": "🍺",
  "Calligrapher's Supplies": "✒️",
  "Carpenter's Tools": "🪚",
  "Cartographer's Tools": "🗺️",
  "Cobbler's Tools": "👞",
  "Cook's utensils": "🍳",
  "Dice Set": "🎲",
  "Drum": "🥁",
  "Dulcimer": "🎵",
  "Flute": "🎵",
  "Glassblower's Tools": "🫧",
  "Horn": "📯",
  "Jeweler's Tools": "💎",
  "Leatherworker's Tools": "🧵",
  "Lute": "🎵",
  "Lyre": "🎵",
  "Mason's Tools": "🧱",
  "Navigator's Tools": "🧭",
  "Painter's Supplies": "🎨",
  "Pan flute": "🎵",
  "Playing Card Set": "🃏",
  "Potter's Tools": "🏺",
  "Shawm": "🎵",
  "Smith's Tools": "⚒️",
  "Thieves' Tools": "🔓",
  "Tinker's Tools": "🔧",
  "Viol": "🎵",
  "Weaver's Tools": "🪡",
  "Woodcarver's Tools": "🪵",
};

function toolEmoji(name: string): string {
  return TOOL_EMOJI_MAP[name] || "🔧";
}

interface LevelUpWizardProps {
  character: Character;
  onCancel: () => void;
  onComplete: (character: Character) => void;
  minLevel?: number;
  maxLevel?: number;
  title?: string;
  subtitle?: string;
  startFromLevelOne?: boolean;
}

interface LevelInfo {
  level: number;
  hp: { hitDie: number; conMod: number; average: number };
  proficiencyBonus: number;
  features: { name: string; description: string; summary?: string; source?: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
  cantripsKnown?: number;
  spellsKnown?: number;
  classFeatures: { name: string; value: string }[];
  subclassOptions?: { name: string; description: string; hasDetails: boolean }[];
  subclassFeatureChoices?: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[];
  classFeatureChoices?: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[];
  hasSpellSelection: boolean;
  spellSelectionType: "known" | "book" | "prepare";
  spellSelectionCount: number;
  cantripSelectionCount: number;
  maxSpellLevel: number;
  spellsKnownChanged?: boolean;
  prevSpellsKnown?: number;
  magicalSecretsCount: number;
  canReplaceSpell: boolean;
  subclassSpellSelectionCount: number;
  circleTerrainSelection: boolean;
  bonusCantripSelection: boolean;
  spellbookTotal?: number;
  maxPrepared?: number;
  preparedCount?: number;
  expertise?: { count: number; selected: string[]; availableOptions: string[] };
}

type ChoiceOption = { name: string; description: string; icon?: string };

// Tasha's fighting styles each class may add when the table uses optional class features.
// Blessed Warrior and Druidic Warrior are left out: they teach cantrips the wizard can't grant yet.
const TCE_FIGHTING_STYLES: Record<string, string[]> = {
  Fighter: ["Blind Fighting", "Interception", "Superior Technique", "Thrown Weapon Fighting", "Unarmed Fighting"],
  Paladin: ["Blind Fighting", "Interception"],
  Ranger: ["Blind Fighting", "Thrown Weapon Fighting"],
};

function fightingStyleOptions(className: string, options: ChoiceOption[], usesTasha: boolean, language: string): ChoiceOption[] {
  const allTasha = new Set(Object.values(TCE_FIGHTING_STYLES).flat());
  const base = options.filter((o) => !allTasha.has(o.name));
  if (!usesTasha) return base;
  const fighterStyles = getStaticClass("Fighter", undefined, undefined, language)?.levels[0]?.features.find((f: any) => f.name === "Fighting Style") as any;
  const tasha = (TCE_FIGHTING_STYLES[className] || []).map((name) => {
    const opt = (fighterStyles?.choices?.options || []).find((o: any) => (typeof o === "string" ? o : o.name) === name);
    return opt && typeof opt !== "string" ? { name, description: opt.description || "", icon: opt.icon } : { name, description: "" };
  });
  return [...base, ...tasha].sort((a, b) => a.name.localeCompare(b.name));
}

// Expertise doubles a proficiency you already have: skills you are proficient in, or a rogue's thieves' tools.
function expertiseOptions(className: string, options: ChoiceOption[], character: Character): ChoiceOption[] {
  const skills = character.skills || {};
  const has = new Set(character.expertise || []);
  const proficient = Object.keys(skills).filter((name) => skills[name] && !has.has(name));
  const names = className === "Rogue" && !has.has("Thieves' Tools") ? [...proficient, "Thieves' Tools"] : proficient;
  // Skills may not be picked yet when the level step comes first; offer the full list then.
  if (proficient.length === 0) return options;
  return names.sort().map((name) => options.find((o) => o.name === name) || { name, description: "" });
}

// Mystic Arcanum: any warlock spell of that level from the character's books, plus the patron's expanded spells.
function mysticArcanumOptions(featureName: string, options: ChoiceOption[], character: Character, subclass: string, language: string): ChoiceOption[] {
  const spellLevel = Number(featureName.match(/\((\d)/)?.[1]);
  if (!spellLevel) return options;
  const all = getStaticSpells(character.sources, character.ruleset, language);
  const expanded = new Set(getWarlockExpandedSpellNames(character, subclass));
  const names = new Set(
    all.filter((sp) => sp.level === spellLevel && ((sp.classes || []).includes("Warlock") || expanded.has(sp.name))).map((sp) => sp.name)
  );
  for (const o of options) names.add(o.name);
  return [...names].sort().map((name) => options.find((o) => o.name === name) || { name, description: all.find((sp) => sp.name === name)?.school || "" });
}

function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

export function buildLevelInfos(
  character: Character,
  targetLevel: number,
  classData: ReturnType<typeof getStaticClass>,
  subclassSelection: string,
  startLevel: number,
  showLevelOne: boolean,
  language: string
): LevelInfo[] {
  if (!classData) return [];

  const infos: LevelInfo[] = [];
  const hitDie = classData.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const className = classData.name;

  const loopStart = showLevelOne ? 1 : startLevel + 1;

  for (let level = loopStart; level <= targetLevel; level++) {
    const levelData = classData.levels[level - 1];
    const prevLevelData = level > 1 ? classData.levels[level - 2] : null;

    // Tasha's optional features the table turned on, up to this level.
    const optional = getOptionalClassFeatures({ ...character, level });
    const optionalHere = optional.filter((f) => f.level === level);

    const features = (levelData?.features || [])
      .filter((f: any) => !isReplacedFeature(f.name, optional))
      .filter((f: any) => {
        const src = f.source;
        if (!src) return true;
        if (src.type === "class") return src.name === className;
        if (src.type === "subclass") return src.name === subclassSelection;
        if (f.choices) return false;
        return true;
      })
      .map((f: any) => ({
        name: f.name,
        description: normalizeDescription(f.description),
        summary: (typeof f.summary === "string" ? f.summary : undefined) as string | undefined,
      }))
      .concat(optionalHere.filter((f) => !f.hidden).map((f) => ({
        name: f.name,
        description: f.text[language as "en" | "id"] || f.text.en,
        summary: undefined,
      })));

    const asi = levelData?.asi || false;
    let spellSlots = levelData?.spellSlots;

    // Eldritch Knight and Arcane Trickster use their own spell slot progression
    const isThirdCasterSubclass = isThirdCaster(subclassSelection);
    if (!spellSlots && isThirdCasterSubclass) {
      spellSlots = getSpellSlotTable(classData, level, subclassSelection);
    }

    // Fighters and rogues only cast with a third-caster subclass.
    const rogueWithoutArcaneTrickster = (className === "Rogue" || className === "Fighter") && !isThirdCasterSubclass;

    let cantripsKnown: number | undefined;
    if (classData.cantripsKnown && !rogueWithoutArcaneTrickster) {
      if (Array.isArray(classData.cantripsKnown)) {
        const idx = Math.min(level - 1, classData.cantripsKnown.length - 1);
        cantripsKnown = classData.cantripsKnown[idx >= 0 ? idx : 0];
      } else {
        const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
        for (const l of levels) {
          if (level >= l) cantripsKnown = (classData.cantripsKnown as Record<number, number>)[l];
        }
      }
    }

    let spellsKnown: number | undefined;
    if ((classData as any)?.spellsKnown && !rogueWithoutArcaneTrickster) {
      const known = (classData as any).spellsKnown;
      if (known[String(level)] !== undefined) {
        spellsKnown = known[String(level)];
      }
    }

    const spellsKnownByLevel: Record<string, Record<number, number>> = {
      Sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
      Bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22 },
      Warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 },
      Ranger: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
    };
    if (spellsKnown === undefined && spellsKnownByLevel[className] && spellsKnownByLevel[className][level]) {
      spellsKnown = spellsKnownByLevel[className][level];
    }

    const classFeatures: { name: string; value: string }[] = [];

    if (className === "Bard") {
      classFeatures.push({ name: "Bardic Inspiration", value: `${getBardicInspirationDie({ ...character, level } as Character)}` });
    }

    const featureNames = [
      "Rage Uses", "Rage Damage", "Channel Divinity", "Wild Shape",
      "Action Surge", "Indomitable", "Ki Points", "Martial Arts",
      "Sneak Attack", "Sorcery Points", "Invocations", "Spellbook",
      "Lay on Hands", "Bardic Inspiration Uses", "Song of Rest",
      "Movement",
    ];

    for (const name of featureNames) {
      const value = getFeatureValue(name, { ...character, level } as Character);
      if (value) {
        classFeatures.push({ name, value });
      }
    }

    const unlockLevel = classData.subclassLevel ?? 3;
    const subclasses = getStaticSubclasses(className, character.sources, undefined, language);
    const subclassOptions = level === unlockLevel && !character.subclass && subclasses.length > 0
      ? subclasses.map((s) => ({ name: s.name, description: s.description, hasDetails: true })).sort((a, b) => (isRecommended("subclass", b.name, className) ? 1 : 0) - (isRecommended("subclass", a.name, className) ? 1 : 0))
      : undefined;

    const subclassFeatureChoices: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[] = [];
    const usesTasha = usesOptionalClassFeatures(character);
    const passiveSubclassFeatures: { name: string; description: string; source?: string }[] = [];
    // A language pick (Blessings of Knowledge, Draconic Gift) skips languages the
    // character already speaks from race, background or another pick.
    const knownLanguages = new Set([
      ...(character.languages || []),
      ...(getStaticRace(character.race, character.ruleset)?.languages || []),
    ]);
    if (subclassSelection && level >= unlockLevel) {
      const selectedSubclass = subclasses.find((s) => s.name === subclassSelection);
      if (selectedSubclass) {
        const subclassSource = selectedSubclass.source;
        const earnedFeatures = selectedSubclass.features.filter(
          (f) => f.level != null && f.level === level
        );
        for (const f of earnedFeatures) {
          const desc = Array.isArray(f.description) ? f.description.join(" ") : (f.description || "");
          if (f.choices && f.choices.length > 0) {
            // When the same feature comes back at a later level (Disciple of the
            // Elements, Combat Superiority), the options picked before are gone.
            // Later picks of one feature ("Path of the Kensei: 6th-level Weapon")
            // also skip what the feature itself picked.
            const base = f.name.split(":")[0];
            const pickedBefore = new Set(
              Object.entries(character.featureSelections || {})
                .filter(([key]) => {
                  const m = key.match(/^subclass-feature-\d+-(.*)$/);
                  return !!m && m[1].split(":")[0] === base && key !== `subclass-feature-${level}-${f.name}`;
                })
                .flatMap(([, v]) => (v || []).flatMap((s) => String(s).split(", ")))
            );
            subclassFeatureChoices.push({
              name: f.name,
              description: desc,
              options: f.choices!
                .filter((c: any) => (!c.minLevel || c.minLevel <= level) && !pickedBefore.has(c.name) && !knownLanguages.has(c.name) && (!c.optional || usesTasha))
                .map((c: any) => ({ name: c.name, description: c.description || "", icon: c.icon })),
              count: (f as any).choicesCountByLevel?.[String(level)] ?? f.choicesCount ?? 1,
            });
          } else if (!isReplacedFeature(f.name, optional)) {
            passiveSubclassFeatures.push({ name: f.name, description: desc, source: subclassSource });
          }
        }
      }
    }

    // Class feature choices (e.g., Primal Knowledge for Barbarian)
    const classFeatureChoices: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[] = [];
    const levelFeatures = classData.levels[level - 1]?.features || [];
    for (const feature of levelFeatures) {
      const f = feature as any;
      if (isReplacedFeature(f.name, optional)) continue;
      // Magical Secrets has its own picker below.
      if (f.name === "Magical Secrets") continue;
      if (f.choices && f.choices.type === "tools") {
        const tools = getStaticEquipments([], character.ruleset).filter((e: any) => e.equipment_category === "Tools");
        classFeatureChoices.push({
          name: f.name,
          description: f.description || "",
          options: tools.map((t: any) => ({
            name: t.name,
            description: t.description || "",
            icon: toolEmoji(t.name),
          })),
          count: f.choices.count || 1,
        });
      } else if (f.choices && f.choices.options && f.choices.options.length > 0) {
        let options = f.choices.options.map((opt: any) => ({
          name: typeof opt === "string" ? opt : opt.name,
          description: typeof opt === "string" ? "" : (opt.description || ""),
          icon: typeof opt === "string" ? undefined : opt.icon,
        }));
        if (f.name === "Fighting Style") options = fightingStyleOptions(className, options, usesOptionalClassFeatures(character), language);
        if (f.name === "Expertise") options = expertiseOptions(className, options, character);
        if (f.name.startsWith("Mystic Arcanum")) options = mysticArcanumOptions(f.name, options, { ...character, level }, subclassSelection, language);
        // Metamagic and other repeat picks skip what earlier level-ups saved.
        const pickedBefore = new Set(
          Object.entries(character.featureSelections || {})
            .filter(([key]) => key !== `class-feature-${level}-${f.name}` && key.match(/^class-feature-\d+-(.*)$/)?.[1] === f.name)
            .flatMap(([, v]) => (v || []).flatMap((x) => String(x).split(", ")))
        );
        if (pickedBefore.size) options = options.filter((o: ChoiceOption) => !pickedBefore.has(o.name));
        classFeatureChoices.push({
          name: f.name,
          description: f.description || "",
          options,
          count: f.choices.count || 1,
        });
      }
    }

    for (const f of optionalHere) {
      if (!f.choice) continue;
      classFeatureChoices.push({
        name: f.name,
        description: f.text[language as "en" | "id"] || f.text.en,
        options: getOptionalChoiceOptions(f, character).map((name) => ({ name, description: "" })),
        count: f.choice.count,
      });
    }

    const prevSlots = prevLevelData?.spellSlots || {};
    const slotsChanged = spellSlots && (Object.keys(spellSlots).length !== Object.keys(prevSlots).length ||
      Object.entries(spellSlots).some(([k, v]) => prevSlots[Number(k)] !== v));

    let prevCantrips = 0;
    if (prevLevelData && classData.cantripsKnown) {
      if (Array.isArray(classData.cantripsKnown)) {
        const prevIdx = Math.min(level - 2, classData.cantripsKnown.length - 1);
        prevCantrips = classData.cantripsKnown[prevIdx >= 0 ? prevIdx : 0] || 0;
      } else {
        const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
        for (const l of levels) {
          if (level - 1 >= l) prevCantrips = (classData.cantripsKnown as Record<number, number>)[l] || 0;
        }
      }
    }
    const cantripsDelta = cantripsKnown !== undefined ? cantripsKnown - prevCantrips : 0;
    const cantripsChanged = cantripsDelta > 0;

    // Calculate spells known change
    const prevSpellsKnownRaw = prevLevelData ? ((classData as any)?.spellsKnown?.[String(level - 1)] || 0) : 0;
    const prevSpellsKnownFromTable = (spellsKnownByLevel[className] && spellsKnownByLevel[className][level - 1]) || 0;
    const prevSpellsKnown = prevSpellsKnownRaw || prevSpellsKnownFromTable;
    const spellsKnownChanged = spellsKnown !== undefined && spellsKnown > prevSpellsKnown;

    const isArcaneTrickster = isThirdCasterSubclass;
    const maxSpellLevel = spellSlots
      ? Math.max(...Object.keys(spellSlots).map(Number))
      : getMaxSpellLevel(className, level, character.ruleset);

    // Spell selection count is based on class-specific rules, NEVER on slot counts
    const isSpellsKnownCaster = ["Sorcerer", "Bard", "Warlock", "Ranger"].includes(className);
    const isPrepCaster = ["Cleric", "Druid", "Artificer", "Paladin"].includes(className);
    let spellSelectionCount = isSpellsKnownCaster
      ? (spellsKnownChanged ? (spellsKnown || 0) - prevSpellsKnown : 0)
      : (className === "Wizard" ? 2 : 0);

    // Wizard uses spellbookSpells for starting spell count: 6 at level 1, +2 per additional level
    if (className === "Wizard" && (classData as any)?.spellbookSpells) {
      const sb = (classData as any).spellbookSpells as Record<string, number>;
      const currentTotal = sb[String(level)] || 0;
      const prevTotal = level > 1 ? (sb[String(level - 1)] || 0) : 0;
      spellSelectionCount = currentTotal - prevTotal;
    }

    // Arcane Trickster: spells known progression (like Wizard but half-caster)
    if (isArcaneTrickster && (classData as any)?.spellsKnown) {
      const known = (classData as any).spellsKnown as Record<string, number>;
      const currentTotal = known[String(level)] || 0;
      const prevTotal = level > 1 ? (known[String(level - 1)] || 0) : 0;
      spellSelectionCount = currentTotal - prevTotal;
    }

    // Preparation casters (Cleric, Druid): prepare Wisdom mod + level spells
    // A paladin has no spells before 2nd level, so nothing to prepare.
    if (isPrepCaster && classData.spellcastingAbility && spellSlots && Object.keys(spellSlots).length > 0) {
      const abilityScore = character[classData.spellcastingAbility as keyof Character] as number;
      const abilityMod = getModifier(abilityScore || 10);
      if (className === "Artificer" || className === "Paladin") {
        // Artificer and Paladin: ability modifier + half class level, rounded down (minimum 1)
        const maxPrepared = Math.max(1, abilityMod + Math.floor(level / 2));
        spellSelectionCount = maxPrepared;
      } else {
        const maxPrepared = Math.max(1, abilityMod + level);
        spellSelectionCount = maxPrepared;
      }
    }

    const isBard = className === "Bard";
    const isSorcerer = className === "Sorcerer";
    const magicalSecretsLevels = [10, 14, 18];
    const magicalSecretsCount = isBard && magicalSecretsLevels.includes(level) ? 2 : 0;
    // Magical Secrets spells are part of the Spells Known column, not extra.
    if (magicalSecretsCount > 0) spellSelectionCount = Math.max(0, spellSelectionCount - magicalSecretsCount);
    // Classes that learn a fixed list of spells may swap one of them each level.
    const swapsSpells = isBard || isSorcerer || className === "Warlock" || className === "Ranger" || isThirdCasterSubclass;
    const canReplaceSpell = swapsSpells && level > 1 && (character.spells || []).some((s) => s.level > 0);
    const subclassFlags = getSubclassFlagsByName(className, subclassSelection || "", character.sources, language);
    const isLoreBard = isBard && subclassFlags.grantsMagicalSecrets;
    const subclassSpellSelectionCount = isLoreBard && level === 6 ? 2 : 0;

    const hasSpellSelectionFromClass = !!(classData.spellcastingAbility && (slotsChanged || cantripsChanged || spellsKnownChanged));
    const hasSpellSelection = hasSpellSelectionFromClass || (isArcaneTrickster && (slotsChanged || cantripsChanged || spellsKnownChanged)) || spellSelectionCount > 0 || cantripsDelta > 0;

    const spellSelectionType: "known" | "book" | "prepare" = isPrepCaster ? "prepare" : (className === "Wizard" ? "book" : "known");

    const spellbookTotal = (className === "Wizard" && (classData as any)?.spellbookSpells)
      ? ((classData as any).spellbookSpells as Record<string, number>)[String(level)] || 0
      : undefined;
    const prepAbilityScore = character[classData.spellcastingAbility as keyof Character] as number;
    const prepAbilityMod = getModifier(prepAbilityScore || 10);
    const maxPrepared = isPrepCaster && classData.spellcastingAbility
      ? Math.max(1, className === "Artificer" || className === "Paladin" ? prepAbilityMod + Math.floor(level / 2) : prepAbilityMod + level)
      : undefined;
    const preparedCount = isPrepCaster && maxPrepared ? maxPrepared : undefined;

    // Rogue Expertise
    let expertise: LevelInfo["expertise"];
    if (className === "Rogue") {
      const expertiseScaling = (classData as any).scalingFeatures?.find((f: any) => f.type === "feature" && f.name === "Expertise");
      if (expertiseScaling?.values) {
        const sortedLevels = Object.keys(expertiseScaling.values).map(Number).sort((a, b) => a - b);
        const currentIndex = sortedLevels.indexOf(level);
        if (currentIndex >= 0) {
          const currentValue = expertiseScaling.values[level];
          const prevValue = currentIndex > 0 ? (expertiseScaling.values[sortedLevels[currentIndex - 1]] || 0) : 0;
          if (currentValue > prevValue) {
            const newCount = currentValue - prevValue;
            const proficientSkills = Object.entries(character.skills)
              .filter(([, proficient]) => proficient)
              .map(([name]) => name);
            const hasThievesTools = character.class === "Rogue";
            const allOptions = [...proficientSkills];
            if (hasThievesTools && !allOptions.includes("Thieves' Tools")) {
              allOptions.push("Thieves' Tools");
            }
            const currentExpertise = character.expertise || [];
            const availableOptions = allOptions.filter(opt => !currentExpertise.includes(opt));
            expertise = {
              count: newCount,
              selected: [],
              availableOptions,
            };
          }
        }
      }
    }

    // A subclass feature with the same name as a class feature (Oath Spells) replaces it here.
    const subclassNames = new Set(passiveSubclassFeatures.map((f) => f.name));
    const allFeatures = [...features.filter((f) => !subclassNames.has(f.name)), ...passiveSubclassFeatures];

    infos.push({
      level,
      hp: { hitDie, conMod, average: averageHp },
      proficiencyBonus: getProficiencyBonus(level),
      features: allFeatures,
      asi,
      spellSlots,
      cantripsKnown: cantripsKnown,
      spellsKnown: spellsKnown,
      classFeatures,
      subclassOptions,
      subclassFeatureChoices: subclassFeatureChoices.length > 0 ? subclassFeatureChoices : undefined,
      classFeatureChoices: classFeatureChoices.length > 0 ? classFeatureChoices : undefined,
      hasSpellSelection: hasSpellSelection,
      spellSelectionType: spellSelectionType,
      spellSelectionCount: spellSelectionCount,
      cantripSelectionCount: cantripsDelta,
      maxSpellLevel,
      spellsKnownChanged,
      prevSpellsKnown,
      magicalSecretsCount,
      canReplaceSpell,
      subclassSpellSelectionCount,
      // The land is chosen once (at 3rd level); ask only if it is still missing.
      circleTerrainSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && !character.circleTerrain &&
        level === [3, 5, 7, 9].find((l) => l >= loopStart),
      bonusCantripSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && level === 2,
      spellbookTotal: spellbookTotal,
      maxPrepared: maxPrepared,
      preparedCount: preparedCount,
      expertise,
    });
  }

  return infos;
}

/** One screen of the game-style level-up: the free gains, one kind of choice, or the recap. */
export type LevelPart = "moment" | "subclass" | "asi" | "features" | "spells";

/** The choice screens a level needs, in the order the wizard shows them. */
export function levelParts(info: LevelInfo, subclassSelection: string, className: string): LevelPart[] {
  const parts: LevelPart[] = [];
  if (info.subclassOptions && info.subclassOptions.length > 0) parts.push("subclass");
  if (info.asi) parts.push("asi");
  const features =
    (!!info.subclassFeatureChoices?.length && !!subclassSelection) ||
    !!info.classFeatureChoices?.length ||
    (!!info.expertise && info.expertise.count > 0) ||
    (className === "Wizard" && info.level === 18) ||
    (className === "Warlock" && info.level === 3) ||
    info.circleTerrainSelection;
  if (features) parts.push("features");
  if (info.hasSpellSelection || info.magicalSecretsCount > 0 || info.subclassSpellSelectionCount > 0 || info.canReplaceSpell || info.bonusCantripSelection) parts.push("spells");
  return parts;
}

/** Which screen an unfinished task (by its section id) belongs to. */
export function partOfSection(sectionId: string): LevelPart {
  if (sectionId.startsWith("hp-")) return "moment";
  if (sectionId.startsWith("asi-")) return "asi";
  if (sectionId.startsWith("subclass-fc-") || sectionId.startsWith("class-fc-") || sectionId.startsWith("expertise-")) return "features";
  if (sectionId.startsWith("subclass-")) return "subclass";
  return "spells";
}

export function LevelUpWizard({ character, onCancel, onComplete, minLevel, maxLevel, title, subtitle, startFromLevelOne }: LevelUpWizardProps) {
  const { language, tDesc } = useLanguage();
  const dict = language === "id" ? idTranslations : enTranslations;
  const t = useCallback((key: string, fb?: string, params?: Record<string, string | number>) => {
    let text = (dict as Record<string, string>)[key] || fb || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return text;
  }, [dict]);
  const [infoState, setInfoState] = useState<{title: string; description: string; descKey?: string} | null>(null);
  const classData = character.class ? getStaticClass(character.class, character.sources, character.ruleset, language) : undefined;
  const currentLevel = startFromLevelOne ? 1 : (character.level || 1);
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const diceType = `d${hitDie}` as any;

  const effectiveMinLevel = minLevel ?? currentLevel + 1;
  const effectiveMaxLevel = maxLevel ?? 20;

  const [targetLevel, setTargetLevel] = useState(Math.min(effectiveMaxLevel, Math.max(effectiveMinLevel, currentLevel + 1)));
  // New levels start at the average roll, so a new player never has to type HP.
  const [hpValues, setHpValues] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) init[lvl] = averageHp;
    return init;
  });
  const [asiSelections, setAsiSelections] = useState<Record<number, { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }>>({});
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [subclassIndex, setSubclassIndex] = useState<string>(character.subclassIndex || "");

  const handleSubclassSelect = useCallback((name: string) => {
    setSubclassSelection(name);
    const normalized = name.toLowerCase().replace(/\s+/g, "-");
    setSubclassIndex(normalized);
  }, []);


  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [classFeatureChoices, setClassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});
  // The Wizard's prepared list as edited on the recap; null keeps the suggested set.
  const [preparedOverride, setPreparedOverride] = useState<string[] | null>(null);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [magicalSecretsSelections, setMagicalSecretsSelections] = useState<Record<number, string[]>>({});
  const [subclassSpellSelections, setSubclassSpellSelections] = useState<Record<number, string[]>>({});
  const [circleTerrainSelections, setCircleTerrainSelections] = useState<Record<number, string>>({});
  const [bonusCantripSelections, setBonusCantripSelections] = useState<Record<number, string>>({});
  const [replacedSpells, setReplacedSpells] = useState<Record<number, string>>({});
  const [invocationSelections, setInvocationSelections] = useState<Record<number, string[]>>({});
  const [replacedInvocations, setReplacedInvocations] = useState<Record<number, string>>({});
  const [pactTomeCantrips, setPactTomeCantrips] = useState<string[]>([]);
  const [expertiseSelections, setExpertiseSelections] = useState<Record<number, string[]>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const prevTargetLevelRef = useRef(targetLevel);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getAutoGrantedSpells = useCallback((subclassName: string, level: number): string[] => {
    if (!subclassName) return [];
    const key = subclassName.toLowerCase().replace(/\s+/g, "-");
    const AUTO_GRANTED_SPELLS: Record<string, Record<number, string[]>> = {
      "arcane-trickster": { 3: ["Mage Hand:0"] },
      "totem-warrior": { 3: ["Beast Sense:2", "Speak with Animals:2"] },
      "shadow": { 3: ["Minor Illusion:0"] },
      "the-celestial": { 1: ["Sacred Flame:0", "Light:0"] },
      "grave": { 1: ["Spare the Dying:0"] },
    };
    return AUTO_GRANTED_SPELLS[key]?.[level] || [];
  }, []);

  useEffect(() => {
    if (!subclassSelection) return;
    const autoSpells: Record<number, string[]> = {};
    for (let lvl = currentLevel; lvl <= targetLevel; lvl++) {
      const granted = getAutoGrantedSpells(subclassSelection, lvl);
      if (granted.length > 0) {
        autoSpells[lvl] = granted;
      }
    }
    const entries = Object.entries(autoSpells);
    if (entries.length === 0) return;
    requestAnimationFrame(() => {
      setSpellSelections((prev) => {
        const next = { ...prev };
        for (const [lvl, spells] of entries) {
          const level = Number(lvl);
          const existing = next[level] || [];
          const newSpells = spells.filter((s) => !existing.includes(s));
          if (newSpells.length > 0) {
            next[level] = [...existing, ...newSpells];
          }
        }
        return next;
      });
    });
  }, [subclassSelection, currentLevel, getAutoGrantedSpells, targetLevel]);

  useEffect(() => {
    if (targetLevel > prevTargetLevelRef.current) {
      const newLevels = targetLevel - prevTargetLevelRef.current;
      setToastMessage(`Level ${prevTargetLevelRef.current + 1}${newLevels > 1 ? `-${targetLevel}` : ""} unlocked!`);
      const timer = setTimeout(() => setToastMessage(null), 3000);
      prevTargetLevelRef.current = targetLevel;
      return () => clearTimeout(timer);
    }
    prevTargetLevelRef.current = targetLevel;
  }, [targetLevel]);

  const baseLevelInfos = useMemo(
    () => buildLevelInfos(character, targetLevel, classData, subclassSelection, currentLevel, !!startFromLevelOne, language),
    [character, targetLevel, classData, subclassSelection, currentLevel, startFromLevelOne, language]
  );
  // A replaced spell is swapped for a new one, so that level picks one more spell.
  // A feature that comes back at a later level (maneuvers, disciplines, Metamagic,
  // Expertise) hides what other levels of this same level-up already picked, so a
  // character made above the pick level can't take one option twice.
  const levelInfos = useMemo(() => {
    const base = (name: string) => name.split(":")[0];
    const pickedElsewhere = (state: Record<number, Record<string, string>>, level: number, name: string) =>
      new Set(
        Object.entries(state)
          .filter(([lvl]) => Number(lvl) !== level)
          .flatMap(([, choices]) =>
            Object.entries(choices || {})
              .filter(([n]) => base(n) === base(name))
              .flatMap(([, v]) => String(v || "").split(", ").filter(Boolean))
          )
      );
    const withoutOthers = (
      list: LevelInfo["classFeatureChoices"],
      state: Record<number, Record<string, string>>,
      level: number
    ) =>
      list?.map((fc) => {
        const taken = pickedElsewhere(state, level, fc.name);
        return taken.size ? { ...fc, options: fc.options.filter((o) => !taken.has(o.name)) } : fc;
      });
    return baseLevelInfos.map((info) => {
      const expertiseTaken = new Set(
        Object.entries(expertiseSelections).filter(([lvl]) => Number(lvl) !== info.level).flatMap(([, list]) => list || [])
      );
      return {
        ...info,
        ...(replacedSpells[info.level] ? { hasSpellSelection: true, spellSelectionCount: info.spellSelectionCount + 1 } : {}),
        subclassFeatureChoices: withoutOthers(info.subclassFeatureChoices, subclassFeatureChoices, info.level),
        classFeatureChoices: withoutOthers(info.classFeatureChoices, classFeatureChoices, info.level),
        expertise: info.expertise && {
          ...info.expertise,
          availableOptions: info.expertise.availableOptions.filter((o) => !expertiseTaken.has(o)),
        },
      };
    });
  }, [baseLevelInfos, replacedSpells, subclassFeatureChoices, classFeatureChoices, expertiseSelections]);

  const setHp = (level: number, value: number) => setHpValues((prev) => ({ ...prev, [level]: value }));
  const setAsi = (level: number, patch: Partial<{ mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }>) =>
    setAsiSelections((prev) => ({ ...prev, [level]: { ...(prev[level] || { mode: "single" }), ...patch } as any }));
  const setSpells = (level: number, list: string[]) => setSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setMagicalSecrets = (level: number, list: string[]) => setMagicalSecretsSelections((prev) => ({ ...prev, [level]: list }));
  const setSubclassSpells = (level: number, list: string[]) => setSubclassSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setReplacedSpell = (level: number, spellId: string) => setReplacedSpells((prev) => ({ ...prev, [level]: spellId }));
  const setCircleTerrain = (level: number, terrain: string) => setCircleTerrainSelections((prev) => ({ ...prev, [level]: terrain }));
  const setBonusCantrip = (level: number, cantrip: string) => setBonusCantripSelections((prev) => ({ ...prev, [level]: cantrip }));
  const setInvocations = (level: number, list: string[]) => setInvocationSelections((prev) => ({ ...prev, [level]: list }));
  const setReplacedInvocation = (level: number, invocation: string) => setReplacedInvocations((prev) => ({ ...prev, [level]: invocation }));
  const setExpertise = (level: number, list: string[]) => setExpertiseSelections((prev) => ({ ...prev, [level]: list }));

  const buildAllocation = (st?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }): Record<AbilityKey, number> => {
    const alloc: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (!st) return alloc;
    if (st.mode === "single" && st.single) alloc[st.single] = 2;
    if (st.mode === "double") {
      if (st.d1) alloc[st.d1] = 1;
      if (st.d2) alloc[st.d2] = 1;
    }
    return alloc;
  };

  const baseScores = useCallback(
    (excludeLevel?: number): Record<AbilityKey, number> => {
      const base: Record<AbilityKey, number> = {
        str: character.str, dex: character.dex, con: character.con,
        int: character.int, wis: character.wis, cha: character.cha,
      };
      for (const [lvlStr, st] of Object.entries(asiSelections)) {
        const lvl = Number(lvlStr);
        if (lvl === excludeLevel) continue;
        if (!st || !st.mode) continue;
        const alloc = buildAllocation(st);
        (Object.keys(alloc) as AbilityKey[]).forEach((k) => (base[k] += alloc[k]));
      }
      return base;
    },
    [character, asiSelections]
  );

  const wizardCharacter = useMemo<Character>(() => {
    const pendingAbilityChanges: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    for (const [, st] of Object.entries(asiSelections)) {
      if (!st || !st.mode) continue;
      const alloc = buildAllocation(st);
      (Object.keys(alloc) as AbilityKey[]).forEach((k) => { pendingAbilityChanges[k] += alloc[k]; });
    }

    const pendingFeatureSelections: Record<string, string[]> = { ...(character.featureSelections || {}) };
    for (const [lvl, choices] of Object.entries(subclassFeatureChoices)) {
      for (const [name, value] of Object.entries(choices)) {
        pendingFeatureSelections[`subclass-feature-${lvl}-${name}`] = [value];
      }
    }
    for (const [lvl, choices] of Object.entries(classFeatureChoices)) {
      for (const [name, value] of Object.entries(choices)) {
        pendingFeatureSelections[`class-feature-${lvl}-${name}`] = [value];
      }
    }
    for (const [lvl, list] of Object.entries(expertiseSelections)) {
      if (list.length > 0) pendingFeatureSelections[`expertise-${lvl}`] = list;
    }
    for (const [lvl, list] of Object.entries(invocationSelections)) {
      if (list.length > 0) pendingFeatureSelections[`warlock-invocations`] = list;
    }
    if (pactTomeCantrips.length > 0) pendingFeatureSelections["pact-tome-cantrips"] = pactTomeCantrips;
    const pactBoon = Object.values(classFeatureChoices).map((choices) => choices["Pact Boon"]).find(Boolean);
    if (pactBoon) pendingFeatureSelections["pact-boon"] = [pactBoon];

    const pendingFeatures = [...(character.features || [])];
    const subclassName = subclassSelection || character.subclass || "";
    if (subclassName && !pendingFeatures.some(f => f.name === subclassName)) {
      pendingFeatures.push({ id: `subclass-${subclassName}`, name: subclassName, description: "", source: "subclass" as const });
    }

    return {
      ...character,
      str: character.str + pendingAbilityChanges.str,
      dex: character.dex + pendingAbilityChanges.dex,
      con: character.con + pendingAbilityChanges.con,
      int: character.int + pendingAbilityChanges.int,
      wis: character.wis + pendingAbilityChanges.wis,
      cha: character.cha + pendingAbilityChanges.cha,
      subclass: subclassName || character.subclass,
      subclassIndex: (subclassName || character.subclass || "").toLowerCase().replace(/\s+/g, "-") || character.subclassIndex,
      features: pendingFeatures,
      featureSelections: pendingFeatureSelections,
    };
  }, [character, asiSelections, subclassSelection, subclassFeatureChoices, classFeatureChoices, expertiseSelections, invocationSelections, pactTomeCantrips, buildAllocation]);

  // Every spell the character has or has picked anywhere in this wizard, so no
  // picker offers a spell twice. Free spells are counted at the target level.
  const takenSpells = useMemo(
    () =>
      getTakenSpellNames({ ...wizardCharacter, level: Math.max(character.level || 1, targetLevel) }, [
        ...Object.values(spellSelections).flat(),
        ...Object.values(magicalSecretsSelections).flat(),
        ...Object.values(subclassSpellSelections).flat(),
        ...Object.values(bonusCantripSelections),
        ...Object.values(asiSelections).flatMap((st) => Object.values(st?.featOptions || {})),
      ]),
    [wizardCharacter, character.level, targetLevel, spellSelections, magicalSecretsSelections, subclassSpellSelections, bonusCantripSelections, asiSelections]
  );

  const asiIsValid = (st?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }): boolean => {
    if (!st || !st.mode) return false;
    if (st.mode === "feat") return !!st.feat;
    if (st.mode === "single") return !!st.single;
    return !!st.d1 && !!st.d2 && st.d1 !== st.d2;
  };

  const isFeatureSelected = useCallback((lvl: number, name: string, isSubclass: boolean): boolean => {
    if (name === "Eldritch Invocations") {
      const stateValue = invocationSelections[lvl];
      if (stateValue && stateValue.length > 0) return true;
      const persisted = character.featureSelections?.["warlock-invocations"];
      if (Array.isArray(persisted) && persisted.length > 0) return true;
      return false;
    }
    const stateChoices = isSubclass ? subclassFeatureChoices : classFeatureChoices;
    const stateValue = stateChoices[lvl]?.[name];
    if (stateValue) return true;
    const persistKey = isSubclass ? `subclass-feature-${lvl}-${name}` : `class-feature-${lvl}-${name}`;
    const persisted = character.featureSelections?.[persistKey];
    if (Array.isArray(persisted) && persisted.length > 0 && persisted[0] !== "") return true;
    if (typeof persisted === "string" && persisted) return true;
    return false;
  }, [character, subclassFeatureChoices, classFeatureChoices, invocationSelections]);

  const allLevelsComplete = levelInfos.length === 0 || levelInfos.every((info) => {
    const lvl = info.level;
    const lvlSpells = spellSelections[lvl] || [];
    const selectedCantripsCount = lvlSpells.filter((s) => s.endsWith(":0")).length;
    const selectedSpellsCount = lvlSpells.filter((s) => !s.endsWith(":0")).length;
    const spellSelectionComplete = !info.hasSpellSelection || (selectedCantripsCount >= info.cantripSelectionCount && selectedSpellsCount >= info.spellSelectionCount);
    // Level 1 HP is automatic, no need to roll
    if (lvl === 1 && startFromLevelOne) {
      if (info.asi && !asiIsValid(asiSelections[lvl])) return false;
      if (info.subclassOptions && !subclassSelection) return false;
      if (!spellSelectionComplete) return false;
      if (info.subclassFeatureChoices) {
        for (const fc of info.subclassFeatureChoices) {
          if (!isFeatureSelected(lvl, fc.name, true)) return false;
        }
      }
      if (info.classFeatureChoices) {
        for (const fc of info.classFeatureChoices) {
          if (!isFeatureSelected(lvl, fc.name, false)) return false;
        }
      }
      return true;
    }
    if (!hpValues[lvl] || hpValues[lvl] <= 0) return false;
    if (info.asi && !asiIsValid(asiSelections[lvl])) return false;
    if (info.subclassOptions && !subclassSelection) return false;
    if (!spellSelectionComplete) return false;
    if (info.subclassFeatureChoices) {
      for (const fc of info.subclassFeatureChoices) {
        if (!isFeatureSelected(lvl, fc.name, true)) return false;
      }
    }
    if (info.classFeatureChoices) {
      for (const fc of info.classFeatureChoices) {
        if (!isFeatureSelected(lvl, fc.name, false)) return false;
      }
    }
    return true;
  });

  const unfinishedItems = useMemo(() => {
    const items: { level: number; label: string; sectionId: string }[] = [];
    for (const info of levelInfos) {
      const lvl = info.level;
      const isLevelOneAuto = lvl === 1 && startFromLevelOne;
      if (!isLevelOneAuto) {
        if (!hpValues[lvl] || hpValues[lvl] <= 0) {
          items.push({ level: lvl, label: t("levelUp.taskRollHp", "Level {level} — Roll HP", { level: lvl }), sectionId: `hp-${lvl}` });
        }
      }
      if (info.asi) {
        const sel = asiSelections[lvl];
        const isValid = (sel?.mode === "single" && !!sel?.single) || (sel?.mode === "double" && !!sel?.d1 && !!sel?.d2 && sel?.d1 !== sel?.d2) || (sel?.mode === "feat" && !!sel?.feat);
        if (!isValid) items.push({ level: lvl, label: t("levelUp.taskAsi", "Level {level} — Ability Score Improvement", { level: lvl }), sectionId: `asi-${lvl}` });
      }
      if (info.subclassOptions && !subclassSelection) {
        items.push({ level: lvl, label: t("levelUp.taskSubclass", "Level {level} — Choose Subclass", { level: lvl }), sectionId: `subclass-${lvl}` });
      }
      if (info.subclassFeatureChoices) {
        for (const fc of info.subclassFeatureChoices) {
          if (!isFeatureSelected(lvl, fc.name, true)) items.push({ level: lvl, label: t("levelUp.taskFeature", "Level {level} — {feature}", { level: lvl, feature: fc.name }), sectionId: `subclass-fc-${lvl}` });
        }
      }
      if (info.classFeatureChoices) {
        for (const fc of info.classFeatureChoices) {
          if (!isFeatureSelected(lvl, fc.name, false)) items.push({ level: lvl, label: t("levelUp.taskFeature", "Level {level} — {feature}", { level: lvl, feature: fc.name }), sectionId: `class-fc-${lvl}` });
        }
      }
      if (info.expertise && expertiseSelections[lvl] && expertiseSelections[lvl].length < info.expertise.count) {
        items.push({ level: lvl, label: t("levelUp.taskExpertise", "Level {level} — Expertise", { level: lvl }), sectionId: `expertise-${lvl}` });
      }
      if (info.hasSpellSelection) {
        const lvlSpells = spellSelections[lvl] || [];
        const cantripsCount = lvlSpells.filter((s) => s.endsWith(":0")).length;
        const spellsCount = lvlSpells.filter((s) => !s.endsWith(":0")).length;
        if (cantripsCount < info.cantripSelectionCount || spellsCount < info.spellSelectionCount) {
          items.push({ level: lvl, label: t("levelUp.taskSpells", "Level {level} — Select spells", { level: lvl }), sectionId: `spells-${lvl}` });
        }
      }
    }
    return items;
  }, [levelInfos, asiSelections, subclassSelection, spellSelections, hpValues, startFromLevelOne, expertiseSelections, isFeatureSelected, t]);

  const handleFinish = () => {
    if (!classData) return;
    const subclassIndex = subclassSelection
      ? getStaticSubclasses(character.class, character.sources, character.ruleset, language).find(s => s.name === subclassSelection)?.index
      : undefined;
    let draft: Character = {
      ...character,
      subclass: subclassSelection || character.subclass,
      subclassIndex: subclassIndex || character.subclassIndex,
      featureSelections: {
        ...character.featureSelections,
        ...Object.fromEntries(
          Object.entries(subclassFeatureChoices).flatMap(([lvl, choices]) =>
            Object.entries(choices).map(([name, value]) => [`subclass-feature-${lvl}-${name}`, [value]])
          )
        ),
        ...Object.fromEntries(
          Object.entries(classFeatureChoices).flatMap(([lvl, choices]) =>
            Object.entries(choices).map(([name, value]) => [`class-feature-${lvl}-${name}`, [value]])
          )
        ),
        ...Object.fromEntries(
          Object.entries(expertiseSelections).flatMap(([lvl, list]) =>
            list.map((skill) => [`expertise-${lvl}-${skill}`, [skill]])
          )
        ),
      },
    };

    const toolNames = new Set(getStaticEquipments([], character.ruleset).filter((e: any) => e.equipment_category === "Tools").map((e: any) => e.name));
    const newToolProficiencies = new Set(character.toolProficiencies || []);
    for (const sel of Object.values(draft.featureSelections).flat()) {
      if (typeof sel === "string" && toolNames.has(sel)) {
        newToolProficiencies.add(sel);
      }
    }
    draft.toolProficiencies = Array.from(newToolProficiencies);

    if (startFromLevelOne) {
      const levelHp: Record<number, number> = { 1: hitDie + conMod };
      for (const [lvlStr, gain] of Object.entries(hpValues)) {
        const lvl = Number(lvlStr);
        levelHp[lvl] = gain;
      }
      let sum = 0;
      for (const v of Object.values(levelHp)) sum += v;
      draft.levelHp = levelHp;
      draft.maxHp = sum;
    } else {
      const existingLevelHp = character.levelHp && Object.keys(character.levelHp).length > 0 ? character.levelHp : null;
      if (existingLevelHp) {
        const mergedLevelHp: Record<number, number> = { ...existingLevelHp };
        for (const [lvlStr, gain] of Object.entries(hpValues)) {
          const lvl = Number(lvlStr);
          mergedLevelHp[lvl] = (mergedLevelHp[lvl] || 0) + gain;
        }
        let sum = 0;
        for (const v of Object.values(mergedLevelHp)) sum += v;
        draft.levelHp = mergedLevelHp;
        draft.maxHp = sum;
      } else {
        let totalHp = 0;
        for (const v of Object.values(hpValues)) totalHp += v;
        draft.maxHp = (character.maxHp || 0) + totalHp;
      }
    }
    draft.currentHp = draft.maxHp;

    for (const [lvlStr, st] of Object.entries(asiSelections)) {
      const lvl = Number(lvlStr);
      if (!st || !st.mode) continue;
      if (st.mode === "feat" && st.feat) {
        draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
        // The sheet language, or the feat's English text is baked into the save
        // at level-up and no later lookup can tell it from a translation.
        const featData = getStaticFeat(st.feat, character.ruleset, language);
        const hasFeat = !!featData && draft.features.some((f) => f.name === featData.name);
        // A repeatable feat (Elemental Adept) keeps one feature row but records every pick.
        if (featData && (!hasFeat || REPEATABLE_FEATS.has(featData.name))) {
          draft = {
            ...draft,
            features: hasFeat
              ? draft.features
              : [
                  ...draft.features,
                  {
                    id: `feat-${featData.name}`.replace(/\s+/g, "-"),
                    name: featData.name,
                    description: featData.description,
                    source: "custom" as const,
                  },
                ],
            featureSelections: {
              ...draft.featureSelections,
              [`asi-feat-${lvl}`]: [featData.name],
              [`asi-feat-${lvl}-options`]: encodeFeatOptions(st.featOptions),
            },
          };
          // Ability increases, proficiencies and spells the feat gives.
          draft = applyFeatGrants(draft, st.feat, st.featOptions);
        }
      } else {
        const alloc = buildAllocation(st);
        const hasAlloc = Object.values(alloc).some((v) => v > 0);
        if (!hasAlloc) continue;
        draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
        for (const { key } of ABILITIES) {
          const add = alloc[key] || 0;
          if (add > 0) draft = { ...draft, [key]: ((draft[key] as number) || 0) + add };
        }
      }
    }

    // HP per level moves with CON, and Tough, Dwarven Toughness and Draconic
    // Resilience add to every level, the earlier ones included. New levels were
    // rolled with the old CON modifier and no bonus; earlier levels already
    // carry the old modifier and old bonus.
    {
      const newPerLevel = getModifier(draft.con) + getHpBonusPerLevel(draft);
      const rolledPerLevel = conMod;
      const earlierPerLevel = conMod + (startFromLevelOne ? 0 : getHpBonusPerLevel(character));
      const newLevels = new Set([...Object.keys(hpValues).map(Number), ...(startFromLevelOne ? [1] : [])]);
      if (draft.levelHp && Object.keys(draft.levelHp).length > 0) {
        const adjusted: Record<number, number> = {};
        for (const [lvlStr, hp] of Object.entries(draft.levelHp)) {
          const lvl = Number(lvlStr);
          adjusted[lvl] = Math.max(1, hp + newPerLevel - (newLevels.has(lvl) ? rolledPerLevel : earlierPerLevel));
        }
        draft.levelHp = adjusted;
        draft.maxHp = Object.values(adjusted).reduce((sum, v) => sum + v, 0);
      } else {
        const earlierLevels = startFromLevelOne ? 0 : character.level || 0;
        draft.maxHp += (newPerLevel - earlierPerLevel) * earlierLevels + (newPerLevel - rolledPerLevel) * newLevels.size;
      }
      draft.currentHp = draft.maxHp;
    }

    const spells = [...(character.spells || [])];
    const cantrips = [...(character.cantrips || [])];
    const newPreparedIds: string[] = [];
    const magicalSecretsIds: string[] = [];

    for (const list of Object.values(spellSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (level === 0) {
          if (!cantrips.some((c) => c.name === name)) {
            cantrips.push({ id: `cantrip-${name}`.replace(/\s+/g, "-"), name });
          }
        }
        if (!spells.some((s) => s.name === name && s.level === level)) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name === name);
          const id = `spell-${name}-${level}`.replace(/\s+/g, "-");
          spells.push({
            id,
            name, level, source: "srd", srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
          if (level > 0) newPreparedIds.push(id);
        }
      }
    }

    for (const list of Object.values(magicalSecretsSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (!spells.some((s) => s.name === name && s.level === level)) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name === name);
          const id = `spell-${name}-${level}`.replace(/\s+/g, "-");
          spells.push({
            id,
            name, level, source: "srd", srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
          magicalSecretsIds.push(id);
        }
      }
    }

    for (const list of Object.values(subclassSpellSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (!spells.some((s) => s.name === name && s.level === level)) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name === name);
          const id = `spell-${name}-${level}`.replace(/\s+/g, "-");
          spells.push({
            id,
            name, level, source: "srd", srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
          magicalSecretsIds.push(id);
        }
      }
    }

    for (const [lvlStr, spellId] of Object.entries(replacedSpells)) {
      if (spellId) {
        const idx = spells.findIndex((s) => s.id === spellId);
        if (idx >= 0) {
          spells.splice(idx, 1);
        }
      }
    }

    draft.spells = spells;
    draft.cantrips = cantrips;
    draft.magicalSecretsSpells = [...(character.magicalSecretsSpells || []), ...magicalSecretsIds];
    draft.level = targetLevel;

    if (draft.class === "Bard") {
      draft.maxBardicInspirationUses = getMaxBardicInspirationUses(draft);
      draft.bardicInspirationUses = draft.maxBardicInspirationUses;
    }

    if (draft.class === "Barbarian" && draft.level >= 20) {
      draft.str = Math.min(24, draft.str + 4);
      draft.con = Math.min(24, draft.con + 4);
    }

    if (draft.class === "Cleric" && draft.subclass) {
      const domainSpellNames = getDomainSpellNames(draft);
      const currentSpellNames = (draft.spells || []).map((s) => s.name?.toLowerCase());
      const existingDomainSpells = (draft.domainSpells || []);
      const newDomainSpells: string[] = [];

      for (const name of domainSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
          if (spell) {
            const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
            spells.push({
              id,
              name: spell.name,
              level: spell.level || 0,
              source: "srd" as const,
              srdSpellName: spell.name,
              description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
            });
            if ((spell.level || 0) > 0) newPreparedIds.push(id);
          }
        }
        if (!existingDomainSpells.includes(name)) {
          newDomainSpells.push(name);
        }
      }

      if (newDomainSpells.length > 0) {
        draft.domainSpells = [...existingDomainSpells, ...newDomainSpells];
      }
    }

    if (draft.class === "Paladin" && draft.subclass) {
      const oathSpellNames = getOathSpellNames(draft);
      const currentSpellNames = (draft.spells || []).map((s) => s.name?.toLowerCase());
      for (const name of oathSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
          if (spell) {
            const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
            spells.push({
              id,
              name: spell.name,
              level: spell.level || 0,
              source: "srd" as const,
              srdSpellName: spell.name,
              description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
            });
            if ((spell.level || 0) > 0) newPreparedIds.push(id);
          }
        }
      }
    }

    if (draft.class === "Wizard" && draft.subclass) {
      const traditionSpellNames = getWizardTraditionSpellNames(draft);
      const currentSpellNames = spells.map((s) => s.name?.toLowerCase());
      for (const name of traditionSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
          if (spell) {
            const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
            spells.push({
              id,
              name: spell.name,
              level: spell.level || 0,
              source: "srd" as const,
              srdSpellName: spell.name,
              description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
            });
          }
        }
      }
    }

    if (draft.class === "Druid" && draft.subclassIndex && getSubclassFlags(draft.subclassIndex).requiresTerrainSelection) {
      const selectedTerrain = Object.values(circleTerrainSelections).filter(Boolean).pop() || draft.circleTerrain;
      if (selectedTerrain) {
        draft.circleTerrain = selectedTerrain;
        const circleSpellNames = getCircleSpells(selectedTerrain, draft.level);
        const currentSpellNames = spells.map((s) => s.name?.toLowerCase());

        for (const name of circleSpellNames) {
          if (!currentSpellNames.includes(name.toLowerCase())) {
            const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
            if (spell) {
              const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
              spells.push({
                id,
                name: spell.name,
                level: spell.level || 0,
                source: "srd" as const,
                srdSpellName: spell.name,
                description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
              });
              if ((spell.level || 0) > 0) newPreparedIds.push(id);
      }
    }

    if (draft.class === "Druid" && draft.subclassIndex && getSubclassFlags(draft.subclassIndex).requiresTerrainSelection) {
      const selectedBonusCantrip = bonusCantripSelections[targetLevel];
      if (selectedBonusCantrip && !draft.bonusCantrips.includes(selectedBonusCantrip)) {
        const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === selectedBonusCantrip.toLowerCase());
        if (spell) {
          const id = `spell-${spell.name}-${spell.level}`.replace(/\s+/g, "-");
          if (!spells.some((s) => s.name?.toLowerCase() === spell.name.toLowerCase())) {
            spells.push({
              id,
              name: spell.name,
              level: 0,
              source: "srd" as const,
              srdSpellName: spell.name,
              description: Array.isArray(spell.description) ? spell.description.join("\n") : (spell.description || ""),
            });
          }
          draft.bonusCantrips = [...(draft.bonusCantrips || []), spell.name];
        }
      }
    }
        }

        const existingCircleSpells = draft.circleSpells || [];
        const newCircleSpells = circleSpellNames.filter((name) => !existingCircleSpells.includes(name));
        if (newCircleSpells.length > 0) {
          draft.circleSpells = [...existingCircleSpells, ...newCircleSpells];
        }
      }
    }

    if (draft.class === "Warlock") {
      const allInvocations: string[] = [];
      for (const [lvlStr, invs] of Object.entries(invocationSelections)) {
        for (const inv of invs) {
          if (!allInvocations.includes(inv)) allInvocations.push(inv);
        }
      }
      for (const [lvlStr, invName] of Object.entries(replacedInvocations)) {
        if (invName) {
          const idx = allInvocations.indexOf(invName);
          if (idx >= 0) allInvocations.splice(idx, 1);
        }
      }
      if (allInvocations.length > 0) {
        draft.featureSelections = {
          ...draft.featureSelections,
          "warlock-invocations": allInvocations,
        };
      }
      if (pactTomeCantrips.length > 0) {
        for (const cantripName of pactTomeCantrips) {
          if (!cantrips.some((c) => c.name === cantripName)) {
            cantrips.push({ id: `cantrip-tome-${cantripName}`.replace(/\s+/g, "-"), name: cantripName });
          }
        }
        draft.featureSelections = {
          ...draft.featureSelections,
          "pact-tome-cantrips": pactTomeCantrips,
        };
      }
      const pactBoon = Object.values(classFeatureChoices).map((choices) => choices["Pact Boon"]).find(Boolean) || "";
      if (pactBoon) {
        draft.featureSelections = {
          ...draft.featureSelections,
          "pact-boon": [pactBoon],
        };
      }
    }

    if (prepPlan) {
      // Wizard: spells go into the book; which are ready is its own pick.
      const owned = new Set(spells.map((sp) => sp.id));
      draft.preparedSpells = (preparedOverride ?? prepPlan.suggested).filter((id) => owned.has(id));
    } else if (isPreparationCaster(draft)) {
      draft.preparedSpells = [...new Set([...(character.preparedSpells || []), ...newPreparedIds])];
    }

    let finalChar = applySubclassFeatures(draft, language);
    finalChar = applySubclassSpellGrants(finalChar);
    finalChar = syncBaseFeatures(finalChar, language);
    finalChar = { ...finalChar, ...computeDerivedStats(finalChar) };
    onComplete(finalChar);
  };

  const rollAllHp = () => {
    const newHpValues: Record<number, number> = { ...hpValues };
    for (const info of levelInfos) {
      if (!newHpValues[info.level] || newHpValues[info.level] <= 0) {
        const die = Math.floor(Math.random() * hitDie) + 1;
        newHpValues[info.level] = die + conMod;
      }
    }
    setHpValues(newHpValues);
  };

  const adjustTargetLevel = (delta: number) => {
    const newLevel = Math.max(effectiveMinLevel, Math.min(effectiveMaxLevel, targetLevel + delta));
    if (newLevel !== targetLevel) {
      setTargetLevel(newLevel);
      setHpValues((prev) => {
        const next: Record<number, number> = {};
        for (const [lvl, v] of Object.entries(prev)) if (Number(lvl) <= newLevel) next[Number(lvl)] = v;
        for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) if (!next[lvl]) next[lvl] = averageHp;
        return next;
      });
      setStepIdx(0);
    }
  };

  // The boon picked in this level-up, or the one saved at an earlier level.
  const pactBoon = Object.values(classFeatureChoices).map((choices) => choices["Pact Boon"]).find(Boolean) || character.featureSelections?.["pact-boon"]?.[0] || "";

  // One screen per level-up moment and per choice, then a recap.
  // A jump of several levels puts all free gains on one screen and all new
  // spells on one screen at the end; the other choices stay one per level.
  const steps = useMemo(() => {
    const list: { levels: number[]; part: LevelPart | "recap" }[] = [];
    const jump = levelInfos.length > 1;
    if (jump) {
      list.push({ levels: levelInfos.map((info) => info.level), part: "moment" });
      for (const info of levelInfos) {
        for (const part of levelParts(info, subclassSelection, character.class)) {
          if (part !== "spells") list.push({ levels: [info.level], part });
        }
      }
      const spellLevels = levelInfos.filter((info) => levelParts(info, subclassSelection, character.class).includes("spells")).map((info) => info.level);
      if (spellLevels.length > 0) list.push({ levels: spellLevels, part: "spells" });
    } else {
      for (const info of levelInfos) {
        list.push({ levels: [info.level], part: "moment" });
        for (const part of levelParts(info, subclassSelection, character.class)) list.push({ levels: [info.level], part });
      }
    }
    list.push({ levels: [], part: "recap" });
    return list;
  }, [levelInfos, subclassSelection, character.class]);
  const idx = Math.min(stepIdx, steps.length - 1);
  const step = steps[idx];
  const stepInfos = levelInfos.filter((info) => step.levels.includes(info.level));
  const stepComplete = step.part === "recap"
    ? allLevelsComplete
    : !unfinishedItems.some((item) => step.levels.includes(item.level) && partOfSection(item.sectionId) === step.part);
  const goTo = (i: number) => {
    setStepIdx(Math.max(0, Math.min(steps.length - 1, i)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const stepIndexOf = (level: number, part: LevelPart) => {
    const i = steps.findIndex((s) => s.levels.includes(level) && s.part === part);
    return i >= 0 ? i : steps.findIndex((s) => s.levels.includes(level));
  };

  // Live stats for the sticky character card.
  const before = useMemo(() => computeDerivedStats(character), [character]);
  const preview = useMemo(() => {
    const scores = baseScores();
    (Object.keys(scores) as AbilityKey[]).forEach((k) => { scores[k] = Math.min(20, scores[k]); });
    const gained = Object.entries(hpValues)
      .filter(([lvl]) => Number(lvl) <= targetLevel && !(startFromLevelOne && Number(lvl) === 1))
      .reduce((sum, [, v]) => sum + (v || 0), 0);
    const startHp = startFromLevelOne ? hitDie + conMod : character.maxHp || 0;
    const hp = startHp + gained + (getModifier(scores.con) - conMod) * targetLevel;
    const derived = computeDerivedStats({ ...character, ...scores, level: targetLevel });
    return { hp, ac: derived.ac ?? character.ac, atk: derived.spellAttackBonus ?? 0, dc: derived.spellSaveDc ?? 0 };
  }, [baseScores, hpValues, targetLevel, startFromLevelOne, hitDie, conMod, character]);
  // A Wizard learns spells into the spellbook and separately chooses which are
  // ready. The recap shows that list, filled in, so it is never left empty.
  const prepPlan = (() => {
    if (character.class !== "Wizard") return null;
    const base = preparableSpells(character);
    const have = new Set(base.map((sp) => `${sp.name}:${sp.level}`));
    const added: typeof base = [];
    for (const list of Object.values(spellSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (!(level > 0) || have.has(entry)) continue;
        have.add(entry);
        added.push({ id: `spell-${name}-${level}`.replace(/\s+/g, "-"), name, level });
      }
    }
    const spells = [...base, ...added];
    const scores = baseScores();
    (Object.keys(scores) as AbilityKey[]).forEach((k) => { scores[k] = Math.min(20, scores[k]); });
    const limit = getMaxPreparedSpells({ ...character, ...scores, level: targetLevel });
    const suggested = fillPrepared(spells, [...(character.preparedSpells || []), ...added.map((a) => a.id)], limit);
    return { spells, limit, suggested };
  })();
  const preparedNow = prepPlan ? (preparedOverride ?? prepPlan.suggested).filter((id) => prepPlan.spells.some((sp) => sp.id === id)) : [];
  const showSpellStats = castsSpells({ class: character.class, subclass: subclassSelection || character.subclass });

  const partTitle = (part: LevelPart | "recap") => ({
    moment: t("levelUp.flow.momentTitle", "Level up!"),
    subclass: t("levelUp.flow.subclassTitle", "Pick your subclass"),
    asi: t("levelUp.flow.asiTitle", "Grow stronger"),
    features: t("levelUp.flow.featuresTitle", "Choose your class features"),
    spells: t("levelUp.flow.spellsTitle", "Learn new spells"),
    recap: t("levelUp.flow.recapTitle", "Check your choices"),
  })[part];
  const partHint = (part: LevelPart | "recap") => ({
    moment: t("levelUp.flow.momentHint", "You got stronger. These come for free."),
    subclass: t("levelUp.flow.subclassHint", "Your subclass is your specialty. It gives you extra powers as you level up."),
    asi: t("levelUp.flow.asiHint", "Add +2 to one ability, +1 to two abilities, or take a feat instead."),
    features: t("levelUp.flow.featuresHint", "Your class lets you decide how this feature works."),
    spells: t("levelUp.flow.spellsHint", "Pick the spells your character learns at this level."),
    recap: t("levelUp.flow.recapHint", "Tap any row to change it, then save."),
  })[part];

  const recapLabel = (part: LevelPart) => ({
    moment: t("sheet.hitPoints", "Hit Points"),
    subclass: t("levelUp.flow.recapSubclass", "Subclass"),
    asi: t("levelUp.flow.recapAsi", "Ability scores"),
    features: t("levelUp.flow.recapFeatures", "Features"),
    spells: t("levelUp.flow.recapSpells", "Spells"),
  })[part];
  const recapSummary = (level: number, part: LevelPart): string => {
    if (part === "moment") {
      if (startFromLevelOne && level === 1) return `${hitDie + conMod} HP`;
      return t("levelUp.flow.hpGain", "+{hp} HP", { hp: hpValues[level] || 0 });
    }
    if (part === "subclass") return subclassSelection || "—";
    if (part === "asi") {
      const st = asiSelections[level];
      if (!st) return "—";
      if (st.mode === "feat") return st.feat || "—";
      if (st.mode === "single" && st.single) return `+2 ${st.single.toUpperCase()}`;
      if (st.mode === "double" && st.d1 && st.d2) return `+1 ${st.d1.toUpperCase()}, +1 ${st.d2.toUpperCase()}`;
      return "—";
    }
    const strip = (list: string[]) => list.map((x) => x.split(":")[0]);
    if (part === "features") {
      const picks = [
        ...Object.values(subclassFeatureChoices[level] || {}),
        ...Object.values(classFeatureChoices[level] || {}),
        ...(expertiseSelections[level] || []),
        ...(invocationSelections[level] || []),
        circleTerrainSelections[level] || "",
      ].filter(Boolean);
      return picks.join(", ") || "—";
    }
    const picks = [
      ...strip(spellSelections[level] || []),
      ...strip(magicalSecretsSelections[level] || []),
      ...strip(subclassSpellSelections[level] || []),
      bonusCantripSelections[level] || "",
    ].filter(Boolean);
    return picks.join(", ") || "—";
  };

  const rollHp = (level: number) => {
    const die = Math.floor(Math.random() * hitDie) + 1;
    setHp(level, Math.max(1, die + conMod));
  };

  // "Pick 1 of 3" cards above the full picker.
  const [showAllFor, setShowAllFor] = useState<Record<string, boolean>>({});
  const whyText = (why: Why) => (language === "id" ? why.id : why.en);
  const featNames = useMemo(() => {
    const owned = new Set((character.features || []).map((f) => f.name));
    return getStaticFeats(character.sources, character.ruleset)
      .map((f) => f.name)
      .filter((name) => !owned.has(name) && getFeatOptionGroups(name).length === 0);
  }, [character.features, character.sources, character.ruleset]);
  const classSpellList = useMemo(
    () => getStaticSpells(character.sources, character.ruleset).filter((s) => s.classes?.includes(character.class)),
    [character.sources, character.ruleset, character.class]
  );

  /** The suggestion groups for one level's screen; an empty list hides the cards. */
  const pickGroups = (info: LevelInfo, part: LevelPart): { label: string; cards: PickCard[]; onPick: (key: string) => void }[] => {
    const lvl = info.level;
    const label = t("levelUp.flow.suggested", "Suggested for you");
    if (part === "subclass" && info.subclassOptions?.length) {
      const picks = topPicks(SUBCLASS_PICKS[character.class], info.subclassOptions.map((o) => o.name));
      return [{ label, cards: picks.map((p) => ({ key: p.name, title: p.name, why: whyText(p.why), selected: subclassSelection === p.name })), onPick: handleSubclassSelect }];
    }
    if (part === "asi" && info.asi) {
      const takenElsewhere = new Set(Object.entries(asiSelections).filter(([l, st]) => Number(l) !== lvl && st?.mode === "feat").map(([, st]) => st.feat));
      const picks = asiPicks(character.class, baseScores(lvl), featNames.filter((f) => !takenElsewhere.has(f)));
      const st = asiSelections[lvl];
      const keyOf = (p: (typeof picks)[number]) => (p.kind === "single" ? `single:${p.ability}` : p.kind === "double" ? `double:${p.d1}:${p.d2}` : `feat:${p.feat}`);
      const titleOf = (p: (typeof picks)[number]) =>
        p.kind === "single" ? `+2 ${p.ability.toUpperCase()}` : p.kind === "double" ? `+1 ${p.d1.toUpperCase()}, +1 ${p.d2.toUpperCase()}` : p.feat;
      const isSel = (p: (typeof picks)[number]) =>
        !!st && (p.kind === "single" ? st.mode === "single" && st.single === p.ability
          : p.kind === "double" ? st.mode === "double" && ((st.d1 === p.d1 && st.d2 === p.d2) || (st.d1 === p.d2 && st.d2 === p.d1))
          : st.mode === "feat" && st.feat === p.feat);
      return [{
        label,
        cards: picks.map((p) => ({ key: keyOf(p), title: titleOf(p), tag: p.kind === "feat" ? t("levelUp.flow.feat", "Feat") : undefined, why: whyText(p.why), selected: isSel(p) })),
        onPick: (key) => {
          const [kind, a, b] = key.split(":");
          if (kind === "single") setAsi(lvl, { mode: "single", single: a as AbilityKey, d1: undefined, d2: undefined, feat: undefined, featOptions: undefined });
          else if (kind === "double") setAsi(lvl, { mode: "double", d1: a as AbilityKey, d2: b as AbilityKey, single: undefined, feat: undefined, featOptions: undefined });
          else setAsi(lvl, { mode: "feat", feat: key.slice(5), single: undefined, d1: undefined, d2: undefined, featOptions: undefined });
        },
      }];
    }
    if (part === "features") {
      type Group = { label: string; cards: PickCard[]; onPick: (key: string) => void };
      const groups: Group[] = [];
      // One group for a feature choice; picks are kept as a ", " joined string like the full picker does.
      const add = (fc: NonNullable<LevelInfo["classFeatureChoices"]>[number] | undefined, isSubclass: boolean, list: SuggestedPick[] | undefined, title: string) => {
        if (!fc) return;
        const state = isSubclass ? subclassFeatureChoices : classFeatureChoices;
        const setState = isSubclass ? setSubclassFeatureChoices : setClassFeatureChoices;
        const current = (state[lvl]?.[fc.name] || "").split(", ").filter(Boolean);
        const count = fc.count || 1;
        const picks = topPicks(list, fc.options.map((o) => o.name));
        groups.push({
          label: title,
          cards: picks.map((p) => ({ key: p.name, title: p.name, why: whyText(p.why), selected: current.includes(p.name), disabled: count > 1 && current.length >= count })),
          onPick: (name) => {
            const next = count === 1 ? [name] : current.includes(name) ? current.filter((x) => x !== name) : current.length < count ? [...current, name] : current;
            setState((prev) => ({ ...prev, [lvl]: { ...(prev[lvl] || {}), [fc.name]: next.join(", ") } }));
          },
        });
      };
      const classChoice = (name: string) => info.classFeatureChoices?.find((fc) => fc.name === name);
      add(classChoice("Fighting Style"), false, FIGHTING_STYLE_PICKS[character.class], t("levelUp.flow.suggestedStyle", "Suggested fighting styles"));
      add(classChoice("Metamagic"), false, METAMAGIC_PICKS, t("levelUp.flow.suggestedMetamagic", "Suggested metamagic"));
      add(classChoice("Expertise"), false, expertisePicks(character.class), t("levelUp.flow.suggestedExpertise", "Suggested expertise"));
      if (subclassSelection) add(info.subclassFeatureChoices?.find((fc) => fc.name === "Combat Superiority"), true, MANEUVER_PICKS, t("levelUp.flow.suggestedManeuvers", "Suggested maneuvers"));
      if (info.expertise && info.expertise.count > 0) {
        const { count, availableOptions } = info.expertise;
        const current = expertiseSelections[lvl] || [];
        groups.push({
          label: t("levelUp.flow.suggestedExpertise", "Suggested expertise"),
          cards: topPicks(expertisePicks(character.class), availableOptions).map((p) => ({ key: p.name, title: p.name, why: whyText(p.why), selected: current.includes(p.name), disabled: current.length >= count })),
          onPick: (name) => setExpertise(lvl, current.includes(name) ? current.filter((x) => x !== name) : current.length < count ? [...current, name] : current),
        });
      }
      const invocations = classChoice("Eldritch Invocations");
      if (invocations && character.class === "Warlock" && lvl >= 2) {
        const count = invocations.count || 1;
        const current = invocationSelections[lvl] || [];
        const knowsEldritchBlast =
          (character.cantrips || []).some((c) => c.name === "Eldritch Blast") ||
          (character.spells || []).some((sp) => sp.name === "Eldritch Blast") ||
          Object.entries(spellSelections).some(([l, list]) => Number(l) <= lvl && list.includes("Eldritch Blast:0"));
        const known = new Set([
          ...(character.featureSelections?.["warlock-invocations"] || []),
          ...Object.entries(invocationSelections).filter(([l]) => Number(l) !== lvl).flatMap(([, list]) => list || []),
        ]);
        const open = getAvailableInvocations(lvl, pactBoon, current, knowsEldritchBlast, character.sources, usesOptionalClassFeatures(character))
          .filter((i) => i.available && !known.has(i.name))
          .map((i) => i.name);
        groups.push({
          label: t("levelUp.flow.suggestedInvocations", "Suggested invocations"),
          cards: topPicks(INVOCATION_PICKS, open).map((p) => ({ key: p.name, title: p.name, why: whyText(p.why), selected: current.includes(p.name), disabled: current.length >= count })),
          onPick: (name) => setInvocations(lvl, current.includes(name) ? current.filter((x) => x !== name) : current.length < count ? [...current, name] : current),
        });
      }
      return groups.filter((g) => g.cards.length > 0);
    }
    if (part === "spells" && info.hasSpellSelection && !["Fighter", "Rogue"].includes(character.class)) {
      const mine = spellSelections[lvl] || [];
      const own = new Set(mine.map((x) => x.split(":")[0].toLowerCase()));
      const free = classSpellList.filter((sp) => (sp.level === 0 || sp.level <= info.maxSpellLevel) && (own.has(sp.name.toLowerCase()) || !takenSpells.has(sp.name.toLowerCase())));
      const groups: { label: string; cards: PickCard[]; onPick: (key: string) => void }[] = [];
      const toggle = (key: string, isCantrip: boolean, limit: number) => {
        const has = mine.includes(key);
        const sameKind = mine.filter((x) => x.endsWith(":0") === isCantrip).length;
        if (has) setSpells(lvl, mine.filter((x) => x !== key));
        else if (sameKind < limit) setSpells(lvl, [...mine, key]);
      };
      const build = (isCantrip: boolean, limit: number, title: string) => {
        if (limit <= 0) return;
        const picks = spellPicks(free.filter((sp) => (sp.level === 0) === isCantrip));
        const full = mine.filter((x) => x.endsWith(":0") === isCantrip).length >= limit;
        groups.push({
          label: title,
          cards: picks.map((p) => {
            const key = `${p.name}:${p.level}`;
            return { key, title: p.name, tag: p.level === 0 ? t("levelUp.flow.cantrip", "Cantrip") : t("levelUp.flow.spellLevel", "Level {n} spell", { n: p.level }), why: whyText(p.why), selected: mine.includes(key), disabled: full };
          }),
          onPick: (key) => toggle(key, isCantrip, limit),
        });
      };
      build(true, info.cantripSelectionCount, t("levelUp.flow.suggestedCantrips", "Suggested cantrips"));
      build(false, info.spellSelectionCount, t("levelUp.flow.suggestedSpells", "Suggested spells"));
      return groups.filter((g) => g.cards.length > 0);
    }
    return [];
  };

  /** Cards, then the full picker: folded behind "See all options" for one-pick screens. */
  const renderChoice = (info: LevelInfo, part: LevelPart) => {
    const groups = pickGroups(info, part);
    const key = `${info.level}-${part}`;
    const onePick = part === "subclass" || part === "asi";
    const pickedOther = onePick && !unfinishedItems.some((item) => item.level === info.level && partOfSection(item.sectionId) === part) && !groups.some((g) => g.cards.some((c) => c.selected));
    const fold = onePick && groups.length > 0 && !showAllFor[key] && !pickedOther;
    return (
      <div className="space-y-3">
        {groups.map((g) => <PickCards key={g.label} label={g.label} cards={g.cards} onPick={g.onPick} />)}
        {fold ? (
          <button
            type="button"
            onClick={() => setShowAllFor((prev) => ({ ...prev, [key]: true }))}
            className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"
          >
            {t("levelUp.flow.seeAll", "See all options")}
          </button>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("levelUp.flow.allOptions", "All options")}</div>
            )}
            {renderLevelCard(info, part)}
          </>
        )}
      </div>
    );
  };

  const renderLevelCard = (info: LevelInfo, part: LevelPart) => (
    <LevelCard
      part={part}
      info={info}
      hpValue={hpValues[info.level] || 0}
      onHpChange={(v) => setHp(info.level, v)}
      asiSelection={asiSelections[info.level]}
      onAsiChange={(patch) => setAsi(info.level, patch)}
      baseScores={baseScores(info.level)}
      subclassSelection={subclassSelection}
      onSubclassSelect={handleSubclassSelect}
      subclassFeatureChoices={subclassFeatureChoices[info.level] || {}}
      onSubclassFeatureChoice={(name, value) =>
        setSubclassFeatureChoices((prev) => ({
          ...prev,
          [info.level]: { ...(prev[info.level] || {}), [name]: value },
        }))
      }
      classFeatureChoices={classFeatureChoices[info.level] || {}}
      onClassFeatureChoice={(name, value) =>
        setClassFeatureChoices((prev) => ({
          ...prev,
          [info.level]: { ...(prev[info.level] || {}), [name]: value },
        }))
      }
      spells={spellSelections[info.level] || []}
      onSpellsChange={(list) => setSpells(info.level, list)}
      magicalSecretsSpells={magicalSecretsSelections[info.level] || []}
      onMagicalSecretsChange={(list) => setMagicalSecrets(info.level, list)}
      subclassSpellSelections={subclassSpellSelections[info.level] || []}
      onSubclassSpellSelectionsChange={(list) => setSubclassSpells(info.level, list)}
      replacedSpell={replacedSpells[info.level] || ""}
      onReplacedSpellChange={(id) => setReplacedSpell(info.level, id)}
      circleTerrain={circleTerrainSelections[info.level] || ""}
      onCircleTerrainChange={(terrain) => setCircleTerrain(info.level, terrain)}
      bonusCantrip={bonusCantripSelections[info.level] || ""}
      onBonusCantripChange={(cantrip) => setBonusCantrip(info.level, cantrip)}
      character={{ ...character, subclassIndex: (subclassSelection || character.subclass || '').toLowerCase().replace(/\s+/g, '-') }}
      hitDie={hitDie}
      diceType={diceType}
      conMod={conMod}
      averageHp={averageHp}
      startFromLevelOne={startFromLevelOne}
      wizardCharacter={wizardCharacter}
      allSpellSelections={spellSelections}
      invocationSelections={invocationSelections[info.level] || []}
      onInvocationsChange={(list) => setInvocations(info.level, list)}
      replacedInvocation={replacedInvocations[info.level] || ""}
      onReplacedInvocationChange={(inv) => setReplacedInvocation(info.level, inv)}
      pactTomeCantrips={pactTomeCantrips}
      onPactTomeCantripsChange={setPactTomeCantrips}
      expertise={expertiseSelections[info.level] || []}
      onExpertiseChange={(list) => setExpertise(info.level, list)}
      allInvocationSelections={invocationSelections}
      pactBoon={pactBoon}
      sectionRefs={sectionRefs}
      takenSpells={takenSpells}
      allAsiFeats={Object.entries(asiSelections).flatMap(([l, st]) => (st?.mode === "feat" && st.feat ? [{ level: Number(l), feat: st.feat }] : []))}
    />
  );

  const upNext = [...new Set(steps.slice(idx + 1).filter((s) => s.part !== "recap" && s.part !== "moment").map((s) => partTitle(s.part)))];
  const levelsLabel = (levels: number[]) =>
    levels.length > 1
      ? t("levelUp.flow.levelsN", "Levels {from}–{to}", { from: levels[0], to: levels[levels.length - 1] })
      : t("levelUp.flow.levelN", "Level {level}", { level: levels[0] });
  const firstLevel = step.levels[0];
  const isStart = !!startFromLevelOne && step.levels.length === 1 && firstLevel === 1;
  const hpLevels = step.levels.filter((lvl) => !(startFromLevelOne && lvl === 1));
  const allAverage = hpLevels.length > 0 && hpLevels.every((lvl) => hpValues[lvl] === averageHp);
  const isLast = idx === steps.length - 1;
  const nextIsRecap = steps[idx + 1]?.part === "recap";

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
              <button onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-[var(--border-radius-sm)] border border-transparent hover:border-[var(--color-border)]">
                {t("wizard.cancel", "Cancel")}
              </button>
              <div className="text-xs font-semibold text-[var(--color-text-primary)]">{title ?? t("levelUp.title", "Level Up")}</div>
            <button
              type="button"
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
            >
              <Bell className="h-4 w-4" />
              {unfinishedItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {unfinishedItems.length}
                </span>
              )}
            </button>
          </div>
          {toastMessage && (
            <div className="mt-2 py-2 px-3 rounded-[var(--radius-sm)] bg-green-50 border border-green-200 text-center animate-fade-in">
              <span className="text-xs font-semibold text-green-700">{toastMessage}</span>
            </div>
          )}
          {subtitle && <div className="text-[10px] text-[var(--color-text-muted)] text-center mt-0.5">{subtitle}</div>}
          {idx === 0 && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => adjustTargetLevel(-1)}
              disabled={targetLevel <= effectiveMinLevel}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{targetLevel}</div>
               <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{t("levelUp.targetLevel", "Target Level")}</div>
            </div>
            <button
              type="button"
              onClick={() => adjustTargetLevel(1)}
              disabled={targetLevel >= effectiveMaxLevel}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          )}
        </div>
        <StatCard
          hp={preview.hp}
          ac={preview.ac}
          atk={showSpellStats ? preview.atk : undefined}
          dc={showSpellStats ? preview.dc : undefined}
          before={startFromLevelOne ? undefined : { hp: character.maxHp || 0, ac: before.ac ?? character.ac, atk: before.spellAttackBonus ?? 0, dc: before.spellSaveDc ?? 0 }}
          name={character.name}
          subtitle={`${character.class}${subclassSelection ? ` · ${subclassSelection}` : ""} · ${t("levelUp.flow.levelN", "Level {level}", { level: targetLevel })}`}
          t={t}
        />
      </div>

      {showNotifPanel && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifPanel(false)}>
          <div
            className="absolute right-4 top-16 w-80 max-h-[70vh] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{t("sheet.tasks", "Tasks")}</span>
              {unfinishedItems.length > 0 && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{unfinishedItems.length} {t("levelUp.unfinished", "unfinished")}</span>
              )}
            </div>
            <div className="p-2 space-y-1">
              {unfinishedItems.length === 0 ? (
                <div className="px-3 py-4 text-center">
                   <span className="text-xs text-green-600 font-semibold">{t("levelUp.allTasksComplete", "All tasks complete!")}</span>
                </div>
              ) : (
                 unfinishedItems.map((item, idx) => (
                   <button
                     key={idx}
                     type="button"
                      onClick={() => {
                        setShowNotifPanel(false);
                        goTo(stepIndexOf(item.level, partOfSection(item.sectionId)));
                        setTimeout(() => {
                          const el = sectionRefs.current[item.sectionId];
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                      }}
                     className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg)] transition-colors"
                   >
                     <span className="text-xs text-[var(--color-text-primary)]">{item.label}</span>
                   </button>
                 ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="px-4 py-5" style={{ paddingBottom: WIZARD_NAV_SPACE }}>
        <div className="mx-auto max-w-lg space-y-4">
          {step.part === "recap" ? (
            <>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{partTitle("recap")}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{partHint("recap")}</p>
              </div>
              {levelInfos.map((info) => (
                <div key={info.level} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {t("levelUp.flow.levelN", "Level {level}", { level: info.level })}
                  </div>
                  {(["moment", ...levelParts(info, subclassSelection, character.class)] as LevelPart[]).map((part) => {
                    const open = unfinishedItems.some((item) => item.level === info.level && partOfSection(item.sectionId) === part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => goTo(stepIndexOf(info.level, part))}
                        className="flex w-full items-center gap-3 border-t border-[var(--color-border)] px-4 py-2.5 text-left first-of-type:border-t-0 hover:bg-[var(--color-bg)]"
                      >
                        <span className="w-24 shrink-0 text-xs font-semibold text-[var(--color-text-secondary)]">
                          {recapLabel(part)}
                        </span>
                        <span className={`min-w-0 flex-1 truncate text-xs ${open ? "font-semibold text-red-500" : "text-[var(--color-text-primary)]"}`}>
                          {open ? t("levelUp.flow.notDone", "Not picked yet") : recapSummary(info.level, part)}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{t("common.change", "Change")}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {prepPlan && prepPlan.spells.length > 0 && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {t("levelUp.flow.recapPreparedTitle", "Spells ready to cast")}
                  </div>
                  <button type="button" onClick={() => setPreparingOpen(true)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-bg)]">
                    <span className="w-24 shrink-0 text-xs font-semibold text-[var(--color-text-secondary)]">{t("levelUp.flow.recapPrepared", "Prepared spells")}</span>
                    <span className="min-w-0 flex-1 text-xs text-[var(--color-text-primary)]">
                      {t("prepare.count", "{count} of {max} ready", { count: preparedNow.length, max: prepPlan.limit })}
                      <span className="block text-[11px] text-[var(--color-text-muted)]">{t("levelUp.flow.recapPreparedHint", "We picked a set for you. Tap to change it.")}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{t("common.change", "Change")}</span>
                  </button>
                  {preparingOpen && (
                    <PrepareSpellsSheet
                      spells={prepPlan.spells}
                      prepared={preparedNow}
                      limit={prepPlan.limit}
                      onChange={setPreparedOverride}
                      onClose={() => setPreparingOpen(false)}
                    />
                  )}
                </div>
              )}
            </>
          ) : stepInfos.length > 0 && step.part === "moment" ? (
            <>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center">
                <GiDiceTwentyFacesTwenty className="mx-auto h-12 w-12 text-[var(--color-text-primary)] levelup-pop" aria-hidden="true" />
                <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{partTitle("moment")}</div>
                <div className="text-3xl font-bold text-[var(--color-text-primary)]">{t("levelUp.flow.levelN", "Level {level}", { level: step.levels[step.levels.length - 1] })}</div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {isStart
                    ? t("levelUp.flow.startHint", "Here is what your class gives you at level 1.")
                    : step.levels.length > 1
                      ? t("levelUp.flow.jumpHint", "You gained {count} levels. Everything below comes for free.", { count: step.levels.length })
                      : partHint("moment")}
                </p>
                {hpLevels.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => hpLevels.forEach((lvl) => setHp(lvl, averageHp))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${allAverage ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]" : "border-[var(--color-border)] text-[var(--color-text-primary)]"}`}
                    >
                      {hpLevels.length > 1
                        ? t("levelUp.flow.takeAverageAll", "Take average (+{hp} HP each level)", { hp: averageHp })
                        : t("levelUp.flow.takeAverage", "Take average (+{hp} HP)", { hp: averageHp })}
                    </button>
                    <button
                      type="button"
                      onClick={() => hpLevels.forEach((lvl) => rollHp(lvl))}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-active)]"
                    >
                      {hpLevels.length > 1
                        ? t("levelUp.flow.rollAll", "Roll d{die} for each level", { die: hitDie })
                        : t("levelUp.flow.rollInstead", "Roll d{die} instead", { die: hitDie })}
                    </button>
                  </div>
                )}
              </div>
              {stepInfos.map((info) => <div key={info.level}>{renderLevelCard(info, "moment")}</div>)}
              {upNext.length > 0 && (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("levelUp.flow.upNext", "Up next")}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-primary)]">{upNext.join(" · ")}</div>
                </div>
              )}
            </>
          ) : stepInfos.length > 0 ? (
            <>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t("levelUp.flow.stepOf", "Step {n} of {total} · {levels}", { n: idx + 1, total: steps.length, levels: levelsLabel(step.levels) })}
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{partTitle(step.part)}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {step.part === "spells" && step.levels.length > 1
                    ? t("levelUp.flow.spellsJumpHint", "Pick the spells your character learns, level by level from the top.")
                    : partHint(step.part)}
                </p>
              </div>
              {stepInfos.map((info) => <div key={info.level}>{renderChoice(info, step.part as LevelPart)}</div>)}
            </>
          ) : null}
        </div>
      </main>

      <WizardNav
        onBack={idx === 0 ? onCancel : () => goTo(idx - 1)}
        onNext={isLast ? handleFinish : () => goTo(idx + 1)}
        backLabel={idx === 0 ? t("wizard.cancel", "Cancel") : t("common.back", "Back")}
        nextLabel={isLast ? t("levelUp.flow.save", "Save character") : nextIsRecap ? t("levelUp.flow.review", "Review") : t("common.next", "Next")}
        blockedLabel={step.part === "recap" ? t("levelUp.flow.finishPicks", "Finish the red rows first") : undefined}
        canProceed={stepComplete}
        showBack={true}
      />
    </div>
  );
}

/** Sticky character card. A stat glows when its value changes. */
function StatCard({ hp, ac, atk, dc, before, name, subtitle, t }: {
  hp: number; ac: number; atk?: number; dc?: number;
  before?: { hp: number; ac: number; atk: number; dc: number };
  name?: string; subtitle: string;
  t: (key: string, fb?: string, params?: Record<string, string | number>) => string;
}) {
  const stats: { key: string; label: string; value: string; diff: number }[] = [
    { key: "hp", label: t("levelUp.flow.hp", "HP"), value: String(hp), diff: before ? hp - before.hp : 0 },
    { key: "ac", label: t("levelUp.flow.ac", "AC"), value: String(ac), diff: before ? ac - before.ac : 0 },
  ];
  if (atk !== undefined) stats.push({ key: "atk", label: t("levelUp.flow.spellAttack", "Spell atk"), value: `${atk >= 0 ? "+" : ""}${atk}`, diff: before ? atk - before.atk : 0 });
  if (dc !== undefined) stats.push({ key: "dc", label: t("levelUp.flow.saveDc", "Save DC"), value: String(dc), diff: before ? dc - before.dc : 0 });
  return (
    <div className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{name || "—"}</div>
          <div className="truncate text-[10px] text-[var(--color-text-muted)]">{subtitle}</div>
        </div>
        {stats.map((s) => (
          <div key={s.key} className="text-center">
            <div key={s.value} className="stat-glow rounded px-1 text-sm font-bold text-[var(--color-text-primary)]">{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {s.label}{s.diff !== 0 && <span className={s.diff > 0 ? "text-green-600" : "text-red-500"}> {s.diff > 0 ? "+" : ""}{s.diff}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LevelCardProps {
  info: LevelInfo;
  /** Show only this screen's sections. Leave out to show the whole level. */
  part?: LevelPart;
  hpValue: number;
  onHpChange: (v: number) => void;
  asiSelection?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> };
  onAsiChange: (patch: Partial<{ mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }>) => void;
  baseScores: Record<AbilityKey, number>;
  subclassSelection: string;
  onSubclassSelect: (name: string) => void;
  subclassFeatureChoices: Record<string, string>;
  onSubclassFeatureChoice: (name: string, value: string) => void;
  classFeatureChoices: Record<string, string>;
  onClassFeatureChoice: (name: string, value: string) => void;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
  magicalSecretsSpells: string[];
  onMagicalSecretsChange: (list: string[]) => void;
  subclassSpellSelections: string[];
  onSubclassSpellSelectionsChange: (list: string[]) => void;
  replacedSpell: string;
  onReplacedSpellChange: (id: string) => void;
  circleTerrain: string;
  onCircleTerrainChange: (terrain: string) => void;
  bonusCantrip: string;
  onBonusCantripChange: (cantrip: string) => void;
  character: Character;
  hitDie: number;
  diceType: any;
  conMod: number;
  averageHp: number;
  startFromLevelOne?: boolean;
  wizardCharacter: Character;
  allSpellSelections: Record<number, string[]>;
  invocationSelections: string[];
  onInvocationsChange: (list: string[]) => void;
  replacedInvocation: string;
  onReplacedInvocationChange: (inv: string) => void;
  pactTomeCantrips: string[];
  onPactTomeCantripsChange: (list: string[]) => void;
  expertise: string[];
  onExpertiseChange: (list: string[]) => void;
  allInvocationSelections?: Record<number, string[]>;
  pactBoon?: string;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  takenSpells: Set<string>;
  /** Feats picked at every ASI of this level-up, so the same feat isn't taken twice. */
  allAsiFeats: { level: number; feat: string }[];
}

function LevelCard({
  info,
  hpValue,
  onHpChange,
  asiSelection,
  onAsiChange,
  baseScores,
  subclassSelection,
  onSubclassSelect,
  subclassFeatureChoices,
  onSubclassFeatureChoice,
  classFeatureChoices,
  onClassFeatureChoice,
  spells,
  onSpellsChange,
  magicalSecretsSpells,
  onMagicalSecretsChange,
  subclassSpellSelections,
  onSubclassSpellSelectionsChange,
  replacedSpell,
  onReplacedSpellChange,
  circleTerrain,
  onCircleTerrainChange,
  bonusCantrip,
  onBonusCantripChange,
  character,
  hitDie,
  diceType,
  conMod,
  averageHp,
  startFromLevelOne,
  wizardCharacter,
  allSpellSelections,
  invocationSelections,
  onInvocationsChange,
  replacedInvocation,
  onReplacedInvocationChange,
  pactTomeCantrips,
  onPactTomeCantripsChange,
  expertise,
  onExpertiseChange,
  allInvocationSelections,
  pactBoon,
  sectionRefs,
  takenSpells,
  allAsiFeats,
  part,
}: LevelCardProps) {
    const show = (p: LevelPart) => !part || part === p;
    const spellsPart: LevelPart = levelParts(info, subclassSelection, character.class).includes("spells") ? "spells" : "moment";
    const { language, tDesc } = useLanguage();
    const dict = language === "id" ? idTranslations : enTranslations;
    const t = useCallback((key: string, fb?: string, params?: Record<string, string | number>) => {
      let text = (dict as Record<string, string>)[key] || fb || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    }, [dict]);
    const [infoState, setInfoState] = useState<{title: string; description: string; descKey?: string} | null>(null);

    const [showSpellSelection, setShowSpellSelection] = useState(false);
    const [showSubclassDetails, setShowSubclassDetails] = useState<string | null>(null);
    const [showSubclassModal, setShowSubclassModal] = useState(false);
    const [showSpellModal, setShowSpellModal] = useState(false);
    const [spellModalMode, setSpellModalMode] = useState<"all" | "cantrips" | "spells">("all");
    const [showTerrainModal, setShowTerrainModal] = useState(false);
    const [showBonusCantripModal, setShowBonusCantripModal] = useState(false);
    const [showFeaturePopup, setShowFeaturePopup] = useState<{ name: string; description: string; options: { name: string; description: string; icon?: string }[]; isSubclass: boolean; count?: number } | null>(null);
    const [featureSelections, setFeatureSelections] = useState<string[]>([]);
    const [showHumanoidPopup, setShowHumanoidPopup] = useState<{ featureName: string; level: number } | null>(null);
    const [humanoidSelections, setHumanoidSelections] = useState<string[]>([]);

    const getAllSelectedMetamagic = useCallback(() => {
      const selected = new Set<string>();
      (Object.values(classFeatureChoices) as unknown as Record<string, string>[]).forEach((choices) => {
        const metamagic = choices["Metamagic"];
        if (metamagic) {
          metamagic.split(", ").forEach((opt) => selected.add(opt));
        }
      });
      (Object.values(subclassFeatureChoices) as unknown as Record<string, string>[]).forEach((choices) => {
        const metamagic = choices["Metamagic"];
        if (metamagic) {
          metamagic.split(", ").forEach((opt) => selected.add(opt));
        }
      });
      return selected;
    }, [classFeatureChoices, subclassFeatureChoices]);
    const [showSpellMasteryModal, setShowSpellMasteryModal] = useState(false);
    const [spellMasterySelections, setSpellMasterySelections] = useState<string[]>([]);
    const [showSignatureSpellsModal, setShowSignatureSpellsModal] = useState(false);
    const [signatureSpellsSelections, setSignatureSpellsSelections] = useState<string[]>([]);
    const [showAsiModal, setShowAsiModal] = useState(false);
    const [asiAllocation, setAsiAllocation] = useState<Record<AbilityKey, number>>({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    const [showAsiFeatModal, setShowAsiFeatModal] = useState(false);
    const [showExpertiseModal, setShowExpertiseModal] = useState(false);
    const lvl = info.level;
    const { data } = useSRD();
  const srdSpells = data?.spells || [];

  const isHpComplete = (lvl === 1 && startFromLevelOne) || hpValue > 0;
  const isAsiComplete = !info.asi || (asiSelection?.mode === "single" && !!asiSelection?.single) || (asiSelection?.mode === "double" && !!asiSelection?.d1 && !!asiSelection?.d2 && asiSelection?.d1 !== asiSelection?.d2) || (asiSelection?.mode === "feat" && !!asiSelection?.feat);
  const isSubclassComplete = !info.subclassOptions || !!subclassSelection;
  const isFeatureChoicesComplete = !info.subclassFeatureChoices || info.subclassFeatureChoices.every((fc) => subclassFeatureChoices[fc.name]);
  const isClassFeatureChoicesComplete = !info.classFeatureChoices || info.classFeatureChoices.every((fc) => classFeatureChoices[fc.name]);
  const isExpertiseComplete = !info.expertise || expertise.length >= info.expertise.count;
  const isSpellSelectionComplete = !info.hasSpellSelection || (() => {
    const lvlSpells = (allSpellSelections || {})[lvl] || [];
    const cantripsCount = lvlSpells.filter((s: string) => s.endsWith(":0")).length;
    const spellsCount = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
    return cantripsCount >= info.cantripSelectionCount && spellsCount >= info.spellSelectionCount;
  })();
  const isComplete = isHpComplete && isAsiComplete && isSubclassComplete && isFeatureChoicesComplete && isClassFeatureChoicesComplete && isExpertiseComplete && isSpellSelectionComplete;

  const setSectionRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  const sectionClass = (id: string, isIncomplete: boolean) =>
    `flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${isIncomplete ? "border border-red-400 bg-red-50/30" : ""}`;

  const totalAsiPoints = Object.values(asiAllocation).reduce((sum, val) => sum + val, 0);
  const canApplyAsi = asiSelection?.mode === "feat" ? !!asiSelection?.feat : totalAsiPoints === 2;

  const openAsiModal = () => {
    const sel = asiSelection;
    const alloc: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (sel?.mode !== "feat") {
      if (sel?.mode === "single" && sel.single) alloc[sel.single] = 2;
      if (sel?.mode === "double") {
        if (sel.d1) alloc[sel.d1] = 1;
        if (sel.d2) alloc[sel.d2] = 1;
      }
    }
    setAsiAllocation(alloc);
    setShowAsiModal(true);
  };

  const allocateAsiPoint = (key: AbilityKey) => {
    setAsiAllocation((prev) => {
      const current = prev[key] || 0;
      if (current >= 2) return prev;
      if (totalAsiPoints >= 2) return prev;
      return { ...prev, [key]: current + 1 };
    });
  };

  const removeAsiPoint = (key: AbilityKey) => {
    setAsiAllocation((prev) => {
      const current = prev[key] || 0;
      if (current <= 0) return prev;
      return { ...prev, [key]: current - 1 };
    });
  };

  const applyAsi = () => {
    if (!canApplyAsi) return;
    if (asiSelection?.mode === "feat" && asiSelection.feat) {
      onAsiChange({ mode: "feat", feat: asiSelection.feat });
    } else {
      let mode: "single" | "double" = "single";
      let single: AbilityKey | undefined;
      let d1: AbilityKey | undefined;
      let d2: AbilityKey | undefined;
      const entries = Object.entries(asiAllocation).filter(([, v]) => v > 0) as [AbilityKey, number][];
      if (entries.length === 1 && entries[0][1] === 2) {
        mode = "single";
        single = entries[0][0];
      } else if (entries.length === 2 && entries[0][1] === 1 && entries[1][1] === 1) {
        mode = "double";
        d1 = entries[0][0];
        d2 = entries[1][0];
      }
      onAsiChange({ mode, single, d1, d2 });
    }
    setShowAsiModal(false);
  };

  return (
    <div className={`rounded-[var(--radius-md)] border transition-all ${
      isComplete
        ? "border-green-300 bg-green-50/30"
        : "border-[var(--color-border)] bg-[var(--color-surface)]"
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Level {lvl}
          </h3>
          {isComplete && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" /> {t("levelUp.complete", "Complete")}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {show("moment") && (
          <div ref={setSectionRef(`hp-${lvl}`)} className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Heart className={`h-4 w-4 ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
               <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.hitPoints", "Hit Points")}</div>
              <div className="text-xs text-[var(--color-text-primary)]">
                 <RichInline text={lvl === 1 && startFromLevelOne
                   ? `${hitDie} + ${conMod >= 0 ? conMod : `-${Math.abs(conMod)}`} = ${hitDie + conMod} HP (${t("common.automatic", "automatic")})`
                  : `d${hitDie} ${conMod >= 0 ? `+ ${conMod}` : `- ${Math.abs(conMod)}`} (avg: ${averageHp})`} />
              </div>
            </div>
            {lvl === 1 && startFromLevelOne ? (
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{hitDie + conMod} HP</span>
            ) : (
              <input
                type="number"
                value={hpValue || ""}
                onChange={(e) => onHpChange(parseInt(e.target.value || "0", 10))}
                className={`w-16 text-center text-sm font-bold rounded-[var(--radius-sm)] border px-2 py-1 ${!isHpComplete ? "border-red-300 bg-white" : "border-[var(--color-border)]"}`}
                placeholder={String(averageHp)}
              />
            )}
          </div>
          )}

           {show("moment") && (
           <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
             <Star className="h-4 w-4 text-[var(--color-text-muted)]" />
             <div className="flex-1">
               <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.proficiencyBonus", "Proficiency Bonus")}</div>
               <div className="text-xs text-[var(--color-text-primary)]">+{info.proficiencyBonus}</div>
             </div>
           </div>
           )}

           {show("features") && info.expertise && info.expertise.count > 0 && (() => {
             const expCount = info.expertise.count;
             const selectedCount = expertise.length;
             const isComplete = selectedCount >= expCount;
             const availableOptions = info.expertise.availableOptions || [];
             return (
               <div className={`flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${!isComplete ? "border border-red-400 bg-red-50/30" : ""}`}>
                 <Target className={`h-4 w-4 ${!isComplete ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
                 <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.expertise", "Expertise")}</div>
                    <div className={`text-xs ${!isComplete ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                      {t("creator.expertiseHint", "Choose")} {expCount} {t("creator.skill", "skill")}{expCount !== 1 ? t("creator.skillPlural", "s") : ""} {t("creator.toDoubleProficiency", "to double proficiency")}
                      {selectedCount > 0 && <span className="ml-1">({selectedCount}/{expCount} selected)</span>}
                   </div>
                   {selectedCount > 0 && (
                     <div className="text-[10px] text-[var(--color-text-primary)] mt-0.5">
                       {expertise.join(", ")}
                     </div>
                   )}
                 </div>
                 <button
                   type="button"
                   onClick={() => { setShowExpertiseModal(true); }}
                   className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${!isComplete ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                  >
                    {isComplete ? t("common.change", "Change") : t("common.select", "Select")}
                  </button>
               </div>
             );
           })()}

          {show("moment") && info.classFeatures.length > 0 && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Sword className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.classFeatures", "Class Features")}</div>
                <div className="space-y-1 mt-1">
                  {info.classFeatures.map((f) => (
                    <div key={f.name} className="text-xs text-[var(--color-text-primary)]">
                      <span className="font-semibold">{f.name}:</span> {f.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

            {show("moment") && info.features.length > 0 && (
              <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                <Lightning className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("levelUp.newFeatures", "New Features")}</div>
                  <div className="space-y-2 mt-1">
                    {info.features.map((f) => (
                      <div key={f.name}>
                         <div className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                           {f.source && f.source !== "PHB" && <SourceBadge source={f.source} />}
                           <span className="font-semibold">{f.name}</span>
{f.description && (
                              <button
                                type="button"
                                onClick={() => setInfoState({ title: f.name, description: f.description, descKey: `feature.desc.${slugify(f.name)}` })}
                                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                                aria-label={`Info: ${f.name}`}
                              >
                                <InfoIcon className="h-4 w-4" />
                              </button>
                            )}
                            {infoState?.title === f.name && (
                              <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                                <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{f.name}</h3>
                                    <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                      <XIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(f.description)) : f.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                                   <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                                </div>
                              </div>
                            )}
                         </div>
                         {(f.summary || f.description) && (
                           <p className={`mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)] ${f.summary ? "" : "line-clamp-2"}`}><RichInline text={f.summary || f.description} /></p>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {show("asi") && info.asi && (
              <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                <ChartBar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("creator.abilityScoreImprovement", "Ability Score Improvement")}</div>
                  <button
                    type="button"
                    onClick={openAsiModal}
                    className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                  >
                    <span>
                      {asiSelection?.mode === "feat" && asiSelection.feat
                        ? t("levelUp.asiFeatPrefix", "Feat: {feat}", { feat: asiSelection.feat })
                        : asiSelection?.mode === "single" && asiSelection.single
                          ? `+2 ${asiSelection.single.toUpperCase()}`
                          : asiSelection?.mode === "double" && asiSelection.d1 && asiSelection.d2
                            ? `+1 ${asiSelection.d1.toUpperCase()}, +1 ${asiSelection.d2.toUpperCase()}`
                            : t("levelUp.selectAbilityScores", "Select ability scores...")}
                    </span>
                    <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>
            )}

          {show("moment") && info.spellSlots && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Sparkle className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellSlots", "Spell Slots")}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(info.spellSlots).map(([level, count]) => (
                    <span key={level} className="text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                      {level}{Number(level) === 1 ? "st" : Number(level) === 2 ? "nd" : Number(level) === 3 ? "rd" : "th"}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {show(spellsPart) && info.cantripsKnown !== undefined && (() => {
            const lvlSpells = (allSpellSelections || {})[lvl] || [];
            const selectedCantrips = lvlSpells.filter((s: string) => s.endsWith(":0")).length;
            const higherCantrips = Object.entries(allSpellSelections || {})
              .filter(([l]) => Number(l) > lvl)
              .flatMap(([, s]: [string, string[]]) => s)
              .filter((s: string) => s.endsWith(":0"))
              .map((s: string) => s.split(":")[0]);
            const needCantrips = info.cantripSelectionCount > 0 && selectedCantrips < info.cantripSelectionCount;
            const cantripColor = info.cantripSelectionCount > 0 && selectedCantrips < info.cantripSelectionCount ? "text-red-500" : "text-[var(--color-text-primary)]";
            return (
              <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needCantrips ? "border border-red-400 bg-red-50/30" : ""}`}>
                <MagicWand className={`h-4 w-4 ${needCantrips ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.cantripsKnown", "Cantrips Known")}</div>
                  <div className={`text-xs ${cantripColor}`}>
                    {info.cantripsKnown}
                    {info.cantripSelectionCount > 0 && (
                      <span className="ml-1">({selectedCantrips}/{info.cantripSelectionCount} selected)</span>
                    )}
                  </div>
                  {higherCantrips.length > 0 && (
                   <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                     {t("sheet.fromHigherLevel", "From higher")}: {higherCantrips.join(", ")}
                   </div>
                  )}
                </div>
                {info.cantripSelectionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpellModalMode("cantrips"); setShowSpellModal(true); }}
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needCantrips ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                   >
                     {t("common.select", "Select")}
                   </button>
                )}
              </div>
            );
          })()}

          {show(spellsPart) && info.spellsKnown !== undefined && (() => {
            const lvlSpells = (allSpellSelections || {})[lvl] || [];
            const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
            const higherSpells = Object.entries(allSpellSelections || {})
              .filter(([l]) => Number(l) > lvl)
              .flatMap(([, s]: [string, string[]]) => s)
              .filter((s: string) => !s.endsWith(":0"))
              .map((s: string) => s.split(":")[0]);
            const needSpells = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
            const spellColor = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount ? "text-red-500" : "text-[var(--color-text-primary)]";
            return (
              <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needSpells ? "border border-red-400 bg-red-50/30" : ""}`}>
                <Book className={`h-4 w-4 ${needSpells ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellsKnown", "Spells Known")}</div>
                  <div className={`text-xs ${spellColor}`}>
                    {info.spellsKnown}
                    {info.spellSelectionCount > 0 && (
                      <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} selected)</span>
                    )}
                    {info.spellsKnownChanged && info.prevSpellsKnown !== undefined && !info.spellSelectionCount && (
                      <span className="ml-1 text-green-600">(+{info.spellsKnown - info.prevSpellsKnown})</span>
                    )}
                  </div>
                  {higherSpells.length > 0 && (
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      From higher: {higherSpells.join(", ")}
                    </div>
                  )}
                </div>
                {info.spellSelectionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needSpells ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                   >
                     {t("common.select", "Select")}
                   </button>
                )}
              </div>
            );
          })()}

          {show(spellsPart) && info.spellbookTotal !== undefined && (() => {
            const lvlSpells = (allSpellSelections || {})[lvl] || [];
            const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
            const higherSpells = Object.entries(allSpellSelections || {})
              .filter(([l]) => Number(l) > lvl)
              .flatMap(([, s]: [string, string[]]) => s)
              .filter((s: string) => !s.endsWith(":0"))
              .map((s: string) => s.split(":")[0]);
            const needSpells = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
            return (
              <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needSpells ? "border border-red-400 bg-red-50/30" : ""}`}>
                <Book className={`h-4 w-4 ${needSpells ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellbook", "Spellbook")}</div>
                  <div className={`text-xs ${needSpells ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                    {info.spellbookTotal} spells
                    {info.spellSelectionCount > 0 && (
                      <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} to add)</span>
                    )}
                  </div>
                  {higherSpells.length > 0 && (
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      From higher: {higherSpells.join(", ")}
                    </div>
                  )}
                </div>
                {info.spellSelectionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needSpells ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                   >
                     {t("common.select", "Select")}
                   </button>
                )}
              </div>
            );
          })()}

          {show(spellsPart) && info.maxPrepared !== undefined && (() => {
            const lvlSpells = (allSpellSelections || {})[lvl] || [];
            const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
            const higherSpells = Object.entries(allSpellSelections || {})
              .filter(([l]) => Number(l) > lvl)
              .flatMap(([, s]: [string, string[]]) => s)
              .filter((s: string) => !s.endsWith(":0"))
              .map((s: string) => s.split(":")[0]);
            const needPrepare = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
            return (
              <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needPrepare ? "border border-red-400 bg-red-50/30" : ""}`}>
                <Book className={`h-4 w-4 ${needPrepare ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.prepareSpells", "Prepare Spells")}</div>
                  <div className={`text-xs ${needPrepare ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                    {info.maxPrepared} spells preparable
                    {info.spellSelectionCount > 0 && (
                      <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} selected)</span>
                    )}
                  </div>
                  {higherSpells.length > 0 && (
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      From higher: {higherSpells.join(", ")}
                    </div>
                  )}
                </div>
                {info.spellSelectionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needPrepare ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                   >
                     {t("common.select", "Select")}
                   </button>
                )}
              </div>
            );
          })()}

          {show("subclass") && info.subclassOptions && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Crown className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                 <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("creator.chooseSubclass", "Choose Subclass")}</div>
                <button
                  type="button"
                  onClick={() => setShowSubclassModal(true)}
                  className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
                >
                   {subclassSelection ? `${t("creator.selectedSubclass", "Selected subclass")}: ${subclassSelection}` : t("creator.selectSubclass", "Select Subclass")}
                </button>
              </div>
            </div>
          )}

          {show("features") && ((info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection) || (info.classFeatureChoices && info.classFeatureChoices.length > 0)) ? (
            <div className="space-y-3">
              {info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection && (
                info.subclassFeatureChoices.map((fc) => (
                  <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                     <div className="flex items-center gap-2 mb-1">
                       <Crown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                       <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
{fc.description && (
                          <button
                            type="button"
                            onClick={() => setInfoState({ title: fc.name, description: fc.description, descKey: `feature.desc.${slugify(fc.name)}` })}
                            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                            aria-label={`Info: ${fc.name}`}
                          >
                            <InfoIcon className="h-4 w-4" />
                          </button>
                        )}
                        {infoState?.title === fc.name && (
                          <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                            <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{fc.name}</h3>
                                <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(fc.description)) : fc.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                              <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                            </div>
                          </div>
                        )}
                     </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">{t("levelUp.subclassLevel", "Subclass · Level {level}", { level: info.level })}</div>
                      <button
                        type="button"
                        onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ ...fc, isSubclass: true, count: fc.count }); }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                       >
                        <span>{subclassFeatureChoices[fc.name] || t("creator.selectOption", "Select an option...")}</span>
                       <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                     </button>
                  </div>
                ))
              )}
              {info.classFeatureChoices && info.classFeatureChoices.length > 0 && (
                info.classFeatureChoices
                  .filter((fc) => fc.name !== "Pact Boon" && fc.name !== "Eldritch Invocations")
                  .map((fc) => {
                    const isMetamagic = fc.name === "Metamagic";
                    const availableOptions = isMetamagic
                      ? (() => {
                          const selected = getAllSelectedMetamagic();
                          return fc.options.filter((opt) => !selected.has(opt.name));
                        })()
                      : fc.options;
                    const currentValue = classFeatureChoices[fc.name] || "";
                    const currentValues = currentValue.split(", ").filter(Boolean);
                    const maxCount = fc.count || 1;

                    return (
                      <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                         <div className="flex items-center gap-2 mb-1">
                           <Sword className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                           <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
{fc.description && (
                              <button
                                type="button"
                                onClick={() => setInfoState({ title: fc.name, description: fc.description, descKey: `feature.desc.${slugify(fc.name)}` })}
                                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                                aria-label={`Info: ${fc.name}`}
                              >
                                <InfoIcon className="h-4 w-4" />
                              </button>
                            )}
                            {infoState?.title === fc.name && (
                              <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                                <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{fc.name}</h3>
                                    <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                      <XIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(fc.description)) : fc.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                                   <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                                </div>
                              </div>
                            )}
                         </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">{t("levelUp.classLevel", "Class · Level {level}", { level: info.level })}</div>
                        {maxCount > 1 ? (
                          <FeatureChipSelector
                            name={fc.name}
                            description={fc.description}
                            options={availableOptions.map((opt) => ({ name: opt.name, description: opt.description, icon: opt.icon }))}
                            selectedValues={currentValues}
                            maxCount={maxCount}
                            onChange={(values) => onClassFeatureChoice(fc.name, values.join(", "))}
                            isSubclass={false}
                            takenSpells={takenSpells}
                />
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ ...fc, options: availableOptions, isSubclass: false, count: fc.count }); }}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                          >
                            <span>{currentValue || t("creator.selectOption", "Select an option...")}</span>
                            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          ) : null}

          {show("features") && character.class === "Wizard" && info.level === 18 && (() => {
            const spellMasterySelection = classFeatureChoices["Spell Mastery"] || "";
            return (
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkle className="h-3.5 w-3.5 text-amber-600" />
                   <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.spellMastery", "Spell Mastery")}</span>
                 </div>
                 <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.spellMasteryHint", "Choose one 1st-level and one 2nd-level spell to cast at will without spell slots.")}</p>
                <button
                  type="button"
                  onClick={() => { setSpellMasterySelections([]); setShowSpellMasteryModal(true); }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                  <span>{spellMasterySelection || t("levelUp.selectSpells", "Select {count} spells...", { count: 2 })}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
            );
          })()}

          {show("features") && character.class === "Warlock" && info.level === 3 && subclassSelection && (() => {
            const pactBoon = classFeatureChoices["Pact Boon"] || "";
            return (
              <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-3.5 w-3.5 text-purple-600" />
                   <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.pactBoon", "Pact Boon")}</span>
                 </div>
                 <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.pactBoonGift", "Your patron bestows a gift. Choose one.")}</p>
                <button
                  type="button"
                  onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ name: "Pact Boon", description: "", options: getPactBoons().filter((b: any) => b.source !== "TCE" || usesOptionalClassFeatures(character)).map(b => ({ name: b.name, description: b.description })), isSubclass: false, count: 1 }); }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                   <span>{pactBoon || t("levelUp.selectPactBoon", "Select Pact Boon...")}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
                {pactBoon === "Pact of the Tome" && (
                  <div className="mt-3">
                     <p className="text-[10px] font-semibold text-purple-700 mb-1">{t("spell.chooseCantripsFromAnyClass", "Choose 3 Cantrips from Any Class:")}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {pactTomeCantrips.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-100 border border-purple-300 rounded-full text-purple-800">
                          {c}
                          <button type="button" onClick={() => onPactTomeCantripsChange(pactTomeCantrips.filter(x => x !== c))} className="hover:text-red-600 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                    <FeatureChipSelector
                       name="Book of Shadows"
                       description={t("spell.pactTomeCantripsHint", "Choose three cantrips from any class. They don't count against your cantrips known.")}
                      options={getStaticSpells(character.sources, undefined, language)
                        .filter((s) => s.level === 0 && !pactTomeCantrips.includes(s.name))
                        .map((s) => ({ name: s.name, description: s.school || "" }))}
                      selectedValues={pactTomeCantrips}
                      maxCount={3}
                      onChange={onPactTomeCantripsChange}
                      isSubclass={false}
                      takenSpells={takenSpells}
                />
                  </div>
                )}
                {pactBoon === "Pact of the Chain" && (
                  <div className="mt-2">
                    <p className="text-[10px] text-[var(--color-text-muted)]">{t("spell.familiarForms", "Special familiar forms available: imp, pseudodragon, quasit, sprite")}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {show("features") && character.class === "Warlock" && info.level >= 3 && !subclassSelection && (
            <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.pactBoonRequired", "Pact Boon Required")}</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("creator.pactBoonHint", "Choose your subclass (Otherworldly Patron) first to unlock Pact Boon selection.")}</p>
            </div>
          )}

          {show("features") && character.class === "Warlock" && info.level >= 2 && (() => {
            const invocationFeature = info.classFeatureChoices?.find(fc => fc.name === "Eldritch Invocations");
            if (!invocationFeature) return null;
            const currentInvocations = invocationSelections;
            const invocationCount = invocationFeature.count || 1;
            const knowsEldritchBlast =
              (character.cantrips || []).some((c) => c.name === "Eldritch Blast") ||
              (character.spells || []).some((sp) => sp.name === "Eldritch Blast") ||
              Object.entries(allSpellSelections || {}).some(([l, list]) => Number(l) <= info.level && list.includes("Eldritch Blast:0"));
            const availableInvocations = getAvailableInvocations(info.level, pactBoon || "", currentInvocations, knowsEldritchBlast, character.sources, usesOptionalClassFeatures(character));
            const priorInvocations = Object.entries(allInvocationSelections || {}).filter(([l]) => Number(l) < info.level).flatMap(([, invs]) => invs);
            const hasPriorInvocations = info.level > 2 && priorInvocations.length > 0;

            return (
              <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
                 <div className="flex items-center gap-2 mb-1">
                   <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
                   <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.eldritchInvocations", "Eldritch Invocations")}</span>
                 </div>
                 <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.invocationCountHint", "Invocations to choose: {count}. Spell slots recover on a short rest.", { count: invocationCount })}</p>
                <FeatureChipSelector
                  name="Eldritch Invocations"
                  description={t("spell.chooseInvocations", "Invocations to choose: {count}", { count: invocationCount })}
                   options={availableInvocations.map((i) => ({
                     name: i.name,
                     description: i.available ? t("spell.availableAtLevel", "Available at level {level}", { level: info.level }) : i.reason || t("common.notAvailable", "Not available"),
                     disabled: !i.available,
                     unavailableReason: i.reason,
                  }))}
                  selectedValues={currentInvocations}
                  maxCount={invocationCount}
                  onChange={onInvocationsChange}
                  isSubclass={false}
                  takenSpells={takenSpells}
                />
                {hasPriorInvocations && info.level > 2 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-orange-700 mb-1">{t("spell.replaceInvocation", "Replace an invocation (optional):")}</p>
                    <button
                      type="button"
                      onClick={() =>
                       setShowFeaturePopup({
                           name: "__replace_invocation__",
                           description: t("spell.replaceInvocationHint", "Choose an existing invocation to replace."),
                           options: priorInvocations.map((inv) => ({ name: inv, description: t("spell.replaceInvocationOption", "Replace {name}", { name: inv }) })),
                          isSubclass: false,
                          count: 1,
                        })
                      }
                      className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                    >
                       <span>{replacedInvocation || t("common.noReplacement", "No replacement")}</span>
                      <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                    </button>
                    {replacedInvocation && (
                      <button
                        type="button"
                        onClick={() => onReplacedInvocationChange("")}
                         className="mt-1 text-[10px] text-[var(--color-error-600)] hover:underline"
                       >
                         {t("common.clearReplacement", "Clear replacement")}
                       </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {show("spells") && info.magicalSecretsCount > 0 && (
            <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
               <div className="flex items-center gap-2 mb-1">
                 <Sparkle className="h-3.5 w-3.5 text-purple-600" />
                 <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.magicalSecrets", "Magical Secrets")}</span>
               </div>
               <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.magicalSecretsHint", "Choose {count} spells from any class", { count: info.magicalSecretsCount })}</p>
              <button
                type="button"
                onClick={() => setShowSpellModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                 <span>
                   {magicalSecretsSpells.length > 0
                     ? t("common.selectedCount", "{selected} of {total} selected", { selected: magicalSecretsSpells.length, total: info.magicalSecretsCount })
                     : t("levelUp.selectSpellsFromAnyClass", "Select {count} spells from any class...", { count: info.magicalSecretsCount })}
                 </span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
              {magicalSecretsSpells.length > 0 && (
                <div className="mt-2 space-y-1">
                  {magicalSecretsSpells.map((s) => {
                    const [name, level] = s.split(":");
                    return (
                      <div key={s} className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                        <span className="font-semibold">{name}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">Level {level}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {show("spells") && info.subclassSpellSelectionCount > 0 && (
            <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
               <div className="flex items-center gap-2 mb-1">
                 <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
                 <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.additionalMagicalSecrets", "Additional Magical Secrets")}</span>
               </div>
               <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.additionalMagicalSecretsHint", "Choose {count} spells from any class (Lore feature)", { count: info.subclassSpellSelectionCount })}</p>
              <button
                type="button"
                onClick={() => setShowSpellModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                 <span>
                   {subclassSpellSelections.length > 0
                     ? t("common.selectedCount", "{selected} of {total} selected", { selected: subclassSpellSelections.length, total: info.subclassSpellSelectionCount })
                     : t("levelUp.selectSpellsFromAnyClass", "Select {count} spells from any class...", { count: info.subclassSpellSelectionCount })}
                 </span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
              {subclassSpellSelections.length > 0 && (
                <div className="mt-2 space-y-1">
                  {subclassSpellSelections.map((s) => {
                    const [name, level] = s.split(":");
                    return (
                      <div key={s} className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                        <span className="font-semibold">{name}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">Level {level}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {show("spells") && info.canReplaceSpell && (
            <div className="p-3 rounded-lg border border-orange-300 bg-orange-50/30">
               <div className="flex items-center gap-2 mb-1">
                 <Book className="h-3.5 w-3.5 text-orange-600" />
                 <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.replaceKnownSpell", "Replace Known Spell")}</span>
               </div>
               <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.replaceKnownSpellHint", "Optionally replace one known spell with another from the {class} spell list", { class: character.class })}</p>
              <button
                type="button"
                onClick={() =>
                  setShowFeaturePopup({
                    name: "__replace_spell__",
                    description: `Optionally replace one known spell with another from the ${character.class} spell list`,
                    options: (character.spells || [])
                      .filter((s) => s.level > 0)
                      .map((s) => ({ name: s.id, description: `${s.name} (Level ${s.level})` })),
                    isSubclass: false,
                    count: 1,
                  })
                }
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                 <span>{replacedSpell ? (character.spells || []).find((s) => s.id === replacedSpell)?.name || t("common.noReplacement", "No replacement") : t("common.noReplacement", "No replacement")}</span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
              {replacedSpell && (
                <button
                  type="button"
                  onClick={() => onReplacedSpellChange("")}
                  className="mt-1 text-[10px] text-[var(--color-error-600)] hover:underline"
                >
                  {t("common.clearReplacement", "Clear replacement")}
                </button>
              )}
            </div>
          )}

          {show("spells") && info.bonusCantripSelection && (
            <div className="p-3 rounded-lg border border-teal-300 bg-teal-50/30">
               <div className="flex items-center gap-2 mb-1">
                 <MagicWand className="h-3.5 w-3.5 text-teal-600" />
                 <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.bonusCantrip", "Bonus Cantrip")}</span>
               </div>
               <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.bonusCantripHint", "Choose one additional druid cantrip (does not count against cantrip limit)")}</p>
              <button
                type="button"
                onClick={() => setShowBonusCantripModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                 <span>{bonusCantrip || t("spell.selectCantrip", "Select cantrip...")}</span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
            </div>
          )}

          {show("features") && info.circleTerrainSelection && (
            <div className="p-3 rounded-lg border border-green-300 bg-green-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.circleSpellsTitle", "Circle Spells - Choose Terrain")}</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("creator.circleSpellsHint", "Choose your terrain type to gain circle spells (always prepared, do not count against limit)")}</p>
              <button
                type="button"
                onClick={() => setShowTerrainModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                 <span>{circleTerrain ? circleTerrain.charAt(0).toUpperCase() + circleTerrain.slice(1) : t("creator.chooseTerrain", "Select terrain...")}</span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
              {circleTerrain && (() => {
                const circleSpells = getCircleSpells(circleTerrain, info.level);
                const spellsForLevel = circleSpells.filter((name) => {
                  const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
                  return spell && spell.level <= info.maxSpellLevel;
                });
                if (spellsForLevel.length === 0) return null;
                return (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
                     <p className="text-[10px] text-green-700 font-semibold mb-1">{t("creator.circleSpellsGained", "Circle Spells gained:")}</p>
                    <div className="flex flex-wrap gap-1">
                      {spellsForLevel.map((name) => (
                        <span key={name} className="text-[10px] font-bold text-green-600 bg-green-200 px-1.5 py-0.5 rounded">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {showSubclassDetails && (
        <SubclassDetailsModal
          subclass={showSubclassDetails}
          characterClass={character.class}
          onClose={() => setShowSubclassDetails(null)}
        />
      )}

      {showSubclassModal && info.subclassOptions && (
        <SubclassSelectionModal
          options={info.subclassOptions}
          selected={subclassSelection}
          characterClass={character.class}
          characterSources={character.sources}
          onSelect={(name) => { onSubclassSelect(name); setShowSubclassModal(false); }}
          onClose={() => setShowSubclassModal(false)}
        />
      )}

      {showSpellModal && info.hasSpellSelection && (
        <SpellSelectionModal
          key={`spell-modal-${lvl}`}
          character={{ ...character, subclassIndex: (subclassSelection || character.subclass || '').toLowerCase().replace(/\s+/g, '-') }}
          subclassSelection={subclassSelection}
          count={spellModalMode === "cantrips" ? 0 : info.spellSelectionCount}
          cantripCount={spellModalMode === "spells" ? 0 : info.cantripSelectionCount}
          maxLevel={info.maxSpellLevel}
          spells={spells}
          onSpellsChange={onSpellsChange}
          onClose={() => setShowSpellModal(false)}
          takenSpells={takenSpells}
          existingSpells={info.spellSelectionType === "book" ? [] : (character.spells?.filter((s) => s.level > 0) || [])}
          spellsKnownChanged={info.spellsKnownChanged}
          earlierSelections={Object.entries(allSpellSelections).filter(([l]) => Number(l) < info.level).flatMap(([, s]) => s)}
          magicalSecretsCount={info.magicalSecretsCount}
          magicalSecretsSpells={magicalSecretsSpells}
          onMagicalSecretsChange={onMagicalSecretsChange}
          subclassSpellSelectionCount={info.subclassSpellSelectionCount}
          subclassSpellSelections={subclassSpellSelections}
          onSubclassSpellSelectionsChange={onSubclassSpellSelectionsChange}
          mode={spellModalMode}
          selectionType={info.spellSelectionType}
          allKnownSpells={info.spellSelectionType === "prepare" ? (character.spells || []).filter(s => s.level > 0).map(s => `${s.name}:${s.level}`) : []}
          disabledSpells={Object.entries(allSpellSelections).filter(([l]) => Number(l) > info.level).flatMap(([, s]) => s)}
          castingLevel={info.level}
        />
      )}

      {showAsiModal && info.asi && (
        <BasePopup
           isOpen={true}
           onClose={() => setShowAsiModal(false)}
           title={t("creator.abilityScoreImprovement", "Ability Score Improvement") + ` (${t("character.level", "Level")} ${lvl})`}
           confirmLabel={t("feat.applyAsi", "Apply ASI")}
           cancelLabel={t("wizard.cancel", "Cancel")}
           onConfirm={applyAsi}
           confirmDisabled={!canApplyAsi}
           showFooter={true}
         >
          <div className="max-h-[65vh] overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onAsiChange({ mode: "single" })}
                className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                  !asiSelection || asiSelection.mode !== "feat"
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
               >
                 <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.improveAbilityScores", "Improve Ability Scores")}</div>
                 <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{t("creator.asiHint", "+2 to one ability or +1 to two abilities")}</div>
               </button>
              <button
                type="button"
                onClick={() => onAsiChange({ mode: "feat" })}
                className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                  asiSelection?.mode === "feat"
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
               >
                 <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.takeFeat", "Take a Feat")}</div>
                 <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{t("creator.featGain", "Gain a feat instead of ability score improvements")}</div>
               </button>
            </div>

            {asiSelection?.mode !== "feat" && (
              <>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t("creator.asiDistribute", "Distribute 2 points: +2 to one ability, or +1 to two abilities. Maximum ability score is 20.")}
                </p>
                <div className="space-y-2">
                  {ABILITIES.map(({ key, label, full }) => {
                    const currentScore = baseScores[key];
                    const allocated = asiAllocation[key] || 0;
                    const isAtCap = currentScore >= 20;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--color-text-primary)] w-12">{label}</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)]">{full}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[var(--color-text-primary)] w-8 text-center">{currentScore}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => removeAsiPoint(key)}
                              disabled={allocated <= 0 || isAtCap}
                              className="flex h-8 w-8 items-center justify-center p-0 rounded-full border border-[var(--color-border)] disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold text-[var(--color-text-primary)] w-7 text-center">
                              {allocated > 0 ? `+${allocated}` : "0"}
                            </span>
                            <button
                              type="button"
                              onClick={() => allocateAsiPoint(key)}
                              disabled={allocated >= 2 || totalAsiPoints >= 2 || isAtCap}
                              className="flex h-8 w-8 items-center justify-center p-0 rounded-full border border-[var(--color-border)] disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {asiSelection?.mode === "feat" && (
              <div className="space-y-3">
                {asiSelection.feat && (
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{asiSelection.feat}</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowAsiFeatModal(true)}
                  className="btn btn-secondary w-full text-sm"
                >
                  {asiSelection.feat ? t("feat.changeFeat", "Change Feat") : t("feat.chooseFeat", "Choose Feat")}
                </button>
              </div>
            )}
          </div>
        </BasePopup>
      )}

      {showAsiFeatModal && (
        <FeatSelectionModal
          selectedFeat={asiSelection?.feat}
          sources={character.sources}
          disabledFeats={[
            ...(character.features || []).filter((f: any) => f.name && f.source !== "custom").map((f: any) => f.name),
            ...Object.values(character.featureSelections || {}).flat(),
            // Feats picked at other levels of this level-up.
            ...allAsiFeats.filter((x) => x.level !== info.level).map((x) => x.feat),
          ].filter((name) => !REPEATABLE_FEATS.has(String(name)))}
          character={wizardCharacter}
          takenSpells={(() => {
            // This feat's own earlier picks stay pickable when it is changed.
            const own = new Set(Object.values(asiSelection?.featOptions || {}).map((v) => v.toLowerCase()));
            return new Set([...takenSpells].filter((n) => !own.has(n)));
          })()}
          onSelect={(feat, featOptions) => {
            onAsiChange({ feat: feat.name, featOptions });
            setShowAsiFeatModal(false);
          }}
          onClose={() => setShowAsiFeatModal(false)}
        />
      )}

      {showSpellMasteryModal && (
        <SpellMasteryModal
          isOpen={showSpellMasteryModal}
          onClose={() => { setShowSpellMasteryModal(false); setSpellMasterySelections([]); }}
          selections={spellMasterySelections}
          onSelectionsChange={setSpellMasterySelections}
          onConfirm={(value) => { onClassFeatureChoice("Spell Mastery", value); }}
          characterSources={character.sources}
        />
      )}

      {showSignatureSpellsModal && (
        <SignatureSpellsModal
          isOpen={showSignatureSpellsModal}
          onClose={() => { setShowSignatureSpellsModal(false); setSignatureSpellsSelections([]); }}
          selections={signatureSpellsSelections}
          onSelectionsChange={setSignatureSpellsSelections}
          onConfirm={(value) => { onClassFeatureChoice("Signature Spells", value); }}
          characterSources={character.sources}
        />
      )}

      {showFeaturePopup && (
        <FeatureSelectionModal
          isOpen={!!showFeaturePopup}
          onClose={() => { setShowFeaturePopup(null); setFeatureSelections([]); }}
          name={showFeaturePopup.name}
          description={showFeaturePopup.description}
          options={showFeaturePopup.options}
          count={showFeaturePopup.count}
          isSubclass={showFeaturePopup.isSubclass}
          onSelect={(value) => {
            if (showFeaturePopup.name === "__replace_invocation__") {
              onReplacedInvocationChange(value);
            } else if (showFeaturePopup.name === "__replace_spell__") {
              onReplacedSpellChange(value);
            } else if (showFeaturePopup.isSubclass) {
              onSubclassFeatureChoice(showFeaturePopup.name, value);
            } else {
              onClassFeatureChoice(showFeaturePopup.name, value);
            }
          }}
          onSpecialOption={(optName) => {
            if (optName === "Humanoid (2 races)") {
              setShowHumanoidPopup({ featureName: showFeaturePopup.name, level: lvl });
              setHumanoidSelections([]);
            }
          }}
          characterSources={character.sources}
          takenSpells={showFeaturePopup.name === "__replace_spell__" ? undefined : takenSpells}
          selectedValues={(() => {
            const current = showFeaturePopup.isSubclass
              ? subclassFeatureChoices[showFeaturePopup.name]
              : classFeatureChoices[showFeaturePopup.name];
            if (!current) return [];
            if (showFeaturePopup.count && showFeaturePopup.count > 1) {
              return current.split(", ").filter(Boolean);
            }
            return [current];
          })()}
        />
      )}

      {showTerrainModal && (
        <TerrainModal
          isOpen={showTerrainModal}
          onClose={() => setShowTerrainModal(false)}
          character={{ ...character, subclassIndex: (subclassSelection || character.subclass || '').toLowerCase().replace(/\s+/g, '-') }}
          level={info.level}
          maxSpellLevel={info.maxSpellLevel}
          selectedTerrain={circleTerrain}
          onTerrainChange={onCircleTerrainChange}
        />
      )}

      {showBonusCantripModal && (
        <BonusCantripModal
          isOpen={showBonusCantripModal}
          onClose={() => setShowBonusCantripModal(false)}
          selectedCantrip={bonusCantrip}
          onCantripChange={onBonusCantripChange}
          takenSpells={takenSpells}
        />
      )}

      {showExpertiseModal && info.expertise && (
        <BasePopup isOpen={showExpertiseModal} onClose={() => setShowExpertiseModal(false)} title={t("creator.selectExpertise", "Select Expertise")}>
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-text-secondary)]">{t("creator.expertiseHint", "Choose")} {info.expertise.count} {t("creator.skill", "skill")}{info.expertise.count !== 1 ? t("creator.skillPlural", "s") : ""} {t("creator.toDoubleProficiency", "to double your proficiency bonus.")}</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(info.expertise.availableOptions || []).map((skill) => {
                const isSelected = expertise.includes(skill);
                const isDisabled = !isSelected && expertise.length >= info.expertise!.count;
                return (
                  <label
                    key={skill}
                    className={`flex items-center gap-3 p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer transition-all ${isDisabled ? "opacity-40" : "hover:border-[var(--color-border-active)]"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          onExpertiseChange(expertise.filter((s) => s !== skill));
                        } else if (expertise.length < info.expertise!.count) {
                          onExpertiseChange([...expertise, skill]);
                        }
                      }}
                      disabled={isDisabled}
                      className="checkbox"
                    />
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{skill}</span>
                     {isSelected && <span className="badge text-ink bg-paper-muted ml-auto">{t("common.expertiseBadge", "EXPERTISE")}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </BasePopup>
      )}
    </div>
  );
}

