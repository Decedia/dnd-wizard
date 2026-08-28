"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { Scroll } from "phosphor-react";

interface OtherProficienciesSectionProps {
  otherProficiencies: string;
  toolProficiencies: string[];
  onChange: (value: string) => void;
  onToolsChange: (value: string[]) => void;
  editMode?: boolean;
}

export function OtherProficienciesSection({ otherProficiencies, toolProficiencies, onChange, onToolsChange, editMode = true }: OtherProficienciesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="proficiencies" title="Other Proficiencies & Languages" icon={<Scroll weight="regular" className="h-5 w-5" />}>
      {toolProficiencies.length > 0 && (
        <div className="mb-3">
          <span className="field-label">Tool Proficiencies</span>
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
          placeholder="List any additional proficiencies, languages, or other notable abilities..."
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
