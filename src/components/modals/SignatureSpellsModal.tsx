"use client";

import { getWizardSpellsByLevel } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";

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
      title="Signature Spells"
      description="Choose two 3rd-level spells. They're always prepared and you can cast each once per short rest without a spell slot."
      confirmLabel={`Confirm Selection (${selections.length}/2)`}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      confirmDisabled={selections.length !== 2}
      showFooter={true}
    >
      <div className="space-y-2">
        {getWizardSpellsByLevel(3, characterSources).map((name) => {
          const isSelected = selections.includes(name);
          const isDisabled = !isSelected && selections.length >= 2;
          return (
            <button
              key={name}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isSelected) {
                  onSelectionsChange(selections.filter((s) => s !== name));
                } else if (selections.length < 2) {
                  onSelectionsChange([...selections, name]);
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
    </BasePopup>
  );
}
