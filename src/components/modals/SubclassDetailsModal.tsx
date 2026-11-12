"use client";

import { useState, useEffect } from "react";
import { getStaticSubclassDetails } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SubclassInfo } from "@/components/SubclassInfo";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";

interface SubclassDetailsModalProps {
  characterClass: string;
  subclass: string;
  onClose: () => void;
  character?: Character;
}

export function SubclassDetailsModal({ characterClass, subclass, onClose, character }: SubclassDetailsModalProps) {
  const { t, tDesc, language } = useLanguage();
  const details = getStaticSubclassDetails(characterClass, subclass, language, character?.ruleset);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!details) return null;

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={subclass} showHeader={false}>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <SubclassInfo characterClass={characterClass} subclass={subclass} ruleset={character?.ruleset} />
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
