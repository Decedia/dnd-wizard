"use client";

import { useState } from "react";
import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { CheckIcon as Check, XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";

interface FeatureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  options: { name: string; description: string }[];
  count?: number;
  isSubclass: boolean;
  onSelect: (value: string) => void;
  onSpecialOption?: (optName: string) => void;
  characterSources?: string[];
}

export function FeatureSelectionModal({
  isOpen,
  onClose,
  name,
  description,
  options,
  count = 1,
  isSubclass,
  onSelect,
  onSpecialOption,
  characterSources = [],
}: FeatureSelectionModalProps) {
  const [featureSelections, setFeatureSelections] = useState<string[]>([]);
  const isMultiSelect = count > 1;

  const handleOptionClick = (optName: string) => {
    if (optName === "Humanoid (2 races)") {
      onSpecialOption?.(optName);
      onClose();
      return;
    }
    if (isMultiSelect) {
      if (featureSelections.includes(optName)) {
        setFeatureSelections(featureSelections.filter((s) => s !== optName));
      } else if (featureSelections.length < count) {
        setFeatureSelections([...featureSelections, optName]);
      }
      return;
    }
    onSelect(optName);
    onClose();
  };

  const handleConfirm = () => {
    if (isMultiSelect && featureSelections.length === count) {
      onSelect(featureSelections.join(", "));
      setFeatureSelections([]);
      onClose();
    }
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={() => { setFeatureSelections([]); onClose(); }}
      title={name}
      description={description}
      confirmLabel={isMultiSelect ? `Confirm Selection (${featureSelections.length}/${count})` : undefined}
      cancelLabel="Cancel"
      onConfirm={isMultiSelect ? handleConfirm : undefined}
      confirmDisabled={isMultiSelect ? featureSelections.length !== count : false}
      showFooter={isMultiSelect}
    >
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isSelected = isMultiSelect ? featureSelections.includes(opt.name) : false;
          const isDisabled = isMultiSelect && !isSelected && featureSelections.length >= count;
          return (
            <div
              key={idx}
              className={`rounded-[var(--radius-sm)] border transition-all ${
                isSelected
                  ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <div className="w-full p-3">
                <button
                  type="button"
                  onClick={() => handleOptionClick(opt.name)}
                  disabled={isDisabled}
                  className={`w-full p-3 text-left ${
                    isSelected ? "text-[var(--color-surface)]" : "hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold flex items-center gap-2">
                      {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      {opt.name}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </BasePopup>
  );
}
