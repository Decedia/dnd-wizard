"use client";

import { useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getStaticRaces, getStaticClasses } from "@/lib/srd-client";
import { SourceBadge } from "../SourceBadge";
import { languageNames } from "@/data/srd";
import { ALIGNMENTS } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserIcon as User } from "@/components/icons";

interface IdentitySectionProps {
  character: {
    name: string;
    playerName: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    experiencePoints: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    features: { id: string; name: string; description: string }[];
    spellSlots: Record<number, number>;
    languages: string[];
    expertise: string[];
    skills: Record<string, boolean>;
    sources?: string[];
    raceChoices?: Record<string, string>;
    ruleset?: "2014" | "2024";
  };
  onChange: (patch: Partial<IdentitySectionProps["character"]>) => void;
  editMode?: boolean;
}

export function IdentitySection({ character, onChange, editMode = true }: IdentitySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();
  const races = getStaticRaces(character.sources, character.ruleset);
  const raceNames = races.map((r) => r.name);
  const classes = getStaticClasses([], character.ruleset);
  const classNames = classes.map((c) => c.name);

  const translateRace = (name: string) => t(`race.${name}`, name);
  const translateClass = (name: string) => t(`class.${name}`, name);
  const translateBackground = (name: string) => t(`background.${name}`, name);
  const translateAlignment = (name: string) => t(`alignment.${name}`, name);

  const toggleLanguage = useCallback((lang: string) => {
    const current = character.languages || [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    onChange({ languages: next });
  }, [character.languages, onChange]);

  return (
    <SectionCard id="identity" title={t("character.identity", "Identity")} icon={<User className="h-5 w-5" />}>
      <div className="space-y-3.5">
        {editMode ? (
          <>
            <Field label={t("form.characterNameRequired", "CHARACTER NAME")}>
              <input
                type="text"
                value={character.name}
                onChange={(e) => onChange({ name: e.target.value })}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("form.enterCharacterName", "Enter character name")}
              />
            </Field>
            <Field label={t("form.playerName", "PLAYER NAME")}>
              <input
                type="text"
                value={character.playerName}
                onChange={(e) => onChange({ playerName: e.target.value })}
                onBlur={() => {}}
                className="input"
                placeholder={t("form.yourName", "Your name")}
              />
            </Field>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <Field label={t("form.race", "RACE")}>
                <select
                  value={character.race}
                  onChange={(e) => onChange({ race: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">{t("creator.selectRace", "Select race")}</option>
                  {raceNames.map((r) => (
                    <option key={r} value={r}>{translateRace(r)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("form.class", "CLASS")} className="pl-3">
                <select
                  value={character.class}
                  onChange={(e) => onChange({ class: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">{t("creator.selectClass", "Select class")}</option>
                  {classNames.map((c) => (
                    <option key={c} value={c}>{translateClass(c)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <Field label={t("form.background", "BACKGROUND")}>
                <input
                  type="text"
                  value={character.background}
                  onChange={(e) => onChange({ background: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                  placeholder={t("form.e.gFolkHero", "e.g. Folk Hero")}
                />
              </Field>
              <Field label={t("form.alignment", "ALIGNMENT")} className="pl-3">
                <select
                  value={character.alignment}
                  onChange={(e) => onChange({ alignment: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">{t("creator.selectAlignment", "Select alignment")}</option>
                  {ALIGNMENTS.map((a) => (
                    <option key={a} value={a}>{translateAlignment(a)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t("form.languages", "LANGUAGES")}>
              <div className="grid grid-cols-2 gap-2">
                {languageNames.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={character.languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      onBlur={() => {}}
                      className="checkbox"
                    />
                    <span className="text-sm text-ink">{lang}</span>
                  </label>
                ))}
              </div>
            </Field>
          </>
        ) : (
          <>
            <ViewField label={t("form.characterNameRequired", "CHARACTER NAME")} value={character.name} />
            <ViewField label={t("form.playerName", "PLAYER NAME")} value={character.playerName} />
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <ViewField label={t("form.race", "RACE")} value={translateRace(character.race)} badge={
                (() => {
                  const race = races.find(r => r.name === character.race);
                  return race?.source && race.source !== "PHB" ? <SourceBadge source={race.source} /> : undefined;
                })()
              } />
              <ViewField label={t("form.class", "CLASS")} value={translateClass(character.class)} className="pl-3" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <ViewField label={t("form.background", "BACKGROUND")} value={translateBackground(character.background)} />
              <ViewField label={t("form.alignment", "ALIGNMENT")} value={translateAlignment(character.alignment)} className="pl-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="field-label-light">{t("form.languages", "LANGUAGES")}</span>
              <span className="text-sm font-semibold text-ink">
                {character.languages.length > 0 ? character.languages.join(", ") : "—"}
              </span>
            </div>
            {(() => {
              const race = races.find(r => r.name === character.race);
              if (!race?.choices || !character.raceChoices) return null;
              const selectedChoices = race.choices.filter(c => character.raceChoices?.[c.id]);
              if (selectedChoices.length === 0) return null;
              return (
                <div className="flex flex-col gap-1.5">
                  <span className="field-label-light">{t("form.raceOptions", "RACE OPTIONS")}</span>
                  <div className="space-y-1">
                    {selectedChoices.map((choice) => {
                      const value = character.raceChoices?.[choice.id] || "";
                      let displayValue = value;
                      if (choice.type === "single" && choice.options) {
                        displayValue = choice.options.find(o => o.id === value)?.name || value;
                      }
                      return (
                        <div key={choice.id} className="text-sm text-ink">
                          <span className="font-semibold">{choice.name}:</span> {displayValue}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </SectionCard>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="field-label-light">{label}</span>
      {children}
    </div>
  );
}

function ViewField({ label, value, className, badge }: { label: string; value: string; className?: string; badge?: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="field-label-light">{label}</span>
      <div className="flex items-center gap-2">
        {badge}
        <span className="text-sm font-semibold text-ink">{value || "—"}</span>
      </div>
    </div>
  );
}
