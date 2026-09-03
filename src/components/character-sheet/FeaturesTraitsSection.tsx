"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { StarIcon as Star, XIcon as X, PlusIcon as Plus, ClockIcon as Clock, LightningBoltIcon as LightningBolt, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles } from "@/components/icons";
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

  const toggleActionType = (featureId: string) => {
    const feature = character.features.find(f => f.id === featureId);
    if (!feature) return;
    
    const actionTypes: Array<"action" | "bonus_action" | "reaction" | "free" | "passive" | undefined> = [
      "action",
      "bonus_action",
      "reaction",
      "free",
      "passive",
      undefined,
    ];
    
    const currentIndex = actionTypes.indexOf(feature.actionType);
    const nextIndex = (currentIndex + 1) % actionTypes.length;
    const nextType = actionTypes[nextIndex];
    
    updateItem(featureId, { actionType: nextType });
  };

  const getActionTypeIcon = (actionType: string | undefined) => {
    switch (actionType) {
      case "action":
        return <LightningBolt className="h-4 w-4" title="Action" />;
      case "bonus_action":
        return <Clock className="h-4 w-4" title="Bonus Action" />;
      case "reaction":
        return <ShieldCheck className="h-4 w-4" title="Reaction" />;
      case "free":
        return <Sparkles className="h-4 w-4" title="Free Action" />;
      case "passive":
        return <Sparkles className="h-4 w-4 opacity-50" title="Passive" />;
      default:
        return null;
    }
  };

  const getActionTypeLabel = (actionType: string | undefined) => {
    switch (actionType) {
      case "action": return "Action";
      case "bonus_action": return "Bonus";
      case "reaction": return "Reaction";
      case "free": return "Free";
      case "passive": return "Passive";
      default: return "Set Type";
    }
  };

  const isFeatureUsable = (feature: { actionType?: string }) => {
    return !!feature.actionType && feature.actionType !== "passive";
  };

  const sortedFeatures = useMemo(() => {
    return [...character.features].sort((a, b) => {
      // Sort by source: race/class/subclass first, then custom
      const sourceOrder = { race: 0, class: 1, subclass: 2, custom: 3 };
      const orderA = sourceOrder[a.source as keyof typeof sourceOrder] ?? 3;
      const orderB = sourceOrder[b.source as keyof typeof sourceOrder] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [character.features]);

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
                return sub?.source ? <SourceBadge source={sub.source} /> : null;
              })()}
            </div>
          </div>
        )}
        {sortedFeatures.map((feature) => {
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
                              <SourceBadge source={matchedFeat.source || "PHB"} size="sm" />
                            </button>
                          );
                        }
                        // For features without matched feat data (custom or class/race features)
                        return (
                          <>
                            {feature.name}
                            {feature.source && feature.source !== "custom" && (
                              <SourceBadge source={feature.source === "subclass" ? "TCE" : feature.source === "class" ? "PHB" : feature.source === "race" ? "PHB" : feature.source} size="sm" />
                            )}
                          </>
                        );
                      })()}
                      {isFeatureUsable(feature) && (character.featuresUsedThisTurn || []).includes(feature.id) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">USED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {feature.name && (
                        <>
                          {feature.actionType && (
                            <button
                              type="button"
                              onClick={() => toggleActionType(feature.id)}
                              className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors bg-[var(--color-info-100)] text-[var(--color-info-700)] border border-[var(--color-info-300)] hover:bg-[var(--color-info-200)]"
                              title={`Action type: ${getActionTypeLabel(feature.actionType)}. Click to change.`}
                            >
                              {getActionTypeIcon(feature.actionType)}
                              <span>{getActionTypeLabel(feature.actionType)}</span>
                            </button>
                          )}
                          {isFeatureUsable(feature) && (
                            <>
                              {(character.featuresUsedThisTurn || []).includes(feature.id) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">USED</span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleFeatureUsed(feature.id)}
                                className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                  (character.featuresUsedThisTurn || []).includes(feature.id)
                                    ? "bg-[var(--color-warning-500)] text-[var(--color-surface)]"
                                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                                }`}
                              >
                                <Clock className="h-4 w-4" />
                                {(character.featuresUsedThisTurn || []).includes(feature.id) ? "Used" : "Use"}
                              </button>
                            </>
                          )}
                        </>
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

