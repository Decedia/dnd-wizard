"use client";

import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass, PackageIcon as PackageBox, SwordIcon as Sword } from "@/components/icons";
import { ItemBundleList } from "@/components/modals/ItemBundle";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeaponOption {
  name: string;
  description?: string;
  icon?: React.ReactNode;
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
  isWeaponChoice?: boolean;
  isInstrumentChoice?: boolean;
  isArcaneFocusChoice?: boolean;
  isHolySymbolChoice?: boolean;
  isDruidicFocusChoice?: boolean;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    packages: true,
    weapons: true,
  });

  // Build flat list of all options with type tags (hooks must run unconditionally)
  interface SelectableOption {
    type: "concrete" | "weapon";
    globalIndex: number;
    sectionIndex?: number;
    option: EquipmentOption | any;
    section: "packages" | "weapons";
    sectionLabel: string;
    selectionCount?: number;
    bonusItems?: Array<{ name: string; quantity: number }>;
    isWeaponChoice?: boolean;
  }

  const allOptions = useMemo<SelectableOption[]>(() => {
    const opts: SelectableOption[] = [];

    // Concrete options (packages)
    if (concreteOptions.length > 0) {
      concreteOptions.forEach((opt, idx) => {
        const globalIdx = group.options.indexOf(opt);
        opts.push({
          type: "concrete",
          globalIndex: globalIdx,
          option: opt,
          section: "packages",
          sectionLabel: t("equipment.choosePackage", "Pilih paket perlengkapan"),
        });
      });
    }

    // Weapon choices
    if (weaponChoiceOptions.length > 0) {
      weaponChoiceOptions.forEach((wc, wcIdx) => {
        opts.push({
          type: "weapon",
          globalIndex: wcIdx,
          sectionIndex: wcIdx,
          option: {
            label: wc.label,
            selectionCount: wc.selectionCount,
            bonusItems: wc.bonusItems,
            weaponOptions: wc.weaponOptions,
            selectedWeaponNames: wc.selectedWeaponNames,
            onWeaponSelect: wc.onWeaponSelect,
            isWeaponChoice: wc.isWeaponChoice,
          } as any,
          section: "weapons",
          sectionLabel: t("equipment.orChooseWeapons", "Atau pilih senjata"),
          selectionCount: wc.selectionCount,
          bonusItems: wc.bonusItems,
          isWeaponChoice: true,
        });
      });
    }

    return opts;
  }, [concreteOptions, weaponChoiceOptions, group.options, t]);

  // Filter by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const q = searchQuery.toLowerCase();
    return allOptions.filter((opt) => {
      if (opt.type === "concrete") {
        const optDesc = (opt.option as EquipmentOption).description || "";
        const itemNames = ((opt.option as EquipmentOption).items || []).map((i) => i.name).join(" ");
        return optDesc.toLowerCase().includes(q) || itemNames.toLowerCase().includes(q);
      } else {
        const wc = opt.option as any;
        const labelMatch = wc.label.toLowerCase().includes(q);
        const weaponMatch = (wc.weaponOptions || []).some((w: WeaponOption) => w.name.toLowerCase().includes(q));
        return labelMatch || weaponMatch;
      }
    });
  }, [allOptions, searchQuery]);

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

  const toggleSection = (section: "packages" | "weapons") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getItemSummary = (opt: any): string => {
    if (opt.type === "concrete") {
      const eqOpt = opt.option as any;
      const itemNames = (eqOpt.items || [])
        .map((i: any) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
        .join(" • ");
      return itemNames;
    }
    return "";
  };

  const getWeaponSelectionSummary = (wc: any): string => {
    const selected = wc.selectedWeaponNames || [];
    const count = wc.selectionCount || 1;
    return `${selected.length}/${count} ${t("equipment.selectedCount", "terpilih")}`;
  };

  const renderOptionCard = (opt: any) => {
    const isConcrete = opt.type === "concrete";
    const globalIdx = opt.globalIndex;
    const isSelected = opt.type === "concrete" ? selectedConcreteIndex === opt.globalIndex : selectedWeaponChoiceIndex === opt.sectionIndex;

    if (isConcrete) {
      const eqOpt = opt.option as any;
      const bundleItems = (eqOpt.items || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity || 1,
      }));
      const itemSummary = (eqOpt.items || [])
        .map((i: any) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
        .join(" • ");

      return (
        <SplitSelectionCard
          key={`pkg-${globalIdx}`}
          title={eqOpt.description || t("equipment.optionLabel", { n: globalIdx + 1 }, "Opsi {n}")}
          subtitle={itemSummary || undefined}
          icon={<PackageBox className="h-6 w-6 text-ink-muted" />}
          badges={["PHB"]}
          isSelected={isSelected}
          onSelect={() => onConcreteSelect(group.options.indexOf(eqOpt))}
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
          clampSubtitle={false}
        />
      );
    } else {
      // Weapon choice section
      const wc = opt.option as any;
      const isSelected = selectedWeaponChoiceIndex === opt.sectionIndex;
      const selectedWeapons = wc.selectedWeaponNames || [];
      const selectionCount = wc.selectionCount || 1;
      const weaponOpts = wc.weaponOptions || [];

      return (
        <div key={`wc-${opt.sectionIndex}`} className="space-y-3">
          <SplitSelectionCard
            title={wc.label}
            subtitle={`${wc.selectedWeaponNames?.length || 0}/${wc.selectionCount || 1} ${t("equipment.selectedCount", "terpilih")}`}
            icon={<Sword className="h-6 w-6 text-ink-muted" />}
            badges={["PHB"]}
            isSelected={isSelected}
            onSelect={() => onWeaponChoiceSelect(opt.sectionIndex!)}
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
                  {wc.weaponOptions.map((weapon: any, wIdx: number) => {
                    const isWeaponSelected = wc.selectedWeaponNames?.includes(weapon.name);
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
                        clampSubtitle={false}
                      />
                    );
                  })}
                </div>
              </div>
            }
            clampSubtitle={false}
          />
        </div>
      );
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={stickyFooter} showHeader={false}>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-8">
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("modal.searchPlaceholder", "Cari opsi...")}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>

        {/* Empty state */}
        {filteredOptions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
            {t("modal.noClassesFound", "Tidak ada opsi yang cocok dengan pencarianmu.")}
          </p>
        )}

        {/* Paket Perlengkapan Section */}
        {filteredOptions.some((o) => o.section === "packages") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {t("equipment.choosePackage", "Pilih paket perlengkapan")}
              </span>
              <button
                type="button"
                onClick={() => toggleSection("packages")}
                className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink"
                aria-label={expandedSections.packages ? "Collapse" : "Expand"}
              >
                {expandedSections.packages ? "−" : "+"}
              </button>
            </div>
            {expandedSections.packages && (
              <div className="space-y-2 mt-2">
                {filteredOptions
                  .filter((o) => o.section === "packages")
                  .map((opt) => renderOptionCard(opt))}
              </div>
            )}
          </div>
        )}

        {/* Divider between sections */}
        {filteredOptions.some((o) => o.section === "packages") && filteredOptions.some((o) => o.section === "weapons") && (
          <div className="border-t-2 border-border-muted my-2" />
        )}

        {/* Senjata Section */}
        {filteredOptions.some((o) => o.section === "weapons") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {t("equipment.orChooseWeapons", "Atau pilih senjata")}
              </span>
              <button
                type="button"
                onClick={() => toggleSection("weapons")}
                className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink"
                aria-label={expandedSections.weapons ? "Collapse" : "Expand"}
              >
                {expandedSections.weapons ? "−" : "+"}
              </button>
            </div>
            {expandedSections.weapons && (
              <div className="space-y-2 mt-2">
                {filteredOptions
                  .filter((o) => o.section === "weapons")
                  .map((opt) => renderOptionCard(opt))}
              </div>
            )}
          </div>
        )}

        {/* Empty state for no matches in section */}
        {expandedSections.packages && filteredOptions.filter((o) => o.section === "packages").length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            {t("modal.noClassesFound", "Tidak ada opsi yang cocok dengan pencarianmu.")}
          </p>
        )}
        {expandedSections.weapons && filteredOptions.filter((o) => o.section === "weapons").length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            {t("modal.noClassesFound", "Tidak ada opsi yang cocok dengan pencarianmu.")}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}