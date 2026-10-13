"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckIcon as Check } from "@/components/icons";
import { ItemBundleList } from "@/components/modals/ItemBundle";
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
      <div className="px-4 pt-4 pb-8 space-y-4">
        {hasConcrete && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {t("equipment.choosePackage", "Pilih paket perlengkapan")}
            </div>
            {concreteOptions.map((opt, idx) => {
              const globalIdx = group.options.indexOf(opt);
              const isSelected = selectedConcreteIndex === globalIdx;
              const bundleItems = (opt.items || []).map((i) => ({
                name: i.name,
                quantity: i.quantity,
              }));
              const summary = bundleItems
                .map((item) => item.name + (item.quantity > 1 ? " x" + item.quantity : ""))
                .join(", ");
              return (
                <SplitSelectionCard
                  key={globalIdx}
                  title={opt.description || `Option ${idx + 1}`}
                  subtitle={summary}
                  isSelected={isSelected}
                  onSelect={() => onConcreteSelect(globalIdx)}
                  infoType="expand"
                  isExpanded={isSelected}
                  expandedContent={
                    <ItemBundleList
                      items={bundleItems}
                      getInfo={getItemInfo}
                      emptyLabel={t("equipment.noItems", "Tidak ada barang.")}
                    />
                  }
                />
              );
            })}
          </div>
        )}

        {hasWeaponChoices && hasConcrete && (
          <div className="border-t-2 border-border-muted pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {t("equipment.orChooseWeapons", "Atau pilih senjata")}
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
                  subtitle={t(
                    "equipment.chooseWeapons",
                    { count: wc.selectionCount },
                    "Pilih {count} senjata",
                  )}
                  isSelected={isWeaponChoiceSelected}
                  onSelect={() => onWeaponChoiceSelect(wcIdx)}
                  infoType="expand"
                  isExpanded={isWeaponChoiceSelected}
                  expandedContent={
                    <div className="space-y-3">
                      <ItemBundleList
                        items={wc.bonusItems || []}
                        getInfo={getItemInfo}
                        showIncluded
                      />
                      <div className="space-y-1.5">
                        {wc.weaponOptions.map((weapon, wIdx) => {
                          const isWeaponSelected = wc.selectedWeaponNames.includes(
                            weapon.name,
                          );
                          const weaponInfo = getItemInfo?.(weapon.name);
                          return (
                            <SplitSelectionCard
                              key={wIdx}
                              title={weapon.name}
                              subtitle={weapon.description}
                              icon={
                                <span className="text-[22px] leading-none">
                                  {weapon.icon || "📦"}
                                </span>
                              }
                              isSelected={isWeaponSelected}
                              onSelect={() => wc.onWeaponSelect(weapon.name)}
                              infoType="modal"
                              modalContent={
                                <p className="text-xs leading-relaxed text-ink-muted">
                                  {weaponInfo?.description || ""}
                                </p>
                              }
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
      </div>    </BottomSheet>,
    document.body
  );
}
