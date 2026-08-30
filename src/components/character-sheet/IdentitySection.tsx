"use client";

import { useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getStaticRaces, getStaticClasses } from "@/lib/srd-client";
import { languageNames } from "@/data/srd";
import { ALIGNMENTS } from "@/lib/storage";
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
  };
  onChange: (patch: Partial<IdentitySectionProps["character"]>) => void;
  editMode?: boolean;
}

export function IdentitySection({ character, onChange, editMode = true }: IdentitySectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const races = getStaticRaces();
  const raceNames = races.map((r) => r.name);
  const classes = getStaticClasses();
  const classNames = classes.map((c) => c.name);

  const toggleLanguage = useCallback((lang: string) => {
    const current = character.languages || [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    onChange({ languages: next });
  }, [character.languages, onChange]);

  return (
    <SectionCard id="identity" title="Identity" icon={<User className="h-5 w-5" />}>
      <div className="space-y-3.5">
        {editMode ? (
          <>
            <Field label="CHARACTER NAME">
              <input
                type="text"
                value={character.name}
                onChange={(e) => onChange({ name: e.target.value })}
                onBlur={onFieldBlur}
                className="input"
                placeholder="Enter character name"
              />
            </Field>
            <Field label="PLAYER NAME">
              <input
                type="text"
                value={character.playerName}
                onChange={(e) => onChange({ playerName: e.target.value })}
                onBlur={() => {}}
                className="input"
                placeholder="Your name"
              />
            </Field>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <Field label="RACE">
                <select
                  value={character.race}
                  onChange={(e) => onChange({ race: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">Select race</option>
                  {raceNames.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="CLASS" className="pl-3">
                <select
                  value={character.class}
                  onChange={(e) => onChange({ class: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">Select class</option>
                  {classNames.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <Field label="BACKGROUND">
                <input
                  type="text"
                  value={character.background}
                  onChange={(e) => onChange({ background: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                  placeholder="e.g. Folk Hero"
                />
              </Field>
              <Field label="ALIGNMENT" className="pl-3">
                <select
                  value={character.alignment}
                  onChange={(e) => onChange({ alignment: e.target.value })}
                  onBlur={() => {}}
                  className="input"
                >
                  <option value="">Select alignment</option>
                  {ALIGNMENTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="LANGUAGES">
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
            <ViewField label="CHARACTER NAME" value={character.name} />
            <ViewField label="PLAYER NAME" value={character.playerName} />
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <ViewField label="RACE" value={character.race} />
              <ViewField label="CLASS" value={character.class} className="pl-3" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-strong">
              <ViewField label="BACKGROUND" value={character.background} />
              <ViewField label="ALIGNMENT" value={character.alignment} className="pl-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="field-label-light">LANGUAGES</span>
              <span className="text-sm font-semibold text-ink">
                {character.languages.length > 0 ? character.languages.join(", ") : "—"}
              </span>
            </div>
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

function ViewField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="field-label-light">{label}</span>
      <span className="text-sm font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}
