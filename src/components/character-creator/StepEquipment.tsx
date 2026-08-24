"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

interface ChoiceGroup {
  id: string;
  description: string;
  options: EquipmentOption[];
}

interface EquipmentOption {
  description: string;
  items: { name: string; quantity: number }[];
  weaponType?: string;
  isWeaponChoice?: boolean;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(), []);
  const armors = useMemo(() => getStaticArmors(), []);
  const allEquipment = useMemo(() => getEquipmentNames(), []);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => {
    const groups: ChoiceGroup[] = [];
    let groupCounter = 0;

    startingEquipment.forEach((entry: any) => {
      if (entry.granted) return;

      const desc = entry.description || "";
      const items = entry.items || [];

      if (desc.includes(" or ")) {
        const parts = desc.split(" or ");
        const options: EquipmentOption[] = parts.map((part: string) => {
          const trimmed = part.trim();
          const isWeaponChoice = trimmed.includes("any martial") || trimmed.includes("any simple");
          let weaponType: string | undefined;

          if (isWeaponChoice) {
            if (trimmed.includes("martial melee")) weaponType = "martial_melee";
            else if (trimmed.includes("martial ranged")) weaponType = "martial_ranged";
            else if (trimmed.includes("martial")) weaponType = "martial";
            else if (trimmed.includes("simple melee")) weaponType = "simple_melee";
            else if (trimmed.includes("simple ranged")) weaponType = "simple_ranged";
            else if (trimmed.includes("simple")) weaponType = "simple";
          }

          return {
            description: trimmed,
            items: items.length > 0 ? [items[0]] : [],
            weaponType,
            isWeaponChoice,
          };
        });

        groups.push({
          id: `choice-${groupCounter++}`,
          description: desc,
          options,
        });
      } else if (items.length > 0) {
        groups.push({
          id: `choice-${groupCounter++}`,
          description: desc || "Starting equipment",
          options: items.map((item: any) => ({
            description: item.name,
            items: [item],
          })),
        });
      }
    });

    return groups;
  }, [startingEquipment]);

  const getGroupIndex = useCallback((groupId: string) => {
    const match = groupId.match(/choice-(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }, []);

  const getItemInfo = useCallback((itemName: string) => {
    const weapon = weapons.find((w: any) => w.name === itemName);
    if (weapon) {
      return {
        type: "weapon",
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        properties: weapon.properties?.map((p: any) => p.name) || [],
        category: weapon.category_range,
      };
    }

    const armor = armors.find((a: any) => a.name === itemName);
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

    const equipment = allEquipment.find((e: string) => e === itemName);
    if (equipment) {
      return {
        type: "item",
        description: "",
      };
    }

    return null;
  }, [weapons, armors, allEquipment]);

  const isOptionSelected = useCallback((group: ChoiceGroup, optionIndex: number): boolean => {
    const option = group.options[optionIndex];
    const groupIndex = getGroupIndex(group.id);

    if (option.isWeaponChoice) {
      return data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    }

    const itemName = option.items[0]?.name;
    if (!itemName) return false;
    return data.inventory.some(item => item.name === itemName && item.choiceGroupIndex === groupIndex);
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

    const itemName = option.items[0]?.name;
    if (!itemName) return;

    const itemInfo = getItemInfo(itemName);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const newItem: Character["inventory"][number] = {
      id: generateId(),
      name: itemName,
      quantity: option.items[0]?.quantity || 1,
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

    onChange({ inventory: [...newInventory, newItem] });
    setExpandedGroupId(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleWeaponSelect = useCallback((weapon: any, groupId: string) => {
    const groupIndex = getGroupIndex(groupId);

    const itemInfo = getItemInfo(weapon.name);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const weaponItem: Character["inventory"][number] = {
      id: generateId(),
      name: weapon.name,
      quantity: 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "weapon" as const,
      damageDice: weapon.damage?.damage_dice || "",
      damageType: weapon.damage?.damage_type?.name || "",
      category: weapon.category_range || weapon.weapon_category,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: 0,
    };

    onChange({ inventory: [...newInventory, weaponItem] });
    setExpandedGroupId(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

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
          <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
            Choose Your Equipment
          </span>
          <div className="space-y-4">
            {choiceGroups.map((group) => {
              const isExpanded = expandedGroupId === group.id;
              const groupIndex = getGroupIndex(group.id);
              const hasSelection = data.inventory.some(item => item.choiceGroupIndex === groupIndex);

              return (
                <div key={group.id} className="space-y-2">
                  <p className="text-xs text-parchment/70 mb-2">{group.description}</p>
                  <div className="space-y-2">
                    {group.options.map((option, optionIndex) => {
                      const isSelected = isOptionSelected(group, optionIndex);
                      const isWeaponChoice = option.isWeaponChoice;
                      const itemInfo = option.items[0]?.name ? getItemInfo(option.items[0].name) : null;
                      const selectedWeapon = isWeaponChoice ? getSelectedWeaponForGroup(group.id) : null;
                      const weaponStats = selectedWeapon ? getWeaponStats(selectedWeapon.name, selectedWeapon.category) : null;
                      const isDisabled = isExpanded && !isWeaponChoice;

                      if (isWeaponChoice) {
                        const categoryWeapons = getWeaponsByCategory(option.weaponType || "");

                        return (
                          <div
                            key={optionIndex}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                              isSelected
                                ? "border-accent/40 bg-accent/10 text-parchment"
                                : "border-white/20 bg-charcoal/40 text-parchment/80 hover:border-white/40"
                            }`}
                          >
                            {isSelected && selectedWeapon ? (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-accent font-bold">✓</span>
                                    <span className="font-medium">{selectedWeapon.name}</span>
                                  </div>
                                  {weaponStats && (
                                    <div className="text-xs text-parchment/70 mt-1 ml-5">
                                      {weaponStats.damageDice && <span>{weaponStats.damageDice} {weaponStats.damageType}</span>}
                                      <span className="ml-2 text-accent">
                                        {weaponStats.attackBonus} to hit · {weaponStats.damageBonus} damage · {weaponStats.abilityKey}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleChoiceRemove(group)}
                                  className="text-xs text-red-400 hover:text-red-300 ml-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOptionClick(group, optionIndex)}
                                className="w-full text-left"
                              >
                                Choose a {option.weaponType?.replace('_', ' ')} weapon →
                              </button>
                            )}

                            {isExpanded && !isSelected && (
                              <div className="mt-3 space-y-2">
                                {categoryWeapons.map((weapon: any) => (
                                  <button
                                    key={weapon.name}
                                    type="button"
                                    onClick={() => handleWeaponSelect(weapon, group.id)}
                                    className="w-full rounded-lg border border-border bg-charcoal/40 px-3 py-2 text-left text-sm hover:border-accent/30 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-parchment font-medium">{weapon.name}</span>
                                      <span className="text-xs text-accent">{weapon.damage?.damage_dice || "-"}</span>
                                    </div>
                                    <div className="text-xs text-parchment/60 mt-1">
                                      {weapon.damage?.damage_type?.name && <span>{weapon.damage.damage_type.name}</span>}
                                      {weapon.properties && weapon.properties.length > 0 && (
                                        <span className="ml-2 text-text-muted">{weapon.properties.map((p: any) => p.name).join(", ")}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                                {categoryWeapons.length === 0 && (
                                  <p className="text-xs text-parchment/50 text-center py-3">
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
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                            isSelected
                              ? "border-accent/40 bg-accent/10 text-parchment"
                              : isDisabled
                                ? "border-white/10 bg-charcoal/20 text-parchment/40 cursor-not-allowed"
                                : "border-white/20 bg-charcoal/40 text-parchment/80 hover:border-white/40"
                          }`}
                        >
                          {isSelected ? (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-accent font-bold">✓</span>
                                  <span className="font-medium">{option.description || option.items[0]?.name}</span>
                                </div>
                                {itemInfo && (
                                  <div className="text-xs text-parchment/70 mt-1 ml-5">
                                    {itemInfo.type === "weapon" && itemInfo.damageDice && (
                                      <span>{itemInfo.damageDice} {itemInfo.damageType}</span>
                                    )}
                                    {itemInfo.type === "armor" && (
                                      <span>AC {itemInfo.baseAC}{itemInfo.maxDex !== null ? ` + Dex (max +${itemInfo.maxDex})` : " + Dex"}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleChoiceRemove(group)}
                                className="text-xs text-red-400 hover:text-red-300 ml-2"
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
                                <span>{option.description || option.items[0]?.name}</span>
                                {itemInfo && (
                                  <span className="text-xs text-parchment/50">
                                    {itemInfo.type === "weapon" && itemInfo.damageDice && <span>{itemInfo.damageDice}</span>}
                                    {itemInfo.type === "armor" && <span>AC {itemInfo.baseAC}</span>}
                                  </span>
                                )}
                              </div>
                              {itemInfo && (
                                <div className="text-xs text-parchment/60 mt-1">
                                  {itemInfo.type === "weapon" && itemInfo.damageDice && (
                                    <span>{itemInfo.damageDice} {itemInfo.damageType}</span>
                                  )}
                                  {itemInfo.type === "armor" && (
                                    <span>AC {itemInfo.baseAC}{itemInfo.maxDex !== null ? ` + Dex (max +${itemInfo.maxDex})` : " + Dex"}</span>
                                  )}
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
        <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
          Current Inventory
        </span>
        {data.inventory.length === 0 ? (
          <p className="text-xs text-parchment/50">No equipment yet.</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.map((item) => {
              const itemInfo = item.description ? JSON.parse(item.description) : null;
              const isGranted = item.isGranted;

              return (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border bg-charcoal px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-parchment">{item.name}</span>
                      {isGranted && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">GRANTED</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">x{item.quantity || 1}</span>
                  </div>
                  {itemInfo && (
                    <div className="text-xs text-parchment/60">
                      {itemInfo.type === "weapon" && itemInfo.damageDice && (
                        <span>{itemInfo.damageDice} {itemInfo.damageType} · {getWeaponStats(item.name, itemInfo.category)?.attackBonus} to hit · {getWeaponStats(item.name, itemInfo.category)?.damageBonus} damage · {getWeaponStats(item.name, itemInfo.category)?.abilityKey}</span>
                      )}
                      {itemInfo.type === "armor" && (
                        <span>AC {itemInfo.baseAC}{itemInfo.maxDex !== null ? ` + Dex (max +${itemInfo.maxDex})` : " + Dex"}</span>
                      )}
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
