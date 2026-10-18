"use client";

import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { CheckIcon as Check, MagnifyingGlassIcon as MagnifyingGlass, InfoIcon as Info, PackageIcon as PackageBox, SwordIcon as Sword, MusicNotesIcon as MusicNotes, ShieldIcon as ArmorShield, StarIcon as Star } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { ItemBundleList } from "@/components/modals/ItemBundle";
import { InfoCallout, InfoSectionLabel, InfoStatTile, InfoChip, InfoProse, InfoCard, InfoBadge, InfoTraitList, EquipmentInfoPanel } from "@/components/modals/InfoBits";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticWeapons, getStaticArmors, getEquipmentData as getEquipmentDataFromSRD } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

export interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedOption: EquipmentOption | null, weaponSelections: string[]) => void;
  group: ChoiceGroup;
  character: Character;
  currentSelection?: EquipmentOption | null;
  currentWeaponSelections?: string[];
  requireChoice?: boolean;
  onRequirementChange?: (required: boolean) => void;
}

interface SelectableOption {
  id: string;
  type: "package" | "weapon_choice" | "instrument_choice" | "arcane_focus_choice" | "holy_symbol_choice" | "druidic_focus_choice";
  label: string;
  description: string;
  icon: React.ReactNode;
  badges: string[];
  equipmentOption: EquipmentOption;
  selectionCount?: number;
  bonusItems?: Array<{ name: string; quantity: number }>;
  weaponOptions?: Array<{ name: string; description: string; icon: React.ReactNode }>;
  isRecommended?: boolean;
}

const WEAPON_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  martial_melee: Sword,
  martial_ranged: Sword,
  martial: Sword,
  simple_melee: Sword,
  simple_ranged: Sword,
  simple: Sword,
};

const FOCUS_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  arcane_focus: PackageBox,
  holy_symbol: PackageBox,
  druidic_focus: PackageBox,
  musical_instrument: MusicNotes,
};

function getWeaponIcon(name: string, weaponType?: string): React.ReactNode {
  const Icon = WEAPON_TYPE_ICONS[weaponType || ""] || Sword;
  return <Icon className="h-6 w-6 text-ink" />;
}

function getFocusIcon(choiceType: string): React.ReactNode {
  const Icon = FOCUS_TYPE_ICONS[choiceType] || PackageBox;
  return <Icon className="h-6 w-6 text-ink" />;
}

function getItemIcon(itemName: string, itemType?: string): React.ReactNode {
  if (itemType === "weapon") return <Sword className="h-6 w-6 text-ink" />;
  if (itemType === "armor") return <ArmorShield className="h-6 w-6 text-ink" />;
  if (itemType === "instrument") return <MusicNotes className="h-6 w-6 text-ink" />;
  return <PackageBox className="h-6 w-6 text-ink" />;
}

function buildFallbackDescription(t: ReturnType<typeof useLanguage>["t"], itemName: string, info: any): string {
  if (info.type === "weapon") {
    const parts: string[] = [];
    if (info.category) parts.push(`${t("equipment.weaponCategory", "A")} ${info.category} ${t("equipment.weapon", "weapon")}.`);
    if (info.damageDice) parts.push(`${t("equipment.deals", "Deals")} ${info.damageDice} ${info.damageType || t("equipment.damage", "damage")}.`);
    if (info.properties?.length) parts.push(`${t("equipment.properties", "Properties")}: ${info.properties.join(", ")}.`);
    return parts.join(" ") || t("equipment.weaponFallback", { itemName }, "A weapon called {itemName}.");
  }
  if (info.type === "armor") {
    const parts: string[] = [];
    const armorLabel = info.armorType ? info.armorType.charAt(0).toUpperCase() + info.armorType.slice(1) : t("equipment.armorTypeFallback", "A type of");
    parts.push(t("equipment.armorLabel", { armorLabel }, "Armor {armorLabel}."));
    if (info.baseAC) parts.push(t("equipment.baseAC", { baseAC: info.baseAC }, "Base AC {baseAC}."));
    if (info.maxDex !== undefined && info.maxDex !== null) {
      parts.push(info.maxDex === 0 ? t("equipment.noDexBonus", "No Dex bonus.") : t("equipment.maxDexBonus", { maxDex: info.maxDex }, "Max Dex bonus +{maxDex}."));
    }
    return parts.join(" ") || t("equipment.armorFallback", { itemName }, "A type of armor called {itemName}.");
  }
  if (info.type === "instrument") {
    return t("equipment.musicalInstrumentFocus", "Musical instrument used as a spellcasting focus.");
  }
  if (info.contents) {
    return t("equipment.contentsLabel", { contents: info.contents }, "Contains: {contents}.");
  }
  return t("equipment.unknownFallback", { itemName }, "A {itemName}.");
}

export function EquipmentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  group,
  character,
  currentSelection,
  currentWeaponSelections = [],
  requireChoice = true,
  onRequirementChange,
}: EquipmentSelectionModalProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"list" | "info">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState<SelectableOption | null>(null);
  const [weaponSelections, setWeaponSelections] = useState<string[]>(currentWeaponSelections || []);
  const [previewOption, setPreviewOption] = useState<SelectableOption | null>(null);
  const [infoOption, setInfoOption] = useState<SelectableOption | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const weapons = useMemo(() => getStaticWeapons(character.sources, character.ruleset, language), [character.sources, character.ruleset, language]);
  const armors = useMemo(() => getStaticArmors(character.sources, character.ruleset, language), [character.sources, character.ruleset, language]);

  const getItemInfo = useCallback((itemName: string) => {
    const weapon = weapons.find((w: any) => w.name === itemName) as any;
    if (weapon) {
      const rawDescription = weapon.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== weapon.name
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: "weapon",
            damageDice: weapon.damage?.damage_dice || "",
            damageType: weapon.damage?.damage_type?.name || "",
            properties: weapon.properties?.map((p: any) => p.name) || [],
            category: weapon.category_range,
          });
      return {
        type: "weapon",
        damageDice: weapon.damage?.damage_dice || "",
        damageType: weapon.damage?.damage_type?.name || "",
        properties: weapon.properties?.map((p: any) => p.name) || [],
        category: weapon.category_range,
        description,
        icon: "⚔️",
      };
    }

    const armor = armors.find((a: any) => a.name === itemName) as any;
    if (armor) {
      const armorType = armor.armor_category === "Light" ? "light" : armor.armor_category === "Medium" ? "medium" : armor.armor_category === "Heavy" ? "heavy" : armor.armor_category === "Shield" ? "shield" : "unknown";
      const rawDescription = armor.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== armor.name
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: "armor",
            baseAC: armor.armor_class?.base || 0,
            maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
            armorType,
          });
      return {
        type: "armor",
        baseAC: armor.armor_class?.base || 0,
        maxDex: armor.armor_class?.max_bonus ?? (armor.armor_class?.dex_bonus ? null : 0),
        armorType,
        description,
        icon: "🛡️",
      };
    }

    const equipmentData = getEquipmentDataFromSRD(itemName);
    if (equipmentData) {
      const rawDescription = equipmentData.description || "";
      const description = rawDescription.length >= 30 && rawDescription !== itemName
        ? rawDescription
        : buildFallbackDescription(t, itemName, {
            type: equipmentData.type,
            baseAC: equipmentData.baseAC,
            armorType: equipmentData.armorType,
            maxDex: equipmentData.maxDexBonus,
            damageDice: equipmentData.damageDice,
            damageType: equipmentData.damageType,
            category: equipmentData.category,
            contents: equipmentData.contents,
          });
      return {
        type: equipmentData.type,
        description,
        baseAC: equipmentData.baseAC,
        armorType: equipmentData.armorType,
        maxDex: equipmentData.maxDexBonus ?? null,
        damageDice: equipmentData.damageDice,
        damageType: equipmentData.damageType,
        category: equipmentData.category,
        contents: equipmentData.contents,
        icon: "📦",
      };
    }

    return {
      type: "unknown",
      description: buildFallbackDescription(t, itemName, { type: "unknown" }),
      icon: "📦",
    };
  }, [weapons, armors, t]);

  const allOptions = useMemo((): SelectableOption[] => {
    const opts: SelectableOption[] = [];

    group.options.forEach((opt, idx) => {
      if (opt.isWeaponChoice) {
        const categoryWeapons = weapons.filter((w: any) => {
          if (opt.weaponType === "martial") return w.weapon_category === "Martial";
          if (opt.weaponType === "simple") return w.weapon_category === "Simple";
          if (opt.weaponType === "martial_melee") return w.weapon_category === "Martial" && w.category_range === "Melee";
          if (opt.weaponType === "martial_ranged") return w.weapon_category === "Martial" && w.category_range === "Ranged";
          if (opt.weaponType === "simple_melee") return w.weapon_category === "Simple" && w.category_range === "Melee";
          if (opt.weaponType === "simple_ranged") return w.weapon_category === "Simple" && w.category_range === "Ranged";
          return false;
        });

        const weaponOpts = categoryWeapons.map((w: any) => {
          const info = getItemInfo(w.name);
          return {
            name: w.name,
            description: w.description || "",
            icon: getWeaponIcon(w.name, info.category),
          };
        });

        opts.push({
          id: `wc-${idx}`,
          type: "weapon_choice",
          label: opt.description || t("equipment.weaponChoice", "Choose weapons"),
          description: `${opt.selectionCount || 1} ${t("equipment.weaponChoiceDesc", "weapon(s) of your choice")}`,
          icon: getWeaponIcon("", opt.weaponType),
          badges: ["PHB"],
          equipmentOption: opt,
          selectionCount: opt.selectionCount || 1,
          bonusItems: (opt.items || []).map(item => ({ name: item.name, quantity: item.quantity || 1 })),
          weaponOptions: weaponOpts,
        });
      } else if (opt.isInstrumentChoice) {
        const MUSICAL_INSTRUMENTS = ["Bagpipes", "Drum", "Flute", "Horn", "Lute", "Lyre", "Pan flute", "Shawm", "Viol"];
        const instrumentOpts = MUSICAL_INSTRUMENTS.map((name) => ({
          name,
          description: getItemInfo(name)?.description || "",
          icon: <MusicNotes className="h-6 w-6 text-ink" />,
        }));

        opts.push({
          id: `ic-${idx}`,
          type: "instrument_choice",
          label: t("creator.selectMusicalInstrument", "Select a musical instrument"),
          description: t("equipment.instrumentChoiceDesc", "Choose one musical instrument"),
          icon: <MusicNotes className="h-6 w-6 text-ink" />,
          badges: ["PHB"],
          equipmentOption: opt,
          selectionCount: 1,
          weaponOptions: instrumentOpts,
        });
      } else if (opt.isArcaneFocusChoice) {
        const ARCANE_FOCUS_TYPES = ["Crystal", "Orb", "Rod", "Staff", "Wand"];
        const focusOpts = ARCANE_FOCUS_TYPES.map((name) => ({
          name,
          description: getItemInfo(name)?.description || "",
          icon: <PackageBox className="h-6 w-6 text-ink" />,
        }));

        opts.push({
          id: `afc-${idx}`,
          type: "arcane_focus_choice",
          label: t("creator.selectArcaneFocus", "Select an arcane focus"),
          description: t("equipment.arcaneFocusChoiceDesc", "Choose one arcane focus"),
          icon: <PackageBox className="h-6 w-6 text-ink" />,
          badges: ["PHB"],
          equipmentOption: opt,
          selectionCount: 1,
          weaponOptions: focusOpts,
        });
      } else if (opt.isHolySymbolChoice) {
        const HOLY_SYMBOL_TYPES = ["Amulet", "Emblem", "Reliquary"];
        const focusOpts = HOLY_SYMBOL_TYPES.map((name) => ({
          name,
          description: getItemInfo(name)?.description || "",
          icon: <PackageBox className="h-6 w-6 text-ink" />,
        }));

        opts.push({
          id: `hsc-${idx}`,
          type: "holy_symbol_choice",
          label: t("creator.selectHolySymbol", "Select a holy symbol"),
          description: t("equipment.holySymbolChoiceDesc", "Choose one holy symbol"),
          icon: <PackageBox className="h-6 w-6 text-ink" />,
          badges: ["PHB"],
          equipmentOption: opt,
          selectionCount: 1,
          weaponOptions: focusOpts,
        });
      } else if (opt.isDruidicFocusChoice) {
        const DRUIDIC_FOCUS_TYPES = ["Sprig of Mistletoe", "Totem", "Wooden Staff", "Yew Wand"];
        const focusOpts = DRUIDIC_FOCUS_TYPES.map((name) => ({
          name,
          description: getItemInfo(name)?.description || "",
          icon: <PackageBox className="h-6 w-6 text-ink" />,
        }));

        opts.push({
          id: `dfc-${idx}`,
          type: "druidic_focus_choice",
          label: t("creator.selectDruidicFocus", "Select a druidic focus"),
          description: t("equipment.druidicFocusChoiceDesc", "Choose one druidic focus"),
          icon: <PackageBox className="h-6 w-6 text-ink" />,
          badges: ["PHB"],
          equipmentOption: opt,
          selectionCount: 1,
          weaponOptions: focusOpts,
        });
      } else {
        const itemNames = (opt.items || [])
          .map((i: any) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
          .join(" • ");

        const firstItem = opt.items?.[0];
        let icon: React.ReactNode = <PackageBox className="h-6 w-6 text-ink" />;
        if (firstItem) {
          const info = getItemInfo(firstItem.name);
          icon = getItemIcon(firstItem.name, info.type);
        }

        opts.push({
          id: `pkg-${idx}`,
          type: "package",
          label: opt.description || t("equipment.optionLabel", { n: idx + 1 }, "Option {n}"),
          description: itemNames,
          icon,
          badges: ["PHB"],
          equipmentOption: opt,
        });
      }
    });

    return opts;
  }, [group.options, weapons, getItemInfo, t]);

  const filteredOptions = useMemo(() => {
    let options = allOptions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      options = options.filter((opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.description.toLowerCase().includes(q) ||
        opt.weaponOptions?.some((w) => w.name.toLowerCase().includes(q))
      );
    }
    if (sourceFilter !== "ALL") {
      options = options.filter((opt) => opt.badges.includes(sourceFilter));
    }
    return options;
  }, [allOptions, searchQuery, sourceFilter]);

  const availableSources = useMemo(() => {
    const sources = new Set(allOptions.flatMap((opt) => opt.badges));
    return Array.from(sources).sort();
  }, [allOptions]);

  useLayoutEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset modal state when opening - standard modal pattern
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("list");
      setSelectedOption(currentSelection ? allOptions.find(o => o.equipmentOption === currentSelection) || null : null);
      setWeaponSelections(currentWeaponSelections || []);
      setPreviewOption(null);
      setSearchQuery("");
      setSourceFilter("ALL");
      setInfoOption(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentSelection, currentWeaponSelections, allOptions]);

  const handleOptionClick = useCallback((option: SelectableOption) => {
    setPreviewOption(option);
    if (option.type !== "package") {
      setSelectedOption(option);
    }
  }, []);

  const handleWeaponSelect = useCallback((weaponName: string) => {
    setWeaponSelections((prev) => {
      if (prev.includes(weaponName)) {
        return prev.filter((w) => w !== weaponName);
      }
      if (!selectedOption) return prev;
      const maxSelection = selectedOption.selectionCount || 1;
      if (prev.length >= maxSelection) return prev;
      return [...prev, weaponName];
    });
  }, [selectedOption]);

  const handleOpenInfo = useCallback((option: SelectableOption) => {
    setInfoOption(option);
    setStep("info");
  }, []);

  const handleSelectInfoOption = useCallback(() => {
    if (!infoOption) return;
    setInfoOption(null);
    setStep("list");
    handleOptionClick(infoOption);
  }, [infoOption, handleOptionClick]);

  const handleConfirm = useCallback(() => {
    if (step === "info") {
      handleSelectInfoOption();
    } else if (step === "list") {
      if (selectedOption && selectedOption.type !== "package") {
        const selectionCount = selectedOption.selectionCount || 1;
        if (weaponSelections.length < selectionCount) return;
      }
      const payloadOption = selectedOption?.equipmentOption ?? previewOption?.equipmentOption ?? null;
      onConfirm(payloadOption, weaponSelections);
      onClose();
    }
  }, [step, selectedOption, previewOption, weaponSelections, onConfirm, onClose, handleSelectInfoOption]);

  const handleCancel = useCallback(() => {
    if (step === "info") {
      setInfoOption(null);
      setStep("list");
    } else {
      onClose();
    }
  }, [step, onClose]);

  const title = step === "info" && infoOption
    ? infoOption.label
    : t("equipment.selectFromOptions", "Select from the options below");

  const confirmLabel = step === "info"
    ? t("modal.selectThisOption", "Select this option")
    : previewOption
      ? t("common.confirmSelection", "Confirm selection")
      : t("modal.selectOption", "Select an option");

  const showInfo = step === "info" && !!infoOption;

  const isConfirmDisabled =
    step === "info"
      ? !infoOption
      : !previewOption || (selectedOption != null && selectedOption.type !== "package" && weaponSelections.length < (selectedOption.selectionCount || 1));

  const stickyHeader = (
    <div className="sticky top-0 z-20 shrink-0 bg-surface border-b border-border-strong px-4 py-3 space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("modal.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
        />
      </div>
      <div className="relative">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full px-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
        >
          <option value="ALL">{t("common.all", "All")}</option>
          {availableSources.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );

  const stickyFooter = (
    <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        {step === "info" ? t("common.back", "Back") : t("common.cancel", "Cancel")}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirmDisabled}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          isConfirmDisabled
            ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] cursor-not-allowed"
            : "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)] active:bg-[var(--color-accent-indigo-800)]"
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={stickyFooter}
      showHeader={false}
    >
      {!showInfo && stickyHeader}

      {(step === "list" || showInfo) && (
        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
          {showInfo ? (
            <EquipmentInfoPanel
              option={{
                name: infoOption.label,
                description: infoOption.description,
                type: infoOption.type === "weapon_choice" ? "weapon" : infoOption.type === "package" ? "item" : "item",
                icon: infoOption.icon,
                source: infoOption.badges?.[0],
                items: infoOption.equipmentOption?.items?.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity || 1,
                  info: getEquipmentDataFromSRD(i.name) || {},
                })),
                selectionCount: infoOption.selectionCount,
                equipmentOption: infoOption.equipmentOption,
              }}
              t={t}
              language={language}
            />
          ) : (
            <>
            {filteredOptions.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-muted">
                {t("modal.noClassesFound", "Tidak ada opsi yang cocok dengan pencarianmu.")}
              </p>
            )}

            <div className="space-y-3">
              {filteredOptions.map((opt) => (
                <EquipmentCard
                  key={opt.id}
                  option={opt}
                  isSelected={previewOption?.id === opt.id}
                  isWeaponSelected={opt.type !== "package" && selectedOption?.id === opt.id}
                  weaponSelections={weaponSelections}
                  onClick={() => handleOptionClick(opt)}
                  onInfoClick={() => handleOpenInfo(opt)}
                  onWeaponSelect={handleWeaponSelect}
                  t={t}
                  language={language}
                />
              ))}
            </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

interface EquipmentCardProps {
  option: SelectableOption;
  isSelected: boolean;
  isWeaponSelected: boolean;
  weaponSelections: string[];
  onClick: () => void;
  onInfoClick: () => void;
  onWeaponSelect: (name: string) => void;
  t: ReturnType<typeof useLanguage>["t"];
  language: string;
}

function EquipmentCard({
  option,
  isSelected,
  isWeaponSelected,
  weaponSelections,
  onClick,
  onInfoClick,
  onWeaponSelect,
  t,
  language,
}: EquipmentCardProps) {
  const Icon = option.icon;

  const infoPanelOption = {
    name: option.label,
    description: option.description,
    type: option.type === "weapon_choice" ? "weapon" : option.type === "package" ? "item" : "item",
    icon: option.icon,
    source: option.badges?.[0],
    items: option.equipmentOption?.items?.map((i: any) => ({
      name: i.name,
      quantity: i.quantity || 1,
      info: getEquipmentDataFromSRD(i.name) || {},
    })),
    selectionCount: option.selectionCount,
    equipmentOption: option.equipmentOption,
  };

  if (option.type === "package") {
    return (
      <SplitSelectionCard
        title={option.label}
        subtitle={option.description}
        clampSubtitle={false}
        icon={Icon}
        badges={option.badges}
        isSelected={isSelected}
        onSelect={onClick}
        infoType="modal"
        modalContent={<EquipmentInfoPanel option={infoPanelOption} t={t} language={language} />}
      />
    );
  }

  const selectedCount = weaponSelections.length;
  const totalCount = option.selectionCount || 1;

  return (
    <div className="space-y-2">
      <SplitSelectionCard
        title={option.label}
        subtitle={`${selectedCount}/${totalCount} ${t("equipment.selectedCount", "selected")}`}
        clampSubtitle={false}
        icon={Icon}
        badges={option.badges}
        isSelected={isWeaponSelected}
        onSelect={onClick}
        infoType="modal"
        modalContent={<EquipmentInfoPanel option={infoPanelOption} t={t} language={language} />}
      />
    </div>
  );
}
