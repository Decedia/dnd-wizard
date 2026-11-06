"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { CoinsIcon as Coins } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { COIN_BY_FIELD, coinsFromInventory, setCoinAmount } from "@/lib/inventory";

interface CurrencySectionProps {
  character: Pick<Character, "inventory">;
  onChange: (patch: Partial<Pick<Character, "inventory" | "currency">>) => void;
  editMode?: boolean;
}

const CURRENCY_TYPES = [
  { key: "platinum" as const, label: "PP", color: "text-[var(--color-text-muted)]" },
  { key: "gold" as const, label: "GP", color: "text-[var(--color-warning-500)]" },
  { key: "electrum" as const, label: "EP", color: "text-[var(--color-accent-teal-500)]" },
  { key: "silver" as const, label: "SP", color: "text-[var(--color-text-muted)]" },
  { key: "copper" as const, label: "CP", color: "text-[var(--color-accent-orange-400)]" },
];

export function CurrencySection({ character, onChange, editMode = true }: CurrencySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();

  // Coins are inventory rows; this box edits those rows.
  const coins = coinsFromInventory(character.inventory);
  const updateCurrency = (field: keyof typeof coins, value: number) => {
    const inventory = setCoinAmount(character.inventory, COIN_BY_FIELD[field], value);
    onChange({ inventory, currency: coinsFromInventory(inventory) });
  };

  return (
    <SectionCard id="currency" title={t("section.currency")} icon={<Coins className="h-5 w-5" />}>
      <div className="grid grid-cols-5 gap-2">
        {CURRENCY_TYPES.map(({ key, label, color }) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <span className={`text-xs font-bold ${color}`}>{label}</span>
            {editMode ? (
              <input
                type="number"
                value={coins[key]}
                onChange={(e) => updateCurrency(key, parseInt(e.target.value || "0", 10))}
                onBlur={onFieldBlur}
                className="input w-full text-center text-sm"
              />
            ) : (
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{coins[key]}</span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
