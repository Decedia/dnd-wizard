const fs = require("fs");
const path = require("path");

const files = [
  "src/data/en/2014_classes.json",
  "src/data/en/2014_subclasses.json",
  "src/data/en/2014_races.json",
  "src/data/en/2014_feats.json",
  "src/data/id/2014_classes.json",
  "src/data/id/2014_subclasses.json",
  "src/data/id/2014_races.json",
  "src/data/id/2014_feats.json",
];

function stripShowInSheet(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripShowInSheet);
  }
  if (obj && typeof obj === "object") {
    const { showInSheet, ...rest } = obj;
    const result = {};
    for (const [k, v] of Object.entries(rest)) {
      result[k] = stripShowInSheet(v);
    }
    return result;
  }
  return obj;
}

let changed = 0;
for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  const content = fs.readFileSync(fullPath, "utf8");
  const parsed = JSON.parse(content);
  const stripped = stripShowInSheet(parsed);
  const out = JSON.stringify(stripped, null, 2) + "\n";
  if (out !== content) {
    fs.writeFileSync(fullPath, out, "utf8");
    changed++;
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No change: ${file}`);
  }
}
console.log(`\nTotal files updated: ${changed}/${files.length}`);
