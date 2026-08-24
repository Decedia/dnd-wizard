"use client";

interface LevelTabsProps {
  steps: { id: string; level: number }[];
  levelTab: number;
  onSelect: (index: number) => void;
}

export function LevelTabs({ steps, levelTab, onSelect }: LevelTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {steps.map((step, index) => {
        const isActive = index === levelTab;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
            }`}
          >
            Level {step.level}
          </button>
        );
      })}
    </div>
  );
}
