/**
 * Reads the prose of every feature and reports where it disagrees with the
 * structured data.
 *
 * The descriptions are the least reliable part of the dataset - "see class
 * table" came from one - so they are the wrong thing to *build* from. They are
 * however the right thing to *check* against, and this is that check.
 *
 * Lay on Hands is why this exists. Its data said "spend 1 from a 65-point pool
 * and heal 5 per level": internally consistent, and wrong, because the pool is
 * the hit points. Nothing in the gate could see it, because the gate does not
 * read English.
 *
 *   node scripts/check-feature-values.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".json") ? [path.join(dir, e.name)] : []
  );
}

const features = walk(path.join(ROOT, "src", "data", "engine", "features"))
  .flatMap((f) => JSON.parse(readFileSync(f, "utf8")).features ?? []);
const resources = new Map(
  JSON.parse(readFileSync(path.join(ROOT, "src", "data", "engine", "resources.json"), "utf8")).resources.map(
    (r) => [r.id, r]
  )
);

const findings = [];
const note = (id, kind, detail) => findings.push({ id, kind, detail });

for (const f of features) {
  const prose = [f.summary, f.text, ...(f.effects ?? []).map((e) => e.note ?? "")].filter(Boolean).join(" ");

  // A pool ceiling quoted in the prose must match the pool's table.
  for (const cost of f.cost ?? []) {
    const pool = resources.get(cost.resource);
    if (!pool) continue;

    // "equal to 5 times your <class> level" - does the table agree?
    const perLevelProse = prose.match(/equal to (\d+) times your (?:paladin|character|level)/i);
    if (perLevelProse && pool.maxByLevel) {
      const perLevel = Number(perLevelProse[1]);
      const worst = Object.entries(pool.maxByLevel)
        .filter(([lvl]) => Number(lvl) >= 1)
        .map(([lvl, total]) => ({ lvl: Number(lvl), total, implied: perLevel * Number(lvl) }))
        .filter((r) => r.implied !== r.total);
      if (worst.length > 0) {
        note(
          f.id,
          "pool ceiling",
          `prose says ${perLevel}x level, table says ${worst[0].total} at ${worst[0].lvl} (implies ${worst[0].implied})`
        );
      }
    }

    // A variable spend must be linked to the effect, or two numbers float apart.
    if (cost.choose) {
      const linked = (f.effects ?? []).some((e) => e.fromCost);
      if (!linked) {
        note(f.id, "unlinked spend", "cost.choose is set but no effect declares fromCost, so the amount spent does nothing");
      }
    }

    // A tier cost must state the floor the prose states.
    if (cost.chooseTier) {
      const proseTier = prose.match(/slot of (\d+)(?:st|nd|rd|th) level or higher/i);
      if (proseTier && Number(proseTier[1]) !== cost.chooseTier.minLevel) {
        note(
          f.id,
          "tier cost",
          `prose says ${proseTier[1]}th level or higher, data says ${cost.chooseTier.minLevel}`
        );
      }
    }
  }

  // "a limited number of uses" in the prose with no limit in the data. A feature
  // that *grants* a pool is where the ceiling lives, not one that spends it, so
  // it is exempt.
  const grantsPool = (f.effects ?? []).some((e) => e.kind === "resource" && e.action === "gain");
  if (
    /limited number of uses|number of uses equal to|uses, equal to/i.test(prose) &&
    !f.limits &&
    !(f.cost ?? []).length &&
    !grantsPool
  ) {
    note(f.id, "missing limit", "prose describes a number of uses but the feature has neither limits nor a cost");
  }

  // "N times per long rest" or similar, where the data disagrees on N.
  const timesProse = prose.match(/(\d+) times per (?:short|long) rest/i);
  if (timesProse && f.limits && f.limits.max !== Number(timesProse[1])) {
    note(f.id, "limit mismatch", `prose says ${timesProse[1]}, data says ${f.limits.max}`);
  }

  // A die-size that the data contradicts, e.g. Bardic Inspiration (d6) vs d8.
  const dieProse = prose.match(/\((d\d+)\)/);
  if (dieProse && f.id.includes("inspiration")) {
    note(f.id, "die size", `prose names ${dieProse[1]}; check the tier that sets it`);
  }
}

console.log(`\nfeature value check: ${features.length} features\n`);
if (findings.length === 0) {
  console.log("  no disagreements between prose and data");
} else {
  const byKind = new Map();
  for (const f of findings) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }
  for (const [kind, list] of byKind) {
    console.log(`  ${kind} (${list.length})`);
    for (const f of list) console.log(`    ${f.id}\n      ${f.detail}`);
  }
}
console.log("");