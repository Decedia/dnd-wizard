"use client";

import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { getStaticClasses, getStaticClassDetails } from "@/lib/srd-client";
import { getStaticRaces, getStaticRaceDetails } from "@/lib/srd-client";
import { SourceBadge, SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RACE_ICONS } from "@/components/race-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  WarningCircleIcon as AlertCircle,
  MagnifyingGlassIcon as MagnifyingGlass,
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

  const isConfirmDisabled =
    step === "config"
      ? !configChoice
      : !previewItem || (previewItem.hasChoice && !configChoice);

  const stickyHeader = (
    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlass className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectionType}s...`}
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div className="relative">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="ALL">All Sources</option>
          {availableSources.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
        </div>
      </div>
    </div>
  );

  const stickyFooter = (
    <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        {step === "config" ? "Back" : "Cancel"}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirmDisabled}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
          isConfirmDisabled
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
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
        <div className="p-4 space-y-3">
          {filteredOptions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
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
    </BottomSheet>
  );
}

function FallbackIcon({ className }: { className?: string }) {
  return <span className={className}>❓</span>;
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
      className={`w-full p-3 text-left rounded-xl border transition-all flex items-center gap-3 ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
        <Icon className="h-7 w-7 text-slate-700 dark:text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {option.name}
          </span>
          <SourceBadge source={option.source} size="sm" />
          {isSelected && (
            <span className="flex-shrink-0">
              <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-1">
          {option.description}
        </p>
        {selectionType === "race" && option.basicStats && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {option.basicStats}
          </p>
        )}
        {selectionType === "class" && option.subclassCount !== undefined && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {option.subclassCount} Subclasses available at Level {option.subclassLevel}
          </p>
        )}
        {option.hasChoice && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" />
            {option.choiceType === "subclass" ? "Subclass Required at Level 1" : "Choice Pending"}
          </span>
        )}
      </div>
      {option.hasChoice && (
        <div className="flex-shrink-0 text-slate-400">
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
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          No configuration options available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {selectionType === "class" ? "Divine Domain" : "Choose"}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {parentOption.name}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {parentOption.choiceType === "subclass"
            ? "Select your subclass — defines your class features at levels 1, 2, 3, 6, 10, and 14"
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
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {choice.name}
            </span>
            {isSelected && (
              <span className="flex-shrink-0">
                <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
            {choice.description}
          </p>
          {choice.effect && (
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
              {choice.effect}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
