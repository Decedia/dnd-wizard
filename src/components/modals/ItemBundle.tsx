"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export interface BundleItem {
  name: string;
  quantity: number;
}

export interface ItemBundleInfo {
  icon?: string;
  description?: string;
}

interface ItemBundleListProps {
  items: BundleItem[];
  getInfo?: (name: string) => ItemBundleInfo | null;
  emptyLabel?: string;
  /** Shows a "included" hint under each name, for granted bundles. */
  showIncluded?: boolean;
  className?: string;
}

/**
 * Renders the items a single choice grants - a light crossbow and 20 bolts,
 * or a burglar's pack and everything inside it. Each item is a row rather
 * than one comma-joined string, so quantities stay readable.
 */
export function ItemBundleList({
  items,
  getInfo,
  emptyLabel,
  showIncluded = false,
  className = "",
}: ItemBundleListProps) {
  const { t } = useLanguage();

  if (items.length === 0) {
    return emptyLabel ? (
      <p className="text-xs text-ink-muted">{emptyLabel}</p>
    ) : null;
  }

  return (
    <ul className={`space-y-1.5 ${className}`}>
      {items.map((item, index) => {
        const info = getInfo?.(item.name) ?? null;
        return (
          <li
            key={`${item.name}-${index}`}
            className="flex items-center gap-3 rounded-xl border-2 border-border-strong bg-surface p-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-muted">
              <span className="text-[18px] leading-none">{info?.icon || "📦"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-ink">{item.name}</h4>
              <p className="text-[11px] text-ink-muted">
                {showIncluded
                  ? t("equipment.included", "Disertakan")
                  : info?.description?.slice(0, 90) || t("items.type.gear", "Perlengkapan")}
              </p>
            </div>
            {item.quantity > 1 && (
              <span className="shrink-0 rounded-md bg-paper-muted px-2 py-0.5 text-[11px] font-bold text-ink">
                ×{item.quantity}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
