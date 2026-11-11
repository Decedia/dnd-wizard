"use client";

import { CheckIcon as Check } from "@/components/icons";
import { LevelCardContext, useLevelCardState, type LevelCardProps } from "./level-card-state";
import { StepMoment } from "./StepMoment";
import { StepFeatures } from "./StepFeatures";
import { StepAsi } from "./StepAsi";
import { StepSpellCounts } from "./StepSpellCounts";
import { StepSubclass } from "./StepSubclass";
import { StepSpells } from "./StepSpells";
import { LevelCardModals } from "./LevelCardModals";

/** One level of the level-up: shows the sections of one screen (`part`), each in its own step file. */
export function LevelCard(props: LevelCardProps) {
  const state = useLevelCardState(props);
  const { t, lvl, isComplete } = state;
  return (
    <LevelCardContext.Provider value={state}>
      <div className={`rounded-[var(--radius-md)] border transition-all ${
        isComplete
          ? "border-green-300 bg-green-50/30"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Level {lvl}
            </h3>
            {isComplete && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" /> {t("levelUp.complete", "Complete")}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            <StepMoment />
            <StepFeatures />
            <StepAsi />
            <StepSpellCounts />
            <StepSubclass />
            <StepSpells />
          </div>
        </div>
        <LevelCardModals />
      </div>
    </LevelCardContext.Provider>
  );
}
