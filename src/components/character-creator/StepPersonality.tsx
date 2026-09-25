"use client";

import { useState, useCallback } from "react";
import { StepCard } from "./StepCard";
import { backgroundsData, alignmentOptions, getBackgroundData } from "@/data/backgrounds";
import { languages as languageList } from "@/data/srd";
import type { Character } from "@/lib/storage";
import { CaretDownIcon as CaretDown, XIcon as X, InfoIcon } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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
      case "personality": return t("creator.choosePersonalityTrait", "Choose Personality Trait");
      case "ideal": return t("creator.chooseIdeal", "Choose Ideal");
      case "bond": return t("creator.chooseBond", "Choose Bond");
      case "flaw": return t("creator.chooseFlaw", "Choose Flaw");
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
  const [infoState, setInfoState] = useState<{title: string; description: string} | null>(null);

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
    <StepCard title={t("creator.finalTouches")} hint="Define your character's personality, background, and the languages they speak. Your background provides skill proficiencies and special features.">
      <div className="space-y-6">

        <div>
          <label className="field-label-light">{t("form.alignment")}</label>
          <select
            value={data.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="input w-full"
          >
            <option value="">{t("form.selectAlignment")}</option>
            {alignmentOptions.map((alignment) => (
              <option key={alignment} value={alignment}>{alignment}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label-light">{t("form.background")}</label>
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
            <option value="">{t("form.selectBackground")}</option>
            {backgroundsData.map((bg) => (
              <option key={bg.name} value={bg.name}>{bg.name}</option>
            ))}
          </select>
          {selectedBackground && (
             <div className="mt-2 p-3 bg-[var(--color-bg)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
               <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">{selectedBackground.feature.name}
                 <button
                   type="button"
                   onClick={() => setInfoState({ title: selectedBackground.feature.name, description: selectedBackground.feature.description })}
                   className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                   aria-label={`Info: ${selectedBackground.feature.name}`}
                 >
                   <InfoIcon className="h-4 w-4" />
                 </button>
               </div>
              <div className="mt-2 flex flex-wrap gap-2">
              <div>
                   <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{t("creator.skillsLabel", "Skills:")}</span>
                   <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">{selectedBackground.skillProficiencies.join(", ")}</span>
                 </div>
                 {selectedBackground.toolProficiencies.length > 0 && (
                   <div>
                     <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{t("creator.toolsLabel", "Tools:")}</span>
                     <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">{selectedBackground.toolProficiencies.join(", ")}</span>
                   </div>
                 )}
                 {selectedBackground.languages > 0 && (
                   <div>
                     <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{t("creator.languagesLabel", "Languages:")}</span>
                     <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">+{selectedBackground.languages}</span>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="field-label-light">
            {t("form.languages")}
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
                   <option value="">{t("creator.addLanguage", "Add a language...")}</option>
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

        {personalityTraits.length > 0 && renderSelectButton(t("creator.personalityTrait", "Personality Trait"), data.personalityTrait1, t("creator.selectPersonalityTrait", "Select a personality trait..."), "personality")}
        {ideals.length > 0 && renderSelectButton(t("creator.ideal", "Ideal"), data.ideal, t("creator.selectIdeal", "Select an ideal..."), "ideal")}
        {bonds.length > 0 && renderSelectButton(t("creator.bond", "Bond"), data.bond, t("creator.selectBond", "Select a bond..."), "bond")}
        {flaws.length > 0 && renderSelectButton(t("creator.flaw", "Flaw"), data.flaw, t("creator.selectFlaw", "Select a flaw..."), "flaw")}
      </div>

      {popupType && (
        <BasePopup
          isOpen={true}
          onClose={handleCancel}
          title={getPopupTitle()}
          confirmLabel={t("button.confirm", "Confirm")}
          cancelLabel={t("button.cancel", "Cancel")}
          onConfirm={handleConfirm}
          confirmDisabled={!pendingValue}
          showFooter={true}
        >
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
        </BasePopup>
      )}
    </StepCard>
  );
}
