"use client";

import { useState } from "react";
import { BasePopup } from "@/components/BasePopup";
import { BookPatterns, BookEmojis, type BookId } from "@/components/book-svgs";
import { getSourceName } from "@/components/SourceBadge";

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
  DMG: "The Dungeon Master's Guide is the core book for running the game. For players it adds the Death Domain cleric and the Oathbreaker paladin.",
  ERLW: "Eberron: Rising from the Last War presents the Eberron setting, with races such as the changeling, kalashtar, shifter and warforged, plus dragonmarks.",
  AAG: "Spelljammer: Astral Adventurer's Guide covers adventures in wildspace and adds the astral elf, autognome, giff, hadozee, plasmoid and thri-kreen races.",
  EEPC: "The Elemental Evil Player's Companion adds the aarakocra, deep gnome, genasi and goliath races, and many elemental spells.",
  BGG: "Bigby Presents: Glory of the Giants is about giants and their lore. For players it adds the Path of the Giant barbarian and giant-themed feats.",
  DSotDQ: "Dragonlance: Shadow of the Dragon Queen is a Krynn adventure. For players it adds the kender race, the Lunar Sorcery sorcerer and backgrounds.",
  TTP: "The Tortle Package is a short supplement that adds the tortle race.",
  MOoT: "Mythic Odysseys of Theros presents a Greek-myth setting, with the centaur, minotaur, satyr and leonin races and new subclasses.",
  GGR: "Guildmasters' Guide to Ravnica presents the Ravnica setting, with races such as the loxodon, centaur, minotaur, simic hybrid and vedalken.",
  SCC: "Strixhaven: A Curriculum of Chaos is set in a magic university, with new backgrounds, feats and spells such as silvery barbs.",
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
                {getSourceName(activeTab)}
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
