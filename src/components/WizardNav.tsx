"use client";

import { useLanguage } from "@/contexts/LanguageContext";

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
  backLabel,
  nextLabel,
  canProceed,
  showBack = true,
}: WizardNavProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center">
      <div className="mx-auto max-w-lg px-4 w-full">
         <div className="flex items-center gap-2 rounded-full bg-ink/5 p-1">
           {showBack && (
             <button
               type="button"
               onClick={onBack}
               className="btn btn-secondary flex-1 px-4 py-2.5 text-xs rounded-full"
              >
               {backLabel || t("common.back")}
             </button>
           )}
           <button
             type="button"
             onClick={onNext}
             disabled={!canProceed}
              className="btn btn-primary flex-1 px-5 py-2.5 text-xs rounded-full"
           >
             {nextLabel || t("common.next")}
           </button>
         </div>
       </div>
    </div>
  );
}
