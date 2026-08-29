"use client";

import { useState, useCallback } from "react";
import { StepCard } from "./StepCard";
import { backgroundsData, alignmentOptions, getBackgroundData } from "@/data/backgrounds";
import { languages as languageList } from "@/data/srd";
import type { Character } from "@/lib/storage";
import { CaretDown, X } from "phosphor-react";

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

  const personalityTraits = selectedBackground?.personalityTraits || [];
  const ideals = selectedBackground?.ideals || [];
  const bonds = selectedBackground?.bonds || [];
  const flaws = selectedBackground?.flaws || [];

  const [popupType, setPopupType] = useState<"personality" | "ideal" | "bond" | "flaw" | null>(null);

  const getPopupOptions = () => {
    switch (popupType) {
      case "personality": return personalityTraits;
      case "ideal": return ideals;
      case "bond": return bonds;
      case "flaw": return flaws;
      default: return [];
    }
  };

  const getPopupTitle = () => {
    switch (popupType) {
      case "personality": return "Choose Personality Trait";
      case "ideal": return "Choose Ideal";
      case "bond": return "Choose Bond";
      case "flaw": return "Choose Flaw";
      default: return "";
    }
  };

  const getCurrentValue = () => {
    switch (popupType) {
      case "personality": return data.personalityTrait1;
      case "ideal": return data.ideal;
      case "bond": return data.bond;
      case "flaw": return data.flaw;
      default: return "";
    }
  };

  const [pendingValue, setPendingValue] = useState<string>("");

  const handleOpenPopup = (type: "personality" | "ideal" | "bond" | "flaw") => {
    setPopupType(type);
    setPendingValue(getCurrentValue());
  };

  const handleSelect = (value: string) => {
    setPendingValue(value);
  };

  const handleConfirm = () => {
    switch (popupType) {
      case "personality": onChange({ personalityTrait1: pendingValue }); break;
      case "ideal": onChange({ ideal: pendingValue }); break;
      case "bond": onChange({ bond: pendingValue }); break;
      case "flaw": onChange({ flaw: pendingValue }); break;
    }
    setPopupType(null);
  };

  const handleCancel = () => {
    setPopupType(null);
  };

  const renderSelectButton = (label: string, value: string, placeholder: string, type: "personality" | "ideal" | "bond" | "flaw") => (
    <div>
      <label className="field-label-light">{label}</label>
      <button
        type="button"
        onClick={() => handleOpenPopup(type)}
        className="w-full mt-1 p-3 text-left rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)] transition-all flex items-center justify-between gap-2"
      >
        <span className={"text-sm " + (value ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")}>
          {value || placeholder}
        </span>
        <CaretDown className="h-4 w-4 text-[var(--color-text-muted)]" />
      </button>
    </div>
  );

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
            onChange={(e) => {
              const newBackground = e.target.value;
              const bgData = getBackgroundData(newBackground);
              const patch: Partial<Character> = { background: newBackground };

              if (bgData) {
                const newSkills = { ...data.skills };
                for (const skill of bgData.skillProficiencies) {
                  newSkills[skill] = true;
                }
                patch.skills = newSkills;

                patch.toolProficiencies = bgData.toolProficiencies;

                const newInventory = [...data.inventory];
                for (const itemName of bgData.equipment) {
                  newInventory.push({
                    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    name: itemName,
                    quantity: 1,
                    equipped: false,
                    source: "custom",
                    isGranted: true,
                  });
                }
                patch.inventory = newInventory;
              } else {
                const newSkills = { ...data.skills };
                const currentBg = getBackgroundData(data.background);
                if (currentBg) {
                  for (const skill of currentBg.skillProficiencies) {
                    if (newSkills[skill]) {
                      delete newSkills[skill];
                    }
                  }
                }
                patch.skills = newSkills;
                patch.toolProficiencies = [];
              }

              onChange(patch);
            }}
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
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-border-active)] text-[var(--color-nav-icon)]"
                >
                  {lang}
                </span>
              ))}
              {(data.languages || defaultLanguages).filter(l => !raceLanguages.includes(l)).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-error-300)] hover:text-[var(--color-error-500)] transition-colors"
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

        {personalityTraits.length > 0 && renderSelectButton("Personality Trait", data.personalityTrait1, "Select a personality trait...", "personality")}
        {ideals.length > 0 && renderSelectButton("Ideal", data.ideal, "Select an ideal...", "ideal")}
        {bonds.length > 0 && renderSelectButton("Bond", data.bond, "Select a bond...", "bond")}
        {flaws.length > 0 && renderSelectButton("Flaw", data.flaw, "Select a flaw...", "flaw")}
      </div>

      {popupType && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                {getPopupTitle()}
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {getPopupOptions().map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                      pendingValue === option
                        ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
                    }`}
                  >
                    <span className="text-xs text-[var(--color-text-primary)] leading-relaxed">{option}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!pendingValue}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  pendingValue
                    ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90"
                    : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </StepCard>
  );
}
