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
const OPTIONAL_DATA = path.join(ROOT, "src", "data", "optional-class-features.ts");
const CHOICE_MANIFEST = path.join(ROOT, "scripts", "data", "subclass-choice-manifest.txt");
const CHOICE_DATA = path.join(ROOT, "src", "data", "subclass_feature_choices.json");
const RACE_MANIFEST = path.join(ROOT, "scripts", "data", "race-manifest.txt");
const RACE_DATA = path.join(ROOT, "src", "data", "en", "2014_races.json");
const FEAT_MANIFEST = path.join(ROOT, "scripts", "data", "feat-manifest.txt");
const FEAT_DATA = path.join(ROOT, "src", "data", "en", "2014_feats.json");
const { getFeatOptionGroups } = await import(path.join(ROOT, "src", "data", "feat-options.ts"));

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
  const optionKeys = new Set((want.options || []).map(featKey));
  for (const p of extras ? pool : []) {
    if (p.used || IGNORED.test(p.name) || isSpellListMagic(p.name) || optionKeys.has(p.key)) continue;
    // A feature repeated at a later level is a further pick (two more maneuvers at 7th).
    if (want.features.some((w) => featKey(w.name) === p.key && w.level < p.level)) continue;
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
// Tasha's optional features live in a TS file; read their class, level and name.
const optionalFeatures = [...fs.readFileSync(OPTIONAL_DATA, "utf8").matchAll(/className: "([^"]+)", level: (\d+), name: "([^"]+)"/g)]
  .map(([, cls, level, name]) => ({ cls, name, level: Number(level) }));
let classMissing = 0;
const classOut = [];
for (const [cls, groups] of classManifest) {
  const c = classData.find((x) => x.name === cls);
  const features = [
    ...(c?.levels ?? []).flatMap((l) => (l.features ?? []).map((f) => ({ name: f.name, level: l.level }))),
    ...optionalFeatures.filter((f) => f.cls === cls),
  ];
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

// Subclass choices: every build-time pick in subclass-choice-manifest.txt.
function parseChoiceManifest(text) {
  const out = [];
  let cls = null;
  let sub = null;
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) return;
    const uncertain = / \?$/.test(line);
    const body = line.replace(/ \?$/, "");
    let m;
    if ((m = body.match(/^\[(.+)\]$/))) cls = m[1];
    else if ((m = body.match(/^(\S.*)$/))) sub = { name: m[1], uncertain };
    else if ((m = body.match(/^\s+(\d+) (.+?) = (\w+) x(\d+)(?:: (.+))?$/))) {
      out.push({
        cls, sub: sub.name, level: Number(m[1]), feature: m[2], kind: m[3], count: Number(m[4]),
        options: m[5] ? m[5].split(";").map((o) => o.trim()) : null,
        uncertain: sub.uncertain || uncertain,
      });
    } else throw new Error(`choice manifest line ${i + 1}: cannot parse "${raw}"`);
  });
  return out;
}

const PLACEHOLDER = /^(spell\d*|cantrip\d*|terrain|skill\d*|option\d*)$/i;
/** "Dragon Ancestor: Black - Acid Damage" -> "black"; "Fighting Style: Archery" -> "archery". */
const optKey = (s) => featKey(String(s).split(":").pop().split(" - ")[0]);

// Picks that a dedicated step of the level-up wizard handles instead of an
// option list in the data. Keep in step with src/components/LevelUpWizard.tsx.
const DEDICATED = new Set([
  "Bard|Lore|Additional Magical Secrets", // subclassSpellSelectionCount, spell modal
  "Druid|Land|Bonus Cantrip", // bonus cantrip picker
  "Druid|Land|Circle Spells", // circle terrain picker
  "Fighter|Eldritch Knight|Spellcasting", // third-caster spell step
]);

const choiceWant = parseChoiceManifest(fs.readFileSync(CHOICE_MANIFEST, "utf8"));
const choiceExtra = JSON.parse(fs.readFileSync(CHOICE_DATA, "utf8"));
const choiceOut = new Map();
let choiceGaps = 0;
for (const w of choiceWant) {
  const have = data.find((s) => s.class === w.cls && subKey(s.name) === subKey(w.sub));
  if (!have) continue; // already reported as a missing subclass
  if (DEDICATED.has(`${w.cls}|${have.name}|${w.feature}`)) continue;
  // A choice can list its options, or name a class spell list the app builds
  // them from; `extra` adds further picks to the same feature.
  const pick = (name, level, extra, fallback, fallbackCount) => {
    const choices = extra && Array.isArray(extra.options) ? extra.options : extra?.spellList ? [`${extra.spellList} spell list`] : fallback;
    const count = extra && typeof extra.count === "number" ? extra.count : fallbackCount;
    return { name, level, choices: Array.isArray(choices) ? choices.map((c) => c.name ?? c) : null, count: count ?? 1 };
  };
  const merged = (have.features || []).flatMap((f) => {
    const extra = choiceExtra?.[w.cls]?.[have.name]?.[f.name];
    return [pick(f.name, f.level, extra, f.choices, f.choicesCount), ...(extra?.extra || []).map((x) => pick(x.name, f.level, x))];
  });
  const wantKeys = (w.options || []).map(optKey);
  let f = merged.find((x) => x.choices?.length && featKey(x.name) === featKey(w.feature));
  if (!f && wantKeys.length) {
    f = merged.find((x) => x.choices?.length && x.level === w.level && x.choices.filter((c) => wantKeys.includes(optKey(c))).length * 2 >= wantKeys.length);
  }
  const lines = [];
  if (!f) {
    lines.push(`No picker: level ${w.level} ${w.feature} (${w.kind}, pick ${w.count})`);
  } else {
    const label = `level ${w.level} ${w.feature}${featKey(f.name) !== featKey(w.feature) ? ` (data: "${f.name}")` : ""}`;
    const placeholders = f.choices.filter((c) => PLACEHOLDER.test(String(c)));
    if (placeholders.length) lines.push(`Placeholder options: ${label} offers "${placeholders.join('", "')}" instead of real ${w.kind}`);
    if (f.count !== w.count) lines.push(`Wrong count: ${label} picks ${f.count}, should pick ${w.count}`);
    if (w.options) {
      const haveKeys = f.choices.map(optKey);
      const missing = w.options.filter((o) => !haveKeys.includes(optKey(o)));
      const extra = f.choices.filter((c) => !wantKeys.includes(optKey(c)) && !PLACEHOLDER.test(String(c)));
      if (missing.length) lines.push(`Missing options: ${label}: ${missing.join(", ")}`);
      if (extra.length) lines.push(`Options not in manifest: ${label}: ${extra.join(", ")}`);
    }
  }
  if (!lines.length) continue;
  choiceGaps += lines.length;
  const key = `${w.cls}|${have.name}`;
  if (!choiceOut.has(key)) choiceOut.set(key, { title: `${w.cls}: ${have.name}`, uncertain: w.uncertain, lines: [] });
  choiceOut.get(key).lines.push(...lines.map((l) => l + (w.uncertain ? " [check book]" : "")));
}
if (choiceOut.size) {
  say(md ? "## Subclass choices" : "[Subclass choices]");
  say();
  for (const s of choiceOut.values()) {
    say(md ? `**${s.title}**` : `  ${s.title}`);
    if (md) say();
    for (const l of s.lines) say(md ? `- ${l}` : `    - ${l}`);
    say();
  }
}

// ---------------------------------------------------------------- races

const section = (title, entries) => {
  if (!entries.length) return;
  say(md ? `## ${title}` : `[${title}]`);
  say();
  for (const e of entries) {
    say(md ? `**${e.title}**${e.uncertain ? " (manifest entry needs a book check)" : ""}` : `  ${e.title}${e.uncertain ? "  ?" : ""}`);
    if (md) say();
    for (const l of e.lines) say(md ? `- ${l}` : `    - ${l}`);
    say();
  }
};

const raceWant = [];
for (const raw of fs.readFileSync(RACE_MANIFEST, "utf8").split(/\r?\n/)) {
  const line = raw.replace(/\s+$/, "");
  if (!line.trim() || line.trim().startsWith("#")) continue;
  const uncertain = / \?$/.test(line);
  const body = line.replace(/ \?$/, "");
  let m;
  if ((m = body.match(/^(\S.*?) \(([A-Za-z]+)\)((?: \w+=\S+)*)$/))) {
    const attrs = Object.fromEntries([...m[3].matchAll(/(\w+)=(\S+)/g)].map((a) => [a[1], a[2]]));
    raceWant.push({ name: m[1], source: m[2], asi: attrs.asi, speed: attrs.speed ? Number(attrs.speed) : null, uncertain, traits: [] });
  } else if ((m = body.match(/^\s+(.+)$/)) && raceWant.length) {
    raceWant[raceWant.length - 1].traits.push({ name: m[1], level: 0 });
  } else throw new Error(`race manifest: cannot parse "${raw}"`);
}
const raceData = JSON.parse(fs.readFileSync(RACE_DATA, "utf8")).races;
const words = (s, keepParen = true) =>
  (keepParen ? s.replace(/[()]/g, " ") : s.replace(/\(.*?\)/g, " ")).toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");
const RACE_IGNORED = /^(ability score increase|age|alignment|size|speed|languages?|flying speed|swim(ming)? speed|extra language|creature type|fey|humanoid)$/i;
const raceOut = [];
let raceGaps = 0;
for (const w of raceWant) {
  const d = raceData.find((r) => words(r.name) === words(w.name) || words(r.name, false) === words(w.name));
  if (!d) {
    raceOut.push({ title: `${w.name} (${w.source})`, uncertain: w.uncertain, lines: ["Missing race: not in the data at all"] });
    raceGaps++;
    continue;
  }
  const issues = compareSubclass(
    { features: w.traits, source: w.source },
    { features: (d.traits || []).filter((t) => !RACE_IGNORED.test(t.name)).map((t) => ({ name: t.name, level: 0 })), source: d.source },
  ).map((i) => ({ ...i, text: i.text.replace(/^level 0: /, "").replace(/ at level 0, should be 0/, "") }));
  const lines = issues.map((i) => `${KIND_LABEL[i.kind]}: ${i.text}`);
  if (w.asi) {
    const got = Object.fromEntries(Object.entries(d.abilityScoreIncreases || {}).map(([k, v]) => [k.slice(0, 3), v]));
    if (w.asi === "flex") {
      if (Object.keys(got).length) lines.push(`Wrong ASI: fixed ${JSON.stringify(got)}, should be flexible (+2/+1 or +1/+1/+1 of the player's choice)`);
    } else {
      const want = Object.fromEntries(w.asi.split(",").map((p) => [p.slice(0, 3), Number(p.slice(3))]));
      const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
      const diff = [...keys].filter((k) => (want[k] || 0) !== (got[k] || 0));
      if (diff.length) lines.push(`Wrong ASI: ${JSON.stringify(got)}, should be ${JSON.stringify(want)}`);
    }
  }
  if (w.speed && d.speed !== w.speed) lines.push(`Wrong speed: ${d.speed}, should be ${w.speed}`);
  if (!lines.length) continue;
  raceGaps += lines.length;
  raceOut.push({ title: `${w.name} (${w.source})${d.name !== w.name ? ` (data: "${d.name}")` : ""}`, uncertain: w.uncertain, lines });
}
section("Races", raceOut);

// ---------------------------------------------------------------- feats

const featWant = [];
for (const raw of fs.readFileSync(FEAT_MANIFEST, "utf8").split(/\r?\n/)) {
  const line = raw.replace(/\s+$/, "");
  if (!line.trim() || line.trim().startsWith("#")) continue;
  const uncertain = / \?$/.test(line);
  const m = line.replace(/ \?$/, "").match(/^(.+?) \(([A-Za-z]+)\)(?: asi=(\S+))?(?: picks=(.+))?$/);
  if (!m) throw new Error(`feat manifest: cannot parse "${raw}"`);
  featWant.push({ name: m[1], source: m[2], asi: m[3] ? m[3].split("|") : null, picks: m[4] || null, uncertain });
}
const featData = JSON.parse(fs.readFileSync(FEAT_DATA, "utf8")).feats;
const featSource = (f) => f.book || (typeof f.source === "string" ? f.source : f.source?.name) || "PHB";
const featOut = [];
let featGaps = 0;
for (const w of featWant) {
  const entries = featData.filter((f) => featKey(f.name) === featKey(w.name));
  if (!entries.length) {
    featOut.push({ title: `${w.name} (${w.source})`, uncertain: w.uncertain, lines: ["Missing feat: not in the data at all"] });
    featGaps++;
    continue;
  }
  const lines = [];
  const sources = [...new Set(entries.map(featSource))];
  if (!sources.includes(w.source)) lines.push(`Wrong source: tagged ${sources.join(", ")}, should be ${w.source}`);
  else if (sources.length > 1) lines.push(`Duplicate entries: also tagged ${sources.filter((x) => x !== w.source).join(", ")}, so it shows for tables without ${w.source}`);
  const groups = getFeatOptionGroups(entries[0].name) || [];
  const abilityGroup = groups.find((g) => /abilit/i.test(g.id));
  if (w.asi && !abilityGroup) lines.push(`No ability picker: +1 should go to ${w.asi.join(" or ").toUpperCase()}`);
  if (!w.asi && abilityGroup) lines.push(`Ability picker that should not be there (no choice of ability)`);
  const otherGroups = groups.filter((g) => !/abilit/i.test(g.id));
  if (w.picks && !otherGroups.length) lines.push(`No picker for: ${w.picks}`);
  if (!lines.length) continue;
  featGaps += lines.length;
  featOut.push({ title: `${w.name} (${w.source})`, uncertain: w.uncertain, lines });
}
const featWantKeys = new Set(featWant.map((w) => featKey(w.name)));
for (const name of [...new Set(featData.map((f) => f.name))]) {
  if (featWantKeys.has(featKey(name))) continue;
  const srcs = [...new Set(featData.filter((f) => f.name === name).map(featSource))];
  featOut.push({ title: `${name} (${srcs.join(", ")})`, lines: ["Not in manifest: not an official 2014 feat (UA or invented), or the manifest is missing it"] });
  featGaps++;
}
section("Feats", featOut);

const gaps = raceGaps + featGaps + choiceGaps + totals.missing + totals.level + totals.name + totals.extra + totals.source + totals.missingSubclass + totals.extraSubclass;
const summary = [
  `Subclasses in manifest: ${checked}, matching the data exactly: ${clean}`,
  `Missing subclasses: ${totals.missingSubclass}`,
  `Data subclasses not in manifest: ${totals.extraSubclass}`,
  `Missing features: ${totals.missing} (${classMissing} of them base class features)`,
  `Features at the wrong level: ${totals.level}`,
  `Features with the wrong name: ${totals.name}`,
  `Features not in manifest: ${totals.extra}`,
  `Wrong source tags: ${totals.source}`,
  `Subclass choice problems: ${choiceGaps} (of ${choiceWant.length} choices in the manifest)`,
  `Race problems: ${raceGaps} (of ${raceWant.length} races in the manifest)`,
  `Feat problems: ${featGaps} (of ${featWant.length} feats in the manifest)`,
];
say(md ? "## Totals" : "TOTALS");
say();
for (const l of summary) say(md ? `- ${l}` : `  ${l}`);

console.log(out.join("\n"));
if (args.has("--strict") && gaps > 0) process.exit(1);
