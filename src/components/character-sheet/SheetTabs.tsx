"use client";

import { useState } from "react";

type TabId = "combat" | "character" | "gear" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "character", label: "Character" },
  { id: "gear", label: "Gear" },
  { id: "bio", label: "Bio" },
];

export function SheetTabs({ activeTab, onTabChange }: SheetTabsProps) {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-burgundy text-parchment shadow-lg shadow-burgundy/20"
                  : "bg-charcoal-lighter text-parchment/60 hover:text-parchment hover:bg-charcoal-lighter/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
