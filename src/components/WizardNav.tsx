"use client";

interface WizardNavProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  canProceed: boolean;
  showBack?: boolean;
}

export function WizardNav({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  canProceed,
  showBack = true,
}: WizardNavProps) {
  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center">
      <div className="mx-auto max-w-lg px-4 w-full">
        <div className="flex items-center gap-3 rounded-full border-2 border-paper bg-ink p-3">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border-2 border-paper px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 rounded-lg bg-paper px-6 py-2.5 text-sm font-bold text-ink border-2 border-ink transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
