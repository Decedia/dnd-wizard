"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSubclasses, getStaticSubclassDetails } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { MagnifyingGlassIcon as MagnifyingGlass, StarIcon as Star, InfoIcon as Info } from "@/components/icons";
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

  const previewFeatures = useMemo(() => {
    if (!previewSubclass || !subclassData[previewSubclass]) return [];
    const features = subclassData[previewSubclass].features || [];
    const grouped: Record<number, any[]> = {};
    for (const f of features) {
      const lv = f.level || 0;
      if (!grouped[lv]) grouped[lv] = [];
      grouped[lv].push(f);
    }
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((lv) => ({ level: lv, features: grouped[lv] }));
  }, [previewSubclass, subclassData]);

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
            <button
              type="button"
              onClick={() => {
                setPreviewSubclass(opt.name);
                setDetailsView(null);
              }}
              className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                previewSubclass === opt.name
                  ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold flex items-center gap-1">
                  {opt.name}
                  {isRecommended("subclass", opt.name, characterClass) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                </span>
                  {opt.hasDetails && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDetailsView(opt.name); }}
                      className="h-10 w-10 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all shrink-0"
                      aria-label={`Info: ${opt.name}`}
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  )}
              </div>
            </button>
            {previewSubclass === opt.name && previewFeatures.length > 0 && (
              <div className="ml-4 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Features by Level</div>
                <div className="space-y-2">
                  {previewFeatures.map(({ level, features }) => (
                    <div key={level}>
                      <div className="text-[10px] font-bold text-[var(--color-text-primary)] mb-1">Level {level}</div>
                      <div className="space-y-1">
                        {features.map((f: any, idx: number) => (
                          <div key={idx} className="text-[10px] text-[var(--color-text-secondary)]">
                            <span className="font-semibold">{f.name}</span>
                            {f.choices && <span className="text-[var(--color-text-muted)]"> (choose {f.choicesCount || 1})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </BasePopup>
  );
}
