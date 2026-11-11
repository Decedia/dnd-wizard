"use client";

import { CrownIcon as Crown } from "@/components/icons";
import { useLevelCard } from "./level-card-state";

/** The subclass pick. */
export function StepSubclass() {
  const { info, subclassSelection, show, t, setShowSubclassModal } = useLevelCard();
  return (
    <>
      {show("subclass") && info.subclassOptions && (
        <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
          <Crown className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
             <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("creator.chooseSubclass", "Choose Subclass")}</div>
            <button
              type="button"
              onClick={() => setShowSubclassModal(true)}
              className="mt-1 w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
            >
               {subclassSelection ? `${t("creator.selectedSubclass", "Selected subclass")}: ${subclassSelection}` : t("creator.selectSubclass", "Select Subclass")}
            </button>
          </div>
        </div>
      )}

    </>
  );
}
