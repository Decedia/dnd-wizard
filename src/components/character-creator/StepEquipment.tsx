"use client";

import { useState, useMemo, useEffect } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus } from "@/lib/storage";
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

interface SelectedWeaponInfo {
  name: string;
  damageDice: string;
  damageType: string;
  category?: string;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [selectedWeaponData, setSelectedWeaponData] = useState<Record<string, SelectedWeaponInfo>>({});
  const [weaponPopup, setWeaponPopup] = useState<{ groupId: string; optionIndex: number; category: string } | null>(null);

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(), []);
  const armors = useMemo(() => getStaticArmors(), []);
  const allEquipment = useMemo(() => getEquipmentNames(), []);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => {
    const groups: ChoiceGroup[] = [];
    let groupCounter = 0;

    startingEquipment.forEach((entry: any) => {
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

  const filteredWeapons = useMemo(() => {
    if (!weaponPopup) return [];
    
    const category = weaponPopup.category;
    const selectedNames = Object.values(selectedWeaponData).map(w => w.name);
    
    return weapons.filter((w: any) => {
      if (category === "martial") return w.weapon_category === "Martial";
      if (category === "simple") return w.weapon_category === "Simple";
      if (category === "martial_melee") return w.weapon_category === "Martial" && w.category_range === "Melee";
      if (category === "martial_ranged") return w.weapon_category === "Martial" && w.category_range === "Ranged";
      if (category === "simple_melee") return w.weapon_category === "Simple" && w.category_range === "Melee";
      if (category === "simple_ranged") return w.weapon_category === "Simple" && w.category_range === "Ranged";
      return false;
    }).filter((w: any) => !selectedNames.includes(w.name));
  }, [weaponPopup, weapons, selectedWeaponData]);

  const getItemInfo = (itemName: string) => {
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
      return {
        type: "armor",
        baseAC: armor.base_ac || 0,
        maxDex: armor.max_dex_bonus ?? null,
        armorType: armor.armor_type || "unknown",
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
  };

  const handleChoiceSelect = (groupId: string, optionIndex: number) => {
    setSelectedChoices(prev => {
      const next = { ...prev, [groupId]: optionIndex };
      
      const group = choiceGroups.find(g => g.id === groupId);
      if (!group) return next;
      
      const option = group.options[optionIndex];
      
      if (option.isWeaponChoice) {
        setWeaponPopup({ groupId, optionIndex, category: option.weaponType || "" });
        return prev;
      }
      
      const itemName = option.items[0]?.name;
      if (!itemName) return next;
      
      const itemInfo = getItemInfo(itemName);
      const newItem: Character["inventory"][number] = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: itemName,
        quantity: option.items[0]?.quantity || 1,
        equipped: false,
        source: "srd" as const,
        description: itemInfo ? JSON.stringify(itemInfo) : "",
        itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
      };
      
      if (itemInfo?.type === "weapon") {
        newItem.damageDice = itemInfo.damageDice;
        newItem.damageType = itemInfo.damageType;
        newItem.category = itemInfo.category;
      }
      
      onChange({ inventory: [...data.inventory, newItem] });
      
      return next;
    });
  };

  const handleWeaponSelect = (weapon: any) => {
    if (!weaponPopup) return;
    
    const group = choiceGroups.find(g => g.id === weaponPopup.groupId);
    if (!group) return;
    
    const option = group.options[weaponPopup.optionIndex];
    const itemInfo = getItemInfo(weapon.name);
    
    const weaponItem: Character["inventory"][number] = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: weapon.name,
      quantity: option.items[0]?.quantity || 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "weapon" as const,
      damageDice: weapon.damage?.damage_dice || "",
      damageType: weapon.damage?.damage_type?.name || "",
      category: weapon.category_range || weapon.weapon_category,
    };
    
    onChange({ inventory: [...data.inventory, weaponItem] });
    setSelectedWeaponData(prev => ({
      ...prev,
      [weaponPopup.groupId]: {
        name: weapon.name,
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        category: weapon.category_range || weapon.weapon_category,
      }
    }));
    setSelectedChoices(prev => ({
      ...prev,
      [weaponPopup.groupId]: weaponPopup.optionIndex,
    }));
    setWeaponPopup(null);
  };

  const handleChoiceRemove = (groupId: string) => {
    const selectedOption = selectedChoices[groupId];
    if (selectedOption === undefined) return;
    
    const group = choiceGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const option = group.options[selectedOption];
    
    if (option.isWeaponChoice) {
      const weaponInfo = selectedWeaponData[groupId];
      if (weaponInfo) {
        const newInventory = data.inventory.filter(item => item.name !== weaponInfo.name);
        onChange({ inventory: newInventory });
      }
    } else {
      const itemName = option.items[0]?.name;
      if (itemName) {
        const newInventory = data.inventory.filter(item => item.name !== itemName);
        onChange({ inventory: newInventory });
      }
    }
    
    setSelectedChoices(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setSelectedWeaponData(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

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
              id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: item.name,
              quantity: item.quantity || 1,
              equipped: false,
              source: "srd" as const,
              description: itemInfo ? JSON.stringify(itemInfo) : "",
              itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
            };
            
            if (itemInfo?.type === "weapon") {
              const weapon = weapons.find((w: any) => w.name === item.name);
              newItem.damageDice = weapon?.damage?.damage_dice || "";
              newItem.damageType = weapon?.damage?.damage_type?.name || "";
              newItem.category = weapon?.category_range;
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
  }, [data.inventory, startingEquipment, weapons, onChange]);

  useEffect(() => {
    autoGrantItems();
  }, [autoGrantItems]);

  const getWeaponStats = (weaponName: string, category?: string) => {
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
  };

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.every(group => selectedChoices[group.id] !== undefined);
  }, [choiceGroups, selectedChoices]);

  return (
    <StepCard title="Equipment" hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.">
      {choiceGroups.length > 0 && (
        <div className="mb-5">
          <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
            Choose Your Equipment
          </span>
          <div className="space-y-4">
            {choiceGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="text-xs text-parchment/70 mb-2">{group.description}</p>
                <div className="space-y-2">
                  {group.options.map((option, optionIndex) => {
                    const isSelected = selectedChoices[group.id] === optionIndex;
                    const selectedWeapon = selectedWeaponData[group.id];
                    const itemInfo = option.items[0]?.name ? getItemInfo(option.items[0].name) : null;
                    
                    if (option.isWeaponChoice) {
                      const weaponStats = selectedWeapon ? getWeaponStats(selectedWeapon.name, selectedWeapon.category) : null;
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                            isSelected || selectedWeapon
                              ? "border-accent/40 bg-accent/10 text-parchment"
                              : "border-white/20 bg-charcoal/40 text-parchment/80 hover:border-white/40"
                          }`}
                        >
                          {selectedWeapon ? (
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
                                onClick={() => handleChoiceRemove(group.id)}
                                className="text-xs text-red-400 hover:text-red-300 ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWeaponPopup({ groupId: group.id, optionIndex, category: option.weaponType || "" })}
                              className="w-full text-left"
                            >
                              Choose a {option.weaponType?.replace('_', ' ')} weapon →
                            </button>
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
                            : "border-white/20 bg-charcoal/40 text-parchment/80 hover:border-white/40"
                        }`}
                      >
                        {isSelected ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-accent font-bold">✓</span>
                                <span className="font-medium">{option.description}</span>
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
                              onClick={() => handleChoiceRemove(group.id)}
                              className="text-xs text-red-400 hover:text-red-300 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChoiceSelect(group.id, optionIndex)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.description}</span>
                              {itemInfo && (
                                <span className="text-xs text-parchment/50">
                                  {itemInfo.type === "weapon" && itemInfo.damageDice && <span>{itemInfo.damageDice}</span>}
                                  {itemInfo.type === "armor" && <span>AC {itemInfo.baseAC}</span>}
                                </span>
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weaponPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" onClick={() => setWeaponPopup(null)}>
          <div className="max-w-sm w-full max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-charcoal-light p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-accent">
                Choose a {weaponPopup.category.replace('_', ' ')} weapon
              </h3>
              <button onClick={() => setWeaponPopup(null)} className="text-text-muted hover:text-parchment">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {filteredWeapons.map((weapon: any) => (
                <button
                  key={weapon.name}
                  type="button"
                  onClick={() => handleWeaponSelect(weapon)}
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
              {filteredWeapons.length === 0 && (
                <p className="text-xs text-parchment/50 text-center py-3">
                  No weapons available in this category.
                </p>
              )}
            </div>
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
              
              return (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border bg-charcoal px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-parchment">{item.name}</span>
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
