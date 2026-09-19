"use client";

import { StepCard } from "./StepCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";

interface StepAppearanceProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepAppearance({ data, onChange }: StepAppearanceProps) {
  const { t } = useLanguage();
  const updateAppearance = (field: string, value: string) => {
    onChange({
      appearance: {
        ...data.appearance,
        [field]: value,
      },
    });
  };

  return (
    <StepCard
      title={t("creator.finalTouches")}
      hint="Add the finishing touches to your character - appearance, personality, and any other details that bring them to life."
    >
      <div className="space-y-4">
        <div>
          <label className="field-label-light">
            {t("form.height")}
          </label>
          <input
            type="text"
            value={data.appearance?.height || ""}
            onChange={(e) => updateAppearance("height", e.target.value)}
            className="input w-full"
            placeholder={t("form.e.g6ft2")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.weight")}
          </label>
          <input
            type="text"
            value={data.appearance?.weight || ""}
            onChange={(e) => updateAppearance("weight", e.target.value)}
            className="input w-full"
            placeholder={t("form.e.g180lbs")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.eyes")}
          </label>
          <input
            type="text"
            value={data.appearance?.eyes || ""}
            onChange={(e) => updateAppearance("eyes", e.target.value)}
            className="input w-full"
            placeholder={t("form.e.gBlue")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.hair")}
          </label>
          <input
            type="text"
            value={data.appearance?.hair || ""}
            onChange={(e) => updateAppearance("hair", e.target.value)}
            className="input w-full"
            placeholder={t("form.e.gBrownCurly")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.skin")}
          </label>
          <input
            type="text"
            value={data.appearance?.skin || ""}
            onChange={(e) => updateAppearance("skin", e.target.value)}
            className="input w-full"
            placeholder={t("form.e.gFairTanned")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.personality")}
          </label>
          <textarea
            value={data.appearance?.personality || ""}
            onChange={(e) => updateAppearance("personality", e.target.value)}
            className="input w-full"
            rows={3}
            placeholder={t("form.describePersonalityShort")}
          />
        </div>
        <div>
          <label className="field-label-light">
            {t("form.backstory")}
          </label>
          <textarea
            value={data.appearance?.backstory || ""}
            onChange={(e) => updateAppearance("backstory", e.target.value)}
            className="input w-full"
            rows={4}
            placeholder={t("form.writeBackstory")}
          />
        </div>
      </div>
    </StepCard>
  );
}
