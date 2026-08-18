"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";

interface StepEquipmentProps {
  data: Pick<Character, "inventory">;
  onChange: (data: Partial<StepEquipmentProps["data"]>) => void;
}

const ITEM_HINTS: Record<string, string> = {
  Longsword: "A versatile martial weapon, effective in slashing and thrusting attacks.",
  Shortbow: "A ranged weapon favored by rogues and rangers for its mobility.",
  "Leather Armor": "Light armor made from tough but flexible leather, offering basic protection.",
  Shield: "A defensive tool that increases your Armor Class when wielded.",
  "Potion of Healing": "Restores 2d4+2 hit points when consumed.",
};

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const updateItem = (id: string, patch: Partial<Character["inventory"][number]>) => {
    onChange({
      inventory: data.inventory.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const addItem = () => {
    onChange({
      inventory: [
        ...data.inventory,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", quantity: 1 },
      ],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      inventory: data.inventory.filter((item) => item.id !== id),
    });
  };

  return (
    <StepCard title="Equipment">
      <div className="space-y-2">
        {data.inventory.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              onBlur={() => {}}
              className="input flex-1"
              placeholder="Item name"
            />
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })}
              onBlur={() => {}}
              className="input w-16 text-center"
            />
            {ITEM_HINTS[item.name] && (
              <button
                type="button"
                onClick={() => setTooltip({ name: item.name, description: ITEM_HINTS[item.name] })}
                className="text-parchment/40 hover:text-gold"
                aria-label={`Info about ${item.name}`}
              >
                <InfoIcon className="h-4 w-4" />
              </button>
            )}
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

      {tooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" onClick={() => setTooltip(null)}>
          <div className="max-w-sm rounded-xl border border-parchment/20 bg-charcoal-light p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-gold">{tooltip.name}</h3>
              <button onClick={() => setTooltip(null)} className="text-parchment/40 hover:text-parchment">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-parchment/70">{tooltip.description}</p>
          </div>
        </div>
      )}
    </StepCard>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
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
