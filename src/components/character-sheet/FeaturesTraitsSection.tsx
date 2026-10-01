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
import {
  buildDataset,
  characterPools,
  findEngineFeature,
  poolFieldFor,
  renderBadge,
  resolve,
  slotLabel,
  spendFromPool,
  triggerLabel,
  type BuiltDataset,
  type ResolveContext,
  type ResolvedFeature,
} from "@/lib/feature-engine";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { DiceText } from "@/components/DiceText";

/**
 * The character sheet tracks a few resource pools by name. A feature whose cost
 * names one of these spends it when used, so a "3 / rest" style badge actually
 * counts down instead of sitting at its maximum.
 *
 * Pools the sheet does not yet track (ki, Channel Divinity, superiority dice)
 * are deliberately absent rather than faked at zero-and-stuck.
 */
/**
 * The engine entry behind a stored character feature, or null if it has none.
 * Used for values the resolver does not carry, such as the sourcebook.
 */
function engineFeatureFor(
  character: Character,
  feature: Character["features"][number],
  dataset: BuiltDataset
) {
  return (
    (feature.engineId && dataset.byId.get(feature.engineId)) ||
    findEngineFeature(ownerFor(character, feature), feature.name, dataset) ||
    null
  );
}

/**
 * The kind of a stored feature's source, accepting both the string form written
 * today ("race") and the object form older saves carry ({type: "race"}). The
 * SRD lookups below are gated on this, and an old character's object source
 * failed every comparison, so no translation was found and the summary fell
 * through to the engine's English.
 */
function sourceKind(feature: any): string | null {
  const source = feature?.source;
  if (typeof source === "string") return source;
  if (source && typeof source === "object" && typeof source.type === "string") return source.type;
  return null;
}

/**
 * Which class, subclass or race owns a stored feature, so the engine lookup can
 * disambiguate a name like "Extra Attack" that six different classes have.
 * The owner lives on the character rather than on each feature, because every
 * feature of a source shares it.
 */
function ownerFor(character: Character, feature: Character["features"][number]): string | undefined {
  // sourceKind, because an old save's object source would otherwise resolve the
  // owner to undefined and every engine lookup would fall back to a bare name.
  const kind = sourceKind(feature);
  if (kind === "subclass") return character.subclass;
  if (kind === "race") return character.race;
  if (kind === "class") return character.class;
  return undefined;
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
  // The amount chosen for a cost the player sizes, reset when the popup changes.
  const [spendAmount, setSpendAmount] = useState(1);
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
    const engineDataset = buildDataset();

    try {
      return visibleFeatures.map((feature) => {
        const existing = feature as any;
        
        let srdFeature: any = null;
        let derivedSource: { type: string; name: string; level: number | null } | undefined;
        let book: string | null = null;
        
        try {
          const kind = sourceKind(existing);
          if (kind === "class" && character.class) {
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
          } else if (kind === "race" && character.race) {
            const race = getStaticRace(character.race, undefined, language);
            // Choices as well as traits: Variant Human is a choice option, not a
            // trait, so searching traits alone never found it and it fell through
            // to the English stored text.
            const chosen = (race?.choices ?? []).flatMap((ch: any) => ch.options ?? []);
            srdFeature =
              (race?.traits || []).find((t: any) => t.name === feature.name) ||
              chosen.find((o: any) => o.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "race", name: character.race, level: null };
              book = srdFeature.book || race?.source || "PHB";
            }
          } else if (kind === "subclass" && character.class && character.subclass) {
            const subclasses = getStaticSubclasses(character.class, character.sources, character.ruleset, language);
            const sub = subclasses.find((s) => s.name === character.subclass);
            srdFeature = (sub?.features || []).find((f: any) => f.name === feature.name);
            if (srdFeature) {
              derivedSource = { type: "subclass", name: character.subclass, level: (srdFeature as any).level ?? null };
              book = srdFeature.book || sub?.source || "PHB";
            }
          } else if (kind === "feat") {
            const matchedFeat = feats.find((f) => f.name === feature.name);
            if (matchedFeat) {
              srdFeature = matchedFeat as any;
              derivedSource = { type: "feat", name: (matchedFeat as any).source || "Feat", level: null };
              book = (matchedFeat as any).book || (matchedFeat as any).source || "PHB";
            }
          } else if (kind === "custom" || !kind) {
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

        // No mechanic text is appended to the summary. It used to be built here
        // from the stored fields, which duplicated the badge row and mixed two
        // sources: the badge row is the engine's, this was not.
        const fallbackSummary = (() => {
          const firstSentence = resolvedDescription.split(/[.\n]/)[0].trim();
          const words = firstSentence.split(/\s+/);
          return words.length > 30 ? words.slice(0, 30).join(" ") : firstSentence;
        })();

        return {
          ...feature,
          description: resolvedDescription,
          summary: srdFeature?.summary ?? existing.summary ?? (fallbackSummary || null),
          // The stored mechanical fields are deliberately not re-derived or
          // re-attached. Nothing reads them for display any more, and copying
          // them forward would keep the wrong values alive in the object that
          // gets saved back.
          grantsAttack: srdFeature?.grantsAttack ?? existing.grantsAttack ?? false,
          grantsSkills: srdFeature?.grantsSkills ?? existing.grantsSkills ?? false,
          grantsProficiency: srdFeature?.grantsProficiency ?? existing.grantsProficiency ?? false,
          showInSheet: srdFeature?.showInSheet ?? existing.showInSheet ?? true,
          source: srdSource ?? existing.source ?? derivedSource ?? null,
          // The engine's sourcebook wins: it is per-entry and verified, whereas
          // this lookup falls back to "PHB" whenever the SRD entry has no source.
          // The engine's sourcebook wins: it is per-entry and verified, whereas
          // this lookup falls back to "PHB" whenever the SRD entry has no source.
          book: engineFeatureFor(character, feature, engineDataset)?.source?.book ?? book ?? (existing as any).book ?? null,
        };
      });
    } catch {
      return visibleFeatures;
    }
  }, [visibleFeatures, character, feats, language]);

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
      character,
      pools: characterPools(character),
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



  /**
   * Badges come from the combat engine and nowhere else.
   *
   * There used to be a fallback that rebuilt badges from the stored
   * actionType / uses / requirement / scaling / book fields. That was the wrong
   * data - "see class table" as a charge count, a feature's own name repeated as
   * its type - and mixing it with engine badges meant a feature could show both
   * a correct number and a wrong one. A feature with no engine entry, such as
   * homebrew, now shows no mechanic badge, which is the honest answer rather
   * than an invented one.
   */
  /**
   * Badge values are keys, not text: the engine holds no locale, so it must not
   * bake English into anything a player reads. The period inside a charge, the
   * unit inside a duration and the resource name are themselves keys.
   */
  const getFeatureBadges = (feature: any): string[] => {
    const badges = resolvedFor(feature.id)?.badges ?? [];
    return badges.map((badge) => {
      const values = { ...(badge.values ?? {}) };
      if (typeof values.per === "string") values.per = t(`engine.per.${values.per}`, values.per);
      if (typeof values.unit === "string") values.unit = t(`engine.unit.${values.unit}`, values.unit);
      if (typeof values.resource === "string") {
        values.resource = t(`engine.resource.${values.resource}`, values.resource.replace(/_/g, " "));
      }
      return t(badge.key, values, renderBadge(badge));
    });
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

  /**
   * The detail rows a popup shows, built from the engine's typed data: what the
   * feature requires, what ends it, and what it does. These were the stored
   * prose fields before, which is where "see class table" surfaced to a player.
   */
  const getFeatureDetailRows = (feature: any): { label: string; value: string }[] => {
    const resolved = resolvedFor(feature.id);
    if (!resolved) return [];
    const rows: { label: string; value: string }[] = [];
    const push = (key: string, fallback: string, value: unknown) => {
      if (value) rows.push({ label: t(key, fallback), value: String(value) });
    };

    if (resolved.gates.length > 0) {
      push("feature.requires", "Requires", resolved.gatesUnmet.length > 0 ? resolved.gatesUnmet.join(", ") : resolved.gates.join(", "));
    }
    if (resolved.targeting) {
      const range = resolved.targeting.range ? `${resolved.targeting.range.value} ${resolved.targeting.range.unit}` : null;
      push("feature.range", "Range", [range, resolved.targeting.shape, resolved.targeting.description].filter(Boolean).join(", "));
    }
    if (resolved.trigger) {
      push("feature.trigger", "Triggers on", triggerLabel(resolved.trigger) ?? resolved.trigger.event.replace(/_/g, " "));
    }
    if (resolved.duration) {
      push("feature.duration", "Duration", `${resolved.duration.value} ${t(`engine.unit.${resolved.duration.unit}`, resolved.duration.unit)}`);
    }
    if (resolved.effects.some((e) => e.kind === "restriction")) {
      const rules = resolved.effects.filter((e) => e.kind === "restriction").flatMap((e) => (e as any).rules as string[]);
      push("feature.restrictions", "Restrictions", rules.join(", "));
    }
    const damagers = resolved.effects.filter((e) => e.kind === "resistance" || e.kind === "immunity");
    if (damagers.length > 0) {
      push("feature.resistances", "Resists", damagers.map((e) => ((e as any).damageTypes ?? []) .join(", ")).join("; "));
    }
    push("feature.source", "Source", `${resolved.owner}${resolved.variant ? ` (${resolved.variant})` : ""} - ${resolved.effects.length} effect(s)`);
    return rows;
  };

  /**
   * Marking a feature used also spends whatever it costs, so the pool the badge
   * reads from reflects the spend. Un-marking gives it back, because the toggle
   * is a correction as much as an action.
   */
  const toggleFeatureUsed = (featureId: string) => {
    const current = character.featuresUsedThisTurn || [];
    const used = current.includes(featureId);
    const resolved = resolvedFor(featureId);
    const patch: Partial<Character> = {
      featuresUsedThisTurn: used ? current.filter((id) => id !== featureId) : [...current, featureId],
    };
    const delta = used ? 1 : -1;
    for (const cost of resolved?.resources ?? []) {
      // A cost the player sizes is spent through the stepper, not the toggle.
      if (cost.sized) continue;
      const field = poolFieldFor(cost.id);
      if (!field) continue;
      const held = (character[field] as number | undefined) ?? 0;
      (patch as Record<string, unknown>)[field] = Math.max(0, held + delta * cost.required);
    }
    onChange(patch);
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
          // "Active" came from the stored featureType string, which the engine
          // does not use. The engine's activation is the same fact with five
          // values instead of two, so a bonus action or reaction feature stops
          // reading as plain "Active" and loses its slot.
          const isActive = resolved !== undefined && resolved.activation !== "passive";
          const featureUsed = (character.featuresUsedThisTurn || []).includes(feature.id);
          const summary = summaryText || (feature.description || "").slice(0, 180);
          return (
            <div
              key={safeFeature.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSpendAmount(1);
                setSelectedFeature(feature);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedFeature(feature);
                  setSpendAmount(1);
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

                {/* Why this cannot be used right now. The resolver computes it;
                    without it a feature that cannot be taken looks simply dim. */}
                {resolved && !resolved.available && resolved.blockedBy && !resolved.used && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-paper-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)] mb-2">
                    {resolved.blockedBy}
                  </span>
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
                  <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 [&>p]:line-clamp-3">
                    <DiceText text={summary} />
                  </div>
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
          const selectedResolved = resolvedFor(selectedFeature.id);

          /**
           * A cost the player sizes, resolved against the pool the character
           * actually holds. `min` is the floor the rules set, and `max` is what
           * is left, because you cannot spend what you do not have.
           */
          const chosenCost = selectedResolved?.resources.find((r) => r.sized === true);
          const spendableCost = chosenCost
            ? {
                resource: chosenCost.id,
                min: Math.max(1, chosenCost.spendMin ?? 1),
                max: Math.max(1, chosenCost.available),
                pool: chosenCost.available,
              }
            : null;
          // A hit-point pool runs to 65, so a step of one would need 65 clicks.
          const spendStep = spendableCost && spendableCost.max > 20 ? 5 : 1;
          const sheetIsActive = selectedResolved !== undefined && selectedResolved.activation !== "passive";
          const sheetDuration =
            (selectedResolved?.duration ? `${selectedResolved.duration.value} ${selectedResolved.duration.unit}` : null) ||
            (sheetIsActive ? "Instantaneous" : "");
          return (
            <BottomSheet
              isOpen={!!selectedFeature}
              onClose={() => setSelectedFeature(null)}
              title={selectedFeature.name}
              showHeader={true}
            >
              <div className="px-4 py-4 space-y-3">
                {(selectedFeature.summary || "") && (
                  <div className="text-xs text-[var(--color-text-muted)] italic leading-relaxed"><DiceText text={selectedFeature.summary} /></div>
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
                    {/* The slot, not a two-way Active/Passive split. "Bonus
                        Action" and "Reaction" are the useful facts and both
                        used to collapse into "Active". */}
                    {selectedResolved
                      ? t(`engine.badge.${selectedResolved.activation}`, slotLabel(selectedResolved.activation))
                      : sheetIsActive
                        ? t("feature.active", "Active")
                        : t("feature.passive", "Passive")}
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
                {/* A cost the player sizes. Lay on Hands spends any number of its
                    pool and the target regains exactly that many, so the ceiling,
                    the remainder and the effect all come from the same number. */}
                {spendableCost && (
                  <div className="mb-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {t("feature.spend", "Spend")}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {t("feature.ofAvailable", { available: spendableCost.pool }, "{available} available")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={t("feature.spendLess", "Spend less")}
                        onClick={() => setSpendAmount((n) => Math.max(spendableCost.min, n - spendStep))}
                        disabled={spendAmount <= spendableCost.min}
                        className="h-7 w-7 shrink-0 rounded-full border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)] disabled:opacity-40"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">{spendAmount}</span>
                        <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">/ {spendableCost.max}</span>
                      </div>
                      <button
                        type="button"
                        aria-label={t("feature.spendMore", "Spend more")}
                        onClick={() => setSpendAmount((n) => Math.min(spendableCost.max, n + spendStep))}
                        disabled={spendAmount >= spendableCost.max}
                        className="h-7 w-7 shrink-0 rounded-full border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)] disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-muted)]">
                      {t("feature.spendHeals", { amount: spendAmount }, "Target regains {amount} hit point(s)")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const patch = spendFromPool(character, spendableCost.resource, spendAmount);
                        if (!patch) return;
                        onChange(patch);
                      }}
                      className="mt-2 w-full rounded-full bg-[var(--color-accent-indigo-500)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {t("feature.spendApply", "Use it")}
                    </button>
                  </div>
                )}

                {detailRows.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--color-border-muted)] pt-2">
                    {detailRows.map((row) => (
                      <div key={row.label}>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{row.label}</span>
                        <div className="text-sm text-[var(--color-text-primary)] leading-relaxed"><DiceText text={row.value} /></div>
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
