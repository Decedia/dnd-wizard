"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getModifier } from "@/lib/storage";
import { AbilityScoreBlock } from "./styled/AbilityScoreBlock";

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
    <SectionCard id="stats" title="STATS" icon={<StatsIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-3">
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="PROFICIENCY BONUS">
          {editMode ? (
            <input
              type="number"
              value={character.proficiencyBonus}
              readOnly
              className="input bg-charcoal/60"
            />
          ) : (
            <span className="text-sm font-semibold text-accent">+{character.proficiencyBonus}</span>
          )}
        </Field>
        <Field label="INITIATIVE">
          {editMode ? (
            <input
              type="number"
              value={character.initiative}
              readOnly
              className="input bg-charcoal/60"
            />
          ) : (
            <span className="text-sm font-semibold text-parchment">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
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
            className="h-4 w-4 rounded border-border bg-charcoal text-accent focus:ring-accent/50"
          />
          <span className="text-sm text-parchment">Inspiration</span>
        </label>
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-2">Saving Throws</span>
        <div className="space-y-2">
          {savingThrowKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            const abilityMod = getModifier(character[key]);
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-charcoal px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-muted w-10">{key.toUpperCase()}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-xs text-text-muted">{abilityMod >= 0 ? `+${abilityMod}` : abilityMod} mod</span>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={st.value}
                    readOnly
                    className="input w-20 text-center bg-charcoal/60"
                  />
                ) : (
                  <span className="text-sm font-semibold text-accent w-20 text-right">
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
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}
