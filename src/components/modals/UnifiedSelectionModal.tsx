"use client";

import { getTakenSpellNames } from "@/lib/taken-spells";
import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { getStaticClasses, getStaticSubclasses } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { activeRaceChoices, getStaticRaces, getStaticRaceDetails, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { BottomSheet } from "@/components/modals/BottomSheet";
import {
  InfoBadge,
  InfoCallout,
  InfoCard,
  InfoChip,
  InfoProse,
  InfoSectionLabel,
  InfoStatTile,
  InfoTraitList,
} from "@/components/modals/InfoBits";
import { RACE_ICONS } from "@/components/race-icons";
import { buildRaceCategoryIndex, getRaceCategoryName, RACE_PARENT_ALIASES } from "@/data/race-categories";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { HumanVariantConfig, type HumanVariantConfigPayload } from "@/components/modals/HumanVariantConfig";
import { HalfElfConfig, type HalfElfConfigPayload } from "@/components/modals/HalfElfConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { RichText, RichInline } from "@/components/RichText";
import { decodeFeatOptions } from "@/lib/feat-grants";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  InfoIcon as Info,
  MagnifyingGlassIcon as MagnifyingGlass,
  StarIcon as Star,
  UsersIcon as Users,
  SwordIcon as ClassGroupSword,
  ShieldIcon as ClassGroupShield,
  MagicWandIcon as ClassGroupWand,
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
  /** Parent race category the description came from, when grouped. */
  categoryName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Full class record for the class info panel. */
  details?: SRDClass;
  hasChoice?: boolean;
  choiceType?: string;
  basicStats?: string;
  subclassCount?: number;
  /** Subclass names offered under the character's sourcebooks. */
  subclassNames?: string[];
  subclassLevel?: number;
  isRecommended?: boolean;
  recommendationText?: string;
  /** Parent race that is only playable through one of its subraces. */
  requiresSubrace?: boolean;
  /** The race record this card picks, when the card's own name differs (Variant Human). */
  raceName?: string;
  /** One plain line on what the card gives, shown under its name. */
  summary?: string;
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

export const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

/**
 * Half-Elf and all of its subraces carry the same two player choices. They are
 * matched by name because the race data has no choice rows of its own - the
 * config panel supplies the pickers directly.
 */
function isHalfElfRace(raceName: string): boolean {
  return raceName.startsWith("Half-Elf");
}

function findParentRaceName(name: string, candidates: string[], raceName?: string): string | null {
  if (raceName && raceName !== name) return raceName;
  if (RACE_PARENT_ALIASES[name]) return RACE_PARENT_ALIASES[name];
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
    const groupName = findParentRaceName(race.name, parentCandidates, race.raceName) ?? race.name;
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

/** Class list groups by how much a class leans on magic, for new players. Unlisted classes fall into "other". */
const CLASS_GROUPS: { key: string; members: string[]; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "martial", members: ["Barbarian", "Fighter", "Monk", "Rogue"], Icon: ClassGroupSword },
  { key: "half", members: ["Paladin", "Ranger", "Artificer"], Icon: ClassGroupShield },
  { key: "full", members: ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"], Icon: ClassGroupWand },
];

type ListGroup = { key: string; label: string; flavor: string; icon: React.ReactNode; options: SelectionOption[] };

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
      return classes.map((cls) => {
        // Count from the subclass data under the chosen books; the class
        // file's own subclass list is incomplete.
        const subclassNames = getStaticSubclasses(cls.name, characterSources, undefined, language).map((s) => s.name);
        return {
        name: cls.name,
        source: cls.source || "PHB",
        description: cls.flavor || "",
        details: cls,
        icon: CLASS_ICONS[cls.name] || FallbackIcon,
        hasChoice: false,
        choiceType: "subclass",
        subclassCount: subclassNames.length,
        subclassNames,
        subclassLevel: cls.subclassLevel || 3,
        basicStats: `${t("modal.hitDie", "Hit die")} d${cls.hitDie || 8} • ${subclassNames.length} ${t("modal.subclasses", "Subclasses")}`,
        isRecommended: (cls as any).recommendation?.is_recommended || false,
        recommendationText: (cls as any).recommendation?.text || "",
      };
      }) as SelectionOption[];
    } else {
      const races = getStaticRaces(characterSources, undefined, language);
      const categoryByRace = buildRaceCategoryIndex(
        races.map((race) => race.name),
        language,
      );
      return races.flatMap((race) => {
        const option: SelectionOption = {
        name: race.name,
        categoryName: getRaceCategoryName(race.name, races.map((r) => r.name)),
        source: race.source || "PHB",
        description: categoryByRace.get(race.name)?.flavor || race.traits?.[0]?.description || "",
        icon: RACE_ICONS[race.name] || RACE_ICONS.Human,
        hasChoice: isHalfElfRace(race.name) || (race.choices?.length || 0) > 0,
        choiceType: isHalfElfRace(race.name)
          ? "half_elf"
          : race.choices?.[0]?.type || "ancestry",
        basicStats: `${race.size} • Speed ${race.speed} ft`,
        isRecommended: (race as any).recommendation?.is_recommended || false,
        recommendationText: (race as any).recommendation?.text || "",
        requiresSubrace: race.requiresSubrace || false,
        };
        // Human and Variant Human are two cards side by side, like subraces.
        if (race.name !== "Human" || option.choiceType !== "variant") return [option];
        return [
          { ...option, hasChoice: false, choiceType: undefined, summary: t("modal.humanSummary", "+1 to every ability score and one extra language.") },
          {
            ...option,
            name: t("origin.variantHuman", "Variant Human"),
            raceName: "Human",
            isRecommended: false,
            summary: t("modal.variantHumanSummary", "+1 to two ability scores, one skill and one feat."),
          },
        ];
      });
    }
  }, [selectionType, characterSources, language, t]);

  const filteredOptions = useMemo(() => {
    let options = allOptions.filter((opt) => !opt.requiresSubrace);
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

  const listGroups = useMemo<ListGroup[]>(() => {
    if (selectionType === "race") {
      return raceGroups.map((g) => ({
        key: g.groupName,
        label: g.groupName,
        flavor: g.options[0]?.description || "",
        icon: <Users className="h-5 w-5" />,
        options: g.options,
      }));
    }
    const grouped = new Set(CLASS_GROUPS.flatMap((g) => g.members));
    const groups: ListGroup[] = CLASS_GROUPS.map((g) => ({
      key: g.key,
      label: t(`modal.classGroup.${g.key}`, g.key),
      flavor: t(`modal.classGroupFlavor.${g.key}`, ""),
      icon: <g.Icon className="h-5 w-5" />,
      options: g.members.map((name) => filteredOptions.find((o) => o.name === name)).filter((o): o is SelectionOption => !!o),
    }));
    const others = filteredOptions.filter((o) => !grouped.has(o.name));
    if (others.length > 0) {
      groups.push({ key: "other", label: t("modal.classGroup.other", "Other"), flavor: "", icon: <ClassGroupSword className="h-5 w-5" />, options: others });
    }
    return groups.filter((g) => g.options.length > 0);
  }, [selectionType, raceGroups, filteredOptions, t]);

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
    setStep("list");
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
        name: selectedItem.raceName ?? selectedItem.name,
        source: selectedItem.source,
        ...(configChoice && requireChoice ? { configChoice } : {}),
        features: {
          core: selectedItem,
          children: configChoice && requireChoice ? [configChoice.featureData] : [],
        },
      };
      onConfirm(payload);
      onClose();
    } else if (step === "info") {
      handleSelectInfoRace();
    } else if (step === "list" && previewItem && !previewItem.hasChoice) {
      const payload: SelectionPayload<T> = {
        type: selectionType,
        name: previewItem.raceName ?? previewItem.name,
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
      ? selectionType === "class"
        ? t("modal.classInfo", "Class Info")
        : t("modal.raceInfo", "Info Ras")
      : selectionType === "class"
        ? t("modal.selectClass", "Choose Your Class")
        : t("modal.selectRace", "Choose Your Race");
  const confirmLabel =
    step === "config"
      ? `${t("common.confirm")} ${configChoice ? configChoice.name : t("common.selection", "Selection")}`
      : step === "info"
        ? selectionType === "class"
          ? t("weaponPicker.selectThis", "Pilih Ini")
          : t("modal.selectThisRace", "Pilih Ras Ini")
        : previewItem
          ? t("common.confirmSelection", "Confirm Selection")
          : t("modal.selectOption", "Select an Option");

  const showInfo = step === "info" && !!infoItem;

  const isHumanVariantStep = step === "config" && selectedItem?.raceName === "Human" && selectedItem.choiceType === "variant";
  // Reopening the picker on a Variant Human keeps the earlier picks.
  const keptVariant = currentCharacter?.race === "Human" && currentCharacter?.raceVariant === "variant";
  const variantData = isHumanVariantStep ? (configChoice?.featureData as HumanVariantConfigPayload | undefined) : undefined;
  // Half-Elf: both picks must be made before the race can be confirmed. Without
  // this the button enabled itself on mount, because HalfElfConfig reports an
  // empty payload through useEffect as soon as it renders.
  const isHalfElfStep = step === "config" && selectedItem?.choiceType === "half_elf";
  const halfElfData = configChoice?.featureData as HalfElfConfigPayload | undefined;
  // A SCAG variant (Half-Elf (Wood Elf)) picks an elf trait instead of skills.
  const halfElfVariant = isHalfElfStep && selectedItem!.name.startsWith("Half-Elf (");
  // Plain call, not a hook: this runs after the early return above.
  const halfElfRaceChoices = halfElfVariant ? getStaticRaceDetails(selectedItem!.name, characterSources, undefined, language)?.choices || [] : [];
  const halfElfOpenChoices = activeRaceChoices(halfElfRaceChoices, halfElfData?.choices).filter((c) => !halfElfData?.choices?.[c.id]);
  const halfElfMissing: string[] = [];
  if (isHalfElfStep) {
    const abilityGap = 2 - (halfElfData?.abilities?.length || 0);
    const skillGap = halfElfVariant ? 0 : 2 - (halfElfData?.skills?.length || 0);
    if (abilityGap > 0) halfElfMissing.push(t("modal.missingAbilities", { n: abilityGap }, "Pilih {n} ability"));
    if (skillGap > 0) halfElfMissing.push(t("modal.missingSkills", { n: skillGap }, "Pilih {n} skill"));
    for (const c of halfElfOpenChoices) halfElfMissing.push(t("modal.missingChoice", { name: c.name }, "Pick {name}"));
  }
  if (isHumanVariantStep) {
    const abilityGap = 2 - (variantData?.abilities?.length || 0);
    if (abilityGap > 0) halfElfMissing.push(t("modal.missingAbilities", { n: abilityGap }, "Pilih {n} ability"));
    if (!variantData?.skill) halfElfMissing.push(t("modal.missingSkills", { n: 1 }, "Pilih {n} skill"));
    if (!variantData?.feat) halfElfMissing.push(t("modal.missingFeat", "Pick a feat"));
  }
  const halfElfComplete = halfElfMissing.length === 0;
  const isConfirmDisabled =
    step === "config"
      ? !halfElfComplete || (requireChoice && !configChoice)
      : step === "info"
        ? !infoItem
        : !previewItem || (previewItem.hasChoice && !configChoice && requireChoice);


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
    <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex flex-wrap gap-2">
      {halfElfMissing.length > 0 && (
        <p className="w-full text-xs font-semibold text-[var(--color-warning-600)]">
          {halfElfMissing.join(" · ")}
        </p>
      )}
      <button
        type="button"
        onClick={handleCancel}
        className="btn btn-secondary flex-1"
      >
        {step === "config" || step === "info" ? t("common.back", "Back") : t("common.cancel", "Cancel")}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirmDisabled}
        className="btn btn-primary flex-1"
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
      {!showInfo && stickyHeader}

      {(step === "list" || showInfo) && (
        <div key={showInfo ? "info" : "list"} className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
          {showInfo && selectionType === "class" ? (
            <ClassInfoPanel option={infoItem.option} />
          ) : showInfo ? (
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

          {listGroups.length > 0 ? (
            <div className="space-y-3">
              {listGroups.map((group) => {
                const isGroupSelected = group.options.some(
                  (opt) => previewItem?.name === opt.name
                );
                const groupFlavor = group.flavor;
                return (
                  <details
                    key={group.key}
                    open={searchQuery.trim() !== "" || openGroups.includes(group.key)}
                    onToggle={(e) => handleGroupToggle(group.key, e.currentTarget.open)}
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
                          {group.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-ink">{group.label}</h3>
                          {groupFlavor && (
                            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                              {groupFlavor}
                            </p>
                          )}
                        </div>
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
                          <div
                            key={opt.name}
                            className={`flex flex-row overflow-hidden rounded-xl border-2 transition-all ${
                              isSelected
                                ? "border-ink bg-ink/10"
                                : "border-transparent bg-surface hover:border-ink/30"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleRaceOptionClick(opt, group.key)}
                              aria-label={t("modal.selectRaceOption", { race: opt.name }, "Pilih {race}")}
                              className="flex flex-1 items-center justify-between p-3 text-left transition active:scale-[0.98]"
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
                                {opt.summary && (
                                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{opt.summary}</p>
                                )}
                                {selectionType === "class" && opt.description && (
                                  <p className="mt-1 text-xs leading-relaxed text-ink-muted"><RichInline text={opt.description} /></p>
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
                              onClick={() => handleOpenRaceInfo(opt, group.key)}
                              aria-label={t("modal.raceInfoButton", { race: opt.name }, "Info {race}")}
                              className="flex w-12 shrink-0 items-center justify-center border-l-2 border-border-muted text-ink-muted transition hover:bg-ink/5 hover:text-ink active:scale-90"
                            >
                              <Info className="h-5 w-5" />
                            </button>
                          </div>
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
              {selectedItem.choiceType === "half_elf" ? (
                <HalfElfConfig
                  initialAbilities={(configChoice?.featureData as HalfElfConfigPayload | undefined)?.abilities || []}
                  initialSkills={(configChoice?.featureData as HalfElfConfigPayload | undefined)?.skills || []}
                  initialChoices={(configChoice?.featureData as HalfElfConfigPayload | undefined)?.choices || (currentCharacter?.race === selectedItem.name ? currentCharacter?.raceChoices : undefined) || {}}
                  variant={halfElfVariant}
                  raceChoices={halfElfRaceChoices}
                  character={currentCharacter as Partial<Character>}
                  onChange={(halfElfConfig) => {
                    setConfigChoice({
                      id: "half-elf-abilities",
                      name: t("modal.halfElfChoices", "Half-Elf Choices"),
                      description: t("modal.halfElfHint", "As a Half-Elf, you gain +1 to two ability scores of your choice, and proficiency in two skills of your choice."),
                      featureData: halfElfConfig,
                      parentChoiceId: "",
                    } as any);
                  }}
                />
              ) : isHumanVariantStep ? (
                <HumanVariantConfig
                  initialAbilities={configChoice?.featureData?.abilities || (keptVariant ? currentCharacter.variantHumanAbilities : undefined) || []}
                  initialSkill={configChoice?.featureData?.skill ?? (keptVariant ? currentCharacter.variantHumanSkill : undefined)}
                  initialFeat={configChoice?.featureData?.feat ?? (keptVariant ? currentCharacter.featureSelections?.["variant-human-feat"]?.[0] : undefined)}
                  initialFeatOptions={configChoice?.featureData?.featOptions ?? (keptVariant ? decodeFeatOptions(currentCharacter.featureSelections?.["variant-human-feat-options"]) : undefined)}
                  disabledFeats={[
                    ...(currentCharacter?.features || []).filter((f: any) => f.name && f.source !== "custom").map((f: any) => f.name),
                    ...Object.values(currentCharacter?.featureSelections || {}).flat(),
                  ]}
                  character={currentCharacter}
                  sources={currentCharacter?.sources}
                  onChange={(variantConfig) => {
                    setConfigChoice({
                      id: "variant-human",
                      name: t("origin.variantHuman", "Variant Human"),
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
              takenSpells={currentCharacter ? getTakenSpellNames({ ...currentCharacter, raceChoices: {} }) : undefined}
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
      clampSubtitle={selectionType !== "class"}
      icon={<Icon className="h-6 w-6 text-[var(--color-text-primary)]" />}
      badges={badges}
      isRecommended={option.isRecommended}
      isSelected={isSelected}
      onSelect={onClick}
      infoType="modal"
      modalContent={
        selectionType === "class" ? (
          <ClassInfoPanel option={option} />
        ) : (
          <RichText text={option.description} className="text-xs text-[var(--color-text-secondary)]" />
        )
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
  /** Spells the character has from other sources; a race cantrip option naming one can't be picked. */
  takenSpells?: Set<string>;
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
  takenSpells,
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
                known={!!takenSpells?.has(choice.name.toLowerCase())}
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
  /** A spell the character already has from another source. */
  known?: boolean;
  onClick: () => void;
}
function ConfigChoiceCard({ choice, isSelected, known = false, onClick }: ConfigChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={known && !isSelected}
      className={`w-full p-4 text-left rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
            <RichInline text={choice.description} />
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

function formatProficiencyList(items: string[] | undefined): string[] {
  return (items || []).filter(Boolean);
}

function ClassInfoPanel({ option }: { option: SelectionOption }) {
  const { t } = useLanguage();
  const cls = option.details;
  const flavor = cls?.flavor || option.description || "";
  const sourceLabel = cls?.source || option.source;
  const savingThrows = (cls?.savingThrows || []).map((a) => a.toUpperCase());
  const primaryAbility = cls?.primaryAbility ? cls.primaryAbility.toUpperCase() : "";
  const armor = formatProficiencyList(cls?.proficiencies?.armor);
  const weapons = formatProficiencyList(cls?.proficiencies?.weapons);
  const tools = formatProficiencyList(cls?.proficiencies?.tools);
  const skillOptions = cls?.skillChoices?.options || [];
  const subclasses = option.subclassNames
    ? option.subclassNames.map((name) => ({ name }))
    : (cls?.subclasses || []).filter((sc) => !!sc?.name);
  const earlyLevels = (cls?.levels || [])
    .slice(0, 3)
    .map((entry, index) => ({
      level: index + 1,
      features: (entry.features || []).map((feature) => feature.name).filter(Boolean),
    }))
    .filter((entry) => entry.features.length > 0);
  const equipment = (cls?.startingEquipment || [])
    .map((entry) => entry?.description)
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{option.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {sourceLabel && sourceLabel !== "PHB" && <InfoBadge>{sourceLabel}</InfoBadge>}
          {cls?.subclassLevel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              {t("modal.subclassAt", { n: cls.subclassLevel }, "Subclass di Level {n}")}
            </span>
          )}
        </div>
      </div>

      {flavor && (
        <InfoCallout label={t("modal.whyPlay", "Kenapa Pilih Ini")}>{flavor}</InfoCallout>
      )}

      <div className="grid grid-cols-2 gap-2">
        <InfoStatTile
          label={t("modal.hitDie", "Dadu HP")}
          value={cls?.hitDie ? `d${cls.hitDie}` : ""}
        />
        <InfoStatTile label={t("modal.hpPerLevel", "HP per Level")} value={cls?.hpPerLevel ? `+${cls.hpPerLevel}` : ""} />
        <InfoStatTile label={t("modal.primaryAbility", "Kemampuan Utama")} value={primaryAbility} />
        <InfoStatTile
          label={t("modal.savingThrows", "Saving Throw")}
          value={savingThrows.length > 0 ? savingThrows.join(", ") : ""}
        />
      </div>

      {armor.length + weapons.length + tools.length > 0 && (
        <div>
          <InfoSectionLabel>{t("modal.proficiencies", "Keahlian")}</InfoSectionLabel>
          <div className="mt-1.5 space-y-1.5">
            {armor.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  {t("modal.armor", "Zirah")}
                </span>
                {armor.map((item) => (
                  <InfoChip key={`armor-${item}`}>{item}</InfoChip>
                ))}
              </div>
            )}
            {weapons.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  {t("modal.weapons", "Senjata")}
                </span>
                {weapons.map((item) => (
                  <InfoChip key={`weapon-${item}`}>{item}</InfoChip>
                ))}
              </div>
            )}
            {tools.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  {t("proficiencies.tools", "Keahlian Alat")}
                </span>
                {tools.map((item) => (
                  <InfoChip key={`tool-${item}`}>{item}</InfoChip>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {cls?.skillChoices && (
        <InfoCard
          label={t("modal.skillChoices", "Pilihan Skill")}
          labelClassName="text-ink"
        >
          <p className="text-xs text-ink-muted">
            {t("modal.chooseSkillsCount", { n: cls.skillChoices.count }, "Pilih {n} skill")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {skillOptions.map((skill) => (
              <InfoChip key={skill}>{skill}</InfoChip>
            ))}
          </div>
        </InfoCard>
      )}

      {subclasses.length > 0 && (
        <InfoCard label={t("modal.subclasses", "Subclass")}>
          <div className="flex flex-wrap gap-1.5">
            {subclasses.map((subclass) => (
              <InfoChip key={subclass.name} emphasis>
                {subclass.name}
              </InfoChip>
            ))}
          </div>
        </InfoCard>
      )}

      {option.recommendationText && (
        <InfoCard label={t("modal.recommendation", "Rekomendasi")}>
          <p className="text-xs leading-relaxed text-ink-muted">{option.recommendationText}</p>
        </InfoCard>
      )}

      {earlyLevels.length > 0 && (
        <div>
          <InfoSectionLabel>{t("modal.earlyFeatures", "Fitur Awal")}</InfoSectionLabel>
          <div className="mt-1.5 space-y-2">
            {earlyLevels.map(({ level, features }) => (
              <div key={level} className="rounded-xl border-2 border-border-strong bg-surface p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {t("modal.levelN", { n: level }, "Level {n}")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-md border-2 border-border-strong bg-paper-muted px-2 py-0.5 text-[11px] font-semibold text-ink"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {equipment.length > 0 && (
        <InfoCard label={t("modal.startingEquipment", "Perlengkapan Awal")}>
          <ul className="space-y-1">
            {equipment.map((entry, index) => (
              <li key={`equip-${index}`} className="text-xs leading-relaxed text-ink-muted">
                - {entry}
              </li>
            ))}
          </ul>
        </InfoCard>
      )}
    </div>
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
  const details = getStaticRaceDetails(option.raceName ?? option.name, characterSources, undefined, language);
  // Variant Human swaps the +1 to everything for its own picks.
  const isVariantHuman = option.raceName === "Human" && option.choiceType === "variant";
  const abilityIncreases = isVariantHuman ? [] : Object.entries(details?.abilityScoreIncreases || {});
  const traits = details?.traits || [];
  const languages = details?.languages || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{option.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {option.source && <InfoBadge>{option.source}</InfoBadge>}
          {option.basicStats && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              {option.basicStats}
            </span>
          )}
        </div>
      </div>

      {option.description && (
        <InfoCallout
          label={
            option.categoryName && option.categoryName !== option.name
              ? t("modal.whyPlayCategory", { category: option.categoryName }, "Kenapa Pilih {category}")
              : t("modal.whyPlay", "Kenapa Pilih Ini")
          }
        >
          {option.description}
        </InfoCallout>
      )}

      <div className="grid grid-cols-2 gap-2">
        <InfoStatTile label={t("modal.size", "Ukuran")} value={details?.size} />
        <InfoStatTile
          label={t("modal.speed", "Kecepatan")}
          value={details?.speed ? `${details.speed} ft` : ""}
        />
        <InfoStatTile
          label={t("modal.darkvision", "Penglihatan Gelap")}
          value={formatDarkvision(details?.darkvision, t)}
        />
        <InfoStatTile
          label={t("modal.languages", "Bahasa")}
          value={languages.length > 0 ? languages.join(", ") : ""}
        />
      </div>

      {isVariantHuman && (
        <div>
          <InfoSectionLabel>{t("modal.abilityBonuses", "Bonus Kemampuan")}</InfoSectionLabel>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            {t("modal.variantHumanDescription", "You gain +1 to two different ability scores of your choice, proficiency in one skill of your choice, and one feat of your choice.")}
          </p>
        </div>
      )}

      {(abilityIncreases.length > 0 || details?.flexibleAsi) && (
        <div>
          <InfoSectionLabel>{t("modal.abilityBonuses", "Bonus Kemampuan")}</InfoSectionLabel>
          {abilityIncreases.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {abilityIncreases.map(([stat, bonus]) => (
                <InfoChip key={stat} emphasis>
                  +{bonus} {stat.toUpperCase()}
                </InfoChip>
              ))}
            </div>
          )}
          {details?.flexibleAsi && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {details.flexibleAsi === "lineage"
                ? t("abilities.flexLineage", "Beri +2 ke satu skor dan +1 ke skor lain, atau +1 ke tiga skor berbeda.")
                : t("abilities.flexOne", "Beri +1 ke satu skor lain pilihanmu.")}
            </p>
          )}
        </div>
      )}

      {option.recommendationText && (
        <InfoCard label={t("modal.recommendation", "Rekomendasi")}>
          <p className="text-xs leading-relaxed text-ink-muted">{option.recommendationText}</p>
        </InfoCard>
      )}

      <div>
        <InfoSectionLabel>{t("modal.traits", "Ciri-ciri")}</InfoSectionLabel>
        <InfoTraitList
          traits={traits}
          emptyText={t("modal.noRaceInfo", "Detail ras tidak tersedia.")}
        />
      </div>
    </div>
  );
}
