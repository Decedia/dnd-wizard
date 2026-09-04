"use client";

import { SourceBadge } from "../SourceBadge";
import { BasePopup } from "@/components/BasePopup";

interface FeatModalProps {
  feat: {
    name: string;
    source?: string;
    prerequisites?: string | null;
    description: string;
  };
  onClose: () => void;
}

export function FeatModal({ feat, onClose }: FeatModalProps) {
  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={feat.name}
      confirmLabel="Close"
      onConfirm={onClose}
      showFooter={true}
    >
      {feat.prerequisites && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 mb-3">
          <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Prerequisites</div>
          <div className="text-sm text-[var(--color-text-primary)] mt-0.5">{feat.prerequisites}</div>
        </div>
      )}
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
        {feat.description}
      </div>
    </BasePopup>
  );
}
