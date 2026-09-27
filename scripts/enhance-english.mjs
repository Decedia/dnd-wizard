import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const model = "google/gemma-4-31b-it";
const apiKey = process.env.NIM_API_KEY;

if (!apiKey) {
  console.error("Missing NIM_API_KEY in environment.");
  process.exit(1);
}

const spellFile = path.resolve("src/locales/parts/en/2014_spells.json");
const BATCH_SIZE = 1;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
const BATCH_DELAY_MS = 2000;
const PROGRESS_FILE = path.resolve("src/locales/parts/en/.enhance-progress.json");

const SYSTEM_PROMPT = "You are an expert D&D 5e technical writer. Rewrite the provided spell or feature text into a JSON object with three required keys: 'summary', 'mechanics_badges', and 'description'. RULES FOR SUMMARY: * Must be a detailed, actionable overview at least 20 words long. RULES FOR MECHANICS_BADGES: * An array of short string badges for core mechanics (e.g., ['1 Action', '150 ft', 'DEX Save'], ['WIS (Perception) Check'], or ['1 Reaction', 'Self']). RULES FOR DESCRIPTION & TEXT FORMATTING: * Write clean Markdown for the description. Use standard dashes (-) for lists, NEVER asterisks (*). * Apply the dice badge to any dice-related text (e.g., 1d6, 8d6). * Apply the damage type badge to any damage-related text (e.g., fire, slashing). * Do not alter any core game rules or stats. STRICT OUTPUT FORMAT: Output STRICTLY raw JSON. Do NOT wrap the response in markdown blocks like ```json. Do NOT include any intro or conversational text.";

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function groupSpells(data) {
  const grouped = {};

  for (const [key, value] of Object.entries(data)) {
    const match = key.match(/^2014_spells\.([^.]+)\.(description|effectSummary|fullDescription)$/);
    if (!match) continue;

    const spellName = match[1];
    const field = match[2];

    if (!grouped[spellName]) {
      grouped[spellName] = { description: "", effectSummary: "", fullDescription: "" };
    }
    grouped[spellName][field] = value;
  }

  return grouped;
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
      const progress = JSON.parse(raw);
      if (Array.isArray(progress.completed)) {
        return new Set(progress.completed);
      }
    }
  } catch (err) {
    console.warn("Could not load progress file:", err.message);
  }
  return new Set();
}

function saveProgress(completedSet) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: Array.from(completedSet) }, null, 2) + "\n", "utf-8");
  } catch (err) {
    console.warn("Could not save progress:", err.message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callNvidiaNimWithRetry(batch, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callNvidiaNim(batch);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      const status = err.response?.status;
      const shouldRetry = !isLastAttempt && (status === 429 || status === 502 || status === 503 || status === 524 || status === 529 || err.code === "ECONNABORTED" || err.code === "ETIMEDOUT");

      if (shouldRetry) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`  Retry ${attempt}/${retries} after ${delay}ms due to: ${err.message}`);
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }
}

async function callNvidiaNim(batch) {
  const userPrompt = `Rewrite each spell below into {summary, description}. Keep rules exact. Output ONLY a JSON object mapping spell name to {summary, description}. No markdown, no extra text.\n\n` + JSON.stringify(batch);

  const body = {
    model,
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  };

  const response = await axios.post(invokeUrl, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 110000,
  });

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA NIM");
  }

  const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in response: ${cleaned.slice(0, 500)}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`Failed to parse JSON from response: ${jsonMatch[0].slice(0, 500)}`);
  }
}

async function main() {
  console.log("Loading spell data...");
  const raw = fs.readFileSync(spellFile, "utf-8");
  const data = JSON.parse(raw);

  const grouped = groupSpells(data);
  const spellNames = Object.keys(grouped);
  console.log(`Total spells found: ${spellNames.length}`);

  const completedSet = loadProgress();
  const remaining = spellNames.filter((name) => !completedSet.has(name));
  console.log(`Already completed: ${completedSet.size}, Remaining: ${remaining.length}`);

  const batches = chunkArray(remaining, BATCH_SIZE);
  console.log(`Batch size: ${BATCH_SIZE}, Total batches: ${batches.length}`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const payload = {};
    const spellNamesInBatch = [];

    for (const name of batch) {
      const entry = grouped[name];
      if (entry && entry.description) {
        payload[name] = entry.description;
        spellNamesInBatch.push(name);
      }
    }

    if (spellNamesInBatch.length === 0) {
      console.log(`Batch ${batchIndex + 1}/${batches.length}: skipped (no descriptions)`);
      continue;
    }

    console.log(`\nBatch ${batchIndex + 1}/${batches.length}: enhancing ${spellNamesInBatch.join(", ")}...`);

    const result = await callNvidiaNimWithRetry(payload);

    for (const name of spellNamesInBatch) {
      const enhanced = result[name];

      if (!enhanced || typeof enhanced !== "object") {
        console.warn(`  Skipped ${name}: no enhanced data returned`);
        completedSet.add(name);
        saveProgress(completedSet);
        continue;
      }

      const summary = typeof enhanced.summary === "string" ? enhanced.summary : "";
      const description = typeof enhanced.description === "string" ? enhanced.description : "";

      console.log(`\n--- ${name} ---`);
      console.log(`Original summary: ${grouped[name].effectSummary || ""}`);
      console.log(`Original description: ${grouped[name].description.slice(0, 200)}${grouped[name].description.length > 200 ? "..." : ""}`);
      console.log(`New summary: ${summary}`);
      console.log(`New description: ${description.slice(0, 200)}${description.length > 200 ? "..." : ""}`);

      if (summary) {
        data[`2014_spells.${name}.effectSummary`] = summary;
      }
      if (description) {
        data[`2014_spells.${name}.description`] = description;
        data[`2014_spells.${name}.fullDescription`] = description;
      }

      grouped[name].effectSummary = summary;
      grouped[name].description = description;
      grouped[name].fullDescription = description;

      console.log(`  Updated ${name}`);
      completedSet.add(name);
      fs.writeFileSync(spellFile, JSON.stringify(data, null, 2) + "\n", "utf-8");
      saveProgress(completedSet);
    }

    console.log(`\nBatch ${batchIndex + 1}/${batches.length} complete.`);

    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("\nDone.");
}

main();
