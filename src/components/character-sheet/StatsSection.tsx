"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getModifier } from "@/lib/storage";

interface StatsSectionProps {
  character: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    ac: number;
    currentHp: number;
    maxHp: number;
    speed: number;
  };
  onChange: (patch: Partial<StatsSectionProps["character"]>) => void;
}

export function StatsSection({ character, onChange }: StatsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const stats = [
    { key: "str", label: "STR" },
    { key: "dex", label: "DEX" },
    { key: "con", label: "CON" },
    { key: "int", label: "INT" },
    { key: "wis", label: "WIS" },
    { key: "cha", label: "CHA" },
  ] as const;

  return (
    <SectionCard id="stats" title="Stats" icon={<StatsIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ key, label }) => (
          <StatBox
            key={key}
            label={label}
            value={character[key]}
            onChange={(value) => onChange({ [key]: value })}
            onBlur={onFieldBlur}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Field label="AC">
          <input
            type="number"
            value={character.ac}
            onChange={(e) => onChange({ ac: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Current HP">
          <input
            type="number"
            value={character.currentHp}
            onChange={(e) => onChange({ currentHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Max HP">
          <input
            type="number"
            value={character.maxHp}
            onChange={(e) => onChange({ maxHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Speed">
          <input
            type="number"
            value={character.speed}
            onChange={(e) => onChange({ speed: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input max-w-[120px]"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function StatBox({ label, value, onChange, onBlur }: { label: string; value: number; onChange: (v: number) => void; onBlur: () => void }) {
  const mod = getModifier(value);
  return (
    <div className="rounded-lg border border-parchment/10 bg-charcoal/60 p-3 text-center">
      <span className="text-[10px] font-medium text-parchment/50 uppercase tracking-wider">{label}</span>
      <div className="mt-1 flex items-center justify-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || "10", 10)))}
          onBlur={onBlur}
          className="input w-12 text-center py-1 text-sm"
        />
        <span className="text-xs font-semibold text-gold">
          {mod >= 0 ? `+${mod}` : mod}
        </span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
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
