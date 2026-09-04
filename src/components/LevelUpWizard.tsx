"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { WizardNav } from "./WizardNav";
import { getStaticClass, getStaticSubclasses, getStaticSpells, getStaticSubclassDetails, getStaticArcaneTricksterSpells, getSubclassFlags, getWizardSpellsByLevel, getPactBoons, getStaticFeat } from "@/lib/srd-client";
import { SourceBadge } from "./SourceBadge";
import { getHitDieAverage, getModifier, computeDerivedStats, getMaxBardicInspirationUses, getBardicInspirationDie, getSongOfRestDie, hasFontOfInspiration, getDomainSpellNames, getCircleTerrainTypes, getCircleSpells, getOathSpellNames, getWarlockExpandedSpellNames, getWizardTraditionSpellNames, getMaxSpellLevel, type Character } from "@/lib/storage";
import { applySubclassFeatures, applySubclassSpellGrants, syncBaseFeatures } from "@/lib/character-creation";
import { normalizeDescription } from "@/lib/level-up";
import invocationsData from "@/data/warlock_invocations.json";
import { SpellSelectionModal } from "./character-sheet/SpellSelectionModal";
import { FeatSelector } from "./character-creator/FeatSelector";
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
} from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import { useSRD } from "@/contexts/SRDContext";

function getSubclassFlagsByName(className: string, subclassName: string, sources?: string[]): Record<string, boolean> {
  if (!subclassName) return {};
  const subclasses = getStaticSubclasses(className, sources);
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
}

const invocationPrereqs: Record<string, InvocationPrerequisite> = (invocationsData as any).invocations || {};

function getAvailableInvocations(level: number, pactBoon: string, knownInvocations: string[]): { name: string; available: boolean; reason?: string }[] {
  const allInvocations = Object.keys(invocationPrereqs);
  return allInvocations.map((name) => {
    const prereq = invocationPrereqs[name];
    if (!prereq) return { name, available: true };
    if (level < prereq.level) return { name, available: false, reason: `Requires level ${prereq.level}` };
    if (prereq.requires) {
      const req = prereq.requires.toLowerCase();
      if (req.includes("pact of the blade") && pactBoon !== "Pact of the Blade") return { name, available: false, reason: "Requires Pact of the Blade" };
      if (req.includes("pact of the chain") && pactBoon !== "Pact of the Chain") return { name, available: false, reason: "Requires Pact of the Chain" };
      if (req.includes("pact of the tome") && pactBoon !== "Pact of the Tome") return { name, available: false, reason: "Requires Pact of the Tome" };
    }
    return { name, available: true };
  });
}

const HUMANOID_RACES = [
  "Bugbears",
  "Dwarves",
  "Elves",
  "Gnolls",
  "Gnomes",
  "Goblins",
  "Half-Elves",
  "Halflings",
  "Hobgoblins",
  "Humans",
  "Kenku",
  "Kobolds",
  "Lizardfolk",
  "Orcs",
  "Tieflings",
  "Troglodytes",
];

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
  features: { name: string; description: string; source?: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
  cantripsKnown?: number;
  spellsKnown?: number;
  classFeatures: { name: string; value: string }[];
  subclassOptions?: { name: string; description: string; hasDetails: boolean }[];
  subclassFeatureChoices?: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[];
  classFeatureChoices?: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[];
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
}

function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

function buildLevelInfos(
  character: Character,
  targetLevel: number,
  classData: ReturnType<typeof getStaticClass>,
  subclassSelection: string,
  startLevel: number,
  showLevelOne: boolean
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

    const features = (levelData?.features || []).map((f: any) => ({
      name: f.name,
      description: normalizeDescription(f.description),
    }));

    const asi = levelData?.asi || false;
    let spellSlots = levelData?.spellSlots;

    // Arcane Trickster uses its own spell slot progression
    const isArcaneTricksterSubclass = subclassSelection?.toLowerCase().includes("arcane trickster");
    if (!spellSlots && isArcaneTricksterSubclass && (classData as any)?.arcaneTricksterSpellSlots) {
      spellSlots = (classData as any).arcaneTricksterSpellSlots[String(level)] || undefined;
    }

    let cantripsKnown: number | undefined;
    if (classData.cantripsKnown) {
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
    if ((classData as any)?.spellsKnown) {
      const known = (classData as any).spellsKnown;
      if (known[String(level)] !== undefined) {
        spellsKnown = known[String(level)];
      }
    }

    const spellsKnownByLevel: Record<string, Record<number, number>> = {
      Sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
      Bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 16, 15: 18, 16: 18, 17: 19, 18: 19, 19: 20, 20: 22 },
      Warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
      Ranger: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
      Paladin: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
    };
    if (spellsKnown === undefined && spellsKnownByLevel[className] && spellsKnownByLevel[className][level]) {
      spellsKnown = spellsKnownByLevel[className][level];
    }

    const classFeatures: { name: string; value: string }[] = [];
    const classFeatureMap: Record<string, Record<string, any> | undefined> = {
      Barbarian: { "Rage Uses": classData.rageUses, "Rage Damage": classData.rageDamageBonus },
      Cleric: { "Channel Divinity": classData.channelDivinityUses },
      Druid: { "Wild Shape": classData.wildShapeUses },
      Fighter: { "Action Surge": classData.actionSurgeUses, Indomitable: classData.indomitableUses },
      Monk: { "Ki Points": classData.kiPoints, "Movement": classData.unarmoredMovement, "Martial Arts": classData.martialArtsDie },
      Rogue: { "Sneak Attack": classData.sneakAttackDice },
      Sorcerer: { "Sorcery Points": classData.sorceryPoints },
      Warlock: { "Invocations": classData.invocationsKnown },
      Wizard: { "Spellbook": classData.spellbookSpells },
      Ranger: {},
      Paladin: {},
      Bard: {},
    };

    if (className === "Bard") {
      classFeatures.push({ name: "Bardic Inspiration", value: `${getBardicInspirationDie({ ...character, level } as Character)}` });
      classFeatures.push({ name: "Song of Rest", value: `${getSongOfRestDie({ ...character, level } as Character)}` });
      const chaMod = getModifier(character.cha);
      classFeatures.push({ name: "Bardic Inspiration Uses", value: `${Math.max(1, chaMod)}` });
    }

    const featureValues = classFeatureMap[className];
    if (featureValues) {
      for (const [name, data] of Object.entries(featureValues)) {
        if (data && typeof data === "object" && String(level) in data) {
          const val = (data as Record<string, any>)[String(level)];
          if (val !== undefined) {
            if (name === "Martial Arts") classFeatures.push({ name, value: `d${val}` });
            else if (name === "Movement") classFeatures.push({ name, value: `+${val} ft` });
            else if (name === "Rage Damage") classFeatures.push({ name, value: `+${val}` });
            else if (name === "Sneak Attack") classFeatures.push({ name, value: `${val}d6` });
            else classFeatures.push({ name, value: String(val) });
          }
        }
      }
    }

    const unlockLevel = classData.subclassLevel ?? 3;
    const subclasses = getStaticSubclasses(className, character.sources);
    const subclassOptions = level === unlockLevel && !character.subclass && subclasses.length > 0
      ? subclasses.map((s) => ({ name: s.name, description: s.description, hasDetails: true }))
      : undefined;

    const subclassFeatureChoices: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[] = [];
    const passiveSubclassFeatures: { name: string; description: string; source?: string }[] = [];
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
            subclassFeatureChoices.push({
              name: f.name,
              description: desc,
              options: f.choices!.map((c: any) => ({ name: c.name, description: c.description || "" })),
              count: f.choicesCount || 1,
            });
          } else {
            passiveSubclassFeatures.push({ name: f.name, description: desc, source: subclassSource });
          }
        }
      }
    }

    // Class feature choices (e.g., Primal Knowledge for Barbarian)
    const classFeatureChoices: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[] = [];
    const levelFeatures = classData.levels[level - 1]?.features || [];
    for (const feature of levelFeatures) {
      const f = feature as any;
      if (f.choices && f.choices.options && f.choices.options.length > 0) {
        classFeatureChoices.push({
          name: f.name,
          description: f.description || "",
          options: f.choices.options.map((opt: any) => ({
            name: typeof opt === "string" ? opt : opt.name,
            description: typeof opt === "string" ? "" : (opt.description || ""),
          })),
          count: f.choices.count || 1,
        });
      }
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

    const isArcaneTrickster = subclassSelection?.toLowerCase().includes("arcane trickster");
    const maxSpellLevel = getMaxSpellLevel(className, level);

    // Spell selection count is based on class-specific rules, NEVER on slot counts
    const isSpellsKnownCaster = ["Sorcerer", "Bard", "Warlock", "Ranger", "Paladin"].includes(className);
    const isPrepCaster = ["Cleric", "Druid", "Artificer"].includes(className);
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
    if (isPrepCaster && classData.spellcastingAbility) {
      const abilityScore = character[classData.spellcastingAbility as keyof Character] as number;
      const abilityMod = getModifier(abilityScore || 10);
      if (className === "Artificer") {
        // Artificer: Intelligence modifier + half artificer level, rounded down (minimum 1)
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
    const canReplaceSpell = (isBard || isSorcerer) && level > 1 && (character.spells || []).length > 0;
    const subclassFlags = getSubclassFlagsByName(className, subclassSelection || "", character.sources);
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
      ? Math.max(1, className === "Artificer" ? prepAbilityMod + Math.floor(level / 2) : prepAbilityMod + level)
      : undefined;
    const preparedCount = isPrepCaster && maxPrepared ? maxPrepared : undefined;

    const allFeatures = [...features, ...passiveSubclassFeatures];

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
      circleTerrainSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && [3, 5, 7, 9].includes(level),
      bonusCantripSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && level === 2,
      spellbookTotal: spellbookTotal,
      maxPrepared: maxPrepared,
      preparedCount: preparedCount,
    });
  }

  return infos;
}

export function LevelUpWizard({ character, onCancel, onComplete, minLevel, maxLevel, title, subtitle, startFromLevelOne }: LevelUpWizardProps) {
  const classData = character.class ? getStaticClass(character.class) : undefined;
  const currentLevel = startFromLevelOne ? 1 : (character.level || 1);
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const diceType = `d${hitDie}` as any;

  const effectiveMinLevel = minLevel ?? currentLevel + 1;
  const effectiveMaxLevel = maxLevel ?? 20;

  const [targetLevel, setTargetLevel] = useState(Math.min(effectiveMaxLevel, Math.max(effectiveMinLevel, currentLevel + 1)));
  const [hpValues, setHpValues] = useState<Record<number, number>>({});
  const [asiSelections, setAsiSelections] = useState<Record<number, { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string }>>({});
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [classFeatureChoices, setClassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});
  const [magicalSecretsSelections, setMagicalSecretsSelections] = useState<Record<number, string[]>>({});
  const [subclassSpellSelections, setSubclassSpellSelections] = useState<Record<number, string[]>>({});
  const [circleTerrainSelections, setCircleTerrainSelections] = useState<Record<number, string>>({});
  const [bonusCantripSelections, setBonusCantripSelections] = useState<Record<number, string>>({});
  const [replacedSpells, setReplacedSpells] = useState<Record<number, string>>({});
  const [invocationSelections, setInvocationSelections] = useState<Record<number, string[]>>({});
  const [replacedInvocations, setReplacedInvocations] = useState<Record<number, string>>({});
  const [pactTomeCantrips, setPactTomeCantrips] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const prevTargetLevelRef = useRef(targetLevel);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const levelInfos = useMemo(
    () => buildLevelInfos(character, targetLevel, classData, subclassSelection, currentLevel, !!startFromLevelOne),
    [character, targetLevel, classData, subclassSelection, currentLevel, startFromLevelOne]
  );

  const setHp = (level: number, value: number) => setHpValues((prev) => ({ ...prev, [level]: value }));
  const setAsi = (level: number, patch: Partial<{ mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string }>) =>
    setAsiSelections((prev) => ({ ...prev, [level]: { ...(prev[level] || { mode: "single" }), ...patch } as any }));
  const setSpells = (level: number, list: string[]) => setSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setMagicalSecrets = (level: number, list: string[]) => setMagicalSecretsSelections((prev) => ({ ...prev, [level]: list }));
  const setSubclassSpells = (level: number, list: string[]) => setSubclassSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setReplacedSpell = (level: number, spellId: string) => setReplacedSpells((prev) => ({ ...prev, [level]: spellId }));
  const setCircleTerrain = (level: number, terrain: string) => setCircleTerrainSelections((prev) => ({ ...prev, [level]: terrain }));
  const setBonusCantrip = (level: number, cantrip: string) => setBonusCantripSelections((prev) => ({ ...prev, [level]: cantrip }));
  const setInvocations = (level: number, list: string[]) => setInvocationSelections((prev) => ({ ...prev, [level]: list }));
  const setReplacedInvocation = (level: number, invocation: string) => setReplacedInvocations((prev) => ({ ...prev, [level]: invocation }));

  const buildAllocation = (st?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string }): Record<AbilityKey, number> => {
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

  const asiIsValid = (st?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string }): boolean => {
    if (!st || !st.mode) return false;
    if (st.mode === "feat") return !!st.feat;
    if (st.mode === "single") return !!st.single;
    return !!st.d1 && !!st.d2 && st.d1 !== st.d2;
  };

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
        const choices = subclassFeatureChoices[lvl] || {};
        for (const fc of info.subclassFeatureChoices) {
          if (!choices[fc.name]) return false;
        }
      }
      if (info.classFeatureChoices) {
        const choices = classFeatureChoices[lvl] || {};
        for (const fc of info.classFeatureChoices) {
          if (!choices[fc.name]) return false;
        }
      }
      return true;
    }
    if (!hpValues[lvl] || hpValues[lvl] <= 0) return false;
    if (info.asi && !asiIsValid(asiSelections[lvl])) return false;
    if (info.subclassOptions && !subclassSelection) return false;
    if (!spellSelectionComplete) return false;
    if (info.subclassFeatureChoices) {
      const choices = subclassFeatureChoices[lvl] || {};
      for (const fc of info.subclassFeatureChoices) {
        if (!choices[fc.name]) return false;
      }
    }
    if (info.classFeatureChoices) {
      const choices = classFeatureChoices[lvl] || {};
      for (const fc of info.classFeatureChoices) {
        if (!choices[fc.name]) return false;
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
          items.push({ level: lvl, label: `Level ${lvl} — Roll HP`, sectionId: `hp-${lvl}` });
        }
      }
      if (info.asi) {
        const sel = asiSelections[lvl];
        const isValid = (sel?.mode === "single" && !!sel?.single) || (sel?.mode === "double" && !!sel?.d1 && !!sel?.d2 && sel?.d1 !== sel?.d2) || (sel?.mode === "feat" && !!sel?.feat);
        if (!isValid) items.push({ level: lvl, label: `Level ${lvl} — Ability Score Improvement`, sectionId: `asi-${lvl}` });
      }
      if (info.subclassOptions && !subclassSelection) {
        items.push({ level: lvl, label: `Level ${lvl} — Choose Subclass`, sectionId: `subclass-${lvl}` });
      }
      if (info.subclassFeatureChoices) {
        const choices = subclassFeatureChoices[lvl] || {};
        for (const fc of info.subclassFeatureChoices) {
          if (!choices[fc.name]) items.push({ level: lvl, label: `Level ${lvl} — ${fc.name}`, sectionId: `subclass-fc-${lvl}` });
        }
      }
      if (info.classFeatureChoices) {
        const choices = classFeatureChoices[lvl] || {};
        for (const fc of info.classFeatureChoices) {
          if (!choices[fc.name]) items.push({ level: lvl, label: `Level ${lvl} — ${fc.name}`, sectionId: `class-fc-${lvl}` });
        }
      }
      if (info.hasSpellSelection) {
        const lvlSpells = spellSelections[lvl] || [];
        const cantripsCount = lvlSpells.filter((s) => s.endsWith(":0")).length;
        const spellsCount = lvlSpells.filter((s) => !s.endsWith(":0")).length;
        if (cantripsCount < info.cantripSelectionCount || spellsCount < info.spellSelectionCount) {
          items.push({ level: lvl, label: `Level ${lvl} — Select spells`, sectionId: `spells-${lvl}` });
        }
      }
    }
    return items;
  }, [levelInfos, asiSelections, subclassSelection, spellSelections, subclassFeatureChoices, classFeatureChoices, hpValues, startFromLevelOne]);

  const handleFinish = () => {
    if (!classData) return;
    let draft: Character = {
      ...character,
      subclass: subclassSelection || character.subclass,
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
      },
    };

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
        const featData = getStaticFeat(st.feat);
        if (featData && !draft.features.some((f) => f.name === featData.name)) {
          draft = {
            ...draft,
            features: [
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
            },
          };
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
          const spell = getStaticSpells(character.sources).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
          const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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

    if (draft.class === "Warlock" && draft.subclass) {
      const expandedSpellNames = getWarlockExpandedSpellNames(draft);
      const currentSpellNames = spells.map((s) => s.name?.toLowerCase());
      for (const name of expandedSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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

    if (draft.class === "Wizard" && draft.subclass) {
      const traditionSpellNames = getWizardTraditionSpellNames(draft);
      const currentSpellNames = spells.map((s) => s.name?.toLowerCase());
      for (const name of traditionSpellNames) {
        if (!currentSpellNames.includes(name.toLowerCase())) {
          const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
      const selectedTerrain = circleTerrainSelections[targetLevel] || draft.circleTerrain;
      if (selectedTerrain) {
        draft.circleTerrain = selectedTerrain;
        const circleSpellNames = getCircleSpells(selectedTerrain, draft.level);
        const currentSpellNames = spells.map((s) => s.name?.toLowerCase());

        for (const name of circleSpellNames) {
          if (!currentSpellNames.includes(name.toLowerCase())) {
            const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
        const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === selectedBonusCantrip.toLowerCase());
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
      const pactBoon = (classFeatureChoices as any)["Pact Boon"] || "";
      if (pactBoon) {
        draft.featureSelections = {
          ...draft.featureSelections,
          "pact-boon": [pactBoon],
        };
      }
    }

    if (["Cleric", "Druid", "Artificer"].includes(draft.class)) {
      draft.preparedSpells = [...(character.preparedSpells || []), ...newPreparedIds];
    }

    let finalChar = applySubclassFeatures(draft);
    finalChar = applySubclassSpellGrants(finalChar);
    finalChar = syncBaseFeatures(finalChar);
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
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-[var(--border-radius-sm)] border border-transparent hover:border-[var(--color-border)]">
              Cancel
            </button>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">{title ?? "Level Up"}</div>
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
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Target Level</div>
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
        </div>
      </div>

      {showNotifPanel && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifPanel(false)}>
          <div
            className="absolute right-4 top-16 w-80 max-h-[70vh] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Tasks</span>
              {unfinishedItems.length > 0 && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{unfinishedItems.length} unfinished</span>
              )}
            </div>
            <div className="p-2 space-y-1">
              {unfinishedItems.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <span className="text-xs text-green-600 font-semibold">All tasks complete!</span>
                </div>
              ) : (
                 unfinishedItems.map((item, idx) => (
                   <button
                     key={idx}
                     type="button"
                      onClick={() => {
                        setShowNotifPanel(false);
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

      <main className="px-4 py-5 pb-40">
        <div className="mx-auto max-w-lg space-y-4">
          {levelInfos.length > 0 && (
            <button
              type="button"
              onClick={rollAllHp}
              className="w-full py-2.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
            >
              🎲 Roll All HP
            </button>
          )}

          {levelInfos.map((info) => (
            <div
              key={info.level}
              ref={(el) => { sectionRefs.current[`level-card-${info.level}`] = el; }}
            >
            <LevelCard
              info={info}
              hpValue={hpValues[info.level] || 0}
              onHpChange={(v) => setHp(info.level, v)}
              asiSelection={asiSelections[info.level]}
              onAsiChange={(patch) => setAsi(info.level, patch)}
              baseScores={baseScores(info.level)}
              subclassSelection={subclassSelection}
              onSubclassSelect={setSubclassSelection}
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
              character={character}
              hitDie={hitDie}
              diceType={diceType}
              conMod={conMod}
              averageHp={averageHp}
              startFromLevelOne={startFromLevelOne}
              allSpellSelections={spellSelections}
              invocationSelections={invocationSelections[info.level] || []}
              onInvocationsChange={(list) => setInvocations(info.level, list)}
              replacedInvocation={replacedInvocations[info.level] || ""}
              onReplacedInvocationChange={(inv) => setReplacedInvocation(info.level, inv)}
              pactTomeCantrips={pactTomeCantrips}
              onPactTomeCantripsChange={setPactTomeCantrips}
               allInvocationSelections={invocationSelections}
               sectionRefs={sectionRefs}
            />
            </div>
          ))}
        </div>
      </main>

      <WizardNav
        onBack={onCancel}
        onNext={handleFinish}
        backLabel="Cancel"
        nextLabel="Complete"
        canProceed={allLevelsComplete}
        showBack={true}
      />
    </div>
  );
}

interface LevelCardProps {
  info: LevelInfo;
  hpValue: number;
  onHpChange: (v: number) => void;
  asiSelection?: { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string };
  onAsiChange: (patch: Partial<{ mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string }>) => void;
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
  allSpellSelections: Record<number, string[]>;
  invocationSelections: string[];
  onInvocationsChange: (list: string[]) => void;
  replacedInvocation: string;
  onReplacedInvocationChange: (inv: string) => void;
  pactTomeCantrips: string[];
  onPactTomeCantripsChange: (list: string[]) => void;
  allInvocationSelections?: Record<number, string[]>;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
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
  allSpellSelections,
  invocationSelections,
  onInvocationsChange,
  replacedInvocation,
  onReplacedInvocationChange,
  pactTomeCantrips,
  onPactTomeCantripsChange,
  allInvocationSelections,
  sectionRefs,
}: LevelCardProps) {
    const [showSpellSelection, setShowSpellSelection] = useState(false);
    const [showSubclassDetails, setShowSubclassDetails] = useState<string | null>(null);
    const [showSubclassModal, setShowSubclassModal] = useState(false);
    const [showSpellModal, setShowSpellModal] = useState(false);
    const [spellModalMode, setSpellModalMode] = useState<"all" | "cantrips" | "spells">("all");
    const [showTerrainModal, setShowTerrainModal] = useState(false);
    const [showBonusCantripModal, setShowBonusCantripModal] = useState(false);
    const [showFeaturePopup, setShowFeaturePopup] = useState<{ name: string; description: string; options: { name: string; description: string }[]; isSubclass: boolean; count?: number; isSpellMastery?: boolean; isSignatureSpells?: boolean } | null>(null);
    const [multiSelectSelections, setMultiSelectSelections] = useState<string[]>([]);
    const [showHumanoidPopup, setShowHumanoidPopup] = useState<{ featureName: string; level: number } | null>(null);
    const [humanoidSelections, setHumanoidSelections] = useState<string[]>([]);
    const [showAsiModal, setShowAsiModal] = useState(false);
    const [asiAllocation, setAsiAllocation] = useState<Record<AbilityKey, number>>({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    const [showAsiFeatModal, setShowAsiFeatModal] = useState(false);
    const lvl = info.level;
    const { data } = useSRD();
  const srdSpells = data?.spells || [];

  const isHpComplete = (lvl === 1 && startFromLevelOne) || hpValue > 0;
  const isAsiComplete = !info.asi || (asiSelection?.mode === "single" && !!asiSelection?.single) || (asiSelection?.mode === "double" && !!asiSelection?.d1 && !!asiSelection?.d2 && asiSelection?.d1 !== asiSelection?.d2) || (asiSelection?.mode === "feat" && !!asiSelection?.feat);
  const isSubclassComplete = !info.subclassOptions || !!subclassSelection;
  const isFeatureChoicesComplete = !info.subclassFeatureChoices || info.subclassFeatureChoices.every((fc) => subclassFeatureChoices[fc.name]);
  const isClassFeatureChoicesComplete = !info.classFeatureChoices || info.classFeatureChoices.every((fc) => classFeatureChoices[fc.name]);
  const isSpellSelectionComplete = !info.hasSpellSelection || (() => {
    const lvlSpells = (allSpellSelections || {})[lvl] || [];
    const cantripsCount = lvlSpells.filter((s: string) => s.endsWith(":0")).length;
    const spellsCount = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
    return cantripsCount >= info.cantripSelectionCount && spellsCount >= info.spellSelectionCount;
  })();
  const isComplete = isHpComplete && isAsiComplete && isSubclassComplete && isFeatureChoicesComplete && isClassFeatureChoicesComplete && isSpellSelectionComplete;

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
              <Check className="h-3 w-3" /> Complete
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          <div ref={setSectionRef(`hp-${lvl}`)} className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Heart className={`h-4 w-4 ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Hit Points</div>
              <div className="text-xs text-[var(--color-text-primary)]">
                {lvl === 1 && startFromLevelOne
                  ? `${hitDie} + ${conMod >= 0 ? `+${conMod}` : conMod} = ${hitDie + conMod} HP (automatic)`
                  : `d${hitDie} + ${conMod >= 0 ? `+${conMod}` : conMod} (avg: ${averageHp})`}
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

          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
            <Star className="h-4 w-4 text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Proficiency Bonus</div>
              <div className="text-xs text-[var(--color-text-primary)]">+{info.proficiencyBonus}</div>
            </div>
          </div>

          {info.classFeatures.length > 0 && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Sword className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Class Features</div>
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

            {info.features.length > 0 && (
              <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                <Lightning className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">New Features</div>
                  <div className="space-y-2 mt-1">
                    {info.features.map((f) => (
                      <div key={f.name}>
                         <div className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                           {f.source && f.source !== "PHB" && <SourceBadge source={f.source} />}
                           <span className="font-semibold">{f.name}</span>
                           {f.description && (
                             <InfoButton title={f.name} description={f.description} />
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {info.asi && (
              <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                <ChartBar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Ability Score Improvement</div>
                  <button
                    type="button"
                    onClick={openAsiModal}
                    className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                  >
                    <span>
                      {asiSelection?.mode === "feat" && asiSelection.feat
                        ? `Feat: ${asiSelection.feat}`
                        : asiSelection?.mode === "single" && asiSelection.single
                          ? `+2 ${asiSelection.single.toUpperCase()}`
                          : asiSelection?.mode === "double" && asiSelection.d1 && asiSelection.d2
                            ? `+1 ${asiSelection.d1.toUpperCase()}, +1 ${asiSelection.d2.toUpperCase()}`
                            : "Select ability scores…"}
                    </span>
                    <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>
            )}

          {info.spellSlots && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Sparkle className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spell Slots</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(info.spellSlots).map(([level, count]) => (
                    <span key={level} className="text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                      {level}st: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {info.cantripsKnown !== undefined && (() => {
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
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Cantrips Known</div>
                  <div className={`text-xs ${cantripColor}`}>
                    {info.cantripsKnown}
                    {info.cantripSelectionCount > 0 && (
                      <span className="ml-1">({selectedCantrips}/{info.cantripSelectionCount} selected)</span>
                    )}
                  </div>
                  {higherCantrips.length > 0 && (
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      From higher: {higherCantrips.join(", ")}
                    </div>
                  )}
                </div>
                {info.cantripSelectionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpellModalMode("cantrips"); setShowSpellModal(true); }}
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needCantrips ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
                  >
                    Select
                  </button>
                )}
              </div>
            );
          })()}

          {info.spellsKnown !== undefined && (() => {
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
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spells Known</div>
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
                    Select
                  </button>
                )}
              </div>
            );
          })()}

          {info.spellbookTotal !== undefined && (() => {
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
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spellbook</div>
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
                    Select
                  </button>
                )}
              </div>
            );
          })()}

          {info.maxPrepared !== undefined && (() => {
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
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Prepare Spells</div>
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
                    Select
                  </button>
                )}
              </div>
            );
          })()}

          {info.subclassOptions && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Crown className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Choose Subclass</div>
                <button
                  type="button"
                  onClick={() => setShowSubclassModal(true)}
                  className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
                >
                  {subclassSelection ? `Selected: ${subclassSelection}` : "Select Subclass"}
                </button>
              </div>
            </div>
          )}

          {(info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection) || (info.classFeatureChoices && info.classFeatureChoices.length > 0) ? (
            <div className="space-y-3">
              {info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection && (
                info.subclassFeatureChoices.map((fc) => (
                  <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                     <div className="flex items-center gap-2 mb-1">
                       <Crown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                       <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
                       {fc.description && (
                         <InfoButton title={fc.name} description={fc.description} />
                       )}
                     </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">Subclass · Level {info.level}</div>
                      <button
                        type="button"
                        onClick={() => { setMultiSelectSelections([]); setShowFeaturePopup({ ...fc, isSubclass: true, count: fc.count }); }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                       >
                       <span>{subclassFeatureChoices[fc.name] || "Select an option..."}</span>
                       <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                     </button>
                  </div>
                ))
              )}
              {info.classFeatureChoices && info.classFeatureChoices.length > 0 && (
                info.classFeatureChoices.map((fc) => (
                  <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                     <div className="flex items-center gap-2 mb-1">
                       <Sword className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                       <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
                       {fc.description && (
                         <InfoButton title={fc.name} description={fc.description} />
                       )}
                     </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">Class · Level {info.level}</div>
                      <button
                        type="button"
                        onClick={() => { setMultiSelectSelections([]); setShowFeaturePopup({ ...fc, isSubclass: false, count: fc.count }); }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                       >
                       <span>{classFeatureChoices[fc.name] || "Select an option..."}</span>
                       <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                     </button>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {character.class === "Wizard" && info.level === 18 && (() => {
            const spellMasterySelection = classFeatureChoices["Spell Mastery"] || "";
            return (
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Spell Mastery</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose one 1st-level and one 2nd-level spell to cast at will without spell slots.</p>
                <button
                  type="button"
                  onClick={() => { setMultiSelectSelections([]); setShowFeaturePopup({ name: "Spell Mastery", description: "Choose one 1st-level and one 2nd-level wizard spell from your spellbook.", options: [], isSubclass: false, count: 2, isSpellMastery: true }); }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                  <span>{spellMasterySelection || "Select 2 spells..."}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
            );
          })()}

          {character.class === "Wizard" && info.level === 20 && (() => {
            const signatureSpellsSelection = classFeatureChoices["Signature Spells"] || "";
            return (
              <div className="p-3 rounded-lg border border-rose-300 bg-rose-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Signature Spells</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose two 3rd-level spells. They&apos;re always prepared and you can cast each once per short rest without a spell slot.</p>
                <button
                  type="button"
                  onClick={() => { setMultiSelectSelections([]); setShowFeaturePopup({ name: "Signature Spells", description: "Choose two 3rd-level wizard spells from your spellbook.", options: [], isSubclass: false, count: 2, isSignatureSpells: true }); }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                  <span>{signatureSpellsSelection || "Select 2 signature spells..."}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
            );
          })()}

          {character.class === "Warlock" && info.level >= 3 && !subclassSelection && (
            <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Pact Boon Required</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose your subclass (Otherworldly Patron) first to unlock Pact Boon selection.</p>
            </div>
          )}

          {character.class === "Warlock" && info.level === 3 && subclassSelection && (() => {
            const pactBoon = classFeatureChoices["Pact Boon"] || "";
            return (
              <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Pact Boon</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Your patron bestows a gift. Choose one.</p>
                <button
                  type="button"
                  onClick={() => { setMultiSelectSelections([]); setShowFeaturePopup({ name: "Pact Boon", description: "", options: getPactBoons().map(b => ({ name: b.name, description: b.description })), isSubclass: false, count: 1 }); }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                  <span>{pactBoon || "Select Pact Boon..."}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
                {pactBoon === "Pact of the Tome" && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-purple-700 mb-1">Choose 3 Cantrips from Any Class:</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {pactTomeCantrips.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-100 border border-purple-300 rounded-full text-purple-800">
                          {c}
                          <button type="button" onClick={() => onPactTomeCantripsChange(pactTomeCantrips.filter(x => x !== c))} className="hover:text-red-600 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && pactTomeCantrips.length < 3 && !pactTomeCantrips.includes(e.target.value)) {
                          onPactTomeCantripsChange([...pactTomeCantrips, e.target.value]);
                        }
                        e.target.value = "";
                      }}
                      className="w-full py-1.5 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <option value="">{pactTomeCantrips.length >= 3 ? "3 cantrips selected" : `Select cantrip (${pactTomeCantrips.length}/3)...`}</option>
                      {getStaticSpells(character.sources).filter(s => s.level === 0 && !pactTomeCantrips.includes(s.name)).map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {pactBoon === "Pact of the Chain" && (
                  <div className="mt-2">
                    <p className="text-[10px] text-[var(--color-text-muted)]">Special familiar forms available: imp, pseudodragon, quasit, sprite</p>
                  </div>
                )}
              </div>
            );
          })()}

          {character.class === "Warlock" && info.level >= 2 && (() => {
            const invocationFeature = info.classFeatureChoices?.find(fc => fc.name === "Eldritch Invocations");
            if (!invocationFeature) return null;
            const currentInvocations = invocationSelections;
            const invocationCount = invocationFeature.count || 1;
            const pactBoon = classFeatureChoices["Pact Boon"] || "";
            const availableInvocations = getAvailableInvocations(info.level, pactBoon, currentInvocations);
            const priorInvocations = Object.entries(allInvocationSelections || {}).filter(([l]) => Number(l) < info.level).flatMap(([, invs]) => invs);
            const hasPriorInvocations = info.level > 2 && priorInvocations.length > 0;

            return (
              <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Eldritch Invocations</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose {invocationCount} invocation{invocationCount > 1 ? "s" : ""}. Spell slots recover on short rest.</p>
                {currentInvocations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {currentInvocations.map((inv) => (
                      <span key={inv} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-indigo-100 border border-indigo-300 rounded-full text-indigo-800">
                        {inv}
                        <button type="button" onClick={() => onInvocationsChange(currentInvocations.filter(x => x !== inv))} className="hover:text-red-600 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {hasPriorInvocations && info.level > 2 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-orange-700 mb-1">Replace an invocation (optional):</p>
                    <select
                      value={replacedInvocation}
                      onChange={(e) => onReplacedInvocationChange(e.target.value)}
                      className="w-full py-1.5 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <option value="">No replacement</option>
                      {priorInvocations.map((inv) => (
                        <option key={inv} value={inv}>{inv}</option>
                      ))}
                    </select>
                  </div>
                )}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && currentInvocations.length < invocationCount && !currentInvocations.includes(e.target.value)) {
                      onInvocationsChange([...currentInvocations, e.target.value]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full py-1.5 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <option value="">{currentInvocations.length >= invocationCount ? `${invocationCount} invocation${invocationCount > 1 ? "s" : ""} selected` : `Select invocation (${currentInvocations.length}/${invocationCount})...`}</option>
                  {availableInvocations.filter(i => i.available && !currentInvocations.includes(i.name)).map(i => (
                    <option key={i.name} value={i.name}>{i.name}</option>
                  ))}
                  {availableInvocations.filter(i => !i.available && !currentInvocations.includes(i.name)).map(i => (
                    <option key={i.name} value={i.name} disabled>{i.name} ({i.reason})</option>
                  ))}
                </select>
              </div>
            );
          })()}

          {info.magicalSecretsCount > 0 && (
            <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkle className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Magical Secrets</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose {info.magicalSecretsCount} spell{info.magicalSecretsCount > 1 ? "s" : ""} from any class</p>
              <button
                type="button"
                onClick={() => setShowSpellModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                <span>
                  {magicalSecretsSpells.length > 0
                    ? `${magicalSecretsSpells.length} of ${info.magicalSecretsCount} selected`
                    : `Select ${info.magicalSecretsCount} spells from any class...`}
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

          {info.subclassSpellSelectionCount > 0 && (
            <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Additional Magical Secrets</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose {info.subclassSpellSelectionCount} spell{info.subclassSpellSelectionCount > 1 ? "s" : ""} from any class (Lore feature)</p>
              <button
                type="button"
                onClick={() => setShowSpellModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                <span>
                  {subclassSpellSelections.length > 0
                    ? `${subclassSpellSelections.length} of ${info.subclassSpellSelectionCount} selected`
                    : `Select ${info.subclassSpellSelectionCount} spells from any class...`}
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

          {info.canReplaceSpell && (
            <div className="p-3 rounded-lg border border-orange-300 bg-orange-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Book className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Replace Known Spell</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Optionally replace one known spell with another from the {character.class} spell list</p>
              <select
                value={replacedSpell}
                onChange={(e) => onReplacedSpellChange(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                <option value="">No replacement</option>
                {(character.spells || []).filter((s) => s.level > 0).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (Level {s.level})</option>
                ))}
              </select>
            </div>
          )}

          {info.bonusCantripSelection && (
            <div className="p-3 rounded-lg border border-teal-300 bg-teal-50/30">
              <div className="flex items-center gap-2 mb-1">
                <MagicWand className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Bonus Cantrip</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose one additional druid cantrip (does not count against cantrip limit)</p>
              <button
                type="button"
                onClick={() => setShowBonusCantripModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                <span>{bonusCantrip || "Select cantrip..."}</span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
            </div>
          )}

          {info.circleTerrainSelection && (
            <div className="p-3 rounded-lg border border-green-300 bg-green-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Circle Spells - Choose Terrain</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Choose your terrain type to gain circle spells (always prepared, do not count against limit)</p>
              <button
                type="button"
                onClick={() => setShowTerrainModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
              >
                <span>{circleTerrain ? circleTerrain.charAt(0).toUpperCase() + circleTerrain.slice(1) : "Select terrain..."}</span>
                <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
              </button>
              {circleTerrain && (() => {
                const circleSpells = getCircleSpells(circleTerrain, info.level);
                const spellsForLevel = circleSpells.filter((name) => {
                  const spell = getStaticSpells(character.sources).find((s) => s.name?.toLowerCase() === name.toLowerCase());
                  return spell && spell.level <= info.maxSpellLevel;
                });
                if (spellsForLevel.length === 0) return null;
                return (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
                    <p className="text-[10px] text-green-700 font-semibold mb-1">Circle Spells gained:</p>
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
          onSelect={(name) => { onSubclassSelect(name); setShowSubclassModal(false); }}
          onClose={() => setShowSubclassModal(false)}
        />
      )}

      {showSpellModal && info.hasSpellSelection && (
        <SpellSelectionModal
          key={`spell-modal-${lvl}`}
          character={character}
          subclassSelection={subclassSelection}
          count={spellModalMode === "cantrips" ? 0 : info.spellSelectionCount}
          cantripCount={spellModalMode === "spells" ? 0 : info.cantripSelectionCount}
          maxLevel={info.maxSpellLevel}
          spells={spells}
          onSpellsChange={onSpellsChange}
          onClose={() => setShowSpellModal(false)}
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
        />
      )}

      {showAsiModal && info.asi && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAsiModal(false); }}
        >
          <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                Ability Score Improvement (Level {lvl})
              </div>
            </div>
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
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">Improve Ability Scores</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">+2 to one ability or +1 to two abilities</div>
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
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">Take a Feat</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Gain a feat instead of ability score improvements</div>
                </button>
              </div>

              {asiSelection?.mode !== "feat" && (
                <>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Distribute 2 points: +2 to one ability, or +1 to two abilities. Maximum ability score is 20.
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
                    {asiSelection.feat ? "Change Feat" : "Choose Feat"}
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
                  if (asiSelection?.mode === "feat") {
                    onAsiChange({ mode: "single", feat: undefined });
                  }
                  setShowAsiModal(false);
                }}
                className="btn btn-secondary px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyAsi}
                disabled={!canApplyAsi}
                className="btn btn-primary px-5 py-2.5"
              >
                Apply ASI
              </button>
            </div>
          </div>
        </div>
      )}

      {showAsiFeatModal && (
        <FeatSelector
          selectedFeat={asiSelection?.feat}
          sources={character.sources}
          onSelect={(feat) => {
            onAsiChange({ feat: feat.name });
            setShowAsiFeatModal(false);
          }}
          onClose={() => setShowAsiFeatModal(false)}
        />
      )}

      {(showFeaturePopup as any)?.isSpellMastery && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4" onClick={() => setShowFeaturePopup(null)}>
          <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Spell Mastery</div>
              <button type="button" onClick={() => { setShowFeaturePopup(null); setMultiSelectSelections([]); }} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Select one 1st-level spell:</p>
                <div className="space-y-1">
                   {getWizardSpellsByLevel(1, character.sources).map((name) => {
                    const isSelected = multiSelectSelections.includes(name);
                    const allLevel1 = getWizardSpellsByLevel(1, character.sources);
                    return (<button key={name} type="button" onClick={() => { if (isSelected) setMultiSelectSelections(multiSelectSelections.filter(s => s !== name)); else setMultiSelectSelections([...multiSelectSelections.filter(s => !allLevel1.includes(s)), name]); }} className={`w-full p-2 text-left rounded border transition-all ${isSelected ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"}`}><span className="text-xs font-semibold">{name}</span></button>);
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Select one 2nd-level spell:</p>
                <div className="space-y-1">
                  {getWizardSpellsByLevel(2, character.sources).map((name) => {
                    const isSelected = multiSelectSelections.includes(name);
                    const allLevel2 = getWizardSpellsByLevel(2, character.sources);
                    return (<button key={name} type="button" onClick={() => { if (isSelected) setMultiSelectSelections(multiSelectSelections.filter(s => s !== name)); else setMultiSelectSelections([...multiSelectSelections.filter(s => !allLevel2.includes(s)), name]); }} className={`w-full p-2 text-left rounded border transition-all ${isSelected ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"}`}><span className="text-xs font-semibold">{name}</span></button>);
                  })}
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <button type="button" disabled={multiSelectSelections.length !== 2} onClick={() => { if (multiSelectSelections.length === 2) { onClassFeatureChoice("Spell Mastery", multiSelectSelections.join(", ")); setShowFeaturePopup(null); setMultiSelectSelections([]); } }} className={`w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border transition-all ${multiSelectSelections.length === 2 ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:border-2" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed"}`}>Confirm Selection ({multiSelectSelections.length}/2)</button>
            </div>
          </div>
        </div>
      )}

      {(showFeaturePopup as any)?.isSignatureSpells && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4" onClick={() => setShowFeaturePopup(null)}>
          <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Signature Spells</div>
              <button type="button" onClick={() => { setShowFeaturePopup(null); setMultiSelectSelections([]); }} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">Select two 3rd-level spells:</p>
              <div className="space-y-1">
                {getWizardSpellsByLevel(3, character.sources).map((name) => {
                  const isSelected = multiSelectSelections.includes(name);
                  const isDisabled = !isSelected && multiSelectSelections.length >= 2;
                  return (<button key={name} type="button" disabled={isDisabled} onClick={() => { if (isSelected) setMultiSelectSelections(multiSelectSelections.filter(s => s !== name)); else if (multiSelectSelections.length < 2) setMultiSelectSelections([...multiSelectSelections, name]); }} className={`w-full p-2 text-left rounded border transition-all ${isSelected ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"}`}><span className="text-xs font-semibold">{name}</span></button>);
                })}
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <button type="button" disabled={multiSelectSelections.length !== 2} onClick={() => { if (multiSelectSelections.length === 2) { onClassFeatureChoice("Signature Spells", multiSelectSelections.join(", ")); setShowFeaturePopup(null); setMultiSelectSelections([]); } }} className={`w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border transition-all ${multiSelectSelections.length === 2 ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:border-2" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed"}`}>Confirm Selection ({multiSelectSelections.length}/2)</button>
            </div>
          </div>
        </div>
      )}

      {showFeaturePopup && !(showFeaturePopup as any)?.isSpellMastery && !(showFeaturePopup as any)?.isSignatureSpells && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowFeaturePopup(null); }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-[var(--color-text-primary)]">
                  {showFeaturePopup.name}
                </div>
                {showFeaturePopup.description && (
                  <InfoButton title={showFeaturePopup.name} description={showFeaturePopup.description} />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFeaturePopup(null)}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

      {showHumanoidPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowHumanoidPopup(null); }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                Choose 2 Humanoid Races
              </div>
              <button
                type="button"
                onClick={() => setShowHumanoidPopup(null)}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pt-3">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Select two humanoid races as your favored enemies.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {HUMANOID_RACES.map((race, idx) => {
                  const isSelected = humanoidSelections.includes(race);
                  const isDisabled = !isSelected && humanoidSelections.length >= 2;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setHumanoidSelections(humanoidSelections.filter((r) => r !== race));
                        } else if (humanoidSelections.length < 2) {
                          setHumanoidSelections([...humanoidSelections, race]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                        isSelected
                          ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center gap-2">
                        {isSelected && <Check className="h-3 w-3" />}
                        {race}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <button
                type="button"
                disabled={humanoidSelections.length !== 2}
                onClick={() => {
                  if (humanoidSelections.length === 2) {
                    const value = `Humanoid: ${humanoidSelections.join(", ")}`;
                    onClassFeatureChoice(showHumanoidPopup.featureName, value);
                    setShowHumanoidPopup(null);
                    setHumanoidSelections([]);
                  }
                }}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border transition-all ${
                  humanoidSelections.length === 2
                    ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:border-2"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed"
                }`}
              >
                Confirm Selection ({humanoidSelections.length}/2)
              </button>
            </div>
          </div>
        </div>
      )}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
{showFeaturePopup.options.map((opt, idx) => {
                  const currentSelection = showFeaturePopup.isSubclass
                    ? subclassFeatureChoices[showFeaturePopup.name]
                    : classFeatureChoices[showFeaturePopup.name];
                  const isMultiSelect = (showFeaturePopup.count || 1) > 1;
                  const multiSelected = isMultiSelect && multiSelectSelections.includes(opt.name);
                  const isSelected = isMultiSelect ? multiSelected : currentSelection === opt.name;
                  const isDisabled = isMultiSelect && !multiSelected && multiSelectSelections.length >= (showFeaturePopup.count || 1);
                  return (
                    <div
                      key={idx}
                      className={`rounded-[var(--radius-sm)] border transition-all ${
                        isSelected
                          ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="w-full p-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (opt.name === "Humanoid (2 races)") {
                              setShowHumanoidPopup({ featureName: showFeaturePopup.name, level: lvl });
                              setHumanoidSelections([]);
                              setShowFeaturePopup(null);
                              return;
                            }
                            if (isMultiSelect) {
                              if (multiSelected) {
                                setMultiSelectSelections(multiSelectSelections.filter((s) => s !== opt.name));
                              } else if (multiSelectSelections.length < (showFeaturePopup.count || 1)) {
                                setMultiSelectSelections([...multiSelectSelections, opt.name]);
                              }
                              return;
                            }
                            if (showFeaturePopup.isSubclass) {
                              onSubclassFeatureChoice(showFeaturePopup.name, opt.name);
                            } else {
                              onClassFeatureChoice(showFeaturePopup.name, opt.name);
                            }
                            setShowFeaturePopup(null);
                          }}
                          disabled={isDisabled}
                          className={`w-full p-3 text-left ${
                            isSelected ? "text-[var(--color-surface)]" : "hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold flex items-center gap-2">
                              {isSelected && <Check className="h-3 w-3 shrink-0" />}
                              {opt.name}
                            </div>
                          </div>
                        </button>
                        {opt.description && (
                          <InfoButton title={opt.name} description={opt.description} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {(showFeaturePopup.count || 1) > 1 && (
              <div className="border-t border-[var(--color-border)] px-4 py-3">
                <button
                  type="button"
                  disabled={multiSelectSelections.length !== (showFeaturePopup.count || 1)}
                  onClick={() => {
                    if (multiSelectSelections.length === (showFeaturePopup.count || 1)) {
                      const value = multiSelectSelections.join(", ");
                      if (showFeaturePopup.isSubclass) {
                        onSubclassFeatureChoice(showFeaturePopup.name, value);
                      } else {
                        onClassFeatureChoice(showFeaturePopup.name, value);
                      }
                      setShowFeaturePopup(null);
                      setMultiSelectSelections([]);
                    }
                  }}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border transition-all ${
                    multiSelectSelections.length === (showFeaturePopup.count || 1)
                      ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:border-2"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed"
                  }`}
                >
                  Confirm Selection ({multiSelectSelections.length}/{showFeaturePopup.count || 1})
                </button>
              </div>
            )}
          </div>
         </div>
      )}

      {showTerrainModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTerrainModal(false); }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Choose Terrain</div>
              <button
                type="button"
                onClick={() => setShowTerrainModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Choose your terrain type to gain circle spells. These spells are always prepared and do not count against your preparation limit.
              </p>
              <div className="space-y-2">
                {getCircleTerrainTypes().map((terrain) => {
                  const isSelected = circleTerrain === terrain;
                  const terrainSpells = getCircleSpells(terrain, info.level);
                  const prevLevelSpells = info.level > 3 ? getCircleSpells(terrain, info.level - 1) : [];
                  const newSpells = terrainSpells.filter((name) => !prevLevelSpells.includes(name));
                  return (
                    <button
                      key={terrain}
                      type="button"
                      onClick={() => { onCircleTerrainChange(terrain); setShowTerrainModal(false); }}
                      className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                        isSelected
                          ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="font-semibold text-sm">{terrain.charAt(0).toUpperCase() + terrain.slice(1)}</div>
                      {newSpells.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newSpells.map((name) => {
                            const spellData = srdSpells.find((s) => s.name?.toLowerCase() === name.toLowerCase());
                            const desc = spellData?.description ? (Array.isArray(spellData.description) ? spellData.description.join(" ") : spellData.description) : undefined;
                            return (
                              <span key={name} className="flex items-center gap-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}>
                                  {name}
                                </span>
                                {desc && (
                                  <InfoButton title={name} description={desc} />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {terrainSpells.length > 0 && newSpells.length === 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {terrainSpells.map((name) => (
                            <span key={name} className={`text-[10px] font-bold px-1.5 py-0.5 rounded opacity-60 ${isSelected ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBonusCantripModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBonusCantripModal(false); }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Choose Bonus Cantrip</div>
              <button
                type="button"
                onClick={() => setShowBonusCantripModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Choose one additional druid cantrip. This cantrip does not count against your cantrip limit.
              </p>
              <div className="space-y-2">
                {getStaticSpells()
                  .filter((s) => s.level === 0 && s.classes?.includes("Druid"))
                  .map((sp) => {
                    const isSelected = bonusCantrip === sp.name;
                    const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                    return (
                      <div key={sp.name} className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { onBonusCantripChange(sp.name); setShowBonusCantripModal(false); }}
                          className={`flex-1 p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                            isSelected
                              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          <div className="font-semibold text-sm">{sp.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                          </div>
                        </button>
                        {desc && <InfoButton title={sp.name} description={desc} />}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubclassDetailsModal({
  subclass,
  characterClass,
  onClose,
}: {
  subclass: string;
  characterClass: string;
  onClose: () => void;
}) {
  const details = getStaticSubclassDetails(characterClass, subclass);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!details) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4">
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{subclass}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {details.description && details.description.length > 0 && (
            <div className="space-y-2">
              {details.description.map((desc: string, idx: number) => (
                <p key={idx} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {desc}
                </p>
              ))}
            </div>
          )}
          {details.features && details.features.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Features
              </div>
              {details.features.map((f: any, idx: number) => (
                <div key={idx} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{f.name}</span>
                    {f.level && (
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
                        Lv {f.level}
                      </span>
                    )}
                  </div>
                  {f.description && f.description.length > 0 && (
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                      {f.description.join(" ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-[var(--radius-sm)] bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function SpellSelection({
  character,
  count,
  cantripCount,
  maxLevel,
  spells,
  onSpellsChange,
}: {
  character: Character;
  count: number;
  cantripCount: number;
  maxLevel: number;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
}) {
  const isArcaneTrickster = character.subclass?.toLowerCase().includes("arcane trickster");
  const atSpells = isArcaneTrickster ? getStaticArcaneTricksterSpells() : [];
  const available = isArcaneTrickster
    ? atSpells.filter((s) => s.level === 0 || s.level <= maxLevel)
    : getStaticSpells(character.sources).filter((s) => s.classes?.includes(character.class) && (s.level === 0 || s.level <= maxLevel));
  const toggle = (name: string, level: number) => {
    if (spells.some((s) => s === `${name}:${level}`)) {
      onSpellsChange(spells.filter((s) => s !== `${name}:${level}`));
    } else {
      if (level === 0) {
        const currentCantrips = spells.filter((s) => s.endsWith(":0")).length;
        if (currentCantrips < cantripCount) onSpellsChange([...spells, `${name}:${level}`]);
      } else {
        const currentSpells = spells.filter((s) => !s.endsWith(":0")).length;
        if (currentSpells < count) onSpellsChange([...spells, `${name}:${level}`]);
      }
    }
  };
  const cantrips = available.filter((s) => s.level === 0);
  const levelSpells = available.filter((s) => s.level > 0);

  return (
    <div className="mt-2 space-y-2">
      {cantripCount > 0 && cantrips.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Cantrips</div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {cantrips.map((sp) => {
              const isSel = spells.includes(`${sp.name}:0`);
              const currentCantrips = spells.filter((s) => s.endsWith(":0")).length;
              const disabled = !isSel && currentCantrips >= cantripCount;
              return (
                <button
                  key={sp.name}
                  type="button"
                  onClick={() => toggle(sp.name, 0)}
                  disabled={disabled}
                  className={`w-full px-2 py-1 text-left text-[10px] rounded-[var(--radius-sm)] border transition-all ${
                    isSel
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                      : disabled
                        ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  {sp.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {count > 0 && levelSpells.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Spells</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {levelSpells.map((sp) => {
              const isSel = spells.includes(`${sp.name}:${sp.level}`);
              const currentSpells = spells.filter((s) => !s.endsWith(":0")).length;
              const disabled = !isSel && currentSpells >= count;
              return (
                <button
                  key={sp.name}
                  type="button"
                  onClick={() => toggle(sp.name, sp.level)}
                  disabled={disabled}
                  className={`w-full px-2 py-1 text-left text-[10px] rounded-[var(--radius-sm)] border transition-all ${
                    isSel
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                      : disabled
                        ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  {sp.name} <span className="text-[var(--color-text-muted)]">Lv {sp.level}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubclassSelectionModal({
  options,
  selected,
  characterClass,
  onSelect,
  onClose,
}: {
  options: { name: string; description: string; hasDetails: boolean }[];
  selected: string;
  characterClass: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [detailsView, setDetailsView] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">Choose Subclass</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {detailsView ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
              <button
                type="button"
                onClick={() => setDetailsView(null)}
                className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Back
              </button>
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{detailsView}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {(() => {
                const opt = options.find((o) => o.name === detailsView);
                if (!opt) return null;
                return (
                  <div className="space-y-3">
                    {opt.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{opt.description}</p>
                    )}
                    <SubclassDetailsModal subclass={detailsView} characterClass={characterClass} onClose={() => setDetailsView(null)} />
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {options.map((opt) => (
              <div key={opt.name} className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelect(opt.name)}
                  className={`flex-1 p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                    selected === opt.name
                      ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{opt.name}</span>
                    {opt.description && (
                      <InfoButton title={opt.name} description={opt.description} />
                    )}
                  </div>
                </button>
                {opt.hasDetails && (
                  <button
                    type="button"
                    onClick={() => setDetailsView(opt.name)}
                    className="h-10 w-10 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-active)] hover:text-[var(--color-text-primary)] transition-all"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

