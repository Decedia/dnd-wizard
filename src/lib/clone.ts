import { computeDerivedStats, getHpBonusPerLevel, getMaxHpFromLevelHp, getModifier, type Character } from "./storage";
import { getStaticClass } from "./srd-client";
import { applySubclassFeatures, syncBaseFeatures } from "./character-creation";
import { syncGrantedSpells } from "./granted-spells";
import { choicesOf, isUnknownAsi, removeLevelPicks, type LevelPicks } from "./level-choices";
import { subclassLevelOf } from "./rebuild";
import { longRestPatch } from "./rest";

/** What the level-up wizard starts a clone with: the old picks of every level. */
export interface ClonePrefill {
  /** Each level's picks from the original (level 2 up). */
  picks: Record<number, LevelPicks>;
  /** HP gained at each level (level 2 up). */
  hp: Record<number, number>;
  /** The original's subclass, when it came after level 1. */
  subclass?: string;
  circleTerrain?: string;
  bonusCantrip?: string;
}

export interface CloneStart {
  /** The copy at level 1: creation picks, gear and story as the original. */
  base: Character;
  prefill: ClonePrefill;
  /** The level the copy levels back up to. */
  level: number;
}

/**
 * A copy of the character back at level 1, keeping everything from creation
 * (race, background, ability scores, level 1 class picks, gear, story), and
 * the picks of every later level so the level-up wizard can show them again.
 *
 * Picks the level log doesn't have (saves from before it) can't be taken off:
 * an ability increase from then stays, and so do spells from then. The wizard
 * doesn't ask those again (see LevelUpWizard `prefill`).
 */
export function cloneStart(original: Character, language = "en"): CloneStart {
  const level = original.level || 1;
  const picks = choicesOf(original);
  const { levelUpSnapshot: _snap, ...plain } = original;
  let next = { ...plain } as Character;

  const keptAsi: number[] = [];
  for (let lvl = level; lvl >= 2; lvl--) {
    const p = picks[lvl];
    if (!p) continue;
    if (isUnknownAsi(p.asi)) keptAsi.push(lvl);
    next = removeLevelPicks(next, lvl, p);
  }

  const subclassAt = subclassLevelOf(original);
  const dropSubclass = !!original.subclass && subclassAt > 1;
  if (dropSubclass) {
    next = {
      ...next,
      subclass: undefined,
      subclassIndex: undefined,
      features: (next.features || []).filter((f) => f.source !== "subclass"),
      featureSelections: Object.fromEntries(Object.entries(next.featureSelections || {}).filter(([key]) => !key.startsWith("subclass-feature-"))),
    };
  }

  // Saved HP per level carries the CON and Tough-style bonus of now; take that off
  // to get the die. Level 1 gets the copy's own CON back (older saves didn't keep
  // HP per level: level 1 is the hit die's top face).
  const hitDie = getStaticClass(original.class, original.ruleset)?.hitDie || 8;
  const perLevelNow = getModifier(original.con) + getHpBonusPerLevel(original);
  const die = (lvl: number) => (original.levelHp?.[lvl] ? original.levelHp[lvl] - perLevelNow : undefined);
  const firstHp = Math.max(1, (die(1) ?? hitDie) + getModifier(next.con) + getHpBonusPerLevel(next));
  const levelHp: Record<number, number> = { 1: firstHp };
  next = {
    ...next,
    level: 1,
    levelHp,
    maxHp: getMaxHpFromLevelHp(levelHp),
    currentHp: firstHp,
    appliedAsi: [...new Set([...(next.appliedAsi || []).filter((l) => l <= 1), ...keptAsi])],
    levelChoices: picks[1] ? { 1: picks[1] } : {},
  };
  next = syncBaseFeatures(next, language);
  next = applySubclassFeatures(next, language);
  next = syncGrantedSpells(next);
  next = { ...next, ...computeDerivedStats(next) };

  const hp: Record<number, number> = {};
  // The wizard counts new levels as rolled with the level 1 CON and no bonus.
  for (let lvl = 2; lvl <= level; lvl++) {
    const d = die(lvl);
    if (d !== undefined) hp[lvl] = Math.max(1, d + getModifier(next.con));
  }
  const later = Object.fromEntries(Object.entries(picks).filter(([lvl]) => Number(lvl) >= 2));
  const isLand = original.class === "Druid" && /land/i.test(original.subclass || "");
  return {
    base: next,
    level,
    prefill: {
      picks: later,
      hp,
      subclass: dropSubclass ? original.subclass : undefined,
      ...(isLand && dropSubclass ? { circleTerrain: original.circleTerrain || undefined, bonusCantrip: original.bonusCantrips?.[0] } : {}),
    },
  };
}

/** The clone the wizard finished: a new hero with its own id, rested and out of any fight. */
export function finishClone(leveled: Character, name: string): Character {
  const { levelUpSnapshot: _snap, ...plain } = leveled;
  const fresh = { ...plain } as Character;
  const level = fresh.level || 1;
  const rested: Character = {
    ...fresh,
    ...longRestPatch(fresh),
    hitDiceRemaining: level,
    exhaustionLevel: 0,
    temporaryHp: 0,
    activeStates: [],
  };
  return {
    ...rested,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastOpenedAt: undefined,
  };
}
