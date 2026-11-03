"use client";

import type { ReactNode } from "react";
import {
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  InfoIcon as Info,
  SwordIcon as Sword,
  DaggerIcon as Dagger,
  BowArrowIcon as BowArrow,
  CrossbowIcon as Crossbow,
  PackageIcon as PackageBox,
} from "@/components/icons";
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
import type { SRDWeapon } from "@/lib/srd-client";
import type { useLanguage } from "@/contexts/LanguageContext";

type TFn = ReturnType<typeof useLanguage>["t"];

/** One pickable row: a weapon, or a non-weapon pick such as an instrument. */
export interface PickerEntry {
  name: string;
  source: string;
  description: string;
  weapon?: SRDWeapon;
}

export interface PickerGroup {
  key: string;
  label: string;
  flavor: string;
  icon: ReactNode;
  entries: PickerEntry[];
}

export const WEAPON_GROUP_ORDER = ["simple_melee", "simple_ranged", "martial_melee", "martial_ranged"] as const;
type WeaponGroupKey = (typeof WEAPON_GROUP_ORDER)[number];

const WEAPON_GROUP_ICONS: Record<WeaponGroupKey, ReactNode> = {
  simple_melee: <Dagger className="h-5 w-5" />,
  simple_ranged: <Crossbow className="h-5 w-5" />,
  martial_melee: <Sword className="h-5 w-5" />,
  martial_ranged: <BowArrow className="h-5 w-5" />,
};

export function weaponGroupKey(weapon: SRDWeapon): WeaponGroupKey {
  const tier = weapon.weapon_category === "Martial" ? "martial" : "simple";
  const range = weapon.category_range === "Ranged" ? "ranged" : "melee";
  return `${tier}_${range}` as WeaponGroupKey;
}

/** True when the weapon falls inside a starting-equipment weapon type such as "martial_melee". */
export function weaponMatchesType(weapon: SRDWeapon, weaponType?: string): boolean {
  if (!weaponType) return false;
  const key = weaponGroupKey(weapon);
  return key === weaponType || key.startsWith(`${weaponType}_`);
}

export function weaponGroupLabel(key: string, t: TFn): string {
  const labels: Record<string, string> = {
    simple_melee: t("weaponPicker.group.simple_melee", "Simple Melee"),
    simple_ranged: t("weaponPicker.group.simple_ranged", "Simple Ranged"),
    martial_melee: t("weaponPicker.group.martial_melee", "Martial Melee"),
    martial_ranged: t("weaponPicker.group.martial_ranged", "Martial Ranged"),
  };
  return labels[key] ?? key;
}

export function buildWeaponGroups(weapons: SRDWeapon[], t: TFn): PickerGroup[] {
  return WEAPON_GROUP_ORDER.map((key) => ({
    key,
    label: weaponGroupLabel(key, t),
    flavor: t(`weaponPicker.groupFlavor.${key}`, ""),
    icon: WEAPON_GROUP_ICONS[key],
    entries: weapons
      .filter((w) => weaponGroupKey(w) === key)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((w) => ({ name: w.name, source: w.source || "PHB", description: w.description || "", weapon: w })),
  })).filter((g) => g.entries.length > 0);
}

export function buildItemGroup(key: string, label: string, entries: PickerEntry[]): PickerGroup {
  return { key, label, flavor: "", icon: <PackageBox className="h-5 w-5" />, entries };
}

function formatRange(weapon: SRDWeapon): string {
  const range = weapon.range ?? weapon.throw_range;
  if (!range?.normal) return "";
  return range.long ? `${range.normal}/${range.long} ft` : `${range.normal} ft`;
}

/** Short stat line for a row: "1d8 Slashing • Versatile". */
export function weaponStatLine(weapon: SRDWeapon): string {
  const parts: string[] = [];
  if (weapon.damage?.damage_dice) parts.push(`${weapon.damage.damage_dice} ${weapon.damage.damage_type?.name ?? ""}`.trim());
  const props = (weapon.properties ?? []).map((p) => p.name).filter((n) => n !== "Monk");
  if (props.length > 0) parts.push(props.join(", "));
  return parts.join(" • ");
}

function singular(word: string): string {
  return word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

/** "Crossbow, hand" and "Hand crossbows" both become "hand crossbow". */
function normalizeWeaponName(name: string): string {
  const lower = name.toLowerCase().trim();
  const [head, tail] = lower.split(/\s*,\s*/);
  const ordered = tail ? `${tail} ${head}` : head;
  return ordered.split(/\s+/).map(singular).join(" ");
}

/** Whether a class proficiency list ("simple", "martial", "Rapiers"...) covers the weapon. */
export function isWeaponProficient(weapon: SRDWeapon, proficiencies: string[]): boolean {
  const tier = weapon.weapon_category.toLowerCase();
  const target = normalizeWeaponName(weapon.name);
  return proficiencies.some((p) => {
    const lower = p.toLowerCase();
    return lower === tier || normalizeWeaponName(p) === target;
  });
}

interface WeaponPickerListProps {
  groups: PickerGroup[];
  openGroups: string[];
  forceOpen: boolean;
  selections: string[];
  onToggleGroup: (key: string, open: boolean) => void;
  onPick: (entry: PickerEntry, groupKey: string) => void;
  onInfo: (entry: PickerEntry) => void;
  t: TFn;
}

/** Collapsible groups with split select/info rows, same markup as the race modal groups. */
export function WeaponPickerList({
  groups,
  openGroups,
  forceOpen,
  selections,
  onToggleGroup,
  onPick,
  onInfo,
  t,
}: WeaponPickerListProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const groupCount = group.entries.reduce(
          (sum, e) => sum + selections.filter((s) => s === e.name).length,
          0,
        );
        const isGroupSelected = groupCount > 0;
        return (
          <details
            key={group.key}
            open={forceOpen || openGroups.includes(group.key)}
            onToggle={(e) => onToggleGroup(group.key, e.currentTarget.open)}
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
                  {group.flavor && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{group.flavor}</p>
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
              {group.entries.map((entry) => {
                const count = selections.filter((s) => s === entry.name).length;
                const isSelected = count > 0;
                const stats = entry.weapon ? weaponStatLine(entry.weapon) : "";
                return (
                  <div
                    key={entry.name}
                    className={`flex flex-row overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected ? "border-ink bg-ink/10" : "border-transparent bg-surface hover:border-ink/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onPick(entry, group.key)}
                      aria-label={t("weaponPicker.selectOption", { name: entry.name }, "Pilih {name}")}
                      className="flex flex-1 items-center justify-between p-3 text-left transition active:scale-[0.98]"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink">{entry.name}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {entry.source && (
                            <span className="rounded bg-paper-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                              {entry.source}
                            </span>
                          )}
                          {stats && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{stats}</span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                          isSelected ? "border-ink bg-ink text-surface" : "border-ink-subtle bg-transparent"
                        }`}
                      >
                        {count > 1 ? count : isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onInfo(entry)}
                      aria-label={t("weaponPicker.infoButton", { name: entry.name }, "Info {name}")}
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
  );
}

interface WeaponInfoPanelProps {
  entry: PickerEntry;
  proficiencies: string[] | null;
  t: TFn;
}

/** Info view for one pick, laid out like RaceInfoPanel. */
export function WeaponInfoPanel({ entry, proficiencies, t }: WeaponInfoPanelProps) {
  const weapon = entry.weapon;

  if (!weapon) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
          <h3 className="text-lg font-bold text-ink">{entry.name}</h3>
          {entry.source && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <InfoBadge>{entry.source}</InfoBadge>
            </div>
          )}
        </div>
        {entry.description && (
          <InfoCallout label={t("modal.whyPlay", "Kenapa Pilih Ini")}>{entry.description}</InfoCallout>
        )}
      </div>
    );
  }

  const groupLabel = weaponGroupLabel(weaponGroupKey(weapon), t);
  const damage = weapon.damage ? `${weapon.damage.damage_dice} ${weapon.damage.damage_type?.name ?? ""}`.trim() : "";
  const versatile = weapon.two_handed_damage
    ? `${weapon.two_handed_damage.damage_dice} ${weapon.two_handed_damage.damage_type?.name ?? ""}`.trim()
    : "";
  const range = formatRange(weapon);
  const properties = weapon.properties ?? [];
  const hasPropertyText = properties.some((p) => p.desc);
  const proficient = proficiencies ? isWeaponProficient(weapon, proficiencies) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{weapon.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <InfoBadge>{entry.source}</InfoBadge>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{groupLabel}</span>
        </div>
      </div>

      {entry.description && (
        <InfoCallout label={t("modal.whyPlay", "Kenapa Pilih Ini")}>{entry.description}</InfoCallout>
      )}

      <div className="grid grid-cols-2 gap-2">
        <InfoStatTile
          label={t("items.damage", "Kerusakan")}
          value={damage}
          emptyText={t("weaponPicker.noDamage", "Tidak ada")}
        />
        {versatile && <InfoStatTile label={t("weaponPicker.twoHanded", "Dua Tangan")} value={versatile} />}
        <InfoStatTile
          label={t("weaponPicker.range", "Jangkauan")}
          value={range || (properties.some((p) => p.index === "reach") ? "10 ft" : "5 ft")}
        />
        <InfoStatTile label={t("items.weight", "Berat")} value={weapon.weight ? `${weapon.weight} lb` : ""} />
        <InfoStatTile
          label={t("items.cost", "Harga")}
          value={weapon.cost ? `${weapon.cost.quantity} ${weapon.cost.unit}` : ""}
        />
        {proficient !== null && (
          <InfoStatTile
            label={t("weaponPicker.proficiency", "Kemahiran")}
            value={
              proficient
                ? t("weaponPicker.proficient", "Mahir")
                : t("weaponPicker.notProficient", "Tidak mahir")
            }
          />
        )}
      </div>

      {proficient === false && (
        <InfoCard label={t("weaponPicker.proficiency", "Kemahiran")}>
          <p className="text-xs leading-relaxed text-ink-muted">
            {t(
              "weaponPicker.notProficientHint",
              "Kelasmu tidak mahir dengan senjata ini, jadi bonus kemahiran tidak ditambahkan ke attack roll.",
            )}
          </p>
        </InfoCard>
      )}

      {properties.length > 0 && (
        <div>
          <InfoSectionLabel>{t("items.properties", "Sifat")}</InfoSectionLabel>
          {hasPropertyText ? (
            <InfoTraitList
              traits={properties.map((p) => ({ name: p.name, description: p.desc ?? "" }))}
              emptyText=""
            />
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {properties.map((p) => (
                <InfoChip key={p.index}>{p.name}</InfoChip>
              ))}
            </div>
          )}
        </div>
      )}

      {weapon.special && (
        <InfoCard label={t("weaponPicker.special", "Aturan Khusus")}>
          <InfoProse text={weapon.special} />
        </InfoCard>
      )}
    </div>
  );
}
