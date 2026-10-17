"use client";

import { useState, useEffect } from "react";
import { CheckIcon as Check, InfoIcon as Info, MagnifyingGlassIcon as MagnifyingGlass } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { BasePopup } from "@/components/BasePopup";
import {
  InfoSectionLabel,
  InfoStatTile,
} from "@/components/modals/InfoBits";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";
import { useLanguage } from "@/contexts/LanguageContext";

interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  group: ChoiceGroup;
  selectedOptionIndex: number | null;
  onSelect: (index: number) => void;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
  getItemInfo?: (name: string) => { icon: string; description: string } | null;
  getStatSummary?: (item: any) => string | null;
}

export function EquipmentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  group,
  selectedOptionIndex,
  onSelect,
  renderRightContent,
  getItemInfo,
  getStatSummary,
}: EquipmentSelectionModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoOption, setInfoOption] = useState<EquipmentOption | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const options = group.options || [];
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (opt.description || "").toLowerCase().includes(q) || (opt.items || []).some((i: any) => i.name.toLowerCase().includes(q));
  });

  const stickyFooter = (
    <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        {t("common.back", "Back")}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={selectedOptionIndex === null}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          selectedOptionIndex !== null
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
            : "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        {t("equipment.confirmSelection", "Confirm selection")}
      </button>
    </div>
  );

  const infoModalContent = (option: EquipmentOption) => {
    const statSummary = getStatSummary?.(option);
    return (
      <div className="space-y-3">
        {(option.items || []).length > 0 && (
          <div>
            <InfoSectionLabel>{t("equipment.contains", "Berisi:")}</InfoSectionLabel>
            <div className="mt-1.5 space-y-1.5">
              {(option.items || []).map((i: any, idx: number) => {
                const info = getItemInfo?.(i.name);
                return (
                  <div
                    key={`${i.name}-${idx}`}
                    className="flex items-center justify-between rounded-xl border-2 border-border-strong bg-surface p-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-muted">
                      <span className="text-[16px] leading-none">{info?.icon || "📦"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-ink">{i.name}</span>
                      {info?.description && (
                        <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">
                          {info.description}
                        </p>
                      )}
                    </div>
                    {i.quantity > 1 && (
                      <span className="shrink-0 text-[10px] font-bold text-ink-muted">
                        ×{i.quantity}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {statSummary && (
          <InfoStatTile label={t("equipment.statSummary", "Stat")} value={statSummary} />
        )}
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={stickyFooter} showHeader={false}>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-8">
        <div className="mb-4">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("equipment.choosePackage", "Pilih paket perlengkapan")}
          </span>
          {group.description && (
            <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{group.description}</p>
          )}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("modal.searchPlaceholder", "Cari...")}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>

        {filteredOptions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
            {t("modal.noClassesFound", "Tidak ada opsi yang cocok dengan pencarianmu.")}
          </p>
        )}

        {filteredOptions.map((option, index) => {
          const isSelected = selectedOptionIndex === index;
          const itemNames = (option.items || [])
            .map((i: any) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
            .join(", ");
          const statSummary = getStatSummary?.(option);
          const isInfoOpen = infoOption?.description === option.description;

          return (
            <div key={option.description || index} className="space-y-2">
              <div
                className={`flex flex-row overflow-hidden rounded-xl border-2 transition-all p-3 ${
                  isSelected
                    ? "border-ink bg-ink/5 shadow-sm"
                    : "border-border-strong bg-surface hover:border-ink/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex flex-1 items-center justify-between p-0 text-left active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-ink">{option.description}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-paper-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        PHB
                      </span>
                      {statSummary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                          {statSummary}
                        </span>
                      )}
                    </div>
                    {itemNames && (
                      <p className="mt-1 text-[10px] leading-relaxed text-ink-muted whitespace-pre-line">
                        {itemNames}
                      </p>
                    )}
                  </div>
                  <div
                    className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? "border-ink bg-ink text-surface"
                        : "border-ink-subtle bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoOption(option);
                  }}
                  className="flex w-12 shrink-0 items-center justify-center border-l-2 border-border-muted text-ink-muted transition hover:bg-ink/5 hover:text-ink active:scale-90"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>

              {isInfoOpen && (
                <BasePopup
                  isOpen={isInfoOpen}
                  onClose={() => setInfoOption(null)}
                  title={option.description}
                  children={infoModalContent(option)}
                  confirmLabel={t("common.gotIt", "Got it")}
                  showFooter={true}
                />
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function getStatSummary(item: any): string | null {
  if (!item) return null;
  if (item.damageDice) return `${item.damageDice} ${item.damageType || ""}`.trim();
  if (item.baseAC) return `AC ${item.baseAC}`;
  if (item.toolUse) return item.toolUse;
  if (item.effect) return item.effect;
  return null;
}
