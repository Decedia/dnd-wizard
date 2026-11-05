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
      <span className="mb-2 block text-[13px] text-[var(--color-text-secondary)]">
        {t("wizard.stepOf", "Step {step} of {total}").replace("{step}", String(currentStep)).replace("{total}", String(totalSteps))}
      </span>
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-ink)] transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
