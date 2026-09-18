"use client";

import { StepCard } from "./StepCard";
import { backgrounds } from "@/data/srd";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";

interface StepIdentityProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  const { t } = useLanguage();

  return (
    <StepCard title={t("creator.identity", "Identity")} hint={t("creator.identityHint", "Enter your character's name, choose a background, and set their alignment. This is who your character is in the world.")}>
      <div className="space-y-4">
        <div>
          <label className="field-label-light">
            {t("form.characterNameRequired", "Character Name *")}
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input w-full"
            placeholder={t("form.enterCharacterName", "Enter character name")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.background", "Background")}
          </label>
          <select
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            className="input w-full"
          >
            <option value="">{t("creator.selectBackground", "Select background")}</option>
            {backgrounds.map((bg) => (
              <option key={bg} value={bg}>{t(`background.${bg}`, bg)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label-light">
            {t("form.alignment", "Alignment")}
          </label>
          <select
            value={data.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="input w-full"
          >
            <option value="">{t("creator.selectAlignment", "Select alignment")}</option>
            <option value="Lawful Good">{t("alignment.Lawful Good", "Lawful Good")}</option>
            <option value="Neutral Good">{t("alignment.Neutral Good", "Neutral Good")}</option>
            <option value="Chaotic Good">{t("alignment.Chaotic Good", "Chaotic Good")}</option>
            <option value="Lawful Neutral">{t("alignment.Lawful Neutral", "Lawful Neutral")}</option>
            <option value="True Neutral">{t("alignment.True Neutral", "True Neutral")}</option>
            <option value="Chaotic Neutral">{t("alignment.Chaotic Neutral", "Chaotic Neutral")}</option>
            <option value="Lawful Evil">{t("alignment.Lawful Evil", "Lawful Evil")}</option>
            <option value="Neutral Evil">{t("alignment.Neutral Evil", "Neutral Evil")}</option>
          </select>
        </div>
      </div>
    </StepCard>
  );
}
