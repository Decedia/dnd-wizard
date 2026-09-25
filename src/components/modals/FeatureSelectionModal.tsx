"use client";

import { useState } from "react";
import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { CheckIcon as Check, XIcon as X, SwordIcon as Sword, ShieldIcon as Shield, ShieldCheckIcon as ShieldCheck, DaggerIcon as Dagger, BattleAxeIcon as BattleAxe, BowArrowIcon as BowArrow, CrownIcon as Crown, SkullIcon as Skull, FlameIcon as Flame, LightningBoltIcon as LightningBolt, SparklesIcon as Sparkles, InfoIcon } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
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
          const isMaxed = isMultiSelect && !isSelected && featureSelections.length >= count;
          const isUnavailable = !!opt.disabled;
          const isDisabled = isMaxed || isUnavailable;
          const icon = opt.icon || getOptionIcon(opt.name);
          return (
            <SplitSelectionCard
              key={idx}
              title={opt.name}
              subtitle={opt.description}
              icon={icon ? <span className="text-[22px] leading-none">{icon}</span> : <InfoIcon className="h-5 w-5 text-[var(--color-text-muted)]" />}
              badges={[]}
              isSelected={isSelected}
              onSelect={() => !isDisabled && handleOptionClick(opt.name)}
              onInfoToggle={() => {}}
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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
