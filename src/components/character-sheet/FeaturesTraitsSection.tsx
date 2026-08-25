"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import type { Character } from "@/lib/storage";

interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const updateItem = (id: string, patch: Partial<Character["features"][number]>) => {
    onChange({
      features: character.features.map((f) =>
        f.id === id ? { ...f, ...patch } : f
      ),
    });
  };

  const addItem = () => {
    onChange({
      features: [
        ...character.features,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", description: "" },
      ],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      features: character.features.filter((f) => f.id !== id),
    });
  };

  return (
    <SectionCard id="features" title="FEATURES & TRAITS" icon={<FeaturesIcon className="h-5 w-5" />}>
      <div className="space-y-3">
        {character.subclass && (
          <div key="subclass-header" className="rounded-lg border-2 border-paper bg-paper-muted px-3 py-2">
            <span className="text-sm font-bold text-ink">{character.subclass}</span>
          </div>
        )}
        {character.features.map((feature) => {
          const isLocked = feature.locked === true;
          return (
            <div key={feature.id} className={`rounded-lg border-2 p-3 ${isLocked ? "border-paper bg-paper-muted" : "border-paper bg-ink"}`}>
              {editMode ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={feature.name}
                        readOnly={isLocked}
                        onChange={(e) => !isLocked && updateItem(feature.id, { name: e.target.value })}
                        onBlur={isLocked ? undefined : onFieldBlur}
                        className={`input flex-1 ${isLocked ? "bg-paper-muted" : ""}`}
                        placeholder="Feature name"
                      />
                      {isLocked && (
                        <span className="badge text-ink bg-paper-muted">default</span>
                      )}
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeItem(feature.id)}
                        className="text-paper-muted hover:text-paper"
                        aria-label="Remove feature"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={feature.description}
                    readOnly={isLocked}
                    onChange={(e) => !isLocked && updateItem(feature.id, { description: e.target.value })}
                    onBlur={isLocked ? undefined : onFieldBlur}
                    className={`textarea.input mt-2 min-h-[80px] ${isLocked ? "bg-paper-muted" : ""}`}
                    placeholder="Description"
                  />
                </>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-paper">{feature.name}</h3>
                  {feature.description && <DescriptionText>{feature.description}</DescriptionText>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editMode && (
        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded-lg border-2 border-dashed border-paper px-4 py-2 text-sm font-bold text-paper-muted transition-colors hover:border-ink hover:text-ink"
        >
          + Add Feature
        </button>
      )}
    </SectionCard>
  );
}

function FeaturesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
