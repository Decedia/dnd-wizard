"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClasses, getStaticSubclasses, type SRDClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepClassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepClass({ data, onChange }: StepClassProps) {
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset);

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
            className={`w-full p-4 text-left rounded-[var(--radius-md)] transition-all ${
              isSelected
                ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="text-card-title">{cls.name}</span>
                <div className="flex items-center gap-2">
                  {hasSubclasses && (() => {
                    const filteredCount = getStaticSubclasses(cls.name, data.sources).length;
                    return (
                      <span className="badge text-[var(--color-text-primary)] bg-[var(--color-bg)]">
                        {filteredCount} subclasses at Lv {subclassLevel}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </StepCard>
  );
}
