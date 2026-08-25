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
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center">
      <div className="mx-auto max-w-lg px-4 w-full">
         <div className="flex items-center gap-2 rounded-full border border-border-strong bg-paper/90 backdrop-blur-sm p-2">
           {showBack && (
             <button
               type="button"
               onClick={onBack}
               className="btn-secondary px-4 py-2 text-xs"
             >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
             className="btn-primary flex-1 px-5 py-2 text-xs"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
