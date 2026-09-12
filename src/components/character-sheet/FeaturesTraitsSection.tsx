"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { StarIcon as Star, PlusIcon as Plus, CrownIcon as Crown, EyeIcon } from "@/components/icons";
import { FeatModal } from "../modals/FeatModal";
import { getStaticFeats, getStaticSubclasses, getStaticClass, getStaticRace, getStaticFeat } from "@/lib/srd-client";
import { getFeatureValue } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { FeatureMechanicsChips } from "./FeatureMechanicsChips";

interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const [popupFeatName, setPopupFeatName] = useState<string | null>(null);
  const [showHiddenFeatures, setShowHiddenFeatures] = useState(false);
  const feats = useMemo(() => getStaticFeats([], character.ruleset), [character.ruleset]);
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

  const sortedFeatures = useMemo(() => {
    return [...character.features].sort((a, b) => {
      const sourceOrder = { race: 0, class: 1, subclass: 2, custom: 3 };
      const orderA = sourceOrder[a.source as keyof typeof sourceOrder] ?? 3;
      const orderB = sourceOrder[b.source as keyof typeof sourceOrder] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [character.features]);

  const visibleFeatures = useMemo(() => {
    const base = showHiddenFeatures ? sortedFeatures : sortedFeatures.filter(f => (f as any).showInSheet !== false);
    return base.filter(f => f.id && f.name);
  }, [sortedFeatures, showHiddenFeatures]);

  const hiddenCount = useMemo(() => {
    return character.features.filter(f => (f as any).showInSheet === false).length;
  }, [character.features]);

  const enrichedFeatures = useMemo(() => {
    try {
      return visibleFeatures.map((feature) => {
        const existing = feature as any;
        
        let srdFeature: any = null;
        let derivedSource: { type: string; name: string; level: number | null } | undefined;
        
        try {
          if (existing.source === "class" && character.class) {
            const classData = getStaticClass(character.class, character.ruleset);
            if (classData) {
              for (const level of classData.levels || []) {
                srdFeature = (level.features || []).find((f: any) => f.name === feature.name);
                if (srdFeature) {
                  derivedSource = { type: "class", name: character.class, level: (level as any).level };
                  break;
                }
              }
              if (!srdFeature) {
                srdFeature = (classData.features || []).find((f: any) => f.name === feature.name);
                if (srdFeature) {
                  derivedSource = { type: "class", name: character.class, level: null };
                }
              }
            }
          } else if (existing.source === "race" && character.race) {
            const race = getStaticRace(character.race);
            srdFeature = (race?.traits || []).find((t: any) => t.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "race", name: character.race, level: null };
            }
          } else if (existing.source === "subclass" && character.class && character.subclass) {
            const subclasses = getStaticSubclasses(character.class, character.sources, character.ruleset);
            const sub = subclasses.find((s) => s.name === character.subclass);
            srdFeature = (sub?.features || []).find((f: any) => f.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "subclass", name: character.subclass, level: (srdFeature as any).level ?? null };
            }
          } else if (existing.source === "custom" || !existing.source) {
            const matchedFeat = feats.find((f) => f.name === feature.name);
            if (matchedFeat) {
              srdFeature = matchedFeat as any;
              derivedSource = { type: "feat", name: matchedFeat.source || "Feat", level: null };
            }
          }
        } catch {
          // SRD lookup failed; fall back to existing feature data
        }
        
        const srdSource = (srdFeature as any)?.source ? { type: (srdFeature as any).source.type || existing.source, name: (srdFeature as any).source.name || feature.name, level: (srdFeature as any).source.level ?? derivedSource?.level ?? null } : derivedSource;
        
        return {
          ...feature,
          summary: srdFeature?.summary ?? existing.summary ?? null,
          featureType: srdFeature?.featureType ?? existing.featureType ?? null,
          actionType: srdFeature?.actionType ?? existing.actionType ?? null,
          uses: srdFeature?.uses ?? existing.uses ?? null,
          requirement: srdFeature?.requirement ?? existing.requirement ?? null,
          duration: srdFeature?.duration ?? existing.duration ?? null,
          endsIf: srdFeature?.endsIf ?? existing.endsIf ?? null,
          onUse: srdFeature?.onUse ?? existing.onUse ?? null,
          scaling: srdFeature?.scaling ?? existing.scaling ?? null,
          grantsSpells: srdFeature?.grantsSpells ?? existing.grantsSpells ?? false,
          grantsAttack: srdFeature?.grantsAttack ?? existing.grantsAttack ?? false,
          grantsSkills: srdFeature?.grantsSkills ?? existing.grantsSkills ?? false,
          grantsProficiency: srdFeature?.grantsProficiency ?? existing.grantsProficiency ?? false,
          showInSheet: srdFeature?.showInSheet ?? existing.showInSheet ?? true,
          source: srdSource ?? existing.source ?? derivedSource ?? null,
        };
      });
    } catch {
      return visibleFeatures;
    }
  }, [visibleFeatures, character.class, character.race, character.subclass, character.sources, character.ruleset, feats]);

  const getBorderColor = (feature: any): string => {
    const sourceType = typeof feature.source === "string" ? feature.source : feature.source?.type;
    if (sourceType === "race") return "#6b46c1";
    if (sourceType === "subclass") return "#276749";
    if (sourceType === "feat" || sourceType === "custom") return "#b7791f";
    return "#2b6cb0";
  };

  const getBookTag = (feature: any): string | null => {
    if (typeof feature.source === "object" && feature.source?.name) {
      return feature.source.name;
    }
    if (typeof feature.source === "string") {
      if (feature.source === "class" && character.class) return character.class;
      if (feature.source === "race" && character.race) return character.race;
      if (feature.source === "subclass" && character.subclass) return character.subclass;
    }
    return null;
  };

  return (
    <SectionCard id="features" title="Features & Traits" icon={<Star className="h-5 w-5" />}>
      <div className="space-y-2">
        {character.subclass && (
          <div key="subclass-header" className="surface bg-paper-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--color-text-muted)]" />
              {(() => {
                const subclasses = character.class ? getStaticSubclasses(character.class, character.sources) : [];
                const sub = subclasses.find(s => s.name === character.subclass);
                return sub?.source ? <span className="inline-flex items-center font-semibold" style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)" }}>{sub.source}</span> : null;
              })()}
              <span className="text-sm font-bold text-ink">{character.subclass}</span>
            </div>
          </div>
        )}
        {hiddenCount > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[var(--color-text-secondary)]">{hiddenCount} feature{hiddenCount !== 1 ? 's' : ''} hidden</span>
            <button
              type="button"
              onClick={() => setShowHiddenFeatures(!showHiddenFeatures)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
              title={showHiddenFeatures ? "Hide reference features" : "Show all features including reference"}
            >
              <EyeIcon className="h-4 w-4" />
              {showHiddenFeatures ? "Show default only" : "Show all"}
            </button>
          </div>
        )}
         {enrichedFeatures.map((feature) => {
            const isLocked = feature.locked === true;
            const borderColor = getBorderColor(feature);
            const safeFeature = { ...feature, source: (feature as any).source || "class" };
            const summaryText = (feature as any).summary || feature.description || "";
            const bookTag = getBookTag(feature);
            return (
              <div key={safeFeature.id} className={`card ${isLocked ? "bg-paper-muted" : ""}`} style={{ borderLeft: `3px solid ${borderColor}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-semibold text-[#111]">{feature.name}</span>
                  {(feature as any).showInSheet === false && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">Reference only</span>
                  )}
                </div>
                <FeatureMechanicsChips
                  summary={summaryText}
                  description={(feature as any).description}
                  featureType={(feature as any).featureType}
                  actionType={(feature as any).actionType}
                  uses={(feature as any).uses}
                  requirement={(feature as any).requirement}
                  duration={(feature as any).duration}
                  endsIf={(feature as any).endsIf}
                  effect={(feature as any).effect}
                  onUse={(feature as any).onUse}
                  scaling={(feature as any).scaling}
                  source={typeof (feature as any).source === "object" ? (feature as any).source : (feature as any).source ? { type: (feature as any).source, name: (feature as any).source === "class" ? character.class : (feature as any).source === "race" ? character.race : (feature as any).source === "subclass" ? character.subclass : "Custom", level: null } : null}
                  book={bookTag}
                  onUseClick={() => {
                    if ((feature as any).onUse) {
                      updateItem(feature.id, { onUse: (feature as any).onUse });
                    }
                  }}
                  showInSheet={(feature as any).showInSheet !== false}
                />
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
      {popupFeat && <FeatModal feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
    </SectionCard>
  );
}
