"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { StarIcon as Star, XIcon as X, PlusIcon as Plus, ClockIcon as Clock } from "@/components/icons";
import { FeatPopup } from "./FeatPopup";
import { getStaticFeats, getStaticSubclasses } from "@/lib/srd-client";
import { SourceBadge } from "../SourceBadge";
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

  const toggleFeatureUsed = (id: string) => {
    const current = character.featuresUsedThisTurn || [];
    if (current.includes(id)) {
      onChange({ featuresUsedThisTurn: current.filter(fid => fid !== id) });
    } else {
      onChange({ featuresUsedThisTurn: [...current, id] });
    }
  };

  return (
    <SectionCard id="features" title="Features & Traits" icon={<Star className="h-5 w-5" />}>
      <div className="space-y-3">
        {character.subclass && (
          <div key="subclass-header" className="surface bg-paper-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink">{character.subclass}</span>
              {(() => {
                const subclasses = character.class ? getStaticSubclasses(character.class, character.sources) : [];
                const sub = subclasses.find(s => s.name === character.subclass);
                return sub?.source && sub.source !== "PHB" ? <SourceBadge source={sub.source} /> : null;
              })()}
            </div>
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
                        <X className="h-4 w-4" />
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
                    <div className="flex items-center gap-2 flex-1">
                      {(() => {
                        const matchedFeat = feats.find((f) => f.name === feature.name);
                        if (matchedFeat) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPopupFeatName(feature.name)}
                              className="text-sm font-bold text-[var(--color-text-primary)] hover:underline text-left flex items-center gap-1.5"
                            >
                              {feature.name}
                              {matchedFeat.source && matchedFeat.source !== "PHB" && (
                                <SourceBadge source={matchedFeat.source} />
                              )}
                            </button>
                          );
                        }
                        return <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{feature.name}</h3>;
                      })()}
                      {(character.featuresUsedThisTurn || []).includes(feature.id) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">USED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {feature.name && (
                        <button
                          type="button"
                          onClick={() => toggleFeatureUsed(feature.id)}
                          className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                            (character.featuresUsedThisTurn || []).includes(feature.id)
                              ? "bg-[var(--color-warning-500)] text-[var(--color-surface)]"
                              : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {(character.featuresUsedThisTurn || []).includes(feature.id) ? "Used" : "Use"}
                        </button>
                      )}
                    </div>
                  </div>
                  {feature.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{feature.description}</p>
                  )}
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
            <Plus size={16} />
            Add Feature
          </button>
      )}
      {popupFeat && <FeatPopup feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
    </SectionCard>
  );
}

