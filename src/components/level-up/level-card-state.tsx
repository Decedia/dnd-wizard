"use client";

import { useState, useCallback } from "react";
import { type Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations as enTranslations } from "@/locales/en";
import { translations as idTranslations } from "@/locales/id";
import { useSRD } from "@/contexts/SRDContext";
import { createContext, useContext } from "react";
import { type AbilityKey, type LevelInfo, type LevelPart, levelParts } from "./level-infos";

export interface LevelCardProps {
  info: LevelInfo;
  /** Show only this screen's sections. Leave out to show the whole level. */
  part?: LevelPart;
  /** Only the subclass's own choices; class spell lists and class picks hide. */
  subclassOnly?: boolean;
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

/** Everything a level card's step files read: the props, the pop-up state and the helpers. */
export function useLevelCardState(props: LevelCardProps) {
  const {
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
    subclassOnly,
  } = props;
    const show = (p: LevelPart) => !part || part === p;
    // Picking the subclass again: the class's own spells and picks stay as they are.
    const classSpells = !subclassOnly || info.hasSpellSelection;
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
  // Magical Secrets and the Lore Bard's picks have their own picker.
  const isSecretsComplete = (info.magicalSecretsCount === 0 || magicalSecretsSpells.length >= info.magicalSecretsCount) && (info.subclassSpellSelectionCount === 0 || subclassSpellSelections.length >= info.subclassSpellSelectionCount);
  const isComplete = isHpComplete && isAsiComplete && isSubclassComplete && isFeatureChoicesComplete && isClassFeatureChoicesComplete && isExpertiseComplete && isSpellSelectionComplete && isSecretsComplete;

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

  return { info, hpValue, onHpChange, asiSelection, onAsiChange, baseScores, subclassSelection, onSubclassSelect, subclassFeatureChoices, onSubclassFeatureChoice, classFeatureChoices, onClassFeatureChoice, spells, onSpellsChange, magicalSecretsSpells, onMagicalSecretsChange, subclassSpellSelections, onSubclassSpellSelectionsChange, replacedSpell, onReplacedSpellChange, circleTerrain, onCircleTerrainChange, bonusCantrip, onBonusCantripChange, character, hitDie, diceType, conMod, averageHp, startFromLevelOne, wizardCharacter, allSpellSelections, invocationSelections, onInvocationsChange, replacedInvocation, onReplacedInvocationChange, pactTomeCantrips, onPactTomeCantripsChange, expertise, onExpertiseChange, allInvocationSelections, pactBoon, sectionRefs, takenSpells, allAsiFeats, part, subclassOnly, show, classSpells, spellsPart, language, tDesc, dict, t, infoState, setInfoState, showSpellSelection, setShowSpellSelection, showSubclassDetails, setShowSubclassDetails, showSubclassModal, setShowSubclassModal, showSpellModal, setShowSpellModal, spellModalMode, setSpellModalMode, showTerrainModal, setShowTerrainModal, showBonusCantripModal, setShowBonusCantripModal, showFeaturePopup, setShowFeaturePopup, featureSelections, setFeatureSelections, showHumanoidPopup, setShowHumanoidPopup, humanoidSelections, setHumanoidSelections, getAllSelectedMetamagic, showSpellMasteryModal, setShowSpellMasteryModal, spellMasterySelections, setSpellMasterySelections, showSignatureSpellsModal, setShowSignatureSpellsModal, signatureSpellsSelections, setSignatureSpellsSelections, showAsiModal, setShowAsiModal, asiAllocation, setAsiAllocation, showAsiFeatModal, setShowAsiFeatModal, showExpertiseModal, setShowExpertiseModal, lvl, data, srdSpells, isHpComplete, isAsiComplete, isSubclassComplete, isFeatureChoicesComplete, isClassFeatureChoicesComplete, isExpertiseComplete, isSpellSelectionComplete, isComplete, setSectionRef, sectionClass, totalAsiPoints, canApplyAsi, openAsiModal, allocateAsiPoint, removeAsiPoint, applyAsi };
}

export type LevelCardState = ReturnType<typeof useLevelCardState>;

export const LevelCardContext = createContext<LevelCardState | null>(null);

export function useLevelCard(): LevelCardState {
  const state = useContext(LevelCardContext);
  if (!state) throw new Error("useLevelCard outside LevelCard");
  return state;
}
