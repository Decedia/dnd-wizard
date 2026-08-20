"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { classes } from "@/data/srd";
import type { Character } from "@/lib/storage";

interface StepClassProps {
  data: { class: string };
  onChange: (data: Partial<StepClassProps["data"]>) => void;
}

export function StepClass({ data, onChange }: StepClassProps) {
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
              className={`w-full rounded-full border p-4 text-left transition-all ${
                isSelected
                  ? "border-gold bg-gold/10"
                  : "border-parchment/10 bg-charcoal/40 hover:border-gold/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-parchment">{cls.name}</span>
                <span className="text-xs text-parchment/40">d{cls.hitDie} Hit Die</span>
              </div>
              <p className="mt-1 text-xs text-parchment/50">{cls.flavorText}</p>
              <div className="mt-2 space-y-1">
                {cls.features.map((feature) => (
                  <div key={feature.name} className="text-xs text-parchment/60">
                    <span className="font-medium text-gold/80">{feature.name}:</span> {feature.description}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
