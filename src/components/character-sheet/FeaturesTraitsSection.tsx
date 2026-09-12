"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { StarIcon as Star, XIcon as X, PlusIcon as Plus, ClockIcon as Clock, LightningBoltIcon as LightningBolt, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles, CrownIcon as Crown, BowArrowIcon as BowArrowIcon, ShieldIcon as ShieldIcon, SwordIcon as SwordIcon, BattleAxeIcon as BattleAxeIcon, DaggerIcon as DaggerIcon, MagicWandIcon as MagicWandIcon, HealingIcon as HealingIcon, MusicNotesIcon as MusicNotesIcon, FlameIcon as Flame, SkullIcon as Skull, EyeIcon } from "@/components/icons";
import { FeatModal } from "../modals/FeatModal";
import { getStaticFeats, getStaticSubclasses, getStaticClass, getStaticRace, getStaticFeat } from "@/lib/srd-client";
import { getFeatureValue } from "@/lib/storage";
import { SourceBadge } from "../SourceBadge";
import { FeatureMechanicsChips } from "./FeatureMechanicsChips";
import type { Character } from "@/lib/storage";

interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur, showDescriptions } = useCharacterSheet();
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

  const getFeatureIcon = (featureName: string, source?: string) => {
    const lower = featureName.toLowerCase();
    if (source === "subclass" || lower.includes("subclass")) return Crown;
    if (lower.includes("fighting style")) {
      if (lower.includes("archery")) return BowArrowIcon;
      if (lower.includes("defense")) return ShieldIcon;
      if (lower.includes("dueling")) return SwordIcon;
      if (lower.includes("great weapon")) return BattleAxeIcon;
      if (lower.includes("protection")) return ShieldCheck;
      if (lower.includes("two-weapon")) return DaggerIcon;
    }
    if (lower.includes("spell") || lower.includes("magic")) return MagicWandIcon;
    if (lower.includes("rage")) return Flame;
    if (lower.includes("sneak")) return Skull;
    if (lower.includes("heal")) return HealingIcon;
    if (lower.includes("bard") || lower.includes("music")) return MusicNotesIcon;
    return null;
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

  const visibleFeatures = useMemo(() => {
    if (showHiddenFeatures) return sortedFeatures;
    return sortedFeatures.filter(f => (f as any).showInSheet !== false);
  }, [sortedFeatures, showHiddenFeatures]);

  const hiddenCount = useMemo(() => {
    return character.features.filter(f => (f as any).showInSheet === false).length;
  }, [character.features]);

  const enrichedFeatures = useMemo(() => {
    return visibleFeatures.map((feature) => {
      const existing = feature as any;
      
      let srdFeature: any = null;
      let derivedSource: { type: string; name: string; level: number | null } | undefined;
      
      if (feature.source === "class" && character.class) {
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
      } else if (feature.source === "race" && character.race) {
        const race = getStaticRace(character.race);
        srdFeature = (race?.traits || []).find((t: any) => t.name === feature.name);
        if (srdFeature) {
          derivedSource = { type: "race", name: character.race, level: null };
        }
      } else if (feature.source === "subclass" && character.class && character.subclass) {
        const subclasses = getStaticSubclasses(character.class, character.sources, character.ruleset);
        const sub = subclasses.find((s) => s.name === character.subclass);
        srdFeature = (sub?.features || []).find((f: any) => f.name === feature.name);
        if (srdFeature) {
          derivedSource = { type: "subclass", name: character.subclass, level: (srdFeature as any).level ?? null };
        }
      } else if (feature.source === "custom" || !feature.source) {
        const matchedFeat = feats.find((f) => f.name === feature.name);
        if (matchedFeat) {
          srdFeature = matchedFeat as any;
          derivedSource = { type: "feat", name: matchedFeat.source || "Feat", level: null };
        }
      }
      
      const srdSource = (srdFeature as any)?.source ? { type: (srdFeature as any).source.type || feature.source, name: (srdFeature as any).source.name || feature.name, level: (srdFeature as any).source.level ?? derivedSource?.level ?? null } : derivedSource;
      
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
  }, [visibleFeatures, character.class, character.race, character.subclass, character.sources, character.ruleset, feats]);

  return (
    <SectionCard id="features" title="Features & Traits" icon={<Star className="h-5 w-5" />}>
      <div className="space-y-3">
        {character.subclass && (
          <div key="subclass-header" className="surface bg-paper-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--color-text-muted)]" />
              {(() => {
                const subclasses = character.class ? getStaticSubclasses(character.class, character.sources) : [];
                const sub = subclasses.find(s => s.name === character.subclass);
                return sub?.source ? <SourceBadge source={sub.source} /> : null;
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
           const borderColor = feature.source === "race" ? "#6b46c1" : feature.source === "subclass" ? "#276749" : "#2b6cb0";
           return (
             <div key={feature.id} className={`card p-3 ${isLocked ? "bg-paper-muted" : ""}`} style={{ borderLeft: `3px solid ${borderColor}` }}>
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
                <div style={(feature as any).showInSheet === false ? { opacity: 0.6 } : undefined}>
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
                            <SourceBadge source={matchedFeat.source || "PHB"} size="sm" />
                            {(() => {
                              const FeatureIcon = getFeatureIcon(feature.name, feature.source);
                              return FeatureIcon ? <FeatureIcon className="h-4 w-4 shrink-0" /> : null;
                            })()}
                             {feature.name}
                             {(feature as any).showInSheet === false && (
                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">Reference only</span>
                             )}
                             {feature.value && (
                               <span className="text-[10px] font-bold text-[var(--color-info-700)] bg-[var(--color-info-100)] border border-[var(--color-info-300)] px-1.5 py-0.5 rounded">
                                 {feature.value}
                               </span>
                             )}
                            </button>
                          );
                        }
                        // For features without matched feat data (custom or class/race features)
                        return (
                          <>
                            {feature.source && feature.source !== "custom" && (
                              <SourceBadge source={feature.source === "subclass" ? "TCE" : feature.source === "class" ? "PHB" : feature.source === "race" ? "PHB" : feature.source} size="sm" />
                            )}
                             {(() => {
                               const FeatureIcon = getFeatureIcon(feature.name, feature.source);
                               return FeatureIcon ? <FeatureIcon className="h-4 w-4 shrink-0" /> : null;
                             })()}
                             {feature.name}
                             {(feature as any).showInSheet === false && (
                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">Reference only</span>
                             )}
                             {feature.value && (
                               <span className="text-[10px] font-bold text-[var(--color-info-700)] bg-[var(--color-info-100)] border border-[var(--color-info-300)] px-1.5 py-0.5 rounded">
                                 {feature.value}
                               </span>
                             )}
                          </>
                        );
                      })()}
                     {isFeatureUsable(feature) && (character.featuresUsedThisTurn || []).includes(feature.id) && (
                       <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">USED</span>
                     )}
                   </div>
                   {showDescriptions && feature.description && (
                     <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{feature.description}</p>
                   )}
                    {(feature as any).showInSheet !== false && (
                      <div className="mt-2">
                        <FeatureMechanicsChips
                          summary={(feature as any).summary}
                          description={feature.description}
                          featureType={(feature as any).featureType}
                          actionType={feature.actionType}
                          uses={(feature as any).uses}
                          requirement={(feature as any).requirement}
                          duration={(feature as any).duration}
                          endsIf={(feature as any).endsIf}
                          effect={(feature as any).effect}
                          onUse={(feature as any).onUse}
                          scaling={(feature as any).scaling}
                          source={(feature as any).source}
                          showInSheet={(feature as any).showInSheet}
                        />
                      </div>
                    )}
                   {(feature.actionType || isFeatureUsable(feature)) && (
                     <div className="flex items-center gap-1.5 mt-2">
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
                     </div>
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
      {popupFeat && <FeatModal feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
    </SectionCard>
  );
}

