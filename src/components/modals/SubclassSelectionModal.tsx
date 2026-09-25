"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSubclasses, getStaticSubclassDetails } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { MagnifyingGlassIcon as MagnifyingGlass, StarIcon as Star, CrownIcon as Crown, InfoIcon } from "@/components/icons";
import { SourceBadge } from "@/components/SourceBadge";
import { BasePopup } from "@/components/BasePopup";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubclassSelectionModalProps {
  options: { name: string; description: string; hasDetails: boolean }[];
  selected: string;
  characterClass: string;
  onSelect: (name: string) => void;
  onClose: () => void;
  character?: any;
  characterSources?: string[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function SubclassSelectionModal({
  options,
  selected,
  characterClass,
  onSelect,
  onClose,
  character,
  characterSources,
}: SubclassSelectionModalProps) {
  const { tDesc } = useLanguage();
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
    const subclasses = getStaticSubclasses(characterClass, characterSources);
    const map: Record<string, any> = {};
    for (const s of subclasses) {
      map[s.name] = s;
    }
    return map;
  }, [characterClass, characterSources]);

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
        {filteredOptions.map((opt) => {
          const modalContent = (() => {
            const details = getStaticSubclassDetails(characterClass, opt.name);
            const descKey = `subclass.desc.${characterClass.toLowerCase()}-${slugify(opt.name)}`;
            const translatedDesc = tDesc(descKey, opt.description);
            const parts = [translatedDesc];
            if (details?.features && details.features.length > 0) {
              parts.push("\n\nFEATURES\n" + details.features.map((f: any) => `• ${f.name} (Lv ${f.level || "?"}): ${(f.description || [""]).join(" ")}`).join("\n"));
            }
            return parts.join("\n");
          })();

          return (
            <SplitSelectionCard
              key={opt.name}
              title={opt.name}
              subtitle={opt.description}
              icon={<Crown className="h-5 w-5 text-[var(--color-text-muted)] shrink-0" />}
              badges={[]}
              isRecommended={isRecommended("subclass", opt.name, characterClass)}
              isSelected={previewSubclass === opt.name}
              onSelect={() => {
                setPreviewSubclass(opt.name);
                setDetailsView(null);
              }}
              infoType="modal"
              modalContent={
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {modalContent}
                </p>
              }
            />
          );
        })}
      </div>
    </BasePopup>
  );
}
