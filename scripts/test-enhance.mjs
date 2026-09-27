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

  console.log("Request payload size:", JSON.stringify(body).length, "bytes");

  const response = await axios.post(invokeUrl, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  console.log("Response status:", response.status);

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA NIM");
  }

  console.log("Raw response content:", content.slice(0, 500));

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
  const testSpells = ["acid-splash", "blade-bite", "booming-blade"];

  const payload = {};
  for (const name of testSpells) {
    const entry = grouped[name];
    if (entry && entry.description) {
      payload[name] = entry.description;
    }
  }

  console.log(`\nTesting with ${testSpells.length} spells: ${testSpells.join(", ")}...\n`);

  try {
    const result = await callNvidiaNim(payload);

    for (const name of testSpells) {
      const enhanced = result[name];
      if (!enhanced || typeof enhanced !== "object") {
        console.warn(`  Skipped ${name}: no enhanced data returned`);
        continue;
      }

      const summary = typeof enhanced.summary === "string" ? enhanced.summary : "";
      const description = typeof enhanced.description === "string" ? enhanced.description : "";

      console.log(`\n=== ${name} ===`);
      console.log(`Original summary: ${grouped[name].effectSummary || ""}`);
      console.log(`Original description: ${grouped[name].description.slice(0, 200)}...`);
      console.log(`New summary: ${summary}`);
      console.log(`New description: ${description.slice(0, 200)}...`);
    }
  } catch (err) {
    console.error(`Failed:`, err.message);
  }
}

main();
