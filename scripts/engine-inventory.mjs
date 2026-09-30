/**
 * The omission check - the safety net that was missing.
 *
 * Six of the errors in the first race pass were omissions: a trait that exists
 * in the rules but was never written, or a variant trait written on the wrong
 * race. Care did not catch them; a diff against an independent list did.
 *
 * The existing SRD files are useless as a *mechanic* source - their `effect`
 * field is empty in 0 of 288 class features - but their *names* are a valid
 * inventory. This script treats them as a checklist only and reports every
 * inventory entry that has no counterpart in the engine dataset, so an omission
 * becomes a line in a worklist rather than something nobody notices for months.
 *
 * Read-only. Exits non-zero under --strict, for use as a completion gate.
 *
 *   node scripts/engine-inventory.mjs                 # what is still missing
 *   node scripts/engine-inventory.mjs --strict        # fail while any remain
 *   node scripts/engine-inventory.mjs --class Barbarian
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRD = path.join(ROOT, "src", "data", "en");
const ENGINE = path.join(ROOT, "src", "data", "engine");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const onlyClass = args.includes("--class") ? args[args.indexOf("--class") + 1] : null;

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const slug = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Several old names encode a level tier in a parenthetical, which the engine
// models as a tier on a single entry. Matching the base name avoids reporting
// the same feature as missing three times, which would also let a genuinely
// missing tier hide behind a written one.
const TIER_SUFFIX = /\s*\((?:\d+|\d+\s+die|\d+\s+dice|cr[^)]*|once per turn|see class table)\)\s*$/i;
const baseName = (name) => String(name).replace(TIER_SUFFIX, "").trim();

// --- inventory -------------------------------------------------------------

const classes = read(path.join(SRD, "2014_classes.json")).classes ?? [];
const subclasses = read(path.join(SRD, "2014_subclasses.json")).subclasses ?? [];
const feats = read(path.join(SRD, "2014_feats.json")).feats ?? [];
const races = read(path.join(SRD, "2014_races.json")).races ?? [];

/** { group, owner, name, level, key } - key is what the engine must contain. */
const inventory = [];

for (const c of classes) {
  for (const level of c.levels ?? []) {
    for (const f of level.features ?? []) {
      inventory.push({ group: "class", owner: c.name, name: f.name, level: level.level, key: `class.${slug(c.name)}.${slug(baseName(f.name))}` });
    }
  }
}
for (const s of subclasses) {
  for (const f of s.features ?? []) {
    inventory.push({ group: "subclass", owner: s.name, name: f.name, level: f.level ?? null, key: `subclass.${slug(s.name)}.${slug(baseName(f.name))}` });
  }
}
for (const f of feats) {
  inventory.push({ group: "feat", owner: "Feat", name: f.name, level: null, key: `feat.${slug(f.name)}` });
}
for (const r of races) {
  // The old data spells a variant into the race name, "Dragonborn (Metallic)",
  // while the engine models it as owner + variant, so the variant is split back
  // out here. Without this every variant trait reads as missing.
  const variantMatch = /^(.*?)\s*\((.+)\)\s*$/.exec(r.name);
  const raceKey = variantMatch ? `${slug(variantMatch[1])}.${slug(variantMatch[2])}` : slug(r.name);
  for (const t of r.traits ?? []) {
    inventory.push({ group: "race", owner: r.name, name: t.name, level: null, key: `race.${raceKey}.${slug(baseName(t.name))}` });
  }
}

// --- what the engine holds -------------------------------------------------

const authored = new Map();
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".json")) {
      for (const f of read(full).features ?? []) {
        authored.set(f.id, f);
        // Also index without the variant segment, so a variant trait still
        // satisfies the base-name checklist.
        if (f.id.split(".").length === 4) authored.set(f.id.split(".").slice(0, 3).join("."), f);
      }
    }
  }
};
walk(path.join(ENGINE, "features"));

// --- compare ---------------------------------------------------------------

// Several old names are 3e/4e leftovers or repo-specific renames whose correct
// engine name differs. Listed explicitly so a genuine omission is not hidden by
// an alias, and so an alias cannot quietly cover a missing entry forever.
const ALIASES = {
  "class.half_elf.darkvision": "modelled as race.half_elf.darkvision",
  "subclass.land.druid_circle_feature": "the subclass choice itself, not a feature",
};

// Rows like "Path feature" or "Divine Domain feature" are the subclass choice
// itself, not a feature - the real content belongs to each subclass entry. They
// are matched by pattern so 37 placeholders do not need 37 aliases, and each
// subclass's own features are still checked individually.
const SUBCLASS_PLACEHOLDER =
  /^(path|bard college|divine domain|druid circle|martial archetype|monastic tradition|roguish archetype|sorcerous origin|otherworldly patron|arcane tradition|artificer specialist)\s+feature$|^primal path$|^path feature$/i;

const missing = [];
for (const item of inventory) {
  if (onlyClass && slug(item.owner) !== slug(onlyClass)) continue;
  if (authored.has(item.key)) continue;
  if (SUBCLASS_PLACEHOLDER.test(item.name)) {
    // Counted as covered: the subclass itself must still be authored.
    continue;
  }
  const alias = ALIASES[item.key];
  missing.push({ ...item, alias });
}

// --- report ----------------------------------------------------------------

const byGroup = new Map();
for (const m of missing) {
  if (!byGroup.has(m.group)) byGroup.set(m.group, []);
  byGroup.get(m.group).push(m);
}

console.log("=".repeat(78));
console.log("INVENTORY CHECK - rules entries with no engine counterpart");
console.log("=".repeat(78));
console.log("\nThe old SRD files are used as a name checklist only. Anything listed");
console.log("below is either unwritten or written under a different name.\n");

const TOTAL = inventory.filter((i) => !onlyClass || slug(i.owner) === slug(onlyClass)).length;
const DONE = TOTAL - missing.length;
console.log(`  ${DONE}/${TOTAL} inventory entries have an engine entry`);
for (const [group, list] of byGroup) {
  console.log(`\n  ${group.toUpperCase()}  (${list.length} missing)`);
  const byOwner = new Map();
  for (const m of list) {
    if (!byOwner.has(m.owner)) byOwner.set(m.owner, []);
    byOwner.get(m.owner).push(m);
  }
  for (const [owner, items] of [...byOwner].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`    ${owner}  (${items.length})`);
    for (const m of items) {
      const level = m.level ? `L${String(m.level).padEnd(2)} ` : "   ";
      const alias = m.alias ? `  <- ${m.alias}` : "";
      console.log(`      ${level}${m.name}${alias}`);
    }
  }
}
console.log("");

if (strict && missing.length > 0) {
  console.error(`${missing.length} inventory entries still have no engine counterpart.`);
  process.exit(1);
}
