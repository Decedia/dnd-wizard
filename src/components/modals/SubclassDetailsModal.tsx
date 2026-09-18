"use client";

import { useState, useEffect } from "react";
import { getStaticSubclassDetails } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubclassDetailsModalProps {
  characterClass: string;
  subclass: string;
  onClose: () => void;
  character?: Character;
}

export function SubclassDetailsModal({ characterClass, subclass, onClose, character }: SubclassDetailsModalProps) {
  const { t, tDesc } = useLanguage();
  const details = getStaticSubclassDetails(characterClass, subclass);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!details) return null;

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={subclass}
      confirmLabel={t("common.gotIt", "Got it")}
      onConfirm={onClose}
      showFooter={true}
    >
      <div className="space-y-4">
        {details.description && details.description.length > 0 && (
          <div className="space-y-2">
            {details.description.map((desc: string, idx: number) => (
              <p key={idx} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {tDesc(`subclass.desc.${characterClass.toLowerCase()}-${subclass.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, desc)}
              </p>
            ))}
          </div>
        )}
        {details.features && details.features.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {t("section.featuresTraits", "Features & Traits")}
            </div>
            {details.features.map((f: any, idx: number) => (
              <div key={idx} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">{f.name}</span>
                  {f.level && (
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
                      Lv {f.level}
                    </span>
                  )}
                </div>
                {f.description && f.description.length > 0 && (
                  <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                    {tDesc(`subclass.feature.desc.${characterClass.toLowerCase()}-${subclass.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, f.description.join(" "))}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BasePopup>
  );
}
