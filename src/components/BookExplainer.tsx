"use client";

import { useState } from "react";
import { BasePopup } from "@/components/BasePopup";
import { BookPatterns, BookEmojis, type BookId } from "@/components/book-svgs";

const BOOK_DESCRIPTIONS: Record<BookId, string> = {
  PHB: "The Player's Handbook is the core rulebook for D&D 5e. It contains the essential rules, character creation options, spells, and equipment every player needs.",
  XGE: "Xanathar's Guide to Everything expands the game with new subclasses, spells, feats, and optional rules. It also includes tools for Dungeon Masters.",
  TCE: "Tasha's Cauldron of Everything introduces new character options, optional rules, and subclasses. It emphasizes player agency and customization.",
  MTF: "Mordenkainen's Tome of Foes delves into the lore of D&D's iconic monsters and provides new character race options from the Monster Manual lore.",
  VGTM: "Volo's Guide to Monsters offers new player races, monster lore, and new monsters for Dungeon Masters to use in their campaigns.",
  MPMM: "Mordenkainen Presents: Monsters of the Multiverse is a comprehensive bestiary with updated stat blocks and new playable races from across D&D's multiverse.",
  SCAG: "The Sword Coast Adventurer's Guide focuses on the Forgotten Realms setting, providing new subclasses, backgrounds, and lore for the Sword Coast region.",
  EGW: "Explorer's Guide to Wildemount introduces the Critical Role campaign setting with new races, subclasses, and lore for the continent of Wildemount.",
  FTD: "Fizban's Treasury of Dragons is a draconic-themed sourcebook with new dragon-related options, subclasses, and lore about dragons across the multiverse.",
  VRGR: "Van Richten's Guide to Ravenloft is a horror-themed sourcebook that explores the Ravenloft setting with new lineages, subclasses, and horror-themed character options.",
};

interface BookExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookExplainer({ isOpen, onClose }: BookExplainerProps) {
  const [activeTab, setActiveTab] = useState<BookId>("PHB");
  const tabs = Object.keys(BOOK_DESCRIPTIONS) as BookId[];

  return (
    <BasePopup isOpen={isOpen} onClose={onClose} title="About Rulebooks" showFooter={false}>
      <div className="space-y-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{BookEmojis[activeTab]}</span>
            <div>
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{activeTab}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                {activeTab === "PHB" && "Player's Handbook"}
                {activeTab === "XGE" && "Xanathar's Guide to Everything"}
                {activeTab === "TCE" && "Tasha's Cauldron of Everything"}
                {activeTab === "MTF" && "Mordenkainen's Tome of Foes"}
                {activeTab === "VGTM" && "Volo's Guide to Monsters"}
                {activeTab === "MPMM" && "Monsters of the Multiverse"}
                {activeTab === "SCAG" && "Sword Coast Adventurer's Guide"}
                {activeTab === "EGW" && "Explorer's Guide to Wildemount"}
                {activeTab === "FTD" && "Fizban's Treasury of Dragons"}
                {activeTab === "VRGR" && "Van Richten's Guide to Ravenloft"}
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {BOOK_DESCRIPTIONS[activeTab]}
          </p>
        </div>
      </div>
    </BasePopup>
  );
}
