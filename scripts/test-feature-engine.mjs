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
  for (const key of [bare, `subclass.${bare}`, `class.${bare}`, `feat.${bare}`, `race.${bare}`]) {
    if (!byName.has(key)) byName.set(key, f);
  }
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
check("owner scopes resolve", byName.get("barbarian.rage")?.id === "class.barbarian.rage");
check("an ambiguous name resolves per owner", byName.get("fighter.rage")?.id === "class.fighter.rage");
check("a second class's Rage is a different entry", byName.get("cleric.rage")?.id === "class.cleric.rage");
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

console.log(`\n${failures.length === 0 ? "all checks passed" : `${failures.length} FAILED: ${failures.join(", ")}`}\n`);
if (failures.length > 0) process.exit(1);
