"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(), []);
  const armors = useMemo(() => getStaticArmors(), []);
  const allEquipment = useMemo(() => getEquipmentNames(), []);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => buildChoiceGroups(startingEquipment), [startingEquipment]);

  const getGroupIndex = useCallback((groupId: string) => {
    const match = groupId.match(/choice-(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }, []);

  const getItemInfo = useCallback((itemName: string) => {
    const weapon = weapons.find((w: any) => w.name === itemName) as any;
    if (weapon) {
      return {
        type: "weapon",
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        properties: weapon.properties?.map((p: any) => p.name) || [],
        category: weapon.category_range,
      };
    }

    const armor = armors.find((a: any) => a.name === itemName) as any;
    if (armor) {
      const armorType = armor.armor_category === "Light" ? "light" : armor.armor_category === "Medium" ? "medium" : armor.armor_category === "Heavy" ? "heavy" : armor.armor_category === "Shield" ? "shield" : "unknown";
      return {
        type: "armor",
        baseAC: armor.armor_class?.base || 0,
        maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
        armorType,
        description: armor.description || "",
      };
    }

    const equipmentData = getEquipmentData(itemName);
    if (equipmentData) {
      return {
        type: equipmentData.type,
        description: equipmentData.description || "",
        baseAC: equipmentData.baseAC,
        armorType: equipmentData.armorType,
        maxDex: equipmentData.maxDexBonus ?? null,
        damageDice: equipmentData.damageDice,
        damageType: equipmentData.damageType,
        category: equipmentData.category,
        contents: equipmentData.contents,
      };
    }

    return null;
  }, [weapons, armors]);

  const isOptionSelected = useCallback((group: ChoiceGroup, optionIndex: number): boolean => {
    const groupIndex = getGroupIndex(group.id);

    return data.inventory.some(item => item.choiceGroupIndex === groupIndex && item.choiceOptionIndex === optionIndex);
  }, [data.inventory, getGroupIndex]);

  const getSelectedWeaponForGroup = useCallback((groupId: string) => {
    const groupIndex = getGroupIndex(groupId);
    return data.inventory.find(item => item.choiceGroupIndex === groupIndex && item.itemType === "weapon");
  }, [data.inventory, getGroupIndex]);

  const handleOptionClick = useCallback((group: ChoiceGroup, optionIndex: number) => {
    const option = group.options[optionIndex];
    const groupIndex = getGroupIndex(group.id);

    if (option.isWeaponChoice) {
      setExpandedGroupId(prev => prev === group.id ? null : group.id);
      return;
    }

    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const newItems = option.items.map(item => {
      const itemInfo = getItemInfo(item.name);
      const newItem: Character["inventory"][number] = {
        id: generateId(),
        name: item.name,
        quantity: item.quantity || 1,
        equipped: false,
        source: "srd" as const,
        description: itemInfo ? JSON.stringify(itemInfo) : "",
        itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
        choiceGroupIndex: groupIndex,
        choiceOptionIndex: optionIndex,
      };

      if (itemInfo?.type === "weapon") {
        newItem.damageDice = itemInfo.damageDice;
        newItem.damageType = itemInfo.damageType;
        newItem.category = itemInfo.category === "Melee" ? "melee" : itemInfo.category === "Ranged" ? "ranged" : undefined;
      }

      return newItem;
    });

    onChange({ inventory: [...newInventory, ...newItems] });
    setExpandedGroupId(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleWeaponSelect = useCallback((weapon: any, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const option = choiceGroups.find(g => getGroupIndex(g.id) === groupIndex)?.options[optionIndex];
    const itemInfo = getItemInfo(weapon.name);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const qtyMatch = option?.description?.toLowerCase().match(/^two\s+/);
    const quantity = qtyMatch ? 2 : 1;

    const weaponItem: Character["inventory"][number] = {
      id: generateId(),
      name: weapon.name,
      quantity,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "weapon" as const,
      damageDice: weapon.damage?.damage_dice || "",
      damageType: weapon.damage?.damage_type?.name || "",
      category: weapon.category_range || weapon.weapon_category,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: optionIndex,
    };

    const nextInventory = [...newInventory, weaponItem];

    if (option?.description?.toLowerCase().includes("shield")) {
      const shieldInfo = getItemInfo("Shield");
      if (shieldInfo) {
        nextInventory.push({
          id: generateId(),
          name: "Shield",
          quantity: 1,
          equipped: false,
          source: "srd" as const,
          description: JSON.stringify(shieldInfo),
          itemType: "armor" as const,
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: optionIndex,
        });
      }
    }

    onChange({ inventory: nextInventory });
    setExpandedGroupId(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange, choiceGroups]);

  const handleChoiceRemove = useCallback((group: ChoiceGroup) => {
    const groupIndex = getGroupIndex(group.id);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);
    onChange({ inventory: newInventory });
    setExpandedGroupId(prev => prev === group.id ? null : prev);
  }, [data.inventory, getGroupIndex, onChange]);

  const autoGrantItems = useCallback(() => {
    const newInventory = [...data.inventory];
    const grantedItems: Character["inventory"][number][] = [];

    startingEquipment.forEach((entry: any) => {
      if (entry.granted && entry.items) {
        entry.items.forEach((item: any) => {
          const existing = newInventory.find(i => i.name === item.name);
          if (!existing) {
            const itemInfo = getItemInfo(item.name);
            const newItem: Character["inventory"][number] = {
              id: generateId(),
              name: item.name,
              quantity: item.quantity || 1,
              equipped: false,
              source: "srd" as const,
              description: itemInfo ? JSON.stringify(itemInfo) : "",
              itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
              isGranted: true,
            };

            if (itemInfo?.type === "weapon") {
              const weapon = weapons.find((w: any) => w.name === item.name);
              newItem.damageDice = weapon?.damage?.damage_dice || "";
              newItem.damageType = weapon?.damage?.damage_type?.name || "";
              newItem.category = weapon?.category_range === "Melee" ? "melee" : weapon?.category_range === "Ranged" ? "ranged" : undefined;
            }

            grantedItems.push(newItem);
            newInventory.push(newItem);
          }
        });
      }
    });

    if (grantedItems.length > 0) {
      onChange({ inventory: newInventory });
    }
  }, [data.inventory, startingEquipment, weapons, getItemInfo, onChange]);

  useEffect(() => {
    autoGrantItems();
  }, [autoGrantItems]);

  const getWeaponStats = useCallback((weaponName: string, category?: string) => {
    const weapon = weapons.find((w) => w.name === weaponName) as any;
    if (!weapon) return null;

    const profBonus = getProficiencyBonus(data.level);
    const isFinesse = weapon.properties?.some((p: any) => p.name === "Finesse");
    const isRanged = category === "Ranged" || weapon.category_range === "Ranged";

    let abilityKey: "str" | "dex";
    if (isFinesse) {
      const strMod = getModifier(data.str);
      const dexMod = getModifier(data.dex);
      abilityKey = dexMod >= strMod ? "dex" : "str";
    } else if (isRanged) {
      abilityKey = "dex";
    } else {
      abilityKey = "str";
    }

    const abilityMod = getModifier(data[abilityKey]);
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;

    return {
      attackBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
      damageBonus: damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`,
      abilityKey: abilityKey.toUpperCase(),
      damageDice: weapon.damage?.damage_dice || "",
      damageType: weapon.damage?.damage_type?.name || "",
    };
  }, [weapons, data]);

  const renderItemInfo = useCallback((itemInfo: any, compact: boolean = false) => {
    if (!itemInfo) return null;

    if (itemInfo.type === "weapon") {
      return (
        <span>
          {itemInfo.damageDice && <span>{itemInfo.damageDice} {itemInfo.damageType}</span>}
          {itemInfo.properties && itemInfo.properties.length > 0 && (
            <span className="ml-2 text-paper-muted font-medium">{itemInfo.properties.join(", ")}</span>
          )}
          {itemInfo.category && <span className="ml-2 text-paper-muted font-medium">({itemInfo.category})</span>}
        </span>
      );
    }

    if (itemInfo.type === "armor") {
      return (
        <span>
          AC {itemInfo.baseAC}{itemInfo.maxDex !== null ? ` + Dex (max +${itemInfo.maxDex})` : " + Dex"}
          {itemInfo.armorType && <span className="ml-2 text-paper-muted font-medium">({itemInfo.armorType})</span>}
          {itemInfo.description && compact && <span className="ml-2 text-paper-muted font-medium">— {itemInfo.description}</span>}
          {itemInfo.description && !compact && <span className="ml-2 text-paper/60 font-medium">— {itemInfo.description}</span>}
        </span>
      );
    }

    if (itemInfo.type === "item") {
      return (
        <span>
          {itemInfo.description && <span>{itemInfo.description}</span>}
          {itemInfo.contents && (
            <span className="ml-2 text-paper-muted font-medium">Contains: {itemInfo.contents}</span>
          )}
        </span>
      );
    }

    return null;
  }, []);

  const getWeaponsByCategory = useCallback((weaponType: string) => {
    return weapons.filter((w: any) => {
      if (weaponType === "martial") return w.weapon_category === "Martial";
      if (weaponType === "simple") return w.weapon_category === "Simple";
      if (weaponType === "martial_melee") return w.weapon_category === "Martial" && w.category_range === "Melee";
      if (weaponType === "martial_ranged") return w.weapon_category === "Martial" && w.category_range === "Ranged";
      if (weaponType === "simple_melee") return w.weapon_category === "Simple" && w.category_range === "Melee";
      if (weaponType === "simple_ranged") return w.weapon_category === "Simple" && w.category_range === "Ranged";
      return false;
    });
  }, [weapons]);

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.every(group => {
      const groupIndex = getGroupIndex(group.id);
      return data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    });
  }, [choiceGroups, data.inventory, getGroupIndex]);

  return (
    <StepCard title="Equipment" hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.">
      {choiceGroups.length > 0 && (
        <div className="mb-5">
          <span className="text-card-title text-[var(--color-text-primary)]">
            Choose Your Equipment
          </span>
          <div className="space-y-4">
            {choiceGroups.map((group) => {
              const isExpanded = expandedGroupId === group.id;
              const groupIndex = getGroupIndex(group.id);
              const hasSelection = data.inventory.some(item => item.choiceGroupIndex === groupIndex);

              return (
                <div key={group.id} className="space-y-2">
                   <p className="text-description mb-2">{group.description}</p>
                  <div className="space-y-2">
                    {group.options.map((option, optionIndex) => {
                      const isSelected = isOptionSelected(group, optionIndex);
                      const isWeaponChoice = option.isWeaponChoice;
                      const primaryItem = option.items[0];
                      const primaryInfo = primaryItem?.name ? getItemInfo(primaryItem.name) : null;
                      const selectedWeapon = isWeaponChoice ? getSelectedWeaponForGroup(group.id) : null;
                      const weaponStats = selectedWeapon ? getWeaponStats(selectedWeapon.name, selectedWeapon.category) : null;
                      const isDisabled = hasSelection && !isSelected;
                      const optionItemNames = option.items.map(i => i.name).filter(Boolean);
                      const optionItemInfos = optionItemNames.map(name => getItemInfo(name));

                      if (isWeaponChoice) {
                        const categoryWeapons = getWeaponsByCategory(option.weaponType || "");

                        return (
                          <div
                            key={optionIndex}
                            className={`card w-full px-3 py-2 text-left text-sm ${
                              isSelected
                                ? "border-2 border-[var(--color-border-active)] bg-transparent text-[var(--color-text-primary)]"
                                : "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-paper-muted"
                            }`}
                          >
                            {isSelected && selectedWeapon ? (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--color-text-primary)] font-bold">✓</span>
                                    <span className="text-body text-[var(--color-text-primary)]">{selectedWeapon.name}</span>
                                  </div>
                                  {weaponStats && (
                                     <div className="text-description mt-1 ml-5">
                                      {weaponStats.damageDice && <span>{weaponStats.damageDice} {weaponStats.damageType}</span>}
                                      <span className="ml-2 text-ink font-bold">
                                        {weaponStats.attackBonus} to hit · {weaponStats.damageBonus} damage · {weaponStats.abilityKey}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleChoiceRemove(group)}
                                   className="text-muted hover:text-paper ml-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOptionClick(group, optionIndex)}
                                 className="w-full text-left text-body"
                              >
                                Choose a {option.weaponType?.replace('_', ' ')} weapon →
                              </button>
                            )}

                            {isExpanded && !isSelected && (
                              <div className="mt-3 space-y-2">
                                {categoryWeapons.map((weapon: any) =>
                                    <button
                                      key={weapon.name}
                                      type="button"
                                      onClick={() => handleWeaponSelect(weapon, group.id, optionIndex)}
                                    className="card w-full px-3 py-2 text-left text-sm hover:bg-paper-muted transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                       <span className="text-body text-paper">{weapon.name}</span>
                                       <span className="text-xs font-bold text-ink bg-paper px-2 py-0.5 rounded-md">{weapon.damage?.damage_dice || "-"}</span>
                                    </div>
                                     <div className="text-description mt-1">
                                      {weapon.damage?.damage_type?.name && <span>{weapon.damage.damage_type.name}</span>}
                                      {weapon.properties && weapon.properties.length > 0 && (
                                        <span className="ml-2 text-paper-muted">{weapon.properties.map((p: any) => p.name).join(", ")}</span>
          )}
                                    </div>
                                  </button>
                                )}
                                {categoryWeapons.length === 0 && (
                                  <p className="text-muted text-center py-3">
                                    No weapons available in this category.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                           <div
                              key={optionIndex}
                              className={`card w-full px-3 py-2 text-left text-sm ${
                                isSelected
                                  ? "border-2 border-[var(--color-border-active)] bg-transparent text-[var(--color-text-primary)]"
                                  : isDisabled
                                    ? "border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] cursor-not-allowed opacity-50"
                                    : "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-paper-muted"
                              }`}
                            >
                           {isSelected ? (
                             <div className="flex items-center justify-between">
                               <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                     <span className="text-[var(--color-text-primary)] font-bold">✓</span>
                                     <span className="text-body text-[var(--color-text-primary)]">{option.description || primaryItem?.name}</span>
                                  </div>
                                {optionItemInfos.length > 0 && (
                                   <div className="text-description mt-1 ml-5">
                                    {optionItemInfos.map((info, idx) => (
                                      <span key={idx}>
                                        {renderItemInfo(info)}
                                        {idx < optionItemInfos.length - 1 && <span className="mr-2" />}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleChoiceRemove(group)}
                                 className="text-muted hover:text-paper ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOptionClick(group, optionIndex)}
                              disabled={isDisabled}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between">
                                 <span className="text-body">{option.description || primaryItem?.name}</span>
                                 {primaryInfo && (
                                   <span className="text-muted">
                                     {renderItemInfo(primaryInfo, true)}
                                   </span>
                                 )}
                              </div>
                              {optionItemInfos.length > 0 && (
                                 <div className="text-description mt-1">
                                  {optionItemInfos.map((info, idx) => (
                                    <span key={idx}>
                                      {renderItemInfo(info)}
                                      {idx < optionItemInfos.length - 1 && <span className="mr-2" />}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
         <span className="text-card-title text-[var(--color-text-primary)]">
          Current Inventory
        </span>
        {data.inventory.length === 0 ? (
          <p className="text-description">No equipment yet.</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.map((item) => {
              const itemInfo = item.description ? JSON.parse(item.description) : null;
              const isGranted = item.isGranted;

              return (
                <div key={item.id} className="card flex flex-col gap-1 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-body text-[var(--color-text-primary)]">{item.name}</span>
                      {isGranted && (
                        <span className="badge text-ink bg-paper-muted">GRANTED</span>
                      )}
                    </div>
                     <span className="text-muted">x{item.quantity || 1}</span>
                  </div>
                  {itemInfo && (
                    <div className="text-description">
                      {itemInfo.type === "weapon" && itemInfo.damageDice && (
                        <span>{itemInfo.damageDice} {itemInfo.damageType} · {getWeaponStats(item.name, itemInfo.category)?.attackBonus} to hit · {getWeaponStats(item.name, itemInfo.category)?.damageBonus} damage · {getWeaponStats(item.name, itemInfo.category)?.abilityKey}</span>
                      )}
                      {itemInfo.type === "weapon" && !itemInfo.damageDice && renderItemInfo(itemInfo)}
                      {itemInfo.type !== "weapon" && renderItemInfo(itemInfo)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StepCard>
  );
}
