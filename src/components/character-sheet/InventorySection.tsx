"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import { useDerivedStats } from "@/lib/useCharacterStats";
import { useCallback, useState, useMemo } from "react";
import { BackpackIcon as Backpack, PlusIcon as Plus, CheckCircleIcon as CheckCircle, CircleIcon as Circle, InfoIcon as Info, HandIcon as Hand, ShieldIcon as Shield, SwordIcon as Sword } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import { DamageBadge, DamageTypeLabel } from "./DamageBadge";
import { ItemSelectionModal } from "../modals/ItemSelectionModal";
import { CustomItemModal } from "../modals/CustomItemModal";
import { Dice } from "@/components/Dice";
import { SourceBadge } from "@/components/SourceBadge";

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

export function InventorySection({ character, onChange, editMode = true }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const derived = useDerivedStats(character);
  const rageDamage = derived.rageDamage || 0;
  const isBarbarian = character.class === "Barbarian";
  const [showItemPopup, setShowItemPopup] = useState(false);

  const hands = getEquippedHands(character.inventory);
  const hasTwoHanded = hands.both !== null;
  const hasShield = character.inventory.some(i => i.equipped && i.itemType === "armor" && i.armorType === "shield");
  const hasMainHand = hands.main !== null;
  const hasOffHand = hands.off !== null;

  const updateItem = useCallback((id: string, patch: Partial<Character["inventory"][number]>) => {
    const nextInventory = character.inventory.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  }, [character, onChange]);

  const toggleEquip = useCallback((id: string) => {
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
        } else if (handling === "light") {
          if (!hasMainHand && !hasTwoHanded) {
            updateItem(id, { equipped: true, hand: "main" });
          } else if (!hasOffHand && !hasTwoHanded && !hasShield) {
            updateItem(id, { equipped: true, hand: "off" });
          } else if (!hasMainHand) {
            updateItem(id, { equipped: true, hand: "main" });
          } else {
            updateItem(id, { equipped: true, hand: "main" });
          }
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
  }, [character, onChange, updateItem, hasTwoHanded, hasShield, hasMainHand, hasOffHand]);

  const setHand = useCallback((id: string, hand: HandSlot) => {
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
  }, [character, onChange, hasTwoHanded, hasShield]);

  const canEquip = (item: Character["inventory"][number]): boolean => {
    return item.itemType === "weapon" || item.itemType === "armor";
  };

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

  const addCustomItem = useCallback(() => {
    setEditingCustomItem(null);
    setShowCustomItemModal(true);
  }, []);

  const handleCustomItemAdd = useCallback((newItem: Character["inventory"][number]) => {
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
  }, [character, onChange]);

  const handleCustomItemReplace = useCallback((oldItem: Character["inventory"][number], newItem: Character["inventory"][number]) => {
    const nextInventory = character.inventory.map((item) =>
      item.id === oldItem.id ? { ...newItem, id: item.id } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
    setEditingItemId(null);
    setShowCustomItemModal(false);
    setEditingCustomItem(null);
  }, [character, onChange]);

  const handleEditCustomItem = useCallback((item: Character["inventory"][number]) => {
    if (item.source === "custom") {
      setEditingCustomItem(item);
      setShowCustomItemModal(true);
      setEditingItemId(null);
    } else {
      setEditingItemId(item.id);
    }
  }, []);

  const handleReplaceItem = useCallback((oldId: string, newItem: Character["inventory"][number]) => {
    const nextInventory = character.inventory.map((item) =>
      item.id === oldId ? { ...newItem, id: item.id } : item
    );
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
    setEditingItemId(null);
  }, [character, onChange]);

  const handleAddItem = useCallback((item: Character["inventory"][number]) => {
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: [...character.inventory, item] });
    onChange({ inventory: [...character.inventory, item], ac, attacks });
    setShowItemPopup(false);
  }, [character, onChange]);

  const removeItem = useCallback((id: string) => {
    const nextInventory = character.inventory.filter((item) => item.id !== id);
    const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
    onChange({ inventory: nextInventory, ac, attacks });
  }, [character, onChange]);

  const getItemDescription = (item: Character["inventory"][number]): string => {
    const itemInfo = item.description ? JSON.parse(item.description) : null;
    const parts: string[] = [];

    if (item.itemType === "weapon") {
      if (itemInfo?.description) parts.push(itemInfo.description);
      if (item.damageDice) parts.push(`Damage: [dice]${item.damageDice}[/dice] [damage]${item.damageType || ""}[/damage]`);
      if (item.category) parts.push(`Category: ${item.category}`);
      if (itemInfo?.properties && itemInfo.properties.length > 0) parts.push(`Properties: ${itemInfo.properties.join(", ")}`);
      const handling = getWeaponHandling(item);
      if (handling === "light") parts.push("Light, can dual-wield");
      else if (handling === "two-handed") parts.push("Two-handed");
      else if (handling === "versatile") parts.push("Versatile ([dice]1d10[/dice] two-handed)");
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
      case "main": return "Main";
      case "off": return "Off";
      case "both": return "2H";
      default: return "";
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
  const [weaponSubTab, setWeaponSubTab] = useState<"all" | "simple-melee" | "simple-ranged" | "martial-melee" | "martial-ranged">("all");

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
    if (activeInventoryTab === "weapons" && weaponSubTab !== "all") {
      items = items.filter((item) => {
        if (item.itemType !== "weapon") return false;
        const category = (item.category || "").toLowerCase();
        const isSimple = category.includes("simple");
        const isMartial = category.includes("martial");
        const isMelee = category.includes("melee") || !category.includes("ranged");
        const isRanged = category.includes("ranged");
        if (weaponSubTab === "simple-melee") return isSimple && isMelee;
        if (weaponSubTab === "simple-ranged") return isSimple && isRanged;
        if (weaponSubTab === "martial-melee") return isMartial && isMelee;
        if (weaponSubTab === "martial-ranged") return isMartial && isRanged;
        return true;
      });
    }
    return items;
  }, [sortedInventory, activeInventoryTab, weaponSubTab]);

  const inventoryTabCounts = useMemo(() => {
    const counts = { all: sortedInventory.length, weapons: 0, armor: 0, items: 0 };
    for (const item of sortedInventory) {
      if (item.itemType === "weapon") counts.weapons++;
      else if (item.itemType === "armor") counts.armor++;
      else if (item.itemType === "item") counts.items++;
    }
    return counts;
  }, [sortedInventory]);

  return (
    <SectionCard id="inventory" title="Inventory" icon={<Backpack className="h-5 w-5" />}>
      <div className="space-y-2">
        <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-1">
          {([
            { key: "all", label: "All" },
            { key: "weapons", label: "Weapons" },
            { key: "armor", label: "Armor" },
            { key: "items", label: "Items" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveInventoryTab(tab.key)}
              className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-t transition-colors ${
                activeInventoryTab === tab.key
                  ? "bg-[var(--color-bg)] text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {tab.label} ({inventoryTabCounts[tab.key]})
            </button>
            ))}
          </div>
          {activeInventoryTab === "weapons" && (
            <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-1 mt-1">
              {([
                { key: "all", label: "All" },
                { key: "simple-melee", label: "Simple Melee" },
                { key: "simple-ranged", label: "Simple Ranged" },
                { key: "martial-melee", label: "Martial Melee" },
                { key: "martial-ranged", label: "Martial Ranged" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWeaponSubTab(tab.key)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-t transition-colors ${
                    weaponSubTab === tab.key
                      ? "bg-[var(--color-bg)] text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        {filteredInventory.map((item: Character["inventory"][number]) => {
          const description = getItemDescription(item);
          const equipBtn = canEquip(item);
          const isCustom = item.source === "custom";
          const dropdownValue = isCustom ? "Custom Item" : (item.srdItemName || item.name || "");
          const handling = item.itemType === "weapon" ? getWeaponHandling(item) : null;
          return (
            <div key={item.id} className="list-row flex flex-col gap-2">
               {editMode ? (
                 <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleEditCustomItem(item)}
                        className="text-sm font-bold text-[var(--color-text-primary)] hover:underline text-left flex-1 min-w-[120px]"
                      >
                        {item.name || "Unnamed Item"}
                      </button>
                     <input
                       type="number"
                       value={item.quantity}
                       onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value || "1", 10) })}
                       onBlur={onFieldBlur}
                       className="input w-16 text-center"
                     />
                    {equipBtn && (
                      <button
                        type="button"
                        onClick={() => toggleEquip(item.id)}
                        className={`h-7 px-2.5 text-xs flex items-center gap-1.5 ${
                          item.equipped
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                      >
                        <Hand size={12} className="inline mr-0.5" />
                        {item.equipped ? "Equipped" : "Equip"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-bold text-[var(--color-text-primary)] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {item.equipped && item.itemType === "weapon" && handling !== "two-handed" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Hand:</span>
                      <button
                        type="button"
                        onClick={() => setHand(item.id, "main")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          item.hand === "main"
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                        }`}
                      >
                        <Hand size={10} className="inline mr-0.5" />Main
                      </button>
                      <button
                        type="button"
                        onClick={() => setHand(item.id, "off")}
                        disabled={hasTwoHanded || hasShield}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          item.hand === "off"
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                            : hasTwoHanded || hasShield
                              ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40 cursor-not-allowed"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                        }`}
                      >
                        <Hand size={10} className="inline mr-0.5 scale-x-[-1]" />Off
                      </button>
                      {handling === "versatile" && (
                        <button
                          type="button"
                          onClick={() => setHand(item.id, "both")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            item.hand === "both"
                              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          2-Handed
                        </button>
                      )}
                    </div>
                  )}
{getWeaponStats(item) && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <DamageBadge type={item.damageType} size="sm" />
                        <span className="text-[10px] font-bold text-[var(--color-info-600)] bg-[var(--color-info-50)] px-1.5 py-0.5 rounded">
                          +{getWeaponStats(item)?.damageBonus}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-accent-orange-600)] bg-[var(--color-accent-orange-50)] px-1.5 py-0.5 rounded">
                          {getWeaponStats(item)?.attackBonus} to hit
                        </span>
                      </div>
                    )}
                    {item.category === "ranged" && item.itemType === "weapon" && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                          Ammo: {item.ammoQuantity ?? 0} / {item.maxAmmo ?? "∞"}
                        </span>
                        <Dice type="d20" size={40} onRoll={(roll) => {
                          const ws = getWeaponStats(item);
                          if (ws && (item.ammoQuantity ?? 0) > 0) {
                            updateItem(item.id, { ammoQuantity: Math.max(0, (item.ammoQuantity ?? 0) - 1) });
                          }
                        }} />
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {getWeaponStats(item)?.attackBonus} to hit
                        </span>
                      </div>
                    )}
                  {isCustom && item.source === "custom" && (
                    <textarea
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onBlur={onFieldBlur}
                      className="textarea min-h-[60px] mt-2"
                      placeholder="Item description"
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SourceBadge source={item.source === "custom" ? "PHB" : "PHB"} size="sm" />
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{item.name || "Unnamed Item"}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">x{item.quantity}</span>
                      )}
                      {item.itemType === "armor" && item.armorType === "shield" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">
                          <Sword size={10} className="inline mr-0.5" />Shield
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {canEquip(item) && (
                        <button
                          type="button"
                          onClick={() => toggleEquip(item.id)}
                          className={`h-7 px-2 text-[10px] font-bold rounded flex items-center gap-1 ${
                            item.equipped
                              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                          }`}
                        >
                          <Hand size={10} className="inline mr-0.5" />
                          {item.equipped ? "Equipped" : "Equip"}
                        </button>
                      )}
                      <InfoButton
                        title={item.name || "Item"}
                        description={getItemDescription(item)}
                      />
                    </div>
                  </div>
                  {item.equipped && item.itemType === "weapon" && handling !== "two-handed" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Hand:</span>
                      <button
                        type="button"
                        onClick={() => setHand(item.id, "main")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          item.hand === "main"
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                            : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                        }`}
                      >
                        <Hand size={10} className="inline mr-0.5" />Main
                      </button>
                      <button
                        type="button"
                        onClick={() => setHand(item.id, "off")}
                        disabled={hasTwoHanded || hasShield}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          item.hand === "off"
                            ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                            : hasTwoHanded || hasShield
                              ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40 cursor-not-allowed"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                        }`}
                      >
                        <Hand size={10} className="inline mr-0.5 scale-x-[-1]" />Off
                      </button>
                      {handling === "versatile" && (
                        <button
                          type="button"
                          onClick={() => setHand(item.id, "both")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            item.hand === "both"
                              ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          2-Handed
                        </button>
                      )}
                    </div>
                  )}
                  {getWeaponStats(item) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <DamageBadge type={item.damageType} size="sm" />
                      <span className="text-[10px] font-bold text-[var(--color-info-600)] bg-[var(--color-info-50)] px-1.5 py-0.5 rounded">
                        +{getWeaponStats(item)?.damageBonus}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--color-accent-orange-600)] bg-[var(--color-accent-orange-50)] px-1.5 py-0.5 rounded">
                        {getWeaponStats(item)?.attackBonus} to hit
                      </span>
                    </div>
                  )}
                 </div>
               )}
              </div>
           );
         })}
       </div>
        {editMode && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowItemPopup(true)}
              className="flex-1 btn-secondary flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add SRD Item
            </button>
            <button
              type="button"
              onClick={addCustomItem}
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
    </SectionCard>
  );
}