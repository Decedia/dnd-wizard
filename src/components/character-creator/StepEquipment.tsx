"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";
import { InfoButton } from "@/components/InfoButton";
import { DescriptionModal } from "@/components/InfoButton";
import { DamageBadge, getDamageTypeColor, getDamageTypeBgColor } from "@/components/character-sheet/DamageBadge";
import { SwordIcon as Sword, DaggerIcon as Dagger, BowArrowIcon as BowArrow, CrossbowIcon as Crossbow, BattleAxeIcon as BattleAxe, HammerIcon as Hammer, WizardStaffIcon as Staff } from "@/components/icons";
import { SourceBadge } from "@/components/SourceBadge";

const weaponTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  martial_melee: Sword,
  martial_ranged: BowArrow,
  martial: Sword,
  simple_melee: Dagger,
  simple_ranged: Crossbow,
  simple: Dagger,
};

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

const MUSICAL_INSTRUMENTS = [
  "Bagpipes", "Drum", "Flute", "Horn", "Lute", "Lyre", "Pan flute", "Shawm", "Viol"
];

const ARCANE_FOCUS_TYPES = [
  "Crystal", "Orb", "Rod", "Staff", "Wand"
];

const HOLY_SYMBOL_TYPES = [
  "Amulet", "Emblem", "Reliquary"
];

const DRUIDIC_FOCUS_TYPES = [
  "Sprig of Mistletoe", "Totem", "Wooden Staff", "Yew Wand"
];

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [popupGroup, setPopupGroup] = useState<{ group: ChoiceGroup; optionIndex: number } | null>(null);
  const [confirmedSelections, setConfirmedSelections] = useState<Record<string, string[]>>({});

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(data.sources), [data.sources]);
  const armors = useMemo(() => getStaticArmors(data.sources), [data.sources]);
  const allEquipment = useMemo(() => getEquipmentNames(data.sources), [data.sources]);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => buildChoiceGroups(startingEquipment), [startingEquipment]);

  const getGroupIndex = useCallback((groupId: string) => {
    const match = groupId.match(/choice-(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }, []);

  const isMusicalInstrument = useCallback((itemName: string) => {
    return MUSICAL_INSTRUMENTS.some(i => i.toLowerCase() === itemName.toLowerCase());
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
        description: weapon.description || "",
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

    if (isMusicalInstrument(itemName)) {
      return {
        type: "instrument",
        description: "Musical instrument. Bards use musical instruments as a spellcasting focus.",
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
  }, [weapons, armors, isMusicalInstrument]);

  const isOptionSelected = useCallback((group: ChoiceGroup, optionIndex: number): boolean => {
    const groupIndex = getGroupIndex(group.id);

    return data.inventory.some(item => item.choiceGroupIndex === groupIndex && item.choiceOptionIndex === optionIndex);
  }, [data.inventory, getGroupIndex]);

  const getSelectedWeaponForGroup = useCallback((groupId: string) => {
    const groupIndex = getGroupIndex(groupId);
    return data.inventory.find(item => item.choiceGroupIndex === groupIndex && item.itemType === "weapon");
  }, [data.inventory, getGroupIndex]);

  const getSelectedWeaponsForGroup = useCallback((groupId: string, optionIndex?: number) => {
    const groupIndex = getGroupIndex(groupId);
    return data.inventory.filter(item => {
      if (item.choiceGroupIndex !== groupIndex || item.itemType !== "weapon") return false;
      if (optionIndex !== undefined && item.choiceOptionIndex !== optionIndex) return false;
      return true;
    });
  }, [data.inventory, getGroupIndex]);

  const getSelectedItemForGroup = useCallback((groupId: string) => {
    const groupIndex = getGroupIndex(groupId);
    return data.inventory.find(item => item.choiceGroupIndex === groupIndex);
  }, [data.inventory, getGroupIndex]);

  const getOptionLabel = useCallback((option: EquipmentOption): string => {
    if (option.isWeaponChoice) {
      const count = option.selectionCount || 1;
      return `Select ${count > 1 ? `${count} ` : "a "}${option.weaponType?.replace('_', ' ')} weapon${count > 1 ? "s" : ""}`;
    }
    if (option.isInstrumentChoice) return "Select a musical instrument";
    if (option.isArcaneFocusChoice) return "Select an arcane focus";
    if (option.isHolySymbolChoice) return "Select a holy symbol";
    if (option.isDruidicFocusChoice) return "Select a druidic focus";
    if (option.items.length === 1) return option.items[0].name;
    return option.items.map(i => `${i.quantity || 1}× ${i.name}`).join(", ");
  }, []);

  const getOptionSummary = useCallback((option: EquipmentOption): string => {
    if (option.items.length === 0) return "";
    if (option.items.length === 1) {
      const info = getItemInfo(option.items[0].name);
      if (info?.type === "weapon") return `${info.damageDice} ${info.damageType}`;
      if (info?.type === "armor") return `AC ${info.baseAC}`;
      if (info?.type === "instrument") return "Spellcasting focus";
    }
    return `${option.items.length} items`;
  }, [getItemInfo]);

  const handleOptionClick = useCallback((group: ChoiceGroup, optionIndex: number) => {
    const option = group.options[optionIndex];
    const groupIndex = getGroupIndex(group.id);

    if (option.isWeaponChoice || option.isInstrumentChoice || option.isArcaneFocusChoice || option.isHolySymbolChoice || option.isDruidicFocusChoice) {
      setPopupGroup({ group, optionIndex });
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
        itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
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
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleWeaponSelect = useCallback((weapon: any, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const option = choiceGroups.find(g => getGroupIndex(g.id) === groupIndex)?.options[optionIndex];
    const itemInfo = getItemInfo(weapon.name);
    const selectionCount = option?.selectionCount || 1;

    const existingWeapons = data.inventory.filter(item => item.choiceGroupIndex === groupIndex && item.itemType === "weapon" && item.choiceOptionIndex === optionIndex);

    const alreadySelectedIndex = existingWeapons.findIndex(w => w.name === weapon.name);
    if (alreadySelectedIndex >= 0) {
      const newInventory = data.inventory.filter(item => item.id !== existingWeapons[alreadySelectedIndex].id);
      onChange({ inventory: newInventory });
      return;
    }

    if (existingWeapons.length >= selectionCount) {
      return;
    }

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
      choiceOptionIndex: optionIndex,
    };

    const nextInventory = [...data.inventory, weaponItem];

    if (option?.description?.toLowerCase().includes("shield") && !data.inventory.some(i => i.name === "Shield" && i.choiceGroupIndex === groupIndex)) {
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
  }, [data.inventory, getGroupIndex, getItemInfo, onChange, choiceGroups]);

  const handleInstrumentSelect = useCallback((instrumentName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const itemInfo = getItemInfo(instrumentName);
    const newItem: Character["inventory"][number] = {
      id: generateId(),
      name: instrumentName,
      quantity: 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "instrument" as const,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: optionIndex,
    };

    onChange({ inventory: [...newInventory, newItem] });
    setPopupGroup(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleArcaneFocusSelect = useCallback((focusName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const itemInfo = getItemInfo(focusName);
    const newItem: Character["inventory"][number] = {
      id: generateId(),
      name: focusName,
      quantity: 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "item" as const,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: optionIndex,
    };

    onChange({ inventory: [...newInventory, newItem] });
    setPopupGroup(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleHolySymbolSelect = useCallback((symbolName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const itemInfo = getItemInfo(symbolName);
    const newItem: Character["inventory"][number] = {
      id: generateId(),
      name: symbolName,
      quantity: 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "item" as const,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: optionIndex,
    };

    onChange({ inventory: [...newInventory, newItem] });
    setPopupGroup(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleDruidicFocusSelect = useCallback((focusName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const itemInfo = getItemInfo(focusName);
    const newItem: Character["inventory"][number] = {
      id: generateId(),
      name: focusName,
      quantity: 1,
      equipped: false,
      source: "srd" as const,
      description: itemInfo ? JSON.stringify(itemInfo) : "",
      itemType: "item" as const,
      choiceGroupIndex: groupIndex,
      choiceOptionIndex: optionIndex,
    };

    onChange({ inventory: [...newInventory, newItem] });
    setPopupGroup(null);
  }, [data.inventory, getGroupIndex, getItemInfo, onChange]);

  const handleChoiceRemove = useCallback((group: ChoiceGroup) => {
    const groupIndex = getGroupIndex(group.id);
    const newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);
    onChange({ inventory: newInventory });
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
              itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
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
      damageBonus: `${damageBonus}`,
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

  const getCategoryDamagePreview = useCallback((weaponType: string) => {
    const categoryWeapons = getWeaponsByCategory(weaponType);
    if (categoryWeapons.length === 0) return null;

    const diceSet = new Set<string>();
    const typesSet = new Set<string>();
    categoryWeapons.forEach((w: any) => {
      if (w.damage?.damage_dice) diceSet.add(w.damage.damage_dice);
      if (w.damage?.damage_type?.name) typesSet.add(w.damage.damage_type.name);
    });

    return {
      dice: Array.from(diceSet).join("/"),
      types: Array.from(typesSet).join("/"),
    };
  }, [getWeaponsByCategory]);

  const renderItemInfo = useCallback((itemInfo: any, compact: boolean = false) => {
    if (!itemInfo) return null;

    if (itemInfo.type === "weapon") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <DamageBadge type={itemInfo.damageType} size="sm" showLabel={true} />
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: getDamageTypeColor(itemInfo.damageType), backgroundColor: getDamageTypeBgColor(itemInfo.damageType) }}
          >
            {itemInfo.damageDice}
          </span>
          {itemInfo.properties && itemInfo.properties.length > 0 && (
            <span className="text-[var(--color-text-secondary)] font-medium">{itemInfo.properties.join(", ")}</span>
          )}
          {itemInfo.category && <span className="text-[var(--color-text-secondary)] font-medium">({itemInfo.category})</span>}
        </span>
      );
    }

    if (itemInfo.type === "armor") {
      return (
        <span>
          AC {itemInfo.baseAC}{itemInfo.maxDex !== null ? ` + Dex (max +${itemInfo.maxDex})` : " + Dex"}
          {itemInfo.armorType && <span className="ml-2 text-[var(--color-text-secondary)] font-medium">({itemInfo.armorType})</span>}
          {!compact && itemInfo.description && <InfoButton title="Armor Details" description={itemInfo.description} />}
        </span>
      );
    }

    if (itemInfo.type === "instrument") {
      return <span>Musical instrument</span>;
    }

    if (itemInfo.type === "item") {
      return (
        <span>
          {itemInfo.description && <InfoButton title="Item Details" description={itemInfo.description} />}
          {itemInfo.contents && (
            <span className="ml-2 text-[var(--color-text-secondary)] font-medium">Contains: {itemInfo.contents}</span>
          )}
        </span>
      );
    }

    return null;
  }, []);

  const getItemDescription = useCallback((itemInfo: any): string => {
    if (!itemInfo) return "";

    const parts: string[] = [];

    if (itemInfo.type === "weapon") {
      if (itemInfo.description) parts.push(itemInfo.description);
      if (itemInfo.damageDice) parts.push(`Damage: [dice]${itemInfo.damageDice}[/dice] [damage]${itemInfo.damageType || ""}[/damage]`);
      if (itemInfo.category) parts.push(`Category: ${itemInfo.category}`);
      if (itemInfo.properties && itemInfo.properties.length > 0) parts.push(`Properties: ${itemInfo.properties.join(", ")}`);
    } else if (itemInfo.type === "armor") {
      if (itemInfo.description) parts.push(itemInfo.description);
      parts.push(`AC: ${itemInfo.baseAC} + Dex${itemInfo.maxDex !== null ? ` (max +${itemInfo.maxDex})` : ""}`);
      if (itemInfo.armorType) parts.push(`Type: ${itemInfo.armorType}`);
    } else if (itemInfo.type === "instrument") {
      parts.push("Musical instrument. Bards use musical instruments as a spellcasting focus.");
    } else if (itemInfo.type === "item") {
      if (itemInfo.description) parts.push(itemInfo.description);
      if (itemInfo.contents) parts.push(`Contains: ${itemInfo.contents}`);
    }

    return parts.join("\n");
  }, []);

  const isGroupVisible = useCallback((group: ChoiceGroup): boolean => {
    if (!group.requiresChoice) return true;
    const requiredGroupId = group.requiresChoice.groupId;
    const requiredOptionIndex = group.requiresChoice.optionIndex;
    const requiredGroupIndex = getGroupIndex(requiredGroupId);
    return data.inventory.some(item => item.choiceGroupIndex === requiredGroupIndex && item.choiceOptionIndex === requiredOptionIndex);
  }, [data.inventory, getGroupIndex]);

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.filter(isGroupVisible).every(group => {
      const groupIndex = getGroupIndex(group.id);
      return data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    });
  }, [choiceGroups, data.inventory, getGroupIndex, isGroupVisible]);

  const popupOption = popupGroup ? popupGroup.group.options[popupGroup.optionIndex] : null;
  const popupCategoryWeapons = popupOption?.isWeaponChoice ? getWeaponsByCategory(popupOption.weaponType || "") : [];
  const popupSelectedWeapons = popupGroup ? getSelectedWeaponsForGroup(popupGroup.group.id, popupGroup.optionIndex) : [];

  return (
    <StepCard title="Equipment" hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.">
      {choiceGroups.length > 0 && (
        <div className="mb-5">
          <span className="text-card-title text-[var(--color-text-primary)]">
            Choose Your Equipment
          </span>
          <div className="space-y-4">
             {choiceGroups.filter(isGroupVisible).map((group) => {
               const groupIndex = getGroupIndex(group.id);
               const hasSelection = data.inventory.some(item => item.choiceGroupIndex === groupIndex);

                 return (
                   <div key={group.id} className="space-y-2">
                     <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Select from options below:</p>
                     <div className="space-y-2">
                         {group.options.map((option, optionIndex) => {
                         const isSelected = isOptionSelected(group, optionIndex);
                         const isWeaponChoice = option.isWeaponChoice;
                         const isPopupChoice = option.isWeaponChoice || option.isInstrumentChoice || option.isArcaneFocusChoice || option.isHolySymbolChoice || option.isDruidicFocusChoice;
                         const primaryItem = option.items[0];
                         const primaryInfo = primaryItem?.name ? getItemInfo(primaryItem.name) : null;
                         const selectedWeapon = isWeaponChoice ? getSelectedWeaponForGroup(group.id) : null;
                          const selectedWeapons = isWeaponChoice ? getSelectedWeaponsForGroup(group.id, optionIndex) : [];
                         const weaponStats = selectedWeapon ? getWeaponStats(selectedWeapon.name, selectedWeapon.category) : null;
                         const selectedItem = isPopupChoice && !isWeaponChoice ? getSelectedItemForGroup(group.id) : null;
                         const selectionCount = option.selectionCount || 1;
                         const hasMultiSelect = selectionCount > 1;
                         const isDisabled = hasSelection && !isSelected;

                         if (isWeaponChoice) {
                           const categoryWeapons = getWeaponsByCategory(option.weaponType || "");
                            const needsMoreSelections = selectedWeapons.length < selectionCount;

                              return (
                                 <div
                                   key={optionIndex}
                                   className={`w-full px-3 py-2 text-left text-sm transition-all rounded-[var(--border-radius-sm)] ${
                                     isSelected
                                       ? "border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                                       : isDisabled
                                         ? "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] opacity-20"
                                         : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)]"
                                   }`}
                                 >
                                  {isSelected && selectedWeapons.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[var(--color-surface)]">{getOptionLabel(option)}</span>
                                        {needsMoreSelections && (
                                          <button
                                            type="button"
                                            onClick={() => setPopupGroup({ group, optionIndex })}
                                            className="text-[10px] text-[var(--color-surface)]/70 hover:text-[var(--color-surface)] underline"
                                          >
                                            + Add more ({selectedWeapons.length}/{selectionCount})
                                          </button>
                                        )}
                                      </div>
                                      {selectedWeapons.map((weapon, wIdx) => {
                                        const wStats = getWeaponStats(weapon.name, weapon.category);
                                        const WIcon = weaponTypeIcons[option.weaponType || ""] || Sword;
                                        return (
                                           <div key={weapon.id || wIdx} className="flex items-start justify-between p-2 rounded border border-[var(--color-surface)] bg-[var(--color-surface)]/10">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <WIcon className="h-4 w-4 text-[var(--color-surface)] shrink-0" />
                                                <span className="text-body font-semibold text-[var(--color-surface)]">{weapon.name}</span>
                                              </div>
                                              {wStats && (
                                                <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                                                  <DamageBadge type={wStats.damageType} size="sm" showLabel={true} />
                                                  <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                    {wStats.damageDice}
                                                  </span>
                                                  <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                    {wStats.abilityKey} {wStats.damageBonus}
                                                  </span>
                                                  <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                    {wStats.attackBonus} to hit
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newInventory = data.inventory.filter(item => item.id !== weapon.id);
                                                onChange({ inventory: newInventory });
                                              }}
                                              className="text-[var(--color-surface)] hover:text-[var(--color-error-300)] ml-2 text-lg leading-none"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => !isDisabled && handleOptionClick(group, optionIndex)}
                                      disabled={isDisabled}
                                      className={`w-full text-left text-body ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                      <span>{getOptionLabel(option)}</span>
                                    </button>
                                  )}
                              </div>
                          );
                        }

                              return (
                               <div
                                 key={optionIndex}
                                 className={`w-full px-3 py-2 text-left text-sm transition-all rounded-[var(--border-radius-sm)] ${
                                   isSelected
                                     ? "border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                                     : isDisabled
                                       ? "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] opacity-20 cursor-not-allowed"
                                       : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)]"
                                 }`}
                               >
                                  {isSelected ? (
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          {primaryInfo?.type === "weapon" && (() => {
                                            const WIcon = weaponTypeIcons[primaryInfo.category === "Ranged" ? "simple_ranged" : "simple_melee"] || Sword;
                                            return <WIcon className={`h-4 w-4 shrink-0 ${isSelected ? "text-[var(--color-surface)]" : "text-[var(--color-text-muted)]"}`} />;
                                          })()}
                                          <span className="text-body font-semibold text-[var(--color-surface)]">{getOptionLabel(option)}</span>
                                        </div>
                                        {primaryInfo?.type === "weapon" && (() => {
                                          const wStats = primaryItem?.name ? getWeaponStats(primaryItem.name, primaryInfo.category) : null;
                                          return wStats ? (
                                            <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                                              <DamageBadge type={wStats.damageType} size="sm" showLabel={true} />
                                              <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                {wStats.damageDice}
                                              </span>
                                              <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                {wStats.abilityKey} {wStats.damageBonus}
                                              </span>
                                              <span className="text-[10px] font-bold text-[var(--color-surface)] bg-[var(--color-surface)]/20 px-1.5 py-0.5 rounded">
                                                {wStats.attackBonus} to hit
                                              </span>
                                            </div>
                                          ) : null;
                                        })()}
                                        {primaryInfo?.type !== "weapon" && (
                                          <div className="text-[10px] text-[var(--color-surface)]/70 mt-0.5">{getOptionSummary(option)}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleChoiceRemove(group)}
                                          className="text-[var(--color-text-muted)] hover:text-[var(--color-error-500)] ml-1 text-lg leading-none"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => !isDisabled && handleOptionClick(group, optionIndex)}
                                      disabled={isDisabled}
                                      className={`w-full text-left text-body ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {primaryInfo?.type === "weapon" && (() => {
                                          const WIcon = weaponTypeIcons[primaryInfo.category === "Ranged" ? "simple_ranged" : "simple_melee"] || Sword;
                                          return <WIcon className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />;
                                        })()}
                                        <span>{getOptionLabel(option)}</span>
                                      </div>
                                      {primaryInfo?.type === "weapon" && (() => {
                                        const wStats = primaryItem?.name ? getWeaponStats(primaryItem.name, primaryInfo.category) : null;
                                        return wStats ? (
                                          <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                                            <DamageBadge type={wStats.damageType} size="sm" showLabel={true} />
                                            <span
                                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                              style={{ color: getDamageTypeColor(wStats.damageType), backgroundColor: getDamageTypeBgColor(wStats.damageType) }}
                                            >
                                              {wStats.damageDice}
                                            </span>
                                            <span className="text-[10px] font-bold text-[var(--color-info-600)] bg-[var(--color-info-50)] px-1.5 py-0.5 rounded">
                                              {wStats.abilityKey} {wStats.damageBonus}
                                            </span>
                                            <span className="text-[10px] font-bold text-[var(--color-accent-orange-600)] bg-[var(--color-accent-orange-50)] px-1.5 py-0.5 rounded">
                                              {wStats.attackBonus} to hit
                                            </span>
                                          </div>
                                        ) : null;
                                      })()}
                                      {primaryInfo?.type !== "weapon" && getOptionSummary(option) && (
                                        <span className="block text-[10px] text-[var(--color-text-muted)] mt-0.5">{getOptionSummary(option)}</span>
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
               const wStats = itemInfo?.type === "weapon" ? getWeaponStats(item.name, itemInfo.category) : null;

               return (
                  <div key={item.id} className="flex flex-col gap-1 px-3 py-2.5 border border-[var(--color-border)] rounded-[var(--border-radius-sm)] bg-[var(--color-surface)]">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       {itemInfo?.type === "weapon" && (() => {
                         const WIcon = weaponTypeIcons[itemInfo.category === "Ranged" ? "simple_ranged" : "simple_melee"] || Sword;
                         return <WIcon className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />;
                       })()}
                       <span className="text-body text-[var(--color-text-primary)]">{item.name}</span>
                       {isGranted && (
                         <span className="badge text-[var(--color-text-primary)] bg-[var(--color-bg)]">GRANTED</span>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-[var(--color-text-muted)]">x{item.quantity || 1}</span>
                       {itemInfo && (
                         <InfoButton
                           title={item.name}
                           description={getItemDescription(itemInfo)}
                         />
                       )}
                     </div>
                   </div>
                   {wStats && (
                     <div className="flex items-center gap-1.5 ml-6">
                       <DamageBadge type={wStats.damageType} size="sm" showLabel={true} />
                       <span
                         className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                         style={{ color: getDamageTypeColor(wStats.damageType), backgroundColor: getDamageTypeBgColor(wStats.damageType) }}
                       >
                         {wStats.damageDice}
                       </span>
                       <span className="text-[10px] font-bold text-[var(--color-info-600)] bg-[var(--color-info-50)] px-1.5 py-0.5 rounded">
                         {wStats.abilityKey} {wStats.damageBonus}
                       </span>
                       <span className="text-[10px] font-bold text-[var(--color-accent-orange-600)] bg-[var(--color-accent-orange-50)] px-1.5 py-0.5 rounded">
                         {wStats.attackBonus} to hit
                       </span>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        )}
      </div>

      {popupGroup && popupOption && (
        <DescriptionModal
          title={popupOption.isWeaponChoice ? `Choose ${popupOption.selectionCount || 1} ${popupOption.weaponType?.replace('_', ' ')} weapon${(popupOption.selectionCount || 1) > 1 ? "s" : ""}` : popupOption.isInstrumentChoice ? "Choose a musical instrument" : popupOption.isArcaneFocusChoice ? "Choose an arcane focus" : popupOption.isHolySymbolChoice ? "Choose a holy symbol" : popupOption.isDruidicFocusChoice ? "Choose a druidic focus" : "Select an item"}
          content=""
          onClose={() => setPopupGroup(null)}
          showConfirm={popupOption.isWeaponChoice && (popupOption.selectionCount || 1) > 1}
          onConfirm={() => setPopupGroup(null)}
          confirmLabel={`Confirm (${popupSelectedWeapons.length}/${popupOption.selectionCount || 1})`}
        >
          {popupOption.isWeaponChoice && (
            <div className="mb-3 p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)]">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                Selected: {popupSelectedWeapons.length} / {popupOption.selectionCount || 1}
              </div>
              {popupSelectedWeapons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {popupSelectedWeapons.map((w: any) => (
                      <span key={w.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)]">
                      {w.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newInventory = data.inventory.filter(item => item.id !== w.id);
                          onChange({ inventory: newInventory });
                        }}
                        className="text-[var(--color-success-600)] hover:text-[var(--color-error-500)] ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            {popupOption.isWeaponChoice && popupCategoryWeapons.map((weapon: any) => {
              const wStats = getWeaponStats(weapon.name, weapon.category_range);
              const isWeaponSelected = popupSelectedWeapons.some((w: any) => w.name === weapon.name);
              const selectionCount = popupOption.selectionCount || 1;
              const isDisabled = !isWeaponSelected && popupSelectedWeapons.length >= selectionCount;
              const WIcon = weaponTypeIcons[popupOption.weaponType || ""] || Sword;
              return (
                 <button
                    key={weapon.name}
                    type="button"
                    onClick={() => handleWeaponSelect(weapon, popupGroup.group.id, popupGroup.optionIndex)}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-left text-sm rounded-[var(--border-radius-sm)] transition-colors ${
                      isWeaponSelected
                        ? "border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                        : isDisabled
                          ? "border border-[var(--color-border)] opacity-20 cursor-not-allowed"
                          : "border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WIcon className={`h-4 w-4 shrink-0 ${isWeaponSelected ? "text-[var(--color-surface)]" : "text-[var(--color-text-muted)]"}`} />
                        <span className={`text-body ${isWeaponSelected ? "text-[var(--color-surface)]" : "text-[var(--color-text-primary)]"}`}>{weapon.name}</span>
                      </div>
                      {wStats && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWeaponSelected ? "text-[var(--color-surface)] bg-[var(--color-surface)]/20" : "text-[var(--color-accent-orange-600)] bg-[var(--color-accent-orange-50)]"}`}>
                          {wStats.attackBonus} to hit
                        </span>
                      )}
                    </div>
                    {wStats && (
                      <div className="flex items-center gap-1.5 mt-1 ml-6">
                        <DamageBadge type={wStats.damageType} size="sm" showLabel={true} />
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWeaponSelected ? "text-[var(--color-surface)] bg-[var(--color-surface)]/20" : ""}`}
                          style={!isWeaponSelected ? { color: getDamageTypeColor(wStats.damageType), backgroundColor: getDamageTypeBgColor(wStats.damageType) } : undefined}
                        >
                          {wStats.damageDice}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWeaponSelected ? "text-[var(--color-surface)] bg-[var(--color-surface)]/20" : "text-[var(--color-info-600)] bg-[var(--color-info-50)]"}`}>
                          {wStats.abilityKey} {wStats.damageBonus}
                        </span>
                      </div>
                    )}
                  </button>
              );
            })}
            {popupOption.isInstrumentChoice && MUSICAL_INSTRUMENTS.map((instrument) => (
              <button
                key={instrument}
                type="button"
                onClick={() => handleInstrumentSelect(instrument, popupGroup.group.id, popupGroup.optionIndex)}
                className="w-full card px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-body text-[var(--color-text-primary)]">{instrument}</span>
                <InfoButton
                  title={instrument}
                  description="Musical instrument. Bards use musical instruments as a spellcasting focus."
                />
              </button>
            ))}
            {popupOption.isArcaneFocusChoice && ARCANE_FOCUS_TYPES.map((focus) => (
              <button
                key={focus}
                type="button"
                onClick={() => handleArcaneFocusSelect(focus, popupGroup.group.id, popupGroup.optionIndex)}
                className="w-full card px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-body text-[var(--color-text-primary)]">{focus}</span>
                <InfoButton
                  title={focus}
                  description="An arcane focus is a special item designed to channel arcane magic. A sorcerer, warlock, or wizard can use such an item as a spellcasting focus."
                />
              </button>
            ))}
            {popupOption.isHolySymbolChoice && HOLY_SYMBOL_TYPES.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => handleHolySymbolSelect(symbol, popupGroup.group.id, popupGroup.optionIndex)}
                className="w-full card px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-body text-[var(--color-text-primary)]">{symbol}</span>
                <InfoButton
                  title={symbol}
                  description="A holy symbol is a representation of a deity or pantheon. A cleric or paladin can use a holy symbol as a spellcasting focus."
                />
              </button>
            ))}
            {popupOption.isDruidicFocusChoice && DRUIDIC_FOCUS_TYPES.map((focus) => (
              <button
                key={focus}
                type="button"
                onClick={() => handleDruidicFocusSelect(focus, popupGroup.group.id, popupGroup.optionIndex)}
                className="w-full card px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-body text-[var(--color-text-primary)]">{focus}</span>
                <InfoButton
                  title={focus}
                  description="A druidic focus is a special item used by druids to channel nature magic. It can be a sprig of mistletoe, a totem, a wooden staff, or a yew wand."
                />
              </button>
            ))}
          </div>
        </DescriptionModal>
      )}
    </StepCard>
  );
}
