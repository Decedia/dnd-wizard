"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import { RichText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSpellSchoolStyle } from "@/lib/spell-schools";
import { GiOpenBook } from "react-icons/gi";

export interface PickerOption {
  /** The value saved when picked. */
  name: string;
  /** Shown instead of the name (a spell's name for a spell id). */
  label?: string;
  /** One short line under the name. */
  line?: string;
  /** Full text behind the Info button. */
  info?: string;
  /** Info that needs more than text (a subclass's feature cards). */
  infoNode?: ReactNode;
  /** Starred as a good pick for a new player. */
  recommended?: boolean;
  Icon: ComponentType<{ className?: string }>;
  badges?: string[];
  disabled?: boolean;
  /** Why it can't be picked, shown in Info. */
  reason?: string;
}

interface OptionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** One line under the title: what the pick does. */
  hint?: string;
  options: PickerOption[];
  /** How many to pick. One picks on tap; more than one confirms with a button. */
  count?: number;
  selected?: string[];
  onPick: (values: string[]) => void;
  /** Multi-pick where each group takes one (Spell Mastery: one 1st-level, one 2nd-level spell). */
  groupOf?: (name: string) => string;
}

/** Lists longer than this get a search box. */
const SEARCH_FROM = 10;

/**
 * The options pop-up for every level-up choice: the same card as the race and class
 * pickers (icon, name, one short line, Info for the full text) and the same buttons.
 */
export function OptionPicker({ isOpen, onClose, title, hint, options, count = 1, selected = [], onPick, groupOf }: OptionPickerProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [picks, setPicks] = useState<string[]>(() => (count > 1 ? selected.filter((s) => options.some((o) => o.name === s)) : []));
  const multi = count > 1;
  const need = Math.min(count, options.filter((o) => !o.disabled || picks.includes(o.name)).length);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label || o.name} ${o.line || ""}`.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (name: string) => {
    if (!multi) {
      onPick([name]);
      onClose();
      return;
    }
    if (picks.includes(name)) return setPicks(picks.filter((p) => p !== name));
    if (groupOf) return setPicks([...picks.filter((p) => groupOf(p) !== groupOf(name)), name]);
    if (picks.length < count) setPicks([...picks, name]);
  };

  const footer = multi ? (
    <div className="flex gap-2 px-4 py-3">
      <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
        {t("common.cancel", "Cancel")}
      </button>
      <button type="button" onClick={() => { onPick(picks); onClose(); }} disabled={picks.length !== need} className="btn btn-primary flex-1 disabled:opacity-40">
        {t("picker.confirm", { n: picks.length, total: need }, "Confirm ({n}/{total})")}
      </button>
    </div>
  ) : undefined;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="space-y-3 p-4">
        {hint && <RichText text={hint} className="text-xs text-[var(--color-text-secondary)]" />}
        {options.length > SEARCH_FROM && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlass className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("picker.search", "Search...")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-border-active)]"
            />
          </div>
        )}
        {shown.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">{t("picker.none", "Nothing matches your search.")}</p>}
        {shown.map((o) => {
          const isSelected = multi ? picks.includes(o.name) : selected.includes(o.name);
          const full = !isSelected && multi && !groupOf && picks.length >= count;
          const disabled = (!!o.disabled && !isSelected) || full;
          const info = o.info || o.line;
          return (
            <SplitSelectionCard
              key={o.name}
              title={o.label || o.name}
              subtitle={o.line}
              icon={<o.Icon className="h-6 w-6 text-[var(--color-text-primary)]" />}
              badges={o.badges}
              isRecommended={o.recommended}
              isSelected={isSelected}
              disabled={disabled}
              onSelect={() => !disabled && toggle(o.name)}
              infoType="modal"
              modalContent={
                <div className="space-y-2">
                  {o.infoNode}
                  {!o.infoNode && info && <RichText text={info} className="text-xs text-[var(--color-text-secondary)]" />}
                  {o.disabled && o.reason && <p className="text-[11px] font-semibold text-[var(--color-error-600)]">{o.reason}</p>}
                </div>
              }
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}

type SpellLike = { name: string; level?: number; school?: string; description?: string | string[]; effectSummary?: string };
type T = (key: string, values?: Record<string, string | number> | string, fallback?: string) => string;

/** A spell as a picker option: its school's icon, "Level 3 · Evocation", its short summary, the full text in Info. */
export function spellOption(spell: SpellLike, t: T, value = spell.name): PickerOption {
  const style = getSpellSchoolStyle(spell.school);
  const school = spell.school ? t(`spellSchool.${spell.school.toLowerCase()}`, style?.label || spell.school) : "";
  const level = spell.level ? t("picker.spellLevel", { n: spell.level }, "Level {n}") : t("picker.cantrip", "Cantrip");
  const info = Array.isArray(spell.description) ? spell.description.join("\n\n") : spell.description || "";
  return {
    name: value,
    label: spell.name,
    line: [[level, school].filter(Boolean).join(" · "), spell.effectSummary].filter(Boolean).join(". "),
    info,
    Icon: style?.icon || GiOpenBook,
  };
}
