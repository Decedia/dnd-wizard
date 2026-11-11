"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { computeEquippedEffects, getProficiencyBonus } from "@/lib/storage";
import { useDerivedStats } from "@/lib/useCharacterStats";
import { useCallback, useState, useMemo } from "react";
import { useDice } from "@/contexts/DiceContext";
import { parseRoll, partsFor } from "@/lib/dice-roll";
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
import { SourceBadge } from "@/components/SourceBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { addRows, applyItemUse, carriedWeight, healDiceOf, COIN_BY_FIELD, coinsFromInventory, equipRow, getRowUse, handChoices, isCoinRow, rowInfo, rowText, setCoinAmount, type Hand as HandSide } from "@/lib/inventory";
import { changeHands } from "@/lib/turn";
import { HandChoiceSheet } from "./HandChoiceSheet";
import { findLocalizedItem } from "@/data/item-catalog";
import { ItemIcon } from "@/components/ItemIcon";

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
import { collectProficiencies, getRowProficiency } from "@/lib/proficiency";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";
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
  // Consumables are used, never equipped.
  return item.itemType === "weapon" || item.itemType === "armor";
}

export function InventorySection({ character, onChange, editMode = true }: InventorySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t, language } = useLanguage();
  const derived = useDerivedStats(character);
  const [showItemPopup, setShowItemPopup] = useState(false);

  const hands = getEquippedHands(character.inventory);
  const coins = coinsFromInventory(character.inventory);

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

  const [useMessage, setUseMessage] = useState<string | null>(null);

  // The weapon waiting for a hand choice, if any.
  const [handPick, setHandPick] = useState<string | null>(null);

  /**
   * Weapons and shields go through changeHands, which also charges the turn
   * when one is running (free object interaction, then the action).
   */
  const changeHeld = useCallback(
    (id: string | null, hand: HandSide, name: string) => {
      const { patch, cost, removed } = changeHands(character, id, hand);
      if (!patch) {
        setUseMessage(t("hands.blocked", "Not possible this turn: it needs your action, and that is already used."));
        return;
      }
      onChange(patch);
      const parts: string[] = [];
      if (id && removed.length > 0) parts.push(t("inventory.unequippedFor", { removed: removed.join(", "), item: name }, "Took off {removed} to equip {item}."));
      if (cost.action) parts.push(t("hands.cost.action", "Used your action."));
      else if (cost.interaction) parts.push(t("hands.cost.free", "Used your free object interaction for this turn."));
      setUseMessage(parts.length > 0 ? parts.join(" ") : null);
    },
    [character, onChange, t]
  );

  const toggleEquip = useCallback(
    (id: string) => {
      const item = character.inventory.find((i) => i.id === id);
      if (!item) return;
      const inHands = item.itemType === "weapon" || item.armorType === "shield";
      if (item.equipped) {
        if (inHands) changeHeld(null, item.hand === "off" || item.armorType === "shield" ? "off" : "main", item.name);
        else updateItem(id, { equipped: false, hand: undefined });
        return;
      }
      // A one-handed or versatile weapon: the player picks the hand.
      if (handChoices(item).length > 1) {
        setHandPick(id);
        return;
      }
      if (inHands) {
        changeHeld(id, handChoices(item)[0] ?? "off", item.name);
        return;
      }
      // equipRow frees the body slot the item needs.
      const { inventory: nextInventory, removed } = equipRow(character.inventory, id);
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setUseMessage(removed.length > 0 ? t("inventory.unequippedFor", { removed: removed.join(", "), item: item.name }, "Took off {removed} to equip {item}.") : null);
    },
    [character, onChange, updateItem, changeHeld, t]
  );

  const canEquipItem = useCallback(
    (item: ItemSlotData) => {
      const original = character.inventory.find((i) => i.id === item.id);
      return original ? canEquipItemCheck(original) : false;
    },
    [character.inventory]
  );

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
    (oldId: string, rows: Character["inventory"]) => {
      const index = character.inventory.findIndex((item) => item.id === oldId);
      const rest = character.inventory.filter((item) => item.id !== oldId);
      // A single item keeps its place in the list; a pack's items go at the end.
      const nextInventory =
        rows.length === 1 && index >= 0
          ? [...rest.slice(0, index), { ...rows[0], id: oldId }, ...rest.slice(index)]
          : addRows(rest, rows);
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setEditingItemId(null);
    },
    [character, onChange]
  );

  const handleAddItem = useCallback(
    (rows: Character["inventory"]) => {
      const nextInventory = addRows(character.inventory, rows);
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ inventory: nextInventory, ac, attacks });
      setShowItemPopup(false);
    },
    [character, onChange]
  );

  const dice = useDice();
  const handleUse = useCallback(
    (rowId: string, rolledHeal?: number) => {
      const row = character.inventory.find((i) => i.id === rowId);
      const outcome = applyItemUse(character, rowId, Math.random, rolledHeal);
      if (!row || !outcome) return;
      const nextInventory = outcome.patch.inventory ?? character.inventory;
      const { ac, attacks } = computeEquippedEffects({ ...character, inventory: nextInventory });
      onChange({ ...outcome.patch, ac, attacks });
      const { result } = outcome;
      if (result.kind === "heal") {
        setUseMessage(t("inventory.useHealed", { item: row.name, rolled: result.rolled, healed: result.healed }, "{item}: rolled {rolled}, regained {healed} HP."));
      } else if (result.kind === "open") {
        const list = result.taken
          .map((s) => {
            const taken = findLocalizedItem(s.id, language);
            return taken?.type === "coin" ? `${s.quantity} ${s.id}` : `${s.quantity} ${taken?.name ?? s.id}`;
          })
          .join(", ");
        setUseMessage(t("inventory.useOpened", { item: row.name, list }, "Took out of {item}: {list}."));
      } else {
        setUseMessage(t("inventory.useConsumed", { item: row.name, left: result.usesLeft ?? 0 }, "Used {item}. {left} left."));
      }
      if (!nextInventory.some((i) => i.id === rowId)) setSelectedSlotId(null);
    },
    [character, onChange, t, language]
  );

  // A healing potion is rolled in the dice tray first, and drunk once the dice land.
  const drinkOrUse = (rowId: string) => {
    const row = character.inventory.find((i) => i.id === rowId);
    const parsed = row && dice && getRowUse(row) === "heal" ? parseRoll(healDiceOf(row)) : null;
    if (!row || !dice || !parsed) {
      handleUse(rowId);
      return;
    }
    let drunk = false;
    dice.roll(row.name, [{ label: t("dice.heal", "Healing"), dice: parsed.dice, mod: parsed.mod, parts: partsFor(parsed.mod, [{ source: row.name, value: parsed.mod }]) }], (result) => {
      if (drunk) return;
      drunk = true;
      handleUse(rowId, Math.max(0, result[0]?.total ?? 0));
    });
  };

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
    const itemInfo = rowInfo(item);
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

  // Coins live in the coin bar, not the grid. Equipped gear comes first.
  const sortedInventory = useMemo(() => {
    return character.inventory.filter((row) => !isCoinRow(row)).sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
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
        if (activeInventoryTab === "items") return item.itemType !== "weapon" && item.itemType !== "armor";
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
      else counts.items++;
    }
    return counts;
  }, [sortedInventory]);

  const profSet = useMemo(() => collectProficiencies(character), [character]);
  const profBonusNow = getProficiencyBonus(character.level);

  const mapToSlotData = useCallback(
    (item: Character["inventory"][number]): ItemSlotData => {
      const itemInfo = rowInfo(item);
      const text = rowText(item, language);
      const proficiency = getRowProficiency(character, item, profSet);
      const attack = item.itemType === "weapon" ? getWeaponAttackDetails(character, { id: item.id } as Character["attacks"][number]) : null;
      return {
        proficiency,
        attackBonus: attack?.attackBonus,
        attackBonusIfProficient: attack && proficiency && !proficiency.proficient ? attack.attackBonus + profBonusNow : undefined,
        profBonus: profBonusNow,
        id: item.id,
        name: text.name || "Unnamed Item",
        icon: (itemInfo as any)?.icon || "",
        itemKey: item.itemId ?? item.srdItemName ?? item.name,
        category: item.category || "misc",
        itemType: item.itemType || "item",
        equipped: item.equipped,
        onGround: item.onGround,
        quantity: item.quantity,
        description: text.description,
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
    [character, profSet, profBonusNow, language]
  );

  const slotItems = useMemo(() => filteredInventory.map(mapToSlotData), [filteredInventory, mapToSlotData]);

  const allSlotItems = useMemo(() => sortedInventory.map(mapToSlotData), [sortedInventory, mapToSlotData]);
  const selectedItem = allSlotItems.find((i) => i.id === selectedSlotId) || null;
  const carried = carriedWeight(character.inventory);
  const capacity = (character.str || 10) * 15;

  // Armor, main hand, off hand: what the hand rules in equipRow decide.
  const wornSlots = useMemo(() => {
    const equipped = allSlotItems.filter((i) => i.equipped);
    const armor = equipped.find((i) => i.itemType === "armor" && i.armorType !== "shield");
    const both = equipped.find((i) => i.hand === "both");
    const main = both ?? equipped.find((i) => i.hand === "main") ?? equipped.find((i) => i.itemType === "weapon" && !i.hand);
    const off = both ? undefined : equipped.find((i) => i.armorType === "shield") ?? equipped.find((i) => i.hand === "off");
    const weaponStat = (i?: ItemSlotData) => (i && i.attackBonus !== undefined ? `${signed(i.attackBonus)} · ${i.damageDice || ""}`.trim() : "");
    return [
      { key: "armor", label: t("inventory.slot.armor", "Armor"), item: armor, stat: armor ? `AC ${armor.baseAC ?? ""}` : "" },
      { key: "main", label: both ? t("inventory.slot.both", "Both hands") : t("inventory.slot.main", "Main hand"), item: main, stat: weaponStat(main) },
      { key: "off", label: t("inventory.slot.off", "Off hand"), item: both ? undefined : off, stat: off?.armorType === "shield" ? "+2 AC" : weaponStat(off) },
    ];
  }, [allSlotItems, t]);

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
    <SectionCard id="inventory" title={t("section.inventory")} icon={<Backpack className="h-5 w-5" />}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("inventory.carrying", "Carrying")}</span>
            <span className={`text-xs font-bold ${carried > capacity ? "text-[var(--color-error-600)]" : "text-[var(--color-text-primary)]"}`}>
              {carried} <span className="text-[var(--color-text-muted)]">/ {capacity} lb</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]/50">
            <div
              className={`h-2 rounded-full ${carried > capacity ? "bg-[var(--color-error-500)]" : "bg-[var(--color-ink)]"}`}
              style={{ width: `${Math.min(100, Math.round((carried / Math.max(1, capacity)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Coins are inventory rows; tapping a coin edits its row. */}
        <CurrencyRow
          copper={coins.copper}
          silver={coins.silver}
          electrum={coins.electrum}
          gold={coins.gold}
          platinum={coins.platinum}
          onSet={(field, value) => {
            const inventory = setCoinAmount(character.inventory, COIN_BY_FIELD[field], value);
            onChange({ inventory, currency: coinsFromInventory(inventory) });
          }}
        />

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("inventory.wornHeld", { ac: derived.ac ?? character.ac }, "Worn and held · AC {ac}")}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {wornSlots.map((slot) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => slot.item && setSelectedSlotId(slot.item.id)}
                disabled={!slot.item}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 ${
                  slot.item ? "border-[var(--color-ink)] bg-[var(--color-ink)]/5" : "border-dashed border-[var(--color-border)] bg-[var(--color-bg)]"
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{slot.label}</span>
                {slot.item ? (
                  <>
                    <ItemIcon icon={slot.item.icon} item={slot.item.itemKey} className="h-8 w-8" />
                    <span className="w-full truncate text-center text-[11px] font-bold text-[var(--color-text-primary)]">{slot.item.name}</span>
                    <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">{slot.stat}</span>
                  </>
                ) : (
                  <span className="py-3 text-[11px] font-semibold text-[var(--color-text-muted)]">{t("inventory.empty", "Empty")}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <CategoryFilter
          categories={["all", "weapons", "armor", "items"]}
          active={activeInventoryTab}
          onSelect={(cat) => setActiveInventoryTab(cat as "all" | "weapons" | "armor" | "items")}
        />

        <InventoryGrid
          items={slotItems}
          onItemClick={(slot) => {
            setUseMessage(null);
            setSelectedSlotId(slot.id);
          }}
          selectedItemId={selectedSlotId}
          showEmptySlots={editMode}
          onEmptySlotClick={handleAddSrdItem}
        />

        {handPick && (() => {
          const item = character.inventory.find((i) => i.id === handPick);
          if (!item) return null;
          return (
            <HandChoiceSheet
              item={item}
              inventory={character.inventory}
              onPick={(hand) => { setHandPick(null); changeHeld(item.id, hand, item.name); }}
              onClose={() => setHandPick(null)}
            />
          );
        })()}
        {useMessage && !selectedItem && (
          <p role="status" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            {useMessage}
          </p>
        )}

        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedSlotId(null)}
          onEquipToggle={handleEquipToggle}
          canEquip={canEquipItem}
          canUse={(slot) => {
            const original = character.inventory.find((i) => i.id === slot.id);
            return original ? getRowUse(original) : null;
          }}
          onUse={(slot) => drinkOrUse(slot.id)}
          onPickUp={(slot) => updateItem(slot.id, { onGround: undefined })}
          onEdit={editMode ? handleEdit : undefined}
          onRemove={handleRemove}
          message={useMessage}
        />

        {editMode && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAddSrdItem}
              className="flex-1 btn-secondary flex items-center gap-1.5"
            >
              <Plus size={16} />
              {t("button.addSrdItem", "Add SRD Item")}
            </button>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="flex-1 btn-secondary flex items-center gap-1.5"
            >
              <Plus size={16} />
              {t("button.addCustomItem", "Add Custom Item")}
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
