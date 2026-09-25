"use client";

import { useState, useMemo } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass, CheckIcon as Check } from "@/components/icons";
import { getStaticFeats, type SRDFeat } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
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
      <div className="space-y-2">
        {filteredFeats.map((feat) => {
          const isSelected = pendingSelection === feat.name;
          const sourceLabel = typeof feat.source === "string" ? feat.source : (feat as any).source?.name;
          return (
            <SplitSelectionCard
              key={feat.name}
              title={feat.name}
              subtitle={feat.prerequisites ? `Prerequisite: ${feat.prerequisites}` : undefined}
              badges={sourceLabel && sourceLabel !== "PHB" ? [sourceLabel] : []}
              isRecommended={isRecommended("feat", feat.name)}
              isSelected={isSelected}
              onSelect={() => setPendingSelection(feat.name)}
              infoType="modal"
              modalContent={
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {feat.description}
                </p>
              }
            />
          );
        })}
      </div>
    </BasePopup>
  );
}
