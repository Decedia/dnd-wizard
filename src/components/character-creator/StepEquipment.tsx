"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";
import { InfoButton } from "@/components/InfoButton";
import { BasePopup } from "@/components/BasePopup";
import { DamageBadge, getDamageTypeColor, getDamageTypeBgColor } from "@/components/character-sheet/DamageBadge";
import { SwordIcon as Sword, DaggerIcon as Dagger, BowArrowIcon as BowArrow, CrossbowIcon as Crossbow, BattleAxeIcon as BattleAxe, HammerIcon as Hammer, WizardStaffIcon as Staff, PolearmIcon as Polearm, WhipIcon as Whip, TridentIcon as Trident, MaceIcon as Mace, ClubIcon as Club } from "@/components/icons";
import { SourceBadge } from "@/components/SourceBadge";
import { ItemSlot, ItemDetailPanel, InventoryGrid, type ItemSlotData } from "@/components/character-sheet/InventoryGrid";

const weaponTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  martial_melee: Sword,
  martial_ranged: BowArrow,
  martial: Sword,
  simple_melee: Dagger,
  simple_ranged: Crossbow,
  simple: Dagger,
};

const weaponNameIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Battleaxe: BattleAxe,
  Greataxe: BattleAxe,
  Handaxe: BattleAxe,
  "War pick": BattleAxe,
  Glaive: Polearm,
  Halberd: Polearm,
  Lance: Polearm,
  Pike: Polearm,
  Whip: Whip,
  Trident: Trident,
  Spear: Trident,
  Javelin: Trident,
  Club: Club,
  Greatclub: Club,
  "Light hammer": Hammer,
  Mace: Mace,
  Maul: Hammer,
  Morningstar: Hammer,
  Warhammer: Hammer,
  Flail: Hammer,
  Quarterstaff: Staff,
  Greatsword: Sword,
  Longsword: Sword,
  Shortsword: Sword,
  Scimitar: Sword,
  Rapier: Dagger,
  Dagger: Dagger,
  Dart: Dagger,
  Sickle: Dagger,
  Shortbow: BowArrow,
  Longbow: BowArrow,
  Crossbow: Crossbow,
  "Crossbow, hand": Crossbow,
  "Crossbow, heavy": Crossbow,
  "Crossbow, light": Crossbow,
  Blowgun: Crossbow,
  Sling: BowArrow,
};

const getWeaponIcon = (name: string, weaponType?: string) => {
  return weaponNameIcons[name] || weaponTypeIcons[weaponType || ""] || Sword;
};

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
  onNext?: () => void;
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

export function StepEquipment({ data, onChange, onNext }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class, data.ruleset) : null;
  const [popupGroup, setPopupGroup] = useState<{ group: ChoiceGroup; optionIndex: number } | null>(null);
  const [confirmedSelections, setConfirmedSelections] = useState<Record<string, string[]>>({});

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(data.sources, data.ruleset), [data.sources, data.ruleset]);
  const armors = useMemo(() => getStaticArmors(data.sources, data.ruleset), [data.sources, data.ruleset]);
  const allEquipment = useMemo(() => getEquipmentNames(data.sources), [data.sources]);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => buildChoiceGroups(startingEquipment, data.ruleset), [startingEquipment, data.ruleset]);

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
        icon: "⚔️",
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
        icon: "🛡️",
      };
    }

    if (isMusicalInstrument(itemName)) {
      return {
        type: "instrument",
        description: "Musical instrument. Bards use musical instruments as a spellcasting focus.",
        icon: "🎵",
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
        icon: "📦",
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

    let newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);

    const isFirstChoiceGroup = groupIndex === 0;

    if (isFirstChoiceGroup) {
      if (optionIndex === 1) {
        newInventory = newInventory.filter(item => item.choiceGroupIndex === 0);
      } else {
        newInventory = newInventory.filter(item => {
          if (item.choiceGroupIndex === 0 && item.choiceOptionIndex === 1) return false;
          return true;
        });
      }
    }

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

  const handleGoldSelect = useCallback(() => {
    // Gold option removed - not implemented
  }, []);

  const autoGrantItems = useCallback(() => {
    const newInventory = [...data.inventory];
    const grantedItems: Character["inventory"][number][] = [];
    let hasChanges = false;

    startingEquipment.forEach((entry: any) => {
      if (!entry.granted || !entry.items) return;

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
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
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

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.every(group => {
      const groupIndex = getGroupIndex(group.id);
      return data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    });
  }, [choiceGroups, data.inventory, getGroupIndex]);

  const popupOption = popupGroup ? popupGroup.group.options[popupGroup.optionIndex] : null;
  const popupCategoryWeapons = popupOption?.isWeaponChoice ? getWeaponsByCategory(popupOption.weaponType || "") : [];
  const popupSelectedWeapons = popupGroup ? getSelectedWeaponsForGroup(popupGroup.group.id, popupGroup.optionIndex) : [];

  const grantedItems = useMemo(() => {
    return data.inventory.filter(item => item.isGranted);
  }, [data.inventory]);

  const choiceItems = useMemo(() => {
    return data.inventory.filter(item => item.choiceGroupIndex !== undefined && !item.isGranted);
  }, [data.inventory]);

  const mapToSlotData = useCallback((item: Character["inventory"][number]): ItemSlotData => {
    const itemInfo = item.description ? JSON.parse(item.description) : null;
    return {
      id: item.id,
      name: item.name || "Unnamed Item",
      icon: (itemInfo as any)?.icon || "📦",
      category: (itemInfo as any)?.category || "misc",
      itemType: item.itemType || "item",
      equipped: item.equipped,
      quantity: item.quantity,
      description: (itemInfo as any)?.description || item.description || "",
      damageDice: item.damageDice,
      damageType: item.damageType,
      properties: item.properties,
      baseAC: item.baseAC,
      armorType: item.armorType,
      maxDexBonus: item.maxDexBonus,
      stealthDisadvantage: (itemInfo as any)?.stealthDisadvantage,
      strengthRequirement: (itemInfo as any)?.strengthRequirement,
      toolUse: (itemInfo as any)?.toolUse,
      associatedAbility: (itemInfo as any)?.associatedAbility,
      effect: (itemInfo as any)?.effect,
      uses: (itemInfo as any)?.uses,
      value: (itemInfo as any)?.value,
      weight: (itemInfo as any)?.weight ?? item.weight ?? null,
      hand: item.hand,
      range: (item as any).range,
      versatileDice: (item as any).versatileDice,
      isGranted: item.isGranted,
      choiceGroupIndex: item.choiceGroupIndex,
      choiceOptionIndex: item.choiceOptionIndex,
    };
  }, []);

  const grantedSlotItems = useMemo(() => grantedItems.map(mapToSlotData), [grantedItems, mapToSlotData]);
  const choiceSlotItems = useMemo(() => choiceItems.map(mapToSlotData), [choiceItems, mapToSlotData]);

  const handleChoiceSlotClick = useCallback((group: ChoiceGroup) => {
    const groupIndex = getGroupIndex(group.id);
    const hasPopupChoice = group.options.some(opt =>
      opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice
    );

    if (hasPopupChoice) {
      const selectedOptionIndex = group.options.findIndex(opt => {
        if (opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice) {
          return data.inventory.some(item => item.choiceGroupIndex === groupIndex && item.choiceOptionIndex === group.options.indexOf(opt));
        }
        return false;
      });

      if (selectedOptionIndex >= 0) {
        setPopupGroup({ group, optionIndex: selectedOptionIndex });
      } else {
        const firstPopupIndex = group.options.findIndex(opt =>
          opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice
        );
        if (firstPopupIndex >= 0) {
          setPopupGroup({ group, optionIndex: firstPopupIndex });
        }
      }
    } else {
      const firstUnselected = group.options.findIndex((_, idx) => !isOptionSelected(group, idx));
      if (firstUnselected >= 0) {
        handleOptionClick(group, firstUnselected);
      }
    }
  }, [data.inventory, getGroupIndex, isOptionSelected, handleOptionClick]);

  return (
    <StepCard
      title="Equipment"
      hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear."
    >
      <div className="space-y-5">
        {grantedSlotItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-card-title text-[var(--color-text-primary)]">Granted Equipment</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                LOCKED
              </span>
            </div>
            <InventoryGrid
              items={grantedSlotItems}
              totalSlots={grantedSlotItems.length}
              onItemClick={() => {}}
              showEmptySlots={false}
              lockedSlotCount={grantedSlotItems.length}
            />
          </div>
        )}

        <div>
          <span className="text-card-title text-[var(--color-text-primary)] block mb-2">
            Your Choices
          </span>
          <div className="grid grid-cols-4 gap-[6px]">
            {choiceGroups.map((group) => {
              const groupIndex = getGroupIndex(group.id);
              const selectedItem = data.inventory.find(item => item.choiceGroupIndex === groupIndex);
              const hasSelection = !!selectedItem;
              const itemInfo = selectedItem?.description ? JSON.parse(selectedItem.description) : null;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleChoiceSlotClick(group)}
                  className={`aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-1 p-1.5 transition-all relative ${
                    hasSelection
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)]/10"
                      : "border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  {hasSelection ? (
                    <>
                      <span className="text-2xl leading-none">{(itemInfo as any)?.icon || "📦"}</span>
                      <span className="text-[9px] font-bold text-[var(--color-text-secondary)] text-center leading-tight line-clamp-2 w-full">
                        {selectedItem.name}
                      </span>
                      {selectedItem.quantity > 1 && (
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">x{selectedItem.quantity}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-2xl text-[var(--color-text-muted)] leading-none">?</span>
                      <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Choose</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {popupGroup && popupOption && (
          <BasePopup
            isOpen={true}
            onClose={() => setPopupGroup(null)}
            title={popupOption.isWeaponChoice ? `Choose ${popupOption.selectionCount || 1} ${popupOption.weaponType?.replace('_', ' ')} weapon${(popupOption.selectionCount || 1) > 1 ? "s" : ""}` : popupOption.isInstrumentChoice ? "Choose a musical instrument" : popupOption.isArcaneFocusChoice ? "Choose an arcane focus" : popupOption.isHolySymbolChoice ? "Choose a holy symbol" : popupOption.isDruidicFocusChoice ? "Choose a druidic focus" : "Select an item"}
            confirmLabel={popupOption.isWeaponChoice ? (popupOption.selectionCount && popupOption.selectionCount > 1 ? `Confirm (${popupSelectedWeapons.length}/${popupOption.selectionCount})` : "Confirm") : undefined}
            onConfirm={() => setPopupGroup(null)}
            cancelLabel="Cancel"
            onCancel={() => setPopupGroup(null)}
            showFooter={popupOption.isWeaponChoice}
            confirmDisabled={popupOption.isWeaponChoice && popupSelectedWeapons.length !== (popupOption.selectionCount || 1)}
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
                const WIcon = getWeaponIcon(weapon.name, popupOption.weaponType);
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
                  className="w-full px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  {instrument}
                </button>
              ))}
              {popupOption.isArcaneFocusChoice && ARCANE_FOCUS_TYPES.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => handleArcaneFocusSelect(focus, popupGroup.group.id, popupGroup.optionIndex)}
                  className="w-full px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  {focus}
                </button>
              ))}
              {popupOption.isHolySymbolChoice && HOLY_SYMBOL_TYPES.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => handleHolySymbolSelect(symbol, popupGroup.group.id, popupGroup.optionIndex)}
                  className="w-full px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  {symbol}
                </button>
              ))}
              {popupOption.isDruidicFocusChoice && DRUIDIC_FOCUS_TYPES.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => handleDruidicFocusSelect(focus, popupGroup.group.id, popupGroup.optionIndex)}
                  className="w-full px-3 py-2 text-left text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  {focus}
                </button>
              ))}
            </div>
          </BasePopup>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!isAllRequiredSelected}
          className={`w-full py-3 rounded-[var(--radius)] font-bold text-sm transition-colors ${
            isAllRequiredSelected
              ? "bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
              : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
          }`}
        >
          {isAllRequiredSelected ? "Continue" : "Complete all choices to continue"}
        </button>
      </div>
    </StepCard>
  );
}
