"use client";

import { useState, useMemo } from "react";
import { CheckCircleIcon as CheckCircle, SwordIcon as Sword, ShieldIcon as Shield, ShieldCheckIcon as ShieldCheck, DaggerIcon as Dagger, BattleAxeIcon as BattleAxe, BowArrowIcon as BowArrow, CrownIcon as Crown, SkullIcon as Skull, FlameIcon as Flame, LightningBoltIcon as LightningBolt, SparklesIcon as Sparkles } from "@/components/icons";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import { SourceBadge } from "../SourceBadge";
import type { Character } from "@/lib/storage";
import { InfoButton } from "@/components/InfoButton";

interface FeatureSelection {
  featureName: string;
  description: string;
  type: "single" | "multiple" | "skills" | "spells" | "invocations" | "maneuvers";
  options: string[];
  optionDescriptions?: Record<string, string>;
  count?: number;
  level: number;
  storageKey: string;
  optional?: boolean;
  source?: "class" | "subclass";
}

interface StepFeatureSelectionsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
  selections: FeatureSelection[];
}

export function StepFeatureSelections({ data, onChange, selections }: StepFeatureSelectionsProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    selections.forEach((sel) => {
      const key = sel.storageKey;
      const existing = (data as any).featureSelections?.[key];
      if (existing) {
        initial[key] = Array.isArray(existing) ? existing : [existing];
      }
    });
    return initial;
  });

  const getOptionIcon = (optName: string) => {
    const lower = optName.toLowerCase();
    if (lower.includes("archery")) return BowArrow;
    if (lower.includes("defense")) return Shield;
    if (lower.includes("dueling")) return Sword;
    if (lower.includes("great weapon")) return BattleAxe;
    if (lower.includes("protection")) return ShieldCheck;
    if (lower.includes("two-weapon")) return Dagger;
    if (lower.includes("subclass")) return Crown;
    if (lower.includes("necromancy") || lower.includes("undead") || lower.includes("death")) return Skull;
    if (lower.includes("fire") || lower.includes("evocation")) return Flame;
    if (lower.includes("lightning") || lower.includes("thunder")) return LightningBolt;
    if (lower.includes("magic") || lower.includes("enchantment") || lower.includes("illusion")) return Sparkles;
    return null;
  };

  const handleSelect = (storageKey: string, value: string, count: number = 1) => {
    setSelectedValues((prev) => {
      const current = prev[storageKey] || [];
      let next: string[];

      if (current.includes(value)) {
        next = current.filter((v) => v !== value);
      } else {
        if (current.length >= count) {
          next = current;
        } else {
          next = [...current, value];
        }
      }

      const newSelections = { ...prev, [storageKey]: next };

      const featureSelections = { ...(data as any).featureSelections, [storageKey]: next };
      onChange({ featureSelections } as any);

      return newSelections;
    });
  };

  const getSelectionKey = (selection: FeatureSelection) => selection.storageKey;

  if (selections.length === 0) {
    return (
      <StepCard title="Feature Selections">
        <p className="text-description">No feature selections required at this time.</p>
      </StepCard>
    );
  }

  const primarySelection = selections[0];

  return (
    <StepCard
      title={primarySelection.featureName}
      hint={`You must make a selection for ${primarySelection.featureName}. This is a class feature that requires you to choose from the available options.`}
    >
      <div className="space-y-6">
        {selections.map((selection) => {
          const key = getSelectionKey(selection);
          const selected = selectedValues[key] || [];
          const isMultiple = selection.type === "multiple" || selection.type === "skills" || selection.type === "invocations" || selection.type === "maneuvers";
          const maxCount = selection.count || (isMultiple ? 2 : 1);

          return (
            <div key={key} className="space-y-3">
               <div>
                 <h3 className="text-card-title text-[var(--color-text-primary)] flex items-center gap-2">
                   {selection.featureName}
                   {selection.description && (
                     <InfoButton title={selection.featureName} description={selection.description} />
                   )}
                 </h3>
               </div>

              {selection.type === "spells" ? (
                <SpellSelector
                  options={selection.options}
                  selected={selected}
                  maxCount={maxCount}
                  onSelect={(value) => handleSelect(selection.storageKey, value, maxCount)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {selection.options.map((option) => {
                    const isSelected = selected.includes(option);
                    const isDisabled = !isSelected && selected.length >= maxCount;
                    const optionDesc = selection.optionDescriptions?.[option];

                    return (
                    <div key={option} className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelect(selection.storageKey, option, maxCount)}
                        disabled={isDisabled}
                        className={`flex-1 btn w-full px-3 py-2 text-left ${
                          isSelected
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const OptionIcon = getOptionIcon(option);
                              return OptionIcon ? <OptionIcon className="h-4 w-4 shrink-0" /> : null;
                            })()}
                            <span className="text-body">{option}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle color="var(--color-surface)" className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}

              {(selection.count && selection.count > 1) && (
                <p className="text-description">
                  {selected.length} of {maxCount} selected
                </p>
              )}
            </div>
          );
        })}
      </div>
    </StepCard>
  );
}

function SpellSelector({ options, selected, maxCount, onSelect }: { options: string[]; selected: string[]; maxCount: number; onSelect: (value: string) => void }) {
  const spells = getStaticSpells();

  return (
    <div className="space-y-2">
      {options.map((spellName) => {
        const spell = spells.find((s) => s.name === spellName);
        const isSelected = selected.includes(spellName);
        const isDisabled = !isSelected && selected.length >= maxCount;

        return (
          <button
            key={spellName}
            type="button"
            onClick={() => onSelect(spellName)}
            disabled={isDisabled}
            className={`btn w-full px-3 py-2 text-left ${
              isSelected
                ? "btn-primary"
                : "btn-secondary"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {spell?.source && spell.source !== "PHB" && <SourceBadge source={spell.source} />}
                <span className="text-body">{spellName}</span>
                {spell && (
                  <span className="text-description">Level {spell.level}</span>
                )}
              </div>
              {isSelected && (
                <CheckCircle color="var(--color-surface)" className="h-4 w-4" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
