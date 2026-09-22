import OpenAI from "openai";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) process.env[key] = rest.join("=");
  }
}

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NIM_API_KEY,
});

const MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const BATCH_SIZE = 20;
const SOURCE_DIR = path.join(process.cwd(), "src/locales/parts/en");
const TARGET_DIR = path.join(process.cwd(), "src/locales/parts/id");
const SYSTEM_PROMPT =
  "You are a localization expert. Translate the values of this JSON object to Bahasa Indonesia. Translate both descriptions and summaries. CRITICAL D&D RULE: You MUST keep all official D&D 5e mechanical terms in English (e.g., Action, Bonus Action, Reaction, saving throw, ability check, AC, Hit Points, Advantage, Disadvantage). Return ONLY raw, valid JSON without any markdown formatting.";

function stripMarkdown(text) {
  return text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
}

function repairJson(text) {
  let repaired = text;
  let safety = 0;
  while (safety++ < 100) {
    try {
      JSON.parse(repaired);
      return repaired;
    } catch (e) {
      const msg = e.message;
      const posMatch = msg.match(/position (\d+)/);
      if (!posMatch) return repaired;
      const pos = parseInt(posMatch[1], 10);
      const before = repaired.slice(0, pos);
      const at = repaired[pos];
      if (at === '"' || at === "'") {
        const rest = repaired.slice(pos + 1);
        const closeIdx = rest.indexOf(at);
        if (closeIdx === -1) {
          repaired = before + at + rest.replace(/\n/g, "\\n").replace(/\r/g, "\\r") + at + repaired.slice(pos + 1 + rest.length);
        } else {
          repaired = before + at + rest.slice(0, closeIdx).replace(/\n/g, "\\n").replace(/\r/g, "\\r") + at + rest.slice(closeIdx);
        }
      } else if (at === "\n" || at === "\r") {
        repaired = before + "\\n" + repaired.slice(pos + 1);
      } else {
        repaired = before + '"' + repaired.slice(pos);
      }
    }
  }
  return repaired;
}

async function translateBatch(batch) {
  const userContent = `Translate EVERY value in this JSON object to Bahasa Indonesia. Keep all D&D 5e mechanical terms (Action, Bonus Action, Reaction, saving throw, ability check, AC, Hit Points, Advantage, Disadvantage, etc.) in English. Return ONLY the translated JSON object, no markdown, no explanation:\n\n${JSON.stringify(batch, null, 2)}`;
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
  });

  const raw = response.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from NIM");

  const cleaned = stripMarkdown(raw);
  const repaired = repairJson(cleaned);
  return JSON.parse(repaired);
}

async function main() {
  const filename = process.argv[2];
  if (!filename) {
    console.error("Usage: node scripts/translate-nim.mjs <filename.json>");
    process.exit(1);
  }

  const srcPath = path.join(SOURCE_DIR, filename);
  const dstPath = path.join(TARGET_DIR, filename);

  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dstPath), { recursive: true });

  const sourceData = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  const sourceKeys = Object.keys(sourceData);

  if (sourceKeys.length === 0) {
    console.log("Source file is empty. Nothing to translate.");
    return;
  }

  console.log(`📄 ${filename}: ${sourceKeys.length} keys to translate`);

  const batches = [];
  for (let i = 0; i < sourceKeys.length; i += BATCH_SIZE) {
    batches.push(sourceKeys.slice(i, i + BATCH_SIZE));
  }

  let result = {};
  for (let i = 0; i < batches.length; i++) {
    const batchKeys = batches[i];
    const batch = {};
    for (const key of batchKeys) {
      batch[key] = sourceData[key];
    }

    console.log(`\n🔁 Batch ${i + 1}/${batches.length} (${batchKeys.length} items)`);

    try {
      const translated = await translateBatch(batch);
      result = { ...result, ...translated };
      fs.writeFileSync(dstPath, JSON.stringify(result, null, 2));
      console.log(`  ✅ Saved. Progress: ${Object.keys(result).length}/${sourceKeys.length}`);
    } catch (err) {
      console.error(`  ❌ Batch ${i + 1} failed:`, err.message);
      throw err;
    }
  }

  console.log(`\n🎉 Done! ${filename}: ${Object.keys(result).length}/${sourceKeys.length} keys translated.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
