"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";

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
  const conMod = Math.floor((data.con - 10) / 2);
  const level = data.level || 1;

  const baselineHp = hitDie + conMod;

  const asiLevels = useMemo(() => {
    if (!classData?.levels) return [];
    return classData.levels
      .map((lvl, idx) => ({ level: idx + 1, asi: !!lvl.asi }))
      .filter((entry) => entry.asi)
      .map((entry) => entry.level);
  }, [classData]);

  const pendingAsiLevels = asiLevels.filter((asiLevel) => !data.appliedAsi.includes(asiLevel) && asiLevel <= level);

  const [currentAsiIndex, setCurrentAsiIndex] = useState(0);
  const [asiAllocation, setAsiAllocation] = useState<Record<AbilityKey, number>>({
    str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0,
  });

  const currentAsiLevel = pendingAsiLevels[currentAsiIndex];

  const totalAsiPoints = useMemo(() => Object.values(asiAllocation).reduce((sum, val) => sum + val, 0), [asiAllocation]);
  const canApplyAsi = totalAsiPoints === 2;

  const adjustLevel = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(20, newLevel));
    const patch: Partial<Character> = { level: clamped };
    if (classData && clamped < (classData.subclassLevel || 0)) {
      patch.subclass = undefined;
    }
    onChange(patch);
    setCurrentAsiIndex(0);
    setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
  };

  const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value || "0", 10);
    if (!isNaN(value) && value >= 0) {
      onChange({ maxHp: value, currentHp: value });
    }
  };

  const applyAsi = () => {
    if (!currentAsiLevel || !canApplyAsi) return;
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

  const levelData = classData?.levels[level - 1];
  const features = (levelData?.features || []).map((f: any) => ({
    name: f.name,
    description: normalizeDescription(f.description),
  }));

  return (
    <StepCard title="Starting Level" hint="Choose your character's starting level. Higher levels mean more abilities, but also more complexity. Your subclass becomes available when you reach the required level for your class.">
      <div className="space-y-4">
        <div>
          <div className="text-xs text-parchment/50 uppercase tracking-wider mb-1">HP Roll *</div>
          <input
            type="number"
            value={data.maxHp || ""}
            onChange={handleHpChange}
            className="input w-full text-center"
            placeholder={String(baselineHp)}
          />
          <div className="text-[10px] text-parchment/40 mt-1">
            d{hitDie} + CON ({conMod >= 0 ? '+' : ''}{conMod}) = {baselineHp} average
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const isActive = lvl === level;
            const isAsi = asiLevels.includes(lvl);
            const isApplied = data.appliedAsi.includes(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => adjustLevel(lvl)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all relative ${
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
                }`}
              >
                {lvl}
                {isAsi && isApplied && <span className="absolute -top-1 -right-1 text-[10px]">📊</span>}
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <div className="text-3xl font-display font-bold text-parchment">Level {level}</div>
          {classData && classData.subclassLevel && (
            <div className="text-xs text-parchment/50 mt-1">
              Subclass available at Level {classData.subclassLevel}
            </div>
          )}
        </div>

        {currentAsiLevel && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-3">
            <div className="text-xs text-accent font-semibold uppercase tracking-wider">
              Ability Score Improvement (Level {currentAsiLevel})
            </div>
            <p className="text-xs text-parchment/70">Distribute 2 points: +2 to one ability, or +1 to two abilities.</p>
            <div className="space-y-2">
              {ABILITIES.map(({ key, label, full }) => {
                const currentScore = data[key] as number;
                const allocated = asiAllocation[key] || 0;
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-parchment/80 w-12">{label}</span>
                      <span className="text-[10px] text-text-muted">{full}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-parchment w-8 text-center">{currentScore}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => removeAsiPoint(key)}
                          disabled={allocated <= 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-accent w-6 text-center">{allocated > 0 ? `+${allocated}` : "0"}</span>
                        <button
                          type="button"
                          onClick={() => allocateAsiPoint(key)}
                          disabled={allocated >= 2 || totalAsiPoints >= 2}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-parchment/60 disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={applyAsi}
              disabled={!canApplyAsi}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply ASI
            </button>
          </div>
        )}

        {pendingAsiLevels.length > 0 && !currentAsiLevel && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="text-xs text-parchment/70">Complete the current Ability Score Improvement to continue.</p>
          </div>
        )}

        {features.length > 0 && (
          <div>
            <div className="text-xs text-parchment/50 uppercase tracking-wider mb-2">Features</div>
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-sm font-semibold text-accent">{feature.name}</div>
                  <p className="text-xs text-parchment/70 leading-relaxed whitespace-pre-line">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
