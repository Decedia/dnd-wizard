import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.NIM_API_KEY || "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",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "nvidia/nemotron-3-super-120b-a12b";
let BATCH_SIZE = 10;
const MIN_BATCH = 2;
const SOURCE_DIR = path.join(process.cwd(), "src/locales/parts/en");
const TARGET_DIR = path.join(process.cwd(), "src/locales/parts/id");

const TAG_PATTERN = /\[(?:Active|Passive)(?:\s*\([^)]+\))?\]|\[(?:Action|Bonus Action|Reaction|Free Action)\]|\((?:Action|Bonus Action|Reaction|Free Action)\)/g;

function shieldTags(text) {
  const tags = [];
  let shielded = text.replace(TAG_PATTERN, (match) => {
    const placeholder = `__TAG${tags.length}__`;
    tags.push(match);
    return placeholder;
  });
  return { shielded, tags };
}

function restoreTags(shielded, tags) {
  let restored = shielded;
  for (let i = 0; i < tags.length; i++) {
    restored = restored.replace(`__TAG${i}__`, tags[i]);
  }
  return restored;
}

function shieldBatch(batch) {
  const shieldedBatch = {};
  const tagMap = {};
  for (const [key, value] of Object.entries(batch)) {
    if (typeof value === "string") {
      const { shielded, tags } = shieldTags(value);
      shieldedBatch[key] = shielded;
      if (tags.length > 0) tagMap[key] = tags;
    } else {
      shieldedBatch[key] = value;
    }
  }
  return { shieldedBatch, tagMap };
}

function restoreBatch(batch, tagMap) {
  const restored = {};
  for (const [key, value] of Object.entries(batch)) {
    if (typeof value === "string" && tagMap[key]) {
      restored[key] = restoreTags(value, tagMap[key]);
    } else {
      restored[key] = value;
    }
  }
  return restored;
}

function stripMarkdown(text) {
  return text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
}

function extractJson(text) {
  const start = text.indexOf("{");
  if (start === -1) return text;
  let depth = 0;
  let inStr = false;
  let strChar = "";
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (inStr) { if (ch === strChar) inStr = false; continue; }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return text.slice(start);
}

function repairJson(text) {
  let repaired = text;
  let safety = 0;
  while (safety++ < 100) {
    try { JSON.parse(repaired); return repaired; }
    catch (e) {
      const posMatch = e.message.match(/position (\d+)/);
      if (!posMatch) return repaired;
      const pos = parseInt(posMatch[1], 10);
      const before = repaired.slice(0, pos);
      const at = repaired[pos];
      if (at === '"' || at === "'") {
        const rest = repaired.slice(pos + 1);
        const closeIdx = rest.indexOf(at);
        if (closeIdx === -1) repaired = before + at + rest.replace(/\n/g, "\\n").replace(/\r/g, "\\r") + at + repaired.slice(pos + 1 + rest.length);
        else repaired = before + at + rest.slice(0, closeIdx).replace(/\n/g, "\\n").replace(/\r/g, "\\r") + at + rest.slice(closeIdx);
      } else if (at === "\n" || at === "\r") repaired = before + "\\n" + repaired.slice(pos + 1);
      else repaired = before + '"' + repaired.slice(pos);
    }
  }
  return repaired;
}

async function translateBatch(batch, maxRetries = 3) {
  const { shieldedBatch, tagMap } = shieldBatch(batch);
  const originalKeys = Object.keys(shieldedBatch);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
`You are an expert RPG Game Designer and Localization Lead. Your job is to process raw D&D 5e JSON data. For every entry you process, you must do TWO things:
1. Rewrite the confusing English summary/description into a clear, concise format.
2. TRANSLATE that clear version into natural Bahasa Indonesia (Indonesian language).
CRITICAL D&D RULE: You MUST keep all official D&D 5e mechanical terms in English (e.g., Action, Bonus Action, Reaction, Free Action, saving throw, ability check, AC, Armor Class, Hit Points, HP, Advantage, Disadvantage, critical hit, Initiative, Concentration, spell slot, cantrip, Proficiency, proficiency bonus, DC, Difficulty Class, short rest, long rest, Darkvision, dim light, bright light, level, etc.). Do NOT touch the __TAG0__ style placeholders. Return ONLY valid JSON with the SAME KEYS as input. Do not add new keys. OUTPUT MUST BE IN BAHASA INDONESIA.`
          },
          { role: "user", content: JSON.stringify(shieldedBatch) },
        ],
        temperature: 0.2,
        top_p: 0.95,
        max_tokens: 16384,
        chat_template_kwargs: { enable_thinking: false },
        stream: false,
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) throw new Error("Empty response from NIM");

      const cleaned = stripMarkdown(responseText);
      const extracted = extractJson(cleaned);
      const repaired = repairJson(extracted);
      const parsed = JSON.parse(repaired);
      
      // Filter to only original keys (LLM sometimes adds _id duplicates)
      const filtered = {};
      for (const key of originalKeys) {
        if (parsed[key] !== undefined) {
          filtered[key] = parsed[key];
        }
      }
      
      return restoreBatch(filtered, tagMap);
    } catch (err) {
      const status = err.status || err.code;
      if (status === 429 || status === 503) {
        const wait = Math.min(2 ** attempt * 5, 60);
        console.log(`  ⏳ Transient error ${status}. Retrying in ${wait}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (status === 413 || (err.message && err.message.includes("too large"))) {
        BATCH_SIZE = Math.max(MIN_BATCH, Math.floor(BATCH_SIZE / 2));
        console.log(`  ⚠ Batch too large. Reducing batch size to ${BATCH_SIZE}.`);
        throw err;
      }
      throw err;
    }
  }
  throw new Error(`NIM: max retries (${maxRetries}) exceeded for batch`);
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

  const checkpointPath = dstPath.replace(/\.json$/, ".checkpoint.json");
  let result = {};
  let processed = 0;

  if (fs.existsSync(checkpointPath)) {
    try {
      const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
      processed = checkpoint.processed || 0;
      result = checkpoint.result || {};
      console.log(`📦 Resumed from checkpoint: ${processed}/${sourceKeys.length} keys already done`);
    } catch {
      processed = 0;
      result = {};
    }
  }

  if (processed >= sourceKeys.length) {
    console.log(`✅ All ${sourceKeys.length} keys already translated.`);
    return;
  }

  console.log(`📄 ${filename}: ${sourceKeys.length} keys to translate (resuming from ${processed})`);

  while (processed < sourceKeys.length) {
    const batchKeys = sourceKeys.slice(processed, processed + BATCH_SIZE);
    const batch = {};
    for (const key of batchKeys) {
      batch[key] = sourceData[key];
    }

    const batchNum = Math.floor(processed / BATCH_SIZE) + 1;
    console.log(`\n🔁 Batch ${batchNum} (${batchKeys.length} items, batch size=${BATCH_SIZE})`);

    try {
      const translated = await translateBatch(batch);
      result = { ...result, ...translated };
      processed += batchKeys.length;
      fs.writeFileSync(dstPath, JSON.stringify(result, null, 2));
      fs.writeFileSync(checkpointPath, JSON.stringify({ processed, result }, null, 2));
      console.log(`  ✅ Saved. Progress: ${Object.keys(result).length}/${sourceKeys.length}`);
    } catch (err) {
      console.error(`  ⚠ Batch ${batchNum} failed after retries:`, err.message);
      console.error(`  ⏭ Skipping ${batchKeys.length} keys and continuing...`);
      processed += batchKeys.length;
    }
  }

  if (fs.existsSync(checkpointPath)) {
    fs.unlinkSync(checkpointPath);
  }

  console.log(`\n🎉 Done! ${filename}: ${Object.keys(result).length}/${sourceKeys.length} keys translated.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});