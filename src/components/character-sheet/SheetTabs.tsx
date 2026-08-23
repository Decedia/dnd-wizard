"use client";

import { useState } from "react";

type TabId = "combat" | "character" | "abilities" | "spells";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "spells", label: "Spells" },
  { id: "abilities", label: "Abilities" },
  { id: "character", label: "Character" },
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
