"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { Coins } from "phosphor-react";
import type { Character } from "@/lib/storage";

interface CurrencySectionProps {
  character: Pick<Character, "currency">;
  onChange: (patch: Partial<Pick<Character, "currency">>) => void;
  editMode?: boolean;
}

const CURRENCY_TYPES = [
  { key: "platinum" as const, label: "PP", color: "text-gray-400" },
  { key: "gold" as const, label: "GP", color: "text-yellow-500" },
  { key: "electrum" as const, label: "EP", color: "text-cyan-500" },
  { key: "silver" as const, label: "SP", color: "text-gray-300" },
  { key: "copper" as const, label: "CP", color: "text-orange-400" },
];

export function CurrencySection({ character, onChange, editMode = true }: CurrencySectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const updateCurrency = (field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => {
    onChange({
      currency: { ...character.currency, [field]: Math.max(0, value) },
    });
  };

  return (
    <SectionCard id="currency" title="CURRENCY" icon={<Coins weight="regular" className="h-5 w-5" />}>
      <div className="grid grid-cols-5 gap-2">
        {CURRENCY_TYPES.map(({ key, label, color }) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <span className={`text-xs font-bold ${color}`}>{label}</span>
            {editMode ? (
              <input
                type="number"
                value={character.currency[key]}
                onChange={(e) => updateCurrency(key, parseInt(e.target.value || "0", 10))}
                onBlur={onFieldBlur}
                className="input w-full text-center text-sm"
              />
            ) : (
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.currency[key]}</span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
