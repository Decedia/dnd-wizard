"use client";

import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { getStaticClasses } from "@/lib/srd-client";
import { getStaticRaces, getStaticRaceDetails } from "@/lib/srd-client";
import { SourceBadge, SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RACE_ICONS } from "@/components/race-icons";
import { HumanVariantConfig, type HumanVariantConfigPayload } from "@/components/modals/HumanVariantConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  WarningCircleIcon as AlertCircle,
  MagnifyingGlassIcon as MagnifyingGlass,
  StarIcon as Star,
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
export type SelectionStep = "list" | "config";

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

export function UnifiedSelectionModal<T extends SelectionType>({
  isOpen,
  onClose,
  onConfirm,
  selectionType,
  characterSources = [],
  currentCharacter,
}: SelectionModalProps<T>) {
  const { tDesc, language } = useLanguage();
  const [step, setStep] = useState<SelectionStep>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<SelectionOption | null>(null);
  const [configChoice, setConfigChoice] = useState<ConfigChoice | null>(null);
  const [previewItem, setPreviewItem] = useState<SelectionOption | null>(null);
  const [requireChoice, setRequireChoice] = useState(true);

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
        description: cls.flavorText || "",
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
        description: race.traits?.[0]?.description || "",
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
  }, [step, selectedItem, configChoice, requireChoice, previewItem, selectionType, onConfirm, onClose]);

  const handleBack = useCallback(() => {
    setStep("list");
    setSelectedItem(null);
    setConfigChoice(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (step === "config") {
      handleBack();
    } else {
      onClose();
    }
  }, [step, handleBack, onClose]);

  if (!isOpen) return null;

  const title = selectionType === "class" ? "Choose Your Class" : "Choose Your Race";
  const confirmLabel =
    step === "config"
      ? `Confirm ${configChoice ? configChoice.name : "Selection"}`
      : previewItem
      ? "Confirm Selection"
      : "Select an Option";

  const isConfirmDisabled =
    step === "config"
      ? requireChoice && !configChoice
      : !previewItem || (previewItem.hasChoice && !configChoice && requireChoice);

  const stickyHeader = (
    <div className="sticky top-0 z-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectionType}s...`}
          className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
        />
      </div>
      <div className="relative">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full px-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
        >
          <option value="ALL">All Sources</option>
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
        {step === "config" ? "Back" : "Cancel"}
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
      {stickyHeader}

      {step === "list" && (
        <div className="px-4 pt-4 pb-2 space-y-3">
          {filteredOptions.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              No {selectionType}s found.
            </p>
          )}
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
              />
            ))}
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
              onChange={(variantConfig) => {
                setConfigChoice({
                  id: "variant-human",
                  name: "Variant Human",
                  description: "You gain +1 to two different ability scores of your choice, proficiency in one skill of your choice, and one feat of your choice.",
                  featureData: { ...configChoice, choiceType: "variant" },
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
}

function SelectionCard({
  option,
  isSelected,
  onClick,
  selectionType,
}: SelectionCardProps) {
  const Icon = option.icon || FallbackIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full p-3 text-left rounded-xl border transition-all flex items-center gap-3 overflow-visible ${
        isSelected
          ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-50)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
      }`}
    >
      {option.isRecommended && (
        <span className="absolute -top-3 -left-3 w-6 h-6 text-amber-400 drop-shadow-md z-10">
          <Star className="h-8 w-8 fill-amber-400" />
        </span>
      )}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--color-bg)]">
        <Icon className="h-7 w-7 text-[var(--color-text-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {option.name}
          </span>
          <SourceBadge source={option.source} size="sm" />
          {isSelected && (
            <span className="flex-shrink-0">
              <Check className="h-4 w-4 text-[var(--color-accent-indigo-600)]" />
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-1">
          {option.description}
        </p>
        {selectionType === "race" && option.basicStats && (
          <p className="text-xs text-[var(--color-text-muted)]">
            {option.basicStats}
          </p>
        )}
        {selectionType === "class" && option.subclassCount !== undefined && (
          <p className="text-xs text-[var(--color-text-muted)]">
            {option.subclassCount} Subclasses available at Level {option.subclassLevel}
          </p>
        )}
        {option.hasChoice && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">
            <AlertCircle className="h-3 w-3" />
            {option.choiceType === "subclass" ? "Subclass Required at Level 1" : "Choice Pending"}
          </span>
        )}
      </div>
      {option.hasChoice && (
        <div className="flex-shrink-0 text-[var(--color-text-muted)]">
          <ChevronRight className="h-5 w-5" />
        </div>
      )}
    </button>
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
}

function ConfigDrawer({
  parentOption,
  onChoice,
  selectedChoice,
  characterSources,
  language,
  requireChoice = true,
  onRequirementChange,
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
          No configuration options available.
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
              Enable Variant Human
            </span>
          </label>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            When enabled, you gain +1 to two abilities, one skill proficiency, and one feat.
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
                {parentOption.choiceType === "variant" ? "Variant" : "Choose"}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {parentOption.name}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {parentOption.choiceType === "variant"
                ? "Select the variant human traits for your character."
                : `Select your ${parentOption.choiceType}`}
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
