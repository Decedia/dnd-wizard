"use client";

import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { RichText } from "@/components/RichText";

export type ItemUseAction = "heal" | "open" | "consume" | null;

const CURRENCY_COLORS: Record<string, string> = {
  CP: "#b87333",
  SP: "#b0b0b0",
  EP: "#8db4c8",
  GP: "#c9a84c",
  PP: "#e5e5e5",
};

const CATEGORY_LABELS: Record<string, string> = {
  weapon: "Weapon",
  armor: "Armor",
  tool: "Tool",
  misc: "Misc",
  consumable: "Consumable",
  item: "Gear",
  instrument: "Instrument",
};

export interface ItemSlotData {
  id: string;
  name: string;
  icon: string;
  /** Catalog id or name, for the item's icon. */
  itemKey?: string;
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
  onGround?: boolean;
  range?: { normal: number; long: number };
  versatileDice?: string | null;
  isGranted?: boolean;
  choiceGroupIndex?: number;
  choiceOptionIndex?: number;
  /** Null when proficiency doesn't apply (gear) or can't be told. */
  proficiency?: { kind: "weapon" | "armor" | "shield" | "tool"; proficient: boolean } | null;
  attackBonus?: number;
  /** Set only when not proficient: what the attack would be with proficiency. */
  attackBonusIfProficient?: number;
  profBonus?: number;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** ● proficient, ○ not proficient: the same bubbles the paper sheet uses for skills. */
export function ProficiencyDot({ proficient, className = "" }: { proficient: boolean; className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      role="img"
      aria-label={proficient ? t("proficiency.proficient", "Proficient") : t("proficiency.notProficient", "Not proficient")}
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
        proficient
          ? "bg-[var(--color-ink)]"
          : "border-2 border-[var(--color-warning-500)] bg-transparent"
      } ${className}`}
    />
  );
}

/** The rule text shown with the dot in the item details. */
function proficiencyText(t: ReturnType<typeof useLanguage>["t"], item: ItemSlotData): string | null {
  const p = item.proficiency;
  if (!p) return null;
  const pb = item.profBonus ?? 2;
  if (p.kind === "weapon") {
    return p.proficient
      ? t("proficiency.weaponYes", { pb: signed(pb) }, "Proficient: you add your proficiency bonus ({pb}) to attack rolls with it.")
      : t("proficiency.weaponNo", "Not proficient: you don't add your proficiency bonus to attack rolls with it.");
  }
  if (p.kind === "armor" || p.kind === "shield") {
    return p.proficient
      ? t("proficiency.armorYes", "Proficient: you wear it with no penalty.")
      : t("proficiency.armorNo", "Not proficient: while you wear it you have disadvantage on any ability check, saving throw or attack roll that uses Strength or Dexterity, and you can't cast spells.");
  }
  return p.proficient
    ? t("proficiency.toolYes", { pb: signed(pb) }, "Proficient: add your proficiency bonus ({pb}) to ability checks you make with it.")
    : t("proficiency.toolNo", "Not proficient: checks with it use only your ability modifier.");
}

export interface CurrencyRowProps {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
  /** When set, tapping a coin lets you type a new amount. */
  onSet?: (field: "copper" | "silver" | "electrum" | "gold" | "platinum", value: number) => void;
}

export function CurrencyRow({ copper, silver, electrum, gold, platinum, onSet }: CurrencyRowProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState<string | null>(null);
  const coins = [
    { field: "gold" as const, label: "GP", value: gold, color: CURRENCY_COLORS.GP },
    { field: "silver" as const, label: "SP", value: silver, color: CURRENCY_COLORS.SP },
    { field: "copper" as const, label: "CP", value: copper, color: CURRENCY_COLORS.CP },
    { field: "electrum" as const, label: "EP", value: electrum, color: CURRENCY_COLORS.EP },
    { field: "platinum" as const, label: "PP", value: platinum, color: CURRENCY_COLORS.PP },
  ];
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {coins.map((coin) =>
        editing === coin.field && onSet ? (
          <input
            key={coin.field}
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
            defaultValue={coin.value}
            aria-label={coin.label}
            onBlur={(e) => {
              onSet(coin.field, parseInt(e.target.value || "0", 10));
              setEditing(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-11 w-full rounded-xl border-2 border-[var(--color-ink)] bg-[var(--color-surface)] px-2 text-center text-xs font-bold text-[var(--color-text-primary)]"
          />
        ) : (
          <button
            key={coin.field}
            type="button"
            onClick={() => onSet && setEditing(coin.field)}
            aria-label={onSet ? t("inventory.editCoin", { coin: coin.label }, "Edit {coin}") : coin.label}
            className="flex h-11 min-w-0 flex-col items-center justify-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-1 transition-colors hover:border-[var(--color-border-active)]"
          >
            <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-text-muted)]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: coin.color }} />
              {coin.label}
            </span>
            <span className="max-w-full truncate text-sm font-bold leading-tight text-[var(--color-text-primary)]">{coin.value}</span>
          </button>
        ),
      )}
    </div>
  );
}

export interface CategoryFilterProps {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
}

const FILTER_LABELS: Record<string, [string, string]> = {
  all: ["inventory.filter.all", "All"],
  weapons: ["inventory.filter.weapons", "Weapons"],
  armor: ["inventory.filter.armor", "Armor"],
  items: ["inventory.filter.items", "Items"],
};

export function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  const { t } = useLanguage();
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
          {FILTER_LABELS[cat] ? t(FILTER_LABELS[cat][0], FILTER_LABELS[cat][1]) : CATEGORY_LABELS[cat] || cat}
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
  selected?: boolean;
}

/** One square inventory slot. Every slot is the same size; the count sits in a corner badge. */
export function ItemSlot({ item, onClick, label, showEquippedBadge = true, selected = false }: ItemSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item ? item.name : undefined}
      className={`relative aspect-square w-full min-w-0 overflow-hidden rounded-[8px] border-2 flex flex-col items-center justify-center gap-1 px-1 transition-all ${
        item
          ? item.equipped
            ? "border-[var(--color-ink)] bg-[var(--color-ink)]/10"
            : selected
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-[0_0_0_2px_var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
          : "border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text-muted)]"
      }`}
    >
      {item ? (
        <>
          {item.proficiency && <ProficiencyDot proficient={item.proficiency.proficient} className="absolute top-1.5 left-1.5" />}
          {item.onGround && (
            <span className="absolute top-1 right-1 rounded-full border border-[var(--color-ink)] bg-[var(--color-surface)] px-1 text-[7px] font-bold uppercase leading-[12px] text-[var(--color-ink)]">
              {"↓"}
            </span>
          )}
          {showEquippedBadge && item.equipped && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-ink)] text-[var(--color-surface)] text-[8px] font-bold flex items-center justify-center leading-none">
              E
            </span>
          )}
          <ItemIcon icon={item.icon} item={item.itemKey} className="h-7 w-7 shrink-0" />
          <span className="h-[22px] w-full text-[9px] font-bold text-[var(--color-text-secondary)] text-center leading-[11px] line-clamp-2">
            {item.name}
          </span>
          {item.quantity !== undefined && item.quantity > 1 && (
            <span className="absolute bottom-1 right-1 min-w-[18px] h-4 px-1 rounded-full bg-[var(--color-ink)] text-[var(--color-surface)] text-[9px] font-bold flex items-center justify-center leading-none">
              x{item.quantity}
            </span>
          )}
        </>
      ) : (
        <span className="text-2xl text-[var(--color-text-muted)] leading-none">{label || "+"}</span>
      )}
    </button>
  );
}

export interface ItemDetailPanelProps {
  item: ItemSlotData | null;
  onEquipToggle: (item: ItemSlotData) => void;
  onEdit?: (item: ItemSlotData) => void;
  onRemove?: (item: ItemSlotData) => void;
  onClose: () => void;
  canEquip: (item: ItemSlotData) => boolean;
  /** What "Use" does for this item, or null when it cannot be used. */
  canUse?: (item: ItemSlotData) => ItemUseAction;
  onUse?: (item: ItemSlotData) => void;
  /** A dropped item: back into the pack. */
  onPickUp?: (item: ItemSlotData) => void;
  /** A line shown after Use, such as "Healed 7 HP". */
  message?: string | null;
}

/** Item details in a sheet that slides up over the grid, with big action buttons. */
export function ItemDetailPanel({ item, onEquipToggle, onEdit, onRemove, onClose, canEquip, canUse, onUse, onPickUp, message }: ItemDetailPanelProps) {
  const { t } = useLanguage();
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);
  if (!item) return null;
  const useAction = canUse ? canUse(item) : null;
  const profText = proficiencyText(t, item);

  const infoRows: { label: string; value: string }[] = [];

  if (item.itemType === "weapon") {
    if (item.attackBonus !== undefined) {
      infoRows.push({
        label: t("proficiency.attack", "Attack"),
        value:
          item.attackBonusIfProficient !== undefined
            ? t("proficiency.attackIfProficient", { bonus: signed(item.attackBonus), full: signed(item.attackBonusIfProficient) }, "{bonus} ({full} if proficient)")
            : signed(item.attackBonus),
      });
    }
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
  if (item.weight) {
    infoRows.push({ label: "Weight", value: `${item.weight} lb` });
  }

  const kind = [CATEGORY_LABELS[item.itemType] || item.itemType, item.equipped ? t("inventory.equipped", "Equipped") : null, item.onGround ? t("inventory.onGround", "On the ground") : null, item.quantity && item.quantity > 1 ? `x${item.quantity}` : null]
    .filter(Boolean)
    .join(" · ");
  const actions: { key: string; label: string; onClick: () => void; primary?: boolean; danger?: boolean }[] = [];
  if (useAction && onUse)
    actions.push({
      key: "use",
      primary: true,
      onClick: () => onUse(item),
      label: useAction === "heal" ? t("inventory.drink", "Drink") : useAction === "open" ? t("inventory.open", "Open") : t("inventory.use", "Use"),
    });
  if (item.onGround && onPickUp)
    actions.push({ key: "pickUp", primary: true, onClick: () => onPickUp(item), label: t("inventory.pickUp", "Pick up") });
  if (canEquip(item))
    actions.push({
      key: "equip",
      primary: !useAction,
      onClick: () => onEquipToggle(item),
      label: item.equipped ? t("inventory.unequip", "Unequip") : t("inventory.equip", "Equip"),
    });
  if (onEdit) actions.push({ key: "edit", onClick: () => onEdit(item), label: t("button.edit", "Edit") });
  if (onRemove) actions.push({ key: "remove", danger: true, onClick: () => onRemove(item), label: t("inventory.remove", "Remove") });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={item.name}>
      <button type="button" aria-label={t("common.close", "Close")} onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        className="relative mx-auto w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[22px] bg-[var(--color-surface)] px-4 pt-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border-2 border-[var(--color-ink)]">
            <ItemIcon icon={item.icon} item={item.itemKey} className="h-9 w-9" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-tight text-[var(--color-text-primary)]">{item.name}</h3>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">{kind}</p>
          </div>
        </div>
        {profText && (
          <p
            className={`mt-3 flex items-start gap-2 rounded-xl border-2 p-2.5 text-xs leading-relaxed ${
              item.proficiency?.proficient
                ? "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                : "border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 font-semibold text-[var(--color-warning-600)]"
            }`}
          >
            <ProficiencyDot proficient={!!item.proficiency?.proficient} className="mt-0.5" />
            <span>{profText}</span>
          </p>
        )}
        {infoRows.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {infoRows.map((row) => (
              <div key={row.label} className="min-w-0 rounded-xl border-2 border-[var(--color-border)] px-2 py-1.5">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{row.label}</span>
                <span className="block break-words text-xs font-bold text-[var(--color-text-primary)]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
        {item.description && (
          <RichText text={item.description} className="mt-3 text-xs text-[var(--color-text-secondary)]" />
        )}
        {message && (
          <p role="status" className="mt-3 rounded-xl border-2 border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)]">
            {message}
          </p>
        )}
        {actions.length > 0 && (
          <div className={`mt-4 grid gap-2 ${actions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={a.onClick}
                className={`h-12 rounded-full border-2 text-sm font-bold transition-colors ${
                  a.primary
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                    : a.danger
                      ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-error-600)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface InventoryGridProps {
  items: ItemSlotData[];
  onItemClick: (item: ItemSlotData) => void;
  selectedItemId?: string | null;
  /** Empty slots after the items: enough to finish the row, plus one more row. */
  showEmptySlots?: boolean;
  onEmptySlotClick?: () => void;
}

export function InventoryGrid({ items, onItemClick, selectedItemId, showEmptySlots = true, onEmptySlotClick }: InventoryGridProps) {
  const empties = showEmptySlots ? ((4 - (items.length % 4)) % 4) + 4 : 0;
  return (
    <div className="grid grid-cols-4 gap-[6px]">
      {items.map((item) => (
        <ItemSlot key={item.id} item={item} onClick={() => onItemClick(item)} selected={item.id === selectedItemId} />
      ))}
      {Array.from({ length: empties }, (_, i) => (
        <ItemSlot key={`empty-${i}`} item={null} onClick={() => onEmptySlotClick?.()} />
      ))}
    </div>
  );
}
