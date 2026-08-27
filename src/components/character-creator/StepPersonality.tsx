"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { backgroundsData, alignmentOptions, getBackgroundData } from "@/data/backgrounds";
import { languages as languageList } from "@/data/srd";
import type { Character } from "@/lib/storage";

interface StepPersonalityProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

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

export function StepPersonality({ data, onChange }: StepPersonalityProps) {

  const raceLanguages = getRaceLanguages(data.race);
  const raceBonusLanguages = getRaceBonusLanguages(data.race);
  const selectedBackground = getBackgroundData(data.background);
  const backgroundLanguageCount = selectedBackground?.languages || 0;

  const totalBonusLanguages = raceBonusLanguages + backgroundLanguageCount;

  const handleLanguageToggle = useCallback((language: string) => {
    const currentLanguages = data.languages || [...defaultLanguages];
    const isRaceLanguage = raceLanguages.includes(language);

    if (isRaceLanguage) return;

    if (currentLanguages.includes(language)) {
      onChange({ languages: currentLanguages.filter(l => l !== language) });
    } else {
      if (currentLanguages.length < raceLanguages.length + totalBonusLanguages) {
        onChange({ languages: [...currentLanguages, language] });
      }
    }
  }, [data.languages, raceLanguages, totalBonusLanguages, onChange]);

  const availableLanguages = languageList.map(l => l.name).filter(l => !raceLanguages.includes(l));
  const canAddMoreLanguages = (data.languages?.length || defaultLanguages.length) < raceLanguages.length + totalBonusLanguages;

  return (
    <StepCard title="Personality" hint="Define your character's personality, background, and the languages they speak. Your background provides skill proficiencies and special features.">
      <div className="space-y-6">

        <div>
          <label className="field-label-light">Alignment</label>
          <select
            value={data.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="input w-full"
          >
            <option value="">Select alignment</option>
            {alignmentOptions.map((alignment) => (
              <option key={alignment} value={alignment}>{alignment}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label-light">Background</label>
          <select
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            className="input w-full"
          >
            <option value="">Select background</option>
            {backgroundsData.map((bg) => (
              <option key={bg.name} value={bg.name}>{bg.name}</option>
            ))}
          </select>
          {selectedBackground && (
            <div className="mt-2 p-3 bg-[var(--color-bg)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="text-xs font-bold text-[var(--color-text-primary)]">{selectedBackground.feature.name}</div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{selectedBackground.feature.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Skills:</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">{selectedBackground.skillProficiencies.join(", ")}</span>
                </div>
                {selectedBackground.toolProficiencies.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Tools:</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">{selectedBackground.toolProficiencies.join(", ")}</span>
                  </div>
                )}
                {selectedBackground.languages > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Languages:</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">+{selectedBackground.languages}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="field-label-light">
            Languages
            <span className="text-[var(--color-text-muted)] font-normal ml-2">
              ({data.languages?.length || defaultLanguages.length}/{raceLanguages.length + totalBonusLanguages})
            </span>
          </label>
          <div className="space-y-2 mt-2">
            <div className="flex flex-wrap gap-2">
              {raceLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-border-active)] text-white"
                >
                  {lang}
                </span>
              ))}
              {(data.languages || defaultLanguages).filter(l => !raceLanguages.includes(l)).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  {lang} ×
                </button>
              ))}
            </div>
            {canAddMoreLanguages && (
              <div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleLanguageToggle(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="input w-full text-sm"
                >
                  <option value="">Add a language...</option>
                  {availableLanguages
                    .filter(l => !(data.languages || defaultLanguages).includes(l))
                    .map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="field-label-light">Personality Traits</label>
          <textarea
            value={data.personalityTrait1}
            onChange={(e) => onChange({ personalityTrait1: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="Describe your character's personality..."
          />
        </div>

        <div>
          <label className="field-label-light">Ideal</label>
          <textarea
            value={data.ideal}
            onChange={(e) => onChange({ ideal: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="What drives your character?"
          />
        </div>

        <div>
          <label className="field-label-light">Bond</label>
          <textarea
            value={data.bond}
            onChange={(e) => onChange({ bond: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="What connects your character to the world?"
          />
        </div>

        <div>
          <label className="field-label-light">Flaw</label>
          <textarea
            value={data.flaw}
            onChange={(e) => onChange({ flaw: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="What is your character's weakness?"
          />
        </div>
      </div>
    </StepCard>
  );
}
