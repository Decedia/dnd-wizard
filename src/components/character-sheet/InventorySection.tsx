"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects } from "@/lib/storage";
import { getEquipmentData } from "@/data/srd";
import { equipment as srdEquipment } from "@/data/srd";

interface InventorySectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function InventorySection({ character, onChange }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const updateItem = (id: string, patch: Partial<Character["inventory"][number]>) => {
    const nextInventory = character.inventory.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const addItem = () => {
    onChange({
      inventory: [
        ...character.inventory,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", quantity: 1, equipped: false, source: "custom" },
      ],
    });
  };

  const removeItem = (id: string) => {
    const nextInventory = character.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
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
          <div key={item.id} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={item.srdItemName || (item.source === "custom" ? "Custom Item" : "")}
                onChange={(e) => {
                  if (e.target.value === "Custom Item") {
                    updateItem(item.id, { source: "custom", srdItemName: undefined });
                  } else if (e.target.value) {
                    const srdItem = getEquipmentData(e.target.value);
                    if (srdItem) {
                      updateItem(item.id, {
                        name: srdItem.name,
                        source: "srd",
                        srdItemName: srdItem.name,
                        itemType: srdItem.type,
                        category: srdItem.category,
                        damageDice: srdItem.damageDice,
                        damageType: srdItem.damageType,
                        baseAC: srdItem.baseAC,
                        armorType: srdItem.armorType,
                        maxDexBonus: srdItem.maxDexBonus,
                      });
                    }
                  }
                }}
                onBlur={onFieldBlur}
                className="input flex-1"
              >
                <option value="">Select item...</option>
                {srdEquipment.map((eq) => (
                  <option key={eq.name} value={eq.name}>{eq.name}</option>
                ))}
                <option value="Custom Item">Custom Item</option>
              </select>
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
            {item.source === "custom" && (
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                onBlur={onFieldBlur}
                className="input mb-2"
                placeholder="Custom item name"
              />
            )}
            {item.itemType && item.itemType !== "item" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.equipped}
                  onChange={(e) => updateItem(item.id, { equipped: e.target.checked })}
                  onBlur={onFieldBlur}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                />
                <span className="text-sm text-parchment/80">Equipped</span>
              </label>
            )}
            {item.srdItemName && getEquipmentData(item.srdItemName)?.description && (
              <p className="text-xs text-parchment/50 mt-1">{getEquipmentData(item.srdItemName)!.description}</p>
            )}
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
