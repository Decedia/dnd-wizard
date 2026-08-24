"use client";

interface LevelUpHpSectionProps {
  description: string;
  level: number;
  hpGain: number;
  onHpChange: (level: number, value: number) => void;
}

export function LevelUpHpSection({ description, level, hpGain, onHpChange }: LevelUpHpSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-parchment/60">{description}</p>
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <input
            type="number"
            value={hpGain || ""}
            onChange={(e) => onHpChange(level, Number(e.target.value) || 0)}
            className="input w-24 text-center"
            placeholder="HP"
            min={1}
          />
          <span className="text-xs text-text-muted">HP Gain</span>
        </div>
      </div>
    </div>
  );
}
