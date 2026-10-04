"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass, CheckIcon as Check } from "@/components/icons";
import { getStaticFeats, featHasPrerequisite, type SRDFeat } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";

interface FeatSelectionModalProps {
  onSelect: (feat: SRDFeat) => void;
  onClose: () => void;
  selectedFeat?: string;
  sources?: string[];
  disabledFeats?: string[];
  hideFeatsWithPrerequisites?: boolean;
}

function pillClass(active: boolean) {
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
    active
      ? "bg-[var(--color-accent-indigo-600)] text-white border-transparent"
      : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
  }`;
}

export function FeatSelectionModal({ onSelect, onClose, selectedFeat, sources, disabledFeats = [], hideFeatsWithPrerequisites = false }: FeatSelectionModalProps) {
  const { t } = useLanguage();
  const feats = getStaticFeats(sources);
  const [search, setSearch] = useState("");
  const [pendingSelection, setPendingSelection] = useState<string | null>(selectedFeat || null);
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [prereqFilter, setPrereqFilter] = useState<"all" | "with" | "without">("all");

  const disabledFeatNames = useMemo(() => new Set(disabledFeats), [disabledFeats]);

  const availableSources = useMemo(() => {
    const sourceSet = new Set<string>();
    for (const feat of feats) {
      const src = feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name);
      if (src) sourceSet.add(src);
    }
    return Array.from(sourceSet).sort();
  }, [feats]);

  const filteredFeats = useMemo(() => {
    let base = feats.filter((feat) => !disabledFeatNames.has(feat.name));
    if (hideFeatsWithPrerequisites) {
      base = base.filter((feat) => !featHasPrerequisite(feat.name));
    }
    if (sourceFilter !== "ALL") {
      base = base.filter((feat) => (feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name)) === sourceFilter);
    }
    if (prereqFilter === "with") {
      base = base.filter((feat) => feat.prerequisites !== null);
    } else if (prereqFilter === "without") {
      base = base.filter((feat) => feat.prerequisites === null);
    }
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((feat) => feat.name.toLowerCase().includes(q) || (feat.description || "").toLowerCase().includes(q));
  }, [feats, search, disabledFeatNames, hideFeatsWithPrerequisites, sourceFilter, prereqFilter]);

  const handleConfirm = () => {
    const feat = feats.find((f) => f.name === pendingSelection);
    if (feat) {
      onSelect(feat);
    }
    onClose();
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!pendingSelection}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          pendingSelection
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={t("feat.selectOne", "Select a Feat")} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feats..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              type="button"
              onClick={() => setSourceFilter("ALL")}
              className={pillClass(sourceFilter === "ALL")}
            >
              All Sources
            </button>
            {availableSources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={pillClass(sourceFilter === src)}
              >
                {src}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPrereqFilter("all")}
              className={pillClass(prereqFilter === "all")}
            >
              All Feats
            </button>
            <button
              type="button"
              onClick={() => setPrereqFilter("with")}
              className={pillClass(prereqFilter === "with")}
            >
              With Prereq
            </button>
            <button
              type="button"
              onClick={() => setPrereqFilter("without")}
              className={pillClass(prereqFilter === "without")}
            >
              No Prereq
            </button>
          </div>
        </div>
        {filteredFeats.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No feats found.</p>
        )}
        <div className="space-y-2">
          {filteredFeats.map((feat) => {
            const isSelected = pendingSelection === feat.name;
            const sourceLabel = feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name);
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
      </div>
    </BottomSheet>
  );
}
