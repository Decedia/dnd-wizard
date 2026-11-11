"use client";

import { ChartBarIcon as ChartBar, CaretDownIcon as CaretDown } from "@/components/icons";
import { useLevelCard } from "./level-card-state";

/** The ability score increase or feat button. */
export function StepAsi() {
  const { info, asiSelection, show, t, openAsiModal } = useLevelCard();
  return (
    <>
      {show("asi") && info.asi && (
        <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
          <ChartBar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("creator.abilityScoreImprovement", "Ability Score Improvement")}</div>
            <button
              type="button"
              onClick={openAsiModal}
              className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
            >
              <span>
                {asiSelection?.mode === "feat" && asiSelection.feat
                  ? t("levelUp.asiFeatPrefix", "Feat: {feat}", { feat: asiSelection.feat })
                  : asiSelection?.mode === "single" && asiSelection.single
                    ? `+2 ${asiSelection.single.toUpperCase()}`
                    : asiSelection?.mode === "double" && asiSelection.d1 && asiSelection.d2
                      ? `+1 ${asiSelection.d1.toUpperCase()}, +1 ${asiSelection.d2.toUpperCase()}`
                      : t("levelUp.selectAbilityScores", "Select ability scores...")}
              </span>
              <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>
      )}

    </>
  );
}
