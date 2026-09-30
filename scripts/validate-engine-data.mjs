/**
 * Gates the combat engine dataset. The data is meant to be final, so an invalid
 * dataset must not be able to ship: every problem below is a hard failure and
 * exits non-zero.
 *
 * It catches the failures that actually happen when authoring by hand:
 *   - a mechanic value that is not in vocab.json, which would be invisible to
 *     the compiler because the JSON is not typechecked
 *   - a feature spending a resource that does not exist, or a summon pointing
 *     at an action that was never authored
 *   - an effect kind missing a field it requires, e.g. damage with no dice
 *   - level keys out of order, duplicated, or above 20, which would make a
 *     level-lookup return undefined at runtime
 *   - a reaction with no trigger, which the turn engine could never offer
 *
 * Run before committing any change under src/data/engine.
 *   node scripts/validate-engine-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE_DIR = path.join(ROOT, "src", "data", "engine");
const FEATURES_DIR = path.join(ENGINE_DIR, "features");

const problems = [];
const stats = { features: 0, effects: 0, resources: 0, files: 0 };

function fail(where, kind, detail) {
  problems.push({ where, kind, detail });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    fail(path.relative(ROOT, file), "unreadable", err.message);
    return null;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".json") ? [full] : [];
  });
}

function isOneOf(value, list, where, field) {
  if (value === undefined) return false;
  if (!list.includes(value)) {
    fail(where, "enum", `${field} = ${JSON.stringify(value)} is not in vocab.json (allowed: ${list.join(", ")})`);
    return false;
  }
  return true;
}

function requireString(value, where, field) {
  if (typeof value !== "string" || !value.trim()) {
    fail(where, "missing", `${field} must be a non-empty string`);
    return false;
  }
  return true;
}

function requireNumber(value, where, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(where, "missing", `${field} must be a number`);
    return false;
  }
  return true;
}

// --- load ------------------------------------------------------------------

const vocab = readJson(path.join(ENGINE_DIR, "vocab.json"));
if (!vocab) {
  console.error("vocab.json is unreadable; cannot validate anything.");
  process.exit(1);
}

const statesDoc = readJson(path.join(ENGINE_DIR, "states.json"));
const formsDoc = readJson(path.join(ENGINE_DIR, "forms.json"));
const resourcesDoc = readJson(path.join(ENGINE_DIR, "resources.json"));

const stateIds = new Set((statesDoc?.states ?? []).map((s) => s.id));
const formIds = new Set((formsDoc?.forms ?? []).map((f) => f.id));
const resourceIds = new Set();
const [LEVEL_MIN, LEVEL_MAX] = vocab.levelRange;

if (statesDoc) {
  for (const [i, s] of (statesDoc.states ?? []).entries()) {
    const where = `states.json[${i}]`;
    requireString(s.id, where, "id");
    requireString(s.name, where, "name");
    if (s.id !== s.id?.toLowerCase()) fail(where, "format", `id ${JSON.stringify(s.id)} must be lowercase`);
  }
}
if (formsDoc) {
  for (const [i, f] of (formsDoc.forms ?? []).entries()) {
    const where = `forms.json[${i}]`;
    requireString(f.id, where, "id");
    requireString(f.name, where, "name");
    requireString(f.cr, where, "cr");
  }
}

// --- effect field tables ---------------------------------------------------

/**
 * The set of fields the TypeScript union declares for an effect kind. An
 * effect carrying anything else is rejected, which is what stops the data from
 * drifting away from what the compiler believes. The drift tripwires at the
 * bottom of types.ts cover the compile-time side; the two must agree.
 */
const EFFECT_FIELDS = {
  damage: ["dice", "damageType", "resolution"],
  heal: ["dice", "resolution"],
  temp_hp: ["dice"],
  heal_hit_dice: ["pool", "amount"],
  reduce_damage: ["dice"],
  stat_modifier: ["stat", "amount", "duration"],
  speed_modifier: ["amount", "unit"],
  extra_attacks: ["count"],
  extra_action: ["count"],
  advantage: ["check", "value"],
  reactions_without_cost: ["count"],
  resistance: ["damageTypes"],
  immunity: ["damageTypes", "conditions"],
  condition_immunity: ["conditions"],
  cover: ["cover"],
  ac_bonus: ["amount", "requires"],
  condition: ["action", "conditions", "duration"],
  resource: ["action", "resource", "amount"],
  slot: ["action", "level", "count"],
  control: ["action", "distance", "resolution"],
  teleport: ["distance", "mustBeUnoccupied"],
  swap_places: [],
  transform: ["formId", "formTable", "hitPoints", "speed", "abilities"],
  summon: ["features", "formId", "cr", "initiative", "hasOwnTurn", "control", "duration"],
  terrain: ["terrain", "area", "duration"],
  disguise: [],
  senses: ["sense", "range"],
  language: ["languages"],
  skill: ["skills", "proficiency"],
  tool: ["tools", "proficiency"],
  spell_modifier: ["changes", "atLeastLevel", "cost"],
  restriction: ["rules"],
  special: ["note", "reference"],
};

function isDeclaredField(kind, field) {
  return (EFFECT_FIELDS[kind] ?? []).includes(field);
}

/** The permitted `action` values differ per effect kind. */
function effectActionVocab(kind) {
  if (kind === "condition") return vocab.conditionAction;
  if (kind === "resource") return vocab.resourceAction;
  if (kind === "slot") return vocab.slotAction;
  if (kind === "control") return vocab.controlAction;
  return [];
}

// --- resources -------------------------------------------------------------

if (resourcesDoc) {
  const ids = new Set();
  for (const [i, r] of (resourcesDoc.resources ?? []).entries()) {
    const where = `resources[${i}] ${r.id ?? "?"}`;
    stats.resources++;
    requireString(r.id, where, "id");
    requireString(r.name, where, "name");
    requireString(r.book, where, "book");
    isOneOf(r.kind, vocab.resourceKind, where, "kind");
    isOneOf(r.recharge, vocab.recharge, where, "recharge");
    if (r.id) {
      if (ids.has(r.id)) fail(where, "duplicate", `resource id ${JSON.stringify(r.id)} appears twice`);
      ids.add(r.id);
      resourceIds.add(r.id);
    }
    const hasMax = typeof r.max === "number";
    const hasTable = r.maxByLevel && typeof r.maxByLevel === "object";
    if (hasMax === hasTable) {
      fail(where, "structure", "resource must set exactly one of max or maxByLevel");
    }
    if (hasTable) {
      let previous = 0;
      for (const [key, value] of Object.entries(r.maxByLevel)) {
        const level = Number(key);
        if (!Number.isInteger(level)) fail(where, "levelKey", `maxByLevel key ${JSON.stringify(key)} is not an integer`);
        if (level < LEVEL_MIN || level > LEVEL_MAX) {
          fail(where, "levelKey", `maxByLevel key ${key} is outside ${LEVEL_MIN}-${LEVEL_MAX}`);
        }
        if (level <= previous) fail(where, "levelKey", `maxByLevel keys must ascend; ${key} follows ${previous}`);
        previous = level;
        if (typeof value !== "number") fail(where, "missing", `maxByLevel[${key}] must be a number`);
      }
    }
  }
}

// --- features --------------------------------------------------------------

const featureFiles = walk(FEATURES_DIR);
if (featureFiles.length === 0) fail("features/", "empty", "no feature files found");

const features = [];
for (const file of featureFiles) {
  stats.files++;
  const rel = path.relative(ROOT, file);
  const doc = readJson(file);
  if (!doc) continue;
  if (!Array.isArray(doc.features)) {
    fail(rel, "structure", 'expected a top-level "features" array');
    continue;
  }
  for (const f of doc.features) features.push({ feature: f, where: `${rel}#${f?.id ?? "?"}` });
}

const featureIds = new Set();
const seenIds = new Set();
// First pass: collect every id, so a summon may reference a feature authored
// later in the file set. Reference checking needs the full set.
for (const { feature: f, where } of features) {
  if (!f || typeof f.id !== "string" || f.id === "") continue;
  if (seenIds.has(f.id)) {
    fail(where, "duplicate", `feature id ${JSON.stringify(f.id)} appears twice`);
    continue;
  }
  seenIds.add(f.id);
  featureIds.add(f.id);
}

for (const { feature: f, where } of features) {
  if (!f || typeof f !== "object") {
    fail(where, "structure", "entry is not an object");
    continue;
  }
  stats.features++;

  for (const field of vocab.featureRequired) {
    if (f[field] === undefined || f[field] === null) {
      fail(where, "missing", `required field ${field} is absent`);
    }
  }
  if (!Array.isArray(f.effects) || f.effects.length === 0) {
    fail(where, "structure", "effects must be a non-empty array");
  }

  if (f.id) {
    if (f.id !== f.id.toLowerCase() || /\s/.test(f.id)) {
      fail(where, "format", `id ${JSON.stringify(f.id)} must be lowercase and contain no spaces`);
    }
    if (!f.id.includes(".")) {
      fail(where, "format", `id ${JSON.stringify(f.id)} should be "<kind>.<owner>.<slug>"`);
    }
  }

  isOneOf(f.kind, vocab.featureKind, where, "kind");
  isOneOf(f.activation, vocab.activation, where, "activation");

  if (f.unlock !== undefined) {
    if (!Number.isInteger(f.unlock) || f.unlock < LEVEL_MIN || f.unlock > LEVEL_MAX) {
      fail(where, "level", `unlock ${JSON.stringify(f.unlock)} is outside ${LEVEL_MIN}-${LEVEL_MAX}`);
    }
  } else if (f.kind === "class" || f.kind === "subclass" || f.kind === "race" || f.kind === "monster") {
    fail(where, "missing", `a ${f.kind} feature needs an unlock level`);
  }

  if (f.activation === "reaction" && !f.trigger) {
    fail(where, "structure", "a reaction feature needs a trigger, or the turn engine can never offer it");
  }
  if (f.trigger) {
    isOneOf(f.trigger.event, vocab.triggerEvent, where, "trigger.event");
    isOneOf(f.trigger.at, vocab.triggerAt, where, "trigger.at");
    for (const dt of f.trigger.fromDamageType ?? []) isOneOf(dt, vocab.damageType, where, "trigger.fromDamageType");
  }

  for (const [i, c] of (f.cost ?? []).entries()) {
    if (!resourceIds.has(c.resource)) {
      fail(where, "danglingRef", `cost[${i}].resource ${JSON.stringify(c.resource)} is not in resources.json`);
    }
    requireNumber(c.amount, where, `cost[${i}].amount`);
  }

  if (f.limits) {
    isOneOf(f.limits.per, vocab.limitPer, where, "limits.per");
    requireNumber(f.limits.max, where, "limits.max");
    if (f.limits.max < 1) fail(where, "structure", "limits.max must be at least 1; use no limits at all for unlimited");
  }

  for (const g of f.gates ?? []) {
    if (!stateIds.has(g)) fail(where, "danglingRef", `gate ${JSON.stringify(g)} is not in states.json`);
  }

  if (f.targeting) {
    isOneOf(f.targeting.scope, vocab.targetScope, where, "targeting.scope");
    isOneOf(f.targeting.shape, vocab.shape, where, "targeting.shape");
    if (f.targeting.range) isOneOf(f.targeting.range.unit, vocab.rangeUnit, where, "targeting.range.unit");
  }
  if (f.duration) isOneOf(f.duration.unit, vocab.durationUnit, where, "duration.unit");

  for (const [level] of Object.entries(f.formCap ?? {})) {
    const n = Number(level);
    if (!Number.isInteger(n) || n < LEVEL_MIN || n > LEVEL_MAX) {
      fail(where, "levelKey", `formCap key ${level} is outside ${LEVEL_MIN}-${LEVEL_MAX}`);
    }
  }
  if (f.formCap) {
    let previous = 0;
    for (const level of Object.keys(f.formCap).map(Number).sort((a, b) => a - b)) {
      if (level <= previous) fail(where, "levelKey", "formCap keys must ascend");
      previous = level;
    }
  }

  if (f.tiers) {
    let previous = 0;
    for (const [i, tier] of f.tiers.entries()) {
      if (!Number.isInteger(tier.at) || tier.at < LEVEL_MIN || tier.at > LEVEL_MAX) {
        fail(where, "tier", `tiers[${i}].at ${JSON.stringify(tier.at)} is outside ${LEVEL_MIN}-${LEVEL_MAX}`);
      }
      if (tier.at <= previous) fail(where, "tier", `tiers[${i}].at ${tier.at} must ascend (previous ${previous})`);
      if (f.unlock !== undefined && tier.at <= f.unlock) {
        fail(where, "tier", `tiers[${i}].at ${tier.at} is not above the unlock level ${f.unlock}`);
      }
      previous = tier.at;
      for (const bad of ["id", "name", "text", "source", "formCap"]) {
        if (bad in tier) fail(where, "tier", `tiers[${i}] must not redefine ${bad}`);
      }
    }
  }

  // Summary is rendered on a badge, so it has to stay short and unpunctuated.
  if (typeof f.summary === "string") {
    if (f.summary.length > 120) fail(where, "summary", `summary is ${f.summary.length} chars, over the 120 badge limit`);
    if (f.summary.trim().length === 0) fail(where, "summary", "summary is blank");
    if (/[.]$/.test(f.summary.trim())) fail(where, "summary", "summary should not end with a period");
  }
  if (typeof f.text === "string" && f.text.trim().length < 40) {
    fail(where, "text", "text looks truncated; keep the verbatim rules text for proofreading");
  }
  if (f.source) requireString(f.source.book, where, "source.book");

  for (const [i, e] of (f.effects ?? []).entries()) {
    stats.effects++;
    const at = `effects[${i}]`;
    if (!e || typeof e !== "object") {
      fail(where, "structure", `${at} is not an object`);
      continue;
    }
    if (!isOneOf(e.kind, vocab.effectKinds, where, `${at}.kind`)) continue;

    for (const field of vocab.effectRequired[e.kind] ?? []) {
      if (e[field] === undefined || e[field] === null) {
        fail(where, "missing", `${at} (${e.kind}) is missing required field ${field}`);
      }
    }

    const unknown = Object.keys(e).filter(
      (k) => k !== "kind" && k !== "note" && !isDeclaredField(e.kind, k)
    );
    for (const key of unknown) {
      fail(where, "unknownField", `${at} (${e.kind}) has field ${JSON.stringify(key)} which the type does not declare`);
    }

    for (const dt of e.damageTypes ?? []) isOneOf(dt, vocab.damageType, where, `${at}.damageTypes`);
    for (const c of e.conditions ?? []) isOneOf(c, vocab.condition, where, `${at}.conditions`);
    isOneOf(e.stat, vocab.stat, where, `${at}.stat`);
    isOneOf(e.ability, vocab.ability, where, `${at}.ability`);
    isOneOf(e.action, effectActionVocab(e.kind), where, `${at}.action`);
    isOneOf(e.check, [...vocab.ability, ...vocab.checkType], where, `${at}.check`);
    isOneOf(e.value, vocab.advantageValue, where, `${at}.value`);
    isOneOf(e.cover, vocab.coverKind, where, `${at}.cover`);
    isOneOf(e.sense, vocab.senses, where, `${at}.sense`);
    isOneOf(e.proficiency, vocab.proficiency, where, `${at}.proficiency`);
    isOneOf(e.initiative, vocab.initiativeMode, where, `${at}.initiative`);
    isOneOf(e.control, vocab.summonControl, where, `${at}.control`);
    isOneOf(e.hitPoints, vocab.formHitPoints, where, `${at}.hitPoints`);
    // `duration` means different things per effect kind: a stat modifier's
    // persistence, but a full duration object on a condition or summon.
    if (e.kind === "stat_modifier") isOneOf(e.duration, vocab.statModifierDuration, where, `${at}.duration`);
    else if (e.duration) isOneOf(e.duration.unit, vocab.durationUnit, where, `${at}.duration.unit`);

    for (const change of e.changes ?? []) isOneOf(change, vocab.spellModifierChange, where, `${at}.changes`);
    for (const ability of e.abilities ?? []) isOneOf(ability, vocab.ability, where, `${at}.abilities`);

    if (e.dice) {
      requireString(e.dice.dice, where, `${at}.dice.dice`);
      isOneOf(e.dice.bonusFrom, [...vocab.ability, "none"], where, `${at}.dice.bonusFrom`);
      if (e.dice.flat !== undefined) requireNumber(e.dice.flat, where, `${at}.dice.flat`);
    }

    if (e.resolution) {
      if (!isOneOf(e.resolution.mode, vocab.resolutionMode, where, `${at}.resolution.mode`)) continue;
      if (e.resolution.mode === "save") {
        isOneOf(e.resolution.ability, vocab.ability, where, `${at}.resolution.ability`);
        isOneOf(e.resolution.onSuccess, vocab.onSave, where, `${at}.resolution.onSuccess`);
        isOneOf(e.resolution.onFailure, vocab.onFailure, where, `${at}.resolution.onFailure`);
        if (e.resolution.onSuccess === undefined) {
          fail(where, "missing", `${at}.resolution.onSuccess is required for a save`);
        }
      }
      if (e.resolution.mode === "attack") isOneOf(e.resolution.ability, vocab.ability, where, `${at}.resolution.ability`);
    }

    if (e.resource && !resourceIds.has(e.resource)) {
      fail(where, "danglingRef", `${at}.resource ${JSON.stringify(e.resource)} is not in resources.json`);
    }
    if (e.cost?.resource && !resourceIds.has(e.cost.resource)) {
      fail(where, "danglingRef", `${at}.cost.resource ${JSON.stringify(e.cost.resource)} is not in resources.json`);
    }
    if (e.formId && !formIds.has(e.formId)) {
      fail(where, "danglingRef", `${at}.formId ${JSON.stringify(e.formId)} is not in forms.json`);
    }
    for (const id of e.features ?? []) {
      if (!featureIds.has(id)) {
        fail(where, "danglingRef", `${at}.features references ${JSON.stringify(id)}, which is not an authored feature`);
      }
    }
    if (e.kind === "transform" && !e.formId && !f.formCap) {
      fail(where, "structure", `${at} (transform) needs either a formId or a formCap on the feature`);
    }
  }
}

/** The permitted `action` values differ per effect kind. */

// The drift tripwire in types.ts covers the compile-time side; this covers the
// data side, and the two must agree on which fields exist.
for (const [kind, fields] of Object.entries(EFFECT_FIELDS)) {
  if (!vocab.effectKinds.includes(kind)) {
    fail("vocab.json", "drift", `EFFECT_FIELDS declares ${kind}, which is not in effectKinds`);
  }
  for (const field of vocab.effectRequired[kind] ?? []) {
    if (!fields.includes(field)) {
      fail("vocab.json", "drift", `effectRequired.${kind} requires ${field}, which EFFECT_FIELDS does not declare`);
    }
  }
}
for (const kind of vocab.effectKinds) {
  if (!EFFECT_FIELDS[kind]) fail("vocab.json", "drift", `effectKinds declares ${kind} with no field list`);
}

// --- report ----------------------------------------------------------------

for (const p of problems) {
  console.error(`  ${p.where}\n    [${p.kind}] ${p.detail}`);
}
console.log(
  `\nengine data: ${stats.features} features, ${stats.effects} effects, ` +
    `${stats.resources} resources, ${stats.files} files`
);
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s). The engine dataset is invalid.`);
  process.exit(1);
}
console.log("valid");
