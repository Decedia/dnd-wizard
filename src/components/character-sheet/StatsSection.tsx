"use client";

import { useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getModifier } from "@/lib/storage";
import { AbilityScoreBlock } from "./styled/AbilityScoreBlock";
import { ChartBarIcon as ChartBar, StarIcon as Star } from "@/components/icons";
import { isRecommended } from "@/lib/recommendations";

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

  const sortedStats = useMemo(() => {
    return [...STATS].sort((a, b) => (isRecommended("stat", b.label, character.class) ? 1 : 0) - (isRecommended("stat", a.label, character.class) ? 1 : 0));
  }, [character.class]);

  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  return (
    <SectionCard id="stats" title="Stats" icon={<ChartBar className="h-5 w-5" />}>
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

      <div className="mt-3.5 grid grid-cols-3 gap-2.5">
        <div className="stat-box-light">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Prof.</span>
          <span className="text-sm font-bold text-ink">+{character.proficiencyBonus}</span>
        </div>
        <div className="stat-box-light">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Init.</span>
          <span className="text-sm font-bold text-ink">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
        </div>
        <div className="stat-box-light flex-row items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={character.inspiration}
            onChange={(e) => onChange({ inspiration: e.target.checked })}
            onBlur={onFieldBlur}
            className="checkbox"
          />
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Insp.</span>
        </div>
      </div>

      <div className="mt-3.5">
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">Saving Throws</span>
        <div className="space-y-1">
          {savingThrowKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            const abilityMod = getModifier(character[key]);
            return (
              <div key={key} className="flex items-center justify-between px-3 py-1.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={st.proficient}
                    readOnly
                    className="checkbox h-3.5 w-3.5"
                  />
                  <span className="text-xs font-semibold text-ink w-8">{key.toUpperCase()}</span>
                  <span className="text-xs text-ink-muted">{abilityMod >= 0 ? `+${abilityMod}` : abilityMod}</span>
                </div>
                <span className="text-sm font-bold text-ink">
                  {st.value >= 0 ? `+${st.value}` : st.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
