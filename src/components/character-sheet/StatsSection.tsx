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
    inspiration: boolean;
    proficiencyBonus: number;
    ac: number;
    currentHp: number;
    maxHp: number;
    temporaryHp: number;
    hitDiceTotal: string;
    hitDiceRemaining: number;
    deathSaveSuccesses: number;
    deathSaveFailures: number;
    initiative: number;
    speed: number;
    savingThrows: Record<string, { proficient: boolean; value: number }>;
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

  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  const updateSavingThrow = (key: string, patch: { proficient?: boolean; value?: number }) => {
    onChange({
      savingThrows: {
        ...character.savingThrows,
        [key]: { ...character.savingThrows[key], ...patch },
      },
    });
  };

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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Proficiency Bonus">
          <input
            type="number"
            value={character.proficiencyBonus}
            onChange={(e) => onChange({ proficiencyBonus: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
        <Field label="Initiative">
          <input
            type="number"
            value={character.initiative}
            onChange={(e) => onChange({ initiative: parseInt(e.target.value || "0", 10) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={character.inspiration}
            onChange={(e) => onChange({ inspiration: e.target.checked })}
            onBlur={onFieldBlur}
            className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
          />
          <span className="text-sm text-parchment/80">Inspiration</span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Field label="AC">
          <input
            type="number"
            value={character.ac}
            readOnly
            className="input bg-charcoal/60"
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
        <Field label="Temporary HP">
          <input
            type="number"
            value={character.temporaryHp}
            onChange={(e) => onChange({ temporaryHp: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input max-w-[120px]"
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Hit Dice Total">
          <input
            type="text"
            value={character.hitDiceTotal}
            onChange={(e) => onChange({ hitDiceTotal: e.target.value })}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. 3d10"
          />
        </Field>
        <Field label="Hit Dice Remaining">
          <input
            type="number"
            min={0}
            value={character.hitDiceRemaining}
            onChange={(e) => onChange({ hitDiceRemaining: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input"
          />
        </Field>
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Death Saves</span>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-parchment/70">Successes</span>
            {[0, 1, 2].map((i) => (
              <label key={`ds-s-${i}`} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={character.deathSaveSuccesses > i}
                  onChange={(e) => onChange({ deathSaveSuccesses: e.target.checked ? i + 1 : i })}
                  onBlur={onFieldBlur}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-parchment/70">Failures</span>
            {[0, 1, 2].map((i) => (
              <label key={`ds-f-${i}`} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={character.deathSaveFailures > i}
                  onChange={(e) => onChange({ deathSaveFailures: e.target.checked ? i + 1 : i })}
                  onBlur={onFieldBlur}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-red-400 focus:ring-red-400/50"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Saving Throws</span>
        <div className="mt-2 space-y-2">
          {savingThrowKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            return (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={st.proficient}
                    onChange={(e) => updateSavingThrow(key, { proficient: e.target.checked })}
                    onBlur={onFieldBlur}
                    className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                  />
                  <span className="text-sm text-parchment/80 w-10">{key.toUpperCase()}</span>
                </label>
                <input
                  type="number"
                  value={st.value}
                  onChange={(e) => updateSavingThrow(key, { value: parseInt(e.target.value || "0", 10) })}
                  onBlur={onFieldBlur}
                  className="input w-20 text-center"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
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
