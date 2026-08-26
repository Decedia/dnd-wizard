"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getStaticClass } from "@/lib/srd-client";
import { useEffect, useCallback } from "react";
import { Backpack, Plus, CheckCircle, Circle } from "phosphor-react";

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
    const damageDice = item.damageDice || "";
    const damageTypeName = item.damageType || "";
    const parts = [
      `+${attackBonus} to hit`,
      [damageDice, damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`, damageTypeName].filter(Boolean).join(" "),
      `(${abilityKey.toUpperCase()} modifier)`,
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

    if (baseDescription) return baseDescription;

    const fallbackParts: string[] = [];
    const itemName = item.name || srdData?.name || "Item";

    if (item.itemType === "weapon") {
      const dice = item.damageDice || srdData?.damageDice || "";
      const type = item.damageType || srdData?.damageType || "";
      const profBonus = getProficiencyBonus(character.level);
      const abilityKey = item.category === "ranged" ? "dex" : "str";
      const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
      const attackBonus = abilityMod + profBonus;
      const damageBonus = abilityMod;

      fallbackParts.push(`${itemName}`);
      if (dice || type) {
        const damagePart = [dice, damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`, type].filter(Boolean).join(" ");
        fallbackParts.push(`${attackBonus >= 0 ? `+${attackBonus}` : attackBonus} to hit · ${damagePart} · ${abilityKey.toUpperCase()} modifier`);
      }
    } else if (item.itemType === "armor") {
      const baseAC = item.baseAC ?? srdData?.baseAC;
      const armorType = item.armorType || srdData?.armorType;

      if (armorType === "shield") {
        fallbackParts.push(`${itemName}. +2 AC`);
      } else if (baseAC !== undefined) {
        const maxDex = item.maxDexBonus ?? srdData?.maxDexBonus;
        if (maxDex === null) {
          fallbackParts.push(`${itemName}. AC ${baseAC} + Dex modifier`);
        } else if (maxDex === 0) {
          fallbackParts.push(`${itemName}. AC ${baseAC}`);
        } else {
          fallbackParts.push(`${itemName}. AC ${baseAC} + Dex modifier (max +${maxDex})`);
        }
      }
    } else if (srdData?.damageDice || srdData?.damageType) {
      const dice = srdData.damageDice || "";
      const type = srdData.damageType || "";
      fallbackParts.push(`${itemName}: ${[dice, type].filter(Boolean).join(" ")}`);
    }

    return fallbackParts.join(" · ");
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
                      className="text-xs font-bold text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
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
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{item.name || "Unnamed Item"}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">x{item.quantity}</span>
                  )}
                  {item.equipped && (
                    <span className="badge-light text-[var(--color-text-primary)] bg-paper/10">EQUIPPED</span>
                  )}
                </div>
              )}
              {description && (
                <DescriptionText>{description}</DescriptionText>
              )}
              {getWeaponStats(item) && !editMode && (
                <p className="text-sm font-bold text-ink bg-paper px-3 py-2.5 surface">{getWeaponStats(item)}</p>
              )}
              {getWeaponStats(item) && editMode && (
                <p className="text-sm font-bold text-ink bg-paper px-3 py-2.5 surface">{getWeaponStats(item)}</p>
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

      <div className="mt-5 flex flex-wrap items-center gap-3 divider pt-4">
        <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider w-full mb-2">Currency</span>
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
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.currency[field]}</span>
            )}
          </Field>
        ))}
      </div>
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
