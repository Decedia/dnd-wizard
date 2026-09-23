import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_PATH = path.join(process.cwd(), "src/locales/parts/en/2014_spells.json");
const TARGET_PATH = path.join(process.cwd(), "src/locales/parts/id/2014_spells.json");

const PROTECTED_TERMS = [
  "saving throw",
  "Strength saving throw",
  "Dexterity saving throw",
  "Constitution saving throw",
  "Intelligence saving throw",
  "Wisdom saving throw",
  "Charisma saving throw",
  "ability check",
  "Action",
  "Bonus Action",
  "Reaction",
  "Hit Points",
  "AC",
  "Armor Class",
  "Advantage",
  "Disadvantage",
  "spell slot",
  "cantrip",
  "Concentration",
  "Duration",
  "Range",
  "Spell Attack",
  "DC",
  "V, S, M",
  "V, S",
  "fire damage",
  "cold damage",
  "lightning damage",
  "radiant damage",
  "necrotic damage",
  "poison damage",
  "psychic damage",
  "bludgeoning damage",
  "piercing damage",
  "slashing damage",
];

const SORTED_TERMS = [...PROTECTED_TERMS].sort((a, b) => b.length - a.length);
const PROTECTED_REGEX = new RegExp(
  "\\b(" + SORTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
  "gi"
);

function protectTerms(text) {
  const map = [];
  const result = text.replace(PROTECTED_REGEX, (match) => {
    const idx = map.length;
    map.push(match);
    return `__KEEP_${idx}__`;
  });
  return { result, map };
}

function restoreTerms(text, map) {
  return text.replace(/__KEEP_(\d+)__/g, (_, idx) => {
    const i = parseInt(idx, 10);
    return map[i] || _;
  });
}

async function translateViaProxy(protectedText) {
  const encoded = encodeURIComponent(protectedText);
  const url = `https://translate.google.com/translate_a/single?client=at&dt=t&dt=rm&dj=1&sl=en&tl=id&q=${encoded}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Proxy responded with ${res.status}`);
  }
  const data = await res.json();
  if (!data.contents) {
    throw new Error("Proxy returned no contents");
  }
  const parsed = JSON.parse(data.contents);
  return parsed.sentences.map((s) => s.trans).join("");
}

async function translateText(text, maxRetries = 5) {
  if (!text || !text.trim()) return text;

  const { result: protectedText, map } = protectTerms(text);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let translated = await translateViaProxy(protectedText);
      return restoreTerms(translated, map);
    } catch (err) {
      if (attempt < maxRetries - 1) {
        const wait = Math.min(2 ** attempt * 3, 120) * 1000;
        console.log(`  ⏳ Proxy error (${err.message}). Retrying in ${wait / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(wait);
        continue;
      }
      console.error(`  ⚠ Translation failed after ${maxRetries} attempts: ${err.message}`);
      return text;
    }
  }

  return text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
  const existingData = fs.existsSync(TARGET_PATH) ? JSON.parse(fs.readFileSync(TARGET_PATH, "utf8")) : {};

  const keys = Object.keys(sourceData);
  console.log(`📄 Source keys: ${keys.length}`);
  console.log(`📄 Existing translations: ${Object.keys(existingData).length}`);
  console.log(`📄 Translating all keys with free Google Translate + protected terms via proxy.\n`);

  let result = { ...existingData };
  let processed = 0;

  for (const key of keys) {
    const sourceText = sourceData[key];
    if (typeof sourceText !== "string") {
      processed++;
      continue;
    }

    try {
      result[key] = await translateText(sourceText);
      processed++;
      console.log(`  [${processed}/${keys.length}] ${key}`);

      if (processed % 50 === 0) {
        fs.mkdirSync(path.dirname(TARGET_PATH), { recursive: true });
        fs.writeFileSync(TARGET_PATH, JSON.stringify(result, null, 2));
        console.log(`  ✅ Saved incremental progress: ${processed}/${keys.length}\n`);
      }
    } catch (err) {
      console.error(`  ✗ Failed ${key}: ${err.message}`);
      result[key] = existingData[key] || sourceText;
      processed++;
    }

    await sleep(500);
  }

  fs.mkdirSync(path.dirname(TARGET_PATH), { recursive: true });
  fs.writeFileSync(TARGET_PATH, JSON.stringify(result, null, 2));
  console.log(`\n🎉 Done! ${processed}/${keys.length} keys processed.`);
}

process.on("SIGINT", () => {
  console.log("\n⚠ Interrupted. Progress has been saved incrementally.");
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
