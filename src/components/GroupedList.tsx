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
  const displayedItems = useMemo(() => (activeTab === "recommended" ? recommendedItems : items), [activeTab, recommendedItems, items]);
  const showRecommendedTab = recommendedItems.length > 0;

  return (
    <div className="flex flex-col">
      {showRecommendedTab && (
        <div className="flex border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setActiveTab("recommended")}
            className={`flex-1 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "recommended"
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
              activeTab === "all"
                ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {allLabel} ({items.length})
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "recommended" && recommendedItems.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-6">{emptyRecommendedMessage}</p>
        )}
        {activeTab === "all" && items.length === 0 && <p className="text-xs text-[var(--color-text-muted)] text-center py-6">{emptyAllMessage}</p>}
        <div className={showRecommendedTab ? "p-3 space-y-1.5" : "p-3 space-y-1.5"}>{displayedItems.map(renderItem)}</div>
      </div>
    </div>
  );
}
