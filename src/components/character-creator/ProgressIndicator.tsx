"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 px-1">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-[var(--color-text-secondary)] tracking-widest uppercase">
          {t("wizard.stepOf", "Step {step} of {total}").replace("{step}", String(currentStep)).replace("{total}", String(totalSteps))}
        </span>
        <span className="text-xs font-bold text-[var(--color-accent-indigo-600)]">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--color-accent-indigo-500)] rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
        />
      </div>
    </div>
  );
}
