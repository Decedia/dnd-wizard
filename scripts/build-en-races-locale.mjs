import fs from "fs";
import path from "path";

const SOURCE = path.join(process.cwd(), "src/data/en/2014_races.json");
const TARGET = path.join(process.cwd(), "src/locales/parts/en/2014_races.json");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSummary(trait) {
  const parts = [];
  const type = (trait.featureType || "").trim();
  if (type) parts.push(`[${type}]`);

  const action = trait.actionType?.trim();
  if (action) parts.push(`(${action})`);

  const uses = trait.uses;
  if (uses && uses.total && uses.recharge) {
    parts.push(`(${uses.total} per ${uses.recharge})`);
  }

  const duration = trait.duration?.trim();
  if (duration && duration !== "Permanent") {
    parts.push(`(${duration})`);
  }

  const base = trait.summary || trait.name || "";
  const prefix = parts.length > 0 ? `${parts.join(" ")} ` : "";
  return `${prefix}${base}`.trim();
}

function flattenRaces(data) {
  const out = {};

  for (const race of data.races || []) {
    const raceSlug = slugify(race.name);
    if (race.description) {
      out[`2014_races.${raceSlug}.description`] = race.description;
    }
    if (race.flavorText) {
      out[`2014_races.${raceSlug}.flavorText`] = race.flavorText;
    }

    for (const trait of race.traits || []) {
      const traitSlug = slugify(trait.name);
      if (trait.description) {
        out[`2014_races.${raceSlug}.${traitSlug}.description`] = trait.description;
      }
      const summary = buildSummary(trait);
      if (summary) {
        out[`2014_races.${raceSlug}.${traitSlug}.summary`] = summary;
      }
    }
  }

  return out;
}

function main() {
  const raw = fs.readFileSync(SOURCE, "utf8");
  const data = JSON.parse(raw);
  const flat = flattenRaces(data);

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, JSON.stringify(flat, null, 2));
  console.log(`✅ Wrote ${Object.keys(flat).length} keys to ${path.basename(TARGET)}`);
}

main();
