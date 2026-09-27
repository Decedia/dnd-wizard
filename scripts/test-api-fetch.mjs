import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const DND5E_API_BASE = "https://www.dnd5eapi.co/api/spells";

const apiCache = new Map();

async function fetchSpellFromAPI(slug) {
  if (apiCache.has(slug)) {
    return apiCache.get(slug);
  }

  try {
    console.log(`Fetching ${DND5E_API_BASE}/${slug}...`);
    const response = await axios.get(`${DND5E_API_BASE}/${slug}`, {
      timeout: 10000,
      headers: { Accept: "application/json" },
    });

    const data = response.data;
    const apiData = {
      name: data.name || slug,
      description: (data.desc || []).join("\n\n"),
      range: data.range || "",
      casting_time: data.casting_time || "",
      duration: data.duration || "",
      components: data.components || {},
      damage: data.damage || {},
      save: data.save || "",
      url: data.url || "",
    };

    apiCache.set(slug, apiData);
    return apiData;
  } catch (error) {
    console.error(`API fetch failed for ${slug}: ${error.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const spellSlug = args.find(a => a.startsWith("--spell="))?.split("=")[1];

  if (!spellSlug) {
    console.error("Usage: bun run scripts/test-api-fetch.mjs --spell=<slug>");
    console.error("Example: bun run scripts/test-api-fetch.mjs --spell=acid-splash");
    process.exit(1);
  }

  const apiData = await fetchSpellFromAPI(spellSlug);

  if (!apiData) {
    console.error("Failed to fetch spell data from API.");
    process.exit(1);
  }

  console.log("\n=== Fetched Spell Data ===");
  console.log(`Name: ${apiData.name}`);
  console.log(`Range: ${apiData.range}`);
  console.log(`Casting Time: ${apiData.casting_time}`);
  console.log(`Duration: ${apiData.duration}`);
  console.log(`Components: ${JSON.stringify(apiData.components)}`);
  console.log(`Damage: ${JSON.stringify(apiData.damage)}`);
  console.log(`Save: ${apiData.save}`);
  console.log(`URL: ${apiData.url}`);
  console.log("\n=== Description ===");
  console.log(apiData.description);
  console.log("\n=== Raw JSON ===");
  console.log(JSON.stringify(apiData, null, 2));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
