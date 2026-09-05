"use client";

import { useState, useEffect } from "react";
import { XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import type { Character } from "@/lib/storage";
import { DAMAGE_TYPES, type DamageType } from "@/lib/damage-types";

interface CustomItemModalProps {
  character: Character;
  onAdd: (item: Character["inventory"][number]) => void;
  onClose: () => void;
  editingItem?: Character["inventory"][number] | null;
}

type CustomItemType = "weapon" | "armor" | "item";

export function CustomItemModal({ character, onAdd, onClose, editingItem }: CustomItemModalProps) {
  const [itemType, setItemType] = useState<CustomItemType>(editingItem?.itemType === "armor" ? "armor" : editingItem?.itemType === "weapon" ? "weapon" : "item");
  const [name, setName] = useState(editingItem?.name || "");
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [damageDice, setDamageDice] = useState(editingItem?.damageDice || "");
  const [damageType, setDamageType] = useState<DamageType | "">((editingItem?.damageType as DamageType) || "");
  const [description, setDescription] = useState(editingItem?.description || "");
  const [isArmor, setIsArmor] = useState(editingItem?.itemType === "armor");
  const [baseAC, setBaseAC] = useState(editingItem?.baseAC?.toString() || "");
  const [maxDexBonus, setMaxDexBonus] = useState(editingItem?.maxDexBonus?.toString() || "");
  const [armorType, setArmorType] = useState<"light" | "medium" | "heavy" | "shield" | "">(
    (editingItem?.armorType as "light" | "medium" | "heavy" | "shield") || ""
  );
  const [category, setCategory] = useState<"melee" | "ranged" | "">(editingItem?.category === "ranged" ? "ranged" : "melee");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newItem: Character["inventory"][number] = {
      id: editingItem?.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      quantity,
      equipped: editingItem?.equipped || false,
      source: "custom",
      description: description || undefined,
    };

    if (itemType === "weapon") {
      newItem.itemType = "weapon";
      newItem.damageDice = damageDice || undefined;
      newItem.damageType = damageType || undefined;
      newItem.category = category || undefined;
    } else if (itemType === "armor" && isArmor) {
      newItem.itemType = "armor";
      newItem.armorType = armorType || undefined;
      newItem.baseAC = baseAC ? Number(baseAC) : undefined;
      newItem.maxDexBonus = maxDexBonus !== "" ? Number(maxDexBonus) : null;
    } else {
      newItem.itemType = "item";
    }

    if (editingItem) {
      onAdd({ ...newItem, id: editingItem.id });
    } else {
      onAdd(newItem);
    }
  };

  const isValid = name.trim() && (itemType !== "armor" || !isArmor || (baseAC && armorType));

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={editingItem ? "Edit Custom Item" : "Add Custom Item"}
      confirmLabel={editingItem ? "Save" : "Add"}
      cancelLabel="Cancel"
      onConfirm={handleSubmit}
      confirmDisabled={!isValid}
      showFooter={true}
    >
      <div className="space-y-3 px-4 py-3">
        <div>
          <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Item Type
          </label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as CustomItemType)}
            className="input w-full"
          >
            <option value="weapon">Weapon</option>
            <option value="armor">Armor</option>
            <option value="item">Item</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {}}
            className="input w-full"
            placeholder="Item name"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value || "1", 10))}
            className="input w-full"
          />
        </div>

        {itemType === "weapon" && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "melee" | "ranged" | "")}
                className="input w-full"
              >
                <option value="">Select category</option>
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Damage Dice
              </label>
              <input
                type="text"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
                className="input w-full"
                placeholder="e.g. 1d8"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Damage Type
              </label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as DamageType | "")}
                className="input w-full"
              >
                <option value="">Select damage type</option>
                {Object.entries(DAMAGE_TYPES).map(([key, style]) => (
                  <option key={key} value={key}>
                    {style.label}
                  </option>
                ))}
              </select>
              {damageType && (
                <div className="mt-1">
                  <DamageBadge type={damageType} size="sm" />
                </div>
              )}
            </div>
          </>
        )}

        {itemType === "armor" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isArmor"
              checked={isArmor}
              onChange={(e) => setIsArmor(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            <label htmlFor="isArmor" className="text-xs font-semibold text-[var(--color-text-primary)]">
              This is armor
            </label>
          </div>
        )}

        {itemType === "armor" && isArmor && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Armor Type
              </label>
              <select
                value={armorType}
                onChange={(e) => setArmorType(e.target.value as "light" | "medium" | "heavy" | "shield" | "")}
                className="input w-full"
              >
                <option value="">Select armor type</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
                <option value="shield">Shield</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Base AC
              </label>
              <input
                type="number"
                min={0}
                value={baseAC}
                onChange={(e) => setBaseAC(e.target.value)}
                className="input w-full"
                placeholder="e.g. 10"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Max Dex Bonus (optional, leave empty for unlimited)
              </label>
              <input
                type="number"
                min={-1}
                value={maxDexBonus}
                onChange={(e) => setMaxDexBonus(e.target.value)}
                className="input w-full"
                placeholder="e.g. 2"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {}}
            className="textarea w-full min-h-[80px]"
            placeholder="Item description..."
          />
        </div>
      </div>
    </BasePopup>
  );
}
