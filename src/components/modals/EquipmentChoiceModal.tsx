"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, CheckIcon as Check, InfoIcon } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeaponOption {
  name: string;
  description?: string;
  icon?: string;
  statSummary?: string | null;
  data?: any;
}

interface WeaponChoiceSection {
  id: string;
  label: string;
  bonusItems?: Array<{ name: string; quantity: number }>;
  selectionCount: number;
  weaponOptions: WeaponOption[];
  selectedWeaponNames: string[];
  onWeaponSelect: (name: string) => void;
}

interface EquipmentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  group: ChoiceGroup;
  concreteOptions: EquipmentOption[];
  selectedConcreteIndex: number | null;
  onConcreteSelect: (index: number) => void;
  weaponChoiceOptions: WeaponChoiceSection[];
  selectedWeaponChoiceIndex: number | null;
  onWeaponChoiceSelect: (index: number) => void;
  confirmDisabled: boolean;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
  getItemInfo?: (name: string) => { icon: string; description: string } | null;
}

export function EquipmentChoiceModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  group,
  concreteOptions,
  selectedConcreteIndex,
  onConcreteSelect,
  weaponChoiceOptions,
  selectedWeaponChoiceIndex,
  onWeaponChoiceSelect,
  confirmDisabled,
  renderRightContent,
  getItemInfo,
}: EquipmentChoiceModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);

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

  const hasConcrete = concreteOptions.length > 0;
  const hasWeaponChoices = weaponChoiceOptions.length > 0;

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`w-full py-3 rounded-full font-bold text-sm transition-colors ${
          !confirmDisabled
            ? "bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
            : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        {t("equipment.confirmSelection", "Confirm selection")}
      </button>
    </div>
  );

  return createPortal(
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-4">
        {hasConcrete && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {t("equipment.choosePackage", "Choose equipment package")}
            </div>
            {concreteOptions.map((opt, idx) => {
              const globalIdx = group.options.indexOf(opt);
              const isSelected = selectedConcreteIndex === globalIdx;
              const itemNames = (opt.items || [])
                .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
                .join(", ");
              const itemIcons = (opt.items || []).map((i) => {
                const info = getItemInfo?.(i.name);
                return info?.icon || "📦";
              });
              const itemDescriptions = (opt.items || [])
                .map((i) => getItemInfo?.(i.name)?.description)
                .filter(Boolean) as string[];
              const infoDescription = itemDescriptions.join("\n\n") || itemNames;
              const iconNode = itemIcons.length > 0 ? (
                <div className="flex -space-x-1">
                  {itemIcons.slice(0, 4).map((icon, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center border-2 border-[var(--color-surface)]"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <span className="text-[16px] leading-none">{icon}</span>
                    </div>
                  ))}
                </div>
              ) : undefined;
              return (
                <div key={globalIdx}>
                  <SplitSelectionCard
                    title={opt.description || `Option ${idx + 1}`}
                    subtitle={itemNames}
                    icon={iconNode}
                    isSelected={isSelected}
                    onSelect={() => onConcreteSelect(globalIdx)}
                    infoType="modal"
                    modalContent={<p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{infoDescription || ""}</p>}
                  />
                  {infoIndex === globalIdx && (
                    <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoIndex(null)}>
                      <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{opt.description || `Option ${idx + 1}`}</h3>
                          <button type="button" onClick={() => setInfoIndex(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{infoDescription || ""}</p>
                                       <button type="button" onClick={() => setInfoIndex(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("common.gotIt", "Got it")}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasWeaponChoices && hasConcrete && (
          <div className="border-t border-[var(--color-border)] pt-3">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              {t("equipment.orChooseWeapons", "Or choose weapons")}
            </div>
          </div>
        )}

        {hasWeaponChoices &&
          weaponChoiceOptions.map((wc, wcIdx) => {
            const isWeaponChoiceSelected = selectedWeaponChoiceIndex === wcIdx;
            return (
              <div key={wc.id} className="space-y-2">
                <SplitSelectionCard
                  title={wc.label}
                   subtitle={t("equipment.chooseWeapons", { count: wc.selectionCount }, "Choose {count} weapon(s)")}
                  isSelected={isWeaponChoiceSelected}
                  onSelect={() => onWeaponChoiceSelect(wcIdx)}
                  infoType="expand"
                  isExpanded={isWeaponChoiceSelected}
                  expandedContent={
                    <div className="space-y-2">
                      {wc.bonusItems && wc.bonusItems.length > 0 && (
                        <div className="space-y-2">
                          {wc.bonusItems.map((item, i) => {
                            const itemInfo = getItemInfo?.(item.name);
                            const icon = itemInfo?.icon || "📦";
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[var(--color-border)] opacity-60"
                              >
                                <div
                                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: "var(--color-bg)" }}
                                >
                                  <span className="text-[22px] leading-none">{icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[14px] font-medium text-[var(--color-text-muted)] truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[12px] text-[var(--color-text-muted)]">
                                    {t("equipment.included", "Included")}
                                  </div>
                                </div>
                                {itemInfo?.description && (
                                  <div className="shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setInfoIndex(i); }}
                                      className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                                      aria-label={`Info: ${item.name}`}
                                    >
                                      <InfoIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                                {infoIndex === i && (
                                  <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoIndex(null)}>
                                    <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</h3>
                                        <button type="button" onClick={() => setInfoIndex(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{itemInfo?.description || ""}</p>
                                                     <button type="button" onClick={() => setInfoIndex(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("common.gotIt", "Got it")}</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="max-h-[40vh] overflow-y-auto space-y-1.5">
                        {wc.weaponOptions.map((weapon, wIdx) => {
                          const isWeaponSelected = wc.selectedWeaponNames.includes(weapon.name);
                          const weaponInfo = getItemInfo?.(weapon.name);
                          return (
                            <SplitSelectionCard
                              key={wIdx}
                              title={weapon.name}
                              subtitle={weapon.description}
                              icon={<span className="text-[22px] leading-none">{weapon.icon || "📦"}</span>}
                              isSelected={isWeaponSelected}
                              onSelect={() => wc.onWeaponSelect(weapon.name)}
                              infoType="modal"
                              modalContent={<p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{weaponInfo?.description || ""}</p>}
                            />
                          );
                        })}
                      </div>
                    </div>
                  }
                />
              </div>
            );
          })}
      </div>
    </BottomSheet>,
    document.body
  );
}
