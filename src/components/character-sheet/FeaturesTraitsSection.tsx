"use client";

import { useState, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { StarIcon as Star, PlusIcon as Plus, CrownIcon as Crown, ClockIcon as Clock, SparklesIcon as Sparkle, CaretRightIcon as CaretRight } from "@/components/icons";
import { FeatModal } from "../modals/FeatModal";
import { FeatureSelectionModal } from "../modals/FeatureSelectionModal";
import { getStaticFeats, getStaticSubclasses, getStaticClass, getStaticRace, getStaticFeat } from "@/lib/srd-client";
import { syncBaseFeatures, getMissingFeatureChoices, resolveFeatureChoice } from "@/lib/character-creation";
import { saveCharacter } from "@/lib/storage";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStatBadgeStyle } from "@/lib/badge-styles";
import { buildDataset, findEngineFeature, resolve, type ResolveContext, type ResolvedFeature } from "@/lib/feature-engine";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { DiceText } from "@/components/DiceText";

/**
 * Which class, subclass or race owns a stored feature, so the engine lookup can
 * disambiguate a name like "Extra Attack" that six different classes have.
 * The owner lives on the character rather than on each feature, because every
 * feature of a source shares it.
 */
function ownerFor(character: Character, feature: Character["features"][number]): string | undefined {
  if (feature.source === "subclass") return character.subclass;
  if (feature.source === "race") return character.race;
  if (feature.source === "class") return character.class;
  return undefined;
}

/**
 * The character sheet already tracks a handful of pools by name. Anything the
 * engine asks for that is not here reports zero, which is the honest answer:
 * the sheet does not yet track it.
 */
function buildPools(character: Character): { id: string; available: number }[] {
  return [
    { id: "rages", available: Math.max(0, (character.rages ?? 0)) },
    { id: "sorcery_points", available: Math.max(0, (character.sorceryPoints ?? 0)) },
    { id: "bardic_inspiration", available: Math.max(0, (character.bardicInspirationUses ?? 0)) },
    { id: "superiority_dice", available: 0 },
    { id: "ki", available: 0 },
    { id: "channel_divinity", available: 0 },
    { id: "spell_slots", available: totalSpellSlots(character) },
    { id: "hit_dice", available: Math.max(0, character.hitDiceRemaining ?? 0) },
    { id: "wild_shape_uses", available: 0 },
    { id: "lay_on_hands", available: 0 },
  ];
}

function totalSpellSlots(character: Character): number {
  const remaining = character.spellSlots ?? {};
  const spent = character.spellSlotsExpended ?? {};
  return Object.keys(remaining).reduce((sum, key) => {
    const level = Number(key);
    return sum + Math.max(0, (remaining[level] ?? 0) - (spent[level] ?? 0));
  }, 0);
}

interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur, showDescriptions } = useCharacterSheet();
  const { t, tDesc, language } = useLanguage();
  const [popupFeatName, setPopupFeatName] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [missingChoices, setMissingChoices] = useState<ReturnType<typeof getMissingFeatureChoices>>([]);
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0);
  const feats = useMemo(() => getStaticFeats([], character.ruleset, language), [character.ruleset, language]);
  const popupFeat = feats.find((f) => f.name === popupFeatName) || null;

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

  const handleSyncFeatures = async () => {
    if (!character || syncing) return;
    setSyncing(true);
    try {
      const synced = syncBaseFeatures(character, language);
      onChange({ features: synced.features });
      await saveCharacter({ ...character, features: synced.features });

      const missing = getMissingFeatureChoices(synced, language);
      if (missing.length > 0) {
        setMissingChoices(missing);
        setCurrentChoiceIndex(0);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleChoiceSelect = async (selectedOptionName: string) => {
    const currentChoice = missingChoices[currentChoiceIndex];
    if (!currentChoice) return;

    const updated = resolveFeatureChoice(character, currentChoice, selectedOptionName);
    onChange(updated);
    await saveCharacter(updated);

    const nextIndex = currentChoiceIndex + 1;
    if (nextIndex < missingChoices.length) {
      setCurrentChoiceIndex(nextIndex);
    } else {
      setMissingChoices([]);
      setCurrentChoiceIndex(0);
    }
  };

  const handleChoiceClose = () => {
    setMissingChoices([]);
    setCurrentChoiceIndex(0);
  };

  const currentChoice = missingChoices[currentChoiceIndex] || null;

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
    const base = showDescriptions ? sortedFeatures : sortedFeatures.filter(f => (f as any).showInSheet !== false);
    return base.filter(f => f.id && f.name);
  }, [sortedFeatures, showDescriptions]);

  const hiddenCount = useMemo(() => {
    return character.features.filter(f => (f as any).showInSheet === false).length;
  }, [character.features]);

  const enrichedFeatures = useMemo(() => {
    try {
      return visibleFeatures.map((feature) => {
        const existing = feature as any;
        
        let srdFeature: any = null;
        let derivedSource: { type: string; name: string; level: number | null } | undefined;
        let book: string | null = null;
        
        try {
          if (existing.source === "class" && character.class) {
            const classData = getStaticClass(character.class, character.ruleset, undefined, language);
            if (classData) {
              for (const level of classData.levels || []) {
                srdFeature = (level.features || []).find((f: any) => f.name === feature.name);
                if (srdFeature) {
                  derivedSource = { type: "class", name: character.class, level: (level as any).level };
                  book = srdFeature.book || classData.source || "PHB";
                  break;
                }
              }
              if (!srdFeature) {
                srdFeature = (classData.features || []).find((f: any) => f.name === feature.name);
                if (srdFeature) {
                  derivedSource = { type: "class", name: character.class, level: null };
                  book = srdFeature.book || classData.source || "PHB";
                }
              }
            }
          } else if (existing.source === "race" && character.race) {
            const race = getStaticRace(character.race, undefined, language);
            srdFeature = (race?.traits || []).find((t: any) => t.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "race", name: character.race, level: null };
              book = srdFeature.book || race?.source || "PHB";
            }
          } else if (existing.source === "subclass" && character.class && character.subclass) {
            const subclasses = getStaticSubclasses(character.class, character.sources, character.ruleset, language);
            const sub = subclasses.find((s) => s.name === character.subclass);
            srdFeature = (sub?.features || []).find((f: any) => f.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "subclass", name: character.subclass, level: (srdFeature as any).level ?? null };
              book = srdFeature.book || sub?.source || "PHB";
            }
          } else if (existing.source === "custom" || !existing.source) {
            const matchedFeat = feats.find((f) => f.name === feature.name);
            if (matchedFeat) {
              srdFeature = matchedFeat as any;
              derivedSource = { type: "feat", name: matchedFeat.source || "Feat", level: null };
              book = srdFeature.book || matchedFeat.source || "PHB";
            }
          }
        } catch {
          // SRD lookup failed; fall back to existing feature data
        }
        
        const srdSource = (srdFeature as any)?.source ? { type: (srdFeature as any).source.type || existing.source, name: (srdFeature as any).source.name || feature.name, level: (srdFeature as any).source.level ?? derivedSource?.level ?? null } : derivedSource;

        // Resolve the description from the SRD first. Deriving the fallback summary
        // from the stored text instead pinned English onto every feature whose SRD
        // entry has no summary of its own, because the stored text is whatever
        // language the character was created in.
        const resolvedDescription = srdFeature?.description ?? existing.description ?? "";
        const actionType = (feature as any).actionType;
        const uses = (feature as any).uses;
        const requirement = (feature as any).requirement;
        const duration = (feature as any).duration;
        const featureType = (feature as any).featureType || "Passive";
        const onUse = (feature as any).onUse;
        const scaling = (feature as any).scaling;

        const mechanismParts: string[] = [];
        if (actionType && actionType !== "passive") mechanismParts.push(actionType.toLowerCase());
        if (uses) {
          const total = typeof uses.total === "number" ? uses.total : uses.total;
          const recharge = uses.recharge;
          mechanismParts.push(`${total}/${recharge}`);
        }
        if (requirement) mechanismParts.push(requirement.toLowerCase());
        if (duration && duration !== "Instantaneous") mechanismParts.push(duration.toLowerCase());
        if (featureType === "Active" && !actionType) mechanismParts.push("action");
        if (onUse) mechanismParts.push(onUse.toLowerCase());
        if (scaling) mechanismParts.push("scales");

        const mechanismStr = mechanismParts.length > 0 ? ` (${mechanismParts.join(", ")})` : "";

        const fallbackSummary = (() => {
          const firstSentence = resolvedDescription.split(/[.\n]/)[0].trim();
          let s = firstSentence + mechanismStr;
          const words = s.split(/\s+/);
          if (words.length > 30) s = words.slice(0, 30).join(" ");
          return s;
        })();

        return {
          ...feature,
          description: resolvedDescription,
          summary: srdFeature?.summary ?? existing.summary ?? (fallbackSummary || null),
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
          book: book ?? (existing as any).book ?? null,
        };
      });
    } catch {
      return visibleFeatures;
    }
  }, [visibleFeatures, character.class, character.race, character.subclass, character.sources, character.ruleset, feats, language]);

  /**
   * The combat engine resolved once per render, keyed by the character feature's
   * own id. A feature is matched through its stamped engineId, so a Barbarian's
   * Rage and a Cleric's Rage resolve to different entries with different
   * numbers.
   */
  const engineDataset = useMemo(() => buildDataset(), []);

  /**
   * featuresUsedThisTurn stores the sheet's own feature ids, but resolve()
   * compares engine ids, so the list is translated. Without this every feature
   * reads as unused and no charge ever decrements.
   */
  const usedEngineIds = useMemo(() => {
    const byStored = new Map<string, string>();
    for (const feature of character.features || []) {
      const engineFeature =
        (feature.engineId && engineDataset.byId.get(feature.engineId)) ||
        findEngineFeature(ownerFor(character, feature), feature.name, engineDataset);
      if (engineFeature) byStored.set(feature.id, engineFeature.id);
    }
    return (character.featuresUsedThisTurn || [])
      .map((storedId) => byStored.get(storedId))
      .filter((id): id is string => Boolean(id));
  }, [character, engineDataset]);

  const resolveContext = useMemo<ResolveContext>(
    () => ({
      level: character.level || 1,
      pools: buildPools(character),
      usedThisTurn: usedEngineIds,
      activeStates: character.activeStates || [],
    }),
    [character, usedEngineIds]
  );

  const resolvedByStoredId = useMemo(() => {
    const out = new Map<string, ResolvedFeature>();
    for (const feature of character.features || []) {
      const engineFeature =
        (feature.engineId && engineDataset.byId.get(feature.engineId)) ||
        findEngineFeature(ownerFor(character, feature), feature.name, engineDataset);
      if (engineFeature) out.set(feature.id, resolve(engineFeature, resolveContext));
    }
    return out;
  }, [character, resolveContext, engineDataset]);

  const resolvedFor = (storedId: string): ResolvedFeature | undefined => resolvedByStoredId.get(storedId);

  const getBookTag = (feature: any): string | null => {
    return feature.book || null;
  };

  /**
   * Badges come from the combat engine when the feature has an entry there,
   * and from the sheet's own data otherwise. The engine path is preferred
   * because it knows the character's level, so a Barbarian's Rage badge reads
   * "3 / rest" rather than repeating whatever the raw record says.
   */
  const getFeatureBadges = (feature: any): string[] => {
    const engine = resolvedFor(feature.id);
    if (engine) return engine.badges.map((b) => b.label);
    const badges: string[] = [];
    const actionType = feature.actionType;
    if (actionType && String(actionType).toLowerCase() !== "passive") badges.push(String(actionType));
    const uses = feature.uses;
    if (uses) {
      const total = typeof uses.total === "number" ? String(uses.total) : "";
      const recharge = uses.recharge || "";
      const badge = total && recharge ? `${total} / ${recharge}` : total || recharge;
      if (badge) badges.push(badge);
    }
    const requirement = feature.requirement;
    if (requirement && String(requirement).length <= 48) badges.push(String(requirement));
    if (feature.scaling) badges.push(t("feature.scales", "Scales"));
    const book = getBookTag(feature);
    if (book) badges.push(book);
    return badges;
  };

  const getFeatureLevel = (feature: any): number | null => {
    const source = feature.source;
    if (source && typeof source === "object" && typeof source.level === "number") return source.level;
    return null;
  };

  const isRacialFeature = (feature: any): boolean => {
    const source = feature.source;
    return !!source && typeof source === "object" && source.type === "race";
  };

  const getFeatureDetailRows = (feature: any): { label: string; value: string }[] => {
    const rows: { label: string; value: string }[] = [];
    const push = (key: string, fallback: string, value: unknown) => {
      if (value) rows.push({ label: t(key, fallback), value: String(value) });
    };
    push("feature.requires", "Requires", feature.requirement);
    push("feature.onUse", "On Use", feature.onUse);
    push("feature.endsIf", "Ends If", feature.endsIf);
    push("feature.scales", "Scales", feature.scaling);
    return rows;
  };

  const toggleFeatureUsed = (featureId: string) => {
    const current = character.featuresUsedThisTurn || [];
    const used = current.includes(featureId);
    onChange({
      featuresUsedThisTurn: used ? current.filter(id => id !== featureId) : [...current, featureId],
    });
  };

  return (
    <SectionCard
      id="features"
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <span>{t("section.featuresTraits")}</span>
          </div>
          {hiddenCount > 0 && !showDescriptions && (
            <span className="text-sm text-gray-400">
              {t("features.hiddenCount", { count: hiddenCount, plural: hiddenCount !== 1 ? "s" : "" })}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        {character.subclass && (
              <div key="subclass-header" className="surface bg-paper-muted px-3 py-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-[var(--color-text-muted)]" />
                  {(() => {
                     const subclasses = character.class ? getStaticSubclasses(character.class, character.sources, undefined, language) : [];
                    const sub = subclasses.find(s => s.name === character.subclass);
                    return sub?.source ? <span className="inline-flex items-center font-semibold" style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)" }}>{sub.source}</span> : null;
                  })()}
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{character.subclass}</span>
                </div>
              </div>
        )}
        {editMode && (
          <div className="px-1">
            <button
              type="button"
              onClick={handleSyncFeatures}
              disabled={syncing}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-colors disabled:opacity-60"
            >
              {syncing ? t("features.syncing") : t("features.syncWithSrd")}
            </button>
          </div>
        )}
        {enrichedFeatures.map((feature) => {
          const safeFeature = { ...feature, source: (feature as any).source || "class" };
          const resolved = resolvedFor(feature.id);
          const summaryText = (feature as any).summary || resolved?.summary || "";
          const badges = getFeatureBadges(feature);
          // The engine knows the duration as a value, which beats the sheet's
          // prose when both exist.
          const duration =
            resolved?.duration ? `${resolved.duration.value} ${resolved.duration.unit}` : (feature as any).duration || "";;
          const level = getFeatureLevel(feature);
          const isActive = ((feature as any).featureType || "Passive") === "Active";
          const featureUsed = (character.featuresUsedThisTurn || []).includes(feature.id);
          const summary = summaryText || (feature.description || "").slice(0, 180);
          return (
            <div
              key={safeFeature.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedFeature(feature)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedFeature(feature);
                }
              }}
              className="relative block w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm cursor-pointer active:scale-[0.98] active:border-[var(--color-border-active)] transition-all duration-75 overflow-hidden mb-4 group"
            >
              {/* Content Body */}
              <div className="p-4 pb-3">
                {/* Title Block */}
                <div className="mb-2">
                  <h3 className="font-bold text-lg text-[var(--color-text-primary)] leading-tight">
                    {feature.name}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] block mt-0.5">
                    {level !== null ? `${t("feature.level", "Level")} ${level}` : isRacialFeature(feature) ? t("feature.racial", "Racial") : (feature as any).source?.name || "Feature"}
                  </span>
                </div>

                {/* Badges Row */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {badges.map((badge: string, badgeIdx: number) => (
                      <span
                        key={badgeIdx}
                        style={getStatBadgeStyle(badge)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {duration && (
                  <span className="block text-[10px] text-[var(--color-text-muted)] mb-2">⏱ {duration}</span>
                )}

                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-info-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-info-700)] mb-2">
                    {t("feature.active", "Active")}
                  </span>
                )}

                {(feature as any).showInSheet === false && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)] mb-2">
                    {t("sheet.referenceOnly")}
                  </span>
                )}

                {/* Summary Text */}
                {summary && (
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                    {summary}
                  </p>
                )}
              </div>

              {/* Action Footer */}
              <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] px-4 py-2.5 flex justify-between items-center group-active:bg-[var(--color-border-muted)] transition-colors">
                {isActive && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFeatureUsed(feature.id); }}
                    className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                      featureUsed
                        ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                        : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                    title={featureUsed ? t("spells.clickToMarkUnused") : t("spells.clickToMarkUsed")}
                  >
                    <Sparkle className="h-4 w-4" />
                    {featureUsed ? t("spells.used") : t("spells.use")}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-accent-indigo-600)] tracking-wide uppercase">
                    {t("glossary.viewDetails", "Lihat Detail")}
                  </span>
                  <CaretRight size={16} className="text-[var(--color-accent-indigo-500)]" />
                </div>
              </div>
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
          {t("button.addFeature", "Add Feature")}
        </button>
      )}
        {popupFeat && <FeatModal feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
        {selectedFeature && (() => {
          const badges = getFeatureBadges(selectedFeature);
          const detailRows = getFeatureDetailRows(selectedFeature);
          const sheetLevel = getFeatureLevel(selectedFeature);
          const source = selectedFeature.source && typeof selectedFeature.source === "object" ? selectedFeature.source : null;
          const sheetIsActive = (selectedFeature.featureType || "Passive") === "Active";
          const sheetDuration = selectedFeature.duration || (sheetIsActive ? "Instantaneous" : "");
          return (
            <BottomSheet
              isOpen={!!selectedFeature}
              onClose={() => setSelectedFeature(null)}
              title={selectedFeature.name}
              showHeader={true}
            >
              <div className="px-4 py-4 space-y-3">
                {(selectedFeature.summary || "") && (
                  <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">{selectedFeature.summary}</p>
                )}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {badges.map((badge: string, badgeIdx: number) => (
                      <span
                        key={badgeIdx}
                        style={getStatBadgeStyle(badge)}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-md border shadow-sm"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                {(selectedFeature as any).lastUpdated && (
                  <p className="text-[10px] text-[var(--color-text-muted)]">{t("glossary.lastUpdated")}: {(selectedFeature as any).lastUpdated}</p>
                )}
                <DiceText text={selectedFeature.description || ""} />
                <div className="flex flex-wrap gap-2 pt-1">
                  {sheetLevel !== null && (
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      {t("feature.levelN", { level: sheetLevel }, "Level {level}")}
                    </span>
                  )}
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    {sheetIsActive ? t("feature.active", "Active") : t("feature.passive", "Passive")}
                  </span>
                  {sheetDuration && (
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      ⏱ {sheetDuration}
                    </span>
                  )}
                </div>
                {source?.name && (
                  <p className="text-xs text-[var(--color-text-muted)]">{source.name}</p>
                )}
                {detailRows.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--color-border-muted)] pt-2">
                    {detailRows.map((row) => (
                      <div key={row.label}>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{row.label}</span>
                        <span className="block text-sm text-[var(--color-text-primary)] leading-relaxed">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BottomSheet>
          );
        })()}
       {currentChoice && (
         <FeatureSelectionModal
           isOpen={!!currentChoice}
           onClose={handleChoiceClose}
           name={currentChoice.featureName}
           description={currentChoice.description}
           options={currentChoice.options}
           count={currentChoice.count}
           isSubclass={currentChoice.source === "subclass"}
           onSelect={handleChoiceSelect}
           selectedValues={[]}
         />
       )}
    </SectionCard>
  );
}
