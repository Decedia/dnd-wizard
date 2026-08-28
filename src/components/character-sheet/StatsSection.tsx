"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getModifier } from "@/lib/storage";
import { AbilityScoreBlock } from "./styled/AbilityScoreBlock";
import { ChartBar } from "phosphor-react";

interface StatsSectionProps {
  character: {
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
  const stats = [
    { key: "str", label: "STR" },
    { key: "dex", label: "DEX" },
    { key: "con", label: "CON" },
    { key: "int", label: "INT" },
    { key: "wis", label: "WIS" },
    { key: "cha", label: "CHA" },
  ] as const;

  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  return (
    <SectionCard id="stats" title="Stats" icon={<ChartBar weight="regular" className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(({ key, label }) => (
          <AbilityScoreBlock
            key={key}
            label={label}
            value={character[key]}
            onChange={(value) => onChange({ [key]: value })}
            onBlur={onFieldBlur}
            editMode={editMode}
          />
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <Field label="PROFICIENCY BONUS">
          {editMode ? (
            <input
              type="number"
              value={character.proficiencyBonus}
              readOnly
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-ink">+{character.proficiencyBonus}</span>
          )}
        </Field>
        <Field label="INITIATIVE">
          {editMode ? (
            <input
              type="number"
              value={character.initiative}
              readOnly
              className="input"
            />
          ) : (
            <span className="text-sm font-semibold text-ink">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
          )}
        </Field>
      </div>

      <div className="mt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={character.inspiration}
            onChange={(e) => onChange({ inspiration: e.target.checked })}
            onBlur={onFieldBlur}
            className="checkbox"
          />
          <span className="text-sm font-medium text-ink">Inspiration</span>
        </label>
      </div>

      <div className="mt-3.5">
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">Saving Throws</span>
        <div className="space-y-1.5">
          {savingThrowKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            const abilityMod = getModifier(character[key]);
            return (
               <div key={key} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-ink-muted w-10">{key.toUpperCase()}</span>
                  <span className="text-ink-muted">•</span>
                  <span className="text-[11px] text-ink-muted">{abilityMod >= 0 ? `+${abilityMod}` : abilityMod} mod</span>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={st.value}
                    readOnly
                    className="input w-20 text-center"
                  />
                ) : (
                  <span className="text-sm font-semibold text-ink w-20 text-right">
                    {st.value >= 0 ? `+${st.value}` : st.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="field-label-light">{label}</span>
      {children}
    </div>
  );
}
