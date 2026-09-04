"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSpells, getStaticArcaneTricksterSpells, getSubclassFlags, deduplicateSpells } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import { CheckIcon as Check, StarIcon as Star, MagnifyingGlassIcon as MagnifyingGlass } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";
import { GroupedList } from "@/components/GroupedList";
import { BasePopup } from "@/components/BasePopup";
import { getSpellSchoolStyle } from "@/lib/spell-schools";
import type { Character } from "@/lib/storage";
import { getMaxSpellLevel } from "@/lib/storage";

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
  const [activeTab, setActiveTab] = useState<"cantrips" | number>(mode === "spells" ? 1 : "cantrips");
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

  const atFlags = character.subclassIndex ? getSubclassFlags(character.subclassIndex) : {};
  const isArcaneTrickster = atFlags.usesMageSpellList;
  const atSpells = isArcaneTrickster ? getStaticArcaneTricksterSpells() : [];
  const effectiveMaxLevel = onChange ? (maxLevel ?? getMaxSpellLevel(character.class, character.level)) : (maxLevel || 0);
  const allSpells = isArcaneTrickster
    ? deduplicateSpells(atSpells.filter((s) => s.level === 0 || s.level <= effectiveMaxLevel))
    : deduplicateSpells(getStaticSpells(character.sources).filter((s) => s.classes?.includes(character.class) && (s.level === 0 || s.level <= effectiveMaxLevel)));

  const existingCantripNames = new Set((character.cantrips || []).map(c => c.name));
  const earlierSpellNames = new Set((earlierSelections || []).map(s => s.split(":")[0]));
  const alreadyKnownCantripNames = new Set([...existingCantripNames, ...earlierSpellNames]);
  const cantrips = allSpells.filter((s: any) => s.level === 0);
  const levelSpells: { [key: number]: any[] } = useMemo(() => {
    const map: { [key: number]: any[] } = {};
    for (const sp of allSpells) {
      if (sp.level > 0) {
        if (!map[sp.level]) map[sp.level] = [];
        map[sp.level].push(sp);
      }
    }
    return map;
  }, [allSpells]);
  const sortSpells = (list: any[]) => {
    list.sort((a, b) => {
      const recA = isRecommended("spell", a.name) ? 0 : 1;
      const recB = isRecommended("spell", b.name) ? 0 : 1;
      if (recA !== recB) return recA - recB;
      const sourceA = a.source || "PHB";
      const sourceB = b.source || "PHB";
      if (sourceA !== sourceB) {
        if (sourceA === "PHB") return -1;
        if (sourceB === "PHB") return 1;
        return sourceA.localeCompare(sourceB);
      }
      return a.name.localeCompare(b.name);
    });
  };
  for (const level in levelSpells) {
    sortSpells(levelSpells[level]);
  }
  sortSpells(cantrips);
  const spellLevels = Object.keys(levelSpells).map(Number).sort((a, b) => a - b);

  const searchLower = searchQuery.trim().toLowerCase();
  const filterBySearch = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    return (sp: any) => {
      const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description || "";
      return sp.name.toLowerCase().includes(lower) || sp.school?.toLowerCase().includes(lower) || desc.toLowerCase().includes(lower);
    };
  }, [searchQuery]);
  const filteredCantrips = useMemo(() => (searchLower ? cantrips.filter(filterBySearch) : cantrips), [cantrips, searchLower, filterBySearch]);
  const filteredLevelSpells = useMemo(() => {
    if (!searchLower) return levelSpells;
    const next: Record<number, any[]> = {};
    for (const level in levelSpells) {
      const filtered = levelSpells[level].filter(filterBySearch);
      if (filtered.length > 0) next[level] = filtered;
    }
    return next;
  }, [levelSpells, searchLower, filterBySearch]);

  const existingSpellNames = new Set((existingSpells || []).map(s => s.name));
  const earlierKnownSpellNames = new Set([...existingSpellNames, ...earlierSpellNames]);
  const disabledSpellNames = new Set((disabledSpells || []).map(s => s.split(":")[0]));

  const isPrepareMode = selectionType === "prepare" && !onChange;
  const prepareAlreadyKnown = new Set((allKnownSpells || []).map(s => s.split(":")[0]));

  const toggle = (name: string, level: number) => {
    const isDisabled = disabledSpellNames.has(name);
    if (isDisabled) return;

    if (onChange) {
      const isSelected = (character.spells || []).some(s => s.name === name && s.level === level);
      if (isSelected) {
        onChange({
          spells: (character.spells || []).filter(s => !(s.name === name && s.level === level)),
        });
      } else {
        if (level === 0) {
          const currentCantrips = (character.spells || []).filter(s => s.level === 0).length;
          if (currentCantrips >= maxCantripsKnown) return;
        } else {
          const currentSpells = (character.spells || []).filter(s => s.level > 0).length;
          if (currentSpells >= maxSpellsKnown) return;
        }
        const srdSpell = getStaticSpells(character.sources).find(s => s.name === name);
        const id = `spell-${name}-${level}`.replace(/\s+/g, "-");
        onChange({
          spells: [...(character.spells || []), { id, name, level, source: "srd" as const, srdSpellName: name, description: Array.isArray(srdSpell?.description) ? srdSpell.description.join("\n") : (srdSpell?.description || "") }],
        });
      }
    } else {
      if (selectedSpells.some((s) => s === `${name}:${level}`)) {
        const newList = selectedSpells.filter((s) => s !== `${name}:${level}`);
        setSelectedSpells(newList);
        onSpellsChange?.(newList);
      } else {
        if (level === 0) {
          const currentCantrips = selectedSpells.filter((s) => s.endsWith(":0")).length;
          if (currentCantrips < cantripCount) {
            const newList = [...selectedSpells, `${name}:${level}`];
            setSelectedSpells(newList);
            onSpellsChange?.(newList);
          }
        } else {
          const currentSpells = selectedSpells.filter((s) => !s.endsWith(":0")).length;
          const maxSpells = selectionType === "prepare" ? count : count;
          if (selectionType === "prepare" || currentSpells < maxSpells) {
            const newList = [...selectedSpells, `${name}:${level}`];
            setSelectedSpells(newList);
            onSpellsChange?.(newList);
          }
        }
      }
    }
  };

  const currentCantrips = onChange
    ? (character.spells || []).filter(s => s.level === 0)
    : selectedSpells.filter((s) => s.endsWith(":0"));
  const currentSpells = onChange
    ? (character.spells || []).filter(s => s.level > 0)
    : selectedSpells.filter((s) => !s.endsWith(":0"));

  const selectedCantripNames = new Set(currentCantrips.map(s => typeof s === "string" ? s.split(":")[0] : s.name));
  const selectedSpellNames = new Set(currentSpells.map(s => typeof s === "string" ? s.split(":")[0] : s.name));

  const renderSpell = (sp: any) => {
    const level = sp.level ?? 0;
    const isAlreadyKnown = level === 0 ? alreadyKnownCantripNames.has(sp.name) : earlierKnownSpellNames.has(sp.name);
    const isDisabled = disabledSpellNames.has(sp.name);
    const isSel = level === 0 ? selectedCantripNames.has(sp.name) : selectedSpellNames.has(sp.name);
    const maxForLevel = level === 0 ? (onChange ? maxCantripsKnown : cantripCount) : (onChange ? maxSpellsKnown : count);
    const disabled = !isSel && !isAlreadyKnown && !isDisabled && (level === 0 ? currentCantrips.length : currentSpells.length) >= maxForLevel;
    const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
    const finalDisabled = disabled || isAlreadyKnown || isDisabled;

    return (
      <div key={sp.name} className="flex gap-1.5">
        <button
          type="button"
          onClick={() => !isAlreadyKnown && !isDisabled && toggle(sp.name, level)}
          disabled={finalDisabled}
          className={`flex-1 px-3 py-2 text-left rounded-lg border transition-all ${
            isDisabled
              ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 cursor-default"
              : isAlreadyKnown
                ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-60 cursor-default"
                : isSel
                  ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-2 border-[var(--border-active)]"
                  : disabled
                    ? "bg-[var(--color-bg)] border-[var(--color-border)] opacity-50"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isDisabled && <Check className="h-3 w-3 text-[var(--color-accent)]" />}
            {isAlreadyKnown && !isDisabled && <Check className="h-3 w-3 text-[var(--color-text-secondary)]" />}
            {isSel && !isAlreadyKnown && !isDisabled && <Check className="h-3 w-3 text-[var(--color-surface)]" />}
            <div className="flex items-center gap-1.5">
              <SourceBadge source={(sp as any).source || "PHB"} size="sm" />
              <span className={`text-xs font-bold ${isAlreadyKnown || isDisabled ? "text-[var(--color-text-secondary)]" : ""} flex items-center gap-1`}>
                {sp.name}
                {isRecommended("spell", sp.name) && <Star className="h-3 w-3 text-amber-500" />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 ml-5">
            {sp.school && (() => {
              const schoolStyle = getSpellSchoolStyle(sp.school);
              if (!schoolStyle) return <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>;
              return (
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{
                    fontSize: "10px",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    backgroundColor: `var(${schoolStyle.bgColorVar})`,
                    color: `var(${schoolStyle.colorVar})`,
                  }}
                >
                  <schoolStyle.icon className="h-3 w-3" />
                  {schoolStyle.label}
                </span>
              );
            })()}
            {level > 0 && <span className="text-[10px] text-[var(--color-text-muted)]">·</span>}
            {level > 0 && <span className="text-[10px] text-[var(--color-text-muted)]">{sp.castingTime}</span>}
            {isDisabled && <span className="text-[10px] text-[var(--color-accent)] font-medium ml-1">From higher level</span>}
            {isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium ml-1">Already known</span>}
            {isSel && !isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-surface)] font-medium ml-1">Selected</span>}
          </div>
        </button>
      </div>
    );
  };

  const renderLevelContent = (spellsForLevel: any[]) => {
    if (spellsForLevel.length === 0 && searchQuery) {
      return <p className="text-xs text-[var(--color-text-muted)] text-center py-6">No spells match your search.</p>;
    }
    return (
      <GroupedList
        items={spellsForLevel}
        isRecommended={(sp) => isRecommended("spell", sp.name)}
        renderItem={renderSpell}
        emptyAllMessage="No spells found for this level."
      />
    );
  };

  const getTitle = () => {
    if (cantripCount > 0 && count === 0) return `Learn ${cantripCount} Additional Cantrip${cantripCount > 1 ? "s" : ""}`;
    if (spellsKnownChanged) return `Choose ${count} New Spell${count > 1 ? "s" : ""}`;
    return "Replace a Spell";
  };

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={getTitle()}
      confirmLabel="Confirm Selection"
      cancelLabel="Cancel"
      onConfirm={onClose}
      showFooter={true}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] -mx-4 -mt-3 mb-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells..."
            className="input w-full pl-10 text-sm"
          />
        </div>
      </div>

      {(currentCantrips.length > 0 || currentSpells.length > 0) && !onChange && (
        <div className="px-4 py-2 bg-green-50 border border-[var(--color-border)] rounded-[var(--radius-sm)] mb-3">
          <div className="text-[10px] font-semibold text-green-700 mb-1">
            Selected this level ({currentCantrips.length + currentSpells.length} of {(cantripCount || 0) + (count || 0)})
          </div>
          <div className="flex flex-wrap gap-1">
            {currentCantrips.map((s) => {
              const name = typeof s === "string" ? s.split(":")[0] : s.name;
              return (
                <span key={name} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 border border-green-300 rounded-full text-green-800">
                  {name}
                  {!onChange && <button type="button" onClick={() => onSpellsChange?.(spells.filter(x => x !== s))} className="hover:text-red-600 font-bold">×</button>}
                </span>
              );
            })}
            {currentSpells.map((s) => {
              const name = typeof s === "string" ? s.split(":")[0] : s.name;
              const lvl = typeof s === "string" ? s.split(":")[1] : String(s.level);
              return (
                <span key={`${name}-${lvl}`} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 border border-green-300 rounded-full text-green-800">
                  {name} <span className="text-green-600">Lv {lvl}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {cantripCount > 0 && count === 0 && (
        <div className="px-4 py-2 bg-blue-50 border border-[var(--color-border)] rounded-[var(--radius-sm)] mb-3">
          <p className="text-[10px] text-blue-700">
            You can now learn {cantripCount} additional cantrip{cantripCount > 1 ? "s" : ""}. Select from the tab below.
          </p>
        </div>
      )}
      {spellsKnownChanged && !(cantripCount > 0 && count === 0) && (
        <div className="px-4 py-2 bg-blue-50 border border-[var(--color-border)] rounded-[var(--radius-sm)] mb-3">
          <p className="text-[10px] text-blue-700">
            You learned {count} new spell{count > 1 ? "s" : ""}. Select from the tabs below.
          </p>
        </div>
      )}
      {!spellsKnownChanged && existingSpells && existingSpells.length > 0 && !(cantripCount > 0 && count === 0) && (
        <div className="px-4 py-2 bg-yellow-50 border border-[var(--color-border)] rounded-[var(--radius-sm)] mb-3">
          <p className="text-[10px] text-yellow-700 mb-1">Replace a spell (optional):</p>
          <div className="flex flex-wrap gap-1">
            {existingSpells.map((sp) => (
              <span key={`${sp.name}:${sp.level}`} className="text-[10px] px-1.5 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full">
                {sp.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex-shrink-0 flex border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide -mx-4 px-4">
        {mode !== "spells" && (
          <button
            type="button"
            onClick={() => setActiveTab("cantrips")}
            className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeTab === "cantrips"
                ? "text-[var(--color-text-primary)] bg-[var(--color-bg)] border-b-2 border-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            Cantrips ({currentCantrips.length}/{onChange ? maxCantripsKnown : cantripCount})
          </button>
        )}
        {mode !== "cantrips" && spellLevels.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setActiveTab(lvl)}
            className={`px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeTab === lvl
                ? "text-[var(--color-text-primary)] bg-[var(--color-bg)] border-b-2 border-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            }`}
          >
            Level {lvl} ({currentSpells.filter((s) => typeof s !== "string" ? s.level === lvl : false).length}/{onChange ? maxSpellsKnown : count})
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden mt-3">
        {activeTab === "cantrips" ? (
          renderLevelContent(filteredCantrips)
        ) : (
          <div className="h-full overflow-y-auto">{renderLevelContent(filteredLevelSpells[activeTab as number] || [])}</div>
        )}
      </div>
    </BasePopup>
  );
}
