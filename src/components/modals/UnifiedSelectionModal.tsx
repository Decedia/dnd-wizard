"use client";

import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { getStaticClasses } from "@/lib/srd-client";
import { getStaticRaces, getStaticRaceDetails, type SRDRace } from "@/lib/srd-client";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RACE_ICONS } from "@/components/race-icons";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { HumanVariantConfig, type HumanVariantConfigPayload } from "@/components/modals/HumanVariantConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  InfoIcon as Info,
  MagnifyingGlassIcon as MagnifyingGlass,
  StarIcon as Star,
  UsersIcon as Users,
  BarbarianIcon,
  MusicNotesIcon,
  ClericIcon,
  DruidIcon,
  FighterIcon,
  MonkIcon,
  PaladinIcon,
  RangerIcon,
  RogueIcon,
  SparkleIcon,
  WarlockIcon,
  WizardStaffIcon,
  GearGiIcon as ArtificerIcon,
} from "@/components/icons";

export type SelectionType = "class" | "race";
export type SelectionStep = "list" | "config" | "info";

export interface SelectionOption {
  name: string;
  source: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  hasChoice?: boolean;
  choiceType?: string;
  basicStats?: string;
  subclassCount?: number;
  subclassLevel?: number;
  isRecommended?: boolean;
  recommendationText?: string;
}

export interface ConfigChoice {
  id: string;
  name: string;
  description: string;
  effect?: string;
  featureData?: any;
  parentChoiceId?: string;
}

export interface SelectionModalProps<T extends SelectionType> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: SelectionPayload<T>) => void;
  selectionType: T;
  characterSources?: string[];
  currentCharacter?: any;
}

export interface SelectionPayload<T extends SelectionType> {
  type: T;
  name: string;
  source: string;
  configChoice?: ConfigChoice;
  features: {
    core?: any;
    children: any[];
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Barbarian: BarbarianIcon,
  Bard: MusicNotesIcon,
  Cleric: ClericIcon,
  Druid: DruidIcon,
  Fighter: FighterIcon,
  Monk: MonkIcon,
  Paladin: PaladinIcon,
  Ranger: RangerIcon,
  Rogue: RogueIcon,
  Sorcerer: SparkleIcon,
  Warlock: WarlockIcon,
  Wizard: WizardStaffIcon,
  Artificer: ArtificerIcon,
};

function FallbackIcon({ className }: { className?: string }) {
  return <span className={className}>❓</span>;
}

interface RaceGroup {
  groupName: string;
  options: SelectionOption[];
  hasRecommended: boolean;
}

function findParentRaceName(name: string, candidates: string[]): string | null {
  let best: string | null = null;
  for (const candidate of candidates) {
    if (candidate === name) continue;
    const isVariantOf =
      name.startsWith(`${candidate} `) ||
      name.startsWith(`${candidate} (`) ||
      name.endsWith(` ${candidate}`) ||
      name.includes(` ${candidate} (`);
    if (isVariantOf && (best === null || candidate.length > best.length)) {
      best = candidate;
    }
  }
  return best;
}

function groupRacesByParent(
  races: SelectionOption[],
  parentCandidates: string[],
): RaceGroup[] {
  const groups = new Map<string, SelectionOption[]>();
  for (const race of races) {
    const groupName = findParentRaceName(race.name, parentCandidates) ?? race.name;
    const existing = groups.get(groupName);
    if (existing) {
      existing.push(race);
    } else {
      groups.set(groupName, [race]);
    }
  }

  return Array.from(groups.entries())
    .map(([groupName, options]) => {
      const sorted = [...options].sort((a, b) => {
        if (a.name === groupName) return -1;
        if (b.name === groupName) return 1;
        return (
          (b.isRecommended === true ? 1 : 0) - (a.isRecommended === true ? 1 : 0) ||
          a.name.localeCompare(b.name)
        );
      });
      return {
        groupName,
        options: sorted,
        hasRecommended: options.some((opt) => opt.isRecommended),
      };
    })
    .sort(
      (a, b) =>
        (b.hasRecommended === true ? 1 : 0) - (a.hasRecommended === true ? 1 : 0) ||
        a.groupName.localeCompare(b.groupName),
    );
}

export function UnifiedSelectionModal<T extends SelectionType>({
  isOpen,
  onClose,
  onConfirm,
  selectionType,
  characterSources = [],
  currentCharacter,
}: SelectionModalProps<T>) {
  const { t, tDesc, language } = useLanguage();
  const [step, setStep] = useState<SelectionStep>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<SelectionOption | null>(null);
  const [configChoice, setConfigChoice] = useState<ConfigChoice | null>(null);
  const [previewItem, setPreviewItem] = useState<SelectionOption | null>(null);
  const [requireChoice, setRequireChoice] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [infoItem, setInfoItem] = useState<{ option: SelectionOption; groupName: string } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset modal state when opening - standard modal pattern
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("list");
      setSelectedItem(null);
      setConfigChoice(null);
      setPreviewItem(null);
      setSearchQuery("");
      setSourceFilter("ALL");
      setRequireChoice(true);
      setOpenGroups([]);
      setInfoItem(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const allOptions = useMemo(() => {
    if (selectionType === "class") {
      const classes = getStaticClasses(characterSources, undefined, language);
      return classes.map((cls) => ({
        name: cls.name,
        source: cls.source || "PHB",
        description: cls.flavor || "",
        icon: CLASS_ICONS[cls.name] || FallbackIcon,
        hasChoice: false,
        choiceType: "subclass",
        subclassCount: cls.subclasses?.length || 0,
        subclassLevel: cls.subclassLevel || 3,
        isRecommended: (cls as any).recommendation?.is_recommended || false,
        recommendationText: (cls as any).recommendation?.text || "",
      })) as SelectionOption[];
    } else {
      const races = getStaticRaces(characterSources, undefined, language);
      return races.map((race) => ({
        name: race.name,
        source: race.source || "PHB",
        description: race.flavor || race.traits?.[0]?.description || "",
        icon: RACE_ICONS[race.name] || RACE_ICONS.Human,
        hasChoice: (race.choices?.length || 0) > 0,
        choiceType: race.choices?.[0]?.type || "ancestry",
        basicStats: `${race.size} • Speed ${race.speed} ft`,
        isRecommended: (race as any).recommendation?.is_recommended || false,
        recommendationText: (race as any).recommendation?.text || "",
      })) as SelectionOption[];
    }
  }, [selectionType, characterSources, language]);

  const filteredOptions = useMemo(() => {
    let options = allOptions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      options = options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(q) ||
          opt.description.toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== "ALL") {
      options = options.filter((opt) => opt.source === sourceFilter);
    }
    return options;
  }, [allOptions, searchQuery, sourceFilter]);

  const availableSources = useMemo(() => {
    const sources = new Set(allOptions.map((opt) => opt.source));
    return Array.from(sources).sort();
  }, [allOptions]);

  const raceGroups = useMemo(
    () =>
      selectionType === "race"
        ? groupRacesByParent(filteredOptions, Array.from(new Set(allOptions.map((o) => o.name))))
        : [],
    [selectionType, filteredOptions, allOptions],
  );

  const handleItemClick = useCallback(
    (option: SelectionOption) => {
      setPreviewItem(option);
      if (option.hasChoice) {
        setSelectedItem(option);
        setStep("config");
        setConfigChoice(null);
      }
    },
    []
  );

  const handleConfigChoice = useCallback((choice: ConfigChoice) => {
    setConfigChoice(choice);
  }, []);

  const handleRequirementChange = useCallback((required: boolean) => {
    setRequireChoice(required);
  }, []);

  const handleRaceOptionClick = useCallback(
    (option: SelectionOption, groupName: string) => {
      setOpenGroups((prev) => (prev.includes(groupName) ? prev : [...prev, groupName]));
      handleItemClick(option);
    },
    [handleItemClick]
  );

  const handleOpenRaceInfo = useCallback((option: SelectionOption, groupName: string) => {
    setInfoItem({ option, groupName });
    setStep("info");
  }, []);

  const handleSelectInfoRace = useCallback(() => {
    if (!infoItem) return;
    const { option, groupName } = infoItem;
    setInfoItem(null);
    handleRaceOptionClick(option, groupName);
  }, [infoItem, handleRaceOptionClick]);

  const handleGroupToggle = useCallback((groupName: string, isOpen: boolean) => {
    setOpenGroups((prev) =>
      isOpen
        ? prev.includes(groupName)
          ? prev
          : [...prev, groupName]
        : prev.filter((name) => name !== groupName)
    );
  }, []);

  const handleConfirm = useCallback(() => {
    if (step === "config") {
      if (!selectedItem) return;
      const payload: SelectionPayload<T> = {
        type: selectionType,
        name: selectedItem.name,
        source: selectedItem.source,
        ...(configChoice && requireChoice ? { configChoice } : {}),
        features: {
          core: selectedItem,
          children: configChoice && requireChoice ? [configChoice.featureData] : [],
        },
      };
      if (selectedItem.name === "Human" && configChoice?.featureData?.choiceType === "variant") {
        (payload as any).variantConfig = configChoice.featureData.variantConfig;
      }
      onConfirm(payload);
      onClose();
    } else if (step === "info") {
      handleSelectInfoRace();
    } else if (step === "list" && previewItem && !previewItem.hasChoice) {
      const payload: SelectionPayload<T> = {
        type: selectionType,
        name: previewItem.name,
        source: previewItem.source,
        features: {
          core: previewItem,
          children: [],
        },
      };
      onConfirm(payload);
      onClose();
    }
  }, [step, selectedItem, configChoice, requireChoice, previewItem, selectionType, onConfirm, onClose, handleSelectInfoRace]);

  const handleBack = useCallback(() => {
    setStep("list");
    setSelectedItem(null);
    setConfigChoice(null);
    setInfoItem(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (step === "config" || step === "info") {
      handleBack();
    } else {
      onClose();
    }
  }, [step, handleBack, onClose]);

  if (!isOpen) return null;

  const title =
    step === "info" && infoItem
      ? t("modal.raceInfo", "Info Ras")
      : selectionType === "class"
        ? t("modal.selectClass", "Choose Your Class")
        : t("modal.selectRace", "Choose Your Race");
  const confirmLabel =
    step === "config"
      ? `${t("common.confirm")} ${configChoice ? configChoice.name : t("common.selection", "Selection")}`
      : step === "info"
        ? t("modal.selectThisRace", "Pilih Ras Ini")
        : previewItem
          ? t("common.confirmSelection", "Confirm Selection")
          : t("modal.selectOption", "Select an Option");

  const isHumanVariantStep = step === "config" && selectedItem?.name === "Human" && selectedItem.choiceType === "variant";
  const variantHumanSelected = isHumanVariantStep && configChoice?.featureData?.choiceType === "variant";
  const isConfirmDisabled =
    step === "config"
      ? requireChoice && !configChoice && !(isHumanVariantStep && !variantHumanSelected)
      : step === "info"
        ? !infoItem
        : !previewItem || (previewItem.hasChoice && !configChoice && requireChoice);

  const isHumanVariantConfig = step === "config" && selectedItem?.name === "Human" && selectedItem.choiceType === "variant";
  const variantEnabled = isHumanVariantConfig && configChoice?.featureData?.choiceType === "variant";
  const canConfirmHuman = isHumanVariantConfig && !variantEnabled;

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
          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] rotate-90" />
        </div>
      </div>
    </div>
  );

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        {step === "config" || step === "info" ? t("common.back", "Back") : t("common.cancel", "Cancel")}
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={stickyFooter}
      showHeader={false}
    >
      {step !== "info" && stickyHeader}

      {(step === "list" || step === "info") && (
        <div className="flex-1 max-h-[75vh] space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
          {step === "info" && infoItem ? (
            <RaceInfoPanel
              option={infoItem.option}
              characterSources={characterSources}
              language={language}
              t={t}
            />
          ) : (
            <>
            {filteredOptions.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-muted">
                {selectionType === "race"
                  ? t("modal.noRacesFound", "Tidak ada ras yang cocok dengan pencarianmu.")
                  : t("modal.noClassesFound", "Tidak ada kelas yang cocok dengan pencarianmu.")}
              </p>
            )}

          {selectionType === "race" ? (
            <div className="space-y-3">
              {raceGroups.map((group) => {
                const isGroupSelected = group.options.some(
                  (opt) => previewItem?.name === opt.name
                );
                return (
                  <details
                    key={group.groupName}
                    open={openGroups.includes(group.groupName)}
                    onToggle={(e) => handleGroupToggle(group.groupName, e.currentTarget.open)}
                    className={`group overflow-hidden rounded-2xl border-2 shadow-sm [&::-webkit-details-marker]:hidden ${
                      isGroupSelected ? "border-ink" : "border-border-strong"
                    }`}
                  >
                    <summary
                      className={`flex cursor-pointer select-none items-center justify-between p-4 outline-none transition-colors ${
                        isGroupSelected ? "bg-ink/5" : "active:bg-ink/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isGroupSelected ? "bg-ink text-surface" : "bg-ink/10 text-ink"
                          }`}
                        >
                          <Users className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-ink">{group.groupName}</h3>
                      </div>

                      <div className="flex items-center gap-3">
                        {isGroupSelected && (
                          <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface shadow-sm">
                            {t("modal.selected", "Terpilih")}
                          </span>
                        )}
                        <div className="text-ink-muted transition-transform duration-300 group-open:rotate-90">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </summary>

                    <div className="space-y-2 border-t-2 border-border-muted bg-paper/50 p-3">
                      {group.options.map((opt) => {
                        const isSelected = previewItem?.name === opt.name;
                        return (
                          <label
                            key={opt.name}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition-all active:scale-[0.98] ${
                              isSelected
                                ? "border-ink bg-ink/10"
                                : "border-transparent bg-surface hover:border-ink/30"
                            }`}
                          >
                            <div className="min-w-0">
                              <h4 className="font-bold text-ink">{opt.name}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {opt.source && (
                                  <span className="rounded bg-paper-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                                    {opt.source}
                                  </span>
                                )}
                                {opt.basicStats && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                                    {opt.basicStats}
                                  </span>
                                )}
                              </div>
                              {opt.description && (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                                  {opt.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenRaceInfo(opt, group.groupName);
                                }}
                                aria-label={t("modal.raceInfoButton", { race: opt.name }, "Info {race}")}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-all hover:bg-ink/10 hover:text-ink active:scale-90"
                              >
                                <Info className="h-5 w-5" />
                              </button>

                              <div
                                className={`ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected
                                    ? "border-ink bg-ink text-surface"
                                    : "border-ink-subtle bg-transparent"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                            </div>

                            <input
                              type="radio"
                              name="race-selection"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleRaceOptionClick(opt, group.groupName)}
                              aria-label={t("modal.selectRaceOption", { race: opt.name }, "Pilih {race}")}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOptions
                .slice()
                .sort((a, b) => (b.isRecommended === true ? 1 : 0) - (a.isRecommended === true ? 1 : 0) || a.name.localeCompare(b.name))
                .map((opt) => (
                  <SelectionCard
                    key={opt.name}
                    option={opt}
                    isSelected={previewItem?.name === opt.name}
                    onClick={() => handleItemClick(opt)}
                    selectionType={selectionType}
                    t={t}
                  />
                ))}
            </div>
            )}
            </>
          )}
        </div>
      )}

      {step === "config" && selectedItem && (
    <>
              {selectedItem.name === "Human" ? (
                <HumanVariantConfig
                  initialEnabled={!!configChoice}
                  initialAbilities={configChoice?.featureData?.abilities || []}
                  initialSkill={configChoice?.featureData?.skill}
                  initialFeat={configChoice?.featureData?.feat}
                  initialFeatOptions={configChoice?.featureData?.featOptions}
                  disabledFeats={[
                    ...(currentCharacter?.features || []).filter((f: any) => f.name && f.source !== "custom").map((f: any) => f.name),
                    ...Object.values(currentCharacter?.featureSelections || {}).flat(),
                  ]}
                  character={currentCharacter}
                  sources={currentCharacter?.sources}
                  onChange={(variantConfig) => {
                    if (!variantConfig.enabled) {
                      setConfigChoice(null);
                      return;
                    }
                    setConfigChoice({
                      id: "variant-human",
                      name: "Variant Human",
                      description: t("modal.variantHumanDescription", "You gain +1 to two different ability scores of your choice, proficiency in one skill of your choice, and one feat of your choice."),
                      featureData: { ...variantConfig, choiceType: "variant" },
                      parentChoiceId: "human-variant",
                    } as any);
                  }}
                />
              ) : (
            <ConfigDrawer
              parentOption={selectedItem}
              onChoice={handleConfigChoice}
              selectedChoice={configChoice}
              characterSources={characterSources}
              language={language}
              requireChoice={requireChoice}
              onRequirementChange={handleRequirementChange}
              t={t}
            />
          )}
        </>
      )}
    </BottomSheet>
  );
}

interface SelectionCardProps {
  option: SelectionOption;
  isSelected: boolean;
  onClick: () => void;
  selectionType: SelectionType;
  t: ReturnType<typeof useLanguage>["t"];
}

function SelectionCard({
  option,
  isSelected,
  onClick,
  selectionType,
  t,
}: SelectionCardProps) {
  const Icon = option.icon || FallbackIcon;

  const badges: string[] = [];
  if (option.source) badges.push(option.source);
  if (selectionType === "class" && option.subclassCount !== undefined) {
    badges.push(`${option.subclassCount} ${t("modal.subclasses", "Subclasses")}`);
  }

  return (
    <SplitSelectionCard
      title={option.name}
      subtitle={option.description}
      icon={<Icon className="h-6 w-6 text-[var(--color-text-primary)]" />}
      badges={badges}
      isRecommended={option.isRecommended}
      isSelected={isSelected}
      onSelect={onClick}
      infoType="modal"
      modalContent={
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
          {option.description}
        </p>
      }
    />
  );
}

interface ConfigDrawerProps {
  parentOption: SelectionOption;
  onChoice: (choice: ConfigChoice) => void;
  selectedChoice: ConfigChoice | null;
  characterSources: string[];
  language: string;
  requireChoice?: boolean;
  onRequirementChange?: (required: boolean) => void;
  t: ReturnType<typeof useLanguage>["t"];
}

function ConfigDrawer({
  parentOption,
  onChoice,
  selectedChoice,
  characterSources,
  language,
  requireChoice = true,
  onRequirementChange,
  t,
}: ConfigDrawerProps) {
  const [useVariant, setUseVariant] = useState(false);
  const isHumanVariant = parentOption.name === "Human" && parentOption.choiceType === "variant";
  const configChoices = useMemo(() => {
    if (isHumanVariant && !useVariant) return [];
    const raceDetails = getStaticRaceDetails(parentOption.name, characterSources, undefined, language);
    if (!raceDetails || !raceDetails.choices) return [];
    return raceDetails.choices.flatMap((choice) =>
      (choice.options || []).map((opt) => ({
        id: opt.id || slugify(opt.name),
        name: opt.name,
        description: opt.description || "",
        effect: choice.type,
        featureData: { ...opt, choiceType: choice.type },
        parentChoiceId: choice.id,
      }))
    );
  }, [parentOption, characterSources, language, useVariant, isHumanVariant]);

  useEffect(() => {
    if (isHumanVariant && onRequirementChange) {
      onRequirementChange(useVariant);
    }
  }, [isHumanVariant, useVariant, onRequirementChange]);

  if (configChoices.length === 0 && !isHumanVariant) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          No configuration options {t("common.available", "available")}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isHumanVariant && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useVariant}
              onChange={(e) => setUseVariant(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent-indigo-600)] focus:ring-[var(--color-accent-indigo-500)]"
            />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {t("modal.enableVariantHuman", "Enable Variant Human")}
            </span>
          </label>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {t("modal.variantHumanHint", "When enabled, you gain +1 to two abilities, one skill proficiency, and one feat.")}
          </p>
        </div>
      )}
      
      {(!isHumanVariant || useVariant) && configChoices.length > 0 && (
        <>
          {parentOption.recommendationText && (
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <p className="text-xs text-amber-300 leading-relaxed">
                {parentOption.recommendationText}
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                {parentOption.choiceType === "variant" ? t("modal.variant", "Variant") : t("common.choose", "Choose")}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {parentOption.name}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {parentOption.choiceType === "variant"
                ? t("modal.selectVariantTraits", "Select the variant human traits for your character.")
                : t("modal.selectChoice", { type: parentOption.choiceType || "" }, "Select your {type}")}
            </p>
          </div>

          <div className="p-4 space-y-2">
            {configChoices.map((choice) => (
              <ConfigChoiceCard
                key={choice.id}
                choice={choice}
                isSelected={selectedChoice?.id === choice.id}
                onClick={() => onChoice(choice)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ConfigChoiceCardProps {
  choice: ConfigChoice;
  isSelected: boolean;
  onClick: () => void;
}
function ConfigChoiceCard({ choice, isSelected, onClick }: ConfigChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 text-left rounded-xl border transition-all ${
        isSelected
          ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-50)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {choice.name}
            </span>
            {isSelected && (
              <span className="flex-shrink-0">
                <Check className="h-4 w-4 text-[var(--color-accent-indigo-600)]" />
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2">
            {choice.description}
          </p>
          {choice.effect && (
            <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
              {choice.effect}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

interface RaceInfoPanelProps {
  option: SelectionOption;
  characterSources?: string[];
  language: string;
  t: ReturnType<typeof useLanguage>["t"];
}

function formatDarkvision(
  darkvision: SRDRace["darkvision"] | undefined,
  t: ReturnType<typeof useLanguage>["t"],
): string {
  if (!darkvision) return t("modal.none", "Tidak ada");
  if (typeof darkvision === "object" && typeof darkvision.range === "number") {
    return `${darkvision.range} ft`;
  }
  return t("common.yes", "Ya");
}

function RaceInfoPanel({ option, characterSources, language, t }: RaceInfoPanelProps) {
  const details = getStaticRaceDetails(option.name, characterSources, undefined, language);
  const abilityIncreases = Object.entries(details?.abilityScoreIncreases || {});
  const traits = details?.traits || [];
  const languages = details?.languages || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{option.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {option.source && (
            <span className="rounded bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {option.source}
            </span>
          )}
          {option.basicStats && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              {option.basicStats}
            </span>
          )}
        </div>
      </div>

      {details?.flavor && (
        <div className="rounded-2xl border-2 border-ink bg-ink/5 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.whyPlay", "Kenapa Pilih Ini")}
          </span>
          <p className="mt-1 text-sm font-bold leading-relaxed text-ink">{details.flavor}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.size", "Ukuran")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">{details?.size || "—"}</p>
        </div>
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.speed", "Kecepatan")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {details?.speed ? `${details.speed} ft` : "—"}
          </p>
        </div>
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.darkvision", "Penglihatan Gelap")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {formatDarkvision(details?.darkvision, t)}
          </p>
        </div>
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.languages", "Bahasa")}
          </span>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {languages.length > 0 ? languages.join(", ") : "—"}
          </p>
        </div>
      </div>

      {abilityIncreases.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.abilityBonuses", "Bonus Kemampuan")}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {abilityIncreases.map(([stat, bonus]) => (
              <span
                key={stat}
                className="rounded-lg border-2 border-ink bg-ink/10 px-2 py-1 text-xs font-bold text-ink"
              >
                +{bonus} {stat.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {option.recommendationText && (
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("modal.recommendation", "Rekomendasi")}
          </span>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            {option.recommendationText}
          </p>
        </div>
      )}

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          {t("modal.traits", "Ciri-ciri")}
        </span>
        {traits.length > 0 ? (
          <div className="mt-1.5 space-y-2">
            {traits.map((trait, index) => (
              <div
                key={`${trait.name}-${index}`}
                className="rounded-xl border-2 border-border-strong bg-surface p-3"
              >
                <h4 className="text-sm font-bold text-ink">{trait.name}</h4>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {trait.summary || trait.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-ink-muted">
            {t("modal.noRaceInfo", "Detail ras tidak tersedia.")}
          </p>
        )}
      </div>
    </div>
  );
}
