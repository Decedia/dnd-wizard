"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
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
  const updateField = (field: keyof Character["appearance"], value: string) => {
    onChange({
      appearance: { ...character.appearance, [field]: value },
    });
  };

  return (
    <SectionCard id="appearance" title="APPEARANCE & BIO" icon={<AppearanceIcon className="h-5 w-5" />}>
      {editMode ? (
        <>
          <div className="grid grid-cols-2 divide-x divide-border">
            <Field label="AGE">
              <input
                type="text"
                value={character.appearance.age}
                onChange={(e) => updateField("age", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder="e.g. 27"
              />
            </Field>
            <Field label="HEIGHT" className="pl-4">
              <input
                type="text"
                value={character.appearance.height}
                onChange={(e) => updateField("height", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder="e.g. 6'2&quot;"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <Field label="WEIGHT">
              <input
                type="text"
                value={character.appearance.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder="e.g. 180 lbs"
              />
            </Field>
            <Field label="EYES" className="pl-4">
              <input
                type="text"
                value={character.appearance.eyes}
                onChange={(e) => updateField("eyes", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder="e.g. Blue"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <Field label="SKIN">
              <input
                type="text"
                value={character.appearance.skin}
                onChange={(e) => updateField("skin", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder="e.g. Fair"
              />
            </Field>
            <Field label="HAIR" className="pl-4">
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

          <div className="mt-4 space-y-4">
            <Field label="CHARACTER APPEARANCE">
              <textarea
                value={character.appearance.characterAppearance}
                onChange={(e) => updateField("characterAppearance", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[80px]"
                placeholder="Describe your character's physical appearance..."
              />
            </Field>
            <Field label="PERSONALITY">
              <textarea
                value={character.appearance.personality}
                onChange={(e) => updateField("personality", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[80px]"
                placeholder="Describe your character's personality traits, ideals, bonds, and flaws..."
              />
            </Field>
            <Field label="BACKSTORY">
              <textarea
                value={character.appearance.backstory}
                onChange={(e) => updateField("backstory", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[120px]"
                placeholder="Where did your character come from? What drives them?"
              />
            </Field>
            <Field label="ALLIES & ORGANIZATIONS">
              <textarea
                value={character.appearance.alliesOrganizations}
                onChange={(e) => updateField("alliesOrganizations", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[80px]"
                placeholder="List allies, organizations, or contacts..."
              />
            </Field>
            <Field label="ADDITIONAL FEATURES & TRAITS">
              <textarea
                value={character.appearance.additionalFeaturesTraits}
                onChange={(e) => updateField("additionalFeaturesTraits", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[80px]"
                placeholder="Any additional features or traits not listed elsewhere..."
              />
            </Field>
            <Field label="TREASURE">
              <textarea
                value={character.appearance.treasure}
                onChange={(e) => updateField("treasure", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea.input min-h-[80px]"
                placeholder="Notable treasure, magic items, or valuables..."
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x divide-border">
            <ViewField label="AGE" value={character.appearance.age} />
            <ViewField label="HEIGHT" value={character.appearance.height} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <ViewField label="WEIGHT" value={character.appearance.weight} />
            <ViewField label="EYES" value={character.appearance.eyes} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <ViewField label="SKIN" value={character.appearance.skin} />
            <ViewField label="HAIR" value={character.appearance.hair} className="pl-4" />
          </div>

          <div className="mt-4 space-y-3">
            {character.appearance.characterAppearance && (
              <ViewField label="CHARACTER APPEARANCE" value={character.appearance.characterAppearance} />
            )}
            {character.appearance.personality && (
              <ViewField label="PERSONALITY" value={character.appearance.personality} />
            )}
            {character.appearance.backstory && (
              <ViewField label="BACKSTORY" value={character.appearance.backstory} />
            )}
            {character.appearance.alliesOrganizations && (
              <ViewField label="ALLIES & ORGANIZATIONS" value={character.appearance.alliesOrganizations} />
            )}
            {character.appearance.additionalFeaturesTraits && (
              <ViewField label="ADDITIONAL FEATURES & TRAITS" value={character.appearance.additionalFeaturesTraits} />
            )}
            {character.appearance.treasure && (
              <ViewField label="TREASURE" value={character.appearance.treasure} />
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
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

function ViewField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-parchment">{value || "—"}</span>
    </div>
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
