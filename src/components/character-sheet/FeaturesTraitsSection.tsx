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
import { FEATURE_GROUP_ORDER, getFeatPicks, getFeaturePicks, matchesFeatureSearch, poolMax, type FeatureGroup } from "@/lib/feature-groups";

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
  // The spend modal: which feature, aimed at whom, and what it did last time.
  const [spendTargetIsSelf, setSpendTargetIsSelf] = useState(true);
  const [spendTargetName, setSpendTargetName] = useState("");
  const [spendReceipt, setSpendReceipt] = useState<string | null>(null);
  // Which feature the spend sheet is open for, if any.
  const [spendModalFeature, setSpendModalFeature] = useState<any | null>(null);
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0);
  // The list's own controls: filter chip, search text and the ⋯ menu.
  const [featureFilter, setFeatureFilter] = useState<"all" | "use" | "passive" | "race" | "feat">("all");
  const [featureQuery, setFeatureQuery] = useState("");
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
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
      // Optional class features can also add skills, languages and spells.
      onChange({ features: synced.features, skills: synced.skills, expertise: synced.expertise, languages: synced.languages, spells: synced.spells });
      await saveCharacter(synced);

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
  /**
   * A cost the player sizes, resolved against the pool the character actually
   * holds. `min` is the floor the rules set and `max` is what is left, because
   * you cannot spend what you do not have.
   */
  const spendModalResolved = spendModalFeature ? resolvedFor(spendModalFeature.id) : undefined;
  const chosenCost = spendModalResolved?.resources.find((r) => r.sized === true);
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

  // ---- Grouped list: Use first, then class, subclass, race, feats, other ----
  const missingAll = useMemo(() => {
    try {
      return getMissingFeatureChoices(character, language);
    } catch {
      return [];
    }
  }, [character, language]);
  // A later pick ("Path of the Kensei: 6th-level Weapon") belongs to its feature.
  const missingFor = (name: string) => missingAll.filter((m) => m.featureName === name || m.featureName.split(":")[0].trim() === name);
  const shownNames = new Set(enrichedFeatures.map((f) => f.name));
  const missingElsewhere = missingAll.filter((m) => !shownNames.has(m.featureName) && !shownNames.has(m.featureName.split(":")[0].trim()));
  const openChoices = (choices: typeof missingAll) => {
    if (choices.length === 0) return;
    setMissingChoices(choices);
    setCurrentChoiceIndex(0);
  };

  const rows = enrichedFeatures.map((feature) => {
    const resolved = resolvedFor(feature.id);
    const kind = sourceKind(feature);
    const featInfo = getFeatPicks(character, feature.name);
    const isFeat = featInfo.taken || ((kind === "feat" || kind === "custom" || !kind) && feats.some((f) => f.name === feature.name));
    const usable = resolved !== undefined && resolved.activation !== "passive";
    const home: FeatureGroup = isFeat ? "feat" : kind === "class" || kind === "subclass" || kind === "race" ? kind : "other";
    const level = isFeat ? featInfo.level : getFeatureLevel(feature);
    const picks = isFeat ? featInfo.picks : home === "class" || home === "subclass" ? getFeaturePicks(character, feature.name) : [];
    const levelLabel = level !== null ? t("feature.levelShort", { level }, "Lv {level}") : "";
    const origin =
      home === "class" ? `${character.class} ${level ?? ""}`.trim()
      : home === "subclass" ? `${character.subclass} ${level ?? ""}`.trim()
      : home === "race" ? t("feature.racial", "Racial")
      : home === "feat" ? [t("features.feat", "Feat"), levelLabel].filter(Boolean).join(" · ")
      : "";
    const poolCost = (resolved?.resources ?? []).find((r) => r.tracked && !r.sized && poolFieldFor(r.id));
    const poolField = poolCost ? poolFieldFor(poolCost.id) : null;
    const poolTop = poolField ? poolMax(character, poolField) : null;
    const pool = poolField && poolTop ? { field: poolField, current: Math.min(poolTop, Math.max(0, ((character as any)[poolField] as number) ?? 0)), max: poolTop } : null;
    const summary = ((feature as any).summary || resolved?.summary || (feature.description || "").slice(0, 160)) as string;
    return { feature, resolved, group: usable ? ("use" as FeatureGroup) : home, home, level, levelLabel, origin, picks, pool, summary, missing: missingFor(feature.name), usable };
  });
  type Row = (typeof rows)[number];

  const filteredRows = rows.filter((r) => {
    if (!matchesFeatureSearch(featureQuery, [r.feature.name, r.summary, ...r.picks])) return false;
    if (featureFilter === "all") return true;
    if (featureFilter === "use") return r.usable;
    if (featureFilter === "passive") return !r.usable;
    return r.home === featureFilter;
  });
  const homeOrder = { class: 0, subclass: 1, race: 2, feat: 3, other: 4, use: 5 } as const;
  const groups = FEATURE_GROUP_ORDER.map((g) => {
    const items = filteredRows
      .filter((r) => r.group === g)
      .sort((a, b) => (g === "use" ? homeOrder[a.home] - homeOrder[b.home] : 0) || (a.level ?? 0) - (b.level ?? 0) || a.feature.name.localeCompare(b.feature.name));
    const title =
      g === "use" ? t("features.groupUse", "Use")
      : g === "class" ? character.class || t("features.groupClass", "Class")
      : g === "subclass" ? character.subclass || t("features.groupSubclass", "Subclass")
      : g === "race" ? character.race || t("features.groupRace", "Race")
      : g === "feat" ? t("features.groupFeats", "Feats")
      : t("features.groupOther", "Other");
    const sub =
      g === "use" ? (items.some((r) => r.pool) ? t("features.tapToSpend", "Tap a dot to spend") : "")
      : g === "class" || g === "subclass" ? t("features.byLevel", "By level")
      : g === "feat" ? t("features.featCount", { count: items.length }, "{count} taken")
      : "";
    return { id: g, title, sub, items };
  }).filter((g) => g.items.length > 0);

  const setPool = (field: keyof Character, value: number) => onChange({ [field]: value } as Partial<Character>);

  const openFeature = (feature: any) => {
    setSpendAmount(1);
    setSelectedFeature(feature);
  };

  const filterChips: { id: typeof featureFilter; label: string }[] = [
    { id: "all", label: t("features.filterAll", "All") },
    { id: "use", label: t("features.filterUsable", "Usable") },
    { id: "passive", label: t("features.filterPassive", "Passive") },
    { id: "race", label: t("features.filterRace", "Race") },
    { id: "feat", label: t("features.filterFeats", "Feats") },
  ];

  const renderRow = (r: Row, index: number) => {
    const { feature, resolved, pool } = r;
    const featureUsed = (character.featuresUsedThisTurn || []).includes(feature.id);
    const badges = r.group === "use" ? getFeatureBadges(feature) : [];
    return (
      <div key={feature.id} className={index === 0 ? "" : "border-t border-[var(--color-border-muted)]"}>
        <button
          type="button"
          onClick={() => openFeature(feature)}
          className="block w-full text-left px-3.5 pt-3 pb-2 active:bg-[var(--color-paper-muted)] transition-colors"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[15px] text-[var(--color-text-primary)] leading-tight">{feature.name}</span>
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] whitespace-nowrap">
              {r.group === "use" ? r.origin : r.home === "race" ? "" : r.levelLabel}
            </span>
          </span>
          {r.summary && (
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-text-secondary)] line-clamp-2">{r.summary}</span>
          )}
          {badges.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {badges.map((badge, i) => (
                <span key={i} style={getStatBadgeStyle(badge)} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border">{badge}</span>
              ))}
            </span>
          )}
          {r.group !== "use" && r.picks.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {r.picks.map((p) => (
                <span key={p} className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-info-50)] text-[var(--color-info-700)]">{p}</span>
              ))}
            </span>
          )}
          {(feature as any).showInSheet === false && (
            <span className="mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {t("sheet.referenceOnly")}
            </span>
          )}
          {resolved && !resolved.available && resolved.blockedBy && !resolved.used && r.group === "use" && !pool && (
            <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">{resolved.blockedBy}</span>
          )}
        </button>
        {r.missing.length > 0 && (
          <div className="px-3.5 pb-2">
            <button
              type="button"
              onClick={() => openChoices(r.missing)}
              className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 rounded-full text-xs font-semibold bg-[var(--color-warning-50,#FFF1E6)] text-[var(--color-warning-700,#9A3412)] border border-[var(--color-warning-200,#FED7AA)]"
            >
              {t("features.missingPick", { name: r.missing[0].featureName }, "Pick: {name}")}
            </button>
          </div>
        )}
        {r.group === "use" && (
          <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
            {pool ? (
              pool.max <= 8 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: pool.max }, (_, i) => {
                    const spent = i >= pool.current;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={t(spent ? "features.restoreUse" : "features.spendUse", { name: feature.name }, spent ? "Restore a use of {name}" : "Spend a use of {name}")}
                        onClick={() => setPool(pool.field, spent ? pool.current + 1 : pool.current - 1)}
                        className={`h-8 w-8 rounded-full transition-colors ${
                          spent
                            ? "border-[1.5px] border-dashed border-[var(--color-border-strong,#B8B2A7)] bg-[var(--color-surface)]"
                            : "border-[1.5px] border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-500)]"
                        }`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={t("features.spendUse", { name: feature.name }, "Spend a use of {name}")} onClick={() => setPool(pool.field, Math.max(0, pool.current - 1))} className="h-8 w-8 rounded-full border border-[var(--color-border)] font-bold text-[var(--color-text-secondary)]">−</button>
                  <button type="button" aria-label={t("features.restoreUse", { name: feature.name }, "Restore a use of {name}")} onClick={() => setPool(pool.field, Math.min(pool.max, pool.current + 1))} className="h-8 w-8 rounded-full border border-[var(--color-border)] font-bold text-[var(--color-text-secondary)]">+</button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => toggleFeatureUsed(feature.id)}
                className={`flex items-center gap-1 min-h-[32px] px-2.5 text-xs font-bold rounded-full border transition-colors ${
                  featureUsed
                    ? "border-[var(--color-border)] text-[var(--color-text-muted)]"
                    : "border-[var(--color-accent-indigo-500)] text-[var(--color-accent-indigo-600)]"
                }`}
                title={featureUsed ? t("spells.clickToMarkUnused") : t("spells.clickToMarkUsed")}
              >
                <Sparkle className="h-4 w-4" />
                {featureUsed ? t("spells.used") : t("spells.use")}
              </button>
            )}
            {pool && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {t("features.usesLeft", { current: pool.current, max: pool.max }, "{current} of {max} left")}
              </span>
            )}
          </div>
        )}
      </div>
    );
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
      <div className="relative">
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 h-11 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-[var(--color-text-muted)]"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span className="sr-only">{t("features.search", "Search features")}</span>
            <input
              type="search"
              value={featureQuery}
              onChange={(e) => setFeatureQuery(e.target.value)}
              placeholder={t("features.search", "Search features")}
              className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
            />
          </label>
          {editMode && (
            <button
              type="button"
              aria-label={t("features.moreActions", "More actions")}
              aria-expanded={featureMenuOpen}
              onClick={() => setFeatureMenuOpen((v) => !v)}
              className="h-11 w-11 shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-primary)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
            </button>
          )}
        </div>
        {featureMenuOpen && editMode && (
          <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => { setFeatureMenuOpen(false); addItem(); }}
              className="flex w-full items-center gap-2 min-h-[44px] px-3 rounded-lg text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-paper-muted)]"
            >
              <Plus size={16} />
              {t("button.addFeature", "Add Feature")}
            </button>
            <button
              type="button"
              disabled={syncing}
              onClick={() => { setFeatureMenuOpen(false); handleSyncFeatures(); }}
              className="flex w-full items-center min-h-[44px] px-3 rounded-lg text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-paper-muted)] disabled:opacity-60"
            >
              {syncing ? t("features.syncing") : t("features.syncWithSrd")}
            </button>
          </div>
        )}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={featureFilter === chip.id}
              onClick={() => setFeatureFilter(chip.id)}
              className={`shrink-0 min-h-[36px] px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                featureFilter === chip.id
                  ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-500)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {missingElsewhere.length > 0 && (
        <button
          type="button"
          onClick={() => openChoices(missingElsewhere)}
          className="mt-3 w-full min-h-[44px] px-3 rounded-xl text-left text-sm font-semibold bg-[var(--color-warning-50,#FFF1E6)] text-[var(--color-warning-700,#9A3412)] border border-[var(--color-warning-200,#FED7AA)]"
        >
          {t("features.picksMissing", { count: missingElsewhere.length }, "{count} pick(s) still to make")}
        </button>
      )}

      {groups.map((g) => (
        <section key={g.id} className="mt-5">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{g.title}</h3>
            {g.sub && <span className="text-xs text-[var(--color-text-muted)]">{g.sub}</span>}
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {g.items.map((r, i) => renderRow(r, i))}
          </div>
        </section>
      ))}
      {groups.length === 0 && (
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">{t("features.noMatch", "No features match.")}</p>
      )}
        {/* Spending a pool: amount and target, then a receipt. The sheet has no
            party, so a target is either the character or a name the player types
            - inventing a party model here would be a larger change than this
            feature is asking for. */}
        {spendModalFeature && spendableCost && (
          <BottomSheet
            isOpen={!!spendModalFeature}
            onClose={() => setSpendModalFeature(null)}
            title={spendModalFeature.name}
            showHeader={true}
          >
            <div className="space-y-3 px-4 py-4">
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <div className="flex items-center justify-between">
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
                    className="h-8 w-8 shrink-0 rounded-full border border-[var(--color-border)] text-base font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)] disabled:opacity-40"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">{spendAmount}</span>
                    <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">/ {spendableCost.max}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={t("feature.spendMore", "Spend more")}
                    onClick={() => setSpendAmount((n) => Math.min(spendableCost.max, n + spendStep))}
                    disabled={spendAmount >= spendableCost.max}
                    className="h-8 w-8 shrink-0 rounded-full border border-[var(--color-border)] text-base font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)] disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t("feature.spendTarget", "Target")}
                </span>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSpendTargetIsSelf(true)}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      spendTargetIsSelf
                        ? "border-[var(--color-accent-indigo-500)] text-[var(--color-text-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {t("feature.spendSelf", character.name || "Self")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendTargetIsSelf(false)}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      !spendTargetIsSelf
                        ? "border-[var(--color-accent-indigo-500)] text-[var(--color-text-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {t("feature.spendOther", "Someone else")}
                  </button>
                </div>
                {!spendTargetIsSelf && (
                  <input
                    type="text"
                    value={spendTargetName}
                    onChange={(e) => setSpendTargetName(e.target.value)}
                    placeholder={t("feature.spendTargetName", "Name")}
                    className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-paper)] px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-indigo-500)]"
                  />
                )}
              </div>

              {spendReceipt && (
                <p className="rounded-[var(--radius-sm)] border border-[var(--color-success-600)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
                  {spendReceipt}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSpendModalFeature(null)}
                  className="flex-1 rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)]"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  disabled={!spendTargetIsSelf && spendTargetName.trim().length === 0}
                  onClick={() => {
                    const patch = spendFromPool(character, spendableCost.resource, spendAmount);
                    if (!patch) return;
                    onChange(patch);
                    const who = spendTargetIsSelf ? character.name || t("feature.spendSelf", "Self") : spendTargetName.trim();
                    setSpendReceipt(
                      t(
                        "feature.spendDone",
                        { name: spendModalFeature.name, amount: spendAmount, pool: spendableCost.pool, target: who },
                        "{name}: spent {amount} of {pool} on {target}"
                      )
                    );
                  }}
                  className="flex-1 rounded-full bg-[var(--color-accent-indigo-500)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {t("feature.spendApply", "Use it")}
                </button>
              </div>
            </div>
          </BottomSheet>
        )}
        {popupFeat && <FeatModal feat={popupFeat} onClose={() => setPopupFeatName(null)} />}
        {selectedFeature && (() => {
          const badges = getFeatureBadges(selectedFeature);
          const detailRows = getFeatureDetailRows(selectedFeature);

          const sheetLevel = getFeatureLevel(selectedFeature);
          const source = selectedFeature.source && typeof selectedFeature.source === "object" ? selectedFeature.source : null;
          const selectedResolved = resolvedFor(selectedFeature.id);

          // The card's own view of a sized cost, from the feature in this popup.
          const sized = selectedResolved?.resources.find((r) => r.sized === true);
          const popupSizedCost = sized
            ? {
                resource: sized.id,
                min: Math.max(1, sized.spendMin ?? 1),
                max: Math.max(1, sized.available),
                pool: sized.available,
              }
            : null;
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
                {/* A cost the player sizes - Lay on Hands spends any number of its
                    pool and the target regains exactly that many. Pressing opens
                    a sheet to set the amount and the target, rather than applying
                    a guess straight from a card. */}
                {popupSizedCost && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpendTargetIsSelf(true);
                      setSpendTargetName("");
                      setSpendReceipt(null);
                      setSpendModalFeature(selectedFeature);
                      setSpendAmount(Math.max(popupSizedCost.min, Math.min(popupSizedCost.max, spendAmount)));
                    }}
                    className="mb-2 flex w-full items-center justify-between gap-2 rounded-full border border-[var(--color-accent-indigo-500)] bg-[var(--color-bg)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-paper-muted)]"
                  >
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t("feature.spendFrom", { available: popupSizedCost.pool }, "{available} available")}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      {t("feature.spendChoose", "Choose an amount")}
                    </span>
                  </button>
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
