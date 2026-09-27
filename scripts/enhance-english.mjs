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

const SYSTEM_PROMPT = "You are an expert D&D 5e technical writer. Rewrite the provided text into a JSON object with 'summary' and 'description'. RULES FOR SUMMARY: It MUST be at least 20 words long. It should be a detailed, actionable overview of the spell or feature. RULES FOR DESCRIPTION: Clean Markdown, bolding dice rolls like 8d6, using bullet points for lists. Do not change rules. OUTPUT STRICTLY RAW JSON. Do not use markdown formatting blocks like ```json. Do not include conversational text.";

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

  const batches = chunkArray(spellNames, 1);
  console.log(`Batch size: 1, Total batches: ${batches.length}`);

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

    console.log(`Batch ${batchIndex + 1}/${batches.length}: enhancing ${spellNamesInBatch.join(", ")}...`);

    for (const name of spellNamesInBatch) {
      const singlePayload = { [name]: payload[name] };

      const originalDescription = grouped[name].description;
      const originalSummary = grouped[name].effectSummary || "";

      console.log(`\n--- ${name} ---`);
      console.log(`Original summary: ${originalSummary}`);
      console.log(`Original description: ${originalDescription.slice(0, 200)}${originalDescription.length > 200 ? "..." : ""}`);

      try {
        const result = await callNvidiaNim(singlePayload);
        const enhanced = result[name];

        if (!enhanced || typeof enhanced !== "object") {
          console.warn(`  Skipped ${name}: no enhanced data returned`);
          continue;
        }

        const summary = typeof enhanced.summary === "string" ? enhanced.summary : "";
        const description = typeof enhanced.description === "string" ? enhanced.description : "";

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
        fs.writeFileSync(spellFile, JSON.stringify(data, null, 2) + "\n", "utf-8");
      } catch (err) {
        console.error(`  Failed ${name}:`, err.message);
      }
    }

    console.log(`\nBatch ${batchIndex + 1}/${batches.length} complete. Saved progress.\n`);
  }

  console.log("Done.");
}

main();

