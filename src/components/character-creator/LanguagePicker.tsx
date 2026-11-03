"use client";

import { useCallback } from "react";
import { Translate } from "@phosphor-icons/react";
import { getBackgroundData } from "@/data/backgrounds";
import { languages as languageList } from "@/data/srd";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultLanguages = ["Common"];

function getRaceLanguages(race: string): string[] {
  const raceLanguageMap: Record<string, string[]> = {
    "Dwarf": ["Common", "Dwarvish"],
    "Elf": ["Common", "Elvish"],
    "Halfling": ["Common", "Halfling"],
    "Human": ["Common"],
    "Dragonborn": ["Common", "Draconic"],
    "Gnome": ["Common", "Gnomish"],
    "Half-Elf": ["Common", "Elvish"],
    "Half-Orc": ["Common", "Orc"],
    "Tiefling": ["Common", "Infernal"],
  };
  return raceLanguageMap[race] || ["Common"];
}

function getRaceBonusLanguages(race: string): number {
  const bonusMap: Record<string, number> = {
    "Human": 1,
    "Half-Elf": 1,
    "Half-Orc": 0,
  };
  return bonusMap[race] || 0;
}

/** Race + background language picks. Rules moved unchanged from the Personality step. */
export function LanguagePicker({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();

  const raceLanguages = getRaceLanguages(data.race);
  const raceBonusLanguages = getRaceBonusLanguages(data.race);
  const backgroundLanguageCount = getBackgroundData(data.background)?.languages || 0;
  const totalBonusLanguages = raceBonusLanguages + backgroundLanguageCount;

  const handleLanguageToggle = useCallback((language: string) => {
    const currentLanguages = data.languages || [...defaultLanguages];
    if (raceLanguages.includes(language)) return;

    if (currentLanguages.includes(language)) {
      onChange({ languages: currentLanguages.filter(l => l !== language) });
    } else if (currentLanguages.length < raceLanguages.length + totalBonusLanguages) {
      onChange({ languages: [...currentLanguages, language] });
    }
  }, [data.languages, raceLanguages, totalBonusLanguages, onChange]);

  const availableLanguages = languageList.map(l => l.name).filter(l => !raceLanguages.includes(l));
  const current = data.languages?.length ? data.languages : defaultLanguages;
  const limit = raceLanguages.length + totalBonusLanguages;
  const canAddMoreLanguages = (data.languages?.length || defaultLanguages.length) < limit;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Translate size={14} weight="bold" className="text-ink" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t("form.languages", "Bahasa")}</h3>
        </div>
        <span className="text-[11px] font-bold text-ink-muted">
          {data.languages?.length || defaultLanguages.length}/{limit}
        </span>
      </div>
      <div className="space-y-3 rounded-2xl border-2 border-border-strong bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {raceLanguages.map((lang) => (
            <span key={lang} className="inline-flex items-center rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-surface">
              {lang}
            </span>
          ))}
          {current.filter(l => !raceLanguages.includes(l)).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageToggle(lang)}
              aria-label={t("origin.removeLanguage", { language: lang }, "Hapus {language}")}
              className="inline-flex items-center gap-1 rounded-lg border-2 border-border-strong bg-paper-muted px-2.5 py-1 text-xs font-bold text-ink transition-colors hover:border-ink"
            >
              {lang} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
        {canAddMoreLanguages && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) handleLanguageToggle(e.target.value);
            }}
            aria-label={t("creator.addLanguage", "Tambah bahasa...")}
            className="h-11 w-full rounded-xl border-2 border-border-strong bg-surface px-3 text-sm font-semibold text-ink"
          >
            <option value="">{t("creator.addLanguage", "Tambah bahasa...")}</option>
            {availableLanguages
              .filter(l => !current.includes(l))
              .map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
          </select>
        )}
        {totalBonusLanguages > 0 && (
          <p className="text-[11px] leading-relaxed text-ink-muted">
            {t("origin.languageHint", { count: totalBonusLanguages }, "Ras dan latar belakangmu memberi {count} bahasa tambahan pilihanmu.")}
          </p>
        )}
      </div>
    </section>
  );
}
