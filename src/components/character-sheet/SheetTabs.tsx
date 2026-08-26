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
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`btn whitespace-nowrap px-4 py-1.5 text-xs ${
              isActive
                ? "btn btn-primary"
                : "btn btn-secondary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
