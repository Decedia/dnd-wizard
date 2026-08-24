"use client";

interface LevelTabsProps {
  steps: { id: string; level: number }[];
  levelTab: number;
  onSelect: (index: number) => void;
}

export function LevelTabs({ steps, levelTab, onSelect }: LevelTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              index === levelTab
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
            }`}
          >
            Level {step.level}
          </button>
        ))}
      </div>
    </div>
  );
}
