"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Backpack, Info, Lock, Plus } from "@phosphor-icons/react";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData } from "@/lib/srd-client";
import { generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import { DiceBadge } from "@/components/DiceBadge";
import { SwordIcon as Sword, DaggerIcon as Dagger, BowArrowIcon as BowArrow, CrossbowIcon as Crossbow, BattleAxeIcon as BattleAxe, HammerIcon as Hammer, WizardStaffIcon as Staff, PolearmIcon as Polearm, WhipIcon as Whip, TridentIcon as Trident, MaceIcon as Mace, ClubIcon as Club, MusicNotesIcon as MusicNotes, PackageIcon as PackageBox, ShieldIcon as ArmorShield } from "@/components/icons";
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

// The tile icon mirrors the item kind the same way the skills step mirrors an
// ability: weapons fall back to the per-name map, everything else to its type.
function getItemTileIcon(
  name: string,
  itemInfo: { type?: string; category?: string } | null,
  itemType?: string,
): React.ComponentType<{ className?: string }> {
  if (itemInfo?.type === "weapon" || itemType === "weapon") {
    return getWeaponIcon(name, itemInfo?.category);
  }
  if (itemInfo?.type === "armor" || itemType === "armor") return ArmorShield;
  if (itemInfo?.type === "instrument" || itemType === "instrument") return MusicNotes;
  return PackageBox;
}

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
  const debug = useDebugLogger("StepEquipment");
  const { t, language } = useLanguage();
  const classData = data.class ? getStaticClass(data.class, data.ruleset, undefined, language) : null;
  const [modalGroup, setModalGroup] = useState<{ group: ChoiceGroup; selectedOptionIndex: number | null; selectedWeaponChoiceIndex: number | null } | null>(null);
  const [tempWeaponSelectionsMap, setTempWeaponSelectionsMap] = useState<Record<number, string[]>>({});
  const [confirmedSelections, setConfirmedSelections] = useState<Record<string, string[]>>({});

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
  }, [modalGroup, debug, tempWeaponSelectionsMap, data.inventory]);

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
  }, [modalGroup, tempWeaponSelectionsMap, data.inventory, getGroupIndex, getItemInfo, weapons, generateId, onChange, debug]);

  const handleModalClose = useCallback(() => {
    setModalGroup(null);
    setTempWeaponSelectionsMap({});
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

  const parseItemInfo = useCallback((item: Character["inventory"][number]) => {
    return item.description ? JSON.parse(item.description) : null;
  }, []);

  // Stat chips reuse the sheet badge pipeline: DamageBadge for the type and
  // DiceBadge for the dice, never hand-written dice or bare damage words.
  const getItemStats = useCallback((itemInfo: any): React.ReactNode[] => {
    if (!itemInfo) return [];

    if (itemInfo.type === "weapon") {
      const chips: React.ReactNode[] = [<DamageBadge key="damage" type={itemInfo.damageType} size="sm" />];
      if (itemInfo.damageDice) {
        chips.push(<DiceBadge key="dice" dice={itemInfo.damageDice} size="sm" />);
      }
      if (itemInfo.properties?.length) {
        chips.push(
          <span key="props" className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {itemInfo.properties.join(", ")}
          </span>,
        );
      }
      return chips;
    }

    if (itemInfo.type === "armor") {
      return [
        <span
          key="ac"
          className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted"
        >
          {t(
            "equipment.armorStats",
            { ac: itemInfo.baseAC ?? "—", maxDex: itemInfo.maxDex ? ` (max +${itemInfo.maxDex})` : "" },
            "AC {ac} + Dex{maxDex}",
          )}
        </span>,
      ];
    }

    if (itemInfo.type === "instrument") {
      return [
        <span
          key="focus"
          className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted"
        >
          {t("equipment.spellcastingFocus", "Spellcasting focus")}
        </span>,
      ];
    }

    return [];
  }, [t]);

  const renderItemModalContent = useCallback(
    (itemInfo: any, itemName: string): React.ReactNode => {
      if (!itemInfo) return null;

      const chips = getItemStats(itemInfo);

      return (
        <div className="space-y-4">
          {chips.length > 0 && <div className="flex flex-wrap gap-2">{chips}</div>}
          {itemInfo.contents && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {t("equipment.contents", "Contents")}
              </p>
              <p className="text-xs text-ink-muted">{itemInfo.contents}</p>
            </div>
          )}
          {itemInfo.description && (
            <p className="text-xs leading-relaxed text-ink-muted">{itemInfo.description}</p>
          )}
        </div>
      );
    },
    [t, getItemStats],
  );

  const grantedItems = useMemo(() => data.inventory.filter((item) => item.isGranted), [data.inventory]);

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
  }, [data.inventory, getGroupIndex, onChange, debug]);

  return (
    <section className="w-full pb-32">
      <div className="space-y-6">
        {/* Same guide box the skills step uses: an ink panel with the info glyph. */}
        <div className="mb-6 flex gap-3 rounded-2xl border border-ink/20 bg-ink/10 p-4">
          <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-ink" />
          <p className="text-xs leading-relaxed text-ink/80">
            {t("creator.equipmentHint", "Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.")}
          </p>
        </div>
        {grantedItems.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Lock size={14} weight="bold" className="text-ink-subtle" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                {t("sheet.grantedEquipment", "Granted Equipment")}
              </h3>
              <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                {t("sheet.locked", "Locked")}
              </span>
            </div>
            <div>
              {grantedItems.map((item) => {
                const itemInfo = parseItemInfo(item);
                const TileIcon = getItemTileIcon(item.name, itemInfo, item.itemType);
                const detail = itemInfo?.contents || itemInfo?.description || "";
                return (
                  <SplitSelectionCard
                    key={item.id}
                    title={item.name}
                    subtitle={detail}
                    icon={<TileIcon className="h-6 w-6 text-ink-muted" />}
                    disabled
                    onSelect={() => {}}
                    infoType="modal"
                    modalContent={renderItemModalContent(itemInfo, item.name)}
                    clampSubtitle={false}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Backpack size={14} weight="bold" className="text-ink-subtle" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              {t("creator.yourChoices", "Your Choices")}
            </h3>
          </div>

          <div className="space-y-3">
            {choiceGroups.map((group) => {
              const groupIndex = getGroupIndex(group.id);
              const choiceOption = group.options.find(
                (opt) =>
                  opt.isWeaponChoice ||
                  opt.isInstrumentChoice ||
                  opt.isArcaneFocusChoice ||
                  opt.isHolySymbolChoice ||
                  opt.isDruidicFocusChoice,
              ) ?? null;
              const choiceOptionCount = choiceOption ? Math.max(choiceOption.selectionCount || 1, 1) : 1;
              const selectedItems = data.inventory.filter((item) => item.choiceGroupIndex === groupIndex);
              // One card per picked item; while the group is still empty the
              // prompt repeats for however many picks the group asks for.
              const slotCount = selectedItems.length > 0 ? selectedItems.length : choiceOptionCount;
              const prompt = choiceOption
                ? getOptionLabel(choiceOption)
                : t("creator.selectFromOptions", "Select from the options below");

              return Array.from({ length: slotCount }).map((_, slotIndex) => {
                const selectedItem = selectedItems[slotIndex];
                const itemInfo = selectedItem ? parseItemInfo(selectedItem) : null;
                const TileIcon = selectedItem
                  ? getItemTileIcon(selectedItem.name, itemInfo, selectedItem.itemType)
                  : Plus;
                const detail = selectedItem ? itemInfo?.contents || itemInfo?.description || "" : prompt;

                return (
                  <SplitSelectionCard
                    key={`${group.id}-${slotIndex}`}
                    title={selectedItem ? selectedItem.name : t("equipment.choose", "Choose")}
                    subtitle={detail}
                    icon={<TileIcon className="h-6 w-6" />}
                    isSelected={!!selectedItem}
                    onSelect={() => handleChoiceSlotClick(group)}
                    infoType="modal"
                    modalContent={selectedItem ? renderItemModalContent(itemInfo, selectedItem.name) : null}
                    badges={selectedItem && selectedItem.quantity > 1 ? [`x${selectedItem.quantity}`] : []}
                    clampSubtitle={false}
                  />
                );
              });
            })}
          </div>
        </section>

        {modalGroup && (() => {
          const group = modalGroup.group;
          const groupIndex = getGroupIndex(group.id);

          const isChoiceOption = (opt: EquipmentOption) =>
            opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice;

          const choiceOptions = group.options.filter(isChoiceOption);
          const concreteOptions = group.options.filter((o) => !isChoiceOption(o));

          const weaponChoiceOptions = choiceOptions.map((opt, idx) => {
            const selectionCount = opt.selectionCount || 1;
            let weaponOpts: Array<{ icon: React.ReactNode; name: string; description: string; data?: any }> = [];

            if (opt.isWeaponChoice) {
              const categoryWeapons = getWeaponsByCategory(opt.weaponType || "");
              weaponOpts = categoryWeapons.map((w: any) => {
                const itemInfo = getItemInfo(w.name);
                const TileIcon = getWeaponIcon(w.name, itemInfo?.category);
                return ({
                  icon: <TileIcon className="h-6 w-6 text-ink-muted" />,
                  name: w.name,
                  description: w.description || "",
                  data: w,
                });
              });
            } else if (opt.isInstrumentChoice) {
              weaponOpts = MUSICAL_INSTRUMENTS.map(name => {
                const itemInfo = getItemInfo(name);
                return ({
                  icon: <MusicNotes className="h-6 w-6 text-ink-muted" />,
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                });
              });
            } else if (opt.isArcaneFocusChoice) {
              weaponOpts = ARCANE_FOCUS_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return ({
                  icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                });
              });
            } else if (opt.isHolySymbolChoice) {
              weaponOpts = HOLY_SYMBOL_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return ({
                  icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                });
              });
            } else if (opt.isDruidicFocusChoice) {
              weaponOpts = DRUIDIC_FOCUS_TYPES.map(name => {
                const itemInfo = getItemInfo(name);
                return ({
                  icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                  name,
                  description: itemInfo?.description || "",
                  data: itemInfo,
                });
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
    </section>
  );
}
