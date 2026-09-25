"use client";

import { useState } from "react";
import { getWizardSpellsByLevel } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";

interface SignatureSpellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
  onConfirm: (value: string) => void;
  characterSources?: string[];
}

export function SignatureSpellsModal({
  isOpen,
  onClose,
  selections,
  onSelectionsChange,
  onConfirm,
  characterSources = [],
}: SignatureSpellsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const spells = getWizardSpellsByLevel(3, characterSources);
  const filteredSpells = spells.filter((name) => {
    if (!searchQuery.trim()) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggle = (name: string) => {
    if (selections.includes(name)) {
      onSelectionsChange(selections.filter((s) => s !== name));
    } else if (selections.length < 2) {
      onSelectionsChange([...selections, name]);
    }
  };

  const handleConfirm = () => {
    if (selections.length === 2) {
      onConfirm(selections.join(", "));
      onSelectionsChange([]);
      onClose();
    }
  };

  const handleCancel = () => {
    onSelectionsChange([]);
    onClose();
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={selections.length !== 2}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          selections.length === 2
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm Selection ({selections.length}/2)
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={handleCancel} title="Signature Spells" footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Choose two 3rd-level spells. They&apos;re always prepared and you can cast each once per short rest without a spell slot.
        </p>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredSpells.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No spells match your search.</p>
        )}
        {filteredSpells.map((name) => {
          const isSelected = selections.includes(name);
          const isDisabled = !isSelected && selections.length >= 2;
          return (
            <SplitSelectionCard
              key={name}
              title={name}
              isSelected={isSelected}
              onSelect={() => handleToggle(name)}
              infoType="expand"
              isExpanded={isSelected}
              expandedContent={
                isSelected ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                    Selected
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}
