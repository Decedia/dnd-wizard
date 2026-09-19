"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { ScrollIcon as Scroll } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";

interface OtherProficienciesSectionProps {
  otherProficiencies: string;
  toolProficiencies: string[];
  onChange: (value: string) => void;
  onToolsChange: (value: string[]) => void;
  editMode?: boolean;
}

export function OtherProficienciesSection({ otherProficiencies, toolProficiencies, onChange, onToolsChange, editMode = true }: OtherProficienciesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t } = useLanguage();

  return (
    <SectionCard id="proficiencies" title={t("section.otherProficiencies")} icon={<Scroll className="h-5 w-5" />}>
      {toolProficiencies.length > 0 && (
        <div className="mb-3">
          <span className="field-label">{t("proficiencies.tools")}</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {toolProficiencies.map((tool) => (
              <span key={tool} className="text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-bg)] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
      {editMode ? (
        <textarea
          value={otherProficiencies}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onFieldBlur}
          className="textarea min-h-[100px]"
          placeholder={t("placeholder.additionalProficiencies")}
        />
      ) : (
        otherProficiencies ? (
          <DescriptionText>{otherProficiencies}</DescriptionText>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">None</p>
        )
      )}
    </SectionCard>
  );
}
