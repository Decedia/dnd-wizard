"use client";

import { useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Overridable } from "./Overridable";
import { getModifier } from "@/lib/storage";
import { AbilityScoreBlock } from "./styled/AbilityScoreBlock";
import { ChartBarIcon as ChartBar, StarIcon as Star } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";
import { useLanguage } from "@/contexts/LanguageContext";

const STATS = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
] as const;

interface StatsSectionProps {
  character: {
    class: string;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    inspiration: boolean;
    proficiencyBonus: number;
    initiative: number;
    savingThrows: Record<string, { proficient: boolean; value: number }>;
  };
  onChange: (patch: Partial<StatsSectionProps["character"]>) => void;
  editMode?: boolean;
}

export function StatsSection({ character, onChange, editMode = true }: StatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();

  const sortedStats = useMemo(() => {
    return [...STATS].sort((a, b) => (isRecommended("stat", b.label, character.class) ? 1 : 0) - (isRecommended("stat", a.label, character.class) ? 1 : 0));
  }, [character.class]);

  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  return (
    <SectionCard id="stats" title={t("section.stats")} icon={<ChartBar className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-2.5">
        {sortedStats.map(({ key, label }) => (
          <AbilityScoreBlock
            key={key}
            label={label}
            value={character[key]}
            onChange={(value) => onChange({ [key]: value })}
            onBlur={onFieldBlur}
            editMode={editMode}
            recommended={isRecommended("stat", label, character.class)}
          />
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <div className="stat-box-light">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{t("stats.prof")}</span>
          <span className="text-sm font-bold text-ink">+{character.proficiencyBonus}</span>
        </div>
        <div className="stat-box-light flex-row items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={character.inspiration}
            onChange={(e) => onChange({ inspiration: e.target.checked })}
            onBlur={onFieldBlur}
            className="checkbox"
          />
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{t("stats.insp")}</span>
        </div>
      </div>

      <div className="mt-3.5">
         <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">{t("stats.savingThrows")}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {savingThrowKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            return (
              <div key={key} className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="flex items-center gap-1.5">
                  <span
                    aria-label={st.proficient ? t("proficiency.proficient", "Proficient") : t("proficiency.notProficientPlain", "Not proficient")}
                    className={`inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--color-ink)] ${st.proficient ? "bg-[var(--color-ink)]" : "bg-transparent"}`}
                  />
                  <span className="text-xs font-semibold text-ink">{key.toUpperCase()}</span>
                </div>
                <Overridable id={`save:${key}`} label={t("override.save", { ability: key.toUpperCase() }, "{ability} saving throw")} signed editMode={editMode} roll={st.value} className="text-sm font-bold text-ink">
                  {st.value >= 0 ? `+${st.value}` : st.value}
                </Overridable>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
