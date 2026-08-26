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
            className={`btn w-full p-4 text-left rounded-full ${
              isSelected
                ? "bg-paper-muted border-l-2 border-ink"
                : "bg-white border border-border-muted"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-ink">{cls.name}</span>
                {hasSubclasses && (
                  <span className="badge text-ink bg-paper">
                    Subclass at Lv {subclassLevel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">{cls.flavorText}</p>
              {hasSubclasses && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cls.subclasses!.map((sub) => (
                    <span
                      key={sub.name}
                       className="text-[10px] font-bold text-paper-muted bg-ink px-1.5 py-0.5 rounded-full"
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
