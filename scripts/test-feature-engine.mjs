/**
 * Exercises the engine dataset the way the resolver will.
 *
 * The repo has no test runner configured, so this is a script: a check that
 * does not run is not a check. Run it before trusting the resolver's output.
 *
 *   node scripts/test-feature-engine.mjs
 *
 * It mirrors the resolver's pure logic rather than importing the TS, so it
 * needs no transpiler. If a rule changes in feature-engine.ts, change it here
 * too - that duplication is the cost of having no runner.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(ROOT, "src", "data", "engine");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ok    ${name}`);
  } else {
    console.log(`  FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
    failures.push(name);
  }
}

console.log("\nfeature-engine checks\n");

const vocab = read(path.join(ENGINE, "vocab.json"));
const classesJson = read(path.join(ENGINE, "classes.json"));
const resourcesJson = read(path.join(ENGINE, "resources.json"));
const statesJson = read(path.join(ENGINE, "states.json"));
const FEATURES = path.join(ENGINE, "features");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}
const files = walk(FEATURES).sort();
const all = files.flatMap((f) => read(f).features ?? []);

const slug = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const byId = new Map(all.map((f) => [f.id, f]));
const byName = new Map();
for (const f of all) {
  const bare = slug(f.name);
  const owner = slug(f.owner);
  const stem = f.variant ? `${owner}.${slug(f.variant)}.${bare}` : `${owner}.${bare}`;
  const keys = [stem, f.kind === "subclass" ? `subclass.${stem}` : `${f.kind}.${stem}`, bare, `${f.kind}.${bare}`];
  for (const key of keys) if (!byName.has(key)) byName.set(key, f);
}

/** Mirror of findEngineFeature in src/data/engine/index.ts. */
function findEngineFeature(owner, name) {
  if (byId.has(name)) return byId.get(name);
  const bare = slug(name);
  if (owner) {
    const ownerKey = slug(owner);
    for (const prefix of ["", "subclass.", "class.", "feat.", "race."]) {
      const hit = byName.get(`${ownerKey}.${prefix}${bare}`);
      if (hit) return hit;
    }
  }
  return byName.get(bare) ?? null;
}

/** Mirror of applyTier in feature-engine.ts. */
function applyTier(feature, level) {
  const tiers = feature.tiers ?? [];
  if (!tiers.length) return feature;
  let active = null;
  for (const t of tiers) if (t.at <= level && (!active || t.at > active.at)) active = t;
  if (!active) return feature;
  const { at, ...overrides } = active;
  void at;
  return { ...feature, ...overrides };
}

console.log(`dataset: ${all.length} features from ${files.length} files\n`);

check("every feature id is unique", byId.size === all.length, `${byId.size} ids vs ${all.length} features`);

// 1. tier selection, which every other number in the game depends on
const rage = byId.get("class.barbarian.rage");
check("Rage exists", !!rage);
if (rage) {
  check("Rage at level 1 has 2 uses", applyTier(rage, 1).limits?.max === 2, `got ${applyTier(rage, 1).limits?.max}`);
  check("Rage at level 3 has 3 uses", applyTier(rage, 3).limits?.max === 3, `got ${applyTier(rage, 3).limits?.max}`);
  check("Rage at level 12 has 5 uses", applyTier(rage, 12).limits?.max === 5, `got ${applyTier(rage, 12).limits?.max}`);
  check("Rage at level 17 has 6 uses", applyTier(rage, 17).limits?.max === 6, `got ${applyTier(rage, 17).limits?.max}`);
  const dmg = (lv) => applyTier(rage, lv).effects.find((e) => e.kind === "stat_modifier" && e.stat === "damage_roll")?.amount;
  check("Rage damage is +2 at 1, +3 at 12, +4 at 17", dmg(1) === 2 && dmg(12) === 3 && dmg(17) === 4, `${dmg(1)}/${dmg(12)}/${dmg(17)}`);
  check("uses never decrease with level", [1, 3, 6, 12, 17].every((lv, i, arr) => i === 0 || applyTier(rage, lv).limits.max >= applyTier(rage, arr[i - 1]).limits.max));
}

// A tier that lowers a value which only grows with level is a data bug, and it
// is silent - the feature still renders, it just renders wrong. Compare
// against the previously effective value, inheriting across tiers that do not
// mention the field.
function effectiveMonotonic(feature) {
  let limits = feature.limits?.max ?? null;
  let effects = new Map();
  const collect = (list) => {
    const out = new Map();
    for (const e of list ?? []) {
      if (e.kind === "stat_modifier" && typeof e.amount === "number") out.set(`stat:${e.stat}`, e.amount);
      if (e.kind === "extra_attacks") out.set("count:extra_attacks", e.count ?? 0);
      if (e.kind === "extra_action") out.set("count:extra_action", e.count ?? 0);
      if (e.kind === "reactions_without_cost") out.set("count:reactions", e.count ?? 0);
    }
    return out;
  };
  effects = collect(feature.effects);
  const problems = [];
  let activation = feature.activation;
  for (const tier of feature.tiers ?? []) {
    // A tier that moves the feature to a different action slot is a redesign -
    // Paladin Battle Magic stops being a bonus action at 18th - so its values
    // are not expected to continue the previous tier's.
    const redesigned = tier.activation !== undefined && tier.activation !== activation;
    if (redesigned) {
      activation = tier.activation;
      limits = tier.limits?.max ?? limits;
      effects = tier.effects ? collect(tier.effects) : effects;
      continue;
    }
    if (tier.limits) {
      if (limits !== null && tier.limits.max < limits) {
        problems.push(`@${tier.at} limits.max ${limits} -> ${tier.limits.max}`);
      }
      limits = tier.limits.max;
    }
    if (!tier.effects) continue;
    const next = collect(tier.effects);
    for (const [key, value] of next) {
      const previous = effects.get(key);
      if (previous !== undefined && value < previous) {
        problems.push(`@${tier.at} ${key} ${previous} -> ${value}`);
      }
    }
    effects = next;
  }
  return problems;
}

const regressions = [];
for (const f of all) {
  for (const p of effectiveMonotonic(f)) regressions.push(`${f['id']}: ${p}`);
}
check("tiers never lower a growing value", regressions.length === 0, regressions.slice(0, 4).join("; "));

let tierProblems = [];
for (const f of all) {
  const tiers = f.tiers ?? [];
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].at <= tiers[i - 1].at) tierProblems.push(`${f.id}: ${tiers[i].at} <= ${tiers[i - 1].at}`);
  }
  for (const t of tiers) {
    if (f.unlock !== undefined && t.at <= f.unlock) tierProblems.push(`${f.id}: tier ${t.at} at or below unlock ${f.unlock}`);
  }
}
check("tier lists ascend and sit above the unlock", tierProblems.length === 0, tierProblems.slice(0, 3).join("; "));

// 2. the menu can only offer a reaction if it knows what it is waiting for
const noTrigger = all.filter((f) => f.activation === "reaction" && !f.trigger);
check("every reaction has a trigger", noTrigger.length === 0, noTrigger.map((f) => f.id).join(", "));

const events = new Set(vocab.triggerEvent);
const badEvents = all.filter((f) => f.trigger && !events.has(f.trigger.event));
check("every trigger event is in vocab", badEvents.length === 0, badEvents.map((f) => f.id).join(", "));

// 3. a gate that does not resolve would disable a feature forever, silently
const states = new Set(statesJson.states.map((s) => s.id));
const badGates = all.filter((f) => (f.gates ?? []).some((g) => !states.has(g)));
check("every gate is declared", badGates.length === 0, badGates.map((f) => f.id).join(", "));

// 4. a cost naming a resource that does not exist would always report "not enough"
const resourceIds = new Set(resourcesJson.resources.map((r) => r.id));
const badCosts = all.filter((f) => (f.cost ?? []).some((c) => !resourceIds.has(c.resource)));
check("every cost names a real resource", badCosts.length === 0, badCosts.map((f) => f.id).join(", "));

// 5. summon references must resolve, or the resolver recurses into nothing
const featureIds = new Set(all.map((f) => f.id));
const badSummons = [];
for (const f of all) {
  for (const e of f.effects ?? []) {
    for (const ref of e.features ?? []) if (!featureIds.has(ref)) badSummons.push(`${f.id} -> ${ref}`);
  }
}
check("summons reference authored features", badSummons.length === 0, badSummons.slice(0, 3).join("; "));

// 6. name lookup, which is how a stored character feature reaches the engine
check("bare name finds Wild Shape", byName.get("wild_shape")?.id === "class.druid.wild_shape", byName.get("wild_shape")?.id);
check("owner lookup finds Wild Shape", findEngineFeature("Druid", "Wild Shape")?.id === "class.druid.wild_shape", findEngineFeature("Druid", "Wild Shape")?.id);
check("owner-scoped lookup resolves", findEngineFeature("Barbarian", "Rage")?.id === "class.barbarian.rage", findEngineFeature("Barbarian", "Rage")?.id);
check("a different class resolves to its own", findEngineFeature("Fighter", "Second Wind")?.id === "class.fighter.second_wind", findEngineFeature("Fighter", "Second Wind")?.id);
check("extra attack resolves per class", findEngineFeature("Barbarian", "Extra Attack")?.id === "class.barbarian.extra_attack", findEngineFeature("Barbarian", "Extra Attack")?.id);
check("extra attack resolves per subclass too", findEngineFeature("College of Swords", "Extra Attack")?.id === "subclass.college_of_swords.extra_attack", findEngineFeature("College of Swords", "Extra Attack")?.id);
check("subclass feature resolves", findEngineFeature("Berserker", "Frenzy")?.id === "subclass.berserker.frenzy", findEngineFeature("Berserker", "Frenzy")?.id);
check("feat lookup resolves", findEngineFeature("Feat", "Alert")?.id === "feat.alert", findEngineFeature("Feat", "Alert")?.id);
check("ability score improvement resolves per class", findEngineFeature("Bard", "Ability Score Improvement")?.id === "class.bard.ability_score_improvement", findEngineFeature("Bard", "Ability Score Improvement")?.id);
check("race trait lookup resolves", findEngineFeature("Dragonborn", "Breath Weapon")?.id === "race.dragonborn.breath_weapon", findEngineFeature("Dragonborn", "Breath Weapon")?.id);
check("an unknown name returns null", findEngineFeature("Barbarian", "Not A Feature") === null);
check("every feature is reachable by its own id", all.every((f) => byId.get(f.id) === f));

// 7. what a modal row needs
const actionable = all.filter((f) => f.activation !== "passive");
check("every actionable feature has a summary", actionable.every((f) => f.summary && f.summary.trim().length >= 5), actionable.filter((f) => !f.summary).length + " missing");
check("summaries fit a badge", actionable.every((f) => f.summary.length <= 120));
check("every passive feature has effects", all.filter((f) => f.activation === "passive").every((f) => (f.effects ?? []).length > 0));

const act = {};
for (const f of all) act[f.activation] = (act[f.activation] ?? 0) + 1;
console.log(`\n  activation spread: ${Object.entries(act).map(([k, v]) => `${k}=${v}`).join("  ")}`);
check("every activation is exercised", vocab.activation.every((a) => (act[a] ?? 0) > 0));

// 8. owners must resolve, or a feature is unreachable by owner
const classOwners = new Set(classesJson.classes.map((c) => c.name));
const subclassOwners = new Set(classesJson.classes.flatMap((c) => c.subclasses.map((s) => s.name)));
const orphanClass = all.filter((f) => f.kind === "class" && !classOwners.has(f.owner));
const orphanSubclass = all.filter((f) => f.kind === "subclass" && !subclassOwners.has(f.owner));
check("class owners are registered", orphanClass.length === 0, orphanClass.map((f) => `${f.id} (${f.owner})`).slice(0, 3).join(", "));
check("subclass owners are registered", orphanSubclass.length === 0, orphanSubclass.map((f) => `${f.id} (${f.owner})`).slice(0, 3).join(", "));

// A badge that shows a fixed 1 while the rules scale the count with level is
// worse than no badge: it is confidently wrong. Second Wind shipped that way
// because "1 plus your fighter level" had nowhere to go.
const PROSE_SCALES =
  /(?:number of uses|limited number of uses|uses?,? equal to|equal to)\s+(?:1 plus your|your)\s+\w*level/i;
const proseScaled = all.filter(
  (f) =>
    f.limits &&
    !f.limits.perLevel &&
    !f.tiers &&
    (PROSE_SCALES.test(f.text ?? "") ||
      (f.effects ?? []).some((e) => PROSE_SCALES.test(e.note ?? "")))
);
check("no feature pins a level-scaled count at a fixed max", proseScaled.length === 0, proseScaled.map((f) => f.id).join(", "));

const limitMaxAt = (lim, level) => (!lim.perLevel ? lim.max : lim.max + lim.perLevel.plus * level);
const secondWind = byId.get("class.fighter.second_wind");
if (secondWind) {
  check("Second Wind has 2 uses at 1st level", limitMaxAt(secondWind.limits, 1) === 2, `got ${limitMaxAt(secondWind.limits, 1)}`);
  check("Second Wind has 6 uses at 5th level", limitMaxAt(secondWind.limits, 5) === 6, `got ${limitMaxAt(secondWind.limits, 5)}`);
  check("Second Wind has 21 uses at 20th level", limitMaxAt(secondWind.limits, 20) === 21, `got ${limitMaxAt(secondWind.limits, 20)}`);
}

// --- rebuild path ---------------------------------------------------------
// The rebuild button failed silently on an old save because rebuildDerived
// threw when `features` was absent, and the handler had a bare finally. These
// shapes are the ones a pre-engine save can actually have.
console.log("\nrebuild resilience (read from the source, since character-creation is TS)\n");
{
  const src = readFileSync(path.join(ROOT, "src", "lib", "character-creation.ts"), "utf8");
  const body = src.slice(src.indexOf("export function rebuildDerived"));
  const recreate = src.slice(src.indexOf("export function recreateCharacter"));
  const syncBody = src.slice(src.indexOf("export function syncBaseFeatures"), src.indexOf("export function applySubclassFeatures"));

  check("rebuildDerived normalises a missing features array", /features: Array\.isArray\(character\.features\) \? character\.features : \[\]/.test(body));
  check("syncBaseFeatures tolerates a missing features array", /character\.features \?\? \[\]/.test(syncBody));
  check("rebuildDerived never re-applies the Variant Human bonus", !/abilities\) \+ 1/.test(body));
  check("rebuildDerived restores currentHp after deriving", /Math\.min\(rebuilt\.currentHp, rebuilt\.maxHp\)/.test(body));

  const keep = [
    "currentHp","temporaryHp","hitDiceRemaining","spellSlotsExpended","featuresUsedThisTurn",
    "spellsUsedThisTurn","deathSaveSuccesses","deathSaveFailures","exhaustionLevel","rages",
    "sorceryPoints","bardicInspirationUses","activeStates","activeBuffs","str","cha","skills",
    "languages","toolProficiencies","expertise","inventory","spells","preparedSpells",
    "featureSelections","raceChoices","variantHumanAbilities","variantHumanSkill","appliedAsi",
  ];
  const notKept = keep.filter((k) => !body.includes(`${k}: character.${k}`));
  check("rebuildDerived preserves every in-play and chosen field", notKept.length === 0, notKept.join(", "));

  check("recreateCharacter derives hit points", /getMaxHpFromLevelHp\(levelHp\)/.test(recreate));
  check("recreateCharacter keeps the player's per-level hit dice", /kept\.levelHp/.test(recreate));
  // The bonus must be carried as a choice but never added to the scores again:
  // the ability scores the player set already include it.
  check("recreateCharacter carries variantHumanAbilities as a choice", /variantHumanAbilities: character\.variantHumanAbilities/.test(recreate));
  check("recreateCharacter never adds to the Variant Human abilities", !/abilities\)\s*\+\s*1/.test(recreate));
  check("recreateCharacter filters saving throws out of tool proficiencies", /saving throw/i.test(recreate));
  check("recreateCharacter resets in-play state", /exhaustionLevel: 0/.test(recreate) && /spellSlotsExpended: Object\.fromEntries/.test(recreate));
  check("recreateCharacter unions race languages rather than replacing them", /grantedLanguages/.test(recreate) && /chosenLanguages/.test(recreate));

  const sheet = readFileSync(path.join(ROOT, "src", "components", "character-sheet", "AppearanceBioSection.tsx"), "utf8");
  check("the recreate handler catches failures instead of swallowing them", /catch \(error\)/.test(sheet));
  check("the recreate handler passes the sheet language", /recreateCharacter\(character, language\)/.test(sheet));
}

// --- the sheet must not read the stored mechanical fields for display -------
// These carried "see class table" as a charge count and repeated a feature's
// own name as its type, so nothing may render from them again.
console.log("\nsheet reads the engine, not the stored mechanical fields\n");
{
  const sheet = readFileSync(path.join(ROOT, "src", "components", "character-sheet", "FeaturesTraitsSection.tsx"), "utf8");
  const reads = [
    [/feature\.actionType/, "feature.actionType"],
    [/feature\.uses/, "feature.uses"],
    [/feature\.requirement/, "feature.requirement"],
    [/feature\.endsIf/, "feature.endsIf"],
    [/feature\.onUse/, "feature.onUse"],
    [/feature\.scaling/, "feature.scaling"],
    [/feature\.featureType/, "feature.featureType"],
    [/\(feature as any\)\.(actionType|uses|requirement|endsIf|onUse|scaling|featureType)/, "(feature as any).<mechanical field>"],
  ];
  for (const [re, label] of reads) check(`the sheet does not read ${label}`, !re.test(sheet), "still present");
  check("badges come from resolved.badges only", /resolvedFor\(feature\.id\)\?\.badges\.map/.test(sheet));
  check("the popup shows the action slot, not Active/Passive", /slotLabel\(selectedResolved\.activation\)/.test(sheet));
  check("no mechanism text is appended to summaries", !/mechanismStr|mechanismParts/.test(sheet));
}

// --- the sheet must read a stored feature's source in both forms ------------
// An old save stores source as {type: "race", ...} and today as the string
// "race". Gating the SRD lookup on the string form alone meant an old
// character found no translation and fell through to the engine's English.
console.log("\nsource kind is read in both stored forms\n");
{
  const sheet = readFileSync(path.join(ROOT, "src", "components", "character-sheet", "FeaturesTraitsSection.tsx"), "utf8");
  check("the sheet normalises the stored source kind", /function sourceKind/.test(sheet));
  check("sourceKind accepts the object form", /typeof source\.type === "string"/.test(sheet));
  check("owner resolution uses sourceKind", /const kind = sourceKind\(feature\)/.test(sheet));
  check("no branch compares the source to a bare string", !/existing\.source === "/.test(sheet));
}

// --- localisation of the sheet's text ---------------------------------------
// Two real misses: the race branch searched traits only, and Variant Human is a
// choice option; and feats were baked with English at level-up because
// getStaticFeat was called without a locale.
console.log("\nsheet text is looked up in the sheet's language\n");
{
  const sheet = readFileSync(path.join(ROOT, "src", "components", "character-sheet", "FeaturesTraitsSection.tsx"), "utf8");
  check("the race branch also searches race choices", /ch\.options \?\? \[\]/.test(sheet) || /choices \?\? \[\]\)\.flatMap/.test(sheet));
  check("a dedicated feat branch exists", /kind === "feat"/.test(sheet));
  // Every SRD read in the sheet must carry a locale, or the lookup silently
  // returns English while the sheet is set to Indonesian.
  const lookups = [...sheet.matchAll(/getStatic(?:Races|Race|Feats|Feat|Subclasses|Class)\(([^)]*)\)/g)].map((m) => m[1]);
  const withoutLocale = lookups.filter((args) => !/\blanguage\b/.test(args));
  check(`all ${lookups.length} SRD lookups in the sheet pass language`, withoutLocale.length === 0, withoutLocale.length + " without: " + withoutLocale.join(" | "));

  const cc = readFileSync(path.join(ROOT, "src", "lib", "character-creation.ts"), "utf8");
  check("finalizeCreation takes a language", /finalizeCreation\(character: Character, language = "en"\)/.test(cc));
  check("finalizeCreation localises its feature passes", /applySubclassFeatures\(character, language\)/.test(cc) && /syncBaseFeatures\(final, language\)/.test(cc));
  check("Variant Human text comes from the race choice data", /variantChoice\?\.description/.test(cc));

  const lu = readFileSync(path.join(ROOT, "src", "components", "LevelUpWizard.tsx"), "utf8");
  check("level-up feats are created with a locale", /getStaticFeat\(st\.feat, character\.ruleset, language\)/.test(lu));

  // Data-level: the entries the user reported must differ between locales.
  const idRaces = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "id", "2014_races.json"), "utf8")).races;
  const enRaces = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "en", "2014_races.json"), "utf8")).races;
  const idVariant = idRaces.find((r) => r.name === "Human")?.choices?.flatMap((c) => c.options ?? []).find((o) => /variant/i.test(o.name ?? ""));
  const enVariant = enRaces.find((r) => r.name === "Human")?.choices?.flatMap((c) => c.options ?? []).find((o) => /variant/i.test(o.name ?? ""));
  check("the Variant Human choice is translated", Boolean(idVariant) && idVariant.description !== enVariant?.description, idVariant?.description);

  const idFeats = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "id", "2014_feats.json"), "utf8")).feats;
  const enFeats = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "en", "2014_feats.json"), "utf8")).feats;
  const untranslated = idFeats.filter((f) => {
    const e = enFeats.find((x) => x.name === f.name);
    return e && (f.summary ?? "") === (e.summary ?? "") && /[a-z]{4,}/i.test(f.summary ?? "");
  });
  check("every Indonesian feat summary differs from English", untranslated.length === 0, untranslated.slice(0, 3).map((f) => f.name).join(", "));
}

console.log(`\n${failures.length === 0 ? "all checks passed" : `${failures.length} FAILED: ${failures.join(", ")}`}\n`);
if (failures.length > 0) process.exit(1);
