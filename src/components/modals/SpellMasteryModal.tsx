"use client";

import { useState } from "react";
import { getWizardSpellsByLevel } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";

interface SpellMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
  onConfirm: (value: string) => void;
  characterSources?: string[];
}

export function SpellMasteryModal({
  isOpen,
  onClose,
  selections,
  onSelectionsChange,
  onConfirm,
  characterSources = [],
}: SpellMasteryModalProps) {
  const handleConfirm = () => {
    if (selections.length === 2) {
      onConfirm(selections.join(", "));
      onSelectionsChange([]);
      onClose();
    }
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={() => { onSelectionsChange([]); onClose(); }}
      title="Spell Mastery"
      description="Select one 1st-level and one 2nd-level spell to cast at will without spell slots."
      confirmLabel={`Confirm Selection (${selections.length}/2)`}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      confirmDisabled={selections.length !== 2}
      showFooter={true}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">Select one 1st-level spell:</p>
          <div className="space-y-1">
            {getWizardSpellsByLevel(1, characterSources).map((name) => {
              const isSelected = selections.includes(name);
              const allLevel1 = getWizardSpellsByLevel(1, characterSources);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onSelectionsChange(selections.filter((s) => s !== name));
                    } else {
                      onSelectionsChange([...selections.filter((s) => !allLevel1.includes(s)), name]);
                    }
                  }}
                  className={`w-full p-2 text-left rounded border transition-all ${
                    isSelected
                      ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <span className="text-xs font-semibold">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">Select one 2nd-level spell:</p>
          <div className="space-y-1">
            {getWizardSpellsByLevel(2, characterSources).map((name) => {
              const isSelected = selections.includes(name);
              const allLevel2 = getWizardSpellsByLevel(2, characterSources);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onSelectionsChange(selections.filter((s) => s !== name));
                    } else {
                      onSelectionsChange([...selections.filter((s) => !allLevel2.includes(s)), name]);
                    }
                  }}
                  className={`w-full p-2 text-left rounded border transition-all ${
                    isSelected
                      ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <span className="text-xs font-semibold">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BasePopup>
  );
}
