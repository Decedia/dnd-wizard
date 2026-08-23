"use client";

import { useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { getStaticRaces, getStaticClasses } from "@/lib/srd-client";
import { languageNames } from "@/data/srd";
import { ALIGNMENTS, getProficiencyBonus } from "@/lib/storage";

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

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-parchment/90">{value || "—"}</span>
    </div>
  );
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
    <SectionCard id="identity" title="Identity" icon={<UserIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-4">
        {editMode ? (
          <>
            <Field label="Character Name">
              <input
                type="text"
                value={character.name}
                onChange={(e) => onChange({ name: e.target.value })}
                onBlur={onFieldBlur}
                className="input"
                placeholder="Enter character name"
              />
            </Field>
            <Field label="Player Name (optional)">
              <input
                type="text"
                value={character.playerName}
                onChange={(e) => onChange({ playerName: e.target.value })}
                onBlur={() => {}}
                className="input"
                placeholder="Your name"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Race">
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
              <Field label="Class">
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Level">
                <span className="text-sm font-semibold text-gold">{character.level}</span>
              </Field>
              <Field label="Proficiency Bonus">
                <input
                  type="number"
                  value={getProficiencyBonus(character.level)}
                  readOnly
                  className="input bg-charcoal/60"
                />
              </Field>
            </div>
            <Field label="Background">
              <input
                type="text"
                value={character.background}
                onChange={(e) => onChange({ background: e.target.value })}
                onBlur={() => {}}
                className="input"
                placeholder="e.g. Folk Hero"
              />
            </Field>
            <Field label="Alignment">
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
            <Field label="Languages">
              <div className="grid grid-cols-2 gap-2">
                {languageNames.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={character.languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      onBlur={() => {}}
                      className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                    />
                    <span className="text-sm text-parchment/80">{lang}</span>
                  </label>
                ))}
              </div>
            </Field>
          </>
        ) : (
          <>
            <ViewField label="Character Name" value={character.name} />
            <ViewField label="Player Name" value={character.playerName} />
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Race" value={character.race} />
              <ViewField label="Class" value={character.class} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Level" value={String(character.level)} />
              <ViewField label="Proficiency Bonus" value={String(getProficiencyBonus(character.level))} />
            </div>
            <ViewField label="Background" value={character.background} />
            <ViewField label="Alignment" value={character.alignment} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Languages</span>
              <span className="text-sm font-medium text-parchment/90">
                {character.languages.length > 0 ? character.languages.join(", ") : "—"}
              </span>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
