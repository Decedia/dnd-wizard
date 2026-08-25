"use client";

export type TabId = "combat" | "features" | "gear" | "spells" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "features", label: "Features" },
  { id: "gear", label: "Gear" },
  { id: "spells", label: "Spells" },
  { id: "bio", label: "Bio" },
];

export function SheetTabs({ activeTab, onTabChange }: SheetTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap rounded-lg border-2 px-4 py-1.5 text-sm font-bold transition-all ${
              isActive
                ? "bg-paper text-ink border-ink"
                : "bg-transparent text-paper-muted border-paper hover:text-paper"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
