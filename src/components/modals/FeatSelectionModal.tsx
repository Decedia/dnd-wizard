"use client";

import { useCallback, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon as MagnifyingGlass,
  CheckIcon as Check,
  InfoIcon as Info,
  CaretRightIcon as ChevronRight,
  WarningCircleIcon as Warning,
  BookIcon as BookBookmark,
} from "@/components/icons";
import {
  getStaticFeats,
  getStaticSpells,
  meetsPrerequisites,
  getEngineFeatFlavor,
  type SRDFeat,
  type FeatOptionGroup,
} from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { isRecommended } from "@/lib/recommendations";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/modals/BottomSheet";

interface FeatSelectionModalProps {
  onSelect: (feat: SRDFeat, optionSelections?: Record<string, string>) => void;
  onClose: () => void;
  selectedFeat?: string;
  sources?: string[];
  disabledFeats?: string[];
  character?: Character;
}

type ModalStep = "list" | "info" | "spell";
type FeatOptions = Record<string, string>;

const SCROLL_CLASS = "flex-1 overflow-y-auto overscroll-contain p-4 pb-8 max-h-[75vh]";

function pillClass(active: boolean) {
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
    active
      ? "bg-ink text-surface border-transparent"
      : "bg-paper-muted text-ink-muted border-border-strong hover:border-ink"
  }`;
}

export function FeatSelectionModal({
  onSelect,
  onClose,
  selectedFeat,
  sources,
  disabledFeats = [],
  character,
}: FeatSelectionModalProps) {
  const { t } = useLanguage();
  const feats = getStaticFeats(sources);
  const [search, setSearch] = useState("");
  const [pendingSelection, setPendingSelection] = useState<string | null>(selectedFeat || null);
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [prereqFilter, setPrereqFilter] = useState<"all" | "with" | "without">("all");
  const [optionSelections, setOptionSelections] = useState<FeatOptions>({});
  const [step, setStep] = useState<ModalStep>("list");
  const [infoFeat, setInfoFeat] = useState<SRDFeat | null>(null);
  const [spellTarget, setSpellTarget] = useState<{ optionId: string; group: FeatOptionGroup } | null>(
    null,
  );
  const [spellSearch, setSpellSearch] = useState("");

  const disabledFeatNames = useMemo(() => new Set(disabledFeats), [disabledFeats]);

  const availableSources = useMemo(() => {
    const sourceSet = new Set<string>();
    for (const feat of feats) {
      const src = feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name);
      if (src) sourceSet.add(src);
    }
    return Array.from(sourceSet).sort();
  }, [feats]);

  const filteredFeats = useMemo(() => {
    let base = feats.filter((feat) => !disabledFeatNames.has(feat.name));
    if (sourceFilter !== "ALL") {
      base = base.filter(
        (feat) =>
          (feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name)) ===
          sourceFilter,
      );
    }
    if (prereqFilter === "with") {
      base = base.filter((feat) => feat.prerequisites !== null);
    } else if (prereqFilter === "without") {
      base = base.filter((feat) => feat.prerequisites === null);
    }
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (feat) => feat.name.toLowerCase().includes(q) || (feat.description || "").toLowerCase().includes(q),
    );
  }, [feats, search, disabledFeatNames, sourceFilter, prereqFilter]);

  const pendingFeat = useMemo(
    () => feats.find((feat) => feat.name === pendingSelection) ?? null,
    [feats, pendingSelection],
  );

  const optionGroups = useMemo<FeatOptionGroup[]>(
    () => (pendingFeat?.options ?? []).filter((group) => group.count > 0),
    [pendingFeat],
  );

  const missingOptionIds = useMemo(
    () => optionGroups.filter((group) => !optionSelections[group.id]).map((group) => group.id),
    [optionGroups, optionSelections],
  );

  const isReadyToConfirm = !!pendingFeat && missingOptionIds.length === 0;

  const spellChoices = useMemo(() => {
    if (!spellTarget) return [];
    const filter = spellTarget.group.spell;
    if (!filter) return [];

    const classFilter = filter.classFromOptionId
      ? optionSelections[filter.classFromOptionId]
      : undefined;
    const classes = filter.classes ?? (classFilter ? [classFilter] : []);

    let spells = getStaticSpells(sources);
    if (filter.level !== undefined) {
      spells = spells.filter((spell) => spell.level === filter.level);
    }
    // Spell data stores class names capitalized ("Wizard") while option values are
    // lowercase keys, so compare case-insensitively.
    if (classes.length > 0) {
      const classSet = new Set(classes.map((cls) => cls.toLowerCase()));
      spells = spells.filter((spell) =>
        spell.classes.some((cls) => classSet.has(cls.toLowerCase())),
      );
    }
    if (filter.ritualOnly) {
      spells = spells.filter((spell) => spell.ritual);
    }
    const takenByOtherGroups = new Set(
      Object.entries(optionSelections)
        .filter(([optionId]) => optionId !== spellTarget.optionId)
        .map(([, value]) => value),
    );
    spells = spells.filter((spell) => !takenByOtherGroups.has(spell.name));

    if (!spellSearch.trim()) return spells;
    const q = spellSearch.toLowerCase();
    return spells.filter((spell) => spell.name.toLowerCase().includes(q));
  }, [spellTarget, optionSelections, sources, spellSearch]);

  const handleSelectFeat = useCallback((feat: SRDFeat) => {
    setPendingSelection((prev) => {
      if (prev !== feat.name) setOptionSelections({});
      return feat.name;
    });
  }, []);

  const handleFeatOptionChange = useCallback((optionId: string, value: string) => {
    setOptionSelections((prev) => ({ ...prev, [optionId]: value }));
  }, []);

  const openFeatInfo = useCallback((feat: SRDFeat) => {
    setInfoFeat(feat);
    setStep("info");
  }, []);

  const openSpellModal = useCallback((groupId: string, group: FeatOptionGroup) => {
    setSpellTarget({ optionId: groupId, group });
    setSpellSearch("");
    setStep("spell");
  }, []);

  const handleBack = useCallback(() => {
    setStep("list");
    setInfoFeat(null);
    setSpellTarget(null);
    setSpellSearch("");
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingFeat || !isReadyToConfirm) return;
    const hasOptions = optionGroups.length > 0;
    onSelect(pendingFeat, hasOptions ? optionSelections : undefined);
    onClose();
  }, [pendingFeat, isReadyToConfirm, optionGroups.length, optionSelections, onSelect, onClose]);

  const modalTitle =
    step === "info" && infoFeat
      ? infoFeat.name
      : step === "spell"
        ? t("feat.selectSpell", "Pilih Mantra")
        : t("feat.selectOne", "Pilih Fitur");

  const stickyFooter = (
    <div className="sticky bottom-0 flex gap-2 border-t border-border-strong bg-surface px-4 py-3">
      <button
        type="button"
        onClick={step === "list" ? onClose : handleBack}
        className="flex-1 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-paper-muted"
      >
        {step === "list" ? t("common.cancel", "Batal") : t("common.back", "Kembali")}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!isReadyToConfirm || step !== "list"}
        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
          isReadyToConfirm && step === "list"
            ? "bg-ink text-surface active:translate-y-0.5"
            : "cursor-not-allowed bg-paper-muted text-ink-subtle"
        }`}
      >
        {step === "list"
          ? isReadyToConfirm
            ? t("feat.selectThisFeat", "Pilih Fitur Ini")
            : t("feat.completeOptions", "Lengkapi Pilihan")
          : t("common.back", "Kembali")}
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      footer={stickyFooter}
      showHeader={false}
    >
      {step === "info" && infoFeat ? (
        <div className={SCROLL_CLASS}>
          <FeatInfo feat={infoFeat} />
        </div>
      ) : step === "spell" && spellTarget ? (
        <SpellPicker
          target={spellTarget}
          spells={spellChoices}
          search={spellSearch}
          onSearchChange={setSpellSearch}
          selectedValue={optionSelections[spellTarget.optionId]}
          needsClass={!!spellTarget.group.spell?.classFromOptionId && !optionSelections[spellTarget.group.spell.classFromOptionId]}
          onPick={(spellName) => {
            handleFeatOptionChange(spellTarget.optionId, spellName);
            handleBack();
          }}
        />
      ) : (
        <div className={SCROLL_CLASS}>
          <div className="relative mb-3">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlass className="h-4 w-4 text-ink-muted" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("feat.searchFeats", "Cari fitur...")}
              className="w-full rounded-lg border border-border-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
          </div>

          <div className="mb-3 space-y-2">
            <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setSourceFilter("ALL")}
                className={pillClass(sourceFilter === "ALL")}
              >
                {t("common.all", "Semua Sumber")}
              </button>
              {availableSources.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={pillClass(sourceFilter === src)}
                >
                  {src}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPrereqFilter("all")}
                className={pillClass(prereqFilter === "all")}
              >
                {t("feat.allFeats", "Semua Fitur")}
              </button>
              <button
                type="button"
                onClick={() => setPrereqFilter("with")}
                className={pillClass(prereqFilter === "with")}
              >
                {t("feat.withPrereq", "Berasyarat")}
              </button>
              <button
                type="button"
                onClick={() => setPrereqFilter("without")}
                className={pillClass(prereqFilter === "without")}
              >
                {t("feat.noPrereq", "Tanpa Syarat")}
              </button>
            </div>
          </div>

          {filteredFeats.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-muted">
              {t("feat.noFeatsFound", "Fitur tidak ditemukan.")}
            </p>
          )}

          <div className="space-y-3">
            {filteredFeats.map((feat) => {
              const isSelected = pendingSelection === feat.name;
              const isDisabled = disabledFeatNames.has(feat.name) || !meetsPrerequisites(character as Character, feat.name);
              const sourceLabel = feat.book || (typeof feat.source === "string" ? feat.source : (feat as any).source?.name);
              const groups = (feat.options ?? []).filter((group) => group.count > 0);

              const disabledGroup = isDisabled
                ? "cursor-not-allowed border-border-strong bg-surface opacity-50"
                : isSelected
                  ? "border-ink bg-ink/5 shadow-sm"
                  : "border-border-strong bg-surface hover:border-ink/30";

              return (
                <div
                  key={feat.name}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all ${disabledGroup}`}
                >
                  <div className="flex flex-row">
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) handleSelectFeat(feat);
                      }}
                      className="flex flex-1 items-start gap-3 p-4 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-ink">{feat.name}</h3>
                        {feat.prerequisites && (
                          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-warning-500">
                            {t("feat.prerequisiteLabel", "Syarat")}: {feat.prerequisites}
                          </span>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{feat.description}</p>
                        {sourceLabel && sourceLabel !== "PHB" && (
                          <span className="mt-1 inline-block rounded bg-paper-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            {sourceLabel}
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
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
                      onClick={() => openFeatInfo(feat)}
                      aria-label={t("feat.infoButton", { feat: feat.name }, "Info {feat}")}
                      className="flex w-14 shrink-0 items-center justify-center border-l-2 border-border-strong text-ink-muted transition hover:bg-ink/5 hover:text-ink active:scale-90"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  </div>

                  {isSelected && groups.length > 0 && (
                    <div className="mt-2 space-y-3 border-t-2 border-ink/20 bg-paper/50 p-4 pt-0">
                      <div className="mt-3 flex items-center gap-2">
                        <Warning className="h-4 w-4 text-ink" />
                        <span className="text-xs font-bold uppercase tracking-wider text-ink">
                          {t("feat.optionsRequired", "Pilihan Wajib")}
                        </span>
                        <span className="ml-auto text-[11px] font-bold text-ink-muted">
                          {optionGroups.length - missingOptionIds.length}/{optionGroups.length}
                        </span>
                      </div>

                      {groups.map((group) => {
                        const selectedValue = optionSelections[group.id];
                        const label = t(group.labelId, group.label);
                        const isValueTakenElsewhere = (value?: string) =>
                          !!value &&
                          Object.entries(optionSelections).some(
                            ([optionId, current]) => optionId !== group.id && current === value,
                          );

                        if (group.type === "spell") {
                          const spell = selectedValue ? { name: selectedValue } : null;
                          const needsClass =
                            !!group.spell?.classFromOptionId &&
                            !optionSelections[group.spell.classFromOptionId];

                          return (
                            <div key={group.id} className="flex flex-col gap-1.5">
                              <span className="pl-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                                {label}
                              </span>
                              <button
                                type="button"
                                disabled={needsClass}
                                onClick={() => {
                                  if (!needsClass) openSpellModal(group.id, group);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl border-2 p-2.5 text-sm transition-all active:scale-[0.98] ${
                                  needsClass
                                    ? "cursor-not-allowed border-border-strong bg-surface opacity-50"
                                    : "border-border-strong bg-surface hover:border-ink"
                                }`}
                              >
                                <span
                                  className={spell ? "font-semibold text-ink" : "text-ink-muted"}
                                >
                                  {needsClass
                                    ? t("feat.pickClassFirst", "Pilih kelas daftar mantra dulu")
                                    : spell
                                      ? spell.name
                                      : t("feat.chooseOption", { label }, "-- Pilih {label} --")}
                                </span>
                                <BookBookmark className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div key={group.id} className="flex flex-col gap-1.5">
                            <label
                              htmlFor={`feat-option-${group.id}`}
                              className="pl-1 text-[11px] font-bold uppercase tracking-wide text-ink"
                            >
                              {label}
                            </label>
                            <select
                              id={`feat-option-${group.id}`}
                              className="w-full cursor-pointer appearance-none rounded-xl border-2 border-border-strong bg-surface p-2.5 text-sm text-ink transition-colors focus:border-ink focus:outline-none"
                              value={selectedValue || ""}
                              onChange={(event) =>
                                handleFeatOptionChange(group.id, event.target.value)
                              }
                            >
                              <option value="" disabled>
                                {t("feat.chooseOption", { label }, "-- Pilih {label} --")}
                              </option>
                              {(group.choices ?? []).map((choice) => {
                                const taken = isValueTakenElsewhere(choice.value);
                                return (
                                  <option
                                    key={choice.value}
                                    value={choice.value}
                                    disabled={taken}
                                    className={taken ? "text-ink-subtle" : undefined}
                                  >
                                    {choice.label}
                                    {taken ? ` ${t("feat.alreadyChosen", "(Sudah Dipilih)")}` : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function FeatInfo({ feat }: { feat: SRDFeat }) {
  const { t } = useLanguage();
  const engineFlavor = getEngineFeatFlavor(feat.name);
  const flavorText = engineFlavor.flavorId ? t(engineFlavor.flavorId, engineFlavor.flavor) : engineFlavor.flavor;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{feat.name}</h3>
        {feat.prerequisites && (
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-warning-500">
            {t("feat.prerequisiteLabel", "Syarat")}: {feat.prerequisites}
          </span>
        )}
      </div>

      {flavorText && (
        <p className="text-xs italic leading-relaxed text-ink-muted">{flavorText}</p>
      )}

      <p className="whitespace-pre-line text-xs leading-relaxed text-ink-muted">{feat.description}</p>

      {feat.summary && (
        <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("feat.summary", "Ringkasan")}
          </span>
          <p className="mt-1 text-xs leading-relaxed text-ink">{feat.summary}</p>
        </div>
      )}
    </div>
  );
}

interface SpellPickerProps {
  target: { optionId: string; group: FeatOptionGroup };
  spells: { name: string; level: number; school: string }[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedValue?: string;
  needsClass: boolean;
  onPick: (spellName: string) => void;
}

function SpellPicker({
  target,
  spells,
  search,
  onSearchChange,
  selectedValue,
  needsClass,
  onPick,
}: SpellPickerProps) {
  const { t } = useLanguage();

  return (
    <div className={SCROLL_CLASS}>
      <div className="relative mb-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlass className="h-4 w-4 text-ink-muted" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("feat.searchSpells", "Cari mantra...")}
          className="w-full rounded-lg border border-border-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
      </div>

      {needsClass && (
        <p className="mb-3 rounded-xl border-2 border-warning-500/40 bg-warning-500/10 p-3 text-xs font-bold text-ink">
          {t("feat.pickClassFirst", "Pilih kelas daftar mantra dulu")}
        </p>
      )}

      {spells.length === 0 && !needsClass && (
        <p className="py-6 text-center text-sm text-ink-muted">
          {t("feat.noSpellsFound", "Mantra tidak ditemukan.")}
        </p>
      )}

      <div className="space-y-2">
        {spells.map((spell) => {
          const isSelected = selectedValue === spell.name;
          return (
            <button
              key={spell.name}
              type="button"
              onClick={() => onPick(spell.name)}
              aria-label={t("feat.selectSpellOption", { spell: spell.name }, "Pilih {spell}")}
              className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
                isSelected ? "border-ink bg-ink/10" : "border-transparent bg-surface hover:border-ink/30"
              }`}
            >
              <div className="min-w-0">
                <h4 className="font-bold text-ink">{spell.name}</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {spell.school} · {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
                </span>
              </div>

              <div
                className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? "border-ink bg-ink text-surface" : "border-ink-subtle bg-transparent"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
