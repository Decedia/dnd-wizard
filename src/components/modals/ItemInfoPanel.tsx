"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { findLocalizedItem, formatCost, weaponHandedness, type CatalogItem } from "@/data/item-catalog";

interface ItemInfoPanelProps {
  item: CatalogItem;
}

const RARITY_KEY: Record<string, string> = { "very rare": "veryRare" };

function Tag({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={
        strong
          ? "rounded-md border-2 border-ink bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink"
          : "rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted"
      }
    >
      {children}
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</span>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
      {note && <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">{note}</span>}
    </div>
  );
}

/** Full details of one catalog item, shown from the item picker's info button. */
export function ItemInfoPanel({ item }: ItemInfoPanelProps) {
  const { t: tr, language } = useLanguage();
  const w = item.weapon;
  const a = item.armor;
  const handedness = weaponHandedness(item);
  const cost = formatCost(item.cost);
  const range = w?.rangeFt ?? w?.throwFt;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{item.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.source !== "PHB" && <Tag>{item.source}</Tag>}
          <Tag>{item.category}</Tag>
          {item.magic && <Tag strong>{tr(`items.rarity.${RARITY_KEY[item.magic.rarity] ?? item.magic.rarity}`, item.magic.rarity)}</Tag>}
          {item.magic?.attunement && <Tag>{tr("items.attunement", "Requires attunement")}</Tag>}
          {handedness && <Tag>{tr(`item.handedness.${handedness}`, handedness)}</Tag>}
        </div>
      </div>

      {(w?.damage || a) && (
        <div className="grid grid-cols-2 gap-2">
          {w?.damage && <Stat label={tr("items.damage", "Damage")} value={w.damage.dice} note={w.damage.type} />}
          {w?.versatile && <Stat label={tr("item.twoHanded", "Two-handed")} value={w.versatile} />}
          {range && <Stat label={tr("item.rangeFt", "Range")} value={`${range.normal}/${range.long} ft`} />}
          {a && (
            <Stat
              label={tr("items.armorClass", "Armor Class")}
              value={a.class === "shield" ? `+${a.ac}` : String(a.ac)}
              note={
                a.class === "shield"
                  ? undefined
                  : a.dexCap === null
                    ? tr("items.fullDex", "Full DEX")
                    : a.dexCap === 0
                      ? tr("items.noDex", "No DEX")
                      : tr("item.maxDex", { max: a.dexCap }, "Max DEX +{max}")
              }
            />
          )}
        </div>
      )}

      {a && a.strMin > 0 && (
        <p className="rounded-xl border-2 border-warning-500/40 bg-warning-500/10 p-3 text-xs font-bold text-warning-600">
          {tr("item.strengthRequirement", { min: a.strMin }, "Requires STR {min}")}
        </p>
      )}

      {a?.stealthDisadvantage && (
        <p className="rounded-xl border-2 border-border-strong bg-surface p-3 text-xs font-bold text-ink">
          {tr("item.stealthDisadvantage", "Disadvantage on Stealth")}
        </p>
      )}

      {w && w.properties.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{tr("items.properties", "Properties")}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {w.properties.map((prop) => (
              <span key={prop} className="rounded-md border-2 border-border-strong bg-paper-muted px-2 py-0.5 text-[11px] font-semibold text-ink">
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.contents && item.contents.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{tr("items.contents", "Contents")}</span>
          <div className="mt-1.5 space-y-1.5">
            {item.contents.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border-2 border-border-strong bg-surface p-2.5">
                <span className="text-xs font-semibold text-ink">{findLocalizedItem(entry.id, language)?.name ?? entry.id}</span>
                {entry.quantity > 1 && <span className="text-[11px] font-bold text-ink-muted">×{entry.quantity}</span>}
              </div>
            ))}
          </div>
          {item.type === "pack" && (
            <p className="mt-1.5 text-[11px] text-ink-muted">{tr("item.packUnpacks", "Adding the pack adds each of these items.")}</p>
          )}
        </div>
      )}

      {item.description && <p className="whitespace-pre-line text-xs leading-relaxed text-ink-muted">{item.description}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Stat label={tr("items.cost", "Cost")} value={cost ? `${cost}${item.bundle ? ` / ${item.bundle}` : ""}` : "—"} />
        <Stat label={tr("items.weight", "Weight")} value={item.weight ? `${item.weight} lb` : "—"} />
      </div>
    </div>
  );
}
