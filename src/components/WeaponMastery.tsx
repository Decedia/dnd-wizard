"use client";

import { RichInline } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";

/** A 2024 weapon mastery: its name as a chip, and one line on what it does. */
export function MasteryChip({ mastery }: { mastery: string }) {
  const { t } = useLanguage();
  return (
    <span className="rounded-full border border-[var(--color-ink)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-primary)]">
      {t("mastery.chip", { name: t(`mastery.name.${mastery}`, mastery) }, "Mastery: {name}")}
    </span>
  );
}

export function MasteryLine({ mastery }: { mastery: string }) {
  const { t } = useLanguage();
  return (
    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-secondary)]">
      <RichInline text={t(`mastery.text.${mastery}`)} />
    </span>
  );
}
