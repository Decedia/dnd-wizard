"use client";

import { useState } from "react";
import { FeatureSelectionModal } from "@/components/modals/FeatureSelectionModal";

export interface FeatureOption {
  name: string;
  description: string;
  icon?: string;
  disabled?: boolean;
  unavailableReason?: string;
}

export interface FeatureChipSelectorProps {
  name: string;
  description?: string;
  options: FeatureOption[];
  selectedValues: string[];
  maxCount: number;
  onChange: (values: string[]) => void;
  isSubclass?: boolean;
  characterSources?: string[];
}

export function FeatureChipSelector({
  name,
  description,
  options,
  selectedValues,
  maxCount,
  onChange,
  isSubclass = false,
  characterSources = [],
}: FeatureChipSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemove = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  const handleModalSelect = (value: string) => {
    const newValues = value
      .split(", ")
      .filter((v) => v && !selectedValues.includes(v))
      .slice(0, maxCount - selectedValues.length);
    onChange([...selectedValues, ...newValues]);
  };

  const availableOptions = options.filter((opt) => !selectedValues.includes(opt.name));

  return (
    <div className="space-y-2">
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-indigo-100 border border-indigo-300 rounded-full text-indigo-800"
            >
              {value}
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="hover:text-red-600 font-bold"
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={selectedValues.length >= maxCount && availableOptions.length === 0}
        className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between disabled:opacity-50"
      >
        <span>
          {selectedValues.length >= maxCount
            ? `${maxCount} selected`
            : availableOptions.length === 0
              ? "No more options available"
              : `Select ${name} (${selectedValues.length}/${maxCount})...`}
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {selectedValues.length}/{maxCount}
        </span>
      </button>

      <FeatureSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        name={name}
        description={description}
        options={options}
        count={maxCount}
        isSubclass={isSubclass}
        onSelect={handleModalSelect}
        characterSources={characterSources}
        selectedValues={selectedValues}
      />
    </div>
  );
}
