/**
 * Compares the subclass data against scripts/data/subclass-manifest.txt and
 * reports, per class and subclass, what is missing, at the wrong level,
 * named differently, extra, or tagged with the wrong source.
 *
 * Read-only. It never writes to src/data.
 *
 *   node scripts/check-subclass-completeness.mjs          # text report
 *   node scripts/check-subclass-completeness.mjs --md     # markdown report
 *   node scripts/check-subclass-completeness.mjs --strict # exit 1 on any gap
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "scripts", "data", "subclass-manifest.txt");
const CLASS_MANIFEST = path.join(ROOT, "scripts", "data", "class-feature-manifest.txt");
const DATA = path.join(ROOT, "src", "data", "en", "2014_subclasses.json");
const CLASS_DATA = path.join(ROOT, "src", "data", "en", "2014_classes.json");

const args = new Set(process.argv.slice(2));
const md = args.has("--md");

// ---------------------------------------------------------------- parsing

function parseManifest(text) {
  const classes = new Map();
  let cls = null;
  let sub = null;
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const uncertain = / \?$/.test(line);
    const body = line.replace(/ \?$/, "");
    let m;
    if ((m = body.match(/^\[(.+)\]$/))) {
      cls = m[1];
      classes.set(cls, []);
      sub = null;
    } else if ((m = body.match(/^(\S.*?) \(([A-Za-z]+)\)$/))) {
      if (!cls) throw new Error(`manifest line ${i + 1}: subclass before any [Class]`);
      sub = { name: m[1], source: m[2], uncertain, features: [], options: [] };
      classes.get(cls).push(sub);
    } else if ((m = body.match(/^\s+- (.+)$/))) {
      if (!sub) throw new Error(`manifest line ${i + 1}: option before any subclass`);
      sub.options.push(m[1]);
    } else if ((m = body.match(/^\s+(\d+) (.+)$/))) {
      if (!sub) throw new Error(`manifest line ${i + 1}: feature before any subclass`);
      sub.features.push({ level: Number(m[1]), name: m[2], uncertain });
    } else {
      throw new Error(`manifest line ${i + 1}: cannot parse "${raw}"`);
    }
  });
  return classes;
}

// ---------------------------------------------------------------- matching

const SUBCLASS_FILLER = /\b(path|of|the|college|domain|circle|way|oath|school|bloodline)\b/g;
const subKey = (s) => s.toLowerCase().replace(SUBCLASS_FILLER, "").replace(/[^a-z]/g, "");

const featKey = (s) =>
  s
    .toLowerCase()
    .replace(/^channel divinity:\s*/, "")
    .replace(/\(.*?\)/g, "")
    .replace(/^the /, "")
    .replace(/[^a-z]/g, "");

/** Features that only grant a spell list or restate a scaling row. */
const IGNORED = /(\bspells$|^bonus spells$|expanded spell|spell list|^additional .* options?$|^arcane shot options$|^genie patron$)/i;
const isSpellListMagic = (name) => /^[\w' -]+ magic$/i.test(name) && !/^(war|wild) magic/i.test(name);

/** Bigram similarity, 0..1, for spotting renamed or misspelled features. */
function similarity(a, b) {
  const grams = (s) => {
    const out = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) || 0) + 1);
    }
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  let hit = 0;
  for (const [g, n] of ga) hit += Math.min(n, gb.get(g) || 0);
  const total = Math.max(a.length - 1, 0) + Math.max(b.length - 1, 0);
  return total ? (2 * hit) / total : 0;
}

function compareSubclass(want, have, { extras = true, source = true, renames = true } = {}) {
  const issues = [];
  const pool = have.features.map((f) => ({ ...f, key: featKey(f.name), used: false }));

  // Pass 1: exact name matches, same level first so a feature listed at two
  // levels is not paired with the wrong row.
  const unmatched = [];
  const pending = [];
  for (const w of want.features) {
    const hit = pool.find((p) => !p.used && p.key === featKey(w.name) && p.level === w.level);
    if (hit) hit.used = true;
    else pending.push(w);
  }
  for (const w of pending) {
    const hit = pool.find((p) => !p.used && p.key === featKey(w.name));
    if (!hit) {
      unmatched.push(w);
      continue;
    }
    hit.used = true;
    issues.push({ kind: "level", text: `${w.name}: at level ${hit.level}, should be ${w.level}`, uncertain: w.uncertain });
  }

  // Pass 2: renamed or misspelled, same level and similar name.
  for (const w of unmatched) {
    const key = featKey(w.name);
    let best = null;
    for (const p of pool) {
      if (!renames || p.used || p.level !== w.level) continue;
      const s = similarity(key, p.key);
      if (s >= 0.6 && (!best || s > best.s)) best = { p, s };
    }
    if (best) {
      best.p.used = true;
      issues.push({ kind: "name", text: `level ${w.level}: "${best.p.name}" should be "${w.name}"`, uncertain: w.uncertain });
    } else {
      issues.push({ kind: "missing", text: `level ${w.level}: ${w.name}`, uncertain: w.uncertain });
    }
  }

  // Pass 3: anything left over in the data.
  const optionKeys = new Set(want.options.map(featKey));
  for (const p of extras ? pool : []) {
    if (p.used || IGNORED.test(p.name) || isSpellListMagic(p.name) || optionKeys.has(p.key)) continue;
    issues.push({ kind: "extra", text: `level ${p.level}: ${p.name}` });
  }

  if (source && have.source !== want.source) {
    issues.push({ kind: "source", text: `tagged ${have.source ?? "(none)"}, should be ${want.source}`, uncertain: want.uncertain });
  }
  return issues;
}

// ---------------------------------------------------------------- report

const manifest = parseManifest(fs.readFileSync(MANIFEST, "utf8"));
const data = JSON.parse(fs.readFileSync(DATA, "utf8")).subclasses;

const KIND_LABEL = {
  missing: "Missing",
  level: "Wrong level",
  name: "Wrong name",
  extra: "Not in manifest",
  source: "Wrong source",
};
const totals = { missing: 0, level: 0, name: 0, extra: 0, source: 0, missingSubclass: 0, extraSubclass: 0 };
const out = [];
const say = (s = "") => out.push(s);

say(md ? "# Subclass completeness report" : "SUBCLASS COMPLETENESS REPORT");
say();

let checked = 0;
let clean = 0;
for (const [cls, wantSubs] of manifest) {
  const haveSubs = data.filter((s) => s.class === cls);
  const used = new Set();
  const sections = [];

  for (const want of wantSubs) {
    const have = haveSubs.find((s) => subKey(s.name) === subKey(want.name));
    checked++;
    if (!have) {
      totals.missingSubclass++;
      sections.push({ title: `${want.name} (${want.source})`, lines: ["Missing subclass: not in the data at all"], uncertain: want.uncertain });
      continue;
    }
    used.add(have);
    const issues = compareSubclass(want, have);
    if (!issues.length) {
      clean++;
      continue;
    }
    for (const i of issues) totals[i.kind]++;
    sections.push({
      title: `${want.name} (${want.source})`,
      uncertain: want.uncertain,
      lines: issues.map((i) => `${KIND_LABEL[i.kind]}: ${i.text}${i.uncertain ? " [check book]" : ""}`),
    });
  }

  for (const have of haveSubs) {
    if (used.has(have)) continue;
    totals.extraSubclass++;
    sections.push({
      title: `${have.name} (${have.source ?? "no source"})`,
      lines: ["Not in manifest: not an official 2014 subclass, or the manifest is missing it"],
    });
  }

  if (!sections.length) continue;
  say(md ? `## ${cls}` : `[${cls}]`);
  say();
  for (const s of sections) {
    say(md ? `**${s.title}**${s.uncertain ? " (manifest entry needs a book check)" : ""}` : `  ${s.title}${s.uncertain ? "  ?" : ""}`);
    if (md) say();
    for (const l of s.lines) say(md ? `- ${l}` : `    - ${l}`);
    say();
  }
}

// Base classes: only the non-SRD features in class-feature-manifest.txt.
const classManifest = parseManifest(fs.readFileSync(CLASS_MANIFEST, "utf8"));
const classData = JSON.parse(fs.readFileSync(CLASS_DATA, "utf8")).classes;
let classMissing = 0;
const classOut = [];
for (const [cls, groups] of classManifest) {
  const c = classData.find((x) => x.name === cls);
  const features = (c?.levels ?? []).flatMap((l) => (l.features ?? []).map((f) => ({ name: f.name, level: l.level })));
  for (const g of groups) {
    const issues = compareSubclass(g, { features, source: g.source }, { extras: false, source: false, renames: false });
    if (!issues.length) continue;
    for (const i of issues) if (i.kind === "missing") classMissing++;
    for (const i of issues) totals[i.kind]++;
    classOut.push({ title: `${cls}: ${g.name}`, lines: issues.map((i) => `${KIND_LABEL[i.kind]}: ${i.text}`) });
  }
}
if (classOut.length) {
  say(md ? "## Base classes" : "[Base classes]");
  say();
  for (const s of classOut) {
    say(md ? `**${s.title}**` : `  ${s.title}`);
    if (md) say();
    for (const l of s.lines) say(md ? `- ${l}` : `    - ${l}`);
    say();
  }
}

const gaps = totals.missing + totals.level + totals.name + totals.extra + totals.source + totals.missingSubclass + totals.extraSubclass;
const summary = [
  `Subclasses in manifest: ${checked}, matching the data exactly: ${clean}`,
  `Missing subclasses: ${totals.missingSubclass}`,
  `Data subclasses not in manifest: ${totals.extraSubclass}`,
  `Missing features: ${totals.missing} (${classMissing} of them base class features)`,
  `Features at the wrong level: ${totals.level}`,
  `Features with the wrong name: ${totals.name}`,
  `Features not in manifest: ${totals.extra}`,
  `Wrong source tags: ${totals.source}`,
];
say(md ? "## Totals" : "TOTALS");
say();
for (const l of summary) say(md ? `- ${l}` : `  ${l}`);

console.log(out.join("\n"));
if (args.has("--strict") && gaps > 0) process.exit(1);
