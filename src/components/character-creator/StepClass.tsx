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
            className={`btn w-full p-4 text-left ${
              isSelected
                ? "btn-primary"
                : "btn-secondary"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-inherit">{cls.name}</span>
                {hasSubclasses && (
                  <span className="badge text-ink bg-paper-muted">
                    Subclass at Lv {subclassLevel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-inherit opacity-80">{cls.flavorText}</p>
              {hasSubclasses && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cls.subclasses!.map((sub) => (
                    <span
                      key={sub.name}
                       className="text-[10px] font-bold text-paper-muted bg-ink border-[3px] border-paper px-1.5 py-0.5 rounded-md"
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
