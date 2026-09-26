"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { getModifier, getProficiencyBonus, generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";
import { InfoIcon } from "@/components/icons";
import { DamageBadge, getDamageTypeColor, getDamageTypeBgColor } from "@/components/character-sheet/DamageBadge";
import { SwordIcon as Sword, DaggerIcon as Dagger, BowArrowIcon as BowArrow, CrossbowIcon as Crossbow, BattleAxeIcon as BattleAxe, HammerIcon as Hammer, WizardStaffIcon as Staff, PolearmIcon as Polearm, WhipIcon as Whip, TridentIcon as Trident, MaceIcon as Mace, ClubIcon as Club, CheckIcon as Check, XIcon as XIcon } from "@/components/icons";
import { SourceBadge } from "@/components/SourceBadge";
import { ItemSlot, ItemDetailPanel, InventoryGrid, type ItemSlotData } from "@/components/character-sheet/InventoryGrid";
import { EquipmentChoiceModal } from "@/components/modals/EquipmentChoiceModal";
import { useDebugLogger } from "@/lib/debug/DebugContext";
import { useLanguage } from "@/contexts/LanguageContext";

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

const weaponTypeEmojis: Record<string, string> = {
  martial_melee: "⚔️",
  martial_ranged: "🏹",
  martial: "⚔️",
  simple_melee: "🗡️",
  simple_ranged: "⚙️",
  simple: "🗡️",
};

function getWeaponIcon(name: string, weaponType?: string): React.ComponentType<{ className?: string }> {
  return weaponNameIcons[name] || weaponTypeIcons[weaponType || ""] || Sword;
}

function getWeaponEmoji(name: string, weaponType?: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("crossbow")) return "🏹";
  if (lower.includes("bow")) return "🏹";
  if (lower.includes("arrow") || lower.includes("bolt")) return "↗️";
  if (lower.includes("spear") || lower.includes("polearm") || lower.includes("glaive") || lower.includes("halberd") || lower.includes("lance") || lower.includes("pike") || lower.includes("trident") || lower.includes("javelin")) return "🔱";
  if (lower.includes("whip")) return "🥢";
  return weaponTypeEmojis[weaponType || ""] || "⚔️";
}

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
  const debug = useDebugLogger("StepEquipment");
  const { t, language } = useLanguage();
  const classData = data.class ? getStaticClass(data.class, data.ruleset, undefined, language) : null;
  const [modalGroup, setModalGroup] = useState<{ group: ChoiceGroup; selectedOptionIndex: number | null; selectedWeaponChoiceIndex: number | null } | null>(null);
  const [tempWeaponSelectionsMap, setTempWeaponSelectionsMap] = useState<Record<number, string[]>>({});
  const [tempSelectedName, setTempSelectedName] = useState<string | null>(null);
  const [confirmedSelections, setConfirmedSelections] = useState<Record<string, string[]>>({});
  const [infoState, setInfoState] = useState<{title: string; description: string} | null>(null);

  useEffect(() => {
    debug.log('tempWeaponSelectionsMap CHANGED', { tempWeaponSelectionsMap, modalGroupId: modalGroup?.group.id });
  }, [tempWeaponSelectionsMap, modalGroup, debug]);

  useEffect(() => {
    debug.log('inventory CHANGED', { inventoryCount: data.inventory.length, items: data.inventory.map(i => ({ name: i.name, choiceGroupIndex: i.choiceGroupIndex, choiceOptionIndex: i.choiceOptionIndex })) });
  }, [data.inventory, debug]);

  const startingEquipment = useMemo(() => {
    const data = classData?.startingEquipment || [];
    return JSON.parse(JSON.stringify(data));
  }, [classData?.startingEquipment]);

   const weapons = useMemo(() => getStaticWeapons(data.sources, data.ruleset, language), [data.sources, data.ruleset, language]);
   const armors = useMemo(() => getStaticArmors(data.sources, data.ruleset, language), [data.sources, data.ruleset, language]);
   const allEquipment = useMemo(() => getEquipmentNames(data.sources, language), [data.sources, language]);

  useEffect(() => {
    debug.log('startingEquipment CHANGED', {
      count: startingEquipment.length,
      entries: startingEquipment.map((e: any) => ({
        description: e.description?.slice(0, 40),
        isWeaponChoice: e.isWeaponChoice,
        selectionCount: e.selectionCount,
        granted: e.granted,
      })),
    });
  }, [startingEquipment, debug]);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => buildChoiceGroups(startingEquipment, data.ruleset), [startingEquipment, data.ruleset]);

  const getGroupIndex = useCallback((groupId: string) => {
    const match = groupId.match(/choice-(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
  }, []);

  useEffect(() => {
    if (!modalGroup) return;
    const groupIndex = getGroupIndex(modalGroup.group.id);
    const hasSelections = Object.values(tempWeaponSelectionsMap).some(selections => selections.length > 0);
    if (hasSelections) return;
    const hasItems = data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    if (!hasItems) return;
    debug.log('CLEARING inventory for deselected group', { groupIndex, modalGroupId: modalGroup.group.id });
    onChange({ inventory: data.inventory.filter(item => item.choiceGroupIndex !== groupIndex) });
  }, [tempWeaponSelectionsMap, modalGroup, data.inventory, onChange, getGroupIndex, debug]);

const isMusicalInstrument = useCallback((itemName: string) => {
  return MUSICAL_INSTRUMENTS.some(i => i.toLowerCase() === itemName.toLowerCase());
}, []);

function buildFallbackDescription(t: ReturnType<typeof useLanguage>["t"], itemName: string, info: any): string {
  if (info.type === "weapon") {
    const parts: string[] = [];
    if (info.category) parts.push(`${t("equipment.weaponCategory", "A")} ${info.category} ${t("equipment.weapon", "weapon")}.`);
    if (info.damageDice) parts.push(`${t("equipment.deals", "Deals")} ${info.damageDice} ${info.damageType || t("equipment.damage", "damage")}.`);
    if (info.properties?.length) parts.push(`${t("equipment.properties", "Properties")}: ${info.properties.join(", ")}.`);
    return parts.join(" ") || t("equipment.weaponFallback", { itemName }, "A weapon called {itemName}.");
  }
  if (info.type === "armor") {
    const parts: string[] = [];
    const armorLabel = info.armorType ? info.armorType.charAt(0).toUpperCase() + info.armorType.slice(1) : t("equipment.armorTypeFallback", "A type of");
    parts.push(t("equipment.armorTypeLabel", { armorLabel }, "{armorLabel} armor."));
    if (info.baseAC) parts.push(t("equipment.baseAC", { baseAC: info.baseAC }, "Base AC {baseAC}."));
    if (info.maxDex !== undefined && info.maxDex !== null) {
      parts.push(info.maxDex === 0 ? t("equipment.noDexBonus", "No Dex bonus.") : t("equipment.maxDexBonus", { maxDex: info.maxDex }, "Max Dex bonus +{maxDex}."));
    }
    return parts.join(" ") || t("equipment.armorFallback", { itemName }, "A type of armor called {itemName}.");
  }
  if (info.type === "instrument") {
    return t("equipment.musicalInstrumentFocus", "Musical instrument used as a spellcasting focus.");
  }
  if (info.contents) {
    return t("equipment.contentsLabel", { contents: info.contents }, "Contains: {contents}.");
  }
  return t("equipment.unknownFallback", { itemName }, "A {itemName}.");
}

  const getItemInfo = useCallback((itemName: string) => {
    const weapon = weapons.find((w: any) => w.name === itemName) as any;
    if (weapon) {
      const rawDescription = weapon.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== weapon.name
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: "weapon",
            damageDice: weapon.damage?.damage_dice || "",
            damageType: weapon.damage?.damage_type?.name || "",
            properties: weapon.properties?.map((p: any) => p.name) || [],
            category: weapon.category_range,
          });
      return {
        type: "weapon",
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        properties: weapon.properties?.map((p: any) => p.name) || [],
        category: weapon.category_range,
        description,
        icon: getWeaponEmoji(itemName, weapon.category_range),
      };
    }

    const armor = armors.find((a: any) => a.name === itemName) as any;
    if (armor) {
      const armorType = armor.armor_category === "Light" ? "light" : armor.armor_category === "Medium" ? "medium" : armor.armor_category === "Heavy" ? "heavy" : armor.armor_category === "Shield" ? "shield" : "unknown";
      const rawDescription = armor.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== armor.name
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: "armor",
            baseAC: armor.armor_class?.base || 0,
            maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
            armorType,
          });
      return {
        type: "armor",
        baseAC: armor.armor_class?.base || 0,
        maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
        armorType,
        description,
        icon: "🛡️",
      };
    }

    if (isMusicalInstrument(itemName)) {
      return {
        type: "instrument",
        description: t("equipment.bardInstrument", "Musical instrument. Bards use musical instruments as a spellcasting focus."),
        icon: "🎵",
      };
    }

    const equipmentData = getEquipmentData(itemName);
    if (equipmentData) {
      const rawDescription = equipmentData.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== itemName
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: equipmentData.type,
            baseAC: equipmentData.baseAC,
            armorType: equipmentData.armorType,
            maxDex: equipmentData.maxDexBonus,
            damageDice: equipmentData.damageDice,
            damageType: equipmentData.damageType,
            category: equipmentData.category,
            contents: equipmentData.contents,
          });
      return {
        type: equipmentData.type,
        description,
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

    return {
      type: "unknown",
      description: buildFallbackDescription(t, itemName, { type: "unknown" }),
      icon: "📦",
    };
  }, [weapons, armors, isMusicalInstrument, t]);

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
      return t("creator.selectWeapons", { count: count > 1 ? `${count} ` : "a ", weaponType: option.weaponType?.replace('_', ' ') || "" }, "Select {count} {weaponType} weapon(s)");
    }
    if (option.isInstrumentChoice) return t("creator.selectMusicalInstrument", "Select a musical instrument");
    if (option.isArcaneFocusChoice) return t("creator.selectArcaneFocus", "Select an arcane focus");
    if (option.isHolySymbolChoice) return t("creator.selectHolySymbol", "Select a holy symbol");
    if (option.isDruidicFocusChoice) return t("creator.selectDruidicFocus", "Select a druidic focus");
    if (option.items.length === 1) return option.items[0].name;
    return option.items.map(i => `${i.quantity || 1}× ${i.name}`).join(", ");
  }, [t]);

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

  const handleWeaponSelect = useCallback((weaponName: string, choiceIndex: number) => {
    debug.log('handleWeaponSelect CALLED', { weaponName, choiceIndex, currentTempWeaponSelectionsMap: tempWeaponSelectionsMap, currentSelectedOptionIndex: modalGroup?.selectedOptionIndex, currentSelectedWeaponChoiceIndex: modalGroup?.selectedWeaponChoiceIndex, currentInventoryCount: data.inventory.length });
    setTempWeaponSelectionsMap(prev => {
      const current = prev[choiceIndex] || [];
      const alreadySelectedIndex = current.findIndex(w => w.toLowerCase() === weaponName.toLowerCase());
      if (alreadySelectedIndex >= 0) {
        const newList = current.filter(w => w.toLowerCase() !== weaponName.toLowerCase());
        debug.log('handleWeaponSelect DESELECT', { weaponName, newList, wasSelected: true });
        return { ...prev, [choiceIndex]: newList };
      }
      const selectionCount = modalGroup?.group.options.filter(o =>
        o.isWeaponChoice || o.isInstrumentChoice || o.isArcaneFocusChoice || o.isHolySymbolChoice || o.isDruidicFocusChoice
      )[choiceIndex]?.selectionCount || 1;
      debug.log('handleWeaponSelect SELECT', { weaponName, prevLength: current.length, selectionCount, choiceIndex, modalGroupId: modalGroup?.group.id, willAdd: current.length < selectionCount });
      if (current.length >= selectionCount) {
        return prev;
      }
      return { ...prev, [choiceIndex]: [...current, weaponName] };
    });
    setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: null, selectedWeaponChoiceIndex: choiceIndex } : null);
    setTempSelectedName(null);
  }, [modalGroup, debug, tempWeaponSelectionsMap, data.inventory]);

  const handleInstrumentSelect = useCallback((instrumentName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: optionIndex } : null);
    setTempSelectedName(instrumentName);
  }, [getGroupIndex]);

  const handleArcaneFocusSelect = useCallback((focusName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: optionIndex } : null);
    setTempSelectedName(focusName);
  }, [getGroupIndex]);

  const handleHolySymbolSelect = useCallback((symbolName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: optionIndex } : null);
    setTempSelectedName(symbolName);
  }, [getGroupIndex]);

  const handleDruidicFocusSelect = useCallback((focusName: string, groupId: string, optionIndex: number) => {
    const groupIndex = getGroupIndex(groupId);
    setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: optionIndex } : null);
    setTempSelectedName(focusName);
  }, [getGroupIndex]);

  const handleModalConfirm = useCallback(() => {
    if (!modalGroup) return;

    const { group, selectedOptionIndex, selectedWeaponChoiceIndex } = modalGroup;
    const groupIndex = getGroupIndex(group.id);

    const isChoiceOption = (opt: EquipmentOption) =>
      opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice;

    let option: EquipmentOption | null = null;
    let effectiveOptionIndex: number | undefined;

    if (selectedWeaponChoiceIndex !== null) {
      const choiceOptions = group.options.filter(isChoiceOption);
      option = choiceOptions[selectedWeaponChoiceIndex] ?? null;
      effectiveOptionIndex = option ? group.options.indexOf(option) : undefined;
    } else if (selectedOptionIndex !== null) {
      option = group.options[selectedOptionIndex];
      effectiveOptionIndex = selectedOptionIndex;
    }

    debug.log('handleModalConfirm', { groupId: group.id, selectedOptionIndex, selectedWeaponChoiceIndex, tempWeaponSelectionsMap, optionDescription: option?.description, effectiveOptionIndex });

    if (!option) {
      if (selectedWeaponChoiceIndex === null && selectedOptionIndex === null) {
        debug.log('handleModalConfirm CLEARING group', groupIndex);
        onChange({ inventory: data.inventory.filter(item => item.choiceGroupIndex !== groupIndex) });
      }
      setModalGroup(null);
      setTempWeaponSelectionsMap({});
      setTempSelectedName(null);
      return;
    }

    let newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);
    const newItems: Character["inventory"] = [];

    if (!isChoiceOption(option)) {
      (option.items || []).forEach((item: any) => {
        const itemInfo = getItemInfo(item.name);
        newItems.push({
          id: generateId(),
          name: item.name,
          quantity: item.quantity || 1,
          equipped: false,
          source: "srd" as const,
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: effectiveOptionIndex,
        });
      });
    } else if (selectedWeaponChoiceIndex !== null) {
      const selectionCount = option.selectionCount || 1;
      const selections = tempWeaponSelectionsMap[selectedWeaponChoiceIndex] || [];

      selections.slice(0, selectionCount).forEach(weaponName => {
        const itemInfo = getItemInfo(weaponName);
        const weapon = weapons.find((w: any) => w.name === weaponName);
        newItems.push({
          id: generateId(),
          name: weaponName,
          quantity: 1,
          equipped: false,
          source: "srd" as const,
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
          damageDice: weapon?.damage?.damage_dice || "",
          damageType: weapon?.damage?.damage_type?.name || "",
          category: weapon?.category_range || weapon?.weapon_category,
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: effectiveOptionIndex,
        });
      });

      (option.items || []).forEach((item: any) => {
        const itemInfo = getItemInfo(item.name);
        newItems.push({
          id: generateId(),
          name: item.name,
          quantity: item.quantity || 1,
          equipped: false,
          source: "srd" as const,
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: effectiveOptionIndex,
        });
      });
    }

    if (newItems.length > 0) {
      onChange({ inventory: [...newInventory, ...newItems] });
    }

    setModalGroup(null);
    setTempWeaponSelectionsMap({});
    setTempSelectedName(null);
  }, [modalGroup, tempWeaponSelectionsMap, data.inventory, getGroupIndex, getItemInfo, weapons, generateId, onChange, debug]);

  const handleModalClose = useCallback(() => {
    setModalGroup(null);
    setTempWeaponSelectionsMap({});
    setTempSelectedName(null);
  }, []);

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
          {!compact && itemInfo.description && (
            <button
              type="button"
              onClick={() => setInfoState({ title: t("equipment.armorDetails", "Armor Details"), description: itemInfo.description })}
              className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
              aria-label={t("equipment.armorDetails", "Info: Armor Details")}
            >
              <InfoIcon className="h-4 w-4" />
            </button>
          )}
          {infoState?.title === t("equipment.armorDetails", "Armor Details") && itemInfo.description && (
            <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
              <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{infoState.title}</h3>
                  <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{itemInfo.description}</p>
                <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("common.gotIt", "Got it")}</button>
              </div>
            </div>
          )}
        </span>
      );
    }

    if (itemInfo.type === "instrument") {
      return <span>{t("equipment.musicalInstrument", "Musical instrument")}</span>;
    }

    if (itemInfo.type === "item") {
      return (
        <span>
          {itemInfo.description && (
            <button
              type="button"
              onClick={() => setInfoState({ title: t("equipment.itemDetails", "Item Details"), description: itemInfo.description })}
              className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
              aria-label={t("equipment.itemDetails", "Info: Item Details")}
            >
              <InfoIcon className="h-4 w-4" />
            </button>
          )}
          {infoState?.title === t("equipment.itemDetails", "Item Details") && itemInfo.description && (
            <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
              <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{infoState.title}</h3>
                  <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{itemInfo.description}</p>
                <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("common.gotIt", "Got it")}</button>
              </div>
            </div>
          )}
          {itemInfo.contents && (
            <span className="ml-2 text-[var(--color-text-secondary)] font-medium">{t("equipment.contains", "Contains:")} {itemInfo.contents}</span>
          )}
        </span>
      );
    }

    return null;
  }, [infoState, t]);

  const getItemDescription = useCallback((itemInfo: any): string => {
    if (!itemInfo) return "";

    const parts: string[] = [];

    if (itemInfo.type === "weapon") {
      if (itemInfo.description) parts.push(itemInfo.description);
      if (itemInfo.damageDice) parts.push(t("equipment.damage", { damageDice: itemInfo.damageDice, damageType: itemInfo.damageType || "" }, "Damage: [dice]{damageDice}[/dice] [damage]{damageType}[/damage]"));
      if (itemInfo.category) parts.push(t("equipment.category", { category: itemInfo.category }, "Category: {category}"));
      if (itemInfo.properties && itemInfo.properties.length > 0) parts.push(t("equipment.properties", { properties: itemInfo.properties.join(", ") }, "Properties: {properties}"));
    } else if (itemInfo.type === "armor") {
      if (itemInfo.description) parts.push(itemInfo.description);
      parts.push(t("equipment.ac", { baseAC: itemInfo.baseAC, maxDex: itemInfo.maxDex }, "AC: {baseAC} + Dex") + (itemInfo.maxDex !== null ? ` (max +${itemInfo.maxDex})` : ""));
      if (itemInfo.armorType) parts.push(t("equipment.type", { type: itemInfo.armorType }, "Type: {type}"));
    } else if (itemInfo.type === "instrument") {
      parts.push(t("equipment.bardInstrument", "Musical instrument. Bards use musical instruments as a spellcasting focus."));
    } else if (itemInfo.type === "item") {
      if (itemInfo.description) parts.push(itemInfo.description);
      if (itemInfo.contents) parts.push(t("equipment.contentsLabel", { contents: itemInfo.contents }, "Contains: {contents}"));
    }

    return parts.join("\n");
  }, [t]);

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.every(group => {
      const groupIndex = getGroupIndex(group.id);
      return data.inventory.some(item => item.choiceGroupIndex === groupIndex);
    });
  }, [choiceGroups, data.inventory, getGroupIndex]);

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

    const existingItems = data.inventory.filter(item => item.choiceGroupIndex === groupIndex);
    if (existingItems.length > 0) {
      debug.log('handleChoiceSlotClick CLEARING group', { groupIndex, groupId: group.id, count: existingItems.length });
      onChange({ inventory: data.inventory.filter(item => item.choiceGroupIndex !== groupIndex) });
    }

    debug.log('handleChoiceSlotClick OPEN empty', { groupId: group.id, groupIndex });
    setModalGroup({
      group,
      selectedOptionIndex: null,
      selectedWeaponChoiceIndex: null,
    });
    setTempWeaponSelectionsMap({});
    setTempSelectedName(null);
  }, [data.inventory, getGroupIndex, onChange, debug]);

  return (
    <StepCard
      title={t("creator.equipment", "Equipment")}
      hint={t("creator.equipmentHint", "Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.")}
    >
      <div className="space-y-5">
        {grantedSlotItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-card-title text-[var(--color-text-primary)]">{t("sheet.grantedEquipment", "Granted Equipment")}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                {t("sheet.locked", "LOCKED")}
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
            {t("creator.yourChoices", "Your Choices")}
          </span>
          <div className="grid grid-cols-4 gap-[6px]">
            {choiceGroups.map((group) => {
              const groupIndex = getGroupIndex(group.id);
              const weaponChoiceOpt = group.options.find((opt: any) =>
                opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice
              ) ?? null;
              const selectionCount = weaponChoiceOpt?.selectionCount || 1;
              const isMultiWeapon = weaponChoiceOpt && selectionCount > 1;
              
              const selectedItems = data.inventory.filter(item => item.choiceGroupIndex === groupIndex);
              const hasWeaponChoiceSelection = isMultiWeapon && selectedItems.some(item => item.choiceOptionIndex === group.options.indexOf(weaponChoiceOpt));
              
              if (isMultiWeapon && hasWeaponChoiceSelection) {
                return (
                  <div
                    key={group.id}
                    className="flex gap-[6px]"
                    style={{ gridColumn: `span ${Math.min(selectionCount, 4)}` }}
                  >
                    {Array.from({ length: selectionCount }).map((_, idx) => {
                      const selectedItem = selectedItems[idx];
                      const hasSelection = !!selectedItem;
                      const itemInfo = selectedItem?.description ? JSON.parse(selectedItem.description) : null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChoiceSlotClick(group)}
                          className={`flex-1 aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-1 p-1.5 transition-all relative ${
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
                              <span className="text-2xl text-[var(--color-text-muted)] leading-none">+</span>
                               <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{t("creator.choose", "Choose")}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              }

              const selectedItem = selectedItems[0];
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

        {modalGroup && (() => {
          const group = modalGroup.group;
          const groupIndex = getGroupIndex(group.id);

          const isChoiceOption = (opt: EquipmentOption) =>
            opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice;

          const choiceOptions = group.options.filter(isChoiceOption);
          const concreteOptions = group.options.filter((o) => !isChoiceOption(o));

          const weaponChoiceOptions = choiceOptions.map((opt, idx) => {
            const selectionCount = opt.selectionCount || 1;
            let weaponOpts: Array<{ icon: string; name: string; description: string; data?: any }> = [];

            if (opt.isWeaponChoice) {
              const categoryWeapons = getWeaponsByCategory(opt.weaponType || "");
              weaponOpts = categoryWeapons.map((w: any) => {
                const itemInfo = getItemInfo(w.name);
                return {
                  icon: getWeaponEmoji(w.name, opt.weaponType),
                  name: w.name,
                  description: w.description || "",
                  data: w,
                };
              });
            } else if (opt.isInstrumentChoice) {
              weaponOpts = MUSICAL_INSTRUMENTS.map(name => {
                const itemInfo = getItemInfo(name);
                return {
                  icon: "🎵",
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                };
              });
            } else if (opt.isArcaneFocusChoice) {
              weaponOpts = ARCANE_FOCUS_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return {
                  icon: "🔮",
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                };
              });
            } else if (opt.isHolySymbolChoice) {
              weaponOpts = HOLY_SYMBOL_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return {
                  icon: "✨",
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                };
              });
            } else if (opt.isDruidicFocusChoice) {
              weaponOpts = DRUIDIC_FOCUS_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return {
                  icon: "🌿",
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                };
              });
            }

            return {
              id: `wc-${idx}`,
              label: opt.description,
              bonusItems: (opt.items || []).map(item => ({ name: item.name, quantity: item.quantity || 1 })),
              selectionCount,
              weaponOptions: weaponOpts,
              selectedWeaponNames: tempWeaponSelectionsMap[idx] || [],
              onWeaponSelect: (name: string) => handleWeaponSelect(name, idx),
            };
          });

          const selectedOpt = modalGroup.selectedOptionIndex !== null ? group.options[modalGroup.selectedOptionIndex] : null;
          const hasConcreteSelection = selectedOpt !== null && !isChoiceOption(selectedOpt);
          const selectedWcIdx = modalGroup.selectedWeaponChoiceIndex;
          const hasWeaponSelection = selectedWcIdx !== null && (tempWeaponSelectionsMap[selectedWcIdx] || []).length >= (weaponChoiceOptions[selectedWcIdx]?.selectionCount || 1);
          const confirmDisabled = !hasConcreteSelection && !hasWeaponSelection;

          return (
            <>
              <EquipmentChoiceModal
                isOpen={!!modalGroup}
                onClose={handleModalClose}
                onConfirm={handleModalConfirm}
                title={t("equipment.selectFromOptions", "Select from the options below")}
                group={group}
                concreteOptions={concreteOptions}
                selectedConcreteIndex={modalGroup.selectedOptionIndex}
                onConcreteSelect={(idx) => {
                  setModalGroup(prev => prev ? { ...prev, selectedOptionIndex: idx, selectedWeaponChoiceIndex: null } : null);
                  setTempWeaponSelectionsMap({});
                  setTempSelectedName(null);
                }}
                weaponChoiceOptions={weaponChoiceOptions}
                selectedWeaponChoiceIndex={modalGroup.selectedWeaponChoiceIndex}
                onWeaponChoiceSelect={(idx) => {
                  setModalGroup(prev => prev ? { ...prev, selectedWeaponChoiceIndex: idx, selectedOptionIndex: null } : null);
                }}
                confirmDisabled={confirmDisabled}
                getItemInfo={getItemInfo}
              />
            </>
          );
        })()}
      </div>
    </StepCard>
  );
}
