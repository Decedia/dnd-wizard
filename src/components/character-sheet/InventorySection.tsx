"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects } from "@/lib/storage";
import { getEquipmentData, getClassData } from "@/data/srd";

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

  const updateCurrency = (field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => {
    onChange({
      currency: { ...character.currency, [field]: Math.max(0, value) },
    });
  };

  const classData = character.class ? getClassData(character.class) : null;
  const startingEquipment = classData?.startingEquipment || [];

  const grantedItems = startingEquipment.filter((g: any) => g.granted);
  const choiceGroups = startingEquipment.filter((g: any) => !g.granted);

  const getSelectedChoiceForGroup = (groupIndex: number): number => {
    const globalIndex = startingEquipment.findIndex((g: any) => !g.granted) + groupIndex;
    const item = character.inventory.find((i) => i.choiceGroupIndex === globalIndex);
    return item?.choiceOptionIndex ?? -1;
  };

  const handleChoiceSelect = (groupIndex: number, optionIndex: number) => {
    const globalIndex = startingEquipment.findIndex((g: any) => !g.granted) + groupIndex;
    const group = choiceGroups[groupIndex];
    if (!group) return;

    const nextInventory = character.inventory.filter(
      (item) => !(item.choiceGroupIndex === globalIndex)
    );

    const selectedOption = (group as any).items[optionIndex];
    if (selectedOption) {
      const srdItem = getEquipmentData(selectedOption.name);
      const newItems = Array.isArray(selectedOption) ? selectedOption : [selectedOption];
      newItems.forEach((itemRef: any) => {
        const srdData = getEquipmentData(itemRef.name);
        const newItem: Character["inventory"][number] = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: itemRef.name,
          quantity: itemRef.quantity ?? 1,
          equipped: false,
          source: srdData ? "srd" : "custom",
          srdItemName: srdData?.name,
          itemType: srdData?.type,
          category: srdData?.category,
          damageDice: srdData?.damageDice,
          damageType: srdData?.damageType,
          baseAC: srdData?.baseAC,
          armorType: srdData?.armorType,
          maxDexBonus: srdData?.maxDexBonus,
          choiceGroupIndex: globalIndex,
          choiceOptionIndex: optionIndex,
        };
        nextInventory.push(newItem);
      });
    }

    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const addCustomItem = () => {
    const newItem: Character["inventory"][number] = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      quantity: 1,
      equipped: false,
      source: "custom",
    };
    onChange({
      inventory: [...character.inventory, newItem],
    });
  };

  const removeItem = (id: string) => {
    const nextInventory = character.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  return (
    <SectionCard id="inventory" title="Inventory" icon={<InventoryIcon className="h-5 w-5" />}>
      {grantedItems.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Starting Equipment</span>
          <div className="space-y-1">
            {grantedItems.map((group: any, groupIdx: number) => (
              <div key={groupIdx}>
                <p className="text-xs text-parchment/50 mb-1">{group.description}</p>
                {group.items.map((itemRef: any, itemIdx: number) => (
                  <div key={itemIdx} className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
                    <span className="text-sm text-parchment/80 flex-1">
                      {itemRef.name}
                      {itemRef.quantity && itemRef.quantity > 1 ? ` (x${itemRef.quantity})` : ""}
                    </span>
                    <span className="text-[10px] text-green-400/70">Granted</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {choiceGroups.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Equipment Choices</span>
          <div className="space-y-3">
            {choiceGroups.map((group: any, groupIdx: number) => {
              const selectedOption = getSelectedChoiceForGroup(groupIdx);
              return (
                <div key={groupIdx} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
                  <p className="text-xs text-parchment/50 mb-2">{group.description}</p>
                  <div className="space-y-2">
                    {group.items.map((itemRef: any, optionIdx: number) => {
                      const srdData = getEquipmentData(itemRef.name);
                      const isSelected = selectedOption === optionIdx;
                      return (
                        <label
                          key={optionIdx}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "border-gold/40 bg-gold/5"
                              : "border-parchment/10 bg-charcoal/40 hover:border-parchment/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`choice-group-${groupIdx}`}
                            checked={isSelected}
                            onChange={() => handleChoiceSelect(groupIdx, optionIdx)}
                            className="mt-0.5 h-4 w-4 text-gold focus:ring-gold/50"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-parchment/80">{itemRef.name}</span>
                            {itemRef.description && (
                              <p className="text-xs text-parchment/50 mt-0.5">{itemRef.description}</p>
                            )}
                            {itemRef.quantity && itemRef.quantity > 1 && (
                              <span className="text-xs text-parchment/60"> (x{itemRef.quantity})</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {character.inventory.filter((item) => !item.choiceGroupIndex).map((item) => (
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
        onClick={addCustomItem}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Custom Item
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
