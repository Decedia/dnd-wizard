"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getStaticClass } from "@/lib/srd-client";
import { useEffect, useCallback } from "react";
import { Backpack, Plus, CheckCircle, Circle, Info } from "phosphor-react";
import { InfoButton } from "@/components/InfoButton";

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

  const classData = character.class ? getStaticClass(character.class) : null;

  const canEquip = (item: Character["inventory"][number]): boolean => {
    return item.itemType === "weapon" || item.itemType === "armor";
  };

  const getWeaponStats = (item: Character["inventory"][number]): { attackBonus: string; damage: string; ability: string; damageBonus: number } | null => {
    if (item.itemType !== "weapon") return null;
    const profBonus = getProficiencyBonus(character.level);
    const isFinesseOrRanged = item.category === "ranged" || item.name === "Dagger" || item.name === "Rapier" || item.name === "Shortsword";
    let abilityKey: "str" | "dex";
    if (isFinesseOrRanged) {
      const strMod = getModifier(character.str);
      const dexMod = getModifier(character.dex);
      abilityKey = dexMod >= strMod ? "dex" : "str";
    } else {
      abilityKey = item.category === "ranged" ? "dex" : "str";
    }
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;
    return {
      attackBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
      damage: `${item.damageDice || ""} ${item.damageType || ""}`.trim(),
      ability: abilityKey.toUpperCase(),
      damageBonus,
    };
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
    const itemInfo = item.description ? JSON.parse(item.description) : null;
    const parts: string[] = [];

    if (item.itemType === "weapon") {
      if (item.damageDice) parts.push(`Damage: ${item.damageDice} ${item.damageType || ""}`);
      if (item.category) parts.push(`Category: ${item.category}`);
      if (itemInfo?.properties && itemInfo.properties.length > 0) parts.push(`Properties: ${itemInfo.properties.join(", ")}`);
    } else if (item.itemType === "armor") {
      const baseAC = item.baseAC ?? itemInfo?.baseAC;
      const armorType = item.armorType || itemInfo?.armorType;
      const maxDex = item.maxDexBonus ?? itemInfo?.maxDex;
      parts.push(`AC: ${baseAC} + Dex${maxDex !== undefined && maxDex !== null ? ` (max +${maxDex})` : ""}`);
      if (armorType) parts.push(`Type: ${armorType}`);
    } else {
      if (itemInfo?.description) parts.push(itemInfo.description);
      if (itemInfo?.contents) parts.push(`Contains: ${itemInfo.contents}`);
    }

    return parts.join("\n");
  };

  return (
    <SectionCard id="inventory" title="INVENTORY" icon={<Backpack weight="regular" className="h-5 w-5" />}>
      <div className="space-y-2">
        {character.inventory.map((item) => {
          const description = getItemDescription(item);
          const equipBtn = canEquip(item);
          const isCustom = item.source === "custom";
          const dropdownValue = isCustom ? "Custom Item" : (item.srdItemName || item.name || "");
          return (
            <div key={item.id} className="list-row flex flex-col gap-2">
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
                            description: srdData?.description || item.description || "",
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
                        className={`px-2.5 py-1 text-xs flex items-center gap-1.5 ${
                          item.equipped
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                      >
                         {item.equipped
                           ? <CheckCircle weight="fill" size={16} color="var(--color-text-primary)" />
                           : <Circle weight="regular" size={16} color="var(--color-border)" />}
                        {item.equipped ? "Equipped" : "Equip"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-bold text-[var(--color-text-primary)] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {getWeaponStats(item) && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.damage}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.ability} +{getWeaponStats(item)?.damageBonus}
                      </span>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.attackBonus} to hit
                      </span>
                    </div>
                  )}
                  {isCustom && item.source === "custom" && (
                    <textarea
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onBlur={onFieldBlur}
                      className="textarea min-h-[60px] mt-2"
                      placeholder="Item description"
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{item.name || "Unnamed Item"}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">x{item.quantity}</span>
                      )}
                      {item.equipped && (
                        <span className="badge-light text-[var(--color-text-primary)] bg-paper/10">EQUIPPED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoButton
                        title={item.name || "Item"}
                        description={getItemDescription(item)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {getWeaponStats(item) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.damage}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.ability} +{getWeaponStats(item)?.damageBonus}
                      </span>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.attackBonus} to hit
                      </span>
                    </div>
                  )}
                </div>
              )}
              {description && (
                 <DescriptionText>{description}</DescriptionText>
               )}
             </div>
           );
         })}
       </div>
      {editMode && (
        <button
          type="button"
          onClick={addCustomItem}
          className="mt-4 btn-secondary flex items-center gap-1.5"
        >
          <Plus weight="regular" size={16} />
          Add Custom Item
        </button>
      )}
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="field-label-light">{label}</span>
      {children}
    </div>
  );
}
