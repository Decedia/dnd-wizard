"use client";

import { useState } from "react";
import { getStaticSpells } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { getSpellSchoolStyle } from "@/lib/spell-schools";
import { useLanguage } from "@/contexts/LanguageContext";

interface BonusCantripModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCantrip: string;
  onCantripChange: (cantrip: string) => void;
}

export function BonusCantripModal({
  isOpen,
  onClose,
  selectedCantrip,
  onCantripChange,
}: BonusCantripModalProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const cantrips = getStaticSpells(undefined, undefined, language).filter((s) => s.level === 0 && s.classes?.includes("Druid"));
  const filteredCantrips = cantrips.filter((sp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const rawDesc = sp.description;
    const desc = Array.isArray(rawDesc) ? rawDesc.join(" ") : (rawDesc || "");
    return sp.name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  const handleSelect = (cantrip: string) => {
    onCantripChange(cantrip);
    onClose();
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-full font-bold text-sm transition-colors bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
      >
        Close
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Choose Bonus Cantrip" footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Choose one additional druid cantrip. This cantrip does not count against your cantrip limit.
        </p>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cantrips..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredCantrips.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No cantrips match your search.</p>
        )}
        {filteredCantrips.map((sp) => {
          const isSelected = selectedCantrip === sp.name;
          const rawDesc = sp.description;
          const desc = Array.isArray(rawDesc) ? rawDesc.join(" ") : (rawDesc || "");
          const schoolLabel = sp.school
            ? (() => {
                const schoolStyle = getSpellSchoolStyle(sp.school);
                return schoolStyle ? `[${schoolStyle.label}]` : `[${sp.school}]`;
              })()
            : "";
          const subtitleText = schoolLabel ? `${schoolLabel} ${desc}` : desc;
          return (
            <SplitSelectionCard
              key={sp.name}
              title={sp.name}
              subtitle={subtitleText}
              isSelected={isSelected}
              onSelect={() => handleSelect(sp.name)}
              infoType="modal"
              modalContent={<p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{desc}</p>}
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}
