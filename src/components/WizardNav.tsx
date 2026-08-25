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
         <div className="flex items-center gap-3 rounded-full border-[3px] border-paper bg-ink p-3">
           {showBack && (
             <button
               type="button"
               onClick={onBack}
               className="btn-secondary px-5 py-2.5"
             >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
             className="btn-primary flex-1 px-6 py-2.5"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
