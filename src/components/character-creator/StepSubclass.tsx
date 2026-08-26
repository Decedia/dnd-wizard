"use client";

import { CheckCircle } from "phosphor-react";
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
        <p className="text-description">Select a class first.</p>
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
              className={`btn w-full p-4 text-left rounded-xl ${
                isSelected
                  ? "bg-white text-ink border-2 border-ink"
                  : "bg-white text-ink border border-border-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-card-title">{sub.name}</span>
                {isSelected && (
                  <CheckCircle weight="fill" color="var(--color-text-primary)" className="h-4 w-4" />
                )}
              </div>
              {sub.description && (
                <p className="mt-1 text-description whitespace-pre-line">
                  {sub.description}
                </p>
              )}
                   {earnedFeatures.length > 0 && (
                     <div className="mt-3 space-y-2 divider pt-3">
                       <div className="text-card-title">
                         Features
                       </div>
                       {earnedFeatures.map((f) => (
                         <div key={f.name} className="card px-3 py-2">
                       <div className="text-body">
                         {f.name}
                         {f.level ? <span className="ml-1 text-muted font-medium">Lv {f.level}</span> : null}
                       </div>
                       <p className="mt-1 text-description leading-relaxed whitespace-pre-line">
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
