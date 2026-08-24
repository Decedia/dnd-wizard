"use client";

interface LevelUpSpellSlotsSectionProps {
  description: string;
  spellSlots: Record<number, number>;
}

export function LevelUpSpellSlotsSection({ description, spellSlots }: LevelUpSpellSlotsSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-parchment/60">{description}</p>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(spellSlots || {}).map(([level, count]) => (
          <div
            key={level}
            className="flex flex-col items-center rounded-lg border border-border bg-charcoal/40 p-2"
          >
            <span className="text-xs text-parchment/50">Lvl {level}</span>
            <span className="text-lg font-bold text-accent">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
