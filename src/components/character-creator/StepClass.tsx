"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClasses, type SRDClassSelection } from "@/lib/srd-client";

interface StepClassProps {
  data: { class: string };
  onChange: (data: Partial<StepClassProps["data"]>) => void;
}

export function StepClass({ data, onChange }: StepClassProps) {
  const classes: SRDClassSelection[] = getStaticClasses();

  const handleSelect = useCallback((className: string) => {
    onChange({ class: className });
  }, [onChange]);

  return (
    <StepCard title="Class">
      <div className="space-y-3">
        {classes.map((cls) => {
          const isSelected = data.class === cls.name;
          return (
            <button
              key={cls.name}
              type="button"
              onClick={() => handleSelect(cls.name)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-gold bg-gold/10"
                  : "border-parchment/10 bg-charcoal/40 hover:border-gold/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-parchment">{cls.name}</span>
              </div>
              <p className="mt-1 text-xs text-parchment/50">{cls.description}</p>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
