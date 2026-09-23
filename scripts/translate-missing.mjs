import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.NIM_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "nvidia/nemotron-3-super-120b-a12b";
const BATCH_SIZE = 5;
const SOURCE_DIR = path.join(process.cwd(), "src/locales/parts/en");
const TARGET_DIR = path.join(process.cwd(), "src/locales/parts/id");

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
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      esc = true;
      continue;
    }
    if (inStr) {
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strChar = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return text.slice(start);
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

async function translateBatch(batch, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a translation engine. Output ONLY a JSON object. No reasoning, no explanations, no markdown. Start your response with { and end with }. Translate every value to Bahasa Indonesia. Keep D&D 5e mechanical terms in English exactly as written: Action, Bonus Action, Reaction, Free Action, saving throw, ability check, AC, Armor Class, Hit Points, HP, Advantage, Disadvantage, critical hit, Initiative, Concentration, spell slot, cantrip, Proficiency, proficiency bonus, DC, Difficulty Class, short rest, long rest, Darkvision, dim light, bright light, level, etc.",
          },
          { role: "user", content: JSON.stringify(batch) },
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
      return JSON.parse(repaired);
    } catch (err) {
      const status = err.status || err.code;
      if (status === 429 || status === 503) {
        const wait = Math.min(2 ** attempt * 5, 60);
        console.log(`  ⏳ Transient error ${status}. Retrying in ${wait}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (err instanceof SyntaxError) {
        const wait = Math.min(2 ** attempt * 3, 30);
        console.log(`  ⚠ JSON parse error. Retrying in ${wait}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
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

  const sourceData = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  const existing = fs.existsSync(dstPath) ? JSON.parse(fs.readFileSync(dstPath, "utf8")) : {};
  const missingKeys = Object.keys(sourceData).filter(k => !existing[k]);

  if (missingKeys.length === 0) {
    console.log(`✅ All keys already translated.`);
    return;
  }

  console.log(`📄 ${filename}: ${missingKeys.length} missing keys to translate`);

  let result = { ...existing };
  let processed = 0;
  while (processed < missingKeys.length) {
    const batchKeys = missingKeys.slice(processed, processed + BATCH_SIZE);
    const batch = {};
    for (const key of batchKeys) {
      batch[key] = sourceData[key];
    }

    const batchNum = Math.floor(processed / BATCH_SIZE) + 1;
    console.log(`\n🔁 Batch ${batchNum} (${batchKeys.length} items)`);

    try {
      const translated = await translateBatch(batch);
      result = { ...result, ...translated };
      processed += batchKeys.length;
      fs.writeFileSync(dstPath, JSON.stringify(result, null, 2));
      console.log(`  ✅ Saved. Progress: ${Object.keys(result).length}/${Object.keys(sourceData).length}`);
    } catch (err) {
      console.error(`  ⚠ Batch ${batchNum} failed:`, err.message);
      processed += batchKeys.length;
    }
  }

  console.log(`\n🎉 Done! ${filename}: ${Object.keys(result).length}/${Object.keys(sourceData).length} keys translated.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
