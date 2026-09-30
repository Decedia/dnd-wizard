/**
 * Reports what the combat engine still needs to be authored.
 *
 * The existing SRD data is not a source for the engine - its mechanic fields are
 * too thin to convert - but it IS a reliable inventory of which features exist.
 * This script uses it as a worklist: how many entries there are, which are
 * already authored under src/data/engine, and what each remaining one will need
 * looked up in the rulebook.
 *
 * Read-only. It never writes to src/data.
 *
 *   node scripts/engine-coverage.mjs            # summary
 *   node scripts/engine-coverage.mjs --worklist # per-owner list, for authoring
 *   node scripts/engine-coverage.mjs --flags    # entries needing a source decision
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRD = path.join(ROOT, "src", "data", "en");
const ENGINE = path.join(ROOT, "src", "data", "engine");
const FEATURES = path.join(ENGINE, "features");

const args = new Set(process.argv.slice(2));

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Pull the engine features already authored, for exclusion from the backlog. */
function authoredIds() {
  const ids = new Set();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) {
        for (const f of read(full).features ?? []) ids.add(f.id);
      }
    }
  };
  walk(FEATURES);
  return ids;
}

// --- gather the inventory --------------------------------------------------

const classes = read(path.join(SRD, "2014_classes.json")).classes ?? [];
const subclasses = read(path.join(SRD, "2014_subclasses.json")).subclasses ?? [];
const races = read(path.join(SRD, "2014_races.json")).races ?? [];
const feats = read(path.join(SRD, "2014_feats.json")).feats ?? [];

const inventory = [
  { group: "class features", entries: [] },
  { group: "subclass features", entries: [] },
  { group: "racial traits", entries: [] },
  { group: "feats", entries: [] },
];

for (const c of classes) {
  for (const level of c.levels ?? []) {
    for (const f of level.features ?? []) {
      inventory[0].entries.push({ name: f.name, owner: c.name, level: level.level, raw: f, kind: "class" });
    }
  }
}
for (const s of subclasses) {
  // Subclasses keep features at the top level with a per-feature level, unlike
  // classes which nest them under levels[].features.
  for (const f of s.features ?? []) {
    inventory[1].entries.push({ name: f.name, owner: s.name, level: f.level ?? null, raw: f, kind: "subclass" });
  }
}
for (const r of races) {
  for (const t of r.traits ?? []) {
    inventory[2].entries.push({ name: t.name, owner: r.name, level: null, raw: t, kind: "race" });
  }
}
for (const f of feats) {
  inventory[3].entries.push({ name: f.name, owner: "Feat", level: null, raw: f, kind: "feat" });
}

const done = authoredIds();

// --- 1. inventory ----------------------------------------------------------

console.log("=".repeat(78));
console.log("COMBAT ENGINE - AUTHORING BACKLOG");
console.log("=".repeat(78));
console.log("\nInventory of what exists, from the existing SRD data. The engine set is");
console.log("authored separately from the rulebook.\n");

let totalEntries = 0;
let totalDone = 0;
console.log("  GROUP                  EXISTS   AUTHORED      TO WRITE");
for (const g of inventory) {
  const authored = g.entries.filter((e) => done.has(engineId(e))).length;
  totalEntries += g.entries.length;
  totalDone += authored;
  console.log(
    `  ${g.group.padEnd(20)} ${String(g.entries.length).padStart(6)} ${String(authored).padStart(10)} ${String(g.entries.length - authored).padStart(13)}`
  );
}
console.log(`  ${"TOTAL".padEnd(20)} ${String(totalEntries).padStart(6)} ${String(totalDone).padStart(10)} ${String(totalEntries - totalDone).padStart(13)}`);

/**
 * The id scheme the engine uses: <kind>.<owner>.<slug>, snake_case. The kind
 * segment keeps a subclass, a monster and an item from colliding when the
 * engine looks features up globally.
 */
function engineId(entry) {
  return `${entry.kind}.${slug(entry.owner)}.${slug(entry.name)}`;
}
function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// --- 2. what the existing data can supply ----------------------------------

console.log("\n" + "-".repeat(78));
console.log("WHAT THE EXISTING DATA CAN SUPPLY");
console.log("-".repeat(78));
console.log("\nFor each field the engine needs, how many entries have anything usable.");
console.log("A dash means the field is empty everywhere, so every entry is hand-written.\n");

const NEEDS = [
  { field: "activation", get: (e) => (e.raw.actionType ? 1 : 0) },
  { field: "charges / limits", get: (e) => (e.raw.uses ? 1 : 0) },
  { field: "duration", get: (e) => (e.raw.duration ? 1 : 0) },
  { field: "requirement", get: (e) => (e.raw.requirement ? 1 : 0) },
  { field: "endsIf", get: (e) => (e.raw.endsIf ? 1 : 0) },
  { field: "scaling", get: (e) => (e.raw.scaling ? 1 : 0) },
  { field: "effect (damage/heal/etc)", get: (e) => (e.raw.effect ? 1 : 0) },
  { field: "summary", get: (e) => (e.raw.summary ? 1 : 0) },
  { field: "rules text", get: (e) => (e.raw.description ? 1 : 0) },
];

const classish = [...inventory[0].entries, ...inventory[1].entries];
for (const group of [classish, inventory[2].entries, inventory[3].entries]) {
  const label =
    group === classish ? "CLASS + SUBCLASS FEATURES" : group === inventory[2].entries ? "RACIAL TRAITS" : "FEATS";
  console.log(`  ${label}  (${group.length} entries)`);
  for (const need of NEEDS) {
    const have = group.filter((e) => need.get(e)).length;
    const pct = group.length ? Math.round((have / group.length) * 100) : 0;
    const bar = have === 0 ? "  - none -" : `${String(pct).padStart(3)}%  ${"#".repeat(Math.round(pct / 5))}`;
    console.log(`    ${need.field.padEnd(28)} ${String(have).padStart(4)}/${group.length}  ${bar}`);
  }
  console.log("");
}

// --- 3. worklist -----------------------------------------------------------

if (args.has("--worklist")) {
  console.log("-".repeat(78));
  console.log("WORK LIST BY OWNER");
  console.log("-".repeat(78));
  const byOwner = new Map();
  for (const g of inventory) {
    for (const e of g.entries) {
      const key = `${g.group} > ${e.owner}`;
      if (!byOwner.has(key)) byOwner.set(key, []);
      byOwner.get(key).push(e);
    }
  }
  for (const [owner, list] of byOwner) {
    const remaining = list.filter((e) => !done.has(engineId(e)));
    if (remaining.length === 0) continue;
    console.log(`\n  ${owner}  (${remaining.length} of ${list.length})`);
    for (const e of remaining) {
      const level = e.level ? `L${e.level}` : "  -";
      const hint = e.raw.actionType ? e.raw.actionType : "no actionType";
      console.log(`    ${level}  ${e.name.padEnd(46)} [${hint}]`);
    }
  }
}

// --- 4. flags --------------------------------------------------------------

/**
 * Races in this dataset that predate the 5e Eberron heritage release. Several
 * have a 2014 equivalent and several do not, so each needs a decision against
 * the rulebook rather than a mechanical conversion.
 */
const LEGACY_RACES = new Set([
  "Tiefling", "Aarakocra", "Changeling", "Deep Gnome", "Duergar", "Githzerai",
  "Kalashtar", "Kenku", "Lizardfolk", "Shifter", "Warforged", "Firbolg",
  "Hobgoblin", "Bugbear", "Tabaxi", "Triton", "Scout", "Half-Orc (Legacy)",
]);

const flags = { levelScaled: [], nameTier: [], placeholder: [], legacy: [], noSource: [] };

for (const g of [inventory[0], inventory[1]]) {
  const seen = new Map();
  for (const e of g.entries) {
    const key = `${e.owner}|${e.name}`;
    seen.set(key, [...(seen.get(key) ?? []), e]);
  }
  for (const [key, list] of seen) {
    if (list.length > 1) {
      flags.levelScaled.push({
        owner: e0(list).owner,
        name: e0(list).name,
        levels: list.map((e) => e.level).join(","),
      });
    }
  }
  for (const e of g.entries) {
    // A tier baked into the name, e.g. "Extra Attack (2)" or "Wild Shape (CR 1/4 ...)".
    if (/\((?:CR\s*)?[\d/]+\)?$/.test(e.name) || /\(\d\)$/.test(e.name)) {
      flags.nameTier.push({ owner: e.owner, name: e.name, level: e.level });
    }
    if (/(Path feature|College feature|Domain feature|Circle feature|Archetype feature|Tradition feature|Patron feature|Origin feature|Specialist Feature|Sorcerous Origin feature)/i.test(e.name)) {
      flags.placeholder.push({ owner: e.owner, name: e.name, level: e.level });
    }
  }
}
function e0(list) {
  return list[0];
}

for (const e of inventory[2].entries) {
  if (LEGACY_RACES.has(e.owner)) {
    flags.legacy.push({ race: e.owner, trait: e.name });
  }
}
for (const g of inventory) {
  for (const e of g.entries) {
    if (!e.raw.description || String(e.raw.description).trim().length < 40) {
      flags.noSource.push({ group: g.group, owner: e.owner, name: e.name });
    }
  }
}

console.log("\n" + "-".repeat(78));
console.log("ENTRIES NEEDING A DECISION");
console.log("-".repeat(78));

function flagBlock(title, rows, columns) {
  if (rows.length === 0) return;
  console.log(`\n  ${title}  (${rows.length})`);
  for (const r of rows) console.log(`    ${columns(r)}`);
}

flagBlock(
  "Level-scaled features stored as duplicate rows - collapse into one entry with tiers",
  flags.levelScaled,
  (r) => `${r.owner.padEnd(20)} ${r.name.padEnd(38)} levels ${r.levels}`
);
flagBlock(
  "Tier baked into the feature name - needs splitting into a tier table",
  flags.nameTier,
  (r) => `${r.owner.padEnd(20)} ${String(r.level).padEnd(4)} ${r.name}`
);
flagBlock(
  "Placeholder rows with no real content - need the actual feature written",
  flags.placeholder,
  (r) => `${r.owner.padEnd(20)} L${String(r.level).padEnd(4)} ${r.name}`
);
flagBlock(
  "Races predating the 2014 Eberron heritage release - check for a 5e equivalent",
  flags.legacy,
  (r) => `${r.race.padEnd(20)} ${r.trait}`
);
flagBlock(
  "Entries with no usable rules text - nothing to check against, author from scratch",
  flags.noSource,
  (r) => `${r.group.padEnd(20)} ${r.owner.padEnd(18)} ${r.name}`
);

// --- 4b. race modelling ----------------------------------------------------

/**
 * The existing data flattens 2014's base-race-plus-variant model into separate
 * races, which produces traits that do not exist in 2014 and traits that are
 * duplicated across variants. The engine models this with owner + variant, so
 * these need a decision before any racial trait is written.
 */
const VARIANT_FAMILIES = [
  { parent: "Dragonborn", variants: ["Chromatic", "Gem", "Metallic"], keep: true },
  { parent: "Dwarf", variants: ["Hill", "Mountain"], keep: true },
  { parent: "Elf", variants: ["High", "Wood", "Drow", "Moon", "Sun", "Sea", "Dark"], keep: true },
  { parent: "Gnome", variants: ["Forest", "Rock"], keep: true },
  { parent: "Halfling", variants: ["Lightfoot", "Stout", "Ghostwise"], keep: true },
  { parent: "Tiefling", variants: ["Asmodeus", "Baalzebul", "Zariel", "Dispater", "Fierna", "Glasya", "Levistus", "Mammon", "Mephistopheles"], keep: false },
  { parent: "Half-Elf", variants: ["High Elf", "Wood Elf", "Drow", "Moon Elf", "Sun Elf", "Sea Elf", "Shadar-kai", "Eladrin"], keep: false },
];

console.log("\n" + "-".repeat(78));
console.log("RACE MODEL - NEEDS A DECISION BEFORE ANY TRAIT IS WRITTEN");
console.log("-".repeat(78));
console.log("\nThe engine models a race as owner + variant, so a variant's shared traits");
console.log("stay on the parent instead of repeating across entries.\n");

const raceNames = new Set(races.map((r) => r.name));
for (const fam of VARIANT_FAMILIES) {
  const present = fam.variants.filter((v) => [...raceNames].some((n) => n.startsWith(`${fam.parent} (${v}`)));
  if (present.length === 0) continue;
  const traits = present.reduce((sum, v) => {
    const entry = races.find((r) => r.name.startsWith(`${fam.parent} (${v}`));
    return sum + (entry?.traits?.length ?? 0);
  }, 0);
  const verdict = fam.keep
    ? "real 2014 variants - model as variant"
    : fam.parent === "Tiefling"
      ? "legacy 4e/5e variants - 2014 has one tiefling, drop these"
      : "not a choice in 2014 - half-elf takes ONE elf variant, not all";
  console.log(`  ${fam.parent}`);
  console.log(`    ${String(present.length).padStart(2)} variant entries, ${String(traits).padStart(3)} traits`);
  console.log(`    -> ${verdict}`);
}

const traitDupes = {};
for (const r of races) {
  if (!/\(/.test(r.name)) continue;
  for (const t of r.traits ?? []) {
    const key = t.name.toLowerCase();
    (traitDupes[key] ||= new Set()).add(r.name);
  }
}
const sharedTraits = Object.entries(traitDupes).filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
console.log(`\n  Traits duplicated across variants: ${sharedTraits.length}`);
for (const [name, owners] of sharedTraits) {
  console.log(`    ${name.padEnd(24)} on ${owners.size} variants - belongs on the base race`);
}
console.log("");

// --- 5. vocabulary coverage ------------------------------------------------

const vocab = read(path.join(ENGINE, "vocab.json"));
const usedKinds = new Set();
const usedEvents = new Set();
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".json")) {
      for (const f of read(full).features ?? []) {
        for (const e of f.effects ?? []) usedKinds.add(e.kind);
        if (f.trigger) usedEvents.add(f.trigger.event);
      }
    }
  }
};
walk(FEATURES);

console.log("\n" + "-".repeat(78));
console.log("VOCABULARY COVERAGE FROM THE AUTHORED FEATURES");
console.log("-".repeat(78));
console.log(`\n  effect kinds exercised: ${usedKinds.size}/${vocab.effectKinds.length}`);
const unused = vocab.effectKinds.filter((k) => !usedKinds.has(k));
console.log(`  not yet exercised: ${unused.join(", ") || "none"}`);
console.log(`  trigger events exercised: ${usedEvents.size}/${vocab.triggerEvent.length}`);
const unusedEvents = vocab.triggerEvent.filter((e) => !usedEvents.has(e));
console.log(`  not yet exercised: ${unusedEvents.join(", ") || "none"}`);
console.log("");
