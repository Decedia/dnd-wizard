"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects } from "@/lib/storage";
import { getEquipmentData, getClassData } from "@/data/srd";

interface StepEquipmentProps {
  data: Character;
  onChange: (data: Partial<Character>) => void;
}

interface EquipmentRadioGroup {
  name: string;
  choices: any[];
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const updateItem = (id: string, patch: Partial<Character["inventory"][number]>) => {
    const nextInventory = data.inventory.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const removeItem = (id: string) => {
    const nextInventory = data.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  };

  const classData = data.class ? getClassData(data.class) : null;
  const startingEquipment = classData?.startingEquipment || [];
  const grantedItems = startingEquipment.filter((g: any) => g.granted);
  const choiceEntries = startingEquipment.filter((g: any) => !g.granted);

  const buildRadioGroups = (entries: any[]): EquipmentRadioGroup[] => {
    const groups: EquipmentRadioGroup[] = [];
    let currentChoices: any[] = [];
    let groupCounter = 0;

    const flush = () => {
      if (currentChoices.length > 0) {
        groups.push({
          name: `equip-choice-${groupCounter++}`,
          choices: [...currentChoices],
        });
        currentChoices = [];
      }
    };

    for (const entry of entries) {
      const desc = (entry.description || "").trim();
      if (desc.startsWith("Choose one")) {
        flush();
        currentChoices = [entry];
      } else if (desc.startsWith("Or")) {
        currentChoices.push(entry);
      }
    }
    flush();

    return groups;
  };

  const radioGroups = buildRadioGroups(choiceEntries);

  const getSelectedOptionForGroup = (group: EquipmentRadioGroup): number => {
    const firstChoice = group.choices[0];
    if (!firstChoice) return -1;
    const globalIndex = startingEquipment.indexOf(firstChoice);
    const item = data.inventory.find((i) => i.choiceGroupIndex === globalIndex && !i.isGranted);
    return item?.choiceOptionIndex ?? -1;
  };

  const handleChoiceSelect = (group: EquipmentRadioGroup, optionIndex: number) => {
    const choice = group.choices[optionIndex];
    if (!choice) return;

    const globalIndex = startingEquipment.indexOf(choice);

    const nextInventory = data.inventory.filter(
      (item) => !(item.choiceGroupIndex === globalIndex && !item.isGranted)
    );

    const itemsToAdd = choice.items || [];
    itemsToAdd.forEach((itemRef: any) => {
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
        description: itemRef.description || srdData?.description,
        choiceGroupIndex: globalIndex,
        choiceOptionIndex: optionIndex,
      };
      nextInventory.push(newItem);
    });

    const { ac, attacks } = computeEquippedEffects({ ...data, inventory: nextInventory });
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
      inventory: [...data.inventory, newItem],
    });
  };

  return (
    <StepCard title="Equipment">
      {grantedItems.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Starting Equipment (Auto-granted)</span>
          <div className="space-y-1">
            {grantedItems.map((group: any, groupIdx: number) => (
              <div key={groupIdx}>
                {group.description && <p className="text-xs text-parchment/50 mb-1">{group.description}</p>}
                {group.items.map((itemRef: any, itemIdx: number) => (
                  <div key={itemIdx} className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
                    <span className="text-sm text-parchment/80 flex-1">
                      {itemRef.name}
                      {itemRef.quantity && itemRef.quantity > 1 ? ` (x{itemRef.quantity})` : ""}
                    </span>
                    <span className="text-[10px] text-green-400/70">Granted</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const selectedChoiceItems = data.inventory.filter((item) => item.choiceGroupIndex !== undefined && !item.isGranted);
        const nonWeaponSelected = selectedChoiceItems.filter((item) => item.itemType !== "weapon");
        if (nonWeaponSelected.length === 0) return null;
        return (
          <div className="mb-4">
            <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Selected Equipment</span>
            <div className="space-y-1">
              {nonWeaponSelected.map((item) => (
                <div key={item.id} className="flex flex-col gap-0.5 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                  <span className="text-sm text-parchment/80">
                    {item.name}
                    {item.quantity && item.quantity > 1 ? ` (x{item.quantity})` : ""}
                  </span>
                  {item.description && (
                    <span className="text-xs text-parchment/50">{item.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {radioGroups.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Equipment Choices</span>
          <div className="space-y-4">
            {radioGroups.map((group) => {
              const selectedOption = getSelectedOptionForGroup(group);
              return (
                <div key={group.name} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
                  <div className="space-y-2">
                    {group.choices.map((choice: any, optionIdx: number) => {
                      const isSelected = selectedOption === optionIdx;
                      const items = choice.items || [];
                      const itemNames = items.map((i: any) => i.name).join(", ");
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
                            name={group.name}
                            checked={isSelected}
                            onChange={() => handleChoiceSelect(group, optionIdx)}
                            onBlur={() => {}}
                            className="mt-0.5 h-4 w-4 text-gold focus:ring-gold/50"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-parchment/80">{itemNames}</span>
                            {choice.description && (
                              <p className="text-xs text-parchment/50 mt-0.5">{choice.description}</p>
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
        {data.inventory.filter((item) => !item.choiceGroupIndex && !item.isGranted).map((item) => {
          const srdData = getEquipmentData(item.srdItemName || item.name);
          const description = item.description || srdData?.description;
          return (
            <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-parchment/40 hover:text-parchment"
                  aria-label="Remove item"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              {description && (
                <p className="text-xs text-parchment/50">{description}</p>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addCustomItem}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Custom Item
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
