"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { PackageIcon as PackageBox } from "@/components/icons";
import { ItemBundleList } from "@/components/modals/ItemBundle";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeaponOption {
  name: string;
  description?: string;
  icon?: ReactNode;
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

  if (!isOpen) return null;

  const hasConcrete = concreteOptions.length > 0;
  const hasWeaponChoices = weaponChoiceOptions.length > 0;

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
        disabled={confirmDisabled}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          confirmDisabled
            ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
            : "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
        }`}
      >
        {t("equipment.confirmSelection", "Confirm selection")}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={stickyFooter} showHeader={false}>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-8">
        {hasConcrete && (
          <div className="space-y-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {t("equipment.choosePackage", "Pilih paket perlengkapan")}
            </span>
            {concreteOptions.map((opt) => {
              const globalIdx = group.options.indexOf(opt);
              const isSelected = selectedConcreteIndex === globalIdx;
              const bundleItems = (opt.items || []).map((i) => ({
                name: i.name,
                quantity: i.quantity || 1,
              }));
              return (
                <SplitSelectionCard
                  key={opt.description || globalIdx}
                  title={opt.description || t("equipment.optionLabel", { n: globalIdx + 1 }, "Opsi {n}")}
                  icon={<PackageBox className="h-6 w-6 text-ink-muted" />}
                  isSelected={isSelected}
                  onSelect={() => onConcreteSelect(globalIdx)}
                  infoType="modal"
                  modalContent={
                    <div className="space-y-3">
                      {bundleItems.length > 0 ? (
                        <ItemBundleList
                          items={bundleItems}
                          getInfo={getItemInfo}
                          emptyLabel={t("equipment.noItems", "Tidak ada barang.")}
                        />
                      ) : (
                        <p className="text-xs text-ink-muted">{t("equipment.noItems", "Tidak ada barang.")}</p>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}

        {hasWeaponChoices && hasConcrete && (
          <div className="border-t-2 border-border-muted pt-3 mt-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {t("equipment.orChooseWeapons", "Atau pilih senjata")}
            </span>
          </div>
        )}

        {hasWeaponChoices &&
          weaponChoiceOptions.map((wc, wcIdx) => {
            const isWeaponChoiceSelected = selectedWeaponChoiceIndex === wcIdx;
            return (
              <div key={wc.id} className="space-y-3">
                <SplitSelectionCard
                  title={wc.label}
                  subtitle={t("equipment.chooseWeapons", { count: wc.selectionCount }, "Pilih {count} senjata")}
                  icon={<PackageBox className="h-6 w-6 text-ink-muted" />}
                  isSelected={isWeaponChoiceSelected}
                  onSelect={() => onWeaponChoiceSelect(wcIdx)}
                  infoType="modal"
                  modalContent={
                    <div className="space-y-4">
                      {wc.bonusItems && wc.bonusItems.length > 0 && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            {t("equipment.contains", "Berisi:")}
                          </span>
                          <div className="mt-1.5">
                            <ItemBundleList
                              items={wc.bonusItems}
                              getInfo={getItemInfo}
                              showIncluded
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        {wc.weaponOptions.map((weapon, wIdx) => {
                          const isWeaponSelected = wc.selectedWeaponNames.includes(weapon.name);
                          return (
                            <SplitSelectionCard
                              key={wIdx}
                              title={weapon.name}
                              subtitle={weapon.description || undefined}
                              icon={weapon.icon || <PackageBox className="h-6 w-6 text-ink-muted" />}
                              isSelected={isWeaponSelected}
                              onSelect={() => wc.onWeaponSelect(weapon.name)}
                              infoType="modal"
                              modalContent={
                                <div className="space-y-3">
                                  {weapon.description && (
                                    <p className="text-xs leading-relaxed text-ink-muted">{weapon.description}</p>
                                  )}
                                  {weapon.statSummary && (
                                    <p className="text-xs font-medium text-ink">{weapon.statSummary}</p>
                                  )}
                                </div>
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
      </div>
    </BottomSheet>
  );
}
