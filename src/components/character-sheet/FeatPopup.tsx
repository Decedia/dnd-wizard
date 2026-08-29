"use client";

import { X } from "phosphor-react";
import type { SRDFeat } from "@/lib/srd-client";

interface FeatPopupProps {
  feat: SRDFeat;
  onClose: () => void;
}

export function FeatPopup({ feat, onClose }: FeatPopupProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{feat.name}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          {feat.prerequisites && (
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
              <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Prerequisites</div>
              <div className="text-sm text-[var(--color-text-primary)] mt-0.5">{feat.prerequisites}</div>
            </div>
          )}
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
            {feat.description}
          </div>
        </div>
      </div>
    </div>
  );
}
