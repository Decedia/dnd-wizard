"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMundaneItem } from "@/data/items";

export type ItemInfoItem = ItemInfoPanelProps["item"];

interface ItemInfoPanelProps {
  item: {
    name: string;
    description?: string;
    damage?: { damage_dice?: string; damage_type?: { name?: string }; two_handed_damage?: { damage_dice?: string } };
    two_handed_damage?: { damage_dice?: string };
    armor_class?: { base?: number; max_bonus?: number | null };
    properties?: { name?: string; index?: string }[];
    weapon_category?: string;
    armor_category?: string;
    category_range?: string;
    equipment_category?: string;
    handedness?: string;
    range?: string;
    training?: string;
    source?: string;
    cost?: { quantity: number; unit: string } | null;
    weight?: number;
    stealth_disadvantage?: boolean;
    str_minimum?: number;
    pack?: { contents: { name: string; quantity: number }[] };
    stackable?: number | false;
  };
  t: (key: string, fallback?: string) => string;
}

export function ItemInfoPanel({ item, t }: ItemInfoPanelProps) {
  const { t: tCtx } = useLanguage();
  const tr = t || tCtx;

  const record = useMemo(() => getMundaneItem(item.name), [item.name]);
  const magic = record && "rarity" in record ? (record as { rarity: string; attunement: boolean }) : null;

  const dice = item.damage?.damage_dice;
  const versatile = item.two_handed_damage?.damage_dice;
  const damageType = item.damage?.damage_type?.name;
  const baseAC = item.armor_class?.base;
  const maxDex = item.armor_class?.max_bonus;
  const properties = (item.properties || []).map((p) => p.name || p.index).filter(Boolean) as string[];
  const packContents = item.pack?.contents || [];
  const source = item.source || "PHB";
  const weight = item.weight;
  const cost = item.cost;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{item.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {source && source !== "PHB" && (
            <span className="rounded bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {source}
            </span>
          )}
          {magic?.rarity && (
            <span className="rounded-md border-2 border-ink bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
              {tr(`items.rarity.${magic.rarity}`, magic.rarity)}
            </span>
          )}
          {magic?.attunement && (
            <span className="rounded-md bg-warning-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
              {tr("items.attunement", "Perlu penalaan")}
            </span>
          )}
          {item.handedness && (
            <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {tr(`items.handedness.${item.handedness}`, item.handedness)}
            </span>
          )}
          {item.range && (
            <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {tr(`items.range.${item.range}`, item.range)}
            </span>
          )}
        </div>
      </div>

      {(dice || baseAC !== undefined) && (
        <div className="grid grid-cols-2 gap-2">
          {dice && (
            <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {tr("items.damage", "Kerusakan")}
              </span>
              <p className="mt-0.5 text-sm font-bold text-ink">{dice}</p>
              {damageType && (
                <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {damageType}
                </span>
              )}
            </div>
          )}
          {versatile && (
            <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {tr("items.twoHanded", "Dua Tangan")}
              </span>
              <p className="mt-0.5 text-sm font-bold text-ink">{versatile}</p>
            </div>
          )}
          {baseAC !== undefined && (
            <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {tr("items.armorClass", "Kelas Armor")}
              </span>
              <p className="mt-0.5 text-sm font-bold text-ink">{baseAC}</p>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {maxDex === null
                  ? tr("items.fullDex", "DEX penuh")
                  : maxDex === 0
                    ? tr("items.noDex", "Tanpa DEX")
                    : tr("items.maxDex", maxDex != null ? `Maks DEX +${maxDex}` : "—")}
              </span>
            </div>
          )}
        </div>
      )}

      {item.str_minimum != null && item.str_minimum > 0 && (
        <p className="rounded-xl border-2 border-warning-500/40 bg-warning-500/10 p-3 text-xs font-bold text-warning-600">
          {tr("items.strengthRequirement", `Butuh STR ${item.str_minimum}`)}
        </p>
      )}

      {item.stealth_disadvantage && (
        <p className="rounded-xl border-2 border-border-strong bg-surface p-3 text-xs font-bold text-ink">
          {tr("items.stealthDisadvantage", "Kelemahan: saingan Stealth")}
        </p>
      )}

      {properties.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {tr("items.properties", "Sifat")}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {properties.map((prop) => (
              <span
                key={prop}
                className="rounded-md border-2 border-border-strong bg-paper-muted px-2 py-0.5 text-[11px] font-semibold text-ink"
              >
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}

      {packContents.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {tr("items.contents", "Isi Paket")}
          </span>
          <div className="mt-1.5 space-y-1.5">
            {packContents.map((entry, idx) => (
              <div
                key={`${entry.name}-${idx}`}
                className="flex items-center justify-between rounded-xl border-2 border-border-strong bg-surface p-2.5"
              >
                <span className="text-xs font-semibold text-ink">{entry.name}</span>
                {entry.quantity > 1 && (
                  <span className="text-[11px] font-bold text-ink-muted">×{entry.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {item.description && (
        <p className="whitespace-pre-line text-xs leading-relaxed text-ink-muted">
          {item.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {tr("items.cost", "Harga")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {cost ? `${cost.quantity} ${cost.unit}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {tr("items.weight", "Berat")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {weight !== undefined ? `${weight} lb` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
