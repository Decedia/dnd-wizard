"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="mb-6 px-1">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
          Langkah {currentStep} dari {totalSteps}
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
        />
      </div>
    </div>
  );
}
