"use client";

import { useState } from "react";
import { CaretDownIcon as CaretDown, CaretUpIcon as CaretUp, LightBulbIcon as LightBulb } from "@/components/icons";

interface Tip {
  title: string;
  content: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NewPlayerTipsProps {
  tips: Tip[];
}

export function NewPlayerTips({ tips }: NewPlayerTipsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <LightBulb className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold text-[var(--color-text-primary)]">New Player Tips</span>
        </div>
        {isOpen ? <CaretUp className="h-5 w-5 text-[var(--color-text-muted)]" /> : <CaretDown className="h-5 w-5 text-[var(--color-text-muted)]" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {tips.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div key={idx} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <div className="text-xs font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />}
                  {tip.title}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{tip.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
