"use client";

import { useState, useEffect } from "react";
import { getStaticSpells, getStaticArcaneTricksterSpells, getSubclassFlags } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import type { Character } from "@/lib/storage";
import { XIcon as X, CheckIcon as Check } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";

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
  const effectiveMaxLevel = onChange ? (character.level || 1) : (maxLevel || 0);
  const allSpells = isArcaneTrickster
    ? atSpells.filter((s) => s.level === 0 || s.level <= effectiveMaxLevel)
    : getStaticSpells(character.sources).filter((s) => s.classes?.includes(character.class) && (s.level === 0 || s.level <= effectiveMaxLevel));
  const existingCantripNames = new Set((character.cantrips || []).map(c => c.name));
  const earlierSpellNames = new Set((earlierSelections || []).map(s => s.split(":")[0]));
  const alreadyKnownCantripNames = new Set([...existingCantripNames, ...earlierSpellNames]);
  const cantrips = allSpells.filter((s: any) => s.level === 0);
  const levelSpells: { [key: number]: any[] } = {};
  for (const sp of allSpells) {
    if (sp.level > 0) {
      if (!levelSpells[sp.level]) levelSpells[sp.level] = [];
      levelSpells[sp.level].push(sp);
    }
  }
  const spellLevels = Object.keys(levelSpells).map(Number).sort((a, b) => a - b);

  const existingSpellNames = new Set((existingSpells || []).map(s => s.name));
  const alreadyKnownSpellNames = new Set([...existingSpellNames, ...earlierSpellNames]);
  const disabledSpellNames = new Set((disabledSpells || []).map(s => s.split(":")[0]));

  const isPrepareMode = selectionType === "prepare" && !onChange;
  const prepareAlreadyKnown = new Set((allKnownSpells || []).map(s => s.split(":")[0]));

  const toggle = (name: string, level: number) => {
    const isDisabled = disabledSpellNames.has(name);
    if (isDisabled) return;

    if (onChange) {
      // Character sheet mode - update character directly
      const isSelected = (character.spells || []).some(s => s.name === name && s.level === level);
      if (isSelected) {
        onChange({
          spells: (character.spells || []).filter(s => !(s.name === name && s.level === level)),
        });
      } else {
        // Enforce max spells/cantrips known limits
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
      // Level up wizard mode
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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            {cantripCount > 0 && count === 0
              ? `Learn ${cantripCount} Additional Cantrip${cantripCount > 1 ? "s" : ""}`
              : spellsKnownChanged
                ? `Choose ${count} New Spell${count > 1 ? "s" : ""}`
                : "Replace a Spell"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

         {(currentCantrips.length > 0 || currentSpells.length > 0) && !onChange && (
          <div className="px-4 py-2 bg-green-50 border-b border-[var(--color-border)]">
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
          <div className="px-4 py-2 bg-blue-50 border-b border-[var(--color-border)]">
            <p className="text-[10px] text-blue-700">
              You can now learn {cantripCount} additional cantrip{cantripCount > 1 ? "s" : ""}. Select from the tab below.
            </p>
          </div>
        )}
        {spellsKnownChanged && !(cantripCount > 0 && count === 0) && (
          <div className="px-4 py-2 bg-blue-50 border-b border-[var(--color-border)]">
            <p className="text-[10px] text-blue-700">
              You learned {count} new spell{count > 1 ? "s" : ""}. Select from the tabs below.
            </p>
          </div>
        )}
        {!spellsKnownChanged && existingSpells && existingSpells.length > 0 && !(cantripCount > 0 && count === 0) && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-[var(--color-border)]">
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
        <div className="flex-shrink-0 flex border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide">
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
              Level {lvl} ({currentSpells.length}/{onChange ? maxSpellsKnown : count})
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {activeTab === "cantrips" ? (
            <div className="space-y-1.5">
              {cantrips.map((sp) => {
                const isAlreadyKnown = alreadyKnownCantripNames.has(sp.name);
                const isDisabled = disabledSpellNames.has(sp.name);
                const isSel = selectedCantripNames.has(sp.name) || isDisabled;
                const maxCantrips = onChange ? maxCantripsKnown : cantripCount;
                const disabled = !isSel && !isAlreadyKnown && !isDisabled && currentCantrips.length >= maxCantrips;
                const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                return (
                  <div key={sp.name} className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => !isAlreadyKnown && !isDisabled && toggle(sp.name, 0)}
                      disabled={disabled || isAlreadyKnown || isDisabled}
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
                          <span className={`text-xs font-bold ${isAlreadyKnown || isDisabled ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                          {sp.source && sp.source !== "PHB" && <SourceBadge source={sp.source} size="sm" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                        {isDisabled && <span className="text-[10px] text-[var(--color-accent)] font-medium">From higher level</span>}
                        {isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Already known</span>}
                        {isSel && !isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-surface)] font-medium">Selected</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                        {isAlreadyKnown && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Already known</span>}
                        {isSel && !isAlreadyKnown && <span className="text-[10px] text-[var(--color-surface)] font-medium">Selected</span>}
                      </div>
                    </button>
                    {desc && <InfoButton title={sp.name} description={desc} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {levelSpells[activeTab as number]?.map((sp) => {
                const isDisabled = disabledSpellNames.has(sp.name);
                const isSel = selectedSpellNames.has(sp.name) || isDisabled;
                const isAlreadyKnown = alreadyKnownSpellNames.has(sp.name);
                const maxSpells = onChange ? maxSpellsKnown : count;
                const disabled = !isSel && !isAlreadyKnown && !isDisabled && currentSpells.length >= maxSpells;
                const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
                return (
                  <div key={sp.name} className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => !isAlreadyKnown && !isDisabled && toggle(sp.name, sp.level)}
                      disabled={disabled || isAlreadyKnown || isDisabled}
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
                          <span className={`text-xs font-bold ${isAlreadyKnown || isDisabled ? "text-[var(--color-text-secondary)]" : ""}`}>{sp.name}</span>
                          {sp.source && sp.source !== "PHB" && <SourceBadge source={sp.source} size="sm" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{sp.castingTime}</span>
                        {isDisabled && <span className="text-[10px] text-[var(--color-accent)] font-medium ml-1">From higher level</span>}
                        {isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-text-secondary)] font-medium ml-1">Already known</span>}
                        {isSel && !isAlreadyKnown && !isDisabled && <span className="text-[10px] text-[var(--color-surface)] font-medium ml-1">Selected</span>}
                      </div>
                    </button>
                    {desc && <InfoButton title={sp.name} description={desc} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold rounded-full bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90 transition-all"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
