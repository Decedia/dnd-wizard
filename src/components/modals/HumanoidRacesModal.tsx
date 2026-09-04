"use client";

import { CheckIcon as Check, XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";

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
  const handleConfirm = () => {
    if (selections.length === 2) {
      const value = `Humanoid: ${selections.join(", ")}`;
      onConfirm(value);
      onSelectionsChange([]);
      onClose();
    }
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={() => { onSelectionsChange([]); onClose(); }}
      title="Choose 2 Humanoid Races"
      confirmLabel={`Confirm Selection (${selections.length}/2)`}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      confirmDisabled={selections.length !== 2}
      showFooter={true}
    >
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
        Select two humanoid races as your favored enemies.
      </p>
      <div className="space-y-2">
        {races.map((race, idx) => {
          const isSelected = selections.includes(race);
          const isDisabled = !isSelected && selections.length >= 2;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSelectionsChange(selections.filter((r) => r !== race));
                } else if (selections.length < 2) {
                  onSelectionsChange([...selections, race]);
                }
              }}
              disabled={isDisabled}
              className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                isSelected
                  ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
              }`}
            >
              <div className="text-xs font-semibold flex items-center gap-2">
                {isSelected && <Check className="h-3 w-3" />}
                {race}
              </div>
            </button>
          );
        })}
      </div>
    </BasePopup>
  );
}
