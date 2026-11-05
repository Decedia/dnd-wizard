"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface WizardNavProps {
  onBack: () => void;
  onNext: () => void;
  /** Read by screen readers; the back button shows only an arrow. */
  backLabel?: string;
  nextLabel?: string;
  /** Shown on the grey Next button while the step is unfinished. */
  blockedLabel?: string;
  canProceed: boolean;
  showBack?: boolean;
}

/** Height the footer takes, for the page content to clear it. */
export const WIZARD_NAV_SPACE = "calc(6rem + env(safe-area-inset-bottom))";

/**
 * The footer of creation and level-up: a small back arrow and one wide Next
 * button, docked to the bottom edge. The main nav is hidden on those pages.
 */
export function WizardNav({ onBack, onNext, backLabel, nextLabel, blockedLabel, canProceed, showBack = true }: WizardNavProps) {
  const { t } = useLanguage();
  const label = canProceed ? nextLabel || t("common.next") : blockedLabel || t("wizard.finishStep", "Finish this step to continue");

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-paper)]"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 pt-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel || t("common.back")}
            title={backLabel || t("common.back")}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-active)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[var(--color-ink)] px-4 text-[15px] font-semibold text-[var(--color-paper)] transition-colors disabled:cursor-not-allowed disabled:bg-[var(--color-paper-muted)] disabled:text-[var(--color-text-secondary)]"
        >
          <span className="truncate">{label}</span>
          {canProceed && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
