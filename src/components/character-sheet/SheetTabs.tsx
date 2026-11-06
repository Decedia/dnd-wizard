"use client";

import { SwordIcon as Sword, StarIcon as Star, BackpackIcon as Backpack, LightningIcon as Lightning, UserIcon as User } from "@/components/icons";

export type TabId = "combat" | "features" | "gear" | "spells" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /** Tabs to leave out, such as Spells for a character who can't cast. */
  hidden?: TabId[];
}

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "combat", label: "Combat", Icon: Sword },
  { id: "features", label: "Features", Icon: Star },
  { id: "gear", label: "Gear", Icon: Backpack },
  { id: "spells", label: "Spells", Icon: Lightning },
  { id: "bio", label: "Bio", Icon: User },
];

export function SheetTabs({ activeTab, onTabChange, hidden = [] }: SheetTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
      {TABS.filter((tab) => !hidden.includes(tab.id)).map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`btn whitespace-nowrap px-2.5 py-1.5 text-xs inline-flex items-center ${
              isActive
                ? "btn btn-primary"
                : "btn btn-secondary"
            }`}
          >
            <Icon className="h-4 w-4 mr-1" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
