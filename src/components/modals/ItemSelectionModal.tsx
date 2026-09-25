"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getStaticWeapons, getStaticEquipments, getEquipmentData } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { XIcon as X, SwordIcon as Sword, ShieldIcon as Shield, BackpackIcon as Backpack, CheckIcon as Check } from "@/components/icons";
import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";

interface ItemSelectionModalProps {
  character: Character;
  onAdd: (item: Character["inventory"][number]) => void;
  onClose: () => void;
}

type ItemCategory = "weapons" | "armor" | "items";

export function ItemSelectionModal({ character, onAdd, onClose }: ItemSelectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("weapons");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredItems = currentItems.filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
  });

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

  const getItemSubtitle = (item: any) => {
    const parts: string[] = [];
    if (item.damage?.damage_dice) parts.push(item.damage.damage_dice);
    if (item.armor_class?.base) parts.push(`AC ${item.armor_class.base}`);
    if (item.weapon_category) parts.push(item.weapon_category);
    if (item.armor_category) parts.push(item.armor_category);
    if (item.equipment_category) parts.push(item.equipment_category);
    return parts.join(" • ") || undefined;
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        Done
      </button>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedItem}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          selectedItem
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Add Item
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Add Item" footer={stickyFooter} showHeader={false}>
      <div className="flex-shrink-0 flex border-b border-[var(--color-border)]">
        {(["weapons", "armor", "items"] as ItemCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setActiveCategory(cat); setSelectedItem(null); setSearchQuery(""); }}
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

      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredItems.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No items match your search.</p>
        )}
        {filteredItems.map((item: any) => {
          const isSelected = selectedItem === item.name;
          const damageType = item.damage?.damage_type?.name;
          const damageDice = item.damage?.damage_dice;
          const baseAC = item.armor_class?.base;
          const weaponCategory = item.weapon_category;
          const armorType = item.armor_category;
          const source = (item as any).source || "PHB";
          const subtitle = getItemSubtitle(item);
          const badges: string[] = [];
          if (source && source !== "PHB") badges.push(source);
          if (damageDice) badges.push(damageDice);
          if (baseAC) badges.push(`AC ${baseAC}`);
          return (
            <SplitSelectionCard
              key={item.name}
              title={item.name}
              subtitle={subtitle}
              badges={badges.length > 0 ? badges : undefined}
              isSelected={isSelected}
              onSelect={() => setSelectedItem(item.name)}
              infoType="expand"
              isExpanded={isSelected}
              expandedContent={
                <div className="space-y-1">
                  {item.properties && item.properties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.properties.map((prop: any) => {
                        const propName = prop.name || prop.index || prop;
                        return (
                          <span key={propName} className="text-[10px] font-medium text-[var(--color-text-primary)] capitalize">
                            {propName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {damageType && <DamageBadge type={damageType} size="sm" showLabel={true} />}
                  {weaponCategory && <span className="text-[10px] text-[var(--color-text-muted)]">{weaponCategory}</span>}
                  {armorType && <span className="text-[10px] text-[var(--color-text-muted)]">{armorType}</span>}
                </div>
              }
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}
