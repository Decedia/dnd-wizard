import fs from "fs";
import path from "path";

const CLASSES_SOURCE = path.join(process.cwd(), "src/data/en/2014_classes.json");
const SUBCLASSES_SOURCE = path.join(process.cwd(), "src/data/en/2014_subclasses.json");
const TARGET = path.join(process.cwd(), "src/locales/parts/en/2014_classes.json");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSummary(item) {
  const parts = [];
  const type = (item.featureType || "").trim();
  if (type) parts.push(`[${type}]`);

  const action = item.actionType?.trim();
  if (action) parts.push(`(${action})`);

  const uses = item.uses;
  if (uses && uses.total && uses.recharge) {
    parts.push(`(${uses.total} per ${uses.recharge})`);
  }

  const duration = item.duration?.trim();
  if (duration && duration !== "Permanent") {
    parts.push(`(${duration})`);
  }

  const base = item.summary || item.name || "";
  const prefix = parts.length > 0 ? `${parts.join(" ")} ` : "";
  return `${prefix}${base}`.trim();
}

function buildClassesLocale() {
  const classesData = JSON.parse(fs.readFileSync(CLASSES_SOURCE, "utf8"));
  const subclassesData = JSON.parse(fs.readFileSync(SUBCLASSES_SOURCE, "utf8"));
  const out = {};

  const subclassByClass = new Map();
  for (const sc of subclassesData.subclasses || []) {
    const clsName = sc.class || sc.className;
    if (!clsName) continue;
    const key = slugify(clsName);
    if (!subclassByClass.has(key)) subclassByClass.set(key, []);
    subclassByClass.get(key).push(sc);
  }

  for (const cls of classesData.classes || []) {
    const clsSlug = slugify(cls.name);

    if (cls.flavorText) {
      out[`classes.${clsSlug}.flavorText`] = cls.flavorText;
    }
    if (cls.description) {
      out[`classes.${clsSlug}.description`] = cls.description;
    }

    for (const feature of cls.features || []) {
      const featSlug = slugify(feature.name);
      if (feature.description) {
        out[`classes.${clsSlug}.features.${featSlug}.description`] = feature.description;
      }
      const summary = buildSummary(feature);
      if (summary) {
        out[`classes.${clsSlug}.features.${featSlug}.summary`] = summary;
      }
    }

    const classSubclasses = subclassByClass.get(clsSlug) || [];
    for (const sc of classSubclasses) {
      const subSlug = slugify(sc.name);
      if (sc.description) {
        out[`classes.${clsSlug}.subclasses.${subSlug}.description`] = sc.description;
      }
      for (const feature of sc.features || []) {
        const featSlug = slugify(feature.name);
        if (feature.description) {
          out[`classes.${clsSlug}.subclasses.${subSlug}.features.${featSlug}.description`] = feature.description;
        }
        const summary = buildSummary(feature);
        if (summary) {
          out[`classes.${clsSlug}.subclasses.${subSlug}.features.${featSlug}.summary`] = summary;
        }
      }
    }
  }

  return out;
}

function main() {
  const flat = buildClassesLocale();
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, JSON.stringify(flat, null, 2));
  console.log(`✅ Wrote ${Object.keys(flat).length} keys to ${path.basename(TARGET)}`);
}

main();
