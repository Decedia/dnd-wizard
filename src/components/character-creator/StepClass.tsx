"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClasses, type SRDClass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { InfoButton } from "@/components/InfoButton";

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
            className={`w-full p-4 text-left rounded-[var(--radius-md)] transition-all ${
              isSelected
                ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
            }`}
          >
              <div className="flex items-center justify-between">
                <span className="text-card-title">{cls.name}</span>
                <div className="flex items-center gap-2">
                  {hasSubclasses && (
                    <span className="badge text-[var(--color-text-primary)] bg-[var(--color-bg)]">
                      Subclass at Lv {subclassLevel}
                    </span>
                  )}
                  {cls.flavorText && (
                    <InfoButton title={cls.name} description={cls.flavorText} />
                  )}
                </div>
              </div>
              {hasSubclasses && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cls.subclasses!.map((sub) => (
                    <span
                      key={sub.name}
                       className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-text-primary)] px-1.5 py-0.5 rounded-full"
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
