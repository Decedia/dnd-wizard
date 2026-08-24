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
        <div className="flex items-center gap-3 rounded-full border border-parchment/20 bg-charcoal/90 backdrop-blur-xl p-3 shadow-lg">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-parchment/20 px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/40"
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
