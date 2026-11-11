"use client";

import { useCallback } from "react";
import { Info, User, Eye, Scroll, DiceFive } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { randomName } from "@/lib/random-name";

interface StepLookProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

// Gender is a label the player writes about their own character, so it is
// never required and always deselectable. English D&D terms stay English.
const GENDER_OPTIONS: { id: string; labelKey: string; fallback: string }[] = [
  { id: "female", labelKey: "origin.genderFemale", fallback: "Female" },
  { id: "male", labelKey: "origin.genderMale", fallback: "Male" },
  { id: "nonbinary", labelKey: "origin.genderNonBinary", fallback: "Non-binary" },
  { id: "other", labelKey: "origin.genderOther", fallback: "Other" },
];

type AppearanceField = "age" | "height" | "weight" | "eyes" | "hair" | "skin";

const APPEARANCE_FIELDS: { id: AppearanceField; labelKey: string; label: string; placeholderKey: string; placeholder: string }[] = [
  { id: "age", labelKey: "look.age", label: "Umur", placeholderKey: "look.agePlaceholder", placeholder: "mis. 112" },
  { id: "height", labelKey: "form.height", label: "Tinggi", placeholderKey: "form.e.g6ft2", placeholder: "mis. 6'2\"" },
  { id: "weight", labelKey: "form.weight", label: "Berat", placeholderKey: "form.e.g180lbs", placeholder: "mis. 180 lb" },
  { id: "eyes", labelKey: "form.eyes", label: "Mata", placeholderKey: "form.e.gBlue", placeholder: "mis. Biru" },
  { id: "hair", labelKey: "form.hair", label: "Rambut", placeholderKey: "form.e.gBrownCurly", placeholder: "mis. Cokelat, keriting" },
  { id: "skin", labelKey: "form.skin", label: "Kulit", placeholderKey: "form.e.gFairTanned", placeholder: "mis. Cerah" },
];

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border-2 border-border-strong bg-surface px-3 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-subtle outline-none transition-colors focus:border-ink";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-ink-muted";

function SectionHeader({ icon, children, aside }: { icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{children}</h3>
      </div>
      {aside}
    </div>
  );
}

export function StepLook({ data, onChange }: StepLookProps) {
  const { t } = useLanguage();

  const updateAppearance = (field: keyof Character["appearance"], value: string) => {
    onChange({ appearance: { ...data.appearance, [field]: value } });
  };

  // Moved from the Origin step. Falls back to human/fighter pools when race or
  // class is not chosen yet (concept-first order).
  const handleRandomName = useCallback(() => {
    onChange({ name: randomName(data.race, data.class) });
  }, [data.race, data.class, onChange]);

  const nameMissing = !data.name.trim();

  return (
    <section className="w-full">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("look.kicker", "Konsep")}</p>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("look.title", "Penampilan")}</h1>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 rounded-2xl border border-ink/20 bg-ink/10 p-4">
          <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-ink" />
          <p className="text-xs leading-relaxed text-ink/80">
            {t("look.hint", "Bayangkan karaktermu. Tidak ada isian di sini yang mengubah stat, jadi isi sebanyak atau sesedikit yang kamu mau.")}
          </p>
        </div>

        <section>
          <SectionHeader icon={<User size={14} weight="bold" className="text-ink" />}>{t("look.identity", "Identitas")}</SectionHeader>
          <div className="space-y-4 rounded-2xl border-2 border-border-strong bg-surface p-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="look-name" className={labelClass}>
                {t("origin.characterNameRequired", "Nama Karakter")}
              </label>
              <div className="flex gap-2">
                <input
                  id="look-name"
                  type="text"
                  value={data.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder={t("origin.enterCharacterName", "Masukkan nama...")}
                  aria-invalid={nameMissing}
                  className={`${inputClass} flex-1 text-base`}
                />
                <button
                  type="button"
                  onClick={handleRandomName}
                  aria-label={t("origin.randomName", "Nama Acak")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-border-strong bg-paper-muted text-ink transition active:scale-95"
                >
                  <DiceFive size={20} weight="bold" />
                </button>
              </div>
              {nameMissing && (
                <p className="text-[11px] font-semibold text-ink-muted">{t("form.enterCharacterName", "Masukkan nama karakter")}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className={labelClass}>{t("origin.genderLabel", "Jenis Kelamin")}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">{t("creator.optional", "Opsional")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = (data.gender || "") === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onChange({ gender: isSelected ? "" : option.id })}
                      aria-pressed={isSelected}
                      className={`h-11 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${
                        isSelected ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink"
                      }`}
                    >
                      {t(option.labelKey, option.fallback)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={<Eye size={14} weight="bold" className="text-ink" />}>{t("look.appearance", "Penampilan")}</SectionHeader>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border-2 border-border-strong bg-surface p-4">
            {APPEARANCE_FIELDS.map((field) => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label htmlFor={`look-${field.id}`} className={labelClass}>
                  {t(field.labelKey, field.label)}
                </label>
                <input
                  id={`look-${field.id}`}
                  type="text"
                  value={data.appearance?.[field.id] || ""}
                  onChange={(e) => updateAppearance(field.id, e.target.value)}
                  placeholder={t(field.placeholderKey, field.placeholder)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<Scroll size={14} weight="bold" className="text-ink" />}
            aside={<span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">{t("creator.optional", "Opsional")}</span>}
          >
            {t("look.story", "Cerita")}
          </SectionHeader>
          <div className="space-y-4 rounded-2xl border-2 border-border-strong bg-surface p-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="look-personality" className={labelClass}>{t("form.personality", "Kepribadian")}</label>
              <textarea
                id="look-personality"
                value={data.appearance?.personality || ""}
                onChange={(e) => updateAppearance("personality", e.target.value)}
                rows={3}
                placeholder={t("form.describePersonalityShort")}
                className="w-full rounded-xl border-2 border-border-strong bg-surface p-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-ink"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="look-backstory" className={labelClass}>{t("form.backstory", "Latar Cerita")}</label>
              <textarea
                id="look-backstory"
                value={data.appearance?.backstory || ""}
                onChange={(e) => updateAppearance("backstory", e.target.value)}
                rows={4}
                placeholder={t("form.writeBackstory")}
                className="w-full rounded-xl border-2 border-border-strong bg-surface p-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-ink"
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
