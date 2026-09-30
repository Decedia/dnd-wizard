/**
 * Cross-checks the authored race traits against the old race data.
 *
 * The old data is not a source - it has 3e/4e leftovers, Tasha's content
 * presented as PHB, and one trait literally named "Human". But it is an
 * independent list, so a trait that appears only on one side is worth a look:
 * something dropped, or something added.
 *
 * Read-only. Pass --races to restrict to a race.
 *
 *   node scripts/race-crosscheck.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const oldRaces = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "en", "2014_races.json"), "utf8")).races;
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "engine", "races.json"), "utf8"));
const only = process.argv.includes("--races") ? process.argv[process.argv.indexOf("--races") + 1] : null;

const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// What the engine now holds, keyed by race slug then trait slug.
const authored = new Map();
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".json")) {
      for (const f of JSON.parse(fs.readFileSync(full, "utf8")).features ?? []) {
        if (f.kind !== "race") continue;
        const key = f.variant ? `${slug(f.owner)}.${slug(f.variant)}` : slug(f.owner);
        if (!authored.has(key)) authored.set(key, new Set());
        authored.get(key).add(slug(f.name));
      }
    }
  }
};
walk(path.join(ROOT, "src", "data", "engine", "features", "race"));

let droppedTotal = 0;
let addedTotal = 0;
const lines = [];

for (const race of registry.races) {
  if (only && race.id !== only) continue;
  const targets = [[race.id, race.name], ...(race.variants ?? []).map((v) => [`${race.id}.${v.id}`, v.name])];
  for (const [key, name] of targets) {
    // Match the old entry, allowing a "(Variant)" suffix on the old name.
    const old = oldRaces.find((r) => slug(r.name) === slug(name) || slug(r.name).startsWith(`${slug(name)}_`));
    if (!old) continue;
    const oldTraits = new Set((old.traits ?? []).map((t) => slug(t.name)));
    const newTraits = authored.get(key) ?? new Set();

    const dropped = [...oldTraits].filter((t) => !newTraits.has(t));
    const added = [...newTraits].filter((t) => !oldTraits.has(t));
    droppedTotal += dropped.length;
    addedTotal += added.length;
    if (dropped.length === 0 && added.length === 0) continue;
    lines.push(`  ${name}`);
    if (dropped.length) lines.push(`    only in old data: ${dropped.map((d) => d.replace(/_/g, " ")).join(", ")}`);
    if (added.length) lines.push(`    only in new data: ${added.map((d) => d.replace(/_/g, " ")).join(", ")}`);
  }
}

console.log("=".repeat(78));
console.log("RACE CROSS-CHECK: authored engine traits vs the old race data");
console.log("=".repeat(78));
console.log("\nThe old data is not authoritative. Anything on only one side is a");
console.log("difference to explain, not necessarily an error.\n");

if (lines.length === 0) {
  console.log("  No differences.\n");
} else {
  console.log(lines.join("\n"));
  console.log("");
}
console.log(`  ${droppedTotal} traits only in the old data, ${addedTotal} only in the new.`);
console.log("");
