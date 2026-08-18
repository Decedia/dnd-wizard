"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface AppearanceBioSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function AppearanceBioSection({ character, onChange }: AppearanceBioSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const updateField = (field: keyof Character["appearance"], value: string) => {
    onChange({
      appearance: { ...character.appearance, [field]: value },
    });
  };

  return (
    <SectionCard id="appearance" title="Appearance & Bio" icon={<AppearanceIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age">
          <input
            type="text"
            value={character.appearance.age}
            onChange={(e) => updateField("age", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. 27"
          />
        </Field>
        <Field label="Height">
          <input
            type="text"
            value={character.appearance.height}
            onChange={(e) => updateField("height", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. 6'2&quot;"
          />
        </Field>
        <Field label="Weight">
          <input
            type="text"
            value={character.appearance.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. 180 lbs"
          />
        </Field>
        <Field label="Eyes">
          <input
            type="text"
            value={character.appearance.eyes}
            onChange={(e) => updateField("eyes", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. Blue"
          />
        </Field>
        <Field label="Skin">
          <input
            type="text"
            value={character.appearance.skin}
            onChange={(e) => updateField("skin", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. Fair"
          />
        </Field>
        <Field label="Hair">
          <input
            type="text"
            value={character.appearance.hair}
            onChange={(e) => updateField("hair", e.target.value)}
            onBlur={onFieldBlur}
            className="input"
            placeholder="e.g. Brown"
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Field label="Personality">
          <textarea
            value={character.appearance.personality}
            onChange={(e) => updateField("personality", e.target.value)}
            onBlur={onFieldBlur}
            className="input min-h-[80px]"
            placeholder="Describe your character's personality traits, ideals, bonds, and flaws..."
          />
        </Field>
        <Field label="Backstory">
          <textarea
            value={character.appearance.backstory}
            onChange={(e) => updateField("backstory", e.target.value)}
            onBlur={onFieldBlur}
            className="input min-h-[120px]"
            placeholder="Where did your character come from? What drives them?"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function AppearanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
