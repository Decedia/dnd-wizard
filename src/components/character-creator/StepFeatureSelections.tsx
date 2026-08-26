"use client";

import { useState, useMemo } from "react";
import { CheckCircle } from "phosphor-react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface FeatureSelection {
  featureName: string;
  description: string;
  type: "single" | "multiple" | "skills" | "spells" | "invocations";
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
          const isMultiple = selection.type === "multiple" || selection.type === "skills" || selection.type === "invocations";
          const maxCount = selection.count || (isMultiple ? 2 : 1);

          return (
            <div key={key} className="space-y-3">
              <div>
                <h3 className="text-card-title text-paper">{selection.featureName}</h3>
                <p className="text-description mt-1">{selection.description}</p>
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

                    return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(selection.storageKey, option, maxCount)}
                      disabled={isDisabled}
                      className={`btn w-full px-3 py-2 text-left ${
                        isSelected
                          ? "bg-white text-ink border-2 border-ink"
                          : isDisabled
                            ? "bg-white text-ink border border-border-muted opacity-50 cursor-not-allowed"
                            : "bg-white text-ink border border-border-muted"
                      }`}
                    >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-body">{option}</span>
                            {selection.optionDescriptions?.[option] && (
                              <span className="block text-muted mt-0.5 leading-relaxed">
                                {selection.optionDescriptions[option]}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle weight="fill" color="var(--color-text-primary)" className="h-4 w-4" />
                          )}
                        </div>
                      </button>
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
                ? "bg-white text-ink border-2 border-ink"
                : isDisabled
                  ? "bg-white text-ink border border-border-muted opacity-50 cursor-not-allowed"
                  : "bg-white text-ink border border-border-muted"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-body">{spellName}</span>
                {spell && (
                  <span className="text-description ml-2">Level {spell.level}</span>
                )}
              </div>
              {isSelected && (
                <CheckCircle weight="fill" color="var(--color-text-primary)" className="h-4 w-4" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
