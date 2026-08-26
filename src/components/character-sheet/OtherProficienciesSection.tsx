"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { Scroll } from "phosphor-react";

interface OtherProficienciesSectionProps {
  otherProficiencies: string;
  onChange: (value: string) => void;
  editMode?: boolean;
}

export function OtherProficienciesSection({ otherProficiencies, onChange, editMode = true }: OtherProficienciesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="proficiencies" title="OTHER PROFICIENCIES & LANGUAGES" icon={<Scroll weight="regular" className="h-5 w-5" />}>
      {editMode ? (
        <textarea
          value={otherProficiencies}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onFieldBlur}
          className="textarea.input min-h-[100px]"
          placeholder="List any additional proficiencies, languages, or other notable abilities..."
        />
      ) : (
        otherProficiencies ? (
          <DescriptionText>{otherProficiencies}</DescriptionText>
        ) : (
          <p className="text-sm text-paper-muted font-medium">None</p>
        )
      )}
    </SectionCard>
  );
}
