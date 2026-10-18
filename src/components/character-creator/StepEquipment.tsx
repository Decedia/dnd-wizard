"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Backpack, Info, Lock, Plus, CheckIcon as Check } from "@phosphor-icons/react";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { ItemBundleList } from "@/components/modals/ItemBundle";
import { getStaticClass, getStaticWeapons, getStaticArmors, getEquipmentData } from "@/lib/srd-client";
import { generateId } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { buildChoiceGroups, type ChoiceGroup, type EquipmentOption } from "@/lib/character-creation";
import {
  InfoSectionLabel,
  InfoStatTile,
  InfoChip,
} from "@/components/modals/InfoBits";
import { SwordIcon as Sword, DaggerIcon as Dagger, BowArrowIcon as BowArrow, CrossbowIcon as Crossbow, BattleAxeIcon as BattleAxe, HammerIcon as Hammer, WizardStaffIcon as Staff, PolearmIcon as Polearm, WhipIcon as Whip, TridentIcon as Trident, MaceIcon as Mace, ClubIcon as Club, MusicNotesIcon as MusicNotes, PackageIcon as PackageBox, ShieldIcon as ArmorShield } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebugLogger } from "@/lib/debug/DebugContext";

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
  const [selectedConcreteMap, setSelectedConcreteMap] = useState<Record<number, number | null>>({});
  const [selectedWeaponMap, setSelectedWeaponMap] = useState<Record<number, Record<number, string[]>>>({});

  useEffect(() => {
    debug.log('selectedConcreteMap CHANGED', { selectedConcreteMap, selectedWeaponMap });
  }, [selectedConcreteMap, selectedWeaponMap, debug]);

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

  const isMusicalInstrument = useCallback((itemName: string) => {
    return MUSICAL_INSTRUMENTS.some(i => i.toLowerCase() === itemName.toLowerCase());
  }, []);

  function buildFallbackDescription(t: ReturnType<typeof useLanguage>["t"], itemName: string, info: any): string {
    if (info.type === "weapon") {
      const parts: string[] = [];
      if (info.category) parts.push(`${t("equipment.weaponCategory", "A")} ${info.category} ${t("equipment.weapon", "weapon")}.`);
      if (info.damageDice) parts.push(`${t("equipment.deals", "Memberikan")} ${info.damageDice} ${info.damageType || t("equipment.damage", "damage")}.`);
      if (info.properties?.length) parts.push(`${t("equipment.properties", "Properti")}: ${info.properties.join(", ")}.`);
      return parts.join(" ") || t("equipment.weaponFallback", { itemName }, "A weapon called {itemName}.");
    }
    if (info.type === "armor") {
      const parts: string[] = [];
      const armorLabel = info.armorType ? info.armorType.charAt(0).toUpperCase() + info.armorType.slice(1) : t("equipment.armorTypeFallback", "A type of");
      parts.push(t("equipment.armorLabel", { armorLabel }, "Armor {armorLabel}."));
      if (info.baseAC) parts.push(t("equipment.baseAC", { baseAC: info.baseAC }, "Base AC {baseAC}."));
      if (info.maxDex !== undefined && info.maxDex !== null) {
        parts.push(info.maxDex === 0 ? t("equipment.noDexBonus", "Tidak ada bonus Dex.") : t("equipment.maxDexBonus", { maxDex: info.maxDex }, "Maks bonus Dex +{maxDex}."));
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
        description: t("equipment.bardInstrument", "Alat musik. Bard menggunakan alat musik sebagai fokus penyihir."),
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

  const parseItemInfo = useCallback((item: Character["inventory"][number]) => {
    return item.description ? JSON.parse(item.description) : null;
  }, []);

  const renderItemModalContent = useCallback(
    (itemInfo: any, itemName: string): React.ReactNode => {
      if (!itemInfo) return null;

      const dice = itemInfo.damageDice;
      const damageType = itemInfo.damageType;
      const baseAC = itemInfo.baseAC;
      const maxDex = itemInfo.maxDex;
      const properties = (itemInfo.properties || []) as string[];
      const contents = itemInfo.contents;

      return (
        <div className="space-y-4">
          {(dice || baseAC !== undefined) && (
            <div className="grid grid-cols-2 gap-2">
              {dice && (
                <InfoStatTile
                  label={t("items.damage", "Kerusakan")}
                  value={damageType ? `${dice} ${damageType}` : dice}
                />
              )}
              {baseAC !== undefined && (
                <InfoStatTile
                  label={t("items.armorClass", "Kelas Armor")}
                  value={
                    maxDex === null
                      ? `${t("items.baseAC", "AC")} ${baseAC} (${t("items.fullDex", "DEX penuh")})`
                      : maxDex === 0
                        ? `${t("items.baseAC", "AC")} ${baseAC} (${t("items.noDex", "Tanpa DEX")})`
                        : `${t("items.baseAC", "AC")} ${baseAC} (+${maxDex} DEX)`
                  }
                />
              )}
            </div>
          )}

          {properties.length > 0 && (
            <div>
              <InfoSectionLabel>{t("items.properties", "Sifat")}</InfoSectionLabel>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {properties.map((prop) => (
                  <InfoChip key={prop}>{prop}</InfoChip>
                ))}
              </div>
            </div>
          )}

          {contents && (
            <div>
              <InfoSectionLabel>{t("equipment.contains", "Berisi:")}</InfoSectionLabel>
              <div className="mt-1.5 space-y-1.5">
                {Array.isArray(contents)
                  ? contents.map((entry: any, idx: number) => (
                      <div
                        key={`${entry.name}-${idx}`}
                        className="flex items-center justify-between rounded-xl border-2 border-border-strong bg-surface p-2.5"
                      >
                        <span className="text-xs font-semibold text-ink">{entry.name}</span>
                        {entry.quantity > 1 && (
                          <span className="text-[11px] font-bold text-ink-muted">
                            ×{entry.quantity}
                          </span>
                        )}
                      </div>
                    ))
                  : (
                    <p className="text-xs leading-relaxed text-ink-muted">{contents}</p>
                  )}
              </div>
            </div>
          )}

          {itemInfo.description && (
            <div>
              <InfoSectionLabel>{t("equipment.itemDetails", "Detail Item")}</InfoSectionLabel>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{itemInfo.description}</p>
            </div>
          )}
        </div>
      );
    },
    [t],
  );

  const grantedItems = useMemo(() => data.inventory.filter((item) => item.isGranted), [data.inventory]);

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
            srdItemName: item.name,
            itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
            description: itemInfo ? JSON.stringify(itemInfo) : "",
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

  const isChoiceOption = (opt: EquipmentOption) =>
    opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice;

  // Commit the current selection for a group to inventory immediately (classes: click = select).
  const commitGroup = useCallback((group: ChoiceGroup) => {
    const groupIndex = getGroupIndex(group.id);
    const concreteIdx = selectedConcreteMap[groupIndex];
    const weaponSel = selectedWeaponMap[groupIndex] || {};

    const concreteOptions = group.options.filter((o) => !isChoiceOption(o));
    const choiceOptions = group.options.filter(isChoiceOption);

    let selectedOpt: EquipmentOption | null = null;
    let selectedWeaponChoiceIdx: number | null = null;

    if (concreteIdx !== null) {
      selectedOpt = concreteOptions[concreteIdx] ?? null;
    } else {
      const wcIdx = Object.keys(weaponSel).find((k) => {
        const co = choiceOptions[Number(k)];
        return co && (weaponSel[Number(k)] || []).length >= (co.selectionCount || 1);
      });
      if (wcIdx !== undefined) {
        selectedWeaponChoiceIdx = Number(wcIdx);
        selectedOpt = choiceOptions[selectedWeaponChoiceIdx] ?? null;
      }
    }

    let newInventory = data.inventory.filter(item => item.choiceGroupIndex !== groupIndex);
    const newItems: Character["inventory"] = [];

    if (selectedOpt && !isChoiceOption(selectedOpt)) {
      (selectedOpt.items || []).forEach((item: any) => {
        const itemInfo = getItemInfo(item.name);
        newItems.push({
          id: generateId(),
          name: item.name,
          quantity: item.quantity || 1,
          equipped: false,
          source: "srd" as const,
          srdItemName: item.name,
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: concreteIdx ?? undefined,
        });
      });
    } else if (selectedOpt && selectedWeaponChoiceIdx !== null) {
      const selectionCount = selectedOpt.selectionCount || 1;
      const selections = (weaponSel[selectedWeaponChoiceIdx] || []).slice(0, selectionCount);

      selections.forEach((weaponName) => {
        const itemInfo = getItemInfo(weaponName);
        const weapon = weapons.find((w: any) => w.name === weaponName);
        newItems.push({
          id: generateId(),
          name: weaponName,
          quantity: 1,
          equipped: false,
          source: "srd" as const,
          srdItemName: weaponName,
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : itemInfo?.type === "instrument" ? "instrument" : "item",
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          damageDice: weapon?.damage?.damage_dice || "",
          damageType: weapon?.damage?.damage_type?.name || "",
          category: weapon?.category_range || weapon?.weapon_category,
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: group.options.indexOf(selectedOpt),
        });
      });

      (selectedOpt.items || []).forEach((item: any) => {
        const itemInfo = getItemInfo(item.name);
        newItems.push({
          id: generateId(),
          name: item.name,
          quantity: item.quantity || 1,
          equipped: false,
          source: "srd" as const,
          srdItemName: item.name,
          itemType: itemInfo?.type === "weapon" ? "weapon" : itemInfo?.type === "armor" ? "armor" : "item",
          description: itemInfo ? JSON.stringify(itemInfo) : "",
          choiceGroupIndex: groupIndex,
          choiceOptionIndex: group.options.indexOf(selectedOpt),
        });
      });
    }

    if (newItems.length > 0) {
      onChange({ inventory: [...newInventory, ...newItems] });
    }
  }, [selectedConcreteMap, selectedWeaponMap, data.inventory, getItemInfo, weapons, getGroupIndex, onChange, isChoiceOption]);

  const selectConcreteOption = useCallback((group: ChoiceGroup, optionIndex: number) => {
    const groupIndex = getGroupIndex(group.id);
    setSelectedConcreteMap(prev => {
      const next = { ...prev };
      next[groupIndex] = next[groupIndex] === optionIndex ? null : optionIndex;
      return next;
    });
    // clear weapon selection for this group
    setSelectedWeaponMap(prev => {
      const next = { ...prev };
      delete next[groupIndex];
      return next;
    });
    commitGroup(group);
  }, [getGroupIndex, commitGroup]);

  const toggleWeapon = useCallback((group: ChoiceGroup, groupIndex: number, wcIdx: number, weaponName: string) => {
    setSelectedWeaponMap(prev => {
      const next = { ...prev };
      const groupSel = { ...(next[groupIndex] || {}) };
      const current = groupSel[wcIdx] || [];
      const already = current.includes(weaponName);
      const updated = already
        ? current.filter(w => w !== weaponName)
        : [...current, weaponName];
      groupSel[wcIdx] = updated;
      next[groupIndex] = groupSel;
      return next;
    });
    // clear concrete selection for this group
    setSelectedConcreteMap(prev => {
      const next = { ...prev };
      next[groupIndex] = null;
      return next;
    });
    commitGroup(group);
  }, [commitGroup]);

  const handleChoiceSlotClick = useCallback((group: ChoiceGroup) => {
    const groupIndex = getGroupIndex(group.id);
    const existingItems = data.inventory.filter(item => item.choiceGroupIndex === groupIndex);
    if (existingItems.length > 0) {
      debug.log('CLEARING inventory for deselected group', { groupIndex, groupId: group.id, count: existingItems.length });
      onChange({ inventory: data.inventory.filter(item => item.choiceGroupIndex !== groupIndex) });
      setSelectedConcreteMap(prev => { const next = { ...prev }; delete next[groupIndex]; return next; });
      setSelectedWeaponMap(prev => { const next = { ...prev }; delete next[groupIndex]; return next; });
      return;
    }
    debug.log('OPEN empty group', { groupId: group.id, groupIndex });
    setSelectedConcreteMap(prev => { const next = { ...prev }; next[groupIndex] = null; return next; });
    setSelectedWeaponMap(prev => { const next = { ...prev }; next[groupIndex] = {}; return next; });
  }, [data.inventory, getGroupIndex, onChange, debug]);

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
              <Lock size={14} weight="bold" className="text-ink" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink">
                {t("sheet.grantedEquipment", "Granted Equipment")}
              </h3>
              <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                {t("sheet.locked", "Locked")}
              </span>
            </div>
            <div className="space-y-3">
              {grantedItems.map((item) => {
                const itemInfo = parseItemInfo(item);
                const TileIcon = getItemTileIcon(item.name, itemInfo, item.itemType);
                const detail = itemInfo?.contents || itemInfo?.description || "";
                return (
                  <SplitSelectionCard
                    key={item.id}
                    title={item.name}
                    subtitle={detail}
                    icon={<TileIcon className="h-6 w-6 text-ink" />}
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
              <Backpack size={14} weight="bold" className="text-ink" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink">
                {t("creator.yourChoices", "Pilihanmu")}
              </h3>
            </div>

          <div className="space-y-3">
            {choiceGroups.map((group) => {
              const groupIndex = getGroupIndex(group.id);
              const choiceOption = group.options.find(isChoiceOption) ?? null;
              const choiceOptionCount = choiceOption ? Math.max(choiceOption.selectionCount || 1, 1) : 1;
              const selectedItems = data.inventory.filter((item) => item.choiceGroupIndex === groupIndex);
              const hasAnySelection = selectedItems.length > 0;

              const concreteOptions = group.options.filter((o) => !isChoiceOption(o));
              const choiceOptions = group.options.filter(isChoiceOption);

              return (
                <section key={group.id} className="space-y-3">
                  {/* Group header */}
                  <div className="rounded-xl border-2 border-border-strong bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PackageBox className="h-5 w-5 text-ink-muted" />
                        <div>
                          <h4 className="font-bold text-ink">{group.description}</h4>
                          <p className="mt-0.5 text-[10px] text-ink-muted">
                            {choiceOption
                              ? t("equipment.chooseWeapons", { count: choiceOptionCount }, "Pilih {count} senjata")
                              : t("creator.selectFromOptions", "Pilih dari opsi di bawah")}
                          </p>
                        </div>
                      </div>
                      {hasAnySelection && (
                        <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface shadow-sm">
                          {t("modal.selected", "Terpilih")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Concrete options (packages) — exactly like class cards */}
                  {concreteOptions.length > 0 && (
                    <div className="space-y-2">
                      {concreteOptions.map((opt, idx) => {
                        const isSelected = selectedConcreteMap[groupIndex] === idx;
                        const itemNames = (opt.items || [])
                          .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
                          .join(", ");
                        const firstItem = opt.items?.[0];
                        const firstInfo = firstItem ? getItemInfo(firstItem.name) : null;
                        return (
                          <SplitSelectionCard
                            key={opt.description || idx}
                            title={opt.description}
                            subtitle={itemNames || undefined}
                            icon={<span className="text-[18px] leading-none">{firstInfo?.icon || "📦"}</span>}
                            badges={["PHB"]}
                            isSelected={isSelected}
                            onSelect={() => selectConcreteOption(group, idx)}
                            infoType="modal"
                            modalContent={
                              <div className="space-y-3">
                                <InfoSectionLabel>{t("equipment.contains", "Berisi:")}</InfoSectionLabel>
                                <div className="mt-1.5">
                                  <ItemBundleList
                                    items={(opt.items || []).map((i) => ({ name: i.name, quantity: i.quantity || 1 }))}
                                    getInfo={getItemInfo}
                                    emptyLabel={t("equipment.noItems", "Tidak ada barang.")}
                                  />
                                </div>
                              </div>
                            }
                            clampSubtitle={false}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Weapon / instrument / focus choices — each selectable as a class card */}
                  {choiceOptions.length > 0 && (
                    <div className="space-y-3">
                      {choiceOptions.map((opt, wcIdx) => {
                        const selectionCount = opt.selectionCount || 1;
                        const selectedWeapons = (selectedWeaponMap[groupIndex] || {})[wcIdx] || [];
                        const isComplete = selectedWeapons.length >= selectionCount;

                        let weaponOpts: Array<{ icon: React.ReactNode; name: string; description: string }> = [];
                        if (opt.isWeaponChoice) {
                          const categoryWeapons = getWeaponsByCategory(opt.weaponType || "");
                          weaponOpts = categoryWeapons.map((w: any) => {
                            const info = getItemInfo(w.name);
                            const WeaponIcon = getWeaponIcon(w.name, info?.category);
                            return ({
                              icon: <WeaponIcon className="h-6 w-6 text-ink" />,
                              name: w.name,
                              description: w.description || "",
                            });
                          });
                        } else if (opt.isInstrumentChoice) {
                          weaponOpts = MUSICAL_INSTRUMENTS.map((name) => ({
                            icon: <MusicNotes className="h-6 w-6 text-ink" />,
                            name,
                            description: getItemInfo(name)?.description || "",
                          }));
                        } else if (opt.isArcaneFocusChoice) {
                          weaponOpts = ARCANE_FOCUS_TYPES.map((name) => ({
                            icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                            name,
                            description: getItemInfo(name)?.description || "",
                          }));
                        } else if (opt.isHolySymbolChoice) {
                          weaponOpts = HOLY_SYMBOL_TYPES.map((name) => ({
                            icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                            name,
                            description: getItemInfo(name)?.description || "",
                          }));
                        } else if (opt.isDruidicFocusChoice) {
                          weaponOpts = DRUIDIC_FOCUS_TYPES.map((name) => ({
                            icon: <PackageBox className="h-6 w-6 text-ink-muted" />,
                            name,
                            description: getItemInfo(name)?.description || "",
                          }));
                        }

                        return (
                          <div key={opt.description || wcIdx} className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-ink">{opt.description}</h4>
                                <p className="mt-0.5 text-[10px] text-ink-muted">
                                  {t("equipment.chooseWeapons", { count: selectionCount }, "Pilih {count} senjata")}
                                </p>
                              </div>
                              {isComplete && (
                                <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface shadow-sm">
                                  {t("modal.selected", "Terpilih")}
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {weaponOpts.map((weapon, wIdx) => {
                                const isWeaponSelected = selectedWeapons.includes(weapon.name);
                                return (
                                  <SplitSelectionCard
                                    key={wIdx}
                                    title={weapon.name}
                                    subtitle={weapon.description || undefined}
                                    icon={weapon.icon}
                                    isSelected={isWeaponSelected}
                                    onSelect={() => toggleWeapon(group, groupIndex, wcIdx, weapon.name)}
                                    infoType="modal"
                                    modalContent={
                                      <div className="space-y-3">
                                        {weapon.description && (
                                          <p className="text-xs leading-relaxed text-ink-muted">{weapon.description}</p>
                                        )}
                                        {getItemInfo(weapon.name)?.damageDice && (
                                          <InfoStatTile
                                            label={t("items.damage", "Kerusakan")}
                                            value={getItemInfo(weapon.name)?.damageType
                                              ? `${getItemInfo(weapon.name).damageDice} ${getItemInfo(weapon.name).damageType}`
                                              : getItemInfo(weapon.name).damageDice}
                                          />
                                        )}
                                      </div>
                                    }
                                    clampSubtitle={false}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-ink-muted">
                              {selectedWeapons.length}/{selectionCount} {t("equipment.itemsCount", "{count} item")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty group prompt */}
                  {concreteOptions.length === 0 && choiceOptions.length === 0 && (
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
                      {t("modal.noClassesFound", "Tidak ada opsi yang tersedia.")}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}


