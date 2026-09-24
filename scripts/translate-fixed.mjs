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

const PROTECTED_TERMS = [
  // D&D Mechanical Terms - MUST stay in English
  "Action", "Bonus Action", "Reaction", "Free Action",
  "saving throw", "attack roll", "ability check", "skill check",
  "AC", "Armor Class", "Hit Points", "HP", "Advantage", "Disadvantage",
  "critical hit", "Initiative", "Concentration", "spell slot", "cantrip",
  "Proficiency", "proficiency bonus", "DC", "Difficulty Class",
  "short rest", "long rest", "Darkvision", "dim light", "bright light",
  "level", "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma",
  "Str", "Dex", "Con", "Int", "Wis", "Cha",
  "modifier", "bonus", "penalty", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan",
  "feet", "foot", "ft", "mile", "miles", "radius", "cone", "sphere", "line", "cube", "cylinder", "hemisphere",
  "bludgeoning", "piercing", "slashing", "fire", "cold", "lightning", "thunder", "poison", "acid", "psychic", "necrotic", "radiant", "force",
  "Charmed", "Prone", "Frightened", "Grappled", "Restrained", "Incapacitated", "Paralyzed", "Petrified", "Poisoned", "Stunned", "Unconscious", "Invisible", "Blinded", "Deafened",
  "Sneak Attack", "Rage", "Bardic Inspiration", "Action Surge", "Ki Points", "Sorcery Points", "Channel Divinity",
  "attunement", "attune", "Attunement",
  "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact",
  "Requires Attunement", "Cursed", "Sentient",
  "alignment", "Lawful", "Neutral", "Chaotic", "Good", "Evil",
  "exhaustion", "level of exhaustion", "hit dice", "Hit Dice", "Death Saving Throw",
  "Speed", "Fly", "Swim", "Climb", "Burrow", "Walk",
  "Vision", "passive Perception",
  "Melee", "Ranged", "Weapon", "Armor", "Shield", "Heavy", "Light", "Medium",
  "Finesse", "Two-Handed", "Versatile", "Thrown", "Ammunition", "Loading", "Reach",
  "Range", "normal", "long", "Duration", "Instantaneous", "Permanent",
  "School", "Tradition", "evocation", "conjuration", "divination", "enchantment", "illusion", "necromancy", "transmutation", "abjuration",
  "V", "S", "M", "Component", "Material", "Verbal", "Somatic", "Ritual",
  "Artificer", "Alchemist", "Armorer", "Artillerist", "Battle Smith",
  "Thieves' Tools", "thieves' tools", "Artisan's Tools", "artisan's tools",
  "smith's tools", "woodcarver's tools", "alchemist's supplies",
  "Infusion", "infusion", "Infused Items", "Spell-Storing Item", "Magic Item Adept", "Magic Item Savant", "Magic Item Master", "Soul of Artifice",
  "Tool Expertise", "Flash of Genius", "The Right Tool for the Job", "Magical Tinkering", "Infuse Item", "Spellcasting",
];

function protectTerms(text) {
  let result = text;
  for (const term of PROTECTED_TERMS) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, (match) => `__PROTECTED_${Buffer.from(match).toString("base64")}__`);
  }
  return result;
}

function restoreTerms(text) {
  return text.replace(/__PROTECTED_([A-Za-z0-9+/=]+)__/g, (_, b64) => Buffer.from(b64, "base64").toString("utf8"));
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
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Protect terms in the batch
      const protectedBatch = {};
      for (const [k, v] of Object.entries(batch)) {
        if (typeof v === 'string') protectedBatch[k] = protectTerms(v);
        else protectedBatch[k] = v;
      }

      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              `You are a D&D 5e localization expert translating from English to Bahasa Indonesia.

CRITICAL RULES:
1. Translate ONLY narrative/descriptive text to natural Bahasa Indonesia
2. NEVER translate these protected terms (they appear as __PROTECTED_xxx__ in the input - keep them exactly as-is):
   - All D&D mechanical terms: Action, Bonus Action, Reaction, Free Action, saving throw, attack roll, ability check, AC, Hit Points, Advantage, Disadvantage, critical hit, Initiative, Concentration, spell slot, cantrip, Proficiency, proficiency bonus, DC, Difficulty Class, short rest, long rest, Darkvision
   - Ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma (and abbreviations Str, Dex, Con, Int, Wis, Cha)
   - Damage types: bludgeoning, piercing, slashing, fire, cold, lightning, thunder, poison, acid, psychic, necrotic, radiant, force
   - Conditions: Charmed, Prone, Frightened, Grappled, Restrained, Incapacitated, Paralyzed, Petrified, Poisoned, Stunned, Unconscious, Invisible, Blinded, Deafened
   - Class features: Sneak Attack, Rage, Bardic Inspiration, Action Surge, Ki Points, Sorcery Points, Channel Divinity
   - Sizes: Tiny, Small, Medium, Large, Huge, Gargantuan
   - Distances: feet, foot, ft, radius, cone, sphere, line, cube, cylinder, hemisphere
   - Item properties: Finesse, Two-Handed, Versatile, Thrown, Ammunition, Loading, Reach, Melee, Ranged
   - Magic: attunement, attune, spell slot, cantrip, Concentration, Ritual, components V/S/M
   - Rarities: Common, Uncommon, Rare, Very Rare, Legendary, Artifact, Requires Attunement
   - Class names: Artificer, Alchemist, Armorer, Artillerist, Battle Smith, Fighter, Wizard, etc.
   - Tool names: Thieves' Tools, Artisan's Tools, smith's tools, woodcarver's tools, alchemist's supplies
   - Artificer-specific: Infusion, Infuse Item, Spell-Storing Item, Magic Item Adept, Magic Item Savant, Magic Item Master, Soul of Artifice, Tool Expertise, Flash of Genius, The Right Tool for the Job, Magical Tinkering

3. Keep ALL protected terms EXACTLY as they appear in English (case-sensitive)
4. Use natural, fluent Bahasa Indonesia for narrative parts only
5. Output ONLY valid JSON object. No markdown, no explanations, no reasoning.
6. Start with { and end with }`
          },
          { role: "user", content: JSON.stringify(protectedBatch) },
        ],
        temperature: 0.1,
        top_p: 0.9,
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
      
      // Restore protected terms
      const restored = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') restored[k] = restoreTerms(v);
        else restored[k] = v;
      }
      return restored;
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
    console.error("Usage: node scripts/translate-fixed.mjs <filename.json>");
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

  console.log(`📄 ${filename}: ${missingKeys.length} missing keys to translate (with protected terms)`);

  let result = { ...existing };
  let processed = 0;
  while (processed < missingKeys.length) {
    const batchKeys = missingKeys.slice(processed, processed + BATCH_SIZE);
    const batch = {};
    for (const key of batchKeys) batch[key] = sourceData[key];

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