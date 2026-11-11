"use client";

import { getTakenSpellNames } from "@/lib/taken-spells";
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
import { ruleFor, ruleKey, usesMax, type FeatureRule, type PoolField } from "@/data/turn-features";
import { featureRounds, roundsText } from "@/lib/timers";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { ResourceToken } from "@/components/ResourceToken";
import { RichText, RichInline } from "@/components/RichText";
import { FEATURE_GROUP_ORDER, getAsiFeats, getFeatPicks, getFeaturePicks, matchesFeatureSearch, poolMax, type FeatureGroup } from "@/lib/feature-groups";

/**
 * The kind of a stored feature's source, accepting both the string form written
 * today ("race") and the object form older saves carry ({type: "race"}). The
 * SRD lookups below are gated on this, and an old character's object source
 * failed every comparison, so no translation was found.
 */
function sourceKind(feature: any): string | null {
  const source = feature?.source;
  if (typeof source === "string") return source;
  if (source && typeof source === "object" && typeof source.type === "string") return source.type;
  return null;
}


interface FeaturesTraitsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function FeaturesTraitsSection({ character, onChange, editMode = true }: FeaturesTraitsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
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

  // A feature gained more than once (Ability Score Improvement at 4, 8, ...) is one row.
  const visibleFeatures = useMemo(() => {
    const seen = new Set<string>();
    return sortedFeatures.filter((f) => {
      const key = `${f.source ?? ""}|${f.name}`;
      if (!f.id || !f.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sortedFeatures]);

  const enrichedFeatures = useMemo(() => {
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

        // No mechanic text is appended to the summary; the badge row shows it.
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
          source: srdSource ?? existing.source ?? derivedSource ?? null,
          book: book ?? (existing as any).book ?? null,
        };
      });
    } catch {
      return visibleFeatures;
    }
  }, [visibleFeatures, character, feats, language]);

  /**
   * What a feature takes and spends, from the hand-checked table the turn
   * helper uses (src/data/turn-features.ts), so the two always agree. A
   * feature with no rule is always on and lists under its own group.
   */
  const ruleOf = (feature: { name?: string }): FeatureRule | undefined => (feature.name ? ruleFor(character, feature.name) : undefined);

  const slotOf = (rule: FeatureRule) =>
    rule.bonusWith && (character.features || []).some((f) => rule.bonusWith!.test(f.name || "")) ? "bonus" : rule.slot;

  type Track = { kind: "pool"; field: PoolField; current: number; max: number } | { kind: "uses"; key: string; current: number; max: number };

  /** What a feature spends, as dots: a pool the sheet tracks, or the feature's own uses per rest. */
  const trackOf = (rule: FeatureRule | undefined): Track | null => {
    if (rule?.pool) {
      const max = poolMax(character, rule.pool.field);
      if (!max) return null;
      return { kind: "pool", field: rule.pool.field, current: Math.min(max, Math.max(0, Number(character[rule.pool.field]) || 0)), max };
    }
    if (rule?.uses) {
      const key = ruleKey(rule);
      const max = usesMax(rule, character);
      return { kind: "uses", key, current: Math.max(0, max - (character.featureUses?.[key] ?? 0)), max };
    }
    return null;
  };

  const setTrack = (track: Track, value: number) => {
    const left = Math.max(0, Math.min(track.max, value));
    if (track.kind === "pool") onChange({ [track.field]: left } as Partial<Character>);
    else onChange({ featureUses: { ...(character.featureUses || {}), [track.key]: track.max - left } });
  };

  /** A pool the player spends any amount of (Lay on Hands), with what is left. */
  const sizedPoolOf = (feature: { name?: string } | null) => {
    const field = feature ? ruleOf(feature)?.variablePool : undefined;
    if (!field) return null;
    const left = Math.max(0, Number(character[field]) || 0);
    return left > 0 ? { field, min: 1, max: left, pool: left } : null;
  };
  const spendableCost = sizedPoolOf(spendModalFeature);
  // A hit-point pool runs to 100, so a step of one would need 100 clicks.
  const spendStep = spendableCost && spendableCost.max > 20 ? 5 : 1;

  const openSpend = (feature: any) => {
    const cost = sizedPoolOf(feature);
    if (!cost) return;
    setSelectedFeature(null);
    setSpendTargetIsSelf(true);
    setSpendTargetName("");
    setSpendReceipt(null);
    setSpendModalFeature(feature);
    setSpendAmount(Math.max(cost.min, Math.min(cost.max, spendAmount)));
  };

  /** How long a feature lasts once used, as "Lasts 1 min". */
  const lastsText = (feature: { name?: string }) => {
    const rounds = feature.name ? featureRounds(character, feature.name) : null;
    if (!rounds) return null;
    const span = roundsText(rounds);
    return t("turn.lasts", { time: t(`timer.span.${span.unit}`, { n: span.n }, `{n} ${span.unit}`) }, "Lasts {time}");
  };

  const getFeatureBadges = (feature: any): string[] => {
    const rule = ruleOf(feature);
    if (!rule) return [];
    const slot = slotOf(rule);
    const out = [t(`turn.slot.${slot}`, slot)];
    if (rule.when) out.push(t(`turn.when.${rule.when}`, rule.when));
    if (rule.spellSlot) out.push(t("feature.usesSpellSlot", "Spends a spell slot"));
    const lasts = lastsText(feature);
    if (lasts) out.push(lasts);
    return out;
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

  /** Marks a feature used this turn, or unmarks it. What it spends is tracked by its dots. */
  const toggleFeatureUsed = (featureId: string) => {
    const current = character.featuresUsedThisTurn || [];
    const used = current.includes(featureId);
    onChange({ featuresUsedThisTurn: used ? current.filter((id) => id !== featureId) : [...current, featureId] });
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
    const rule = ruleOf(feature);
    const kind = sourceKind(feature);
    const featInfo = getFeatPicks(character, feature.name);
    const isFeat = featInfo.taken || ((kind === "feat" || kind === "custom" || !kind) && feats.some((f) => f.name === feature.name));
    const usable = rule !== undefined;
    const home: FeatureGroup = isFeat ? "feat" : kind === "class" || kind === "subclass" || kind === "race" ? kind : "other";
    const level = isFeat ? featInfo.level : getFeatureLevel(feature);
    const picks = isFeat
      ? featInfo.picks
      : feature.name === "Ability Score Improvement" || feature.id === "base-class-Ability-Score-Improvement"
        ? getAsiFeats(character).map((a) => `${t("feature.levelShort", { level: a.level }, "Lv {level}")}: ${a.feat}`)
        : home === "class" || home === "subclass" ? getFeaturePicks(character, feature.name) : [];
    const levelLabel = level !== null ? t("feature.levelShort", { level }, "Lv {level}") : "";
    const origin =
      home === "class" ? `${character.class} ${level ?? ""}`.trim()
      : home === "subclass" ? `${character.subclass} ${level ?? ""}`.trim()
      : home === "race" ? t("feature.racial", "Racial")
      : home === "feat" ? [t("features.feat", "Feat"), levelLabel].filter(Boolean).join(" · ")
      : "";
    const pool = trackOf(rule);
    const summary = ((feature as any).summary || (feature.description || "").slice(0, 160)) as string;
    // Feats always list under Feats, with their spend controls, so every feat taken shows there.
    return { feature, group: usable && home !== "feat" ? ("use" as FeatureGroup) : home, home, level, levelLabel, origin, picks, pool, summary, missing: missingFor(feature.name), usable };
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
    const { feature, pool } = r;
    const sizedField = ruleOf(feature)?.variablePool;
    const sizedMax = sizedField ? poolMax(character, sizedField) : null;
    const sizedPool = sizedField && sizedMax ? { current: Math.max(0, Number(character[sizedField]) || 0), max: sizedMax } : null;
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
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-text-secondary)] line-clamp-2"><RichInline text={r.summary} /></span>
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
            {sizedPool ? (
              <button type="button" className="btn btn-secondary" disabled={!sizedPoolOf(feature)} onClick={() => openSpend(feature)}>
                {t("feature.spendChoose", "Choose an amount")}
              </button>
            ) : pool ? (
              pool.max <= 8 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: pool.max }, (_, i) => {
                    const spent = i >= pool.current;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={t(spent ? "features.restoreUse" : "features.spendUse", { name: feature.name }, spent ? "Restore a use of {name}" : "Spend a use of {name}")}
                        onClick={() => setTrack(pool, spent ? pool.current + 1 : pool.current - 1)}
                        className="rounded-full p-0.5 transition-transform active:scale-90"
                      >
                        <ResourceToken resource={pool.kind === "pool" ? pool.field : undefined} filled={!spent} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ResourceToken resource={pool.kind === "pool" ? pool.field : undefined} filled={pool.current > 0} />
                  <button type="button" aria-label={t("features.spendUse", { name: feature.name }, "Spend a use of {name}")} disabled={pool.current <= 0} onClick={() => setTrack(pool, pool.current - 1)} className="btn btn-secondary">−</button>
                  <button type="button" aria-label={t("features.restoreUse", { name: feature.name }, "Restore a use of {name}")} disabled={pool.current >= pool.max} onClick={() => setTrack(pool, pool.current + 1)} className="btn btn-secondary">+</button>
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
            {(pool || sizedPool) && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {t("features.usesLeft", { current: pool ? pool.current : sizedPool!.current, max: pool ? pool.max : sizedPool!.max }, "{current} of {max} left")}
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
                    {character.name || t("feature.spendSelf", "Self")}
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
                    const spent = Math.max(1, Math.min(spendableCost.max, spendAmount));
                    onChange({ [spendableCost.field]: spendableCost.pool - spent } as Partial<Character>);
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
          const sheetLevel = getFeatureLevel(selectedFeature);
          const source = selectedFeature.source && typeof selectedFeature.source === "object" ? selectedFeature.source : null;
          const popupSizedCost = sizedPoolOf(selectedFeature);
          return (
            <BottomSheet
              isOpen={!!selectedFeature}
              onClose={() => setSelectedFeature(null)}
              title={selectedFeature.name}
              showHeader={true}
            >
              <div className="px-4 py-4 space-y-3">
                {(selectedFeature.summary || "") && (
                  <div className="text-xs text-[var(--color-text-muted)] italic leading-relaxed"><RichText text={selectedFeature.summary} /></div>
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
                <RichText text={selectedFeature.description || ""} />
                <div className="flex flex-wrap gap-2 pt-1">
                  {sheetLevel !== null && (
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      {t("feature.levelN", { level: sheetLevel }, "Level {level}")}
                    </span>
                  )}
                  {!ruleOf(selectedFeature) && (
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                      {t("feature.passive", "Passive")}
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
                    onClick={() => openSpend(selectedFeature)}
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
           takenSpells={getTakenSpellNames(character)}
         />
       )}
    </SectionCard>
  );
}
