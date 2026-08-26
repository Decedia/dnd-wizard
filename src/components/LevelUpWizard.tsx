"use client";

import { useState, useMemo, useCallback } from "react";
import { WizardNav } from "./WizardNav";
import { getStaticClass, getStaticSubclasses, getStaticSpells } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, computeDerivedStats, type Character } from "@/lib/storage";
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
} from "phosphor-react";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

type AsiMode = "single" | "double";
interface AsiState {
  mode?: AsiMode;
  single?: AbilityKey;
  d1?: AbilityKey;
  d2?: AbilityKey;
  confirmed?: boolean;
}

interface LevelUpWizardProps {
  character: Character;
  onCancel: () => void;
  onComplete: (character: Character) => void;
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
  subclassOptions?: { name: string; description: string }[];
  subclassFeatureChoices?: { name: string; options: string[]; count?: number }[];
  hasSpellSelection: boolean;
  spellSelectionCount: number;
  cantripSelectionCount: number;
  maxSpellLevel: number;
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
  subclassSelection: string
): LevelInfo[] {
  if (!classData) return [];

  const infos: LevelInfo[] = [];
  const currentLevel = character.level || 1;
  const hitDie = classData.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const className = classData.name;

  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    const levelData = classData.levels[level - 1];
    const prevLevelData = level > 1 ? classData.levels[level - 2] : null;

    const features = (levelData?.features || []).map((f: any) => ({
      name: f.name,
      description: normalizeDescription(f.description),
    }));

    const asi = levelData?.asi || false;
    const spellSlots = levelData?.spellSlots;

    let cantripsKnown: number | undefined;
    if (classData.cantripsKnown) {
      const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
      for (const l of levels) {
        if (level >= l) cantripsKnown = classData.cantripsKnown[l];
      }
    }

    let spellsKnown: number | undefined;
    if ((classData as any)?.spellsKnown) {
      const known = (classData as any).spellsKnown;
      if (known[String(level)] !== undefined) {
        spellsKnown = known[String(level)];
      }
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
    };

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
      ? subclasses.map((s) => ({ name: s.name, description: s.description }))
      : undefined;

    const subclassFeatureChoices: { name: string; options: string[]; count?: number }[] = [];
    if (subclassSelection && level >= unlockLevel) {
      const selectedSubclass = subclasses.find((s) => s.name === subclassSelection);
      if (selectedSubclass) {
        const earnedFeatures = selectedSubclass.features.filter(
          (f) => f.level != null && f.level === level && f.choices && f.choices.length > 0
        );
        for (const f of earnedFeatures) {
          subclassFeatureChoices.push({
            name: f.name,
            options: f.choices!.map((c: any) => c.name),
            count: (f as any).choicesCount,
          });
        }
      }
    }

    const prevSlots = prevLevelData?.spellSlots || {};
    const slotsChanged = spellSlots && (Object.keys(spellSlots).length !== Object.keys(prevSlots).length ||
      Object.entries(spellSlots).some(([k, v]) => prevSlots[Number(k)] !== v));
    const prevCantrips = prevLevelData ? (classData.cantripsKnown?.[level - 1] || 0) : 0;
    const cantripsChanged = cantripsKnown !== undefined && cantripsKnown > prevCantrips;
    const hasSpellSelection = !!(classData.spellcastingAbility && (slotsChanged || cantripsChanged));
    const maxSpellLevel = spellSlots ? Math.max(...Object.keys(spellSlots).map(Number)) : 0;

    infos.push({
      level,
      hp: { hitDie, conMod, average: averageHp },
      proficiencyBonus: getProficiencyBonus(level),
      features,
      asi,
      spellSlots,
      cantripsKnown,
      spellsKnown,
      classFeatures,
      subclassOptions,
      subclassFeatureChoices: subclassFeatureChoices.length > 0 ? subclassFeatureChoices : undefined,
      hasSpellSelection,
      spellSelectionCount: spellSlots ? Object.values(spellSlots).reduce((a, b) => a + b, 0) : 0,
      cantripSelectionCount: cantripsChanged ? (cantripsKnown || 0) - prevCantrips : 0,
      maxSpellLevel,
    });
  }

  return infos;
}

export function LevelUpWizard({ character, onCancel, onComplete }: LevelUpWizardProps) {
  const classData = character.class ? getStaticClass(character.class) : undefined;
  const currentLevel = character.level || 1;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const diceType = `d${hitDie}` as any;

  const [targetLevel, setTargetLevel] = useState(Math.min(20, currentLevel + 1));
  const [hpValues, setHpValues] = useState<Record<number, number>>({});
  const [asiState, setAsiState] = useState<Record<number, AsiState>>({});
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [subclassFeatureChoices, setSubclassFeatureChoices] = useState<Record<number, Record<string, string>>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});

  const levelInfos = useMemo(
    () => buildLevelInfos(character, targetLevel, classData, subclassSelection),
    [character, targetLevel, classData, subclassSelection]
  );

  const setHp = (level: number, value: number) => setHpValues((prev) => ({ ...prev, [level]: value }));
  const setAsi = (level: number, patch: Partial<AsiState>) =>
    setAsiState((prev) => ({ ...prev, [level]: { ...(prev[level] || {}), ...patch } }));
  const setSpells = (level: number, list: string[]) => setSpellSelections((prev) => ({ ...prev, [level]: list }));

  const buildAllocation = (st?: AsiState): Record<AbilityKey, number> => {
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
      for (const [lvlStr, st] of Object.entries(asiState)) {
        const lvl = Number(lvlStr);
        if (!st.confirmed || lvl === excludeLevel) continue;
        const alloc = buildAllocation(st);
        (Object.keys(alloc) as AbilityKey[]).forEach((k) => (base[k] += alloc[k]));
      }
      return base;
    },
    [character, asiState]
  );

  const asiIsValid = (st?: AsiState): boolean => {
    if (!st || !st.mode) return false;
    if (st.mode === "single") return !!st.single;
    return !!st.d1 && !!st.d2 && st.d1 !== st.d2;
  };

  const allLevelsComplete = levelInfos.every((info) => {
    const lvl = info.level;
    if (!hpValues[lvl]) return false;
    if (info.asi && !asiState[lvl]?.confirmed) return false;
    if (info.subclassOptions && !subclassSelection) return false;
    if (info.subclassFeatureChoices) {
      const choices = subclassFeatureChoices[lvl] || {};
      for (const fc of info.subclassFeatureChoices) {
        if (!choices[fc.name]) return false;
      }
    }
    return true;
  });

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
      },
    };

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
    draft.currentHp = draft.maxHp;

    for (const [lvlStr, st] of Object.entries(asiState)) {
      const lvl = Number(lvlStr);
      if (!st.confirmed) continue;
      draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
      const alloc = buildAllocation(st);
      for (const { key } of ABILITIES) {
        const add = alloc[key] || 0;
        if (add > 0) draft = { ...draft, [key]: ((draft[key] as number) || 0) + add };
      }
    }

    const spells = [...(character.spells || [])];
    for (const list of Object.values(spellSelections)) {
      for (const entry of list) {
        const [name, levelStr] = entry.split(":");
        const level = Number(levelStr);
        if (!spells.some((s) => s.name === name && s.level === level)) {
          const spell = getStaticSpells().find((s) => s.name === name);
          spells.push({
            id: `spell-${name}-${level}`.replace(/\s+/g, "-"),
            name, level, source: "srd", srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
        }
      }
    }
    draft.spells = spells;
    draft.level = targetLevel;

    let finalChar = applySubclassFeatures(draft);
    finalChar = syncBaseFeatures(finalChar);
    finalChar = { ...finalChar, ...computeDerivedStats(finalChar) };
    onComplete(finalChar);
  };

  const rollAllHp = () => {
    const newHpValues: Record<number, number> = { ...hpValues };
    for (const info of levelInfos) {
      if (!newHpValues[info.level]) {
        const die = Math.floor(Math.random() * hitDie) + 1;
        newHpValues[info.level] = die + conMod;
      }
    }
    setHpValues(newHpValues);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              Cancel
            </button>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">Level Up to {targetLevel}</div>
            <div className="w-12" />
          </div>
          <div className="mt-2">
            <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Target Level
            </label>
            <div className="mt-1 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {Array.from({ length: 20 - currentLevel }, (_, i) => i + currentLevel + 1).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setTargetLevel(lvl);
                    setHpValues({});
                    setAsiState({});
                    setSpellSelections({});
                    setSubclassFeatureChoices({});
                  }}
                  className={`h-8 min-w-[2.25rem] px-2.5 text-xs rounded-full transition-all ${
                    lvl === targetLevel
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-5 pb-40">
        <div className="mx-auto max-w-lg space-y-4">
          <button
            type="button"
            onClick={rollAllHp}
            className="w-full py-2.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
          >
            🎲 Roll All HP
          </button>

          {levelInfos.map((info) => (
            <LevelCard
              key={info.level}
              info={info}
              hpValue={hpValues[info.level] || 0}
              onHpChange={(v) => setHp(info.level, v)}
              asiState={asiState[info.level]}
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
              spells={spellSelections[info.level] || []}
              onSpellsChange={(list) => setSpells(info.level, list)}
              character={character}
              hitDie={hitDie}
              diceType={diceType}
              conMod={conMod}
              averageHp={averageHp}
            />
          ))}
        </div>
      </main>

      <WizardNav
        onBack={onCancel}
        onNext={handleFinish}
        backLabel="Cancel"
        nextLabel="Complete Level Up"
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
  asiState?: AsiState;
  onAsiChange: (patch: Partial<AsiState>) => void;
  baseScores: Record<AbilityKey, number>;
  subclassSelection: string;
  onSubclassSelect: (name: string) => void;
  subclassFeatureChoices: Record<string, string>;
  onSubclassFeatureChoice: (name: string, value: string) => void;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
  character: Character;
  hitDie: number;
  diceType: any;
  conMod: number;
  averageHp: number;
}

function LevelCard({
  info,
  hpValue,
  onHpChange,
  asiState,
  onAsiChange,
  baseScores,
  subclassSelection,
  onSubclassSelect,
  subclassFeatureChoices,
  onSubclassFeatureChoice,
  spells,
  onSpellsChange,
  character,
  hitDie,
  diceType,
  conMod,
  averageHp,
}: LevelCardProps) {
  const [showSpellSelection, setShowSpellSelection] = useState(false);
  const lvl = info.level;

  const isComplete = hpValuesComplete(info, hpValue) && asiComplete(info, asiState) &&
    subclassComplete(info, subclassSelection) && subclassFeatureChoicesComplete(info, subclassFeatureChoices);

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
                d{hitDie} + {conMod >= 0 ? `+${conMod}` : conMod} (avg: {averageHp})
              </div>
            </div>
            <input
              type="number"
              value={hpValue || ""}
              onChange={(e) => onHpChange(parseInt(e.target.value || "0", 10))}
              className="w-16 text-center text-sm font-bold rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1"
              placeholder={String(averageHp)}
            />
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
                    <div key={f.name} className="text-xs text-[var(--color-text-primary)]">
                      <span className="font-semibold">{f.name}</span>
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
                {!asiState?.confirmed ? (
                  <AsiSelector state={asiState} baseScores={baseScores} onChange={onAsiChange} />
                ) : (
                  <div className="text-xs text-green-600 font-semibold mt-1">✓ Confirmed</div>
                )}
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
                <div className="text-xs text-[var(--color-text-primary)]">{info.spellsKnown}</div>
              </div>
            </div>
          )}

          {info.subclassOptions && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Crown weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Choose Subclass</div>
                <div className="space-y-1.5 mt-1">
                  {info.subclassOptions.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => onSubclassSelect(opt.name)}
                      className={`w-full p-2 text-left rounded-[var(--radius-sm)] border transition-all ${
                        subclassSelection === opt.name
                          ? "border-[var(--color-border-active)] bg-[var(--color-surface)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="text-xs font-semibold text-[var(--color-text-primary)]">{opt.name}</div>
                      {opt.description && (
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{opt.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <Crown weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Subclass Choices</div>
                <div className="space-y-2 mt-1">
                  {info.subclassFeatureChoices.map((fc) => (
                    <div key={fc.name}>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">{fc.name}</div>
                      <div className="space-y-1">
                        {fc.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onSubclassFeatureChoice(fc.name, opt)}
                            className={`w-full p-1.5 text-left text-[10px] rounded-[var(--radius-sm)] border transition-all ${
                              subclassFeatureChoices[fc.name] === opt
                                ? "border-[var(--color-border-active)] bg-[var(--color-surface)]"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {info.hasSpellSelection && (
            <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
              <MagicWand weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => setShowSpellSelection(!showSpellSelection)}
                  className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline"
                >
                  {showSpellSelection ? "Hide" : "Show"} Spell Selection
                  {info.cantripSelectionCount > 0 && ` (+${info.cantripSelectionCount} cantrips)`}
                  {info.spellSelectionCount > 0 && ` (+${info.spellSelectionCount} spells)`}
                </button>
                {showSpellSelection && (
                  <SpellSelection
                    character={character}
                    count={info.spellSelectionCount}
                    cantripCount={info.cantripSelectionCount}
                    maxLevel={info.maxSpellLevel}
                    spells={spells}
                    onSpellsChange={onSpellsChange}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function hpValuesComplete(info: LevelInfo, hpValue: number): boolean {
  return hpValue > 0;
}

function asiComplete(info: LevelInfo, asiState?: AsiState): boolean {
  if (!info.asi) return true;
  return !!asiState?.confirmed;
}

function subclassComplete(info: LevelInfo, subclassSelection: string): boolean {
  if (!info.subclassOptions) return true;
  return !!subclassSelection;
}

function subclassFeatureChoicesComplete(info: LevelInfo, choices: Record<string, string>): boolean {
  if (!info.subclassFeatureChoices) return true;
  for (const fc of info.subclassFeatureChoices) {
    if (!choices[fc.name]) return false;
  }
  return true;
}

function AsiSelector({
  state,
  baseScores,
  onChange,
}: {
  state?: AsiState;
  baseScores: Record<AbilityKey, number>;
  onChange: (patch: Partial<AsiState>) => void;
}) {
  return (
    <div className="space-y-2 mt-1">
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ mode: "single", single: undefined, d1: undefined, d2: undefined })}
          className={`px-2 py-1.5 text-[10px] rounded-full border transition-all ${
            state?.mode === "single"
              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
          }`}
        >
          +2 to one
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "double", single: undefined, d1: undefined, d2: undefined })}
          className={`px-2 py-1.5 text-[10px] rounded-full border transition-all ${
            state?.mode === "double"
              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
          }`}
        >
          +1 to two
        </button>
      </div>

      {state?.mode === "single" && (
        <select
          value={state.single || ""}
          onChange={(e) => onChange({ single: (e.target.value || undefined) as AbilityKey | undefined })}
          className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1.5"
        >
          <option value="">Select ability…</option>
          {ABILITIES.map(({ key, label, full }) => {
            const atCap = baseScores[key] + 2 > 20;
            return (
              <option key={key} value={key} disabled={atCap}>
                {label} ({baseScores[key]} → {baseScores[key] + 2}){atCap ? " (max)" : ""}
              </option>
            );
          })}
        </select>
      )}

      {state?.mode === "double" && (
        <div className="space-y-1.5">
          <select
            value={state.d1 || ""}
            onChange={(e) => onChange({ d1: (e.target.value || undefined) as AbilityKey | undefined })}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1.5"
          >
            <option value="">First ability…</option>
            {ABILITIES.map(({ key, label, full }) => {
              const atCap = baseScores[key] + 1 > 20;
              const disabled = atCap || key === state.d2;
              return (
                <option key={key} value={key} disabled={disabled}>
                  {label} ({baseScores[key]} → {baseScores[key] + 1}){atCap ? " (max)" : ""}
                </option>
              );
            })}
          </select>
          <select
            value={state.d2 || ""}
            onChange={(e) => onChange({ d2: (e.target.value || undefined) as AbilityKey | undefined })}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1.5"
          >
            <option value="">Second ability…</option>
            {ABILITIES.map(({ key, label, full }) => {
              const atCap = baseScores[key] + 1 > 20;
              const disabled = atCap || key === state.d1;
              return (
                <option key={key} value={key} disabled={disabled}>
                  {label} ({baseScores[key]} → {baseScores[key] + 1}){atCap ? " (max)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}
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
  const available = getStaticSpells().filter((s) => s.classes?.includes(character.class) && (s.level === 0 || s.level <= maxLevel));
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
