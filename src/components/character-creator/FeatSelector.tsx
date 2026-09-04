"use client";

import { useState, useMemo } from "react";
import { XIcon as X, MagnifyingGlassIcon as MagnifyingGlass, CheckIcon as Check } from "@/components/icons";
import { getStaticFeats, type SRDFeat } from "@/lib/srd-client";
import { SourceBadge } from "@/components/SourceBadge";
import { isRecommended } from "@/lib/recommendations";
import { GroupedList } from "@/components/GroupedList";

interface FeatSelectorProps {
  onSelect: (feat: SRDFeat) => void;
  onClose: () => void;
  selectedFeat?: string;
  sources?: string[];
}

export function FeatSelector({ onSelect, onClose, selectedFeat, sources }: FeatSelectorProps) {
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
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-[var(--color-overlay)] p-4">
      <div className="w-full max-w-lg rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">Select a Feat</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] hover:border-[var(--color-border-active)] transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[var(--color-border)]">
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

        <div className="flex-1 overflow-y-auto px-4 py-3">
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
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pendingSelection}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
              pendingSelection
                ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90"
                : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
