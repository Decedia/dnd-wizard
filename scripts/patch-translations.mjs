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
const TARGET_FILE = path.join(process.cwd(), "src/locales/parts/id/2014_races.json");

const PROTECTED_TERMS = [
  "Action", "Bonus Action", "Reaction", "Free Action", "Action Surge",
  "saving throw", "attack roll", "Advantage", "Disadvantage", "critical hit",
  "Hit Points", "HP", "AC", "Armor Class", "Initiative", "Concentration",
  "spell slot", "cantrip", "evocation", "V", "S", "M",
  "20-foot radius", "30 feet", "cone", "sphere", "line", "cube",
  "Charmed", "Prone", "Frightened", "Grappled", "Restrained", "Incapacitated",
  "Sneak Attack", "Rage", "Bardic Inspiration", "Darkvision",
  "bludgeoning", "piercing", "slashing", "fire", "necrotic", "radiant",
  "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma",
  "passive Perception", "Skill", "Proficiency", "Level", "Turn", "Round",
  "Range", "Duration", "School", "Damage", "Condition", "Effect", "Target",
  "Area", "Self", "Creature", "Point", "Sphere", "Cube", "Cone", "Line",
  "Cylinder", "Hemisphere", "Touch", "Special", "Melee", "Ranged",
  "Weapon", "Armor", "Shield", "Heavy", "Light", "Medium", "Finesse",
  "Two-Handed", "Versatile", "Thrown", "Ammunition", "Loading", "Reach",
  "Stealth", "normal", "long", "ft", "feet", "mile", "miles",
  "kilometer", "kilometers", "meter", "meters", "lb", "lbs", "pound", "pounds",
  "gp", "sp", "cp", "pp", "ep", "gold", "silver", "copper", "platinum", "electrum",
  "Rarity", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact",
  "Attunement", "Requires Attunement", "Cursed", "Sentient",
  "alignment", "Lawful", "Neutral", "Chaotic", "Good", "Evil",
  " proficiency", "bonus", "penalty", "modifier", "check", "save", "DC",
  "Difficulty Class", "Spellcasting", " Spellcasting", "Focus", "Component",
  "Material", "Verbal", "Somatic", "Ritual", "Duration", "Instantaneous",
  "Permanent", "Concentration", "up to", "level", "slot", "slots",
  "higher level", "at higher levels", "Using", "use", "uses", "recharge",
  "Charges", "Charge", "rest", "short rest", "long rest",
  "hit dice", "Hit Dice", "Death Saving Throw", "success", "failure",
  "stabilized", "dying", "dead", "exhaustion", "level of exhaustion",
  "Speed", "Fly", "Swim", "Climb", "Burrow", "Walk", "Vision", "Blind",
  "deafened", "paralyzed", "petrified", "poisoned", "stunned", "unconscious",
  "invisible", "detect", "sense", "resistance", "immune", "vulnerable",
  "advantage", "disadvantage", "proficiency bonus", "expertise",
  "Jack of All Trades", "Remarkable Athlete", "Reliable Talent",
  "Slippery Mind", "Keen Mind", "Lucky", "Alert", "Mobile", "Resilient",
  "Skilled", "Tavern Brawler", "Weapon Master", "Grappler", "Inspiring Leader",
  "Healer", "Medium Armor Master", "Heavily Armored", "Lightly Armored",
  "Martial Adept", "Metamagic Adept", "Fighting Initiate", "Strixhaven Mascot",
  "Fey Touched", "Shadow Touched", "Telekinetic", "Telepathic",
  "Artificer Initiate", "Crusher", "Piercer", "Slasher",
  "Flames of Phlegethos", "Gift of the Metallic Dragon", "Dungeon Delver",
  "Eldritch Adept", "Fey Wanderer", "Genie", "Giant", "Gloom Stalker",
  "Horizon Walker", "Monster Slayer", "Primeval Guardian", "Swarmkeeper",
  "Rune Knight", "Psi Warrior", "Aberrant Dragonmark",
  "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock",
  "Wizard", "Fighter", "Monk", "Rogue", "Barbarian", "Artificer", "Blood Hunter",
  "Alchemist", "Armorer", "Battle Smith", "Artillerist",
  "Dragon", "Disciple", "Echo", "Ghost", "Gloom", "Horizon", "Hunter",
  "Lore", "Life", "Light", "Nature", "Tempest", "Trickery", "War",
  "Knowledge", "Arcana", "History", "Religion", "Beast", "Wild", "Circle",
  "Dreams", "Spores", "Stars", "Shepherd", "Land", "Devotion", "Ancients",
  "Vengeance", "Oathbreaker", "Crown", "Glory", "Redemption", "Watchers",
  "Oath", "Fey", "Fiend", "Undying", "Hexblade", "Undead", "Phantom",
  "Fathomless", "Archfey", "Celestial",
  "Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation",
  "Illusion", "Necromancy", "Transmutation",
];

const ENGLISH_INDICATORS = [
  "You have", "You can", "You gain", "You know",
  "you have", "you can", "you gain", "you know",
  "advantage", "disadvantage", "Choose", "choose",
  "Select", "select", "Roll", "roll",
  "When you", "when you", "Your ", "your ",
  "As a", "as a", " bonus", " proficiency",
  " ability", " skill", " spell", " damage",
  " attack", " turn", " round",
];

function buildProtectedRegex() {
  const escaped = PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

const PROTECTED_REGEX = buildProtectedRegex();

function protectTerms(text) {
  return text.replace(PROTECTED_REGEX, (match) => `__PROTECTED_${Buffer.from(match).toString("base64")}__`);
}

function restoreTerms(text) {
  return text.replace(/__PROTECTED_([A-Za-z0-9+/=]+)__/g, (_, b64) => Buffer.from(b64, "base64").toString("utf8"));
}

function isLikelyEnglish(text) {
  if (!text || text.trim().length === 0) return false;
  
  const lower = text.toLowerCase();
  
  // Check for English indicator words
  const hasIndicator = ENGLISH_INDICATORS.some(ind => lower.includes(ind));
  if (!hasIndicator) return false;
  
  // Check if it contains Indonesian words (if so, likely already translated)
  const indonesianWords = [
    "yang", "dengan", "untuk", "dari", "adalah", "ini", "itu", "dapat", "membuat", "memiliki",
    "kamu", "anda", "mereka", "kami", "saya", "dia", "nya", "kita", "terima", "menerima",
    "senjata", "armor", "peralatan", "pekerjaan", "masalah", "cara",
    "menggunakan", "mendapatkan", "bisa", "tidak",
    "pada", "dalam", "ke", "di",
  ];
  
  const hasIndonesian = indonesianWords.some(w => lower.includes(w));
  if (hasIndonesian) return false;
  
  return true;
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
  const protectedBatch = {};
  const originalKeys = Object.keys(batch);
  
  // Protect terms in all string values
  for (const [key, value] of Object.entries(batch)) {
    if (typeof value === "string") {
      protectedBatch[key] = protectTerms(value);
    } else {
      protectedBatch[key] = value;
    }
  }

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
CRITICAL D&D RULE: You MUST keep all official D&D 5e mechanical terms in English (e.g., Action, Bonus Action, Reaction, Free Action, saving throw, ability check, AC, Armor Class, Hit Points, HP, Advantage, Disadvantage, critical hit, Initiative, Concentration, spell slot, cantrip, Proficiency, proficiency bonus, DC, Difficulty Class, short rest, long rest, Darkvision, dim light, bright light, level, etc.). Do NOT touch the __PROTECTED_* style placeholders. Return ONLY valid JSON with the SAME KEYS as input. Do not add new keys. OUTPUT MUST BE IN BAHASA INDONESIA.`
          },
          { role: "user", content: JSON.stringify(protectedBatch) },
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
      
      // Filter to only original keys
      const filtered = {};
      for (const key of originalKeys) {
        if (parsed[key] !== undefined) {
          filtered[key] = parsed[key];
        }
      }
      
      // Restore protected terms
      const restored = {};
      for (const [key, value] of Object.entries(filtered)) {
        if (typeof value === "string") {
          restored[key] = restoreTerms(value);
        } else {
          restored[key] = value;
        }
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
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`Target file not found: ${TARGET_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(TARGET_FILE, "utf8"));
  const keys = Object.keys(data);
  
  // Find keys that need translation
  const toTranslate = [];
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && isLikelyEnglish(value)) {
      toTranslate.push(key);
    }
  }

  if (toTranslate.length === 0) {
    console.log("✅ No English text found. All translations appear complete.");
    return;
  }

  console.log(`📄 Found ${toTranslate.length} keys that need translation out of ${keys.length} total keys`);

  let processed = 0;
  let skipped = 0;

  while (processed < toTranslate.length) {
    const batchKeys = toTranslate.slice(processed, processed + BATCH_SIZE);
    const batch = {};
    for (const key of batchKeys) {
      batch[key] = data[key];
    }

    const batchNum = Math.floor(processed / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);
    console.log(`\n🔁 Batch ${batchNum}/${totalBatches} (${batchKeys.length} items, batch size=${BATCH_SIZE})`);

    try {
      const translated = await translateBatch(batch);
      for (const key of batchKeys) {
        if (translated[key] !== undefined) {
          data[key] = translated[key];
        } else {
          console.log(`  ⚠ Key "${key}" not found in translation result, skipping`);
          skipped++;
        }
      }
      processed += batchKeys.length;
      console.log(`  ✅ Translated. Progress: ${processed}/${toTranslate.length}`);
    } catch (err) {
      console.error(`  ⚠ Batch ${batchNum} failed after retries:`, err.message);
      console.error(`  ⏭ Skipping ${batchKeys.length} keys and continuing...`);
      processed += batchKeys.length;
      skipped += batchKeys.length;
    }
  }

  fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 2));
  console.log(`\n🎉 Done! Patched ${toTranslate.length - skipped}/${toTranslate.length} keys in 2014_races.json.`);
  if (skipped > 0) {
    console.log(`⚠️  ${skipped} keys were skipped due to errors.`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
