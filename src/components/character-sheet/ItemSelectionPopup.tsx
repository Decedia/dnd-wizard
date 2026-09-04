"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getStaticWeapons, getStaticEquipments, getEquipmentData } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { XIcon as X, SwordIcon as Sword, ShieldIcon as Shield, BackpackIcon as Backpack, InfoIcon as Info } from "@/components/icons";
import { DamageBadge } from "./DamageBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { InfoButton } from "@/components/InfoButton";

interface ItemSelectionPopupProps {
  character: Character;
  onAdd: (item: Character["inventory"][number]) => void;
  onClose: () => void;
}

type ItemCategory = "weapons" | "armor" | "items";

const PROPERTY_DESCRIPTIONS: Record<string, string> = {
  light: "Light: A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.",
  finesse: "Finesse: When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls.",
  versatile: "Versatile: This weapon can be used with one or two hands. A damage value in parentheses appears with the property—the damage when the weapon is used with two hands to make a melee attack.",
  heavy: "Heavy: Small creatures have disadvantage on attack rolls with heavy weapons. A heavy weapon's size and bulk make it too large for a Small creature to use effectively.",
  reach: "Reach: This weapon adds 5 feet to your reach when you attack with it, as well as when determining your reach for opportunity attacks with it.",
  loading: "Loading: Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.",
  ammunition: "Ammunition: You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition.",
  thrown: "Thrown: If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon.",
  "two-handed": "Two-Handed: This weapon requires two hands when you attack with it.",
  special: "Special: A weapon with the special property has unusual rules governing its use, explained in the weapon's description.",
  monk: "Monk: This weapon can be used as a monk weapon.",
};

export function ItemSelectionPopup({ character, onAdd, onClose }: ItemSelectionPopupProps) {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("weapons");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const idCounter = useRef(0);

  const generateId = useCallback(() => {
    return `item-${Date.now()}-${idCounter.current++}`;
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const weapons = useMemo(() => {
    return getStaticWeapons(character.sources)
      .filter((w) => w.weapon_category === "Simple" || w.weapon_category === "Martial")
      .sort((a, b) => {
        const sourceA = (a as any).source || "PHB";
        const sourceB = (b as any).source || "PHB";
        if (sourceA !== sourceB) {
          if (sourceA === "PHB") return -1;
          if (sourceB === "PHB") return 1;
          return sourceA.localeCompare(sourceB);
        }
        return a.name.localeCompare(b.name);
      });
  }, [character.sources]);

  const armors = useMemo(() => {
    return getStaticEquipments(character.sources)
      .filter((e) => e.armor_category === "Light" || e.armor_category === "Medium" || e.armor_category === "Heavy" || e.armor_category === "Shield")
      .sort((a, b) => {
        const sourceA = (a as any).source || "PHB";
        const sourceB = (b as any).source || "PHB";
        if (sourceA !== sourceB) {
          if (sourceA === "PHB") return -1;
          if (sourceB === "PHB") return 1;
          return sourceA.localeCompare(sourceB);
        }
        return a.name.localeCompare(b.name);
      });
  }, [character.sources]);

  const items = useMemo(() => {
    return getStaticEquipments(character.sources)
      .filter((e) => {
        const cat = e.equipment_category?.toLowerCase() || "";
        return !cat.includes("weapon") && !cat.includes("armor") && !cat.includes("shield") && !cat.includes("adventuring");
      })
      .sort((a, b) => {
        const sourceA = (a as any).source || "PHB";
        const sourceB = (b as any).source || "PHB";
        if (sourceA !== sourceB) {
          if (sourceA === "PHB") return -1;
          if (sourceB === "PHB") return 1;
          return sourceA.localeCompare(sourceB);
        }
        return a.name.localeCompare(b.name);
      });
  }, [character.sources]);

  const currentItems = activeCategory === "weapons" ? weapons : activeCategory === "armor" ? armors : items;

  const handleAdd = () => {
    if (!selectedItem) return;

    let newItem: Character["inventory"][number];

    if (activeCategory === "weapons") {
      const weapon = weapons.find((w) => w.name === selectedItem);
      if (!weapon) return;
      newItem = {
        id: generateId(),
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
          description: weapon.description || "",
        }),
        properties: weapon.properties?.map((p) => p.name.toLowerCase()) || [],
      };
    } else if (activeCategory === "armor") {
      const armor = armors.find((a) => a.name === selectedItem);
      if (!armor) return;
      const armorType = armor.armor_category === "Light" ? "light" : armor.armor_category === "Medium" ? "medium" : armor.armor_category === "Heavy" ? "heavy" : "shield";
      newItem = {
        id: generateId(),
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
          description: armor.description || "",
        }),
      };
    } else {
      const item = items.find((i) => i.name === selectedItem);
      if (!item) return;
      const data = getEquipmentData(item.name);
      newItem = {
        id: generateId(),
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
    setSelectedItem(null);
  };

  const getCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case "weapons": return <Sword className="h-4 w-4" />;
      case "armor": return <Shield className="h-4 w-4" />;
      case "items": return <Backpack className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[var(--color-overlay)] p-4"
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
              const damageType = item.damage?.damage_type?.name;
              const damageDice = item.damage?.damage_dice;
              const baseAC = item.armor_class?.base;
              const armorType = item.armor_category;
              const weaponCategory = item.weapon_category;
              return (
                <div key={item.name} className="w-full px-3 py-2 text-left rounded-lg border transition-all">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item.name)}
                    className={`w-full text-left rounded-lg border transition-all ${
                      isSelected
                        ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                    style={{ padding: "8px 12px" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isSelected ? "" : "text-[var(--color-text-primary)]"}`}>{item.name}</span>
                        <SourceBadge source={(item as any).source || "PHB"} size="sm" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {damageDice && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={isSelected ? { color: "var(--color-surface)", backgroundColor: "var(--color-surface)" + "20" } : { color: "var(--color-damage-slashing)", backgroundColor: "var(--color-damage-slashing-bg)" }}
                          >
                            {damageDice}
                          </span>
                        )}
                        {damageType && (
                          <DamageBadge type={damageType} size="sm" showLabel={false} />
                        )}
                        {baseAC && !isNaN(Number(baseAC)) && Number(baseAC) > 0 && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={isSelected ? { color: "var(--color-surface)", backgroundColor: "var(--color-surface)" + "20" } : { color: "var(--color-info-600)", backgroundColor: "var(--color-info-50)" }}
                          >
                            AC {baseAC}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-0">
                      {weaponCategory && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">{weaponCategory}</span>
                      )}
                      {armorType && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">{armorType}</span>
                      )}
                    </div>
                  </button>
                  {item.properties && item.properties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 ml-0">
                      {item.properties.map((prop: any) => {
                        const propName = prop.name || prop.index || prop;
                        const desc = PROPERTY_DESCRIPTIONS[propName.toLowerCase()];
                        return (
                          <div key={propName} className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-[var(--color-text-primary)] capitalize">{propName}</span>
                            {desc && <InfoButton title={propName} description={desc} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedItem}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
              selectedItem
                ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90"
                : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
            }`}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}
