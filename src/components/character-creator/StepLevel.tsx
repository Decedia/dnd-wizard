"use client";

import { useState, useMemo, useEffect } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import {
  getModifier,
  getHitDieAverage,
  getMaxHpFromLevelHp,
  type Character,
} from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";
import { Dice, type DiceType } from "@/components/Dice";

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

export function StepLevel({ data, onChange }: StepLevelProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(data.con);
  const level = data.level || 1;

  const levelHp = data.levelHp || {};
  const baselineHp = hitDie + conMod;
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const avgNoCon = getHitDieAverage(hitDie);
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
  const [asiConfirmation, setAsiConfirmation] = useState<string | null>(null);

  const currentAsiLevel = pendingAsiLevels[currentAsiIndex];

  const totalAsiPoints = useMemo(
    () => Object.values(asiAllocation).reduce((sum, val) => sum + val, 0),
    [asiAllocation]
  );
  const canApplyAsi = totalAsiPoints === 2;

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
  };

  const applyAsi = () => {
    if (!currentAsiLevel || !canApplyAsi) return;
    const patch: Partial<Character> = {
      appliedAsi: [...data.appliedAsi, currentAsiLevel],
    };
    const changed: string[] = [];
    ABILITIES.forEach(({ key, full }) => {
      if (asiAllocation[key] > 0) {
        patch[key] = (data[key] as number) + asiAllocation[key];
        changed.push(`${full} increased to ${patch[key]}`);
      }
    });
    onChange(patch);
    setAsiConfirmation(changed.join(", "));
    setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    setCurrentAsiIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (!asiConfirmation) return;
    const timer = setTimeout(() => {
      setAsiConfirmation(null);
      setAsiModalOpen(!!currentAsiLevel);
    }, 1500);
    return () => clearTimeout(timer);
  }, [asiConfirmation, currentAsiLevel]);

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

  const levelFeatures = classData?.levels[level - 1]?.features || [];
  const levelDescription = useMemo(() => {
    const names = levelFeatures.map((f) => f.name);
    if (names.includes("Ability Score Improvement")) return "Ability Score Improvement available";
    if (names.includes("Extra Attack")) return "Extra Attack: you can attack twice per action";
    const subclassKeywords = [
      "Primal Path", "Martial Archetype", "Monastic Tradition", "Sorcerous Origin",
      "Otherworldly Patron", "Druid Circle", "Divine Domain", "Bard College",
      "Rogue Archetype", "Ranger Archetype", "Arcane Tradition", "Sacred Oath",
    ];
    const match = names.find((n) => subclassKeywords.includes(n));
    if (match) return `${match} subclass unlocks`;
    if (names.length === 0) return "No new features";
    return names.slice(0, 2).join(", ") + (names.length > 2 ? "..." : "");
  }, [levelFeatures]);

  const hpLevelsToProcess = useMemo(() => {
    const arr: number[] = [];
    for (let lvl = 2; lvl <= level; lvl++) arr.push(lvl);
    return arr;
  }, [level]);

  const hpProgress = confirmedHpLevels.length;
  const hpTotal = useMemo(() => {
    let total = levelHp[1] || baselineHp;
    for (const lvl of confirmedHpLevels) {
      total += levelHp[lvl] || 0;
    }
    return total;
  }, [levelHp, confirmedHpLevels, baselineHp]);

  const allHpConfirmed = activeHpLevel === null;

  const levelData = classData?.levels[level - 1];
  const features = (levelData?.features || []).map((f: any) => ({
    name: f.name,
    description: normalizeDescription(f.description),
  }));

  return (
    <>
      <StepCard
        title="Starting Level"
        hint="Choose your character's starting level. Higher levels mean more abilities, but also more complexity. Your subclass becomes available when you reach the required level for your class."
      >
        <div className="space-y-5">
          <div>
            <div className="text-[10px] text-paper-muted uppercase tracking-wider mb-2 font-medium">Select Level</div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
                const isActive = lvl === level;
                const isMilestone = milestoneLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => adjustLevel(lvl)}
                    className={`relative aspect-square rounded-[var(--radius-md)] border-[var(--border-active)] flex items-center justify-center text-lg font-semibold transition-all ${
                      isActive
                        ? "bg-paper text-ink border-paper"
                        : "bg-ink text-paper border-paper"
                    }`}
                  >
                    {lvl}
                    {isMilestone && (
                          <span
                            className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                              isActive ? "bg-ink" : "bg-paper"
                            }`}
                          />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-3 text-xs text-[var(--color-text-primary)]">
            Level {level} — {levelDescription || "No new features"}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">HP Roll</div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Total so far: <span className="text-ink font-semibold bg-paper px-1 rounded">{hpTotal}</span> HP
              </div>
            </div>

            {level >= 1 && (
              <div className="text-[11px] text-[var(--color-text-secondary)]">
                Level 1 HP: {hitDie} + CON ({conMod >= 0 ? `+${conMod}` : conMod}) ={" "}
                <span className="text-ink font-semibold bg-paper px-1 rounded">{levelHp[1] || baselineHp}</span>
              </div>
            )}

            {hpLevelsToProcess.length > 0 && (
              <div className="flex items-center justify-center gap-1.5">
                {hpLevelsToProcess.map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-2 w-2 rounded-full ${
                      confirmedHpLevels.includes(lvl) ? "bg-red-500" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}

            {activeHpLevel && (
              <div className="card p-4 space-y-4">
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
                    onChange={(e) =>
                      setCurrentHpValue(Math.max(1, parseInt(e.target.value || "0", 10)))
                    }
                    className="input w-20 text-center text-sm font-semibold"
                    placeholder="—"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={confirmHp}
                    disabled={currentHpValue <= 0}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    Confirm Level {currentHpValue > 0 ? activeHpLevel : ""} HP
                  </button>
                </div>
              </div>
            )}

            {allHpConfirmed && hpLevelsToProcess.length > 0 && (
              <div className="text-center text-xs text-[var(--color-text-secondary)]">All HP confirmed</div>
            )}
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-display font-bold text-[var(--color-text-primary)] tracking-tight">Level {level}</div>
            {classData && classData.subclassLevel && (
              <div className="text-xs text-[var(--color-text-secondary)] mt-1.5 font-medium">
                Subclass available at Level {classData.subclassLevel}
              </div>
            )}
          </div>

        {currentAsiLevel && !asiModalOpen && (
          <div className="card p-4 text-center text-xs text-[var(--color-text-primary)]">
            {asiConfirmation ? (
              <div className="text-ink font-semibold bg-paper px-2 py-1 rounded-md inline-block">✓ {asiConfirmation}</div>
            ) : (
              <button type="button" onClick={() => setAsiModalOpen(true)} className="btn btn-primary w-full">
                Complete your Ability Score Improvement
              </button>
            )}
          </div>
        )}

          {!currentAsiLevel && pendingAsiLevels.length > 0 && (
            <div className="surface p-4">
              <p className="text-xs text-ink font-medium leading-relaxed">
                Complete the current Ability Score Improvement to continue.
              </p>
            </div>
          )}

          {features.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-medium">Class Features</div>
              <div className="space-y-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="card p-4 space-y-2">
                    <div className="text-sm font-bold text-ink bg-paper px-2 py-1 rounded-md inline-block tracking-wide">{feature.name}</div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-[1.7] whitespace-pre-line">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </StepCard>

      {asiModalOpen && currentAsiLevel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="card p-4">
            <div className="flex items-center justify-between border-b-[3px] border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                Ability Score Improvement (Level {currentAsiLevel})
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 space-y-4">
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
                      className="card flex items-center justify-between px-3 py-2.5"
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
                            className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-ink bg-paper w-7 text-center px-1 rounded-md">
                            {allocated > 0 ? `+${allocated}` : "0"}
                          </span>
                          <button
                            type="button"
                            onClick={() => allocateAsiPoint(key)}
                            disabled={allocated >= 2 || totalAsiPoints >= 2 || isAtCap}
                            className="btn flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30"
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
            <div className="flex justify-between border-t-[3px] border-paper px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
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
                Apply Ability Score Improvement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
