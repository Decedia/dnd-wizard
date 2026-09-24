"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getStaticClasses, getStaticClassDetails } from "@/lib/srd-client";
import { getStaticRaces, getStaticRaceDetails } from "@/lib/srd-client";
import { SourceBadge, SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BasePopup } from "@/components/BasePopup";
import { InfoButton } from "@/components/InfoButton";
import { RACE_ICONS } from "@/components/race-icons";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

export interface ConfigChoice {
  id: string;
  name: string;
  description: string;
  effect?: string;
  featureData?: any;
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
  const [detailsView, setDetailsView] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("list");
      setSelectedItem(null);
      setConfigChoice(null);
      setPreviewItem(null);
      setDetailsView(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const allOptions = useMemo(() => {
    if (selectionType === "class") {
      const classes = getStaticClasses(characterSources);
      return classes.map((cls) => ({
        name: cls.name,
        source: cls.source || "PHB",
        description: cls.flavorText || "",
        hasChoice: cls.subclassLevel === 1,
        choiceType: "subclass",
        subclassCount: cls.subclasses?.length || 0,
        subclassLevel: cls.subclassLevel || 3,
      })) as SelectionOption[];
    } else {
      const races = getStaticRaces(characterSources);
      return races.map((race) => ({
        name: race.name,
        source: race.source || "PHB",
        description: race.traits?.[0]?.description || "",
        icon: RACE_ICONS[race.name] || RACE_ICONS.Human,
        hasChoice: (race.choices?.length || 0) > 0,
        choiceType: race.choices?.[0]?.type || "ancestry",
        basicStats: `${race.size} • Speed ${race.speed} ft`,
      })) as SelectionOption[];
    }
  }, [selectionType, characterSources]);

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
      setDetailsView(null);
      if (option.hasChoice) {
        setSelectedItem(option);
        setStep("config");
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
        configChoice: configChoice || undefined,
        features: {
          core: selectedItem,
          children: configChoice ? [configChoice.featureData] : [],
        },
      };
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
  }, [step, selectedItem, configChoice, previewItem, selectionType, onConfirm, onClose]);

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

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={title}
      confirmLabel={confirmLabel}
      cancelLabel={step === "config" ? "Back" : "Cancel"}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmDisabled={
        step === "config"
          ? !configChoice
          : !previewItem || (previewItem.hasChoice && !configChoice)
      }
      showFooter={true}
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] -mx-4 -mt-3 mb-3">
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectionType}s...`}
              className="input w-full pl-10 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              🔍
            </span>
          </div>
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="input w-full pr-8 text-sm appearance-none"
            >
              <option value="ALL">All Sources</option>
              {availableSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              ▼
            </span>
          </div>
        </div>
      </div>

      {step === "list" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filteredOptions.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              No {selectionType}s found.
            </p>
          )}
          {filteredOptions.map((opt) => (
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
        <ConfigDrawer
          parentOption={selectedItem}
          onChoice={handleConfigChoice}
          selectedChoice={configChoice}
          selectionType={selectionType}
          characterSources={characterSources}
        />
      )}
    </BasePopup>
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
  const Icon = option.icon || (() => <span className="h-6 w-6">❓</span>);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all flex items-center gap-3 ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-900/20"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
      }`}
    >
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8 text-[var(--color-text-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {option.name}
          </span>
          <SourceBadge source={option.source} size="sm" />
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
          {option.description}
        </p>
        {selectionType === "race" && option.basicStats && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {option.basicStats}
          </p>
        )}
        {selectionType === "class" && option.subclassCount && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {option.subclassCount} Subclasses available at Level {option.subclassLevel}
          </p>
        )}
        {option.hasChoice && (
          <span
            className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
          >
            ⚠️ {option.choiceType === "subclass" ? "Subclass Required at Level 1" : "Choice Pending"}
          </span>
        )}
      </div>
      {isSelected && (
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

interface ConfigDrawerProps {
  parentOption: SelectionOption;
  onChoice: (choice: ConfigChoice) => void;
  selectedChoice: ConfigChoice | null;
  selectionType: SelectionType;
  characterSources: string[];
}

function ConfigDrawer({
  parentOption,
  onChoice,
  selectedChoice,
  selectionType,
  characterSources,
}: ConfigDrawerProps) {
  const { tDesc } = useLanguage();

  const configChoices = useMemo(() => {
    if (selectionType === "class") {
      const classDetails = getStaticClassDetails(parentOption.name, characterSources);
      if (!classDetails) return [];
      return classDetails.subclasses
        .filter((sub) => sub.name && sub.features?.length > 0)
        .map((sub) => ({
          id: slugify(sub.name),
          name: sub.name,
          description: sub.description,
          effect: sub.features
            .filter((f) => f.level === 1 || f.level === parentOption.subclassLevel)
            .slice(0, 3)
            .map((f) => `${f.name} (Lv ${f.level || "?"})`)
            .join(", "),
          featureData: sub,
        }));
    } else {
      const raceDetails = getStaticRaceDetails(parentOption.name, characterSources);
      if (!raceDetails || !raceDetails.choices) return [];
      return raceDetails.choices.flatMap((choice) =>
        (choice.options || []).map((opt) => ({
          id: opt.id || slugify(opt.name),
          name: opt.name,
          description: opt.description || "",
          effect: choice.type,
          featureData: { ...opt, choiceType: choice.type },
        }))
      );
    }
  }, [parentOption, selectionType, characterSources]);

  if (configChoices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          No configuration options available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            {selectionType === "class" ? "Divine Domain" : "Choose"}
          </span>
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {parentOption.name}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {parentOption.choiceType === "subclass"
            ? "Select your subclass — defines your class features at levels 1, 2, 3, 6, 10, and 14"
            : `Select your ${parentOption.choiceType}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {configChoices.map((choice) => (
          <ConfigChoiceCard
            key={choice.id}
            choice={choice}
            isSelected={selectedChoice?.id === choice.id}
            onClick={() => onChoice(choice)}
          />
        ))}
      </div>
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
      className={`w-full p-4 text-left rounded-[var(--radius-sm)] border transition-all ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-900/20"
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
              <svg className="h-4 w-4 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
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