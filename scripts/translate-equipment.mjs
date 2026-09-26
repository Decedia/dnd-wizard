import fs from "fs";
import path from "path";
import { translate } from "@vitalets/google-translate-api";

const ROOT = process.cwd();
const EQUIPMENT_FILE = path.join(ROOT, "src", "data", "id", "2014_equipments.json");

const BATCH_SIZE = 5;
const DELAY_MS = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text) {
  if (!text || text.trim().length === 0) return text;
  try {
    const res = await translate(text, { to: "id" });
    return res.text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
}

async function translateBatch(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i++) {
    results.push(await translateText(texts[i]));
    if (i < texts.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  return results;
}

async function main() {
  const content = fs.readFileSync(EQUIPMENT_FILE, "utf-8");
  const data = JSON.parse(content);
  const equipments = data.equipments || data;

  let updated = 0;
  const toTranslate = [];
  const indices = [];

  for (let i = 0; i < equipments.length; i++) {
    const item = equipments[i];
    if (item.description && item.description.trim().length > 0) {
      const indonesianWords = ["yang", "dengan", "untuk", "dari", "adalah", "ini", "itu", "dapat", "membuat", "memiliki"];
      const hasIndonesian = indonesianWords.some(w => item.description.toLowerCase().includes(w));
      if (!hasIndonesian) {
        toTranslate.push(item.description);
        indices.push(i);
      }
    }
  }

  console.log(`Found ${toTranslate.length} English descriptions to translate`);

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const batchIndices = indices.slice(i, i + BATCH_SIZE);
    console.log(`Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toTranslate.length / BATCH_SIZE)}...`);
    
    const translations = await translateBatch(batch);
    for (let j = 0; j < translations.length; j++) {
      const idx = batchIndices[j];
      if (translations[j] && translations[j] !== batch[j]) {
        equipments[idx].description = translations[j];
        updated++;
      }
    }
    
    if (i + BATCH_SIZE < toTranslate.length) {
      await sleep(500);
    }
  }

  fs.writeFileSync(EQUIPMENT_FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\nUpdated ${updated} equipment descriptions`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
