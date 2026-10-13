"use client";

import { useMemo, useState } from "react";
import { Check, Flask, Info, MagnifyingGlass, Sword, Shield, Backpack } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticEquipments, getStaticWeapons } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SourceBadge } from "@/components/SourceBadge";
import { getMagicItems, getMundaneItem, getMundaneItems } from "@/data/items";
import { ItemInfoPanel, type ItemInfoItem } from "@/components/modals/ItemInfoPanel";

interface ItemSelectionModalProps {
  character: Character;
  onAdd: (item: Character["inventory"][number]) => void;
  onClose: () => void;
}

type ItemCategory = "weapons" | "armor" | "consumables" | "items";

export function ItemSelectionModal({ character, onAdd, onClose }: ItemSelectionModalProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("weapons");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [infoItem, setInfoItem] = useState<ItemInfoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const weapons = useMemo(
    () => sortBySource(getStaticWeapons(character.sources ?? [])),
    [character.sources],
  );

  const armors = useMemo(
    () =>
      sortBySource(
        getStaticEquipments(character.sources ?? []).filter((e) =>
          ["Light", "Medium", "Heavy", "Shield"].includes(e.armor_category ?? ""),
        ),
      ),
    [character.sources],
  );

  const items = useMemo(
    () =>
      sortBySource(
        getStaticEquipments(character.sources ?? []).filter((e) => {
          const cat = e.equipment_category?.toLowerCase() || "";
          return (
            !cat.includes("weapon") &&
            !cat.includes("armor") &&
            !cat.includes("shield") &&
            !cat.includes("adventuring")
          );
        }),
      ),
    [character.sources],
  );

  const consumables = useMemo(
    () => [
      ...getMundaneItems("consumable"),
      ...getMagicItems().filter((m) => m.type === "consumable"),
    ],
    [],
  );

  const magicInfo = (name: string) => {
    const record = getMundaneItem(name);
    return record && "rarity" in record
      ? (record as { rarity: string; attunement: boolean })
      : null;
  };

  const categories: { key: ItemCategory; labelKey: string; fallback: string; Icon: typeof Sword }[] =
    [
      { key: "weapons", labelKey: "items.cat.weapons", fallback: "Senjata", Icon: Sword },
      { key: "armor", labelKey: "items.cat.armor", fallback: "Armor", Icon: Shield },
      { key: "consumables", labelKey: "items.cat.consumables", fallback: "Habispakai", Icon: Flask },
      { key: "items", labelKey: "items.cat.items", fallback: "Barang", Icon: Backpack },
    ];

  const currentItems =
    activeCategory === "weapons"
      ? weapons
      : activeCategory === "armor"
        ? armors
        : activeCategory === "consumables"
          ? consumables
          : items;

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter(
      (item: any) =>
        item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q),
    );
  }, [currentItems, searchQuery]);

  const buildInventoryItem = (name: string): Character["inventory"][number] => {
    if (activeCategory === "weapons") {
      const w = weapons.find((x) => x.name === name)!;
      return {
        id: generateId(),
        name: w.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: w.name,
        itemType: "weapon",
        damageDice: w.damage?.damage_dice || "",
        damageType: w.damage?.damage_type?.name || "",
        category: w.category_range?.toLowerCase() === "melee" ? "melee" : "ranged",
        description: w.description || "",
        properties: (w.properties || []).map((p: any) => (p.name || "").toLowerCase()),
      };
    }
    if (activeCategory === "armor") {
      const a = armors.find((x) => x.name === name)!;
      return {
        id: generateId(),
        name: a.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: a.name,
        itemType: "armor",
        armorType: armorTypeOf(a.armor_category),
        baseAC: a.armor_class?.base,
        maxDexBonus: a.armor_class?.max_bonus ?? (a.armor_class?.dex_bonus ? null : 0),
        stealthDisadvantage: !!a.stealth_disadvantage,
        strengthRequirement: a.str_minimum ?? 0,
        description: a.description || "",
      };
    }
    if (activeCategory === "consumables") {
      const c = consumables.find((x) => x.name === name)!;
      const magic = magicInfo(c.name);
      return {
        id: generateId(),
        name: c.name,
        quantity: 1,
        equipped: false,
        source: "srd",
        srdItemName: c.name,
        itemType: "consumable",
        rarity: magic?.rarity,
        attunement: magic?.attunement ?? false,
        effect: c.description,
        description: c.description,
      };
    }
    const i = items.find((x) => x.name === name)!;
    return {
      id: generateId(),
      name: i.name,
      quantity: 1,
      equipped: false,
      source: "srd",
      srdItemName: i.name,
      itemType: "item",
      description: i.description || "",
    };
  };

  const handleAdd = () => {
    if (!selectedItem) return;
    onAdd(buildInventoryItem(selectedItem));
    setSelectedItem(null);
  };

  const footer = (
    <div className="flex gap-2 border-t border-border-strong bg-surface px-4 py-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border border-border-strong px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-paper-muted"
      >
        {t("common.close", "Tutup")}
      </button>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedItem}
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          selectedItem
            ? "bg-ink text-surface active:translate-y-0.5"
            : "cursor-not-allowed bg-paper-muted text-ink-subtle"
        }`}
      >
        {t("item.addItem", "Tambah Barang")}
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={t("item.addItem", "Tambah Barang")}
      footer={footer}
      showHeader={false}
    >
      {infoItem ? (
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <ItemInfoPanel item={infoItem} t={t} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 border-b border-border-strong">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSelectedItem(null);
                  setSearchQuery("");
                }}
                aria-pressed={activeCategory === cat.key}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-bold transition-all ${
                  activeCategory === cat.key
                    ? "border-b-2 border-ink bg-paper-muted text-ink"
                    : "border-b-2 border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <cat.Icon className="h-4 w-4 shrink-0" />
                {t(cat.labelKey, cat.fallback)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8">
            <div className="relative mb-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlass className="h-4 w-4 text-ink-muted" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("item.search", "Cari barang...")}
                className="w-full rounded-xl border-2 border-border-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
              />
            </div>

            {filteredItems.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-muted">
                {t("item.noResults", "Barang tidak ditemukan.")}
              </p>
            )}

            <div className="space-y-3">
              {filteredItems.map((item: any) => {
                const isSelected = selectedItem === item.name;
                const magic = magicInfo(item.name);
                return (
                  <div
                    key={item.name}
                    className={`flex flex-row overflow-hidden rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-ink bg-ink/5 shadow-sm"
                        : "border-border-strong bg-surface hover:border-ink/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item.name)}
                      className="flex flex-1 items-center justify-between p-4 text-left transition active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                        <ItemFacts item={item} magic={magic} />
                      </div>
                      {isSelected && <Check className="ml-2 h-5 w-5 shrink-0 text-ink" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInfoItem(item)}
                      aria-label={t("item.infoAbout", { item: item.name }, "Info {item}")}
                      className="flex w-12 shrink-0 items-center justify-center border-l-2 border-border-muted text-ink-muted transition hover:bg-ink/5 hover:text-ink active:scale-90"
                    >
                      <Info size={20} weight="bold" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function ItemFacts({ item, magic }: { item: any; magic: { rarity: string; attunement: boolean } | null }) {
  const { t } = useLanguage();
  const facts: string[] = [];
  if (item.damage?.damage_dice) {
    facts.push(
      `${item.damage.damage_dice}${item.damage.type ? ` ${item.damage.type.toLowerCase()}` : ""}`.trim(),
    );
  }
  if (item.armor_class?.base) facts.push(`AC ${item.armor_class.base}`);
  if (item.handedness) facts.push(t(`items.handedness.${item.handedness}`, item.handedness));
  if (item.range) facts.push(t(`items.range.${item.range}`, item.range));
  if (item.training) facts.push(t(`items.training.${item.training}`, item.training));
  if (magic?.rarity) facts.push(t(`items.rarity.${magic.rarity}`, magic.rarity));

  if (facts.length === 0) return null;
  return <p className="mt-1 text-[11px] font-medium leading-relaxed text-ink-muted">{facts.join(" · ")}</p>;
}

function armorTypeOf(category: string | undefined): Character["inventory"][number]["armorType"] {
  const value = (category || "").toLowerCase();
  return value === "light" || value === "medium" || value === "heavy" || value === "shield"
    ? value
    : undefined;
}

function sortBySource<T extends { source?: string; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sa = a.source || "PHB";
    const sb = b.source || "PHB";
    if (sa !== sb) {
      if (sa === "PHB") return -1;
      if (sb === "PHB") return 1;
      return sa.localeCompare(sb);
    }
    return a.name.localeCompare(b.name);
  });
}

let idCounter = 0;
function generateId(): string {
  return `item-${Date.now()}-${idCounter++}`;
}
