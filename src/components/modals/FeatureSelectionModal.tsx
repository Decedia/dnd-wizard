"use client";

import { useState } from "react";
import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { CheckIcon as Check, XIcon as X, SwordIcon as Sword, ShieldIcon as Shield, ShieldCheckIcon as ShieldCheck, DaggerIcon as Dagger, BattleAxeIcon as BattleAxe, BowArrowIcon as BowArrow, CrownIcon as Crown, SkullIcon as Skull, FlameIcon as Flame, LightningBoltIcon as LightningBolt, SparklesIcon as Sparkles, InfoIcon } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
import { InfoButton } from "@/components/InfoButton";

interface FeatureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  options: { name: string; description: string; icon?: string }[];
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
          const icon = opt.icon || getOptionIcon(opt.name);
          return (
            <div
              key={idx}
              className={`rounded-[var(--radius-sm)] border-2 transition-all ${
                isSelected
                  ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
              }`}
            >
              <button
                type="button"
                onClick={() => handleOptionClick(opt.name)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 p-3 text-left ${
                  isSelected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"
                }`}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  {icon ? (
                    <span className="text-[22px] leading-none">{icon}</span>
                  ) : (
                    <InfoIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                    {opt.name}
                  </div>
                  {opt.description && (
                    <div className="text-[12px] text-[var(--color-text-secondary)] truncate">
                      {opt.description}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {isSelected ? (
                    <Check className="h-4 w-4 text-[var(--color-text-primary)]" />
                  ) : (
                    <InfoButton title={opt.name} description={opt.description} />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </BasePopup>
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
