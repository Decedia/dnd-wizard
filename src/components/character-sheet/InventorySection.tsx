"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { useDerivedStats } from "@/lib/useCharacterStats";
import { useCallback, useState, useMemo } from "react";
import {
  BackpackIcon as Backpack,
  PlusIcon as Plus,
  HandIcon as Hand,
  ShieldIcon as Shield,
  SwordIcon as Sword,
  DaggerIcon as Dagger,
  BowArrowIcon as BowArrow,
  CrossbowIcon as Crossbow,
  BattleAxeIcon as BattleAxe,
} from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import { DamageBadge, DamageTypeLabel } from "./DamageBadge";
import { ItemSelectionModal } from "../modals/ItemSelectionModal";
import { CustomItemModal } from "../modals/CustomItemModal";
import { Dice } from "@/components/Dice";
import { SourceBadge } from "@/components/SourceBadge";
import {
  CurrencyRow,
  CategoryFilter,
  ItemSlot,
  ItemDetailPanel,
  InventoryGrid,
  type ItemSlotData,
} from "./InventoryGrid";

interface InventorySectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

type HandSlot = "main" | "off" | "both";

function getWeaponHandling(item: Character["inventory"][number]): "light" | "one-hand" | "two-handed" | "versatile" {
  const props = item.properties || [];
  if (props.includes("two-handed") || props.includes("heavy")) return "two-handed";
  if (props.includes("light")) return "light";
  if (props.includes("versatile")) return "versatile";
  return "one-hand";
}

function getEquippedHands(inventory: Character["inventory"]): { main: string | null; off: string | null; both: string | null } {
  const result: { main: string | null; off: string | null; both: string | null } = { main: null, off: null, both: null };
  for (const item of inventory) {
    if (!item.equipped || !item.hand) continue;
    if (item.hand === "both") result.both = item.id;
    else if (item.hand === "main") result.main = item.id;
    else if (item.hand === "off") result.off = item.id;
  }
  return result;
}

function canEquipItemCheck(item: Character["inventory"][number]): boolean {
  return item.itemType === "weapon" || item.itemType === "armor";
}

export function InventorySection({ character, onChange, editMode = true }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const derived = useDerivedStats(character);
  const rageDamage = derived.rageDamage || 0;
  const isBarbarian = character.class === "Barbarian";
  const [showItemPopup, setShowItemPopup] = useState(false);

  const hands = getEquippedHands(character.inventory);
  const hasTwoHanded = hands.both !== null;
  const hasShield = character.inventory.some((i) => i.equipped && i.itemType === "armor" && i.armorType === "shield");
  const hasMainHand = hands.main !== null;
  const hasOffHand = hands.off !== null;

  const updateItem = useCallback(
    (id: string, patch: Partial<Character["inventory"][number]>) => {
      const nextInventory = character.inventory.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      );
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
    },
    [character, onChange]
  );

  const toggleEquip = useCallback(
    (id: string) => {
      const item = character.inventory.find((i) => i.id === id);
      if (!item) return;

      if (!item.equipped) {
        if (item.itemType === "armor") {
          if (item.armorType === "shield") {
            if (hasTwoHanded) return;
            const nextInventory = character.inventory.map((i) =>
              i.id === id ? { ...i, equipped: true } : i.itemType === "armor" && i.armorType === "shield" ? { ...i, equipped: false } : i
            );
            const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
            onChange({ inventory: nextInventory, ac, attacks });
          } else {
            const nextInventory = character.inventory.map((i) =>
              i.id === id ? { ...i, equipped: true } : i.itemType === "armor" && i.armorType !== "shield" ? { ...i, equipped: false } : i
            );
            const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
            onChange({ inventory: nextInventory, ac, attacks });
          }
        } else if (item.itemType === "weapon") {
          const handling = getWeaponHandling(item);

          if (handling === "two-handed") {
            const nextInventory = character.inventory.map((i) => {
              if (i.id === id) return { ...i, equipped: true, hand: "both" as const };
              if (i.equipped && i.itemType === "armor" && i.armorType === "shield") return { ...i, equipped: false };
              if (i.equipped && i.itemType === "weapon") return { ...i, equipped: false, hand: undefined };
              return i;
            });
            const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
            onChange({ inventory: nextInventory, ac, attacks });
          } else {
            if (!hasMainHand && !hasTwoHanded) {
              updateItem(id, { equipped: true, hand: "main" });
            } else if (!hasOffHand && !hasTwoHanded && !hasShield) {
              updateItem(id, { equipped: true, hand: "off" });
            } else if (!hasMainHand) {
              updateItem(id, { equipped: true, hand: "main" });
            } else {
              updateItem(id, { equipped: true, hand: "main" });
            }
          }
        } else {
          updateItem(id, { equipped: true });
        }
      } else {
        updateItem(id, { equipped: false, hand: undefined });
      }
    },
    [character, onChange, updateItem, hasTwoHanded, hasShield, hasMainHand, hasOffHand]
  );

  const setHand = useCallback(
    (id: string, hand: HandSlot) => {
      const item = character.inventory.find((i) => i.id === id);
      if (!item || !item.equipped) return;

      if (hand === "both") {
        const nextInventory = character.inventory.map((i) => {
          if (i.id === id) return { ...i, hand: "both" as const };
          if (i.equipped && i.itemType === "armor" && i.armorType === "shield") return { ...i, equipped: false };
          if (i.equipped && i.itemType === "weapon" && i.id !== id) return { ...i, equipped: false, hand: undefined };
          return i;
        });
        const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
        onChange({ inventory: nextInventory, ac, attacks });
      } else if (hand === "main") {
        const nextInventory = character.inventory.map((i) => {
          if (i.id === id) return { ...i, hand: "main" as const };
          if (i.hand === "main") return { ...i, equipped: false, hand: undefined };
          return i;
        });
        const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
        onChange({ inventory: nextInventory, ac, attacks });
      } else if (hand === "off") {
        if (hasTwoHanded || hasShield) return;
        const nextInventory = character.inventory.map((i) => {
          if (i.id === id) return { ...i, hand: "off" as const };
          if (i.hand === "off") return { ...i, equipped: false, hand: undefined };
          return i;
        });
        const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
        onChange({ inventory: nextInventory, ac, attacks });
      }
    },
    [character, onChange, hasTwoHanded, hasShield]
  );

  const canEquipItem = useCallback(
    (item: ItemSlotData) => {
      const original = character.inventory.find((i) => i.id === item.id);
      return original ? canEquipItemCheck(original) : false;
    },
    [character.inventory]
  );

  const getWeaponStats = (item: Character["inventory"][number]): { attackBonus: string; damage: string; ability: string; damageBonus: number; rageBonus: number } | null => {
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
    const rageBonus = isBarbarian && abilityKey === "str" ? rageDamage : 0;
    const damageBonus = abilityMod + rageBonus;
    return {
      attackBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
      damage: `${item.damageDice || ""} ${item.damageType || ""}`.trim(),
      ability: abilityKey.toUpperCase(),
      damageBonus,
      rageBonus,
    };
  };

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [editingCustomItem, setEditingCustomItem] = useState<Character["inventory"][number] | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const addCustomItem = useCallback(() => {
    setEditingCustomItem(null);
    setShowCustomItemModal(true);
  }, []);

  const handleCustomItemAdd = useCallback(
    (newItem: Character["inventory"][number]) => {
      const isEdit = character.inventory.some((i) => i.id === newItem.id);
      let nextInventory: Character["inventory"];
      if (isEdit) {
        nextInventory = character.inventory.map((item) =>
          item.id === newItem.id ? newItem : item
        );
      } else {
        nextInventory = [...character.inventory, newItem];
      }
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setShowCustomItemModal(false);
      setEditingCustomItem(null);
    },
    [character, onChange]
  );

  const handleCustomItemReplace = useCallback(
    (oldItem: Character["inventory"][number], newItem: Character["inventory"][number]) => {
      const nextInventory = character.inventory.map((item) =>
        item.id === oldItem.id ? { ...newItem, id: item.id } : item
      );
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setEditingItemId(null);
      setShowCustomItemModal(false);
      setEditingCustomItem(null);
    },
    [character, onChange]
  );

  const handleEditCustomItem = useCallback((item: Character["inventory"][number]) => {
    if (item.source === "custom") {
      setEditingCustomItem(item);
      setShowCustomItemModal(true);
      setEditingItemId(null);
    } else {
      setEditingItemId(item.id);
    }
  }, []);

  const handleReplaceItem = useCallback(
    (oldId: string, newItem: Character["inventory"][number]) => {
      const nextInventory = character.inventory.map((item) =>
        item.id === oldId ? { ...newItem, id: item.id } : item
      );
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setEditingItemId(null);
    },
    [character, onChange]
  );

  const handleAddItem = useCallback(
    (item: Character["inventory"][number]) => {
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: [...character.inventory, item] });
      onChange({ inventory: [...character.inventory, item], ac, attacks });
      setShowItemPopup(false);
    },
    [character, onChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      const nextInventory = character.inventory.filter((item) => item.id !== id);
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setSelectedSlotId(null);
    },
    [character, onChange]
  );

  const getItemDescription = (item: Character["inventory"][number]): string => {
    const itemInfo = item.description ? JSON.parse(item.description) : null;
    const parts: string[] = [];

    if (item.itemType === "weapon") {
      if (itemInfo?.description) parts.push(itemInfo.description);
      if (item.damageDice) parts.push(`Damage: ${item.damageDice} ${item.damageType || ""}`.trim());
      if (item.category) parts.push(`Category: ${item.category}`);
      if (itemInfo?.properties && itemInfo.properties.length > 0) parts.push(`Properties: ${itemInfo.properties.join(", ")}`);
      const handling = getWeaponHandling(item);
      if (handling === "light") parts.push("Light, can dual-wield");
      else if (handling === "two-handed") parts.push("Two-handed");
      else if (handling === "versatile") parts.push("Versatile (1d10 two-handed)");
    } else if (item.itemType === "armor") {
      if (itemInfo?.description) parts.push(itemInfo.description);
      const baseAC = item.baseAC ?? itemInfo?.baseAC;
      const armorType = item.armorType || itemInfo?.armorType;
      const maxDex = item.maxDexBonus ?? itemInfo?.maxDex ?? itemInfo?.maxDexBonus;
      if (maxDex !== null && maxDex !== undefined) {
        if (maxDex === 0) {
          parts.push(`AC: ${baseAC} (no Dex bonus)`);
        } else {
          parts.push(`AC: ${baseAC} + Dex (max +${maxDex})`);
        }
      } else {
        parts.push(`AC: ${baseAC} + Dex`);
      }
      if (armorType) parts.push(`Type: ${armorType}`);
    } else {
      if (itemInfo?.description) parts.push(itemInfo.description);
      if (itemInfo?.contents) parts.push(`Contains: ${itemInfo.contents}`);
    }

    return parts.join("\n");
  };

  const getHandLabel = (hand: string | undefined): string => {
    switch (hand) {
      case "main":
        return "Main";
      case "off":
        return "Off";
      case "both":
        return "2H";
      default:
        return "";
    }
  };

  const sortedInventory = useMemo(() => {
    return [...character.inventory].sort((a, b) => {
      if (a.source !== b.source) {
        if (a.source === "custom") return -1;
        if (b.source === "custom") return 1;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [character.inventory]);

  const [activeInventoryTab, setActiveInventoryTab] = useState<"all" | "weapons" | "armor" | "items">("all");

  const filteredInventory = useMemo(() => {
    let items = sortedInventory;
    if (activeInventoryTab !== "all") {
      items = items.filter((item) => {
        if (activeInventoryTab === "weapons") return item.itemType === "weapon";
        if (activeInventoryTab === "armor") return item.itemType === "armor";
        if (activeInventoryTab === "items") return item.itemType === "item";
        return true;
      });
    }
    return items;
  }, [sortedInventory, activeInventoryTab]);

  const inventoryTabCounts = useMemo(() => {
    const counts = { all: sortedInventory.length, weapons: 0, armor: 0, items: 0 };
    for (const item of sortedInventory) {
      if (item.itemType === "weapon") counts.weapons++;
      else if (item.itemType === "armor") counts.armor++;
      else if (item.itemType === "item") counts.items++;
    }
    return counts;
  }, [sortedInventory]);

  const mapToSlotData = useCallback(
    (item: Character["inventory"][number]): ItemSlotData => {
      const itemInfo = item.description ? JSON.parse(item.description) : null;
      return {
        id: item.id,
        name: item.name || "Unnamed Item",
        icon: (itemInfo as any)?.icon || "📦",
        category: item.category || "misc",
        itemType: item.itemType || "item",
        equipped: item.equipped,
        quantity: item.quantity,
        description: itemInfo?.description || item.description || "",
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
        value: (itemInfo as any)?.value || (item as any).value,
        weight: (itemInfo as any)?.weight ?? item.weight ?? null,
        hand: item.hand,
        range: (item as any).range,
        versatileDice: (item as any).versatileDice,
        isGranted: item.isGranted,
        choiceGroupIndex: item.choiceGroupIndex,
        choiceOptionIndex: item.choiceOptionIndex,
      };
    },
    []
  );

  const slotItems = useMemo(() => filteredInventory.map(mapToSlotData), [filteredInventory, mapToSlotData]);

  const handleSlotClick = useCallback(
    (slotItem: ItemSlotData | null) => {
      if (!slotItem) return;
      setSelectedSlotId(slotItem.id);
    },
    []
  );

  const selectedItem = slotItems.find((i) => i.id === selectedSlotId) || null;

  const handleEquipToggle = useCallback(
    (slotItem: ItemSlotData) => {
      toggleEquip(slotItem.id);
    },
    [toggleEquip]
  );

  const handleEdit = useCallback((slotItem: ItemSlotData) => {
    const original = character.inventory.find((i) => i.id === slotItem.id);
    if (original) {
      handleEditCustomItem(original);
    }
  }, [character.inventory, handleEditCustomItem]);

  const handleRemove = useCallback(
    (slotItem: ItemSlotData) => {
      removeItem(slotItem.id);
    },
    [removeItem]
  );

  const handleAddSrdItem = useCallback(() => {
    setShowItemPopup(true);
  }, []);

  const handleAddCustomItem = useCallback(() => {
    addCustomItem();
  }, [addCustomItem]);

  return (
    <SectionCard id="inventory" title="Inventory" icon={<Backpack className="h-5 w-5" />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
            {slotItems.length} / 20 slots
          </span>
        </div>

        <CurrencyRow
          copper={character.currency?.copper || 0}
          silver={character.currency?.silver || 0}
          electrum={character.currency?.electrum || 0}
          gold={character.currency?.gold || 0}
          platinum={character.currency?.platinum || 0}
        />

        <CategoryFilter
          categories={["all", "weapons", "armor", "items"]}
          active={activeInventoryTab}
          onSelect={(cat) => setActiveInventoryTab(cat as "all" | "weapons" | "armor" | "items")}
        />

        <InventoryGrid
          items={slotItems}
          totalSlots={20}
          onItemClick={handleSlotClick}
          selectedItemId={selectedSlotId}
          onEquipToggle={handleEquipToggle}
          canEquip={canEquipItem}
        />

        {editMode && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAddSrdItem}
              className="flex-1 btn-secondary flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add SRD Item
            </button>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="flex-1 btn-secondary flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add Custom Item
            </button>
          </div>
        )}

        {showItemPopup && (
          <ItemSelectionModal
            character={character}
            onAdd={handleAddItem}
            onClose={() => setShowItemPopup(false)}
          />
        )}

        {showCustomItemModal && (
          <CustomItemModal
            character={character}
            onAdd={handleCustomItemAdd}
            onClose={() => {
              setShowCustomItemModal(false);
              setEditingCustomItem(null);
            }}
            editingItem={editingCustomItem}
          />
        )}

        {editingItemId && (
          <ItemSelectionModal
            character={character}
            onAdd={(newItem) => handleReplaceItem(editingItemId, newItem)}
            onClose={() => setEditingItemId(null)}
          />
        )}
      </div>
    </SectionCard>
  );
}
