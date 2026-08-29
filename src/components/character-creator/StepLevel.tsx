"use client";

import { useState, useMemo, useEffect } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import { FeatSelector } from "./FeatSelector";
import type { SRDFeat } from "@/lib/srd-client";
import {
  getModifier,
  getHitDieAverage,
  getMaxHpFromLevelHp,
  type Character,
} from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";
import { Dice, type DiceType } from "@/components/Dice";
import {
  Heart,
  Lightning,
  ChartBar,
  Sword,
  Sparkle,
  MagicWand,
  Book,
  Star,
  Check,
  Minus,
  Plus,
} from "phosphor-react";

interface StepLevelProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
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

type AsiMode = "single" | "double";
type AsiChoice = "asi" | "feat";
interface AsiState {
  mode?: AsiMode;
  choice?: AsiChoice;
  single?: AbilityKey;
  d1?: AbilityKey;
  d2?: AbilityKey;
  feat?: string;
  confirmed?: boolean;
}

function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
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
}

function buildLevelInfos(
  character: Character,
  targetLevel: number,
  classData: ReturnType<typeof getStaticClass>
): LevelInfo[] {
  if (!classData) return [];

  const infos: LevelInfo[] = [];
  const hitDie = classData.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const className = classData.name;

  for (let level = 2; level <= targetLevel; level++) {
    const levelData = classData.levels[level - 1];

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
    });
  }

  return infos;
}

export function StepLevel({ data, onChange }: StepLevelProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(data.con);
  const level = data.level || 1;

  const levelHp = data.levelHp || {};
  const baselineHp = hitDie + conMod;
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const diceType = `d${hitDie}` as DiceType;

  const asiLevels = useMemo(() => {
    if (!classData?.levels) return [];
    return classData.levels
      .map((lvl, idx) => ({ level: idx + 1, asi: !!lvl.asi }))
      .filter((entry) => entry.asi)
      .map((entry) => entry.level);
  }, [classData]);

  const pendingAsiLevels = asiLevels.filter(
    (asiLevel) => !data.appliedAsi.includes(asiLevel) && asiLevel <= level
  );

  const [currentAsiIndex, setCurrentAsiIndex] = useState(0);
  const [asiAllocation, setAsiAllocation] = useState<Record<AbilityKey, number>>({
    str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0,
  });
  const [asiModalOpen, setAsiModalOpen] = useState(false);
  const [asiState, setAsiState] = useState<AsiState>({});
  const [featModalOpen, setFeatModalOpen] = useState(false);

  const currentAsiLevel = pendingAsiLevels[currentAsiIndex];

  const totalAsiPoints = useMemo(
    () => Object.values(asiAllocation).reduce((sum, val) => sum + val, 0),
    [asiAllocation]
  );
  const canApplyAsi = asiState.choice === "asi" ? totalAsiPoints === 2 : !!asiState.feat;

  useEffect(() => {
    setAsiModalOpen(!!currentAsiLevel);
  }, [currentAsiLevel]);

  const [confirmedHpLevels, setConfirmedHpLevels] = useState<number[]>([]);
  const [currentHpValue, setCurrentHpValue] = useState<number>(0);

  const activeHpLevel = useMemo(() => {
    if (level <= 1) return null;
    for (let lvl = 2; lvl <= level; lvl++) {
      if (!confirmedHpLevels.includes(lvl)) return lvl;
    }
    return null;
  }, [level, confirmedHpLevels]);

  useEffect(() => {
    setCurrentHpValue(0);
  }, [activeHpLevel]);

  useEffect(() => {
    if (!classData) return;
    const next: Record<number, number> = { ...levelHp };
    let changed = false;
    const v1 = hitDie + conMod;
    if (next[1] !== v1) { next[1] = v1; changed = true; }
    for (const lvl of Object.keys(next)) {
      const l = Number(lvl);
      if (l > level) { delete next[l]; changed = true; }
    }
    if (changed) {
      const max = getMaxHpFromLevelHp(next);
      onChange({ levelHp: next, maxHp: max, currentHp: max });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData, level, conMod, hitDie, levelHp]);

  const setLevelHpValue = (lvl: number, value: number) => {
    const next = { ...levelHp, [lvl]: value };
    const max = getMaxHpFromLevelHp(next);
    onChange({ levelHp: next, maxHp: max, currentHp: max });
  };

  const confirmHp = () => {
    if (!activeHpLevel || currentHpValue <= 0) return;
    setLevelHpValue(activeHpLevel, currentHpValue);
    setConfirmedHpLevels((prev) => [...prev, activeHpLevel]);
  };

  const rollHp = () => {
    const die = Math.floor(Math.random() * hitDie) + 1;
    setCurrentHpValue(die + conMod);
  };

  const takeAverage = () => setCurrentHpValue(averageHp);

  const adjustLevel = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(10, newLevel));
    const patch: Partial<Character> = { level: clamped };
    if (classData && clamped < (classData.subclassLevel || 0)) {
      patch.subclass = undefined;
    }
    onChange(patch);
    setConfirmedHpLevels((prev) => prev.filter((l) => l <= clamped));
    setCurrentAsiIndex(0);
    setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    setAsiState({});
    setFeatModalOpen(false);
  };

  const applyAsi = () => {
    if (!currentAsiLevel) return;
    if (asiState.choice === "feat" && asiState.feat) {
      const featFeature = {
        id: `feat-${asiState.feat.toLowerCase().replace(/\s+/g, "-")}`,
        name: asiState.feat,
        description: "Feat selected at Ability Score Improvement.",
        source: "custom" as const,
      };
      onChange({
        appliedAsi: [...data.appliedAsi, currentAsiLevel],
        features: [...(data.features || []), featFeature],
        featureSelections: {
          ...data.featureSelections,
          [`asi-feat-${currentAsiLevel}`]: [asiState.feat],
        },
      });
      setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
      setAsiState({});
      setCurrentAsiIndex((prev) => prev + 1);
      return;
    }
    if (!canApplyAsi) return;
    const patch: Partial<Character> = {
      appliedAsi: [...data.appliedAsi, currentAsiLevel],
    };
    ABILITIES.forEach(({ key }) => {
      if (asiAllocation[key] > 0) {
        patch[key] = (data[key] as number) + asiAllocation[key];
      }
    });
    onChange(patch);
    setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    setAsiState({});
    setCurrentAsiIndex((prev) => prev + 1);
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

  const milestoneLevels = useMemo(() => {
    if (!classData || !data.class) return [];
    const levels = new Set<number>();
    if (classData.subclassLevel) levels.add(classData.subclassLevel);
    const subclasses = getStaticSubclasses(data.class);
    for (const sub of subclasses) {
      for (const f of sub.features) {
        if (f.level != null && f.level <= 10) levels.add(f.level);
      }
    }
    return Array.from(levels).sort((a, b) => a - b);
  }, [classData, data.class]);

  const levelData = classData?.levels[level - 1];
  const features = (levelData?.features || []).map((f: any) => ({
    name: f.name,
    description: normalizeDescription(f.description),
  }));

  const spellSlots = levelData?.spellSlots;
  const cantripsKnown = classData?.cantripsKnown?.[level];
  const spellsKnown = (classData as any)?.spellsKnown?.[String(level)];

  const classFeatures: { name: string; value: string }[] = [];
  if (classData) {
    const className = classData.name;
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
  }

  const levelInfos = useMemo(() => buildLevelInfos(data, level, classData ?? undefined), [data, level, classData]);

  const rollAllHp = () => {
    const next = { ...levelHp };
    for (let lvl = 2; lvl <= level; lvl++) {
      if (!next[lvl]) {
        const die = Math.floor(Math.random() * hitDie) + 1;
        next[lvl] = die + conMod;
      }
    }
    const max = getMaxHpFromLevelHp(next);
    onChange({ levelHp: next, maxHp: max, currentHp: max });
    setConfirmedHpLevels(Array.from({ length: level - 1 }, (_, i) => i + 2));
  };

  return (
    <>
      <StepCard
        title="Starting Level"
        hint="Choose your character's starting level. Higher levels mean more abilities, but also more complexity."
      >
        <div className="space-y-5">
          {/* Level Selector with +/- */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => adjustLevel(level - 1)}
              disabled={level <= 1}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">{level}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Level</div>
            </div>
            <button
              type="button"
              onClick={() => adjustLevel(level + 1)}
              disabled={level >= 10}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Level Summary */}
          {level >= 1 && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Level {level} Summary</h3>
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded-full">
                  +{getProficiencyBonus(level)} Proficiency
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                <Heart weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Hit Points</div>
                  <div className="text-xs text-[var(--color-text-primary)]">
                    {level === 1 ? `${hitDie} + CON (${conMod >= 0 ? `+${conMod}` : conMod}) = ${baselineHp}` : `Roll d${hitDie} + ${conMod >= 0 ? `+${conMod}` : conMod} (avg: ${averageHp})`}
                  </div>
                </div>
                {level === 1 && (
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{baselineHp} HP</span>
                )}
              </div>

              {classFeatures.length > 0 && (
                <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <Sword weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Class Features</div>
                    <div className="space-y-1 mt-1">
                      {classFeatures.map((f) => (
                        <div key={f.name} className="text-xs text-[var(--color-text-primary)]">
                          <span className="font-semibold">{f.name}:</span> {f.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {features.length > 0 && (
                <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <Lightning weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">New Features</div>
                    <div className="space-y-1 mt-1">
                      {features.map((f) => (
                        <div key={f.name} className="text-xs text-[var(--color-text-primary)]">
                          <span className="font-semibold">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {spellSlots && (
                <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <Sparkle weight="regular" className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spell Slots</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(spellSlots).map(([lvl, count]) => (
                        <span key={lvl} className="text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                          {lvl}st: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {cantripsKnown !== undefined && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <MagicWand weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Cantrips Known</div>
                    <div className="text-xs text-[var(--color-text-primary)]">{cantripsKnown}</div>
                  </div>
                </div>
              )}

              {spellsKnown !== undefined && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <Book weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Spells Known</div>
                    <div className="text-xs text-[var(--color-text-primary)]">{spellsKnown}</div>
                  </div>
                </div>
              )}

              {levelData?.asi && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
                  <ChartBar weight="regular" className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Ability Score Improvement</div>
                    <div className="text-xs text-[var(--color-text-primary)]">+2 to one ability or +1 to two</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Multi-Level HP Rolling */}
          {level >= 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">HP Roll</div>
                <button
                  type="button"
                  onClick={rollAllHp}
                  className="text-[10px] font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg)] px-2 py-1 rounded-full hover:bg-[var(--color-border)] transition-all"
                >
                  🎲 Roll All
                </button>
              </div>

              {hpLevelsToProcess(level).length > 0 && (
                <div className="flex items-center justify-center gap-1.5">
                  {hpLevelsToProcess(level).map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-2 w-2 rounded-full ${
                        confirmedHpLevels.includes(lvl) ? "bg-[var(--color-success-500)]" : "bg-[var(--color-border)]"
                      }`}
                    />
                  ))}
                </div>
              )}

              {activeHpLevel && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
                  <div className="text-xs text-[var(--color-text-secondary)] text-center">
                    Level {activeHpLevel} — d{hitDie} + CON ({conMod >= 0 ? `+${conMod}` : conMod})
                  </div>

                  <div className="text-center text-4xl font-display font-bold text-[var(--color-text-primary)]">
                    {currentHpValue > 0 ? currentHpValue : "—"}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={takeAverage}
                      className="btn btn-secondary rounded-full px-3 py-2 text-xs"
                    >
                      Avg ({averageHp})
                    </button>
                    <Dice type={diceType} size={72} onRoll={(result) => setCurrentHpValue(result + conMod)} />
                    <input
                      type="number"
                      value={currentHpValue || ""}
                      onChange={(e) => setCurrentHpValue(Math.max(1, parseInt(e.target.value || "0", 10)))}
                      className="input w-20 text-center text-sm font-semibold"
                      placeholder="—"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={confirmHp}
                      disabled={currentHpValue <= 0}
                      className="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      Confirm Level {currentHpValue > 0 ? activeHpLevel : ""} HP
                    </button>
                  </div>
                </div>
              )}

              {allHpConfirmed(level, confirmedHpLevels) && hpLevelsToProcess(level).length > 0 && (
                <div className="text-center text-xs text-[var(--color-success-600)] font-semibold">✓ All HP confirmed</div>
              )}
            </div>
          )}

          {/* ASI Section */}
          {currentAsiLevel && !asiModalOpen && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
              <button type="button" onClick={() => setAsiModalOpen(true)} className="btn btn-primary w-full">
                Complete Ability Score Improvement (Level {currentAsiLevel})
              </button>
            </div>
          )}

          {!currentAsiLevel && pendingAsiLevels.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-primary)] font-medium leading-relaxed">
                Complete the current Ability Score Improvement to continue.
              </p>
            </div>
          )}
        </div>
      </StepCard>

      {/* ASI Modal */}
      {asiModalOpen && currentAsiLevel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4">
          <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                Level {currentAsiLevel} Improvement
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 space-y-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAsiState((prev) => ({ ...prev, choice: "asi" }))}
                  className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                    asiState.choice === "asi"
                      ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">Ability Score Improvement</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">+2 to one ability or +1 to two abilities</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAsiState((prev) => ({ ...prev, choice: "feat" }))}
                  className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                    asiState.choice === "feat"
                      ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">Take a Feat</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Gain a feat instead of ability score improvements</div>
                </button>
              </div>

              {asiState.choice === "asi" && (
                <>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Distribute 2 points: +2 to one ability, or +1 to two abilities. Maximum ability score is 20.
                  </p>
                  <div className="space-y-2">
                    {ABILITIES.map(({ key, label, full }) => {
                      const currentScore = data[key] as number;
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

              {asiState.choice === "feat" && (
                <div className="space-y-3">
                  {asiState.feat && (
                    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                      <div className="text-sm font-bold text-[var(--color-text-primary)]">{asiState.feat}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setFeatModalOpen(true)}
                    className="btn btn-secondary w-full"
                  >
                    {asiState.feat ? "Change Feat" : "Choose Feat"}
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
                  setAsiState({});
                  setAsiModalOpen(false);
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
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feat Selection Modal */}
      {featModalOpen && (
        <FeatSelector
          selectedFeat={asiState.feat}
          onSelect={(feat: SRDFeat) => {
            setAsiState((prev) => ({ ...prev, feat: feat.name }));
            setFeatModalOpen(false);
          }}
          onClose={() => setFeatModalOpen(false)}
        />
      )}
    </>
  );
}

function hpLevelsToProcess(level: number): number[] {
  const arr: number[] = [];
  for (let lvl = 2; lvl <= level; lvl++) arr.push(lvl);
  return arr;
}

function allHpConfirmed(level: number, confirmedHpLevels: number[]): boolean {
  for (let lvl = 2; lvl <= level; lvl++) {
    if (!confirmedHpLevels.includes(lvl)) return false;
  }
  return true;
}
