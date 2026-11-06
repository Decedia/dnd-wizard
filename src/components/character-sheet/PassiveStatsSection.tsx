"use client";

import { SectionCard } from "./SectionCard";
import { EyeIcon as Eye, EarIcon as Ear, ShieldIcon as Shield, BrainIcon as Brain } from "@/components/icons";
import type { Character } from "@/lib/storage";
import { getPassiveScore } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";

interface PassiveStatsSectionProps {
  character: Pick<Character, "level" | "wis" | "int" | "skills" | "expertise" | "features" | "passivePerception">;
}

export function PassiveStatsSection({ character }: PassiveStatsSectionProps) {
  const { t } = useLanguage();
  // Same rules as the derived stats: expertise and Observant count.
  const passivePerception = getPassiveScore(character, "Perception");
  const passiveInsight = getPassiveScore(character, "Insight");
  const passiveInvestigation = getPassiveScore(character, "Investigation");

  return (
    <SectionCard id="passive-stats" title={t("section.passiveStats")} icon={<Eye className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5 p-2 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Eye className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">{passivePerception}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t("sheet.perception")}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Ear className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">{passiveInsight}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t("sheet.insight")}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Brain className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">{passiveInvestigation}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t("sheet.investigation")}</span>
        </div>
      </div>
    </SectionCard>
  );
}
