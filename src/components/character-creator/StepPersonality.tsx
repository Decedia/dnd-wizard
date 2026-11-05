"use client";

import { useMemo, useState } from "react";
import { Info, Scales, MaskHappy, DiceFive, Plus, Check, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { InfoCallout } from "@/components/modals/InfoBits";
import { backgroundsData, alignmentOptions, getBackgroundData, type BackgroundData } from "@/data/backgrounds";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepPersonalityProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

type TraitKind = "personality" | "ideal" | "bond" | "flaw";
type TraitField = "personalityTrait1" | "ideal" | "bond" | "flaw";

const TRAITS: { kind: TraitKind; field: TraitField; list: (bg: BackgroundData) => string[]; labelKey: string; label: string; aboutKey: string; about: string }[] = [
  { kind: "personality", field: "personalityTrait1", list: (bg) => bg.personalityTraits, labelKey: "creator.personalityTrait", label: "Sifat Kepribadian", aboutKey: "personality.about.personality", about: "Kebiasaan, sikap, atau ciri kecil yang membuat karaktermu mudah dikenali di meja." },
  { kind: "ideal", field: "ideal", list: (bg) => bg.ideals, labelKey: "creator.ideal", label: "Ideal", aboutKey: "personality.about.ideal", about: "Prinsip yang paling dipegang karaktermu, hal yang mendorong pilihan besarnya." },
  { kind: "bond", field: "bond", list: (bg) => bg.bonds, labelKey: "creator.bond", label: "Ikatan", aboutKey: "personality.about.bond", about: "Orang, tempat, atau hal yang paling berarti bagi karaktermu dan mengikatnya ke dunia." },
  { kind: "flaw", field: "flaw", list: (bg) => bg.flaws, labelKey: "creator.flaw", label: "Kelemahan", aboutKey: "personality.about.flaw", about: "Sifat buruk, ketakutan, atau godaan yang bisa dipakai lawan atau DM untuk menyulitkanmu." },
];

/** Abbreviations for the 3x3 grid, in alignmentOptions order. */
const ALIGNMENT_CODES = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];

function pick<T>(list: T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

export function StepPersonality({ data, onChange }: StepPersonalityProps) {
  const { t } = useLanguage();
  const [openKind, setOpenKind] = useState<TraitKind | null>(null);
  const selectedBackground = getBackgroundData(data.background);
  const openTrait = TRAITS.find((tr) => tr.kind === openKind) ?? null;

  const rollAll = () => {
    const bg = selectedBackground ?? pick(backgroundsData);
    if (!bg) return;
    const patch: Partial<Character> = {};
    for (const tr of TRAITS) {
      const value = pick(tr.list(bg));
      if (value) patch[tr.field] = value;
    }
    onChange(patch);
  };

  return (
    <section className="w-full">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("look.kicker", "Konsep")}</p>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("personality.title", "Kepribadian")}</h1>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 rounded-2xl border border-ink/20 bg-ink/10 p-4">
          <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-ink" />
          <p className="text-xs leading-relaxed text-ink/80">
            {t("personality.conceptHint", "Pilih alignment dan sifat yang menggerakkan karaktermu. Bagian ini tidak mengubah stat.")}
          </p>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scales size={14} weight="bold" className="text-ink" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t("form.alignment", "Alignment")}</h3>
            </div>
            <span className="text-[11px] font-bold text-ink-muted">{data.alignment}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {alignmentOptions.map((alignment, idx) => {
              const isSelected = data.alignment === alignment;
              return (
                <button
                  key={alignment}
                  type="button"
                  onClick={() => onChange({ alignment })}
                  aria-pressed={isSelected}
                  aria-label={alignment}
                  className={`flex h-14 flex-col items-center justify-center rounded-xl border-2 transition-all active:scale-[0.98] ${
                    isSelected ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink"
                  }`}
                >
                  <span className="text-sm font-black">{ALIGNMENT_CODES[idx]}</span>
                  <span className={`text-[9px] font-semibold leading-tight ${isSelected ? "text-surface/80" : "text-ink-muted"}`}>
                    {alignment}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MaskHappy size={14} weight="bold" className="text-ink" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t("personality.traits", "Sifat")}</h3>
            </div>
            <button
              type="button"
              onClick={rollAll}
              className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-border-strong bg-surface px-3 text-xs font-bold text-ink transition active:scale-95"
            >
              <DiceFive size={14} weight="bold" />
              {t("personality.rollAll", "Acak Semua")}
            </button>
          </div>
          <div className="space-y-3">
            {TRAITS.map((tr) => {
              const value = data[tr.field];
              return (
                <SplitSelectionCard
                  key={tr.kind}
                  title={t(tr.labelKey, tr.label)}
                  subtitle={value || t("personality.chooseOrWrite", "Pilih atau tulis sendiri")}
                  icon={value ? <Check size={20} weight="bold" className="text-ink" /> : <Plus size={20} weight="bold" className="text-ink" />}
                  isSelected={!!value}
                  onSelect={() => setOpenKind(tr.kind)}
                  infoType="modal"
                  modalContent={<InfoCallout label={t(tr.labelKey, tr.label)}>{t(tr.aboutKey, tr.about)}</InfoCallout>}
                  clampSubtitle={false}
                />
              );
            })}
          </div>
        </section>
      </div>

      {openTrait && (
        <TraitPickerModal
          title={t(openTrait.labelKey, openTrait.label)}
          current={data[openTrait.field]}
          selectedBackground={selectedBackground}
          list={openTrait.list}
          onClose={() => setOpenKind(null)}
          onConfirm={(value) => {
            onChange({ [openTrait.field]: value } as Partial<Character>);
            setOpenKind(null);
          }}
        />
      )}
    </section>
  );
}

interface TraitPickerModalProps {
  title: string;
  current: string;
  selectedBackground?: BackgroundData;
  list: (bg: BackgroundData) => string[];
  onClose: () => void;
  onConfirm: (value: string) => void;
}

/**
 * Suggestions from every background, grouped like the race modal. The chosen
 * background's group is first and open, since concept-first players may not
 * have picked one yet.
 */
function TraitPickerModal({ title, current, selectedBackground, list, onClose, onConfirm }: TraitPickerModalProps) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(current);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(selectedBackground ? [selectedBackground.name] : []);

  const groups = useMemo(() => {
    const ordered = selectedBackground
      ? [selectedBackground, ...backgroundsData.filter((bg) => bg.name !== selectedBackground.name)]
      : backgroundsData;
    const q = search.trim().toLowerCase();
    return ordered
      .map((bg) => ({ name: bg.name, options: list(bg).filter((o) => !q || o.toLowerCase().includes(q)) }))
      .filter((g) => g.options.length > 0);
  }, [selectedBackground, list, search]);

  const searching = search.trim().length > 0;
  const isCustom = !!pending && !backgroundsData.some((bg) => list(bg).includes(pending));

  const footer = (
    <div className="flex gap-2 bg-[var(--color-surface)] px-4 py-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
      >
        {t("common.cancel", "Batal")}
      </button>
      <button
        type="button"
        disabled={!pending.trim()}
        onClick={() => onConfirm(pending.trim())}
        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
          pending.trim()
            ? "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)]"
            : "cursor-not-allowed bg-[var(--color-bg)] text-[var(--color-text-muted)]"
        }`}
      >
        {t("common.confirmSelection", "Konfirmasi pilihan")}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen onClose={onClose} title={title} footer={footer} showHeader={false}>
      <div className="sticky top-0 z-20 shrink-0 border-b border-border-strong bg-surface px-4 py-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("modal.searchPlaceholder")}
            aria-label={t("personality.searchSuggestions", "Cari saran")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
        <div className={`rounded-2xl border-2 p-3 ${isCustom ? "border-ink bg-ink/5" : "border-border-strong bg-surface"}`}>
          <label htmlFor="trait-custom" className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {t("personality.writeOwn", "Tulis sendiri")}
          </label>
          <textarea
            id="trait-custom"
            value={isCustom ? pending : ""}
            onChange={(e) => setPending(e.target.value)}
            rows={2}
            placeholder={t("personality.writeOwnPlaceholder", "Tulis dengan kata-katamu sendiri...")}
            className="mt-1.5 w-full rounded-xl border-2 border-border-strong bg-surface p-2.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-ink"
          />
        </div>

        {groups.map((group) => {
          const groupSelected = group.options.includes(pending);
          const isOwn = group.name === selectedBackground?.name;
          return (
            <details
              key={group.name}
              open={searching || openGroups.includes(group.name)}
              onToggle={(e) => {
                const open = e.currentTarget.open;
                setOpenGroups((prev) => (open ? (prev.includes(group.name) ? prev : [...prev, group.name]) : prev.filter((n) => n !== group.name)));
              }}
              className={`group overflow-hidden rounded-2xl border-2 shadow-sm [&::-webkit-details-marker]:hidden ${groupSelected ? "border-ink" : "border-border-strong"}`}
            >
              <summary className={`flex cursor-pointer select-none items-center justify-between p-4 outline-none transition-colors ${groupSelected ? "bg-ink/5" : "active:bg-ink/5"}`}>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink">{group.name}</h3>
                  {isOwn && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{t("personality.yourBackground", "Latar belakangmu")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {groupSelected && (
                    <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface shadow-sm">
                      {t("modal.selected", "Terpilih")}
                    </span>
                  )}
                  <div className="text-ink-muted transition-transform duration-300 group-open:rotate-90">
                    <CaretRight size={20} />
                  </div>
                </div>
              </summary>
              <div className="space-y-2 border-t-2 border-border-muted bg-paper/50 p-3">
                {group.options.map((option) => {
                  const isSelected = pending === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPending(option)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                        isSelected ? "border-ink bg-ink/10" : "border-transparent bg-surface hover:border-ink/30"
                      }`}
                    >
                      <span className="text-xs leading-relaxed text-ink">{option}</span>
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? "border-ink bg-ink text-surface" : "border-ink-subtle"
                        }`}
                      >
                        {isSelected && <Check size={12} weight="bold" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </BottomSheet>
  );
}
