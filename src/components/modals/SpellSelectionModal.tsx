"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSpells, getClassSpells, getSubclassFlags, deduplicateSpells } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import { CheckIcon as Check, StarIcon as Star, MagnifyingGlassIcon as MagnifyingGlass } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";
import { GroupedList } from "@/components/GroupedList";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { getSpellSchoolStyle } from "@/lib/spell-schools";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { getMaxSpellLevel } from "@/lib/storage";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface SpellSelectionModalProps {
  character: Character;
  subclassSelection?: string;
  count?: number;
  cantripCount?: number;
  maxLevel?: number;
  spells?: string[];
  onSpellsChange?: (list: string[]) => void;
  onClose: () => void;
  existingSpells?: { name: string; level: number }[];
  spellsKnownChanged?: boolean;
  earlierSelections?: string[];
  onChange?: (patch: Partial<Character>) => void;
  magicalSecretsCount?: number;
  magicalSecretsSpells?: string[];
  onMagicalSecretsChange?: (list: string[]) => void;
  subclassSpellSelectionCount?: number;
  subclassSpellSelections?: string[];
  onSubclassSpellSelectionsChange?: (list: string[]) => void;
  maxSpellsKnown?: number;
  maxCantripsKnown?: number;
  mode?: "all" | "cantrips" | "spells";
  selectionType?: "known" | "book" | "prepare";
  allKnownSpells?: string[];
  disabledSpells?: string[];
}

export function SpellSelectionModal({
  character,
  subclassSelection,
  count = 0,
  cantripCount = 0,
  maxLevel = 0,
  spells = [],
  onSpellsChange,
  onClose,
  existingSpells,
  spellsKnownChanged,
  earlierSelections,
  onChange,
  maxSpellsKnown = 0,
  maxCantripsKnown = 0,
  mode = "all",
  selectionType = "known",
  allKnownSpells = [],
  disabledSpells = [],
}: SpellSelectionModalProps) {
  const { tDesc, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"cantrips" | number>(() => {
    if (mode === "cantrips") return "cantrips";
    if (mode === "spells") return 1;
    return "cantrips";
  });
  const [selectedSpells, setSelectedSpells] = useState<string[]>(spells);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedSpells(spells);
  }, [spells]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const classSpells = useMemo(() => {
    const classData = character.class ? getClassSpells(character.class) : [];
    return classData;
  }, [character.class]);

  const subclassFlags = useMemo(() => {
    if (!character.subclass || !character.subclassIndex) return {};
    const subclassData = getSubclassFlags(character.subclassIndex);
    return subclassData || {};
  }, [character.subclass, character.subclassIndex]);

  const allSpells = useMemo(() => {
    const srdSpells = getStaticSpells(character.sources, character.ruleset, language);
    const classSpellNames = new Set<string>();
    classSpells.forEach((s: any) => {
      classSpellNames.add(s.name || s);
    });
    const subclassSpells: string[] = [];
    if (subclassFlags.spells && character.subclass) {
      const details = getStaticSpells(character.sources, character.ruleset, language);
      details.forEach((s) => {
        if (s.classes?.includes(character.subclass || "")) {
          subclassSpells.push(s.name);
        }
      });
    }
    return deduplicateSpells(srdSpells);
  }, [character.sources, character.ruleset, language, classSpells, subclassFlags, character.subclass]);

  const maxSpellLevelForClass = useMemo(() => {
    if (maxLevel > 0) return maxLevel;
    return getMaxSpellLevel(character.class, character.level);
  }, [character.class, character.level, maxLevel]);

  const cantrips = useMemo(() => {
    return allSpells.filter((s) => s.level === 0);
  }, [allSpells]);

  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, typeof allSpells> = {};
    for (let i = 1; i <= maxSpellLevelForClass; i++) {
      grouped[i] = [];
    }
    allSpells.forEach((s) => {
      if (s.level >= 1 && s.level <= maxSpellLevelForClass) {
        grouped[s.level].push(s);
      }
    });
    return grouped;
  }, [allSpells, maxSpellLevelForClass]);

  const isSpellDisabled = (spell: any) => {
    if (disabledSpells.includes(spell.name)) return true;
    if (selectionType === "book" && !allKnownSpells.includes(spell.name) && !spells.includes(spell.name)) return true;
    return false;
  };

  const isSpellAlreadyKnown = (spell: any) => {
    return allKnownSpells.includes(spell.name) || existingSpells?.some((s) => s.name === spell.name);
  };

  const handleToggle = (spell: any) => {
    if (isSpellDisabled(spell)) return;
    const name = spell.name;
    setSelectedSpells((prev) => {
      if (prev.includes(name)) {
        return prev.filter((s) => s !== name);
      }
      if (selectionType === "known") {
        if ((spell as any).level > 0 && maxSpellsKnown > 0) {
          const currentLeveled = prev.filter((s) => (allSpells.find((sp) => sp.name === s)?.level ?? 0) > 0).length;
          if (currentLeveled >= maxSpellsKnown) return prev;
        }
        if ((spell as any).level === 0 && maxCantripsKnown > 0) {
          const currentCantrips = prev.filter((s) => (allSpells.find((sp) => sp.name === s)?.level ?? -1) === 0).length;
          if (currentCantrips >= maxCantripsKnown) return prev;
        }
      }
      return [...prev, name];
    });
  };

  const handleConfirm = () => {
    if (onSpellsChange) {
      onSpellsChange(selectedSpells);
    }
    onClose();
  };

  const getTitle = () => {
    if (cantripCount > 0 && count === 0) return `Learn ${cantripCount} Additional Cantrip${cantripCount > 1 ? "s" : ""}`;
    if (spellsKnownChanged) return `Choose ${count} New Spell${count > 1 ? "s" : ""}`;
    return "Replace a Spell";
  };

  const getSubtitle = () => {
    if (selectionType === "known") return `Select spells to learn (${selectedSpells.length}/${maxSpellsKnown || "∞"})`;
    if (selectionType === "prepare") return `Select spells to prepare (${selectedSpells.length} selected)`;
    return `Select spells for your spellbook (${selectedSpells.length} selected)`;
  };

  const renderSpellList = (spellsList: any[], levelLabel?: string) => {
    const filtered = spellsList.filter((sp) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return sp.name.toLowerCase().includes(q) || (sp.description || "").toLowerCase().includes(q);
    });

    if (filtered.length === 0 && searchQuery) {
      return <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No spells match your search.</p>;
    }

    return (
      <div className="space-y-2">
        {filtered.map((sp) => {
          const isSelected = selectedSpells.includes(sp.name);
          const isDisabled = isSpellDisabled(sp);
          const isAlreadyKnown = isSpellAlreadyKnown(sp);
          const rawDesc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
          const schoolBadge = sp.school
            ? (() => {
                const schoolStyle = getSpellSchoolStyle(sp.school);
                return schoolStyle ? `[${schoolStyle.label}]` : `[${sp.school}]`;
              })()
            : "";
          const subtitleText = schoolBadge ? `${schoolBadge} ${rawDesc || ""}` : rawDesc;
          return (
            <SplitSelectionCard
              key={sp.name}
              title={sp.name}
              subtitle={subtitleText}
              isSelected={isSelected}
              onSelect={() => handleToggle(sp)}
              infoType="modal"
              modalContent={<p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{rawDesc}</p>}
            />
          );
        })}
      </div>
    );
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          selectedSpells.length > 0
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm Selection ({selectedSpells.length})
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={getTitle()} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">{getSubtitle()}</p>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {mode === "all" && (
          <div className="flex gap-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setActiveTab("cantrips")}
              className={`flex-1 py-2 text-xs font-semibold transition-all ${
                activeTab === "cantrips"
                  ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Cantrips ({cantrips.length})
            </button>
            {Array.from({ length: maxSpellLevelForClass }, (_, i) => i + 1).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveTab(level)}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${
                  activeTab === level
                    ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                Level {level} ({spellsByLevel[level]?.length || 0})
              </button>
            ))}
          </div>
        )}
        {mode === "spells" && (
          <div className="flex gap-2 border-b border-[var(--color-border)]">
            {Array.from({ length: maxSpellLevelForClass }, (_, i) => i + 1).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveTab(level)}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${
                  activeTab === level
                    ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                Level {level} ({spellsByLevel[level]?.length || 0})
              </button>
            ))}
          </div>
        )}
        {mode === "cantrips" ? renderSpellList(cantrips) : activeTab === "cantrips" ? renderSpellList(cantrips) : renderSpellList(spellsByLevel[activeTab] || [])}
      </div>
    </BottomSheet>
  );
}
