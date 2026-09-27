"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticSpells } from "@/lib/srd-client";
import { AppHeader } from "@/components/AppHeader";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { ArrowsUpDownIcon as FilterIcon, XIcon as X } from "@/components/icons";

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const SCHOOLS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
];

const CLASSES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const ACTIVE_PILL =
  "bg-indigo-600 text-white border-transparent";
const INACTIVE_PILL =
  "bg-slate-800 text-slate-300 border-slate-700";

function pillClass(active: boolean) {
  return `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
    active ? ACTIVE_PILL : INACTIVE_PILL
  }`;
}

export default function GlossaryPage() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ levels: [] as number[], schools: [] as string[], classes: [] as string[] });

  const spells = useMemo(() => getStaticSpells([], undefined, language), [language]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = spells;

    if (q) {
      result = result.filter((s) => {
        const haystack = [s.name, s.school, s.level, s.classes?.join(" "), s.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (filters.levels.length > 0) {
      result = result.filter((s) => filters.levels.includes(s.level));
    }
    if (filters.schools.length > 0) {
      result = result.filter((s) => filters.schools.includes(s.school || ""));
    }
    if (filters.classes.length > 0) {
      result = result.filter((s) => (s.classes || []).some((c: string) => filters.classes.includes(c)));
    }

    return result;
  }, [spells, query, filters]);

  const toggleFilter = (type: "levels" | "schools" | "classes", value: number | string) => {
    setFilters((prev) => {
      const list = prev[type];
      const next = list.includes(value as never) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [type]: next };
    });
  };

  const resetFilters = () => setFilters({ levels: [], schools: [], classes: [] });

  const activeFilterCount = filters.levels.length + filters.schools.length + filters.classes.length;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("nav.glossary")} />

      <main className="px-4 py-4 pb-36">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            {t("glossary.searchLabel", "Search spells, classes, schools...")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("glossary.searchPlaceholder", "Type to search...")}
              className="w-full rounded-lg border border-border bg-paper pl-3 pr-20 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1.5 text-xs font-semibold text-ink-muted"
            >
              <FilterIcon className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold text-ink-muted">{t("glossary.name", "Name")}</th>
                <th className="py-2 pr-3 font-semibold text-ink-muted">{t("glossary.level", "Level")}</th>
                <th className="py-2 pr-3 font-semibold text-ink-muted">{t("glossary.school", "School")}</th>
                <th className="py-2 font-semibold text-ink-muted">{t("glossary.classes", "Classes")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((spell, idx) => (
                <tr key={`${spell.name}-${spell.level}-${idx}`} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-medium text-ink">{spell.name}</td>
                  <td className="py-2 pr-3 text-ink-muted">{spell.level}</td>
                  <td className="py-2 pr-3 text-ink-muted">{spell.school || "-"}</td>
                  <td className="py-2 text-ink-muted">{(spell.classes || []).join(", ") || "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-ink-muted">
                    {t("glossary.noResults", "No results found.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("glossary.filters", "Filter Spells")}
        footer={
          <div className="flex gap-2 px-4 py-3">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 btn btn-secondary"
            >
              {t("glossary.resetFilters", "Reset")}
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 btn btn-primary"
            >
              {t("glossary.applyFilters", "Apply Filters")}
            </button>
          </div>
        }
      >
        <div className="px-4 py-3 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
              {t("glossary.filterLevel", "Level")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => toggleFilter("levels", lv)}
                  className={pillClass(filters.levels.includes(lv))}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
              {t("glossary.filterSchool", "School")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SCHOOLS.map((school) => (
                <button
                  key={school}
                  type="button"
                  onClick={() => toggleFilter("schools", school)}
                  className={pillClass(filters.schools.includes(school))}
                >
                  {school}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
              {t("glossary.filterClass", "Class")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleFilter("classes", cls)}
                  className={pillClass(filters.classes.includes(cls))}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
