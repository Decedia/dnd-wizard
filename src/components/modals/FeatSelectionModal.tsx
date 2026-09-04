"use client";

import { useState, useMemo } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass, CheckIcon as Check } from "@/components/icons";
import { getStaticFeats, type SRDFeat } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import { isRecommended } from "@/lib/recommendations";
import { GroupedList } from "@/components/GroupedList";
import { BasePopup } from "@/components/BasePopup";

interface FeatSelectionModalProps {
  onSelect: (feat: SRDFeat) => void;
  onClose: () => void;
  selectedFeat?: string;
  sources?: string[];
}

export function FeatSelectionModal({ onSelect, onClose, selectedFeat, sources }: FeatSelectionModalProps) {
  const feats = getStaticFeats(sources);
  const [search, setSearch] = useState("");
  const [expandedFeat, setExpandedFeat] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(selectedFeat || null);

  const filteredFeats = useMemo(() => {
    if (!search.trim()) return feats;
    const q = search.toLowerCase();
    return feats.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.prerequisites && f.prerequisites.toLowerCase().includes(q))
    );
  }, [feats, search]);

  const handleConfirm = () => {
    const feat = feats.find((f) => f.name === pendingSelection);
    if (feat) {
      onSelect(feat);
    }
    onClose();
  };

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title="Select a Feat"
      confirmLabel="Confirm"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      confirmDisabled={!pendingSelection}
      showFooter={true}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] -mx-4 -mt-3 mb-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feats..."
            className="input w-full pl-10 text-sm"
          />
        </div>
      </div>

      {filteredFeats.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No feats found.</p>
      )}
      <GroupedList
        items={filteredFeats}
        isRecommended={(feat) => isRecommended("feat", feat.name)}
        renderItem={(feat) => {
          const isSelected = pendingSelection === feat.name;
          const isExpanded = expandedFeat === feat.name;
          return (
            <div
              key={feat.name}
              className={`rounded-[var(--radius-sm)] border transition-all ${
                isSelected
                  ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              <div className="flex items-start gap-2 p-3">
                <button
                  type="button"
                  onClick={() => setPendingSelection(feat.name)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    isSelected
                      ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                   {isSelected && <Check className="h-3 w-3 text-[var(--color-surface)]" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                       <button
                         type="button"
                         onClick={() => setExpandedFeat(isExpanded ? null : feat.name)}
                         className="text-sm font-bold text-[var(--color-text-primary)] hover:underline text-left"
                       >
                         {feat.source && feat.source !== "PHB" && <SourceBadge source={feat.source} size="sm" />}
                         {feat.name}
                       </button>
                    </div>
                  </div>
                  {feat.prerequisites && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      Prerequisite: {feat.prerequisites}
                    </p>
                  )}
                  {isExpanded && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed whitespace-pre-line">
                      {feat.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }}
        emptyAllMessage="No feats found."
      />
    </BasePopup>
  );
}
