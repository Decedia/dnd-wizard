"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { Star, X, Plus } from "phosphor-react";
import { InfoButton } from "@/components/InfoButton";
import { FeatPopup } from "./FeatPopup";
import { getStaticFeats, type SRDFeat } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const [popupFeatName, setPopupFeatName] = useState<string | null>(null);
  const feats = useMemo(() => getStaticFeats(), []);
  const popupFeat = feats.find((f) => f.name === popupFeatName) || null;
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
    <SectionCard id="features" title="Features & Traits" icon={<Star weight="regular" className="h-5 w-5" />}>
      <div className="space-y-3">
        {character.subclass && (
          <div key="subclass-header" className="surface bg-paper-muted px-3 py-2">
            <span className="text-sm font-bold text-ink">{character.subclass}</span>
          </div>
        )}
        {character.features.map((feature) => {
          const isLocked = feature.locked === true;
          return (
            <div key={feature.id} className={`card p-3 ${isLocked ? "bg-paper-muted" : ""}`}>
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
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        aria-label="Remove feature"
                      >
                        <X weight="regular" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                    <textarea
                    value={feature.description}
                    readOnly={isLocked}
                    onChange={(e) => !isLocked && updateItem(feature.id, { description: e.target.value })}
                    onBlur={isLocked ? undefined : onFieldBlur}
                    className={`textarea mt-2 min-h-[80px] ${isLocked ? "bg-paper-muted" : ""}`}
                    placeholder="Description"
                  />
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    {(() => {
                      const matchedFeat = feats.find((f) => f.name === feature.name);
                      if (matchedFeat) {
                        return (
                          <button
                            type="button"
                            onClick={() => setPopupFeatName(feature.name)}
                            className="text-sm font-bold text-[var(--color-text-primary)] hover:underline text-left"
                          >
                            {feature.name}
                          </button>
                        );
                      }
                      return <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{feature.name}</h3>;
                    })()}
                    {feature.description && (
                      <InfoButton title={feature.name} description={feature.description} />
                    )}
                  </div>
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
            className="mt-3 btn-secondary flex items-center gap-1.5"
          >
            <Plus weight="regular" size={16} />
            Add Feature
          </button>
      )}
      {popupFeat && <FeatPopup feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
    </SectionCard>
  );
}

