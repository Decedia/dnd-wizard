"use client";

import { useState, useEffect, useMemo } from "react";
import { getStaticSubclasses, getStaticSubclassDetails } from "@/lib/srd-client";
import { isRecommended } from "@/lib/recommendations";
import { MagnifyingGlassIcon as MagnifyingGlass, CrownIcon as Crown } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
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
  const [previewSubclass, setPreviewSubclass] = useState<string | null>(selected || null);
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
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!previewSubclass}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          previewSubclass
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={true} onClose={handleCancel} title="Choose Subclass" footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subclasses..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredOptions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No subclasses found.</p>
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
    </BottomSheet>
  );
}
