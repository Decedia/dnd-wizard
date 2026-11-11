import { computeDerivedStats, getHpBonusPerLevel, getMaxHpFromLevelHp, getModifier, isPreparationCaster, type Character } from "./storage";
import { getStaticEquipments, getStaticFeat, getStaticSpells } from "./srd-client";
import { applyFeatGrants, decodeFeatOptions, encodeFeatOptions, featAbilityIncreases, removeFeatGrants } from "./feat-grants";
import { applySubclassFeatures, syncBaseFeatures } from "./character-creation";
import { syncGrantedSpells } from "./granted-spells";
import { normalizeDescription } from "./level-up";
import { withSnapshot } from "./level-snapshot";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

/** The level-up wizard's ability score pick for one level. */
export interface AsiPick {
  mode: "single" | "double" | "feat";
  single?: AbilityKey;
  d1?: AbilityKey;
  d2?: AbilityKey;
  feat?: string;
  featOptions?: Record<string, string>;
}

/**
 * What the player picked at one level, as the level-up wizard saw it. A field
 * that is missing was not recorded (a save from before the log), so that
 * pick can't be changed from here; an empty list was recorded as "nothing".
 */
export interface LevelPicks {
  /** "unknown": an ability increase from before the log, which abilities it raised isn't known. */
  asi?: AsiPick | { mode: "unknown" };
  classFeatures?: Record<string, string>;
  subclassFeatures?: Record<string, string>;
  expertise?: string[];
  /** "Name:level" picks, cantrips included. */
  spells?: string[];
  magicalSecrets?: string[];
  subclassSpells?: string[];
  replacedSpell?: { name: string; level: number };
  invocations?: string[];
  replacedInvocation?: string;
}

export const isUnknownAsi = (asi: LevelPicks["asi"]): asi is { mode: "unknown" } => asi?.mode === "unknown";

/** +2 to one ability or +1 to two; a feat's increases are its own (see feat-grants). */
export function asiAllocation(asi: LevelPicks["asi"]): Partial<Record<AbilityKey, number>> {
  const out: Partial<Record<AbilityKey, number>> = {};
  if (!asi || isUnknownAsi(asi)) return out;
  if (asi.mode === "single" && asi.single) out[asi.single] = 2;
  if (asi.mode === "double") {
    if (asi.d1) out[asi.d1] = (out[asi.d1] || 0) + 1;
    if (asi.d2) out[asi.d2] = (out[asi.d2] || 0) + 1;
  }
  return out;
}

const levelKey = (key: string) => key.match(/^(class-feature|subclass-feature|expertise)-(\d+)-(.+)$/);

/**
 * Every level's picks: the saved log, with what older saves recorded filled
 * in (feature picks and feats carry their level in featureSelections).
 */
export function choicesOf(character: Character): Record<number, LevelPicks> {
  const out: Record<number, LevelPicks> = {};
  const at = (lvl: number) => (out[lvl] ||= {});
  for (const [key, value] of Object.entries(character.featureSelections || {})) {
    const m = levelKey(key);
    const v = (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
    if (m) {
      const [, kind, lvlStr, name] = m;
      const lvl = Number(lvlStr);
      if (kind === "class-feature") at(lvl).classFeatures = { ...at(lvl).classFeatures, [name]: v.join(", ") };
      else if (kind === "subclass-feature") at(lvl).subclassFeatures = { ...at(lvl).subclassFeatures, [name]: v.join(", ") };
      else at(lvl).expertise = [...(at(lvl).expertise || []), ...v];
      continue;
    }
    const feat = key.match(/^asi-feat-(\d+)$/);
    if (feat && v[0]) {
      const lvl = Number(feat[1]);
      at(lvl).asi = { mode: "feat", feat: v[0], featOptions: decodeFeatOptions(character.featureSelections?.[`${key}-options`]) };
    }
  }
  for (const lvl of character.appliedAsi || []) if (!at(lvl).asi) at(lvl).asi = { mode: "unknown" };
  for (const [lvlStr, picks] of Object.entries(character.levelChoices || {})) {
    const lvl = Number(lvlStr);
    out[lvl] = { ...out[lvl], ...picks };
  }
  for (const lvl of Object.keys(out).map(Number)) if (lvl > (character.level || 1)) delete out[lvl];
  return out;
}

/** True when a level has anything to change. */
export function hasPicks(picks: LevelPicks | undefined): boolean {
  if (!picks) return false;
  return !!(
    picks.asi ||
    Object.keys(picks.classFeatures || {}).length ||
    Object.keys(picks.subclassFeatures || {}).length ||
    picks.expertise?.length ||
    picks.spells?.length ||
    picks.magicalSecrets?.length ||
    picks.subclassSpells?.length ||
    picks.invocations?.length ||
    picks.replacedSpell ||
    picks.replacedInvocation
  );
}

const pickedSpells = (p: LevelPicks) =>
  [...(p.spells || []), ...(p.magicalSecrets || []), ...(p.subclassSpells || [])].map((entry) => {
    const i = entry.lastIndexOf(":");
    return { name: i > 0 ? entry.slice(0, i) : entry, level: i > 0 ? Number(entry.slice(i + 1)) : 1 };
  });

function toolNames(character: Character): Set<string> {
  return new Set(getStaticEquipments([], character.ruleset).filter((e: any) => e.equipment_category === "Tools").map((e: any) => e.name));
}

function spellRow(character: Character, name: string, level: number, language: string) {
  const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name === name);
  return { id: `spell-${name}-${level}`.replace(/\s+/g, "-"), name, level, source: "srd" as const, srdSpellName: name, description: normalizeDescription(spell?.description) };
}

/**
 * The character without one level's picks: ability increase or feat, feature
 * and expertise picks, spells learned there and invocations taken there. A
 * spell or invocation swapped out at that level comes back.
 */
export function removeLevelPicks(character: Character, level: number, picks: LevelPicks): Character {
  let next: Character = { ...character };
  const asi = picks.asi;
  if (asi && !isUnknownAsi(asi)) {
    if (asi.mode === "feat" && asi.feat) {
      const takenElsewhere = Object.entries(next.featureSelections || {}).some(([key, v]) => /^asi-feat-\d+$/.test(key) && key !== `asi-feat-${level}` && v?.[0] === asi.feat);
      if (!takenElsewhere) next = { ...next, features: (next.features || []).filter((f) => f.name !== asi.feat) };
      next = removeFeatGrants(next, asi.feat, asi.featOptions);
    } else {
      for (const [k, v] of Object.entries(asiAllocation(asi))) next = { ...next, [k]: Math.max(1, ((next[k as AbilityKey] as number) || 10) - (v || 0)) };
    }
  }
  if (asi) next = { ...next, appliedAsi: (next.appliedAsi || []).filter((l) => l !== level) };

  const prefixes = [`class-feature-${level}-`, `subclass-feature-${level}-`, `expertise-${level}-`];
  const removedValues: string[] = [];
  const featureSelections = Object.fromEntries(
    Object.entries(next.featureSelections || {}).filter(([key, v]) => {
      const gone = prefixes.some((p) => key.startsWith(p)) || key === `asi-feat-${level}` || key === `asi-feat-${level}-options`;
      if (gone && !key.startsWith("asi-feat")) removedValues.push(...(v || []).flatMap((s) => String(s).split(", ")));
      return !gone;
    })
  );
  const stillPicked = new Set(Object.values(featureSelections).flat().flatMap((s) => String(s).split(", ")));
  const tools = toolNames(next);
  next = {
    ...next,
    featureSelections,
    expertise: (next.expertise || []).filter((s) => !(picks.expertise || []).includes(s)),
    toolProficiencies: (next.toolProficiencies || []).filter((name) => !(tools.has(name) && removedValues.includes(name) && !stillPicked.has(name))),
  };

  const gone = pickedSpells(picks);
  if (gone.length || picks.replacedSpell) {
    const isGone = (s: { name: string; level: number }) => gone.some((g) => g.name === s.name && g.level === s.level);
    let spells = (next.spells || []).filter((s) => !isGone(s));
    const cantrips = (next.cantrips || []).filter((c) => !gone.some((g) => g.level === 0 && g.name === c.name));
    if (picks.replacedSpell && !spells.some((s) => s.name === picks.replacedSpell!.name)) {
      spells = [...spells, spellRow(next, picks.replacedSpell.name, picks.replacedSpell.level, "en")];
    }
    const kept = new Set(spells.map((s) => s.id));
    next = {
      ...next,
      spells,
      cantrips,
      preparedSpells: (next.preparedSpells || []).filter((id) => kept.has(id)),
      magicalSecretsSpells: (next.magicalSecretsSpells || []).filter((id) => kept.has(id)),
    };
  }

  if (picks.invocations?.length || picks.replacedInvocation) {
    const known = (next.featureSelections?.["warlock-invocations"] || []).filter((n) => !(picks.invocations || []).includes(n));
    if (picks.replacedInvocation && !known.includes(picks.replacedInvocation)) known.push(picks.replacedInvocation);
    next = { ...next, featureSelections: { ...next.featureSelections, "warlock-invocations": known } };
  }
  return next;
}

/** Puts one level's picks on the character: the reverse of removeLevelPicks. */
export function addLevelPicks(character: Character, level: number, picks: LevelPicks, language = "en"): Character {
  let next: Character = { ...character };
  const asi = picks.asi;
  if (asi && !isUnknownAsi(asi)) {
    if (asi.mode === "feat" && asi.feat) {
      const featData = getStaticFeat(asi.feat, next.ruleset, language);
      const name = featData?.name || asi.feat;
      if (!(next.features || []).some((f) => f.name === name)) {
        next = { ...next, features: [...(next.features || []), { id: `feat-${name}`.replace(/\s+/g, "-"), name, description: featData?.description || "", source: "custom" as const }] };
      }
      next = {
        ...next,
        featureSelections: { ...next.featureSelections, [`asi-feat-${level}`]: [name], [`asi-feat-${level}-options`]: encodeFeatOptions(asi.featOptions) },
      };
      next = applyFeatGrants(next, asi.feat, asi.featOptions);
    } else {
      for (const [k, v] of Object.entries(asiAllocation(asi))) next = { ...next, [k]: Math.min(20, ((next[k as AbilityKey] as number) || 10) + (v || 0)) };
    }
    next = { ...next, appliedAsi: [...new Set([...(next.appliedAsi || []), level])] };
  }

  const featureSelections = { ...next.featureSelections };
  for (const [name, value] of Object.entries(picks.classFeatures || {})) if (value) featureSelections[`class-feature-${level}-${name}`] = [value];
  for (const [name, value] of Object.entries(picks.subclassFeatures || {})) if (value) featureSelections[`subclass-feature-${level}-${name}`] = [value];
  for (const skill of picks.expertise || []) featureSelections[`expertise-${level}-${skill}`] = [skill];
  const pactBoon = picks.classFeatures?.["Pact Boon"];
  if (pactBoon) featureSelections["pact-boon"] = [pactBoon];
  if (picks.invocations?.length || picks.replacedInvocation) {
    const known = [...(featureSelections["warlock-invocations"] || [])].filter((n) => n !== picks.replacedInvocation);
    for (const n of picks.invocations || []) if (!known.includes(n)) known.push(n);
    featureSelections["warlock-invocations"] = known;
  }
  const tools = toolNames(next);
  const newTools = [...Object.values(picks.classFeatures || {}), ...Object.values(picks.subclassFeatures || {})].flatMap((v) => v.split(", ")).filter((n) => tools.has(n));
  next = {
    ...next,
    featureSelections,
    expertise: [...new Set([...(next.expertise || []), ...(picks.expertise || [])])],
    toolProficiencies: [...new Set([...(next.toolProficiencies || []), ...newTools])],
  };

  const added = pickedSpells(picks);
  if (added.length || picks.replacedSpell) {
    let spells = [...(next.spells || [])];
    const cantrips = [...(next.cantrips || [])];
    const newIds: string[] = [];
    for (const { name, level: lvl } of added) {
      if (lvl === 0 && !cantrips.some((c) => c.name === name)) cantrips.push({ id: `cantrip-${name}`.replace(/\s+/g, "-"), name });
      if (!spells.some((s) => s.name === name && s.level === lvl)) {
        const row = spellRow(next, name, lvl, language);
        spells.push(row);
        if (lvl > 0) newIds.push(row.id);
      }
    }
    if (picks.replacedSpell) spells = spells.filter((s) => !(s.name === picks.replacedSpell!.name && s.level === picks.replacedSpell!.level));
    const secrets = new Set((picks.magicalSecrets || []).concat(picks.subclassSpells || []));
    const secretIds = spells.filter((s) => secrets.has(`${s.name}:${s.level}`)).map((s) => s.id);
    const kept = new Set(spells.map((s) => s.id));
    const prepares = next.class !== "Wizard" && isPreparationCaster(next);
    next = {
      ...next,
      spells,
      cantrips,
      preparedSpells: [...new Set([...(next.preparedSpells || []).filter((id) => kept.has(id)), ...(prepares ? newIds : [])])],
      magicalSecretsSpells: [...new Set([...(next.magicalSecretsSpells || []), ...secretIds])],
    };
  }
  return next;
}

/**
 * HP per level follows CON and Tough-style bonuses: when a changed pick moves
 * either, every level moves by the difference.
 */
function hpAfterChange(before: Character, after: Character): Partial<Character> {
  if (after.isCustomHp) return {};
  const delta = getModifier(after.con) + getHpBonusPerLevel(after) - (getModifier(before.con) + getHpBonusPerLevel(before));
  if (!delta) return {};
  const level = after.level || 1;
  const levelHp = after.levelHp && Object.keys(after.levelHp).length > 0
    ? Object.fromEntries(Object.entries(after.levelHp).map(([lvl, hp]) => [lvl, Math.max(1, (hp || 0) + delta)]))
    : null;
  const maxHp = Math.max(level, levelHp ? getMaxHpFromLevelHp(levelHp) : (after.maxHp || 0) + delta * level);
  const currentHp = Math.max(0, Math.min(maxHp, (after.currentHp || 0) + (maxHp - (after.maxHp || 0))));
  return { ...(levelHp ? { levelHp } : {}), maxHp, currentHp };
}

/**
 * One level's picks swapped for new ones. Level, HP, gear and every other
 * level's picks stay; features, granted spells and numbers are worked out
 * again, and the change can be undone.
 */
export function changeLevelPicks(before: Character, level: number, oldPicks: LevelPicks, newPicks: LevelPicks, language = "en"): Character {
  let next = removeLevelPicks(before, level, oldPicks);
  next = addLevelPicks(next, level, newPicks, language);
  next = { ...next, levelChoices: { ...(before.levelChoices || {}), [level]: newPicks } };
  next = { ...next, ...hpAfterChange(before, next) };
  next = applySubclassFeatures(next, language);
  next = syncGrantedSpells(next);
  next = syncBaseFeatures(next, language);
  return withSnapshot(before, { ...next, ...computeDerivedStats(next) }, "choice");
}

/**
 * What the level-up wizard sees to ask one level again: the character one
 * level below it, without that level's picks. Everything else stays.
 */
export function levelRewind(character: Character, level: number, picks: LevelPicks): Character {
  const stripped = removeLevelPicks(character, level, picks);
  return { ...stripped, level: Math.max(1, level - 1) };
}

/** The ability increases from level-ups (not race or creation), for a class change. */
export function levelUpIncreases(character: Character): Partial<Record<AbilityKey, number>> {
  const out: Partial<Record<AbilityKey, number>> = {};
  for (const picks of Object.values(choicesOf(character))) {
    const asi = picks.asi;
    if (!asi || isUnknownAsi(asi)) continue;
    const add = asi.mode === "feat" && asi.feat ? featAbilityIncreases(asi.feat, asi.featOptions) : asiAllocation(asi);
    for (const [k, v] of Object.entries(add)) out[k as AbilityKey] = (out[k as AbilityKey] || 0) + (v || 0);
  }
  return out;
}
