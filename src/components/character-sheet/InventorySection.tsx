"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getStaticClass } from "@/lib/srd-client";
import { useEffect, useCallback } from "react";

interface InventorySectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function InventorySection({ character, onChange, editMode = true }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const updateItem = useCallback((id: string, patch: Partial<Character["inventory"][number]>) => {
    const nextInventory = character.inventory.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  }, [character, onChange]);

  const toggleEquip = useCallback((id: string, itemType: string | undefined) => {
    const item = character.inventory.find((i) => i.id === id);
    if (!item) return;

    if (itemType === "armor") {
      const nextInventory = character.inventory.map((i) =>
        i.id === id ? { ...i, equipped: !i.equipped } : i.itemType === "armor" ? { ...i, equipped: false } : i
      );
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
    } else {
      const nextInventory = character.inventory.map((i) =>
        i.id === id ? { ...i, equipped: !i.equipped } : i
      );
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
    }
  }, [character, onChange]);

  const updateCurrency = useCallback((field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => {
    onChange({
      currency: { ...character.currency, [field]: Math.max(0, value) },
    });
  }, [character.currency, onChange]);

  const classData = character.class ? getStaticClass(character.class) : null;

  const canEquip = (item: Character["inventory"][number]): boolean => {
    return item.itemType === "weapon" || item.itemType === "armor";
  };

  const getWeaponStats = (item: Character["inventory"][number]): string | null => {
    if (item.itemType !== "weapon") return null;
    const profBonus = getProficiencyBonus(character.level);
    const abilityKey = item.category === "ranged" ? "dex" : "str";
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;
    const damageDice = item.damageDice || "";
    const damageTypeName = item.damageType || "";
    const parts = [
      `+${attackBonus} to hit`,
      [damageDice, damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`, damageTypeName].filter(Boolean).join(" "),
    ];
    return parts.join(" · ");
  };

  const addCustomItem = useCallback(() => {
    const newItem: Character["inventory"][number] = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      quantity: 1,
      equipped: false,
      source: "custom",
      description: "",
    };
    onChange({
      inventory: [...character.inventory, newItem],
    });
  }, [character.inventory, onChange]);

  const removeItem = useCallback((id: string) => {
    const nextInventory = character.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  }, [character, onChange]);

  const getItemDescription = (item: Character["inventory"][number]): string => {
    const srdData = getEquipmentData(item.srdItemName || item.name);
    const baseDescription = item.description || srdData?.description || "";
    const damageInfo = srdData?.damageDice ? `${srdData.damageDice} ${srdData.damageType || ""}`.trim() : "";
    return [baseDescription, damageInfo].filter(Boolean).join(" · ");
  };

  return (
    <SectionCard id="inventory" title="Inventory" icon={<InventoryIcon className="h-5 w-5" />}>
      <div className="space-y-2">
        {character.inventory.map((item) => {
          const description = getItemDescription(item);
          const equipBtn = canEquip(item);
          const isCustom = item.source === "custom";
          const dropdownValue = isCustom ? "Custom Item" : (item.srdItemName || item.name || "");
          return (
            <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2.5">
              {editMode ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={dropdownValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Custom Item") {
                          updateItem(item.id, { source: "custom", srdItemName: undefined, name: item.name || "" });
                        } else if (val) {
                          const srdData = getEquipmentData(val);
                          updateItem(item.id, {
                            name: val,
                            srdItemName: val,
                            source: "srd",
                            itemType: srdData?.type,
                            category: srdData?.category,
                            damageDice: srdData?.damageDice,
                            damageType: srdData?.damageType,
                            baseAC: srdData?.baseAC,
                            armorType: srdData?.armorType,
                            maxDexBonus: srdData?.maxDexBonus,
                          });
                        } else {
                          updateItem(item.id, { source: "custom", srdItemName: undefined, name: "" });
                        }
                      }}
                      onBlur={onFieldBlur}
                      className="input flex-1 min-w-[120px]"
                    >
                      <option value="">Select item...</option>
                      {getEquipmentNames().map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="Custom Item">Custom Item</option>
                    </select>
                    {isCustom && (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        onBlur={onFieldBlur}
                        className="input flex-1 min-w-[120px]"
                        placeholder="Enter custom item name"
                      />
                    )}
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value || "1", 10) })}
                      onBlur={onFieldBlur}
                      className="input w-16 text-center"
                    />
                    {equipBtn && (
                      <button
                        type="button"
                        onClick={() => toggleEquip(item.id, item.itemType)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          item.equipped
                            ? "bg-gold/20 text-gold border border-gold/40"
                            : "border border-parchment/20 text-parchment hover:border-parchment/40"
                        }`}
                      >
                        {item.equipped ? "Equipped" : "Equip"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {isCustom && item.source === "custom" && (
                    <textarea
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onBlur={onFieldBlur}
                      className="input min-h-[60px] mt-2 rounded-xl"
                      placeholder="Item description"
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-parchment/90">{item.name || "Unnamed Item"}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-parchment/50">x{item.quantity}</span>
                  )}
                  {item.equipped && (
                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">EQUIPPED</span>
                  )}
                </div>
              )}
              {description && (
                <DescriptionText>{description}</DescriptionText>
              )}
              {getWeaponStats(item) && !editMode && (
                <p className="text-sm font-bold text-gold bg-gold/10 border border-gold/25 rounded-lg px-3 py-2.5 shadow-sm">{getWeaponStats(item)}</p>
              )}
              {getWeaponStats(item) && editMode && (
                <p className="text-sm font-bold text-gold bg-gold/10 border border-gold/25 rounded-lg px-3 py-2.5 shadow-sm">{getWeaponStats(item)}</p>
              )}
            </div>
          );
        })}
      </div>
      {editMode && (
        <button
          type="button"
          onClick={addCustomItem}
          className="mt-4 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
        >
          + Add Custom Item
        </button>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-parchment/10 pt-4">
        <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider w-full mb-2">Currency</span>
        {(["copper", "silver", "electrum", "gold", "platinum"] as const).map((field) => (
          <Field key={field} label={field.toUpperCase().slice(0, 2)}>
            {editMode ? (
              <input
                type="number"
                value={character.currency[field]}
                onChange={(e) => updateCurrency(field, parseInt(e.target.value || "0", 10))}
                onBlur={onFieldBlur}
                className="input w-20 text-center"
              />
            ) : (
              <span className="text-sm font-semibold text-parchment/90">{character.currency[field]}</span>
            )}
          </Field>
        ))}
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
