import fs from "fs";
import path from "path";

const SOURCE = path.join(process.cwd(), "src/data/en/2014_classes.json");
const TARGET = path.join(process.cwd(), "src/locales/parts/en/2014_classes.json");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSummary(feature, featureType) {
  const parts = [];
  const type = (featureType || feature.featureType || "").trim();
  if (type) parts.push(`[${type}]`);

  const action = feature.actionType?.trim();
  if (action) parts.push(`(${action})`);

  const uses = feature.uses;
  if (uses && uses.total && uses.recharge) {
    parts.push(`(${uses.total} per ${uses.recharge})`);
  }

  const duration = feature.duration?.trim();
  if (duration && duration !== "Permanent") {
    parts.push(`(${duration})`);
  }

  const base = feature.summary || feature.name || "";
  const prefix = parts.length > 0 ? `${parts.join(" ")} ` : "";
  return `${prefix}${base}`.trim();
}

function flattenClasses(data) {
  const out = {};

  for (const cls of data.classes || []) {
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

    for (const subclass of cls.subclasses || []) {
      const subSlug = slugify(subclass.name);
      if (subclass.description) {
        out[`classes.${clsSlug}.subclasses.${subSlug}.description`] = subclass.description;
      }
      for (const feature of subclass.features || []) {
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
  const raw = fs.readFileSync(SOURCE, "utf8");
  const data = JSON.parse(raw);
  const flat = flattenClasses(data);

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, JSON.stringify(flat, null, 2));
  console.log(`✅ Wrote ${Object.keys(flat).length} keys to ${path.basename(TARGET)}`);
}

main();
