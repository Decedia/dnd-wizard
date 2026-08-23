"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClasses, type SRDClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepClassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepClass({ data, onChange }: StepClassProps) {
  const classes: SRDClass[] = getStaticClasses();

  const handleSelect = useCallback(
    (className: string) => {
      onChange({ class: className, subclass: undefined });
    },
    [onChange]
  );

  return (
    <StepCard title="Class" hint="Choose your character's class. This determines your core abilities, hit points, and when you'll pick a subclass.">
      <div className="space-y-3">
        {classes.map((cls) => {
          const isSelected = data.class === cls.name;
          const hasSubclasses = cls.subclasses && cls.subclasses.length > 0;
          const subclassLevel = cls.subclassLevel;

          return (
            <button
              key={cls.name}
              type="button"
              onClick={() => handleSelect(cls.name)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-charcoal/40 hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-parchment">{cls.name}</span>
                {hasSubclasses && (
                  <span className="text-[10px] font-medium text-accent/70 bg-accent/10 px-2 py-0.5 rounded-full">
                    Subclass at Lv {subclassLevel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-parchment/50">{cls.flavorText}</p>
              {hasSubclasses && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cls.subclasses!.map((sub) => (
                    <span
                      key={sub.name}
                      className="text-[10px] font-medium text-parchment/60 bg-charcoal/60 border border-border rounded px-1.5 py-0.5"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
