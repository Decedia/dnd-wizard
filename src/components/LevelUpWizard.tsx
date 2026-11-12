"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { WizardNav, WIZARD_NAV_SPACE } from "./WizardNav";
import { getStaticClass, getStaticSubclasses, getStaticSpells, getSubclassFlags, getPactBoons, getStaticFeat, getStaticEquipments } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, computeDerivedStats, getMaxBardicInspirationUses, getDomainSpellNames, getCircleTerrainTypes, getCircleSpells, getOathSpellNames, getWizardTraditionSpellNames, isThirdCaster, getHpBonusPerLevel, castsSpells, getMaxPreparedSpells, isPreparationCaster, type Character } from "@/lib/storage";
import { fillPrepared, preparableSpells } from "@/lib/prepared-spells";
import { spellChoicePool, THIRD_CASTER_SCHOOLS } from "@/lib/spell-pool";
import { quickSpellOrder, QUICK_SPELL_ORDER } from "@/lib/quick-create";
import { PrepareSpellsSheet } from "@/components/PrepareSpellsSheet";
import { applySubclassFeatures, applySubclassSpellGrants, syncBaseFeatures } from "@/lib/character-creation";
import { normalizeDescription } from "@/lib/level-up";
import { applyFeatGrants, encodeFeatOptions, featAbilityIncreases } from "@/lib/feat-grants";
import { REPEATABLE_FEATS } from "@/lib/feature-groups";
import { isUnknownAsi, type LevelPicks } from "@/lib/level-choices";
import { usesOptionalClassFeatures } from "@/data/optional-class-features";
import { getTakenSpellNames } from "@/lib/taken-spells";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations as enTranslations } from "@/locales/en";
import { translations as idTranslations } from "@/locales/id";
import { CheckIcon as Check, MinusIcon as Minus, PlusIcon as Plus, BellIcon as Bell, TargetIcon as Target } from "@/components/icons";
import { GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { getStaticFeats } from "@/lib/srd-client";
import { getFeatOptionGroups } from "@/data/feat-options";
import { SUBCLASS_PICKS, FIGHTING_STYLE_PICKS, METAMAGIC_PICKS, MANEUVER_PICKS, INVOCATION_PICKS, asiPicks, expertisePicks, spellPicks, topPicks, type Pick as SuggestedPick, type Why } from "@/lib/level-up-picks";
import { PickCards, type PickCard } from "./level-up/PickCards";
import { ABILITIES, AbilityKey, LevelInfo, LevelPart, LevelUpWizardProps, buildLevelInfos, getAvailableInvocations, levelParts, partOfSection } from "./level-up/level-infos";
import { LevelCard } from "./level-up/LevelCard";
import { StatCard } from "./level-up/StatCard";


export function LevelUpWizard({ character, onCancel, onComplete, minLevel, maxLevel, title, subtitle, startFromLevelOne, initialLevel, auto, autoView, onAutoStuck, subclassOnly, suggestAll, redo }: LevelUpWizardProps) {
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

  const [targetLevel, setTargetLevel] = useState(Math.min(effectiveMaxLevel, Math.max(effectiveMinLevel, initialLevel ?? currentLevel + 1)));
  // HP isn't asked when only picks are changed (a subclass or one past level).
  const hpLocked = !!subclassOnly || !!redo;
  const redoLevel = redo ? effectiveMaxLevel : 0;
  const redoAt = <T,>(value: T | undefined): Record<number, T> => (redo && value !== undefined ? { [redoLevel]: value } : {});
  // New levels start at the average roll, so a new player never has to type HP.
  const [hpValues, setHpValues] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) init[lvl] = averageHp;
    return init;
  });
  const [asiSelections, setAsiSelections] = useState<Record<number, { mode: "single" | "double" | "feat"; single?: AbilityKey; d1?: AbilityKey; d2?: AbilityKey; feat?: string; featOptions?: Record<string, string> }>>(() =>
    redo?.asi && !isUnknownAsi(redo.asi) ? { [redoLevel]: redo.asi } : {}
  );
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [subclassIndex, setSubclassIndex] = useState<string>(character.subclassIndex || "");

  const handleSubclassSelect = useCallback((name: string) => {
    setSubclassSelection(name);
    const normalized = name.toLowerCase().replace(/\s+/g, "-");
    setSubclassIndex(normalized);
  }, []);


  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<number, Record<string, string>>>(() => redoAt(redo?.subclassFeatures));
  const [classFeatureChoices, setClassFeatureChoices] = useState<Record<number, Record<string, string>>>(() => redoAt(redo?.classFeatures));
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>(() => redoAt(redo?.spells));
  // The Wizard's prepared list as edited on the recap; null keeps the suggested set.
  const [preparedOverride, setPreparedOverride] = useState<string[] | null>(null);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [magicalSecretsSelections, setMagicalSecretsSelections] = useState<Record<number, string[]>>(() => redoAt(redo?.magicalSecrets));
  const [subclassSpellSelections, setSubclassSpellSelections] = useState<Record<number, string[]>>(() => redoAt(redo?.subclassSpells));
  const [circleTerrainSelections, setCircleTerrainSelections] = useState<Record<number, string>>({});
  const [bonusCantripSelections, setBonusCantripSelections] = useState<Record<number, string>>({});
  const [replacedSpells, setReplacedSpells] = useState<Record<number, string>>(() => {
    const r = redo?.replacedSpell;
    const row = r && (character.spells || []).find((s) => s.name === r.name && s.level === r.level);
    return row ? { [redoLevel]: row.id } : {};
  });
  const [invocationSelections, setInvocationSelections] = useState<Record<number, string[]>>(() => redoAt(redo?.invocations));
  const [replacedInvocations, setReplacedInvocations] = useState<Record<number, string>>(() => redoAt(redo?.replacedInvocation));
  const [pactTomeCantrips, setPactTomeCantrips] = useState<string[]>([]);
  const [expertiseSelections, setExpertiseSelections] = useState<Record<number, string[]>>(() => redoAt(redo?.expertise));
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
    // Subclass only: every choice that isn't the subclass's own is left as it is.
    const onlySubclass = (info: LevelInfo): LevelInfo => ({
      ...info,
      asi: false,
      classFeatureChoices: undefined,
      expertise: undefined,
      magicalSecretsCount: 0,
      canReplaceSpell: false,
      hasSpellSelection: isThirdCaster(subclassSelection) && info.hasSpellSelection,
    });
    // One past level again: what the log doesn't have isn't asked (an older save's spells).
    const onlyLogged = (info: LevelInfo): LevelInfo => ({
      ...info,
      asi: info.asi && !!redo?.asi,
      classFeatureChoices: info.classFeatureChoices?.filter((fc) => fc.name !== "Eldritch Invocations" || redo?.invocations !== undefined),
      hasSpellSelection: info.hasSpellSelection && redo?.spells !== undefined,
      canReplaceSpell: info.canReplaceSpell && redo?.spells !== undefined,
      magicalSecretsCount: redo?.magicalSecrets !== undefined ? info.magicalSecretsCount : 0,
      subclassSpellSelectionCount: redo?.subclassSpells !== undefined ? info.subclassSpellSelectionCount : 0,
      circleTerrainSelection: false,
      bonusCantripSelection: false,
    });
    return baseLevelInfos.map((raw) => {
      const info = subclassOnly ? onlySubclass(raw) : redo ? onlyLogged(raw) : raw;
      const expertiseTaken = new Set(
        Object.entries(expertiseSelections).filter(([lvl]) => Number(lvl) !== info.level).flatMap(([, list]) => list || [])
      );
      // 2024 Thaumaturge (Divine Order) and Magician (Primal Order) learn one more cantrip.
      const order = classFeatureChoices[info.level]?.["Divine Order"] || classFeatureChoices[info.level]?.["Primal Order"];
      const orderCantrip = character.ruleset === "2024" && (order === "Thaumaturge" || order === "Magician");
      return {
        ...info,
        ...(replacedSpells[info.level] ? { hasSpellSelection: true, spellSelectionCount: info.spellSelectionCount + 1 } : {}),
        ...(orderCantrip ? { hasSpellSelection: true, cantripSelectionCount: info.cantripSelectionCount + 1 } : {}),
        subclassFeatureChoices: withoutOthers(info.subclassFeatureChoices, subclassFeatureChoices, info.level),
        classFeatureChoices: withoutOthers(info.classFeatureChoices, classFeatureChoices, info.level),
        expertise: info.expertise && {
          ...info.expertise,
          availableOptions: info.expertise.availableOptions.filter((o) => !expertiseTaken.has(o)),
        },
      };
    });
  }, [baseLevelInfos, replacedSpells, subclassFeatureChoices, classFeatureChoices, expertiseSelections, subclassOnly, subclassSelection, redo, character.ruleset]);
  // The class name the screens are worked out with; the Warlock's and Wizard's
  // own class screens don't show when only the subclass is picked again.
  const partsClass = subclassOnly ? "" : character.class;

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
    // A feat's +1 (Resilient, Actor, half feats) counts for previews and later picks.
    // When the level-up is saved, applyFeatGrants adds it, not this allocation.
    if (st.mode === "feat" && st.feat) {
      for (const [k, v] of Object.entries(featAbilityIncreases(st.feat, st.featOptions))) alloc[k as AbilityKey] += v;
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
    // Expertise picked at a level-up counts on the sheet (it was only kept as a pick before).
    draft.expertise = [...new Set([...(draft.expertise || []), ...Object.values(expertiseSelections).flat()])];

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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name === name);
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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
          const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
            const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
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
      // Picked at level 2, which a jump from level 1 to 3 passes through.
      for (const selectedBonusCantrip of Object.values(bonusCantripSelections)) {
      if (selectedBonusCantrip && !(draft.bonusCantrips || []).includes(selectedBonusCantrip)) {
        const spell = getStaticSpells(character.sources, character.ruleset, language).find((s) => s.name?.toLowerCase() === selectedBonusCantrip.toLowerCase());
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
          if (!cantrips.some((c) => c.name.toLowerCase() === spell.name.toLowerCase())) {
            cantrips.push({ id: `cantrip-${spell.name}`.replace(/\s+/g, "-"), name: spell.name });
          }
          draft.bonusCantrips = [...(draft.bonusCantrips || []), spell.name];
        }
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
      // The invocations known before this level-up stay; new ones join them.
      const allInvocations: string[] = startFromLevelOne ? [] : [...(character.featureSelections?.["warlock-invocations"] || [])];
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

    // Each level's picks, so a past level can be picked again later (lib/level-choices).
    const log: Record<number, LevelPicks> = {};
    for (const info of levelInfos) {
      const lvl = info.level;
      const entry: LevelPicks = {};
      const st = asiSelections[lvl];
      if (info.asi && st?.mode) entry.asi = { ...st };
      if (Object.keys(classFeatureChoices[lvl] || {}).length) entry.classFeatures = { ...classFeatureChoices[lvl] };
      if (Object.keys(subclassFeatureChoices[lvl] || {}).length) entry.subclassFeatures = { ...subclassFeatureChoices[lvl] };
      if (info.expertise?.count) entry.expertise = [...(expertiseSelections[lvl] || [])];
      if (info.hasSpellSelection || (spellSelections[lvl] || []).length) entry.spells = [...(spellSelections[lvl] || [])];
      if (info.magicalSecretsCount) entry.magicalSecrets = [...(magicalSecretsSelections[lvl] || [])];
      if (info.subclassSpellSelectionCount) entry.subclassSpells = [...(subclassSpellSelections[lvl] || [])];
      const swapped = replacedSpells[lvl] && (character.spells || []).find((s) => s.id === replacedSpells[lvl]);
      if (swapped) entry.replacedSpell = { name: swapped.name, level: swapped.level };
      if (character.class === "Warlock" && info.classFeatureChoices?.some((fc) => fc.name === "Eldritch Invocations")) entry.invocations = [...(invocationSelections[lvl] || [])];
      if (replacedInvocations[lvl]) entry.replacedInvocation = replacedInvocations[lvl];
      log[lvl] = entry;
    }
    draft.levelChoices = { ...(startFromLevelOne ? {} : character.levelChoices || {}), ...log };

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
        for (const part of levelParts(info, subclassSelection, partsClass)) {
          if (part !== "spells") list.push({ levels: [info.level], part });
        }
      }
      const spellLevels = levelInfos.filter((info) => levelParts(info, subclassSelection, partsClass).includes("spells")).map((info) => info.level);
      if (spellLevels.length > 0) list.push({ levels: spellLevels, part: "spells" });
    } else {
      for (const info of levelInfos) {
        if (!redo) list.push({ levels: [info.level], part: "moment" });
        for (const part of levelParts(info, subclassSelection, partsClass)) list.push({ levels: [info.level], part });
      }
    }
    list.push({ levels: [], part: "recap" });
    return list;
  }, [levelInfos, subclassSelection, partsClass, redo]);
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
    return { hp: hpLocked ? character.maxHp || 0 : hp, ac: derived.ac ?? character.ac, atk: derived.spellAttackBonus ?? 0, dc: derived.spellSaveDc ?? 0 };
  }, [baseScores, hpValues, targetLevel, startFromLevelOne, hitDie, conMod, character, hpLocked]);
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
    moment: subclassOnly ? t("rebuild.subclassTitle", "Change subclass") : t("levelUp.flow.momentTitle", "Level up!"),
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
      subclassOnly={subclassOnly}
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

  // Quick create: fill every open choice with its top suggestion, one pass per
  // render (a pick can open new choices, like a subclass's own options), then finish.
  const [autoOn, setAutoOn] = useState(!!auto);
  const autoPasses = useRef(0);
  const autoFinished = useRef(false);
  /** One round of picks; true when anything was picked. */
  function autoFillPass(): boolean {
    let changed = false;
    const cls = character.class;
    const sub = subclassSelection;
    const used = new Set(takenSpells);
    // Options can carry a prefix or suffix ("Dragon Ancestor: Red - Fire Damage"), so match whole words.
    const firstOf = (order: string[], names: string[], count: number) => {
      const escape = (o: string) => o.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
      const has = (n: string, o: string) => n === o || new RegExp(`(^|[\\s:(])${escape(o)}($|[\\s,)-])`).test(n);
      const rank = (n: string) => {
        const i = order.findIndex((o) => has(n, o));
        return i < 0 ? order.length : i;
      };
      return [...names].sort((a, b) => rank(a) - rank(b)).slice(0, count);
    };
    const SUB_CHOICE_ORDER: Record<string, string[]> = {
      "Combat Superiority": MANEUVER_PICKS.map((p) => p.name),
      "Hunter's Prey": ["Colossus Slayer"],
      "Defensive Tactics": ["Multiattack Defense"],
      "Totem Spirit": ["Bear"],
      "Dragon Ancestor": ["Red", "Gold"],
    };
    const CLASS_CHOICE_ORDER: Record<string, string[]> = {
      "Fighting Style": (FIGHTING_STYLE_PICKS[cls] || []).map((p) => p.name),
      Metamagic: METAMAGIC_PICKS.map((p) => p.name),
      Expertise: expertisePicks(cls).map((p) => p.name),
      "Pact Boon": sub === "Hexblade" ? ["Pact of the Blade"] : ["Pact of the Tome", "Pact of the Blade"],
      "Favored Enemy": ["Undead", "Fiends", "Humanoids", "Monstrosities"],
      "Natural Explorer": ["Forest"],
    };
    // Spells picked earlier in this pass, by level, so later picks see them (Agonizing Blast needs Eldritch Blast).
    const pickedNow: Record<number, string[]> = {};
    for (const info of levelInfos) {
      const lvl = info.level;
      if (info.subclassOptions?.length && !sub) {
        const names = info.subclassOptions.map((o) => o.name);
        handleSubclassSelect(topPicks(SUBCLASS_PICKS[cls], names)[0]?.name || names[0]);
        return true;
      }
      if (info.asi && !asiIsValid(asiSelections[lvl])) {
        const p = asiPicks(cls, baseScores(lvl), featNames)[0];
        if (p?.kind === "single") setAsi(lvl, { mode: "single", single: p.ability });
        else if (p?.kind === "double") setAsi(lvl, { mode: "double", d1: p.d1, d2: p.d2 });
        else if (p?.kind === "feat") setAsi(lvl, { mode: "feat", feat: p.feat });
        changed = true;
      }
      for (const [isSubclass, list] of [[false, info.classFeatureChoices], [true, info.subclassFeatureChoices]] as const) {
        for (const fc of list || []) {
          if (fc.name === "Eldritch Invocations" || isFeatureSelected(lvl, fc.name, isSubclass)) continue;
          const options = fc.name === "Pact Boon"
            ? getPactBoons().filter((b: any) => b.source !== "TCE" || usesOptionalClassFeatures(character)).map((b: any) => b.name)
            : fc.options.map((o) => o.name);
          const orders = isSubclass ? SUB_CHOICE_ORDER : CLASS_CHOICE_ORDER;
          const order = orders[fc.name] || Object.entries(orders).find(([k]) => fc.name.startsWith(k))?.[1] || [];
          const picks = firstOf(order, options, fc.count || 1);
          if (picks.length === 0) continue;
          const setState = isSubclass ? setSubclassFeatureChoices : setClassFeatureChoices;
          setState((prev) => ({ ...prev, [lvl]: { ...(prev[lvl] || {}), [fc.name]: picks.join(", ") } }));
          changed = true;
        }
      }
      if (info.expertise && info.expertise.count > 0 && (expertiseSelections[lvl] || []).length < info.expertise.count) {
        setExpertise(lvl, firstOf(expertisePicks(cls).map((p) => p.name), info.expertise.availableOptions, info.expertise.count));
        changed = true;
      }
      const invocations = info.classFeatureChoices?.find((fc) => fc.name === "Eldritch Invocations");
      if (invocations && cls === "Warlock" && lvl >= 2 && !(invocationSelections[lvl] || []).length && (pactBoon || lvl < 3)) {
        const knowsEldritchBlast = [...Object.entries(spellSelections), ...Object.entries(pickedNow)].some(([l, picks]) => Number(l) <= lvl && picks.includes("Eldritch Blast:0"));
        const known = new Set(Object.entries(invocationSelections).filter(([l]) => Number(l) !== lvl).flatMap(([, picks]) => picks || []));
        const open = getAvailableInvocations(lvl, pactBoon, [], knowsEldritchBlast, character.sources, usesOptionalClassFeatures(character))
          .filter((i) => i.available && !known.has(i.name))
          .map((i) => i.name);
        const picks = firstOf(INVOCATION_PICKS.map((p) => p.name), open, invocations.count || 1);
        if (picks.length) {
          setInvocations(lvl, picks);
          changed = true;
        }
      }
      if (info.hasSpellSelection) {
        const mine = spellSelections[lvl] || [];
        mine.forEach((x) => used.add(x.split(":")[0].toLowerCase()));
        const cantripsHave = mine.filter((x) => x.endsWith(":0")).length;
        const spellsHave = mine.length - cantripsHave;
        if (cantripsHave < info.cantripSelectionCount || spellsHave < info.spellSelectionCount) {
          const schools = THIRD_CASTER_SCHOOLS[(sub || "").toLowerCase().replace(/\s+/g, "-")];
          const pool = spellChoicePool(
            { ...character, subclass: sub, subclassIndex: (sub || "").toLowerCase().replace(/\s+/g, "-"), level: lvl },
            { subclass: sub, maxLevel: info.maxSpellLevel, selectionType: info.spellSelectionType, castingLevel: lvl, language }
          ).filter((sp: any) => !used.has(sp.name.toLowerCase()) && (sp.level === 0 || !schools || schools.includes(String(sp.school || "").toLowerCase())));
          const pickNames = (isCantrip: boolean, n: number) => {
            if (n <= 0) return [];
            const of = pool.filter((sp: any) => (sp.level === 0) === isCantrip) as { name: string; level: number }[];
            return quickSpellOrder(of).slice(0, n).map((sp) => `${sp.name}:${sp.level}`);
          };
          const add = [...pickNames(true, info.cantripSelectionCount - cantripsHave), ...pickNames(false, info.spellSelectionCount - spellsHave)];
          add.forEach((x) => used.add(x.split(":")[0].toLowerCase()));
          if (add.length) {
            pickedNow[lvl] = add;
            setSpells(lvl, [...mine, ...add]);
            changed = true;
          }
        }
      }
      if (info.circleTerrainSelection && !circleTerrainSelections[lvl]) {
        const terrains = getCircleTerrainTypes();
        setCircleTerrain(lvl, terrains.includes("forest") ? "forest" : terrains[0]);
        changed = true;
      }
      if (info.bonusCantripSelection && !bonusCantripSelections[lvl]) {
        const names = getStaticSpells(character.sources, character.ruleset).filter((sp) => sp.level === 0 && sp.classes?.includes("Druid") && !used.has(sp.name.toLowerCase())).map((sp) => sp.name);
        const pick = firstOf(QUICK_SPELL_ORDER, names, 1)[0];
        if (pick) {
          used.add(pick.toLowerCase());
          setBonusCantrip(lvl, pick);
          changed = true;
        }
      }
    }
    if (pactBoon === "Pact of the Tome" && pactTomeCantrips.length < 3) {
      const names = getStaticSpells(character.sources, character.ruleset).filter((sp) => sp.level === 0 && !used.has(sp.name.toLowerCase())).map((sp) => sp.name);
      setPactTomeCantrips(firstOf(["Guidance", "Sacred Flame", "Toll the Dead", "Mage Hand", "Prestidigitation", "Thaumaturgy"], [...new Set(names)], 3));
      changed = true;
    }
    return changed;
  }

  useEffect(() => {
    if (!autoOn || autoFinished.current) return;
    const timer = setTimeout(() => {
      if (autoPasses.current++ > 8) {
        setAutoOn(false);
        onAutoStuck?.();
        return;
      }
      const changed = autoFillPass();
      if (!changed && allLevelsComplete) {
        autoFinished.current = true;
        handleFinish();
      }
    }, 30);
    return () => clearTimeout(timer);
  });

  // "Fill with suggestions": the same picks as quick create, then the recap to check them.
  const [fillOn, setFillOn] = useState(false);
  const fillPasses = useRef(0);
  useEffect(() => {
    if (!fillOn) return;
    const timer = setTimeout(() => {
      const changed = fillPasses.current++ < 10 && autoFillPass();
      if (!changed) {
        setFillOn(false);
        setStepIdx(steps.length - 1);
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      }
    }, 30);
    return () => clearTimeout(timer);
  });

  if (autoOn) return <>{autoView}</>;

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
          {suggestAll && step.part !== "recap" && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                disabled={fillOn}
                onClick={() => { fillPasses.current = 0; setFillOn(true); }}
                className="btn btn-secondary px-3 py-1.5 text-xs"
              >
                {fillOn ? t("levelUp.flow.filling", "Filling…") : t("levelUp.flow.fillSuggestions", "Fill with suggestions")}
              </button>
            </div>
          )}
          {idx === 0 && !hpLocked && (
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
              {levelInfos.filter((info) => !hpLocked || levelParts(info, subclassSelection, partsClass).length > 0).map((info) => (
                <div key={info.level} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {t("levelUp.flow.levelN", "Level {level}", { level: info.level })}
                  </div>
                  {([...(hpLocked ? [] : ["moment"]), ...levelParts(info, subclassSelection, partsClass)] as LevelPart[]).map((part) => {
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
                  {subclassOnly
                    ? t("levelUp.flow.subclassOnlyHint", "Pick your subclass again, then its choices from level {from} to {to}. Everything else stays as it is.", { from: step.levels[0], to: step.levels[step.levels.length - 1] })
                    : isStart
                    ? t("levelUp.flow.startHint", "Here is what your class gives you at level 1.")
                    : step.levels.length > 1
                      ? t("levelUp.flow.jumpHint", "You gained {count} levels. Everything below comes for free.", { count: step.levels.length })
                      : partHint("moment")}
                </p>
                {subclassOnly ? (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-center gap-2 opacity-40" aria-hidden="true">
                      <span className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]">{t("levelUp.flow.takeAverage", "Take average (+{hp} HP)", { hp: averageHp })}</span>
                      <span className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]">{t("levelUp.flow.rollInstead", "Roll d{die} instead", { die: hitDie })}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)]">{t("levelUp.flow.hpKept", "HP stays at {hp}. A new subclass doesn't change it.", { hp: character.maxHp || 0 })}</p>
                  </div>
                ) : hpLevels.length > 0 && (
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
              {!subclassOnly && stepInfos.map((info) => <div key={info.level}>{renderLevelCard(info, "moment")}</div>)}
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
