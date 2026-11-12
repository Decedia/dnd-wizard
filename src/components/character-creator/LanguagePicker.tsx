"use client";

import { Translate } from "@phosphor-icons/react";
import { backgroundLanguageCount } from "@/lib/origin-2024";
import { getStaticRace } from "@/lib/srd-client";
import { languages as languageList } from "@/data/srd";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";

// The race's fixed languages and how many more it lets the player choose, both
// from the race data so subraces (Hill Dwarf, Wood Elf) are covered.
function getRaceLanguages(race: string, ruleset?: string): string[] {
  return getStaticRace(race, ruleset)?.languages?.filter((l) => l !== "any") || ["Common"];
}

function getRaceBonusLanguages(race: string, ruleset?: string): number {
  return getStaticRace(race, ruleset)?.extraLanguages || 0;
}

/** Race + background language picks. Rules moved unchanged from the Personality step. */
export function LanguagePicker({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();

  const raceLanguages = getRaceLanguages(data.race, data.ruleset);
  const raceBonusLanguages = getRaceBonusLanguages(data.race, data.ruleset);
  const backgroundLanguages = backgroundLanguageCount(data);
  const totalBonusLanguages = raceBonusLanguages + backgroundLanguages;
  // Languages a class or subclass pick gives (Blessings of Knowledge, Draconic
  // Gift) show as fixed, don't use up a race or background pick, and aren't
  // offered again.
  const allLanguages = new Set(languageList.map((l) => l.name));
  const fromFeatures = [...new Set(
    Object.values(data.featureSelections || {})
      .flat()
      .flatMap((v) => String(v).split(", "))
      .filter((v) => allLanguages.has(v) && !raceLanguages.includes(v))
  )];
  const fixed = [...raceLanguages, ...fromFeatures];

  const handleLanguageToggle = (language: string) => {
    if (fixed.includes(language)) return;
    // Store the player's own picks (plus feature languages); the race's are added at finalize.
    const picks = (data.languages || []).filter(l => !fixed.includes(l));

    if (picks.includes(language)) {
      onChange({ languages: [...fromFeatures, ...picks.filter(l => l !== language)] });
    } else if (picks.length < totalBonusLanguages) {
      onChange({ languages: [...fromFeatures, ...picks, language] });
    }
  };

  const availableLanguages = languageList.map(l => l.name).filter(l => !fixed.includes(l));
  const picks = (data.languages || []).filter(l => !fixed.includes(l));
  const current = [...fixed, ...picks];
  const limit = fixed.length + totalBonusLanguages;
  const canAddMoreLanguages = picks.length < totalBonusLanguages;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Translate size={14} weight="bold" className="text-ink" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t("form.languages", "Bahasa")}</h3>
        </div>
        <span className="text-[11px] font-bold text-ink-muted">
          {current.length}/{limit}
        </span>
      </div>
      <div className="space-y-3 rounded-2xl border-2 border-border-strong bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {fixed.map((lang) => (
            <span key={lang} className="inline-flex items-center rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-surface">
              {lang}
            </span>
          ))}
          {picks.map((lang) => (
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
