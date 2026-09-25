"use client";

import { useState } from "react";
import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";

interface FeatureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  options: { name: string; description: string; icon?: string; disabled?: boolean; unavailableReason?: string }[];
  count?: number;
  isSubclass: boolean;
  onSelect: (value: string) => void;
  onSpecialOption?: (optName: string) => void;
  characterSources?: string[];
  selectedValues?: string[];
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
  selectedValues = [],
}: FeatureSelectionModalProps) {
  const [featureSelections, setFeatureSelections] = useState<string[]>(() => selectedValues);
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

  const handleCancel = () => {
    setFeatureSelections([]);
    onClose();
  };

  const stickyFooter = isMultiSelect ? (
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
        disabled={featureSelections.length !== count}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          featureSelections.length === count
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm Selection ({featureSelections.length}/{count})
      </button>
    </div>
  ) : undefined;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleCancel} title={name} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        {description && <p className="text-xs text-[var(--color-text-secondary)] mb-3">{description}</p>}
        {options.map((opt, idx) => {
          const isSelected = isMultiSelect ? featureSelections.includes(opt.name) : false;
          const isMaxed = isMultiSelect && !isSelected && featureSelections.length >= count;
          const isUnavailable = !!opt.disabled;
          const isDisabled = isMaxed || isUnavailable;
          const icon = opt.icon || getOptionIcon(opt.name);
          return (
            <SplitSelectionCard
              key={idx}
              title={opt.name}
              subtitle={opt.description}
              icon={icon ? <span className="text-[22px] leading-none">{icon}</span> : undefined}
              badges={[]}
              isSelected={isSelected}
              onSelect={() => !isDisabled && handleOptionClick(opt.name)}
              infoType="modal"
              modalContent={
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line mb-2">{opt.description}</p>
                  {isUnavailable && opt.unavailableReason && (
                    <p className="text-[11px] text-[var(--color-error-600)]">{opt.unavailableReason}</p>
                  )}
                </div>
              }
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}

function getOptionIcon(optName: string): string | null {
  const lower = optName.toLowerCase();
  if (lower.includes("archery")) return "🏹";
  if (lower.includes("defense")) return "🛡️";
  if (lower.includes("dueling")) return "⚔️";
  if (lower.includes("great weapon")) return "🪓";
  if (lower.includes("protection")) return "🔰";
  if (lower.includes("two-weapon")) return "🗡️";
  if (lower.includes("subclass")) return "👑";
  if (lower.includes("necromancy") || lower.includes("undead") || lower.includes("death")) return "💀";
  if (lower.includes("fire") || lower.includes("evocation")) return "🔥";
  if (lower.includes("lightning") || lower.includes("thunder")) return "⚡";
  if (lower.includes("magic") || lower.includes("enchantment") || lower.includes("illusion")) return "✨";
  return null;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
