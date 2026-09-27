"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticSpells, getStaticFeats } from "@/lib/srd-client";
import { AppHeader } from "@/components/AppHeader";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { ArrowsUpDownIcon as FilterIcon, XIcon as X } from "@/components/icons";

type Category = "spells" | "feats" | "conditions" | "rules";

const CATEGORIES: { key: Category; labelKey: string }[] = [
  { key: "spells", labelKey: "glossary.categorySpells" },
  { key: "feats", labelKey: "glossary.categoryFeats" },
  { key: "conditions", labelKey: "glossary.categoryConditions" },
  { key: "rules", labelKey: "glossary.categoryRules" },
];

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

const ACTIVE_PILL = "bg-indigo-600 text-white border-transparent";
const INACTIVE_PILL = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";

function pillClass(active: boolean) {
  return `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
    active ? ACTIVE_PILL : INACTIVE_PILL
  }`;
}

function deduplicateSpells(spells: any[]): any[] {
  const map = new Map<string, any>();
  for (const spell of spells) {
    const key = spell.name.trim();
    const existing = map.get(key);
    if (existing) {
      const combinedClasses = Array.from(new Set([...(existing.classes || []), ...(spell.classes || [])]));
      map.set(key, { ...existing, classes: combinedClasses });
    } else {
      map.set(key, { ...spell });
    }
  }
  return Array.from(map.values());
}

function getSummary(spell: any): string {
  const raw = spell.effectSummary || spell.summary || "";
  if (raw) return raw;
  const desc = Array.isArray(spell.description) ? spell.description.join(" ") : spell.description || "";
  return desc.slice(0, 180);
}

function getFullDescription(spell: any): string {
  if (spell.fullDescription) return spell.fullDescription;
  const desc = Array.isArray(spell.description) ? spell.description.join("\n") : spell.description || "";
  return desc;
}

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  Conjuration: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
  Divination: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  Enchantment: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30",
  Evocation: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
  Illusion: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
  Necromancy: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
  Transmutation: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
};

export default function GlossaryPage() {
  const { t, language } = useLanguage();
  const [category, setCategory] = useState<Category>("spells");
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ levels: [] as number[], schools: [] as string[], classes: [] as string[] });
  const [selectedSpell, setSelectedSpell] = useState<any | null>(null);

  const rawSpells = useMemo(() => getStaticSpells([], undefined, language), [language]);
  const spells = useMemo(() => deduplicateSpells(rawSpells), [rawSpells]);

  const feats = useMemo(() => getStaticFeats([], undefined, language), [language]);

  const list = useMemo(() => {
    if (category === "feats") return feats;
    if (category === "conditions" || category === "rules") return [];
    return spells;
  }, [category, spells, feats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = list;

    if (q) {
      result = result.filter((item: any) => {
        const haystack = [item.name, item.school, item.level, item.classes?.join(" "), item.description, item.summary, item.effectSummary]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (category === "spells") {
      if (filters.levels.length > 0) {
        result = result.filter((s: any) => filters.levels.includes(s.level));
      }
      if (filters.schools.length > 0) {
        result = result.filter((s: any) => filters.schools.includes(s.school || ""));
      }
      if (filters.classes.length > 0) {
        result = result.filter((s: any) => (s.classes || []).some((c: string) => filters.classes.includes(c)));
      }
    }

    return result;
  }, [list, query, filters, category]);

  const toggleFilter = (type: "levels" | "schools" | "classes", value: number | string) => {
    setFilters((prev) => {
      const list = prev[type];
      const next = list.includes(value as never) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [type]: next };
    });
  };

  const resetFilters = () => setFilters({ levels: [], schools: [], classes: [] });

  const activeFilterCount = filters.levels.length + filters.schools.length + filters.classes.length;

  const showFilters = category === "spells";

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("nav.glossary")} />

      <main className="px-4 py-4 pb-36">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t("glossary.searchLabel", "Search spells, classes, schools...")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("glossary.searchPlaceholder", "Type to search...")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-20 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {showFilters && (
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                <FilterIcon className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 -mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => { setCategory(cat.key); setQuery(""); resetFilters(); }}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  category === cat.key
                    ? "bg-indigo-600 text-white border-transparent"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {t(cat.labelKey, cat.key.charAt(0).toUpperCase() + cat.key.slice(1))}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((item: any, idx: number) => {
            const isSpell = category === "spells";
            const name = item.name;
            const summary = isSpell ? getSummary(item) : (item.summary || item.description || "").slice(0, 180);
            const level = isSpell ? item.level : undefined;
            const school = isSpell ? item.school : undefined;
            const classes = isSpell ? item.classes : [];

            return (
              <button
                key={`${name}-${level ?? "feat"}-${idx}`}
                type="button"
                onClick={() => isSpell && setSelectedSpell(item)}
                disabled={!isSpell}
                className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left transition-all ${
                  isSpell ? "active:scale-[0.98] hover:border-slate-300 dark:hover:border-slate-600" : "opacity-80 cursor-default"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{name}</h3>
                  <div className="flex shrink-0 gap-1.5">
                    {level !== undefined && (
                      <span className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                        {t("glossary.level", "Level")} {level}
                      </span>
                    )}
                    {school && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SCHOOL_COLORS[school] || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"}`}>
                        {school}
                      </span>
                    )}
                  </div>
                </div>

                {classes.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{classes.join(", ")}</p>
                )}

                {summary && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{summary}</p>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("glossary.noResults", "No results found.")}
            </div>
          )}
        </div>
      </main>

      {showFilters && (
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
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
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
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
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
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
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
      )}

      {selectedSpell && (
        <BottomSheet
          isOpen={!!selectedSpell}
          onClose={() => setSelectedSpell(null)}
          title={selectedSpell.name}
          showHeader={true}
        >
          <div className="px-4 py-4 space-y-3">
            {selectedSpell.effectSummary && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">{selectedSpell.effectSummary}</p>
            )}
            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {getFullDescription(selectedSpell)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                {t("glossary.level", "Level")} {selectedSpell.level}
              </span>
              {selectedSpell.school && (
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${SCHOOL_COLORS[selectedSpell.school] || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"}`}>
                  {selectedSpell.school}
                </span>
              )}
            </div>
            {(selectedSpell.classes || []).length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{(selectedSpell.classes || []).join(", ")}</p>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
