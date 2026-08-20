"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";

interface OtherProficienciesSectionProps {
  otherProficiencies: string;
  onChange: (value: string) => void;
}

export function OtherProficienciesSection({ otherProficiencies, onChange }: OtherProficienciesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="proficiencies" title="Other Proficiencies & Languages" icon={<ProficienciesIcon className="h-5 w-5" />}>
      <textarea
        value={otherProficiencies}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onFieldBlur}
        className="textarea.input min-h-[100px]"
        placeholder="List any additional proficiencies, languages, or other notable abilities..."
      />
    </SectionCard>
  );
}

function ProficienciesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
