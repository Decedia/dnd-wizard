"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface FeatureSelection {
  featureName: string;
  description: string;
  type: "single" | "multiple" | "skills" | "spells" | "invocations";
  options: string[];
  count?: number;
  level: number;
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
      const key = `feature-${sel.featureName}`;
      const existing = (data as any).featureSelections?.[key];
      if (existing) {
        initial[key] = Array.isArray(existing) ? existing : [existing];
      }
    });
    return initial;
  });

  const handleSelect = (featureName: string, value: string, count: number = 1) => {
    const key = `feature-${featureName}`;
    setSelectedValues((prev) => {
      const current = prev[key] || [];
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
      
      const newSelections = { ...prev, [key]: next };
      
      // Save to character
      const featureSelections = { ...(data as any).featureSelections, [key]: next };
      onChange({ featureSelections } as any);
      
      return newSelections;
    });
  };

  const getSelectionKey = (featureName: string) => `feature-${featureName}`;

  if (selections.length === 0) {
    return (
      <StepCard title="Feature Selections">
        <p className="text-sm text-parchment/60">No feature selections required at this time.</p>
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
          const key = getSelectionKey(selection.featureName);
          const selected = selectedValues[key] || [];
          const isMultiple = selection.type === "multiple" || selection.type === "skills" || selection.type === "invocations";
          const maxCount = selection.count || (isMultiple ? 2 : 1);

          return (
            <div key={key} className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-parchment/80">{selection.featureName}</h3>
                <p className="text-xs text-parchment/50 mt-1">{selection.description}</p>
              </div>
              
              {selection.type === "spells" ? (
                <SpellSelector
                  options={selection.options}
                  selected={selected}
                  maxCount={maxCount}
                  onSelect={(value) => handleSelect(selection.featureName, value, maxCount)}
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
                        onClick={() => handleSelect(selection.featureName, option, maxCount)}
                        disabled={isDisabled}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? "border-accent/40 bg-accent/10"
                            : isDisabled
                              ? "border-border bg-charcoal/40 opacity-50 cursor-not-allowed"
                              : "border-border bg-charcoal/40 hover:border-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-parchment">{option}</span>
                          {isSelected && (
                            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {isMultiple && (
                <p className="text-xs text-parchment/50">
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
            className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
              isSelected
                ? "border-accent/40 bg-accent/10"
                : isDisabled
                  ? "border-border bg-charcoal/40 opacity-50 cursor-not-allowed"
                  : "border-border bg-charcoal/40 hover:border-accent/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-parchment">{spellName}</span>
                {spell && (
                  <span className="text-xs text-text-muted ml-2">Level {spell.level}</span>
                )}
              </div>
              {isSelected && (
                <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
