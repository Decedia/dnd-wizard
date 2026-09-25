"use client";

import { SourceBadge } from "../SourceBadge";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, tDesc } = useLanguage();
  return (
    <BottomSheet isOpen={true} onClose={onClose} title={feat.name} showHeader={false}>
      <div className="px-4 pt-4 pb-6 space-y-3">
        {feat.prerequisites && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
            <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{t("feat.prerequisites", "Prerequisites")}</div>
            <div className="text-sm text-[var(--color-text-primary)] mt-0.5">{feat.prerequisites}</div>
          </div>
        )}
        {feat.source && feat.source !== "PHB" && (
          <div>
            <SourceBadge source={feat.source} size="sm" />
          </div>
        )}
        <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
          {tDesc(`feat.desc.${feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, feat.description)}
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full font-bold text-sm transition-colors bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
