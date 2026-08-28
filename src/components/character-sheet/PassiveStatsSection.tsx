"use client";

import { SectionCard } from "./SectionCard";
import { Eye, Ear, Shield, Brain } from "phosphor-react";
import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus } from "@/lib/storage";

interface PassiveStatsSectionProps {
  character: Pick<Character, "level" | "wis" | "int" | "skills" | "passivePerception">;
}

export function PassiveStatsSection({ character }: PassiveStatsSectionProps) {
  const profBonus = getProficiencyBonus(character.level);
  const wisMod = getModifier(character.wis);
  const intMod = getModifier(character.int);

  const isPerceptionProficient = character.skills["Perception"] ?? false;
  const isInsightProficient = character.skills["Insight"] ?? false;
  const isInvestigationProficient = character.skills["Investigation"] ?? false;

  const passivePerception = 10 + wisMod + (isPerceptionProficient ? profBonus : 0);
  const passiveInsight = 10 + wisMod + (isInsightProficient ? profBonus : 0);
  const passiveInvestigation = 10 + intMod + (isInvestigationProficient ? profBonus : 0);

  return (
    <SectionCard id="passive-stats" title="Passive Stats" icon={<Eye weight="regular" className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 p-3 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Eye className="h-5 w-5 text-[var(--color-text-muted)]" />
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">{passivePerception}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Perception</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Ear className="h-5 w-5 text-[var(--color-text-muted)]" />
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">{passiveInsight}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Insight</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 bg-[var(--color-bg)] rounded-[var(--radius-md)]">
          <Brain className="h-5 w-5 text-[var(--color-text-muted)]" />
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">{passiveInvestigation}</span>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Investigation</span>
        </div>
      </div>
    </SectionCard>
  );
}
