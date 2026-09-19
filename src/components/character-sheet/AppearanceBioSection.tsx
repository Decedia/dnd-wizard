"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { SunIcon as Sun } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";

interface AppearanceBioSectionProps {
  character: Character & {
    appearance: {
      age: string;
      height: string;
      weight: string;
      eyes: string;
      skin: string;
      hair: string;
      characterAppearance: string;
      personality: string;
      backstory: string;
      alliesOrganizations: string;
      additionalFeaturesTraits: string;
      treasure: string;
    };
  };
  onChange: (patch: Partial<Character & { appearance: Character["appearance"] }>) => void;
  editMode?: boolean;
}

export function AppearanceBioSection({ character, onChange, editMode = true }: AppearanceBioSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();
  const updateField = (field: keyof Character["appearance"], value: string) => {
    onChange({
      appearance: { ...character.appearance, [field]: value },
    });
  };

  return (
    <SectionCard id="appearance" title={t("section.appearanceBio")} icon={<Sun className="h-5 w-5" />}>
      {editMode ? (
        <>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.age")}>
              <input
                type="text"
                value={character.appearance.age}
                onChange={(e) => updateField("age", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g27")}
              />
            </Field>
            <Field label={t("appearance.height")} className="pl-4">
              <input
                type="text"
                value={character.appearance.height}
                onChange={(e) => updateField("height", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g6ft2")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.weight")}>
              <input
                type="text"
                value={character.appearance.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g180lbs")}
              />
            </Field>
            <Field label={t("appearance.eyes")} className="pl-4">
              <input
                type="text"
                value={character.appearance.eyes}
                onChange={(e) => updateField("eyes", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gBlue")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.skin")}>
              <input
                type="text"
                value={character.appearance.skin}
                onChange={(e) => updateField("skin", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gFair")}
              />
            </Field>
            <Field label={t("appearance.hair")} className="pl-4">
              <input
                type="text"
                value={character.appearance.hair}
                onChange={(e) => updateField("hair", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gBrown")}
              />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label={t("appearance.characterAppearance")}>
              <textarea
                value={character.appearance.characterAppearance}
                onChange={(e) => updateField("characterAppearance", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.describeAppearance")}
              />
            </Field>
            <Field label={t("appearance.personality")}>
              <textarea
                value={character.appearance.personality}
                onChange={(e) => updateField("personality", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.describePersonality")}
              />
            </Field>
            <Field label={t("appearance.backstory")}>
              <textarea
                value={character.appearance.backstory}
                onChange={(e) => updateField("backstory", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[120px]"
                placeholder={t("placeholder.whereFrom")}
              />
            </Field>
            <Field label={t("appearance.allies")}>
              <textarea
                value={character.appearance.alliesOrganizations}
                onChange={(e) => updateField("alliesOrganizations", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.listAllies")}
              />
            </Field>
            <Field label={t("appearance.additionalFeatures")}>
              <textarea
                value={character.appearance.additionalFeaturesTraits}
                onChange={(e) => updateField("additionalFeaturesTraits", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.additionalFeatures")}
              />
            </Field>
            <Field label={t("appearance.treasure")}>
              <textarea
                value={character.appearance.treasure}
                onChange={(e) => updateField("treasure", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.notableTreasure")}
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.age")} value={character.appearance.age} />
            <ViewField label={t("appearance.height")} value={character.appearance.height} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.weight")} value={character.appearance.weight} />
            <ViewField label={t("appearance.eyes")} value={character.appearance.eyes} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.skin")} value={character.appearance.skin} />
            <ViewField label={t("appearance.hair")} value={character.appearance.hair} className="pl-4" />
          </div>

          <div className="mt-4 space-y-3">
             {character.appearance.characterAppearance && (
              <ViewField label={t("appearance.characterAppearance")} value={character.appearance.characterAppearance} />
            )}
            {character.appearance.personality && (
              <ViewField label={t("appearance.personality")} value={character.appearance.personality} />
            )}
            {character.appearance.backstory && (
              <ViewField label={t("appearance.backstory")} value={character.appearance.backstory} />
            )}
            {character.appearance.alliesOrganizations && (
              <ViewField label={t("appearance.allies")} value={character.appearance.alliesOrganizations} />
            )}
            {character.appearance.additionalFeaturesTraits && (
              <ViewField label={t("appearance.additionalFeatures")} value={character.appearance.additionalFeaturesTraits} />
            )}
            {character.appearance.treasure && (
              <ViewField label={t("appearance.treasure")} value={character.appearance.treasure} />
            )}
          </div>
        </>
      )}
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
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{value || "—"}</span>
    </div>
  );
}
