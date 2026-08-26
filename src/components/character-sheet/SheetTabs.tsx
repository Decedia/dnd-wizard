"use client";

import { Sword, Star, Backpack, Lightning, User } from "phosphor-react";

export type TabId = "combat" | "features" | "gear" | "spells" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }> }[] = [
  { id: "combat", label: "Combat", Icon: Sword },
  { id: "features", label: "Features", Icon: Star },
  { id: "gear", label: "Gear", Icon: Backpack },
  { id: "spells", label: "Spells", Icon: Lightning },
  { id: "bio", label: "Bio", Icon: User },
];

export function SheetTabs({ activeTab, onTabChange }: SheetTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.Icon;
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
            <Icon className="h-3.5 w-3.5 mr-1.5" weight={isActive ? "fill" : "regular"} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
