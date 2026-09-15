"use client";

import { useState, useMemo } from "react";

interface GroupedListProps<T> {
  items: T[];
  isRecommended: (item: T) => boolean;
  renderItem: (item: T) => React.ReactNode;
  recommendedLabel?: string;
  allLabel?: string;
  emptyRecommendedMessage?: string;
  emptyAllMessage?: string;
}

export function GroupedList<T>({
  items,
  isRecommended,
  renderItem,
  recommendedLabel = "Recommended",
  allLabel = "All",
  emptyRecommendedMessage = "No recommended items found.",
  emptyAllMessage = "No items found.",
}: GroupedListProps<T>) {
  const [activeTab, setActiveTab] = useState<"recommended" | "all">("recommended");

  const recommendedItems = useMemo(() => items.filter(isRecommended), [items, isRecommended]);
  const effectiveTab = activeTab === "recommended" && recommendedItems.length === 0 && items.length > 0 ? "all" : activeTab;
  const displayedItems = useMemo(() => (effectiveTab === "recommended" ? recommendedItems : items), [effectiveTab, recommendedItems, items]);

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setActiveTab("recommended")}
          className={`flex-1 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            effectiveTab === "recommended"
              ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {recommendedLabel} ({recommendedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            effectiveTab === "all"
              ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {allLabel} ({items.length})
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {effectiveTab === "recommended" && recommendedItems.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-6">{emptyRecommendedMessage}</p>
        )}
        {effectiveTab === "all" && items.length === 0 && <p className="text-xs text-[var(--color-text-muted)] text-center py-6">{emptyAllMessage}</p>}
        {effectiveTab === "all" && recommendedItems.length === 0 && items.length > 0 && (
          <p className="text-[10px] text-[var(--color-text-muted)] text-center py-2">No recommendations for this level — showing all available spells</p>
        )}
        <div className="p-3 space-y-1.5">{displayedItems.map(renderItem)}</div>
      </div>
    </div>
  );
}
