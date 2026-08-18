"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface InventorySectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function InventorySection({ character, onChange }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const updateItem = (id: string, patch: Partial<Character["inventory"][number]>) => {
    onChange({
      inventory: character.inventory.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const addItem = () => {
    onChange({
      inventory: [
        ...character.inventory,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", quantity: 1 },
      ],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      inventory: character.inventory.filter((item) => item.id !== id),
    });
  };

  const updateCurrency = (field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => {
    onChange({
      currency: { ...character.currency, [field]: Math.max(0, value) },
    });
  };

  return (
    <SectionCard id="inventory" title="Inventory" icon={<InventoryIcon className="h-5 w-5" />}>
      <div className="space-y-2">
        {character.inventory.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              onBlur={onFieldBlur}
              className="input flex-1"
              placeholder="Item name"
            />
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })}
              onBlur={onFieldBlur}
              className="input w-16 text-center"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-parchment/40 hover:text-parchment"
              aria-label="Remove item"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Item
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-parchment/10 pt-3">
        <span className="text-xs font-medium text-parchment/60 uppercase tracking-wider w-full mb-1">Currency</span>
        <Field label="CP">
          <input
            type="number"
            min={0}
            value={character.currency.copper}
            onChange={(e) => updateCurrency("copper", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="SP">
          <input
            type="number"
            min={0}
            value={character.currency.silver}
            onChange={(e) => updateCurrency("silver", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="EP">
          <input
            type="number"
            min={0}
            value={character.currency.electrum}
            onChange={(e) => updateCurrency("electrum", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="GP">
          <input
            type="number"
            min={0}
            value={character.currency.gold}
            onChange={(e) => updateCurrency("gold", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="PP">
          <input
            type="number"
            min={0}
            value={character.currency.platinum}
            onChange={(e) => updateCurrency("platinum", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function InventoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.3 7l8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
