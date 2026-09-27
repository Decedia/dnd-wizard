"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticSpells } from "@/lib/srd-client";
import { AppHeader } from "@/components/AppHeader";

export default function GlossaryPage() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");

  const spells = useMemo(() => getStaticSpells([], undefined, language), [language]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spells;
    return spells.filter((s) => {
      const haystack = [s.name, s.school, s.level, s.classes?.join(" "), s.description].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [spells, query]);

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("nav.glossary")} />

      <main className="px-4 py-4 pb-36">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            {t("glossary.searchLabel", "Search spells, classes, schools...")}
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("glossary.searchPlaceholder", "Type to search...")}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
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
    </div>
  );
}
