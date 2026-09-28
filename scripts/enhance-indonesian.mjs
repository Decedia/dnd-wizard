import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const model = process.env.GEMMA_MODEL || "google/gemma-4-31b-it";
const apiKey = process.env.NIM_API_KEY;

if (!apiKey) {
  console.error("Missing NIM_API_KEY in environment.");
  process.exit(1);
}

const EN_LOCALE_FILE = path.resolve("src/locales/parts/en/2014_spells.json");
const ID_LOCALE_FILE = path.resolve("src/locales/parts/id/2014_spells.json");
const ID_PARTS_DIR = path.resolve("src/locales/parts/id");
const EN_DATA_FILE = path.resolve("src/data/en/2014_spells.json");
const PROGRESS_FILE = path.resolve("src/locales/parts/id/.enhance-progress.json");

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 3);
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
const BATCH_DELAY_MS = Number(process.env.BATCH_DELAY_MS || 5000);
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 4096);
const TEMPERATURE = 0.3;

// Mechanical terms that stay in English, matching the convention already used
// across src/locales/parts/id. Measured from the existing corpus: "saving throw",
// "spell", "target", "damage", "Action", "DC", "Advantage/Disadvantage" and
// "Hit Points" are English; distances ("kaki"), "range" ("jangkauan"),
// "duration" ("durasi"), "creature" ("makhluk") and damage types are translated.
const PROTECTED_TERMS = [
  // Core save/check vocabulary - by far the strongest English signal in the corpus
  "saving throw", "spell save DC", "DC", "attack roll", "ability check",
  // Action economy
  "Action", "Bonus Action", "Reaction", "Free Action",
  "Advantage", "Disadvantage", "Opportunity Attack",
  // Core nouns the app and UI already surface in English
  "spell", "Spell", "target", "Target", "damage", "Hit Points", "level",
  "roll", "slot", "Spell Slot", "Long Rest", "Short Rest",
  "Attack", "Melee", "Ranged", "Area", "Point",
  "crit", "critical hit",
];

const PROTECTED_REGEX = new RegExp(
  `\\b(${PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

function protectTerms(text) {
  return String(text).replace(PROTECTED_REGEX, (match) => `__PROTECTED_${Buffer.from(match).toString("base64")}__`);
}

function restoreTerms(text) {
  return String(text).replace(/__PROTECTED_([A-Za-z0-9+/=]+)__/g, (_, b64) => {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return "";
    }
  });
}

// A protected token that failed to survive the round trip means the model
// mangled it; keep the shielded form rather than silently dropping the term.
function restoreOrKeep(text) {
  return String(text).replace(/__PROTECTED_([A-Za-z0-9+/=]+)__/g, (_, b64) => {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return /[a-z]/i.test(decoded) ? decoded : `__PROTECTED_${b64}__`;
    } catch {
      return `__PROTECTED_${b64}__`;
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function groupBySlug(data) {
  const grouped = {};
  for (const [key, value] of Object.entries(data)) {
    const match = key.match(/^2014_spells\.([^.]+)\.(description|effectSummary|fullDescription|mechanics_badges|lastUpdated)$/);
    if (!match) continue;
    const slug = match[1];
    const field = match[2];
    if (!grouped[slug]) grouped[slug] = {};
    grouped[slug][field] = value;
  }
  return grouped;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// SRD fields are inconsistently shaped: `school` is a string in some spells and
// an {index,name,url} object in others. Send the model a plain readable value.
function fieldName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.index || "";
}

function describeComponents(components) {
  if (!components || typeof components !== "object") return "";
  const parts = [];
  if (components.verbal) parts.push("V");
  if (components.somatic) parts.push("S");
  if (components.material) parts.push(`M${components.materialDesc ? ` (${components.materialDesc})` : ""}`);
  return parts.join(", ");
}

// Reduce the nested {damage_type, damage_at_character_level} object to a short
// readable line so the model is not parsing raw API payloads.
function describeDamage(damage) {
  if (!damage || typeof damage !== "object") return "";
  const type = fieldName(damage.damage_type);
  const scaling = damage.damage_at_character_level;
  if (type && scaling && typeof scaling === "object") {
    const tiers = Object.entries(scaling)
      .map(([lvl, dice]) => `${lvl}: ${dice}`)
      .join(", ");
    return `${type} (${tiers})`;
  }
  if (type) return type;
  if (scaling && typeof scaling === "object") {
    return Object.entries(scaling)
      .map(([lvl, dice]) => `${lvl}: ${dice}`)
      .join(", ");
  }
  return "";
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      if (Array.isArray(progress.completed)) return new Set(progress.completed);
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

const SYSTEM_PROMPT = [
  "You are an expert D&D 5e technical writer and translator working in Bahasa Indonesia.",
  "You will receive spell entries written in English and must rewrite them into natural Bahasa Indonesia as STRICT raw JSON.",
  "",
  "RULES FOR SUMMARY (effectSummary):",
  "* Write a detailed, actionable one or two sentence overview in Bahasa Indonesia.",
  "* Keep it at least 20 words long.",
  "* Do not truncate or abbreviate the effect.",
  "",
  "RULES FOR DESCRIPTION:",
  "* Translate the description into clear, natural Bahasa Indonesia, following the style already used in this app.",
  "* Keep the full structure: paragraph breaks, list items using standard dashes (-), and any upcast or higher level text.",
  "* Do not remove, merge, or summarize away any rules, numbers, examples, or scaling text.",
  "* Dice stay as plain notation like 1d8 or bold **1d8**. Never spell them out or translate them.",
  "* Keep every number at its original value; only the surrounding wording is translated.",
  "* Translate these into Indonesian: creature (makhluk), range (jangkauan), duration (durasi),",
  "  feet (kaki), damage types (api, dingin, petir, guntur, asam, nekrotik, radiasi, kekuatan, psikis),",
  "  and conditions (buta, takut, tak terlihat, lumpuh, pusing, Fatigue, Kehilangan Nyawa).",
  "* Ability names are translated: Strength (Kekuatan), Dexterity (Destrezza), Constitution (Konstitusi),",
  "  Intelligence (Kecerdasan), Wisdom (Kearifan), Charisma (Karisma).",
  "* Preserve markdown bold exactly where it marks dice or key values.",
  "* Never translate or alter the spell name.",
  "",
  "RULES FOR PROTECTED TERMS:",
  "* Tokens of the form __PROTECTED_<base64>__ are D&D mechanical terms that must appear VERBATIM in your output.",
  "* Never translate, reorder inside, abbreviate, or drop them. Copy the whole token exactly as given.",
  "* This specifically covers 'saving throw', 'spell', 'target', 'damage', 'Action', 'Bonus Action',",
  "  'Reaction', 'DC', 'Advantage', 'Disadvantage', and 'Hit Points' - keep those in English.",
  "",
  "RULES FOR OUTPUT:",
  "* Output STRICT raw JSON only, with no markdown code fences and no commentary.",
  "* Map each spell slug to an object with exactly two keys: 'effectSummary' and 'description'.",
  "* 'description' must be a single string containing both markdown and protected tokens.",
].join("\n");

function buildUserPrompt(batch) {
  return (
    "Terjemahkan dan tulis ulang setiap spell di bawah ke dalam Bahasa Indonesia. " +
    "Kembalikan HANYA objek JSON yang memetakan slug spell ke {effectSummary, description}. " +
    "Pertahankan setiap token __PROTECTED_<base64>__ apa adanya. Tanpa penjelasan.\n\n" +
    JSON.stringify(batch)
  );
}

async function callGemma(batch, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callGemmaOnce(batch);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      const status = err.response?.status;
      const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 524 || status === 529 || err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
      if (!isLastAttempt && retryable) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`  Retry ${attempt}/${retries} after ${delay}ms due to: ${err.message}`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

async function callGemmaOnce(batch) {
  const body = {
    model,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(batch) },
    ],
  };

  const response = await axios.post(invokeUrl, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 300000,
  });

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from NVIDIA NIM");

  const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON object found in response: ${cleaned.slice(0, 500)}`);

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`Failed to parse JSON from response: ${jsonMatch[0].slice(0, 500)}`);
  }

  // Some models nest the payload under a single wrapper key.
  const keys = Object.keys(parsed);
  if (keys.length === 1 && parsed[keys[0]] && typeof parsed[keys[0]] === "object" && !("effectSummary" in parsed[keys[0]])) {
    return parsed[keys[0]];
  }
  return parsed;
}

function countProtectedTokens(text) {
  return (String(text).match(/__PROTECTED_[A-Za-z0-9+/=]+__/g) || []).length;
}

function validateResult(result, slug, shieldedSource) {
  const enhanced = result[slug];
  if (!enhanced || typeof enhanced !== "object") {
    return { ok: false, reason: "no entry in response" };
  }
  const summary = typeof enhanced.effectSummary === "string" ? enhanced.effectSummary.trim() : "";
  const description = typeof enhanced.description === "string" ? enhanced.description.trim() : "";
  if (!summary) return { ok: false, reason: "empty effectSummary" };
  if (!description) return { ok: false, reason: "empty description" };
  if (/__PROTECTED_/.test(summary)) return { ok: false, reason: "unrestored token in effectSummary" };

  // Compare against the text that was actually sent, which is the shielded form.
  const expected = countProtectedTokens(shieldedSource);
  const got = countProtectedTokens(description);
  if (got < expected) {
    return { ok: false, reason: `lost protected tokens (expected ${expected}, got ${got})` };
  }
  return { ok: true, summary, description };
}

function writeIdFiles(idData, slug, { summary, description }) {
  idData[`2014_spells.${slug}.effectSummary`] = summary;
  idData[`2014_spells.${slug}.description`] = description;
  idData[`2014_spells.${slug}.fullDescription`] = description;
  // Sort so related keys stay grouped together in the JSON output.
  const sorted = {};
  for (const key of Object.keys(idData).sort()) sorted[key] = idData[key];
  fs.writeFileSync(ID_LOCALE_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

  // Mirror into the per-spell part file so the modular locales stay in sync.
  const perSpellFile = path.join(ID_PARTS_DIR, `2014_spells_${slug}.json`);
  if (fs.existsSync(perSpellFile)) {
    const part = JSON.parse(fs.readFileSync(perSpellFile, "utf-8"));
    part[`2014_spells.${slug}.effectSummary`] = summary;
    part[`2014_spells.${slug}.description`] = description;
    part[`2014_spells.${slug}.fullDescription`] = description;
    fs.writeFileSync(perSpellFile, JSON.stringify(part, null, 2) + "\n", "utf-8");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const singleSpell = args.find((a) => a.startsWith("--spell="))?.split("=")[1];
  const reset = args.includes("--reset");
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number(limitArg) : Infinity;

  if (reset) {
    fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [] }, null, 2) + "\n", "utf-8");
    console.log("Progress reset.");
  }

  console.log(`Model: ${model}`);
  console.log("Loading spell data...");
  const enData = JSON.parse(fs.readFileSync(EN_LOCALE_FILE, "utf-8"));
  const enSpellsData = JSON.parse(fs.readFileSync(EN_DATA_FILE, "utf-8"));
  const enSpellsByIndex = new Map((enSpellsData.spells || []).map((s) => [s.index, s]));

  const idData = fs.existsSync(ID_LOCALE_FILE)
    ? JSON.parse(fs.readFileSync(ID_LOCALE_FILE, "utf-8"))
    : {};

  const grouped = groupBySlug(enData);
  const allSlugs = Object.keys(grouped);
  console.log(`Total spells found: ${allSlugs.length}`);

  const completedSet = loadProgress();
  if (completedSet.size) console.log(`Already completed: ${completedSet.size}`);

  let targetSpells = singleSpell ? [singleSpell] : allSlugs.filter((slug) => !completedSet.has(slug));
  if (Number.isFinite(limit)) targetSpells = targetSpells.slice(0, limit);
  console.log(`Target spells: ${targetSpells.length}`);

  const batches = chunkArray(targetSpells, BATCH_SIZE);
  console.log(`Batch size: ${BATCH_SIZE}, Total batches: ${batches.length}`);
  if (dryRun) console.log("Dry run: no files will be written.");

  let done = 0;
  let failed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const payload = {};

    for (const slug of batch) {
      const entry = grouped[slug] || {};
      const original = enSpellsByIndex.get(slug) || {};
      const name = original.name || slug;

      const source = entry.description || entry.fullDescription || original.description || "";
      if (!source) {
        console.warn(`  Skipping ${slug}: no source description found`);
        continue;
      }

      const shielded = protectTerms(source);
      payload[slug] = {
        name,
        level: original.level ?? "",
        school: fieldName(original.school),
        summary: entry.effectSummary || original.effectSummary || "",
        description: shielded,
        range: original.range || "",
        castingTime: original.castingTime || original.casting_time || "",
        duration: original.duration || "",
        components: describeComponents(original.components),
        damage: describeDamage(original.damage),
        save: original.saveType || "",
        onHit: original.onHit || "",
        upcastEffect: original.upcastEffect || "",
      };
    }

    const batchSlugs = Object.keys(payload);
    if (batchSlugs.length === 0) {
      console.log(`\nBatch ${batchIndex + 1}/${batches.length}: no descriptions, skipped.`);
      continue;
    }

    console.log(`\nBatch ${batchIndex + 1}/${batches.length}: translating ${batchSlugs.join(", ")}...`);

    let result;
    try {
      result = await callGemma(payload);
    } catch (err) {
      console.error(`  Batch failed: ${err.message}`);
      failed += batchSlugs.length;
      continue;
    }

    for (const slug of batchSlugs) {
      const validated = validateResult(result, slug, payload[slug].description);

      if (!validated.ok) {
        console.warn(`  Skipped ${slug}: ${validated.reason}`);
        failed++;
        continue;
      }

      const summary = restoreOrKeep(validated.summary);
      const description = restoreTerms(validated.description);

      console.log(`\n--- ${slug} ---`);
      console.log(`  EN summary : ${grouped[slug]?.effectSummary || ""}`);
      console.log(`  ID summary : ${summary}`);
      console.log(`  ID desc    : ${description.slice(0, 200)}${description.length > 200 ? "..." : ""}`);

      if (!dryRun) {
        writeIdFiles(idData, slug, { summary, description });
      }

      done++;
      if (!singleSpell) {
        completedSet.add(slug);
        if (!dryRun) saveProgress(completedSet);
      }
    }

    console.log(`\nBatch ${batchIndex + 1}/${batches.length} complete. (${done} ok, ${failed} failed)`);

    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`\nDone. ${done} translated, ${failed} failed.`);
  if (failed > 0) {
    console.log("Re-run without --reset to retry the remaining spells.");
  }
}

main();
