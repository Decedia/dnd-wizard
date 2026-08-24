"use client";

import { StepCard } from "./StepCard";
import { getStaticClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";

interface StepLevelProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepLevel({ data, onChange }: StepLevelProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const hitDie = classData?.hitDie || 10;
  const conMod = Math.floor((data.con - 10) / 2);
  const level = data.level || 1;

  const baselineHp = hitDie + conMod;

  const levelData = classData?.levels[level - 1];
  const features = (levelData?.features || []).map((f: any) => ({
    name: f.name,
    description: normalizeDescription(f.description),
  }));
  const hasAsi = !!levelData?.asi;

  const adjustLevel = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(20, newLevel));
    const patch: Partial<Character> = { level: clamped };
    if (classData && clamped < (classData.subclassLevel || 0)) {
      patch.subclass = undefined;
    }
    onChange(patch);
  };

  const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value || "0", 10);
    if (!isNaN(value) && value >= 0) {
      onChange({ maxHp: value, currentHp: value });
    }
  };

  return (
    <StepCard title="Starting Level" hint="Choose your character's starting level. Higher levels mean more abilities, but also more complexity. Your subclass becomes available when you reach the required level for your class.">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const isActive = lvl === level;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => adjustLevel(lvl)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-charcoal/40 p-3 space-y-3">
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-parchment">Level {level}</div>
            {classData && classData.subclassLevel && (
              <div className="text-xs text-parchment/50 mt-1">
                Subclass available at Level {classData.subclassLevel}
              </div>
            )}
          </div>

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

          {hasAsi && (
            <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
              <span className="text-accent text-sm font-semibold">📊 Ability Score Improvement</span>
              <span className="text-xs text-parchment/60">+2 ability points or 1 feat</span>
            </div>
          )}

          <div>
            <div className="text-xs text-parchment/50 uppercase tracking-wider mb-1">HP Roll</div>
            <input
              type="number"
              value={data.maxHp || baselineHp}
              onChange={handleHpChange}
              className="input w-full text-center"
              placeholder={String(baselineHp)}
            />
            <div className="text-[10px] text-parchment/40 mt-1">
              d{hitDie} + CON ({conMod >= 0 ? '+' : ''}{conMod}) = {baselineHp} average
            </div>
          </div>
        </div>
      </div>
    </StepCard>
  );
}
