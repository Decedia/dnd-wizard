"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, House, Crown, MagnifyingGlass } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { WeaponPickerList, type PickerEntry, type PickerGroup } from "@/components/modals/WeaponPicker";
import { InfoBadge, InfoCard, InfoChip, InfoProse, InfoSectionLabel, InfoStatTile } from "@/components/modals/InfoBits";
import { backgroundsData, getBackgroundData, type BackgroundData } from "@/data/backgrounds";
import { useLanguage } from "@/contexts/LanguageContext";
import { findLocalizedItem } from "@/data/item-catalog";
import { backgroundGearLabel } from "@/lib/inventory";
import { getBackground2024, gearPackages } from "@/lib/origin-2024";
import { getStaticBackgrounds2024, type SRDBackground2024 } from "@/lib/srd-client";

type TFn = ReturnType<typeof useLanguage>["t"];

/** Display groups for the background list, like race groups. Unlisted backgrounds fall into "other". */
const BACKGROUND_GROUPS: { key: string; icon: React.ReactNode; members: string[] }[] = [
  { key: "faith", icon: <BookOpen size={20} weight="bold" />, members: ["Acolyte", "Hermit", "Sage"] },
  { key: "folk", icon: <House size={20} weight="bold" />, members: ["Folk Hero", "Guild Artisan", "Outlander", "Sailor", "Soldier"] },
  { key: "status", icon: <Crown size={20} weight="bold" />, members: ["Noble", "Criminal", "Charlatan", "Urchin", "Entertainer"] },
];

export function backgroundStatLine(bg: BackgroundData, t: TFn): string {
  const parts = [bg.skillProficiencies.join(", ")];
  if (bg.languages > 0) parts.push(t("background.plusLanguages", { count: bg.languages }, "+{count} bahasa"));
  return parts.join(" • ");
}

export function buildBackgroundGroups(t: TFn): PickerGroup[] {
  const toEntry = (bg: BackgroundData): PickerEntry => ({
    name: bg.name,
    source: "PHB",
    description: bg.feature.name,
    stats: backgroundStatLine(bg, t),
  });
  const grouped = new Set(BACKGROUND_GROUPS.flatMap((g) => g.members));
  const groups: PickerGroup[] = BACKGROUND_GROUPS.map((g) => ({
    key: g.key,
    label: t(`background.group.${g.key}`, g.key),
    flavor: t(`background.groupFlavor.${g.key}`, ""),
    icon: g.icon,
    entries: g.members
      .map((name) => backgroundsData.find((bg) => bg.name === name))
      .filter((bg): bg is BackgroundData => !!bg)
      .map(toEntry),
  }));
  const others = backgroundsData.filter((bg) => !grouped.has(bg.name));
  if (others.length > 0) {
    groups.push({
      key: "other",
      label: t("background.group.other", "Lainnya"),
      flavor: "",
      icon: <BookOpen size={20} weight="bold" />,
      entries: others.map(toEntry),
    });
  }
  return groups.filter((g) => g.entries.length > 0);
}

/** "+2/+1 to STR, DEX or CON · Savage Attacker" */
export function background2024StatLine(bg: SRDBackground2024, t: TFn): string {
  const abilities = bg.abilityScores.map((a) => a.toUpperCase()).join(", ");
  return `${t("background.asiLine", { abilities }, "+2/+1 among {abilities}")} • ${bg.feat}`;
}

/** The four 2024 backgrounds, in one group. */
function buildBackground2024Groups(t: TFn): PickerGroup[] {
  return [{
    key: "2024",
    label: t("background.group.2024", "Backgrounds"),
    flavor: t("background.groupFlavor.2024", "Your background gives your ability increases, a starting feat, two skills and a tool."),
    icon: <BookOpen size={20} weight="bold" />,
    entries: getStaticBackgrounds2024().map((bg) => ({
      name: bg.name,
      source: "PHB",
      description: background2024StatLine(bg, t),
      stats: bg.skills.join(", "),
    })),
  }];
}

function Background2024InfoPanel({ bg, t }: { bg: SRDBackground2024; t: TFn }) {
  const { language } = useLanguage();
  const gear = gearPackages("background", bg.name);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{bg.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <InfoBadge>2024</InfoBadge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoStatTile label={t("background.abilities", "Ability increases")} value={bg.abilityScores.map((a) => a.toUpperCase()).join(", ")} />
        <InfoStatTile label={t("background.originFeat", "Starting feat")} value={bg.feat} />
        <InfoStatTile label={t("background.skills", "Skill")} value={bg.skills.join(", ")} />
        <InfoStatTile
          label={t("background.tools", "Alat")}
          value={bg.tools.join(", ") || (bg.toolChoice ? t("background.gamingSetPick", "One gaming set of your choice") : "")}
          emptyText={t("background.none", "Tidak ada")}
        />
      </div>
      <InfoCard label={t("background.asiHow", "How the increase works")}>
        <InfoProse text={t("background.asiHowText", "Add +2 to one of these three abilities and +1 to another, or +1 to all three. You place them on the Ability Scores step.")} />
      </InfoCard>
      {gear.length > 0 && (
        <div>
          <InfoSectionLabel>{t("background.equipment", "Perlengkapan")}</InfoSectionLabel>
          <div className="mt-1.5 space-y-1.5">
            {gear.map((pkg) => (
              <div key={pkg.letter} className="flex flex-wrap gap-1.5">
                <InfoChip>{pkg.letter}</InfoChip>
                {pkg.items.map((line, i) => (
                  <InfoChip key={i}>{backgroundGearLabel(line, (id) => findLocalizedItem(id, language)?.name ?? id)}</InfoChip>
                ))}
                {pkg.gold > 0 && <InfoChip>{pkg.gold} GP</InfoChip>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BackgroundInfoPanel({ bg, t }: { bg: BackgroundData; t: TFn }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{bg.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <InfoBadge>PHB</InfoBadge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoStatTile label={t("background.skills", "Skill")} value={bg.skillProficiencies.join(", ")} />
        <InfoStatTile
          label={t("background.tools", "Alat")}
          value={bg.toolProficiencies.join(", ")}
          emptyText={t("background.none", "Tidak ada")}
        />
        <InfoStatTile
          label={t("background.languages", "Bahasa")}
          value={bg.languages > 0 ? `+${bg.languages}` : ""}
          emptyText={t("background.none", "Tidak ada")}
        />
      </div>

      <InfoCard label={t("background.feature", "Fitur")}>
        <h4 className="text-sm font-bold text-ink">{bg.feature.name}</h4>
        <InfoProse text={bg.feature.description} className="mt-1" />
      </InfoCard>

      {bg.equipment.length > 0 && (
        <div>
          <InfoSectionLabel>{t("background.equipment", "Perlengkapan")}</InfoSectionLabel>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {bg.equipment.map((line, i) => (
              <InfoChip key={i}>{backgroundGearLabel(line, (id) => findLocalizedItem(id, language)?.name ?? id)}</InfoChip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface BackgroundSelectionModalProps {
  isOpen: boolean;
  current: string;
  onClose: () => void;
  onConfirm: (background: string) => void;
  /** "2024" lists the 2024 backgrounds (ability increases and an Origin feat). */
  ruleset?: string;
}

export function BackgroundSelectionModal({ isOpen, current, onClose, onConfirm, ruleset }: BackgroundSelectionModalProps) {
  const { t } = useLanguage();
  const is2024 = ruleset === "2024";
  const [picked, setPicked] = useState(current);
  const [search, setSearch] = useState("");
  const [infoName, setInfoName] = useState<string | null>(null);

  const groups = useMemo(() => (is2024 ? buildBackground2024Groups(t) : buildBackgroundGroups(t)), [t, is2024]);
  // The modal mounts fresh on each open, so the current background's group starts open.
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const key = groups.find((g) => g.entries.some((e) => e.name === current))?.key;
    return key ? [key] : [];
  });

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.name.toLowerCase().includes(q)) }))
      .filter((g) => g.entries.length > 0);
  }, [groups, search]);

  const infoBg = infoName ? (is2024 ? getBackground2024(infoName) : getBackgroundData(infoName)) : undefined;
  const pickedBg = is2024 ? getBackground2024(picked) : getBackgroundData(picked);
  const pickedSkills = pickedBg ? ("skills" in pickedBg ? pickedBg.skills : pickedBg.skillProficiencies) : [];

  const footer = (
    <div className="flex flex-wrap gap-2 bg-[var(--color-surface)] px-4 py-3">
      {!infoBg && pickedBg && (
        <p className="w-full text-xs font-semibold text-ink-muted">
          {t("background.grants", "Memberi")}: <span className="text-ink">{pickedSkills.join(", ")}</span>
        </p>
      )}
      <button
        type="button"
        onClick={() => (infoBg ? setInfoName(null) : onClose())}
        className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
      >
        {infoBg ? t("common.back", "Kembali") : t("common.cancel", "Batal")}
      </button>
      <button
        type="button"
        disabled={!infoBg && !picked}
        onClick={() => {
          if (infoBg) {
            setPicked(infoBg.name);
            setInfoName(null);
            return;
          }
          onConfirm(picked);
          onClose();
        }}
        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
          !infoBg && !picked
            ? "cursor-not-allowed bg-[var(--color-bg)] text-[var(--color-text-muted)]"
            : "bg-[var(--color-accent-indigo-600)] text-white hover:bg-[var(--color-accent-indigo-700)]"
        }`}
      >
        {infoBg ? t("weaponPicker.selectThis", "Pilih Ini") : t("common.confirmSelection", "Konfirmasi pilihan")}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("background.title", "Latar Belakang")} footer={footer} showHeader={false}>
      {!infoBg && (
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
              aria-label={t("background.search", "Cari latar belakang")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)]"
            />
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
        {infoBg ? (
          "abilityScores" in infoBg ? <Background2024InfoPanel bg={infoBg} t={t} /> : <BackgroundInfoPanel bg={infoBg} t={t} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            {t("background.noResults", "Tidak ada latar belakang yang cocok dengan pencarianmu.")}
          </p>
        ) : (
          <WeaponPickerList
            groups={filtered}
            openGroups={openGroups}
            forceOpen={is2024 || search.trim().length > 0}
            selections={picked ? [picked] : []}
            onToggleGroup={(key, open) =>
              setOpenGroups((prev) =>
                open ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((k) => k !== key),
              )
            }
            onPick={(entry) => setPicked(entry.name)}
            onInfo={(entry) => setInfoName(entry.name)}
            t={t}
          />
        )}
      </div>
    </BottomSheet>
  );
}
