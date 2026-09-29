import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const PATHS = {
  root: ROOT,
  dataDir: path.join(ROOT, "src", "data"),
  partsDir: path.join(ROOT, "src", "locales", "parts"),
};

// The paren-stripping slug used by build-en-classes-locale.mjs / build-en-races-locale.mjs.
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The slug used by extract-srd-strings.mjs / build-srd-locale.mjs. It differs from
// slugify() (it does not strip parentheses) and it is the one that decides which
// keys build-srd-locale.mjs can resolve, so every key written here must use it.
function slugifyExtract(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function loadEnData() {
  return {
    classes: readJson(path.join(PATHS.dataDir, "en", "2014_classes.json")),
    subclasses: readJson(path.join(PATHS.dataDir, "en", "2014_subclasses.json")),
    races: readJson(path.join(PATHS.dataDir, "en", "2014_races.json")),
  };
}

/** Mechanics that belong in the prompt as context but are never rewritten. */
function mechanicsOf(entry) {
  const mechanics = {};
  for (const key of [
    "level",
    "featureType",
    "actionType",
    "uses",
    "requirement",
    "duration",
    "endsIf",
    "effect",
    "onUse",
    "scaling",
    "book",
  ]) {
    const value = entry?.[key];
    if (value === null || value === undefined || value === "") continue;
    mechanics[key] = value;
  }
  return mechanics;
}

/**
 * Walks a list of entities exactly the way extract-srd-strings.mjs does: an entry's
 * id is its `index` when it has one and the slug of its name otherwise, and repeated
 * ids get a `-2`, `-3` suffix so nothing collides.
 */
function walkList(list) {
  const counter = new Map();
  const out = [];
  for (const item of list || []) {
    if (!item || typeof item !== "object") continue;
    const base = item.index ? String(item.index) : item.name ? slugifyExtract(item.name) : null;
    if (!base) continue;
    const count = (counter.get(base) || 0) + 1;
    counter.set(base, count);
    out.push({ item, arrayIndex: out.length, id: count > 1 ? `${base}-${count}` : base });
  }
  return out;
}

function keyMap(prefix, fields) {
  return Object.fromEntries(fields.map((field) => [field, `${prefix}.${field}`]));
}

/**
 * Flattens classes, subclasses and races into the smallest independently
 * rewritable unit: one class, one feature, one trait, one choice. Each unit
 * carries the exact locale keys its text lives under (so the writer never has to
 * re-derive them) plus a `loc` descriptor naming the array element to patch.
 */
export function buildUnits() {
  const { classes, subclasses, races } = loadEnData();
  const units = [];
  const TEXT_FIELDS = ["summary", "description"];

  const push = (unit, text) => {
    const fields = unit.fields.filter((field) => {
      const value = text[field];
      return typeof value === "string" && value.trim().length > 0;
    });
    if (fields.length) units.push({ ...unit, fields, text });
  };

  // A feature can nest further lists (currently only `choices`). extract-srd-strings
  // descends into arrays without adding a path segment, so neither do we.
  const addTextNode = (node, keyPrefix, partFile, loc, baseContext, kind) => {
    push(
      {
        id: keyPrefix,
        kind,
        group: baseContext.group,
        name: node.name || node.index || "",
        fields: TEXT_FIELDS,
        context: { ...baseContext, ...mechanicsOf(node) },
        extractKeys: keyMap(keyPrefix, TEXT_FIELDS),
        partFile,
        loc,
      },
      node,
    );

    for (const [property, value] of Object.entries(node)) {
      if (!Array.isArray(value) || !value.length || typeof value[0] !== "object") continue;
      for (const child of walkList(value)) {
        addTextNode(
          child.item,
          `${keyPrefix}.${child.id}`,
          partFile,
          { ...loc, path: [...loc.path, { property, index: child.arrayIndex }] },
          baseContext,
          "choice",
        );
      }
    }
  };

  const addFeatureList = (list, keyPrefix, partFile, loc, context, kind) => {
    for (const feature of walkList(list)) {
      addTextNode(
        feature.item,
        `${keyPrefix}.${feature.id}`,
        partFile,
        { ...loc, path: [...(loc.path || []), { property: "features", index: feature.arrayIndex }] },
        context,
        kind,
      );
    }
  };

  for (const cls of walkList(classes.classes)) {
    const className = cls.item.name || cls.id;
    const partFile = `2014_classes_${slugify(className)}.json`;
    const prefix = `2014_classes.${cls.id}`;
    push(
      {
        id: prefix,
        kind: "class",
        group: className,
        name: className,
        fields: ["flavorText", "description"],
        context: { class: className, sourcebook: cls.item.source },
        extractKeys: keyMap(prefix, ["flavorText", "description"]),
        partFile,
        loc: { tree: "classes", index: cls.arrayIndex, path: [] },
      },
      cls.item,
    );
    addFeatureList(cls.item.features, prefix, partFile, { tree: "classes", index: cls.arrayIndex }, { class: className }, "classFeature");

    // A class keeps its features twice: a short top-level `features` list and the
    // full per-level list under `levels[].features`. The character sheet reads the
    // levels list, and the locale key scheme cannot reach it at all - navigating
    // 2014_classes.<slug>.<feature> finds the class's `features` array and never
    // descends into `levels`. So these are written straight into the data files
    // instead of through the parts.
    (cls.item.levels || []).forEach((level, levelIndex) => {
      addFeatureList(
        level.features,
        `${prefix}.levels.${levelIndex}`,
        partFile,
        { tree: "classes", index: cls.arrayIndex, path: [{ property: "levels", index: levelIndex }] },
        { class: className, level: level.level },
        "classLevelFeature",
      );
    });
  }

  for (const sub of walkList(subclasses.subclasses)) {
    const subName = sub.item.name || sub.id;
    const partFile = `2014_subclasses_${sub.id}.json`;
    const prefix = `2014_subclasses.${sub.id}`;
    const group = sub.item.class || "Unknown class";
    const loc = { tree: "subclasses", index: sub.arrayIndex };
    push(
      {
        id: prefix,
        kind: "subclass",
        group,
        name: subName,
        fields: ["flavorText", "description"],
        context: { class: group, subclass: subName, sourcebook: sub.item.source || sub.item.book },
        extractKeys: keyMap(prefix, ["flavorText", "description"]),
        partFile,
        loc: { ...loc, path: [] },
      },
      sub.item,
    );
    addFeatureList(sub.item.features, prefix, partFile, loc, { class: group, subclass: subName }, "subclassFeature");
  }

  for (const race of walkList(races.races)) {
    const raceName = race.item.name || race.id;
    const prefix = `2014_races.${race.id}`;
    const loc = { tree: "races", index: race.arrayIndex };
    for (const trait of walkList(race.item.traits)) {
      addTextNode(
        trait.item,
        `${prefix}.${trait.id}`,
        "2014_races.json",
        { ...loc, path: [{ property: "traits", index: trait.arrayIndex }] },
        { race: raceName, size: race.item.size, speed: race.item.speed, sourcebook: race.item.source },
        "raceTrait",
      );
    }
  }

  const counts = {};
  for (const unit of units) counts[unit.kind] = (counts[unit.kind] || 0) + 1;
  return { units, counts };
}

function resolveTarget(lists, loc) {
  let target = lists[loc.tree]?.[loc.index];
  for (const step of loc.path) target = (target?.[step.property] || [])[step.index];
  return target;
}

/** Applies validated model output to the EN data files, which are the EN source of truth. */
export function applyToEnData(enhancements, options = {}) {
  const trees = loadEnData();
  const lists = { classes: trees.classes.classes, subclasses: trees.subclasses.subclasses, races: trees.races.races };
  const lastUpdated = new Date().toISOString().slice(0, 10);
  let applied = 0;

  for (const { unit, values } of enhancements) {
    const target = resolveTarget(lists, unit.loc);
    if (!target) continue;
    for (const [field, value] of Object.entries(values)) target[field] = value;
    if (options.stampLastUpdated) target.lastUpdated = lastUpdated;
    applied++;
  }

  if (applied) {
    writeJson(path.join(PATHS.dataDir, "en", "2014_classes.json"), trees.classes);
    writeJson(path.join(PATHS.dataDir, "en", "2014_subclasses.json"), trees.subclasses);
    writeJson(path.join(PATHS.dataDir, "en", "2014_races.json"), trees.races);
  }
  return applied;
}

/**
 * Writes each unit under the `2014_*` keys build-srd-locale.mjs can resolve.
 *
 * The `classes.*` keys that build-en-classes-locale.mjs emits are a different,
 * incompatible scheme: build-srd-locale.mjs only accepts keys prefixed with
 * `<fileBase>.`, so those 1391 keys are skipped on the way into src/data/id. The
 * per-entity `2014_classes_*` / `2014_subclasses_*` parts are the live path, which
 * is where this writes.
 */
export function applyToLocaleParts(locale, enhancements) {
  const partsDir = path.join(PATHS.partsDir, locale);
  const files = new Map();

  const touch = (file) => {
    if (!files.has(file)) {
      const full = path.join(partsDir, file);
      files.set(file, fs.existsSync(full) ? readJson(full) : {});
    }
    return files.get(file);
  };

  for (const { unit, values } of enhancements) {
    const target = touch(unit.partFile);
    for (const field of unit.fields) {
      const value = values[field];
      if (typeof value === "string" && value.trim()) target[unit.extractKeys[field]] = value;
    }
  }

  for (const [file, data] of files) writeJson(path.join(partsDir, file), data);
  return [...files.keys()];
}
