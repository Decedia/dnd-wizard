"use client";

import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSubclasses, type SRDClass, type SRDSubclass } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";

interface StepSubclassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSubclass({ data, onChange }: StepSubclassProps) {
  const classData: SRDClass | undefined = data.class ? getStaticClass(data.class) : undefined;
  const subclasses: SRDSubclass[] = data.class ? getStaticSubclasses(data.class) : [];
  const unlockLevel = classData?.subclassLevel ?? 3;

  const handleSelect = (subclassName: string) => {
    if (subclassName === data.subclass) {
      onChange({ subclass: "" });
    } else {
      onChange({ subclass: subclassName });
    }
  };

  if (!classData) {
    return (
      <StepCard title="Subclass">
        <p className="text-sm text-paper-muted font-medium">Select a class first.</p>
      </StepCard>
    );
  }

  return (
    <StepCard
      title="Subclass"
      hint={`Choose your ${classData.name} subclass. You unlock subclass features starting at level ${unlockLevel}.`}
    >
      <div className="space-y-3">
        {subclasses.map((sub) => {
          const isSelected = data.subclass === sub.name;
          const earnedFeatures = sub.features.filter(
            (f) => f.level == null || (f.level >= unlockLevel && f.level <= data.level)
          );
          return (
            <button
              key={sub.name}
              type="button"
              onClick={() => handleSelect(sub.name)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-paper bg-paper text-ink"
                  : "border-paper bg-ink text-paper hover:bg-paper-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-inherit">{sub.name}</span>
                {isSelected && (
                  <svg className="h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
              {sub.description && (
                <p className="mt-1 text-xs text-inherit opacity-80 whitespace-pre-line leading-relaxed">
                  {sub.description}
                </p>
              )}
              {earnedFeatures.length > 0 && (
                <div className="mt-3 space-y-2 divider pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-paper-muted font-bold">
                    Features
                  </div>
                  {earnedFeatures.map((f) => (
                    <div key={f.name} className="rounded-lg border-2 border-paper bg-ink px-3 py-2">
                      <div className="text-xs font-bold text-paper">
                        {f.name}
                        {f.level ? <span className="ml-1 text-paper-muted font-medium">Lv {f.level}</span> : null}
                      </div>
                      <p className="mt-1 text-[11px] text-paper-muted leading-relaxed whitespace-pre-line">
                        {normalizeDescription(f.description)}
                      </p>
                    </div>
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
