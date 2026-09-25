"use client";

import { useState } from "react";
import { CheckIcon as Check } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";

interface HumanoidRacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  races: string[];
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
  onConfirm: (value: string) => void;
  featureName: string;
}

export function HumanoidRacesModal({
  isOpen,
  onClose,
  races,
  selections,
  onSelectionsChange,
  onConfirm,
  featureName,
}: HumanoidRacesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRaces = races.filter((race) => {
    if (!searchQuery.trim()) return true;
    return race.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggle = (race: string) => {
    if (selections.includes(race)) {
      onSelectionsChange(selections.filter((r) => r !== race));
    } else if (selections.length < 2) {
      onSelectionsChange([...selections, race]);
    }
  };

  const handleConfirm = () => {
    if (selections.length === 2) {
      const value = `Humanoid: ${selections.join(", ")}`;
      onConfirm(value);
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
    <BottomSheet isOpen={isOpen} onClose={handleCancel} title="Choose 2 Humanoid Races" footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">
          Select two humanoid races as your favored enemies.
        </p>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search races..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredRaces.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No races match your search.</p>
        )}
        {filteredRaces.map((race, idx) => {
          const isSelected = selections.includes(race);
          const isDisabled = !isSelected && selections.length >= 2;
          return (
            <SplitSelectionCard
              key={idx}
              title={race}
              isSelected={isSelected}
              onSelect={() => handleToggle(race)}
              infoType="expand"
              isExpanded={isSelected}
              expandedContent={
                isSelected ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                    <Check className="h-4 w-4" />
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
