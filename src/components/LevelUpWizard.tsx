"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { WizardNav } from "./WizardNav";
import { getStaticClass, getStaticSubclasses, getStaticSpells, getStaticSubclassDetails } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, computeDerivedStats, isPreparationCaster, getMaxBardicInspirationUses, getBardicInspirationDie, getSongOfRestDie, hasFontOfInspiration, getDomainSpellNames, getCircleTerrainTypes, getCircleSpells, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";
import { normalizeDescription } from "@/lib/level-up";
import {
  Heart,
  Lightning,
  ChartBar,
  Sparkle,
  MagicWand,
  Crown,
  Sword,
  Book,
  Star,
  Check,
  Minus,
  Plus,
  Info,
  X,
  CaretDown,
  Bell,
  Leaf,
} from "phosphor-react";
import { InfoButton } from "@/components/InfoButton";
import { useSRD } from "@/contexts/SRDContext";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

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
  features: { name: string; description: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
  cantripsKnown?: number;
  spellsKnown?: number;
  classFeatures: { name: string; value: string }[];
  subclassOptions?: { name: string; description: string; hasDetails: boolean }[];
  subclassFeatureChoices?: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[];
  classFeatureChoices?: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[];
  hasSpellSelection: boolean;
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
    const subclasses = getStaticSubclasses(className);
    const subclassOptions = level === unlockLevel && !character.subclass && subclasses.length > 0
      ? subclasses.map((s) => ({ name: s.name, description: s.description, hasDetails: true }))
      : undefined;

    const subclassFeatureChoices: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[] = [];
    const passiveSubclassFeatures: { name: string; description: string }[] = [];
    if (subclassSelection && level >= unlockLevel) {
      const selectedSubclass = subclasses.find((s) => s.name === subclassSelection);
      if (selectedSubclass) {
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
            passiveSubclassFeatures.push({ name: f.name, description: desc });
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
    const hasSpellSelectionFromClass = !!(classData.spellcastingAbility && (slotsChanged || cantripsChanged || spellsKnownChanged));
    const hasSpellSelection = hasSpellSelectionFromClass || (isArcaneTrickster && (slotsChanged || cantripsChanged || spellsKnownChanged));
    const maxSpellLevel = spellSlots ? Math.max(...Object.keys(spellSlots).map(Number)) : 0;

    // Spell selection count is based on class-specific rules, NEVER on slot counts
    const isSpellsKnownCaster = ["Sorcerer", "Bard", "Warlock", "Ranger", "Paladin"].includes(className);
    const isPrepCaster = ["Cleric", "Druid"].includes(className);
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
      const abilityMod = getModifier(character[classData.spellcastingAbility as keyof Character] as number);
      const maxPrepared = Math.max(1, abilityMod + level);
      const prevMaxPrepared = level > 1 ? Math.max(1, abilityMod + (level - 1)) : 0;
      spellSelectionCount = maxPrepared - prevMaxPrepared;
      if (spellSelectionCount <= 0) spellSelectionCount = 0;
    }

    const isBard = className === "Bard";
    const magicalSecretsLevels = [10, 14, 18];
    const magicalSecretsCount = isBard && magicalSecretsLevels.includes(level) ? 2 : 0;
    const canReplaceSpell = isBard && level > 1 && (character.spells || []).length > 0;
    const isLoreBard = isBard && subclassSelection === "Lore";
    const subclassSpellSelectionCount = isLoreBard && level === 6 ? 2 : 0;

    const allFeatures = [...features, ...passiveSubclassFeatures];

    infos.push({
      level,
      hp: { hitDie, conMod, average: averageHp },
      proficiencyBonus: getProficiencyBonus(level),
      features: allFeatures,
      asi,
      spellSlots,
      cantripsKnown,
      spellsKnown,
      classFeatures,
      subclassOptions,
      subclassFeatureChoices: subclassFeatureChoices.length > 0 ? subclassFeatureChoices : undefined,
      classFeatureChoices: classFeatureChoices.length > 0 ? classFeatureChoices : undefined,
      hasSpellSelection,
      spellSelectionCount,
      cantripSelectionCount: cantripsDelta,
      maxSpellLevel,
      spellsKnownChanged,
      prevSpellsKnown,
      magicalSecretsCount,
      canReplaceSpell,
      subclassSpellSelectionCount,
      circleTerrainSelection: className === "Druid" && subclassSelection === "Land" && [3, 5, 7, 9].includes(level),
      bonusCantripSelection: className === "Druid" && subclassSelection === "Land" && level === 2,
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
  const [asiSelections, setAsiSelections] = useState<Record<number, { mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey }>>({});
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [classFeatureChoices, setClassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});
  const [magicalSecretsSelections, setMagicalSecretsSelections] = useState<Record<number, string[]>>({});
  const [subclassSpellSelections, setSubclassSpellSelections] = useState<Record<number, string[]>>({});
  const [circleTerrainSelections, setCircleTerrainSelections] = useState<Record<number, string>>({});
  const [bonusCantripSelections, setBonusCantripSelections] = useState<Record<number, string>>({});
  const [replacedSpells, setReplacedSpells] = useState<Record<number, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const prevTargetLevelRef = useRef(targetLevel);

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
  const setAsi = (level: number, patch: Partial<{ mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey }>) =>
    setAsiSelections((prev) => ({ ...prev, [level]: { ...(prev[level] || { mode: "single" }), ...patch } as any }));
  const setSpells = (level: number, list: string[]) => setSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setMagicalSecrets = (level: number, list: string[]) => setMagicalSecretsSelections((prev) => ({ ...prev, [level]: list }));
  const setSubclassSpells = (level: number, list: string[]) => setSubclassSpellSelections((prev) => ({ ...prev, [level]: list }));
  const setReplacedSpell = (level: number, spellId: string) => setReplacedSpells((prev) => ({ ...prev, [level]: spellId }));
  const setCircleTerrain = (level: number, terrain: string) => setCircleTerrainSelections((prev) => ({ ...prev, [level]: terrain }));
  const setBonusCantrip = (level: number, cantrip: string) => setBonusCantripSelections((prev) => ({ ...prev, [level]: cantrip }));

  const buildAllocation = (st?: { mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey }): Record<AbilityKey, number> => {
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

  const asiIsValid = (st?: { mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey }): boolean => {
    if (!st || !st.mode) return false;
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
    const items: { level: number; label: string }[] = [];
    for (const info of levelInfos) {
      const lvl = info.level;
      const isLevelOneAuto = lvl === 1 && startFromLevelOne;
      if (info.asi) {
        const sel = asiSelections[lvl];
        const isValid = (sel?.mode === "single" && !!sel?.single) || (sel?.mode === "double" && !!sel?.d1 && !!sel?.d2 && sel?.d1 !== sel?.d2);
        if (!isValid) items.push({ level: lvl, label: `Level ${lvl} — Ability Score Improvement` });
      }
      if (info.subclassOptions && !subclassSelection) {
        items.push({ level: lvl, label: `Level ${lvl} — Choose Subclass` });
      }
      if (info.hasSpellSelection) {
        const lvlSpells = spellSelections[lvl] || [];
        const cantripsCount = lvlSpells.filter((s) => s.endsWith(":0")).length;
        const spellsCount = lvlSpells.filter((s) => !s.endsWith(":0")).length;
        if (cantripsCount < info.cantripSelectionCount) {
          items.push({ level: lvl, label: `Level ${lvl} — Select ${info.cantripSelectionCount - cantripsCount} more cantrip${info.cantripSelectionCount - cantripsCount > 1 ? "s" : ""}` });
        }
        if (spellsCount < info.spellSelectionCount) {
          items.push({ level: lvl, label: `Level ${lvl} — Select ${info.spellSelectionCount - spellsCount} more spell${info.spellSelectionCount - spellsCount > 1 ? "s" : ""}` });
        }
      }
      if (info.subclassFeatureChoices) {
        const choices = subclassFeatureChoices[lvl] || {};
        for (const fc of info.subclassFeatureChoices) {
          if (!choices[fc.name]) items.push({ level: lvl, label: `Level ${lvl} — ${fc.name}` });
        }
      }
      if (info.classFeatureChoices) {
        const choices = classFeatureChoices[lvl] || {};
        for (const fc of info.classFeatureChoices) {
          if (!choices[fc.name]) items.push({ level: lvl, label: `Level ${lvl} — ${fc.name}` });
        }
      }
      if (!isLevelOneAuto) {
        if (!hpValues[lvl] || hpValues[lvl] <= 0) {
          items.push({ level: lvl, label: `Level ${lvl} — Roll HP` });
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
      const alloc = buildAllocation(st);
      const hasAlloc = Object.values(alloc).some((v) => v > 0);
      if (!hasAlloc) continue;
      draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
      for (const { key } of ABILITIES) {
        const add = alloc[key] || 0;
        if (add > 0) draft = { ...draft, [key]: ((draft[key] as number) || 0) + add };
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
          const spell = getStaticSpells().find((s) => s.name === name);
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
          const spell = getStaticSpells().find((s) => s.name === name);
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
          const spell = getStaticSpells().find((s) => s.name === name);
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
    if (isPreparationCaster(draft)) {
      draft.preparedSpells = [...(character.preparedSpells || []), ...newPreparedIds];
    }
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
          const spell = getStaticSpells().find((s) => s.name?.toLowerCase() === name.toLowerCase());
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

    if (draft.class === "Druid" && draft.subclass === "Land") {
      const selectedTerrain = circleTerrainSelections[targetLevel] || draft.circleTerrain;
      if (selectedTerrain) {
        draft.circleTerrain = selectedTerrain;
        const circleSpellNames = getCircleSpells(selectedTerrain, draft.level);
        const currentSpellNames = spells.map((s) => s.name?.toLowerCase());

        for (const name of circleSpellNames) {
          if (!currentSpellNames.includes(name.toLowerCase())) {
            const spell = getStaticSpells().find((s) => s.name?.toLowerCase() === name.toLowerCase());
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

    if (draft.class === "Druid" && draft.subclass === "Land") {
      const selectedBonusCantrip = bonusCantripSelections[targetLevel];
      if (selectedBonusCantrip && !draft.bonusCantrips.includes(selectedBonusCantrip)) {
        const spell = getStaticSpells().find((s) => s.name?.toLowerCase() === selectedBonusCantrip.toLowerCase());
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

    let finalChar = applySubclassFeatures(draft);
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
      setHpValues({});
      setAsiSelections({});
      setSpellSelections({});
      setMagicalSecretsSelections({});
      setReplacedSpells({});
      setSubclassFeatureChoices({});
      setClassFeatureChoices({});
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
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
                    onClick={() => setShowNotifPanel(false)}
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
            <LevelCard
              key={info.level}
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
            />
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
  asiSelection?: { mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey };
  onAsiChange: (patch: Partial<{ mode: "single" | "double"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey }>) => void;
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
}: LevelCardProps) {
    const [showSpellSelection, setShowSpellSelection] = useState(false);
    const [showSubclassDetails, setShowSubclassDetails] = useState<string | null>(null);
    const [showSubclassModal, setShowSubclassModal] = useState(false);
    const [showSpellModal, setShowSpellModal] = useState(false);
    const [showTerrainModal, setShowTerrainModal] = useState(false);
    const [showBonusCantripModal, setShowBonusCantripModal] = useState(false);
    const [showFeaturePopup, setShowFeaturePopup] = useState<{ name: string; description: string; options: { name: string; description: string }[]; isSubclass: boolean; count?: number } | null>(null);
    const [multiSelectSelections, setMultiSelectSelections] = useState<string[]>([]);
    const [showHumanoidPopup, setShowHumanoidPopup] = useState<{ featureName: string; level: number } | null>(null);
    const [humanoidSelections, setHumanoidSelections] = useState<string[]>([]);
    const [showAsiModal, setShowAsiModal] = useState(false);
    const [asiAllocation, setAsiAllocation] = useState<Record<AbilityKey, number>>({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    const lvl = info.level;
    const { data } = useSRD();
  const srdSpells = data?.spells || [];

  const isHpComplete = hpValue > 0;
  const isAsiComplete = !info.asi || (asiSelection?.mode === "single" && !!asiSelection?.single) || (asiSelection?.mode === "double" && !!asiSelection?.d1 && !!asiSelection?.d2 && asiSelection?.d1 !== asiSelection?.d2);
  const isSubclassComplete = !info.subclassOptions || !!subclassSelection;
  const isFeatureChoicesComplete = !info.subclassFeatureChoices || info.subclassFeatureChoices.every((fc) => subclassFeatureChoices[fc.name]);
  const isClassFeatureChoicesComplete = !info.classFeatureChoices || info.classFeatureChoices.every((fc) => classFeatureChoices[fc.name]);
  const isComplete = isHpComplete && isAsiComplete && isSubclassComplete && isFeatureChoicesComplete && isClassFeatureChoicesComplete;

  const totalAsiPoints = Object.values(asiAllocation).reduce((sum, val) => sum + val, 0);
  const canApplyAsi = totalAsiPoints === 2;

  const openAsiModal = () => {
    const sel = asiSelection;
    const alloc: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (sel?.mode === "single" && sel.single) alloc[sel.single] = 2;
    if (sel?.mode === "double") {
      if (sel.d1) alloc[sel.d1] = 1;
      if (sel.d2) alloc[sel.d2] = 1;
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
          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
            <Heart weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
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
                className="w-16 text-center text-sm font-bold rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1"
                placeholder={String(averageHp)}
              />
            )}
          </div>

          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
            <Star weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Proficiency Bonus</div>
              <div className="text-xs text-[var(--color-text-primary)]">+{info.proficiencyBonus}</div>
            </div>
          </div>

          {info.classFeatures.length > 0 && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Sword weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
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
               <Lightning weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
               <div className="flex-1">
                 <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">New Features</div>
                 <div className="space-y-1 mt-1">
                   {info.features.map((f) => (
                     <div key={f.name} className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                       <span className="font-semibold">{f.name}</span>
                       {f.description && (
                         <InfoButton title={f.name} description={f.description} />
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}

           {info.asi && (
             <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
               <ChartBar weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
               <div className="flex-1">
                 <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Ability Score Improvement</div>
                 <button
                   type="button"
                   onClick={openAsiModal}
                   className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                 >
                   <span>
                     {asiSelection?.mode === "single" && asiSelection.single
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
              <Sparkle weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
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

          {info.cantripsKnown !== undefined && (
            <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <MagicWand weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Cantrips Known</div>
                <div className="text-xs text-[var(--color-text-primary)]">{info.cantripsKnown}</div>
              </div>
            </div>
          )}

          {info.spellsKnown !== undefined && (
            <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Book weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spells Known</div>
                <div className="text-xs text-[var(--color-text-primary)]">
                  {info.spellsKnown}
                  {info.spellsKnownChanged && info.prevSpellsKnown !== undefined && (
                    <span className="ml-1 text-green-600">(+{info.spellsKnown - info.prevSpellsKnown})</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {info.subclassOptions && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Crown weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
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
                      <Crown weight="regular" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
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
                      <Sword weight="regular" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
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

          {info.hasSpellSelection && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <MagicWand weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => setShowSpellModal(true)}
                  className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline"
                >
                  {info.spellsKnownChanged
                    ? `Choose ${info.spellSelectionCount} New Spell${info.spellSelectionCount > 1 ? "s" : ""}`
                    : "Open Spell Selection"}
                  {info.cantripSelectionCount > 0 && ` (+${info.cantripSelectionCount} cantrips)`}
                </button>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  You can replace one known spell when leveling up
                </p>
              </div>
            </div>
          )}

          {info.magicalSecretsCount > 0 && (
            <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkle weight="regular" className="h-3.5 w-3.5 text-purple-600" />
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
                <Sparkle weight="regular" className="h-3.5 w-3.5 text-indigo-600" />
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
                <Book weight="regular" className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Replace Known Spell</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Optionally replace one known spell with another from the Bard list</p>
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
                <MagicWand weight="regular" className="h-3.5 w-3.5 text-teal-600" />
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
                <Leaf weight="regular" className="h-3.5 w-3.5 text-green-600" />
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
                  const spell = getStaticSpells().find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
          character={character}
          count={info.spellSelectionCount}
          cantripCount={info.cantripSelectionCount}
          maxLevel={info.maxSpellLevel}
          spells={spells}
          onSpellsChange={onSpellsChange}
          onClose={() => setShowSpellModal(false)}
          existingSpells={character.spells?.filter((s) => s.level > 0) || []}
          spellsKnownChanged={info.spellsKnownChanged}
          earlierSelections={Object.entries(allSpellSelections).filter(([l]) => Number(l) < info.level).flatMap(([, s]) => s)}
          magicalSecretsCount={info.magicalSecretsCount}
          magicalSecretsSpells={magicalSecretsSpells}
          onMagicalSecretsChange={onMagicalSecretsChange}
          subclassSpellSelectionCount={info.subclassSpellSelectionCount}
          subclassSpellSelections={subclassSpellSelections}
          onSubclassSpellSelectionsChange={onSubclassSpellSelectionsChange}
        />
      )}

      {showAsiModal && info.asi && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAsiModal(false); }}
        >
          <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                Ability Score Improvement (Level {lvl})
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 space-y-4">
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
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
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

      {showFeaturePopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
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
                          ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                          : isDisabled
                            ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50 cursor-not-allowed"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
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
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)] text-[var(--color-text-primary)] hover:border-2"
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
                    <button
                      key={idx}
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
                      className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                        isSelected
                          ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                          : isDisabled
                            ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50 cursor-not-allowed"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                          {isSelected && <Check className="h-3 w-3 shrink-0" />}
                          {opt.name}
                        </div>
                        {opt.description && (
                          <InfoButton title={opt.name} description={opt.description} />
                        )}
                      </div>
                    </button>
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
                      ? "border-[var(--color-border-active)] bg-[var(--color-bg)] text-[var(--color-text-primary)] hover:border-2"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
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
                          ? "bg-green-600 text-white border-2 border-green-700"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
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
                              ? "bg-teal-600 text-white border-2 border-teal-700"
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
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
  const spellClasses = isArcaneTrickster ? [character.class, "Wizard"] : [character.class];
  const available = getStaticSpells().filter((s) => s.classes?.some(c => spellClasses.includes(c)) && (s.level === 0 || s.level <= maxLevel));
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
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
                      ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">{opt.name}</div>
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

function SpellSelectionModal({
  character,
  count,
  cantripCount,
  maxLevel,
  spells,
  onSpellsChange,
  onClose,
  existingSpells,
  spellsKnownChanged,
  earlierSelections,
  magicalSecretsCount,
  magicalSecretsSpells,
  onMagicalSecretsChange,
  subclassSpellSelectionCount,
  subclassSpellSelections,
  onSubclassSpellSelectionsChange,
}: {
  character: Character;
  count: number;
  cantripCount: number;
  maxLevel: number;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
  onClose: () => void;
  existingSpells?: { name: string; level: number }[];
  spellsKnownChanged?: boolean;
  earlierSelections?: string[];
  magicalSecretsCount?: number;
  magicalSecretsSpells?: string[];
  onMagicalSecretsChange?: (list: string[]) => void;
  subclassSpellSelectionCount?: number;
  subclassSpellSelections?: string[];
  onSubclassSpellSelectionsChange?: (list: string[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<"cantrips" | number | "magical-secrets" | "subclass-spells">("cantrips");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isArcaneTrickster = character.subclass?.toLowerCase().includes("arcane trickster");
  const spellClasses = isArcaneTrickster ? [character.class, "Wizard"] : [character.class];
  const allSpells = getStaticSpells().filter((s) => s.classes?.some(c => spellClasses.includes(c)) && (s.level === 0 || s.level <= maxLevel));
  const allClassSpells = getStaticSpells().filter((s) => s.level > 0 && s.level <= maxLevel);
  const existingCantripNames = new Set((character.cantrips || []).map(c => c.name));
  const earlierSpellNames = new Set((earlierSelections || []).map(s => s.split(":")[0]));
  const alreadyKnownCantripNames = new Set([...existingCantripNames, ...earlierSpellNames]);
  const cantrips = allSpells.filter((s) => s.level === 0);
  const levelSpells: { [key: number]: typeof allSpells } = {};
  for (const sp of allSpells) {
    if (sp.level > 0) {
      if (!levelSpells[sp.level]) levelSpells[sp.level] = [];
      levelSpells[sp.level].push(sp);
    }
  }
  const spellLevels = Object.keys(levelSpells).map(Number).sort((a, b) => a - b);

  const msLevelSpells: { [key: number]: typeof allClassSpells } = {};
  for (const sp of allClassSpells) {
    if (!msLevelSpells[sp.level]) msLevelSpells[sp.level] = [];
    msLevelSpells[sp.level].push(sp);
  }
  const msSpellLevels = Object.keys(msLevelSpells).map(Number).sort((a, b) => a - b);

  const existingSpellNames = new Set((existingSpells || []).map(s => s.name));
  const alreadyKnownSpellNames = new Set([...existingSpellNames, ...earlierSpellNames]);

  const msExistingSpellNames = new Set((character.spells || []).map(s => s.name));
  const msAlreadyKnown = new Set([...msExistingSpellNames, ...new Set((magicalSecretsSpells || []).map(s => s.split(":")[0]))]);

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

  const toggleMagicalSecrets = (name: string, level: number) => {
    if (!magicalSecretsSpells || !onMagicalSecretsChange) return;
    if (magicalSecretsSpells.some((s) => s === `${name}:${level}`)) {
      onMagicalSecretsChange(magicalSecretsSpells.filter((s) => s !== `${name}:${level}`));
    } else {
      if (magicalSecretsSpells.length < (magicalSecretsCount || 0)) {
        onMagicalSecretsChange([...magicalSecretsSpells, `${name}:${level}`]);
      }
    }
  };

  const toggleSubclassSpells = (name: string, level: number) => {
    if (!subclassSpellSelections || !onSubclassSpellSelectionsChange) return;
    if (subclassSpellSelections.some((s) => s === `${name}:${level}`)) {
      onSubclassSpellSelectionsChange(subclassSpellSelections.filter((s) => s !== `${name}:${level}`));
    } else {
      if (subclassSpellSelections.length < (subclassSpellSelectionCount || 0)) {
        onSubclassSpellSelectionsChange([...subclassSpellSelections, `${name}:${level}`]);
      }
    }
  };

  const currentCantrips = spells.filter((s) => s.endsWith(":0"));
  const currentSpells = spells.filter((s) => !s.endsWith(":0"));

  const selectedCantripNames = new Set(currentCantrips.map(s => s.split(":")[0]));
  const selectedSpellNames = new Set(currentSpells.map(s => s.split(":")[0]));
  const msSelectedNames = new Set((magicalSecretsSpells || []).map(s => s.split(":")[0]));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            {cantripCount > 0 && count === 0
              ? `Learn ${cantripCount} Additional Cantrip${cantripCount > 1 ? "s" : ""}`
              : spellsKnownChanged
                ? `Choose ${count} New Spell${count > 1 ? "s" : ""}`
                : "Replace a Spell"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(currentCantrips.length > 0 || currentSpells.length > 0) && (
          <div className="px-4 py-2 bg-green-50 border-b border-[var(--color-border)]">
            <div className="text-[10px] font-semibold text-green-700 mb-1">
              Selected this level ({currentCantrips.length + currentSpells.length} of {cantripCount + count})
            </div>
            <div className="flex flex-wrap gap-1">
              {currentCantrips.map((s) => {
                const name = s.split(":")[0];
                return (
                  <span key={s} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 border border-green-300 rounded-full text-green-800">
                    {name}
                    <button type="button" onClick={() => onSpellsChange(spells.filter(x => x !== s))} className="hover:text-red-600 font-bold">×</button>
                  </span>
                );
              })}
              {currentSpells.map((s) => {
                const name = s.split(":")[0];
                const lvl = s.split(":")[1];
                return (
                  <span key={s} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 border border-green-300 rounded-full text-green-800">
                    {name} <span className="text-green-600">Lv {lvl}</span>
                    <button type="button" onClick={() => onSpellsChange(spells.filter(x => x !== s))} className="hover:text-red-600 font-bold">×</button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {cantripCount > 0 && count === 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-[var(--color-border)]">
            <p className="text-[10px] text-blue-700">
              You can now learn {cantripCount} additional cantrip{cantripCount > 1 ? "s" : ""}. Select from the tab below.
            </p>
          </div>
        )}
        {spellsKnownChanged && !(cantripCount > 0 && count === 0) && (
          <div className="px-4 py-2 bg-blue-50 border-b border-[var(--color-border)]">
            <p className="text-[10px] text-blue-700">
              You learned {count} new spell{count > 1 ? "s" : ""}. Select from the tabs below.
            </p>
          </div>
        )}
        {!spellsKnownChanged && existingSpells && existingSpells.length > 0 && !(cantripCount > 0 && count === 0) && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-[var(--color-border)]">
            <p className="text-[10px] text-yellow-700 mb-1">Replace a spell (optional):</p>
            <div className="flex flex-wrap gap-1">
              {existingSpells.map((sp) => (
                <span key={`${sp.name}:${sp.level}`} className="text-[10px] px-1.5 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full">
                  {sp.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex-shrink-0 flex border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab("cantrips")}
            className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeTab === "cantrips"
                ? "text-[var(--color-text-primary)] bg-[var(--color-bg)] border-b-2 border-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            Cantrips ({currentCantrips.length}/{cantripCount})
          </button>
          {spellLevels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveTab(lvl)}
              className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
                activeTab === lvl
                  ? "text-[var(--color-text-primary)] bg-[var(--color-bg)] border-b-2 border-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              }`}
            >
              Level {lvl} ({currentSpells.length}/{count})
            </button>
          ))}
          {(magicalSecretsCount || 0) > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("magical-secrets")}
              className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
                activeTab === "magical-secrets"
                  ? "text-purple-700 bg-purple-50 border-b-2 border-purple-600"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              }`}
            >
              Magical Secrets ({(magicalSecretsSpells || []).length}/{magicalSecretsCount})
            </button>
          )}
          {(subclassSpellSelectionCount || 0) > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("subclass-spells")}
              className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
                activeTab === "subclass-spells"
                  ? "text-indigo-700 bg-indigo-50 border-b-2 border-indigo-600"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              }`}
            >
              Lore Spells ({(subclassSpellSelections || []).length}/{subclassSpellSelectionCount})
            </button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {activeTab === "cantrips" ? (
            <div className="space-y-1.5">
              {cantrips.map((sp) => {
                const isSel = selectedCantripNames.has(sp.name);
                const isAlreadyKnown = alreadyKnownCantripNames.has(sp.name);
                const disabled = !isSel && !isAlreadyKnown && currentCantrips.length >= cantripCount;
                const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                return (
                  <div key={sp.name} className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => !isAlreadyKnown && toggle(sp.name, 0)}
                      disabled={disabled || isAlreadyKnown}
                      className={`flex-1 px-3 py-2 text-left rounded-lg border transition-all ${
                        isAlreadyKnown
                          ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-60 cursor-default"
                          : isSel
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-2 border-[var(--border-active)]"
                            : disabled
                              ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-text-secondary)]" />}
                        {isSel && !isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-surface)]" />}
                        <span className={`text-xs font-bold ${isAlreadyKnown ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                        {isAlreadyKnown && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Already known</span>}
                        {isSel && !isAlreadyKnown && <span className="text-[10px] text-[var(--color-surface)] font-medium">Selected</span>}
                      </div>
                    </button>
                    {desc && <InfoButton title={sp.name} description={desc} />}
                  </div>
                );
              })}
            </div>
          ) : activeTab === "magical-secrets" ? (
            <div className="space-y-3">
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-[10px] text-purple-700">
                  Choose {magicalSecretsCount} spell{magicalSecretsCount! > 1 ? "s" : ""} from any class. These count as bard spells.
                </p>
              </div>
              {msSpellLevels.map((lvl) => (
                <div key={lvl}>
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1">Level {lvl}</div>
                  <div className="space-y-1.5">
                    {msLevelSpells[lvl]?.map((sp) => {
                      const isSel = msSelectedNames.has(sp.name);
                      const isAlreadyKnown = msAlreadyKnown.has(sp.name) && !isSel;
                      const disabled = !isSel && (magicalSecretsSpells || []).length >= (magicalSecretsCount || 0);
                      const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                      return (
                        <div key={sp.name} className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => !isAlreadyKnown && toggleMagicalSecrets(sp.name, sp.level)}
                            disabled={disabled || isAlreadyKnown}
                            className={`flex-1 px-3 py-2 text-left rounded-lg border transition-all ${
                              isAlreadyKnown
                                ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-60 cursor-default"
                                : isSel
                                  ? "bg-purple-600 text-white border-2 border-purple-700"
                                  : disabled
                                    ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-text-secondary)]" />}
                              {isSel && !isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-white" />}
                              <span className={`text-xs font-bold ${isAlreadyKnown ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 ml-5">
                              <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">{sp.castingTime}</span>
                              {sp.classes && <span className="text-[10px] text-purple-600 ml-1">[{sp.classes.join(", ")}]</span>}
                            </div>
                          </button>
                          {desc && <InfoButton title={sp.name} description={desc} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "subclass-spells" ? (
            <div className="space-y-3">
              <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-[10px] text-indigo-700">
                  Choose {subclassSpellSelectionCount} spell{subclassSpellSelectionCount! > 1 ? "s" : ""} from any class (Lore feature). These do not count against spells known.
                </p>
              </div>
              {msSpellLevels.map((lvl) => (
                <div key={lvl}>
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1">Level {lvl}</div>
                  <div className="space-y-1.5">
                    {msLevelSpells[lvl]?.map((sp) => {
                      const isSel = (subclassSpellSelections || []).some((s) => s.split(":")[0] === sp.name);
                      const isAlreadyKnown = msAlreadyKnown.has(sp.name) && !isSel;
                      const disabled = !isSel && (subclassSpellSelections || []).length >= (subclassSpellSelectionCount || 0);
                      const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                      return (
                        <div key={sp.name} className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => !isAlreadyKnown && toggleSubclassSpells(sp.name, sp.level)}
                            disabled={disabled || isAlreadyKnown}
                            className={`flex-1 px-3 py-2 text-left rounded-lg border transition-all ${
                              isAlreadyKnown
                                ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-60 cursor-default"
                                : isSel
                                  ? "bg-indigo-600 text-white border-2 border-indigo-700"
                                  : disabled
                                    ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-text-secondary)]" />}
                              {isSel && !isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-white" />}
                              <span className={`text-xs font-bold ${isAlreadyKnown ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 ml-5">
                              <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">{sp.castingTime}</span>
                              {sp.classes && <span className="text-[10px] text-indigo-600 ml-1">[{sp.classes.join(", ")}]</span>}
                            </div>
                          </button>
                          {desc && <InfoButton title={sp.name} description={desc} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {levelSpells[activeTab as number]?.map((sp) => {
                const isSel = selectedSpellNames.has(sp.name);
                const isAlreadyKnown = alreadyKnownSpellNames.has(sp.name);
                const disabled = !isSel && !isAlreadyKnown && currentSpells.length >= count;
                const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                return (
                  <div key={sp.name} className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => !isAlreadyKnown && toggle(sp.name, sp.level)}
                      disabled={disabled || isAlreadyKnown}
                      className={`flex-1 px-3 py-2 text-left rounded-lg border transition-all ${
                        isAlreadyKnown
                          ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-60 cursor-default"
                          : isSel
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-2 border-[var(--border-active)]"
                            : disabled
                              ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-text-secondary)]" />}
                        {isSel && !isAlreadyKnown && <Check weight="fill" className="h-3 w-3 text-[var(--color-surface)]" />}
                        <span className={`text-xs font-bold ${isAlreadyKnown ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.castingTime}</span>
                        {isAlreadyKnown && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium ml-1">Already known</span>}
                        {isSel && !isAlreadyKnown && <span className="text-[10px] text-[var(--color-surface)] font-medium ml-1">Selected</span>}
                      </div>
                    </button>
                    {desc && <InfoButton title={sp.name} description={desc} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90 transition-all"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}


