"use client";

import { useState } from "react";

const CURRENCY_COLORS: Record<string, string> = {
  CP: "#b87333",
  SP: "#b0b0b0",
  EP: "#8db4c8",
  GP: "#c9a84c",
  PP: "#e5e5e5",
};

const CATEGORY_ICONS: Record<string, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  tool: "🔧",
  misc: "📦",
  consumable: "🧪",
};

const CATEGORY_LABELS: Record<string, string> = {
  weapon: "Weapons",
  armor: "Armor",
  tool: "Tools",
  misc: "Misc",
  consumable: "Consumables",
};

export interface ItemSlotData {
  id: string;
  name: string;
  icon: string;
  category: string;
  itemType: string;
  equipped: boolean;
  quantity?: number;
  description?: string;
  damageDice?: string;
  damageType?: string;
  properties?: string[];
  baseAC?: number;
  armorType?: string;
  maxDexBonus?: number | null;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  toolUse?: string;
  associatedAbility?: string;
  effect?: string;
  uses?: number;
  value?: string | null;
  weight?: number | null;
  hand?: "main" | "off" | "both";
  range?: { normal: number; long: number };
  versatileDice?: string | null;
  isGranted?: boolean;
  choiceGroupIndex?: number;
  choiceOptionIndex?: number;
}

export interface CurrencyRowProps {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
  onEdit?: () => void;
}

export function CurrencyRow({ copper, silver, electrum, gold, platinum, onEdit }: CurrencyRowProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" onClick={onEdit}>
      {[
        { label: "CP", value: copper, color: CURRENCY_COLORS.CP },
        { label: "SP", value: silver, color: CURRENCY_COLORS.SP },
        { label: "EP", value: electrum, color: CURRENCY_COLORS.EP },
        { label: "GP", value: gold, color: CURRENCY_COLORS.GP },
        { label: "PP", value: platinum, color: CURRENCY_COLORS.PP },
      ].map((curr) => (
        <button
          key={curr.label}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)] transition-colors shrink-0"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: curr.color }}
          />
          <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{curr.label}</span>
          <span className="text-xs font-bold text-[var(--color-text-primary)]">{curr.value}</span>
        </button>
      ))}
    </div>
  );
}

export interface CategoryFilterProps {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
}

export function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
            active === cat
              ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
        </button>
      ))}
    </div>
  );
}

export interface ItemSlotProps {
  item: ItemSlotData | null;
  onClick: () => void;
  label?: string;
  showEquippedBadge?: boolean;
}

export function ItemSlot({ item, onClick, label, showEquippedBadge = true }: ItemSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-1 p-1.5 transition-all relative ${
        item
          ? item.equipped
            ? "border-[var(--color-ink)] bg-[var(--color-ink)]/10"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
          : "border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-muted)]"
      }`}
    >
      {item ? (
        <>
          {showEquippedBadge && item.equipped && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-ink)] text-[var(--color-surface)] text-[8px] font-bold flex items-center justify-center leading-none">
              E
            </span>
          )}
          <span className="text-2xl leading-none">{item.icon || "📦"}</span>
          <span className="text-[9px] font-bold text-[var(--color-text-secondary)] text-center leading-tight line-clamp-2 w-full">
            {item.name}
          </span>
          {item.quantity && item.quantity > 1 && (
            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">x{item.quantity}</span>
          )}
        </>
      ) : (
        <>
          <span className="text-2xl text-[var(--color-text-muted)] leading-none">{label || "+"}</span>
          {label && <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{label}</span>}
        </>
      )}
    </button>
  );
}

export interface ItemDetailPanelProps {
  item: ItemSlotData | null;
  onEquipToggle: (item: ItemSlotData) => void;
  onEdit?: (item: ItemSlotData) => void;
  onRemove?: (item: ItemSlotData) => void;
  visible: boolean;
  canEquip: (item: ItemSlotData) => boolean;
}

export function ItemDetailPanel({ item, onEquipToggle, onEdit, onRemove, visible, canEquip }: ItemDetailPanelProps) {
  if (!item) return null;

  const infoRows: { label: string; value: string }[] = [];

  if (item.itemType === "weapon") {
    infoRows.push({ label: "Type", value: item.category || "melee" });
    infoRows.push({ label: "Damage", value: `${item.damageDice || "—"} ${item.damageType || ""}`.trim() });
    if (item.properties && item.properties.length > 0) {
      infoRows.push({ label: "Properties", value: item.properties.join(", ") });
    }
    if (item.range) {
      infoRows.push({ label: "Range", value: `${item.range.normal}/${item.range.long} ft` });
    }
    if (item.versatileDice) {
      infoRows.push({ label: "Versatile", value: item.versatileDice });
    }
  } else if (item.itemType === "armor") {
    infoRows.push({ label: "AC", value: String(item.baseAC || 0) });
    if (item.maxDexBonus !== null && item.maxDexBonus !== undefined) {
      infoRows.push({ label: "Dex Bonus", value: item.maxDexBonus === 0 ? "None" : `Max +${item.maxDexBonus}` });
    }
    infoRows.push({ label: "Type", value: item.armorType || "—" });
    if (item.stealthDisadvantage) {
      infoRows.push({ label: "Stealth", value: "Disadvantage" });
    }
    if (item.strengthRequirement && item.strengthRequirement > 0) {
      infoRows.push({ label: "STR Req", value: String(item.strengthRequirement) });
    }
  } else if (item.itemType === "tool") {
    infoRows.push({ label: "Use", value: item.toolUse || "—" });
    infoRows.push({ label: "Ability", value: item.associatedAbility || "—" });
  } else if (item.category === "consumable") {
    infoRows.push({ label: "Effect", value: item.effect || "—" });
    infoRows.push({ label: "Uses", value: String(item.uses || 1) });
  }

  if (item.value) {
    infoRows.push({ label: "Value", value: item.value });
  }
  if (item.weight !== null && item.weight !== undefined) {
    infoRows.push({ label: "Weight", value: `${item.weight} lb` });
  }

  return (
    <div
      className="overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        maxHeight: visible ? "300px" : "0px",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="p-3 mt-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon || "📦"}</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{item.name}</span>
            {item.equipped && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-ink)] text-[var(--color-surface)] text-[9px] font-bold">
                EQUIPPED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEquip(item) && (
              <button
                type="button"
                onClick={() => onEquipToggle(item)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-colors ${
                  item.equipped
                    ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                }`}
              >
                {item.equipped ? "Unequip" : "Equip"}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-2 py-1.5 rounded text-[11px] font-bold bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] transition-colors"
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="px-2 py-1.5 rounded text-[11px] font-bold text-[var(--color-error-500)] hover:bg-[var(--color-error-50)] transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {infoRows.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{row.label}:</span>
                <span className="text-[11px] text-[var(--color-text-primary)]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
        {item.description && (
          <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export interface InventoryGridProps {
  items: ItemSlotData[];
  totalSlots?: number;
  onItemClick: (item: ItemSlotData | null, index: number) => void;
  selectedItemId?: string | null;
  onEquipToggle?: (item: ItemSlotData) => void;
  showEmptySlots?: boolean;
  emptySlotLabel?: string;
  canEquip?: (item: ItemSlotData) => boolean;
  onEmptySlotClick?: () => void;
  lockedSlotCount?: number;
}

export function InventoryGrid({
  items,
  totalSlots = 20,
  onItemClick,
  selectedItemId,
  onEquipToggle,
  showEmptySlots = true,
  emptySlotLabel,
  canEquip = () => true,
  onEmptySlotClick,
  lockedSlotCount = 0,
}: InventoryGridProps) {
  const visibleCount = showEmptySlots
    ? Math.max(totalSlots, Math.ceil(items.length / 4) * 4)
    : items.length;
  const slots: (ItemSlotData | null)[] = [];
  for (let i = 0; i < visibleCount; i++) {
    slots.push(i < items.length ? items[i] : null);
  }

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;
  const [detailVisible, setDetailVisible] = useState(false);

  const handleSlotClick = (item: ItemSlotData | null, index: number) => {
    if (!item) {
      onEmptySlotClick?.();
      return;
    }
    onItemClick(item, index);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-[6px]">
        {slots.map((item, index) => (
          <ItemSlot
            key={item?.id || `empty-${index}`}
            item={item}
            onClick={() => handleSlotClick(item, index)}
            label={!item && index < lockedSlotCount ? "🔒" : (emptySlotLabel || (index < lockedSlotCount ? "?" : "+"))}
            showEquippedBadge={index >= lockedSlotCount}
          />
        ))}
      </div>
      {selectedItem && (
        <ItemDetailPanel
          item={selectedItem}
          onEquipToggle={onEquipToggle || (() => {})}
          visible={detailVisible}
          canEquip={canEquip}
        />
      )}
    </div>
  );
}
