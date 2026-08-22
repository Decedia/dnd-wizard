"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getStaticClass } from "@/lib/srd-client";
import { useEffect } from "react";

interface InventorySectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

interface EquipmentRadioGroup {
  name: string;
  choices: any[];
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

  const toggleEquip = (id: string, itemType: string | undefined) => {
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
  };

  const updateCurrency = (field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => {
    onChange({
      currency: { ...character.currency, [field]: Math.max(0, value) },
    });
  };

  const classData = character.class ? getStaticClass(character.class) : null;
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
    const groupGlobalIndex = startingEquipment.indexOf(firstChoice);
    const item = character.inventory.find((i) => i.choiceGroupIndex === groupGlobalIndex && !i.isGranted);
    return item?.choiceOptionIndex ?? -1;
  };

  const handleChoiceSelect = (group: EquipmentRadioGroup, optionIndex: number) => {
    const choice = group.choices[optionIndex];
    if (!choice) return;

    const firstChoice = group.choices[0];
    const groupGlobalIndex = startingEquipment.indexOf(firstChoice);

    const nextInventory = character.inventory.filter(
      (item) => !(item.choiceGroupIndex === groupGlobalIndex && !item.isGranted)
    );

    const itemsToAdd = choice.items || [];
    const addingArmor = itemsToAdd.some((itemRef: any) => getEquipmentData(itemRef.name)?.type === "armor");

    if (addingArmor) {
      for (let i = 0; i < nextInventory.length; i++) {
        if (nextInventory[i].itemType === "armor") {
          nextInventory[i] = { ...nextInventory[i], equipped: false };
        }
      }
    }

    itemsToAdd.forEach((itemRef: any) => {
      const srdData = getEquipmentData(itemRef.name);
      const isArmor = srdData?.type === "armor";
      const newItem: Character["inventory"][number] = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: itemRef.name,
        quantity: itemRef.quantity ?? 1,
        equipped: isArmor,
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
        choiceGroupIndex: groupGlobalIndex,
        choiceOptionIndex: optionIndex,
      };
      nextInventory.push(newItem);
    });

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
      description: "",
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

  const getItemDescription = (item: Character["inventory"][number]): string => {
    const srdData = getEquipmentData(item.srdItemName || item.name);
    const baseDescription = item.description || srdData?.description || "";
    const damageInfo = srdData?.damageDice ? `${srdData.damageDice} ${srdData.damageType || ""}`.trim() : "";
    return [baseDescription, damageInfo].filter(Boolean).join(" · ");
  };

  const isEditable = (item: Character["inventory"][number]): boolean => {
    return !item.isGranted && item.choiceGroupIndex === undefined;
  };

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

  const ensureGrantedItemsInInventory = () => {
    const existingIds = new Set(character.inventory.map((i) => i.id));
    const toAdd: Character["inventory"][number][] = [];
    grantedItems.forEach((group: any, groupIdx: number) => {
      (group.items || []).forEach((itemRef: any, itemIdx: number) => {
        const srdData = getEquipmentData(itemRef.name);
        const key = `granted-${groupIdx}-${itemIdx}`;
        if (!existingIds.has(key)) {
          toAdd.push({
            id: key,
            name: itemRef.name,
            quantity: itemRef.quantity ?? 1,
            equipped: srdData?.type === "armor",
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
            isGranted: true,
          });
        }
      });
    });
    if (toAdd.length > 0) {
      const nextInventory = [...character.inventory, ...toAdd];
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
    }
  };

  useEffect(() => {
    ensureGrantedItemsInInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.class]);

  return (
    <SectionCard id="inventory" title="Inventory" icon={<InventoryIcon className="h-5 w-5" />}>
      {grantedItems.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Starting Equipment (Auto-granted)</span>
          <div className="space-y-1">
            {grantedItems.map((group: any, groupIdx: number) => (
              <div key={groupIdx}>
                {group.description && <p className="text-xs text-parchment/50 mb-1">{group.description}</p>}
                 {group.items.map((itemRef: any, itemIdx: number) => {
                   const srdData = getEquipmentData(itemRef.name);
                   const invItem = character.inventory.find((i) => i.id === `granted-${groupIdx}-${itemIdx}`);
                   const equipped = invItem?.equipped ?? srdData?.type === "armor";
                   const canToggle = srdData?.type === "weapon" || srdData?.type === "armor";
                   return (
                     <div key={itemIdx} className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
                       <span className="text-sm text-parchment/80 flex-1">
                         {itemRef.name}
                         {itemRef.quantity && itemRef.quantity > 1 ? ` (x${itemRef.quantity})` : ""}
                       </span>
                       {canToggle && (
                         <button
                           type="button"
                           onClick={() => {
                             if (invItem) {
                               toggleEquip(invItem.id, invItem.itemType);
                             }
                           }}
                           className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                             equipped
                               ? "bg-gold/20 text-gold border border-gold/40"
                               : "border border-parchment/20 text-parchment hover:border-parchment/40"
                           }`}
                         >
                           {equipped ? "Equipped" : "Equip"}
                         </button>
                       )}
                       <span className="text-[10px] text-green-400/70">Granted</span>
                     </div>
                   );
                 })}
              </div>
            ))}
          </div>
        </div>
      )}

      {radioGroups.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider mb-2 block">Equipment Choices</span>
          <div className="space-y-4">
            {radioGroups.map((group) => {
              const selectedOption = getSelectedOptionForGroup(group);
              const groupDescription = group.choices[0]?.description || "";
              return (
                <div key={group.name} className="rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
                  {groupDescription && (
                    <p className="text-[10px] font-medium text-parchment/50 uppercase tracking-wider mb-2">{groupDescription}</p>
                  )}
                  <div className="space-y-2">
                    {group.choices.map((choice: any, optionIdx: number) => {
                      const isSelected = selectedOption === optionIdx;
                      const items = choice.items || [];
                      const itemNames = items.map((i: any) => i.name).join(", ");
                      const weaponDamage = items.map((i: any) => {
                        const srdData = getEquipmentData(i.name);
                        if (srdData?.type === "weapon" && srdData.damageDice) {
                          return `${i.name}: ${srdData.damageDice} ${srdData.damageType || ""}`.trim();
                        }
                        return null;
                      }).filter(Boolean).join(" · ");
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
                            className="mt-0.5 h-4 w-4 text-gold focus:ring-gold/50"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-parchment/80">{itemNames}</span>
                            {weaponDamage && (
                              <p className="text-xs text-parchment/50 mt-0.5">{weaponDamage}</p>
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
        {character.inventory.map((item) => {
          const editable = isEditable(item);
          const description = getItemDescription(item);
          const equipBtn = canEquip(item);
          const isCustom = item.source === "custom";
          const dropdownValue = isCustom ? "Custom Item" : (item.srdItemName || item.name || "");
          return (
            <div key={item.id} className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${
              item.isGranted
                ? "border-green-500/20 bg-green-500/5"
                : item.choiceGroupIndex !== undefined
                ? "border-parchment/10 bg-charcoal/40"
                : "border-parchment/10 bg-charcoal/40"
            }`}>
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
                  readOnly={!editable}
                  className={`input w-16 text-center ${!editable ? "bg-charcoal/60" : ""}`}
                />
                {!editable && item.quantity > 1 && (
                  <span className="text-xs text-parchment/50 w-12 text-center">x{item.quantity}</span>
                )}
                {equipBtn && (
                  <button
                    type="button"
                    onClick={() => toggleEquip(item.id, item.itemType)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
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
                  className="text-parchment/40 hover:text-parchment shrink-0"
                  aria-label="Remove item"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              {editable && item.source === "custom" && (
                <textarea
                  value={item.description || ""}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  onBlur={onFieldBlur}
                  className="input min-h-[60px] mt-2 rounded-xl"
                  placeholder="Item description"
                />
              )}
              {description && (
                <p className="text-xs text-parchment/50">{description}</p>
              )}
              {getWeaponStats(item) && (
                <p className="text-xs text-gold/80 bg-gold/5 border border-gold/10 rounded px-2 py-1 mt-1">{getWeaponStats(item)}</p>
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

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-parchment/10 pt-3">
        <span className="text-xs font-medium text-parchment/60 uppercase tracking-wider w-full mb-1">Currency</span>
        <Field label="CP">
          <input
            type="number"
            value={character.currency.copper}
            onChange={(e) => updateCurrency("copper", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="SP">
          <input
            type="number"
            value={character.currency.silver}
            onChange={(e) => updateCurrency("silver", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="EP">
          <input
            type="number"
            value={character.currency.electrum}
            onChange={(e) => updateCurrency("electrum", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="GP">
          <input
            type="number"
            value={character.currency.gold}
            onChange={(e) => updateCurrency("gold", parseInt(e.target.value || "0", 10))}
            onBlur={onFieldBlur}
            className="input w-20 text-center"
          />
        </Field>
        <Field label="PP">
          <input
            type="number"
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
