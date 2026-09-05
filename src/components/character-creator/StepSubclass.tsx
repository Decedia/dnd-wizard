"use client";

import { CheckCircleIcon as CheckCircle, CrownIcon as Crown } from "@/components/icons";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSubclasses, type SRDClass, type SRDSubclass } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import type { Character } from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";
import { useMemo } from "react";

interface StepSubclassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSubclass({ data, onChange }: StepSubclassProps) {
  const classData: SRDClass | undefined = data.class ? getStaticClass(data.class, data.ruleset) : undefined;
  const subclasses: SRDSubclass[] = data.class ? getStaticSubclasses(data.class, data.sources, data.ruleset) : [];
  const unlockLevel = classData?.subclassLevel ?? 3;

  // Sort subclasses by source (PHB first), then alphabetically
  const sortedSubclasses = useMemo(() => {
    return [...subclasses].sort((a, b) => {
      const sourceA = a.source || "PHB";
      const sourceB = b.source || "PHB";
      if (sourceA !== sourceB) {
        if (sourceA === "PHB") return -1;
        if (sourceB === "PHB") return 1;
        return sourceA.localeCompare(sourceB);
      }
      return a.name.localeCompare(b.name);
    });
  }, [subclasses]);

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
        {sortedSubclasses.map((sub) => {
          const isSelected = data.subclass === sub.name;
          const earnedFeatures = sub.features.filter(
            (f) => f.level == null || (f.level >= unlockLevel && f.level <= data.level)
          );
          const hasDetails = sub.description || earnedFeatures.length > 0;
          return (
            <div key={sub.name} className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleSelect(sub.name)}
                className={`flex-1 p-4 text-left rounded-[var(--radius-md)] transition-all ${
                  isSelected
                    ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[var(--color-text-muted)]" />
                <SourceBadge source={sub.source || "PHB"} size="sm" />
                <span className="text-card-title">{sub.name}</span>
              </div>
                  {isSelected && (
                    <CheckCircle color="var(--color-text-primary)" className="h-4 w-4" />
                  )}
                </div>
                {earnedFeatures.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {earnedFeatures.map((f) => (
                      <span
                        key={f.name}
                        className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full"
                      >
                        {f.name} {f.level ? `Lv ${f.level}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </StepCard>
  );
}
