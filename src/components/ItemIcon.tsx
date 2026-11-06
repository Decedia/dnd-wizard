"use client";

import { findCatalogItem } from "@/data/item-catalog";
import { ITEM_ICONS } from "./item-icon-map";

interface ItemIconProps {
  /** A Game Icons name ("GiPlainDagger") or an emoji from an old save or custom item. */
  icon?: string;
  /** Catalog id or name, used when the row has no icon of its own. */
  item?: string;
  className?: string;
}

/** The item's own icon: a catalog Game Icon, else the emoji it carries, else a bag. */
export function ItemIcon({ icon, item, className = "h-6 w-6" }: ItemIconProps) {
  const name = icon && ITEM_ICONS[icon] ? icon : (item && findCatalogItem(item)?.icon) || undefined;
  const Icon = name ? ITEM_ICONS[name] : undefined;
  if (Icon) return <Icon className={`${className} text-ink`} aria-hidden />;
  if (icon && !icon.startsWith("Gi")) return <span className="leading-none">{icon}</span>;
  const Bag = ITEM_ICONS.GiSwapBag;
  return <Bag className={`${className} text-ink-muted`} aria-hidden />;
}
