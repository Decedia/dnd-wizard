"use client";

export type TabId = "combat" | "features" | "gear" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "features", label: "Features" },
  { id: "gear", label: "Gear" },
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
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
