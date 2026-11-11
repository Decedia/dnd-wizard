import { applyFeatGrants, decodeFeatOptions, FEAT_FIXED_GRANTS } from "./feat-grants";
import { getStaticClass } from "./srd-client";
import { computeDerivedStats, getHpBonusPerLevel, getMaxHpFromLevelHp, getModifier, type Character } from "./storage";

/** Bump when a new one-time upgrade step is added below. */
export const SAVE_VERSION = 2;

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

/**
 * Brings a character saved by an older version of the app up to date, once.
 * Each step only changes numbers that match what the old code saved, so a
 * character that is already right comes through unchanged.
 */
export function upgradeSave(character: Character): Character {
  if ((character.saveVersion ?? 0) >= SAVE_VERSION) return character;
  const from = character.saveVersion ?? 0;
  let next = { ...character };
  if (from < 1) {
    next = restoreExhaustionHalvedHp(next);
    next = addMissingHpBonus(next);
    next = keepTypedSpeed(next);
    next = addMissingFeatGrants(next);
  }
  if (from < 2) next = addLevelUpExpertise(next);
  return { ...next, saveVersion: SAVE_VERSION };
}

/** Per-level HP for every level 1..level, or null when some are missing. */
function fullLevelHp(c: Character): Record<number, number> | null {
  const levelHp = c.levelHp || {};
  for (let lvl = 1; lvl <= (c.level || 1); lvl++) if (typeof levelHp[lvl] !== "number") return null;
  return levelHp;
}

/**
 * Exhaustion 4 used to halve the saved max HP, and halve it again on every
 * pass. It now halves a separate effective max HP, so a max HP that is the
 * level total halved one to three times goes back to the total.
 */
function restoreExhaustionHalvedHp(c: Character): Character {
  if (c.isCustomHp) return c;
  const levelHp = fullLevelHp(c);
  if (!levelHp) return c;
  const total = getMaxHpFromLevelHp(levelHp);
  const max = c.maxHp || 0;
  if (max <= 0 || max >= total) return c;
  let halved = total;
  for (let i = 0; i < 3; i++) {
    halved = Math.floor(halved / 2);
    if (max === halved) return { ...c, maxHp: total, currentHp: Math.min(total, c.currentHp || 0) };
  }
  return c;
}

/**
 * Tough, Dwarven Toughness and Draconic Resilience used to add HP only from the
 * next level-up on. A level whose HP is exactly the class value plus CON (the
 * hit die at level 1, the average after) never got the bonus, so it is added.
 * Rolled levels can't be told apart and are left alone.
 */
function addMissingHpBonus(c: Character): Character {
  if (c.isCustomHp) return c;
  const bonus = getHpBonusPerLevel(c);
  const levelHp = fullLevelHp(c);
  const classData = getStaticClass(c.class, c.ruleset) as any;
  if (!bonus || !levelHp || !classData?.hitDie) return c;
  const conMod = getModifier(c.con ?? 10);
  const average = classData.hpPerLevel ?? Math.floor(classData.hitDie / 2) + 1;
  let changed = 0;
  const fixed: Record<number, number> = { ...levelHp };
  for (let lvl = 1; lvl <= (c.level || 1); lvl++) {
    const base = (lvl === 1 ? classData.hitDie : average) + conMod;
    if (levelHp[lvl] === base) {
      fixed[lvl] = base + bonus;
      changed += bonus;
    }
  }
  if (!changed) return c;
  const maxHp = getMaxHpFromLevelHp(fixed);
  return { ...c, levelHp: fixed, maxHp, currentHp: Math.min(maxHp, (c.currentHp || 0) + changed) };
}

/**
 * A speed typed on the sheet used to be saved only as the derived speed, which
 * is now rebuilt from the race. When the saved speed differs from what the app
 * would show and nothing is changing speed right now, it was typed: keep it as
 * the base speed.
 */
function keepTypedSpeed(c: Character): Character {
  if (typeof c.baseSpeed === "number" && c.baseSpeed > 0) return c;
  if (!(c.speed > 0)) return c;
  const states = (c.activeStates || []).join(" ").toLowerCase();
  if ((c.exhaustionLevel || 0) >= 2 || /exhaustion|terrain|grappl|restrain|prone/.test(states) || (c.activeBuffs || []).length > 0) return c;
  let derived: number | undefined;
  try {
    derived = computeDerivedStats(c).speed;
  } catch {
    return c;
  }
  return derived !== undefined && derived !== c.speed ? { ...c, baseSpeed: c.speed } : c;
}

/**
 * Feats taken before feat grants existed never gave their proficiencies,
 * tools, languages, saving throws or spells. Those are added now. Ability increases are not:
 * the player may already have added them by hand, and adding them twice would
 * be worse than leaving them out.
 */
function addMissingFeatGrants(c: Character): Character {
  const selections = c.featureSelections || {};
  const taken = new Map<string, Record<string, string>>();
  for (const [key, values] of Object.entries(selections)) {
    if (!/^asi-feat-\d+$/.test(key) && key !== "variant-human-feat") continue;
    const name = values?.[0];
    if (name) taken.set(name, { ...taken.get(name), ...decodeFeatOptions(selections[`${key}-options`]) });
  }
  for (const f of c.features || []) {
    if (f.name && FEAT_FIXED_GRANTS[f.name] && !taken.has(f.name)) taken.set(f.name, {});
  }
  if (taken.size === 0) return c;
  let next = c;
  for (const [name, options] of taken) {
    try {
      next = applyFeatGrants(next, name, options);
    } catch {
      // A feat the data no longer knows gives nothing.
    }
  }
  const scores = Object.fromEntries(ABILITY_KEYS.map((k) => [k, c[k]]));
  return { ...next, ...scores };
}

/**
 * Expertise picked at a level-up used to be kept only as a pick
 * ("expertise-6-Stealth"), so the sheet never doubled the bonus. It joins the
 * character's expertise.
 */
function addLevelUpExpertise(c: Character): Character {
  const picked = Object.entries(c.featureSelections || {})
    .filter(([key]) => /^expertise-\d+-/.test(key))
    .flatMap(([, v]) => v || []);
  if (!picked.length) return c;
  const expertise = [...new Set([...(c.expertise || []), ...picked])];
  return expertise.length === (c.expertise || []).length ? c : { ...c, expertise };
}
