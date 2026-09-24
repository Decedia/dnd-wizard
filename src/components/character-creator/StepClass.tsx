"use client";

import { useCallback, useState } from "react";
import { StepCard } from "./StepCard";
import { getStaticClasses, type SRDClass } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";

interface StepClassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepClass({ data, onChange }: StepClassProps) {
  const { t } = useLanguage();
  const [classModalOpen, setClassModalOpen] = useState(false);

  const handleClassSelect = useCallback(
    (payload: any) => {
      onChange({ class: payload.name, subclass: undefined });
      setClassModalOpen(false);
    },
    [onChange]
  );

  const translateClass = (name: string) => t(`class.${name}`, name);

  return (
    <>
      <StepCard title={t("form.class", "Class")} hint={t("creator.classHint", "Choose your character's class. This determines your core abilities, hit points, and when you'll pick a subclass.")}>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setClassModalOpen(true)}
            className={`w-full p-4 text-left rounded-[var(--radius-md)] transition-all ${
              data.class
                ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-card-title">
                {data.class ? translateClass(data.class) : t("creator.selectClass", "Select Class…")}
              </span>
            </div>
            {data.class && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t("creator.classSelected", "Class selected")}: {translateClass(data.class)}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {t("creator.tapToChange", "Tap to change")}
                </p>
              </div>
            )}
          </button>
        </div>
      </StepCard>

      {classModalOpen && (
        <ClassSelectionModal
          isOpen={true}
          onClose={() => setClassModalOpen(false)}
          onConfirm={handleClassSelect}
          characterSources={data.sources}
          currentCharacter={data}
        />
      )}
    </>
  );
}