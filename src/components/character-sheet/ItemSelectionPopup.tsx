"use client";

import { useState, useEffect } from "react";
import { getStaticWeapons, getStaticEquipments, getEquipmentData } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { X, Sword, Shield, Backpack } from "phosphor-react";

interface ItemSelectionPopupProps {
  character: Character;
  onAdd: (item: Character["inventory"][number]) => void;
  onClose: () => void;
}

type ItemCategory = "weapons" | "armor" | "items";

export function ItemSelectionPopup({ character, onAdd, onClose }: ItemSelectionPopupProps) {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("weapons");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const weapons = getStaticWeapons().filter((w) => w.weapon_category === "Simple" || w.weapon_category === "Martial");
  const armors = getStaticEquipments().filter((e) => e.armor_category === "Light" || e.armor_category === "Medium" || e.armor_category === "Heavy" || e.armor_category === "Shield");
  const items = getStaticEquipments().filter((e) => {
    const cat = e.equipment_category?.toLowerCase() || "";
    return !cat.includes("weapon") && !cat.includes("armor") && !cat.includes("shield") && !cat.includes("adventuring");
  });

  const currentItems = activeCategory === "weapons" ? weapons : activeCategory === "armor" ? armors : items;

  const handleAdd = () => {
    if (!selectedItem) return;

    let newItem: Character["inventory"][number];

    if (activeCategory === "weapons") {
      const weapon = weapons.find((w) => w.name === selectedItem);
      if (!weapon) return;
      newItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: weapon.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: weapon.name,
        itemType: "weapon",
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        category: weapon.category_range?.toLowerCase() === "melee" ? "melee" : "ranged",
        description: JSON.stringify({
          type: "weapon",
          category: weapon.category_range,
          properties: weapon.properties?.map((p) => p.name) || [],
        }),
        properties: weapon.properties?.map((p) => p.name.toLowerCase()) || [],
      };
    } else if (activeCategory === "armor") {
      const armor = armors.find((a) => a.name === selectedItem);
      if (!armor) return;
      const armorType = armor.armor_category === "Light" ? "light" : armor.armor_category === "Medium" ? "medium" : armor.armor_category === "Heavy" ? "heavy" : "shield";
      newItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: armor.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: armor.name,
        itemType: "armor",
        armorType,
        baseAC: armor.armor_class?.base,
        maxDexBonus: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
        description: JSON.stringify({
          type: "armor",
          armorType,
          baseAC: armor.armor_class?.base,
          maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
        }),
      };
    } else {
      const item = items.find((i) => i.name === selectedItem);
      if (!item) return;
      const data = getEquipmentData(item.name);
      newItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: item.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: item.name,
        itemType: "item",
        description: JSON.stringify(data || { name: item.name }),
      };
    }

    onAdd(newItem);
    onClose();
  };

  const getCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case "weapons": return <Sword weight="regular" className="h-4 w-4" />;
      case "armor": return <Shield weight="regular" className="h-4 w-4" />;
      case "items": return <Backpack weight="regular" className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">Add Item</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-shrink-0 flex border-b border-[var(--color-border)]">
          {(["weapons", "armor", "items"] as ItemCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setActiveCategory(cat); setSelectedItem(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "text-[var(--color-text-primary)] bg-[var(--color-bg)] border-b-2 border-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              }`}
            >
              {getCategoryIcon(cat)}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div className="space-y-1.5">
            {currentItems.map((item: any) => {
              const isSelected = selectedItem === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedItem(item.name)}
                  className={`w-full px-3 py-2 text-left rounded-lg border transition-all ${
                    isSelected
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && <X weight="fill" className="h-3 w-3 text-[var(--color-surface)]" />}
                    <span className={`text-xs font-bold ${isSelected ? "" : "text-[var(--color-text-primary)]"}`}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-5">
                    {item.damage?.damage_dice && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">{item.damage.damage_dice} {item.damage?.damage_type?.name}</span>
                    )}
                    {item.armor_class?.base && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">AC {item.armor_class.base}</span>
                    )}
                    {item.weapon_category && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">{item.weapon_category}</span>
                    )}
                    {item.armor_category && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">{item.armor_category}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedItem}
            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedItem
                ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90"
                : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
            }`}
          >
            {selectedItem ? `Add ${selectedItem}` : "Select an item"}
          </button>
        </div>
      </div>
    </div>
  );
}
