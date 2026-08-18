"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects } from "@/lib/storage";
import { equipment as srdEquipment, getEquipmentData } from "@/data/srd";

interface StepEquipmentProps {
  data: Character;
  onChange: (data: Partial<Character>) => void;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const updateItem = (id: string, patch: Partial<Character["inventory"][number]>) => {
    const nextInventory = data.inventory.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const addItem = (srdItemName?: string) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const srdItem = srdItemName ? getEquipmentData(srdItemName) : undefined;
    const newItem: Character["inventory"][number] = {
      id,
      name: srdItem?.name ?? "",
      quantity: 1,
      equipped: false,
      source: srdItem ? "srd" : "custom",
      srdItemName: srdItem?.name,
      itemType: srdItem?.type,
      category: srdItem?.category,
      damageDice: srdItem?.damageDice,
      damageType: srdItem?.damageType,
      baseAC: srdItem?.baseAC,
      armorType: srdItem?.armorType,
      maxDexBonus: srdItem?.maxDexBonus,
    };
    onChange({
      inventory: [...data.inventory, newItem],
    });
  };

  const removeItem = (id: string) => {
    const nextInventory = data.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const handleEquippedToggle = (item: Character["inventory"][number], equipped: boolean) => {
    const updated = { ...item, equipped };
    const nextInventory = data.inventory.map((i) => (i.id === item.id ? updated : i));
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const handleSrdSelect = (itemId: string, srdName: string) => {
    const srdItem = getEquipmentData(srdName);
    if (!srdItem) return;
    const updated = {
      ...data.inventory.find((i) => i.id === itemId)!,
      name: srdItem.name,
      source: "srd" as const,
      srdItemName: srdItem.name,
      itemType: srdItem.type,
      category: srdItem.category,
      damageDice: srdItem.damageDice,
      damageType: srdItem.damageType,
      baseAC: srdItem.baseAC,
      armorType: srdItem.armorType,
      maxDexBonus: srdItem.maxDexBonus,
    };
    const nextInventory = data.inventory.map((i) => (i.id === itemId ? updated : i));
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  return (
    <StepCard title="Equipment">
      <div className="space-y-2">
        {data.inventory.map((item) => (
          <div key={item.id} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={item.srdItemName || (item.source === "custom" ? "Custom Item" : "")}
                onChange={(e) => {
                  if (e.target.value === "Custom Item") {
                    const nextInventory = data.inventory.map((i) =>
                      i.id === item.id ? { ...i, source: "custom" as const, srdItemName: undefined } : i
                    );
                    onChange({ inventory: nextInventory });
                  } else if (e.target.value) {
                    handleSrdSelect(item.id, e.target.value);
                  }
                }}
                onBlur={() => {}}
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
                onBlur={() => {}}
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
                onBlur={() => {}}
                className="input mb-2"
                placeholder="Custom item name"
              />
            )}
            {item.itemType && item.itemType !== "item" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.equipped}
                  onChange={(e) => handleEquippedToggle(item, e.target.checked)}
                  onBlur={() => {}}
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
        onClick={() => addItem()}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Item
      </button>
    </StepCard>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
