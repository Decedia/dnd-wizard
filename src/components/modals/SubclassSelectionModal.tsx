"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSubclasses, getStaticSubclassDetails } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { MagnifyingGlassIcon as MagnifyingGlass, StarIcon as Star, CrownIcon as Crown, InfoIcon as Info } from "@/components/icons";
import { SourceBadge } from "@/components/SourceBadge";
import { BasePopup } from "@/components/BasePopup";

interface SubclassSelectionModalProps {
  options: { name: string; description: string; hasDetails: boolean }[];
  selected: string;
  characterClass: string;
  onSelect: (name: string) => void;
  onClose: () => void;
  character?: any;
}

export function SubclassSelectionModal({
  options,
  selected,
  characterClass,
  onSelect,
  onClose,
  character,
}: SubclassSelectionModalProps) {
  const [detailsView, setDetailsView] = useState<string | null>(null);
  const [previewSubclass, setPreviewSubclass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoSubclass, setInfoSubclass] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const subclassData = useMemo(() => {
    const subclasses = getStaticSubclasses(characterClass);
    const map: Record<string, any> = {};
    for (const s of subclasses) {
      map[s.name] = s;
    }
    return map;
  }, [characterClass]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.name.toLowerCase().includes(q) || opt.description.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleConfirm = () => {
    if (previewSubclass) {
      onSelect(previewSubclass);
    }
  };

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title="Choose Subclass"
      confirmLabel="Confirm"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      confirmDisabled={!previewSubclass}
      showFooter={true}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] -mx-4 -mt-3 mb-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subclasses..."
            className="input w-full pl-10 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {filteredOptions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No subclasses found.</p>
        )}
        {filteredOptions.map((opt) => (
          <div key={opt.name} className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewSubclass(opt.name);
                  setDetailsView(null);
                  setInfoSubclass(null);
                }}
                className={`flex-1 p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                  previewSubclass === opt.name
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                  <span className="text-xs font-semibold flex items-center gap-1">
                    {opt.name}
                    {isRecommended("subclass", opt.name, characterClass) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">{opt.description}</p>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoSubclass(infoSubclass === opt.name ? null : opt.name);
                  setDetailsView(null);
                }}
                className={`h-10 w-10 flex items-center justify-center rounded-[var(--radius-sm)] border transition-all shrink-0 ${
                  infoSubclass === opt.name
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-label={`Info: ${opt.name}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            {infoSubclass === opt.name && (
              <div className="ml-4 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-xs font-bold text-[var(--color-text-primary)] mb-1">{opt.name}</div>
                <div className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{opt.description}</div>
                {(() => {
                  const details = getStaticSubclassDetails(characterClass, opt.name);
                  if (details?.features && details.features.length > 0) {
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Features</div>
                        {details.features.map((f: any, idx: number) => (
                          <div key={idx} className="text-[10px] text-[var(--color-text-secondary)]">
                            <span className="font-semibold">{f.name}</span>
                            {f.level && <span className="text-[var(--color-text-muted)]"> (Lv {f.level})</span>}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </BasePopup>
  );
}
