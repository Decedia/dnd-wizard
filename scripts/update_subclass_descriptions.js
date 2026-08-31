#!/usr/bin/env node

import https from "https";
import fs from "fs";
import path from "path";

const DND5E_API = "https://www.dnd5eapi.co/api/2014";
const OPEN5E_API = "https://api.open5e.com/v1/classes";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "DND-Character-Builder/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse JSON from ${url}`));
        }
      });
    }).on("error", reject);
  });
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchDnd5eSubclasses() {
  console.log("Fetching subclasses from D&D 5e API...");
  const subclasses = {};

  try {
    const subclassList = await fetchJSON(`${DND5E_API}/subclasses`);
    for (const sub of subclassList.results) {
      const detail = await fetchJSON(`https://www.dnd5eapi.co${sub.url}`);
      const key = normalizeName(detail.name);
      subclasses[key] = {
        name: detail.name,
        description: Array.isArray(detail.desc) ? detail.desc : [detail.desc || ""],
        index: detail.index,
        source: "dnd5eapi",
      };
    }
  } catch (err) {
    console.error("  Warning: Error fetching from D&D 5e API:", err.message);
  }

  console.log(`  Found ${Object.keys(subclasses).length} subclasses from D&D 5e API`);
  return subclasses;
}

async function fetchOpen5eSubclasses() {
  console.log("Fetching subclasses from Open5E API...");
  const subclasses = {};

  try {
    const classesList = await fetchJSON(`${OPEN5E_API}/?format=json&limit=50`);
    for (const cls of classesList.results || []) {
      const clsSlug = cls.slug || cls.index;
      if (!clsSlug) continue;

      const clsDetail = await fetchJSON(`${OPEN5E_API}/${clsSlug}/?format=json`);
      for (const arch of clsDetail.archetypes || []) {
        const key = normalizeName(arch.name);
        if (!subclasses[key]) {
          subclasses[key] = {
            name: arch.name,
            description: arch.desc ? [arch.desc] : [""],
            index: arch.slug,
            source: "open5e",
          };
        }
      }
    }
  } catch (err) {
    console.error("  Warning: Error fetching from Open5E API:", err.message);
  }

  console.log(`  Found ${Object.keys(subclasses).length} subclasses from Open5E API`);
  return subclasses;
}

async function main() {
  const dataPath = path.join(process.cwd(), "src", "data", "2014_subclasses.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`Error: ${dataPath} not found`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const subclasses = rawData.subclasses || [];

  console.log(`Loaded ${subclasses.length} subclasses from local data\n`);

  const dnd5eSubclasses = await fetchDnd5eSubclasses();
  console.log();
  const open5eSubclasses = await fetchOpen5eSubclasses();
  console.log();

  let subclassesUpdated = 0;
  let featuresUpdated = 0;
  const updateLog = [];

  for (const localSub of subclasses) {
    const key = normalizeName(localSub.name);
    const apiSub = dnd5eSubclasses[key] || open5eSubclasses[key];

    if (!apiSub) {
      console.log(`  [SKIP] "${localSub.name}" - no API match found`);
      continue;
    }

    let updated = false;

    if (apiSub.description && apiSub.description.length > 0 && apiSub.description[0] !== "") {
      const currentDesc = JSON.stringify(localSub.description || []);
      const newDesc = JSON.stringify(apiSub.description);
      if (currentDesc !== newDesc) {
        localSub.description = apiSub.description;
        updated = true;
      }
    }

    if (updated) {
      subclassesUpdated++;
      updateLog.push({
        name: localSub.name,
        class: localSub.class,
        source: apiSub.source,
        description: apiSub.description[0].substring(0, 100) + "...",
      });
    }
  }

  rawData.generated = new Date().toISOString();
  rawData.total = subclasses.length;
  fs.writeFileSync(dataPath, JSON.stringify(rawData, null, 2) + "\n");

  console.log("\n=== Update Statistics ===");
  console.log(`Total subclasses in local data: ${subclasses.length}`);
  console.log(`Subclasses updated: ${subclassesUpdated}`);
  console.log(`Features updated: ${featuresUpdated}`);
  console.log(`\nUpdated subclasses:`);
  for (const entry of updateLog) {
    console.log(`  - ${entry.name} (${entry.class}) [${entry.source}]`);
    console.log(`    "${entry.description}"`);
  }

  console.log(`\nData written to: ${dataPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
