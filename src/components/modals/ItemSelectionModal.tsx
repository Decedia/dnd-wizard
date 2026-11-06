"use client";

import { useMemo, useState } from "react";
import { Check, Flask, Info, MagnifyingGlass, Sword, Shield, Backpack, Sparkle } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { getCatalog, isConsumable, weaponHandedness, type CatalogItem } from "@/data/item-catalog";
import { expandToRows } from "@/lib/inventory";
import { ItemInfoPanel } from "@/components/modals/ItemInfoPanel";

interface ItemSelectionModalProps {
  character: Character;
  /** One row, or several for a pack (a pack adds each item inside it). */
  onAdd: (rows: Character["inventory"]) => void;
  onClose: () => void;
}

type ItemCategory = "weapons" | "armor" | "consumables" | "items" | "magic";

function categoryOf(item: CatalogItem): ItemCategory | null {
  if (item.type === "coin") return null; // coins are set in the coin box
  if (item.type === "weapon") return "weapons";
  if (item.type === "armor" || item.type === "shield") return "armor";
  if (isConsumable(item)) return "consumables";
  if (item.type === "magic") return "magic";
  return "items";
}

export function ItemSelectionModal({ character, onAdd, onClose }: ItemSelectionModalProps) {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("weapons");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [infoItem, setInfoItem] = useState<CatalogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sources = character.sources ?? [];
  const byCategory = useMemo(() => {
    const groups: Record<ItemCategory, CatalogItem[]> = { weapons: [], armor: [], consumables: [], items: [], magic: [] };
    for (const item of getCatalog(language)) {
      const cat = categoryOf(item);
      if (!cat) continue;
      // Magic items are DMG; show them even when DMG is not ticked, the GM hands them out.
      if (sources.length > 0 && !item.magic && !sources.includes(item.source)) continue;
      groups[cat].push(item);
    }
    for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }, [language, sources]);

  const categories: { key: ItemCategory; labelKey: string; fallback: string; Icon: typeof Sword }[] = [
    { key: "weapons", labelKey: "items.cat.weapons", fallback: "Weapons", Icon: Sword },
    { key: "armor", labelKey: "items.cat.armor", fallback: "Armor", Icon: Shield },
    { key: "consumables", labelKey: "items.cat.consumables", fallback: "Consumables", Icon: Flask },
    { key: "items", labelKey: "items.cat.items", fallback: "Gear", Icon: Backpack },
    { key: "magic", labelKey: "items.cat.magic", fallback: "Magic", Icon: Sparkle },
  ];

  const currentItems = byCategory[activeCategory];

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [currentItems, searchQuery]);

  const handleAdd = () => {
    if (!selectedItem) return;
    onAdd(expandToRows(selectedItem, 1));
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
          <ItemInfoPanel item={infoItem} />
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
              {filteredItems.map((item) => {
                const isSelected = selectedItem === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-row overflow-hidden rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-ink bg-ink/5 shadow-sm"
                        : "border-border-strong bg-surface hover:border-ink/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item.id)}
                      className="flex flex-1 items-center justify-between p-4 text-left transition active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                        <ItemFacts item={item} />
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

function ItemFacts({ item }: { item: CatalogItem }) {
  const { t } = useLanguage();
  const facts: string[] = [];
  const w = item.weapon;
  if (w?.damage) facts.push(`${w.damage.dice} ${w.damage.type.toLowerCase()}`);
  if (item.armor) facts.push(item.armor.class === "shield" ? `AC +${item.armor.ac}` : `AC ${item.armor.ac}`);
  const handedness = weaponHandedness(item);
  if (handedness) facts.push(t(`item.handedness.${handedness}`, handedness));
  if (w) facts.push(t(`item.range.${w.range}`, w.range), t(`item.training.${w.class}`, w.class));
  if (!w && !item.armor) facts.push(item.category);
  if (item.magic) facts.push(t(`items.rarity.${item.magic.rarity === "very rare" ? "veryRare" : item.magic.rarity}`, item.magic.rarity));
  if (item.type === "pack" && item.contents) facts.push(t("item.packCount", { count: item.contents.length }, "{count} items inside"));

  if (facts.length === 0) return null;
  return <p className="mt-1 text-[11px] font-medium leading-relaxed text-ink-muted">{facts.join(" · ")}</p>;
}
