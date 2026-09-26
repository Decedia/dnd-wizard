import fs from "fs";
import path from "path";
import https from "https";

const EN_DIR = path.join(process.cwd(), "src/data/en");
const ID_DIR = path.join(process.cwd(), "src/data/id");

const FILES = [
  { name: "2014_races.json", root: "races", label: (item) => item.name || item.race || "unknown", batchSize: 10 },
  { name: "2014_classes.json", root: "classes", label: (item) => item.name || "unknown", batchSize: 1 },
];

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 2000;

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
  "Cylinder", "Hemisphere", "Touch", "Special", "Melee", "Ranged", "Weapon",
  "Armor", "Shield", "Heavy", "Light", "Medium", "Finesse", "Two-Handed",
  "Versatile", "Thrown", "Ammunition", "Loading", "Reach", "Stealth", "Range",
  "normal", "long", "ft", "feet", "mile", "miles", "kilometer", "kilometers",
  "meter", "meters", "lb", "lbs", "pound", "pounds", "gp", "sp", "cp", "pp",
  "ep", "gold", "silver", "copper", "platinum", "electrum", "Rarity",
  "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact",
  "Attunement", "Requires Attunement", "Cursed", "Sentient",
  "Intelligence", "Wisdom", "Charisma", "alignment", "Lawful", "Neutral",
  "Chaotic", "Good", "Evil", " proficiency", "bonus", "penalty", "modifier",
  "check", "save", "DC", "Difficulty Class", "Spellcasting", "Focus",
  "Component", "Material", "Verbal", "Somatic", "Ritual", "Duration",
  "Instantaneous", "Permanent", "Concentration", "up to", "level", "slot",
  "slots", "higher level", "at higher levels", "Using", "use", "uses",
  "recharge", "Charges", "Charge", "rest", "short rest", "long rest",
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
  "Artificer Initiate", "Crusher", "Piercer", "Slasher", "Flames of Phlegethos",
  "Gift of the Metallic Dragon", "Dungeon Delver", "Eldritch Adept",
  "Fey Wanderer", "Genie", "Giant", "Gloom Stalker", "Horizon Walker",
  "Monster Slayer", "Primeval Guardian", "Swarmkeeper", "Rune Knight",
  "Psi Warrior", "Aberrant Dragonmark", "Bard", "Cleric", "Druid", "Paladin",
  "Ranger", "Sorcerer", "Warlock", "Wizard", "Fighter", "Monk", "Rogue",
  "Barbarian", "Artificer", "Blood Hunter", "Artificer", "Alchemist",
  "Armorer", "Battle Smith", "Artillerist", "Dragon", "Disciple", "Echo",
  "Ghost", "Gloom", "Horizon", "Hunter", "Lore", "Life", "Light", "Nature",
  "Tempest", "Trickery", "War", "Knowledge", "Arcana", "History", "Nature",
  "Religion", "Beast", "Wild", "Circle", "Dreams", "Spores", "Stars",
  "Shepherd", "Land", "Devotion", "Ancients", "Vengeance", "Oathbreaker",
  "Crown", "Glory", "Redemption", "Watchers", "Oath", "Beast", "Fey", "Fiend",
  "Undying", "Genie", "Great", "Old", "Hexblade", "Undead", "Undead",
  "Phantom", "Genie", "Fathomless", "Ghost", "Archfey", "Celestial", "Fiend",
  "Great", "Old", "Undying", "Hexblade", "Aberrant", "Clockwork", "Lore",
  "War", "Illusion", "Necromancy", "Transmutation", "Abjuration", "Conjuration",
  "Divination", "Enchantment", "Evocation", "Rune", "Psi", "Wild", "Magic",
  "Psi", "Warrior", "Rune", "Knight", "Swarmkeeper", "Monster", "Slayer",
  "Horizon", "Gloom", "Stalker", "Fey", "Wanderer", "Giant", "Genie",
  "Fathomless", "Ghost", "Archfey", "Celestial", "Fiend", "Great", "Old",
  "Undying", "Hexblade", "Aberrant", "Clockwork", "Lore", "War", "Illusion",
  "Necromancy", "Transmutation", "Abjuration", "Conjuration", "Divination",
  "Enchantment", "Evocation", "Rune", "Psi", "Wild", "Magic", "Psi",
  "Warrior", "Rune", "Knight", "Swarmkeeper", "Monster", "Slayer",
  "Horizon", "Gloom", "Stalker", "Fey", "Wanderer", "Giant", "Genie",
  "Fathomless", "Ghost", "Archfey", "Celestial", "Fiend", "Great", "Old",
  "Undying", "Hexblade", "Aberrant", "Clockwork", "Lore", "War", "Illusion",
  "Necromancy", "Transmutation", "Abjuration", "Conjuration", "Divination",
  "Enchantment", "Evocation", "Rune", "Psi", "Wild", "Magic", "Psi",
  "Warrior", "Rune", "Knight", "Swarmkeeper", "Monster", "Slayer",
  "Horizon", "Gloom", "Stalker", "Fey", "Wanderer", "Giant", "Genie",
  "Fathomless", "Ghost", "Archfey", "Celestial", "Fiend", "Great", "Old",
  "Undying", "Hexblade",
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

function shieldPlaceholders(text) {
  return text.replace(/\{@[^}]+\}/g, () => `__TAG${Buffer.from(Math.random().toString()).toString("base64").slice(0, 8)}__`);
}

function unshieldPlaceholders(text) {
  return text.replace(/__TAG[A-Za-z0-9+/=]+__/g, (match) => match);
}

function sanitizeLabel(name) {
  const base = String(name || "item").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return base || "item";
}

async function translateText(text) {
  const apiKey = process.env.RIVA_API_KEY;
  if (!apiKey) throw new Error("Missing RIVA_API_KEY environment variable.");

  const payload = JSON.stringify({
    model: "nvidia/riva-translate-4b-instruct-v2",
    messages: [
      {
        role: "system",
        content:
          "You are an expert English to Bahasa Indonesia translator. You will receive a JSON object of text strings. Translate the VALUES into natural Bahasa Indonesia. Do NOT translate or alter the JSON keys. Keep all D&D mechanical terms (e.g., Action, Hit Points) and placeholders (e.g., TAG0) strictly in English. You MUST return ONLY valid JSON.",
      },
      { role: "user", content: text },
    ],
    temperature: 0.2,
  });

  const url = new URL("https://integrate.api.nvidia.com/v1/chat/completions");

  const response = await new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error(`Failed to parse response: ${body}`)); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });

  if (response.error) throw new Error(`Riva API error: ${response.error.message}`);
  const translated = response.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("Empty translation response");
  return translated;
}

function buildBatchPayload(items) {
  const payload = {};
  for (const item of items) {
    const label = sanitizeLabel(item._label);
    if (typeof item.summary === "string" && item.summary.trim()) {
      payload[`${label}_summary`] = protectTerms(item.summary);
    }
    if (typeof item.description === "string" && item.description.trim()) {
      payload[`${label}_description`] = protectTerms(item.description);
    }
  }
  return payload;
}

function applyBatchResult(data, items, result) {
  for (const item of items) {
    const label = sanitizeLabel(item._label);
    const summaryKey = `${label}_summary`;
    const descriptionKey = `${label}_description`;

    if (typeof item.summary === "string" && item.summary.trim() && result[summaryKey] !== undefined) {
      data.summary = restoreTerms(unshieldPlaceholders(result[summaryKey]));
    }
    if (typeof item.description === "string" && item.description.trim() && result[descriptionKey] !== undefined) {
      data.description = restoreTerms(unshieldPlaceholders(result[descriptionKey]));
    }
  }
}

async function translateBatch(items) {
  const payload = buildBatchPayload(items);
  const raw = await translateText(JSON.stringify(payload));
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON response: ${err.message}`);
  }
  for (const item of items) {
    applyBatchResult(item, items, parsed);
  }
}

function getItemsToTranslate(fileConfig) {
  const srcPath = path.join(EN_DIR, fileConfig.name);
  const data = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  const items = data[fileConfig.root] || [];
  return items.map((item) => ({
    ...item,
    _label: fileConfig.label(item),
  }));
}

function saveFile(fileName, data) {
  const dstPath = path.join(ID_DIR, fileName);
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, JSON.stringify(data, null, 2));
}

function buildChunks(items, batchSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }
  return chunks;
}

async function translateFile(fileConfig) {
  const items = getItemsToTranslate(fileConfig);
  const chunks = buildChunks(items, fileConfig.batchSize || BATCH_SIZE);
  const totalBatches = chunks.length;

  console.log(`\n${fileConfig.name}: ${items.length} items, ${totalBatches} batches`);
  for (let i = 0; i < chunks.length; i++) {
    const startItem = i * (fileConfig.batchSize || BATCH_SIZE) + 1;
    const endItem = Math.min((i + 1) * (fileConfig.batchSize || BATCH_SIZE), items.length);
    console.log(`[Batch ${i + 1}/${totalBatches}] Processing items ${startItem} to ${endItem}...`);
    try {
      await translateBatch(chunks[i]);
      saveFile(fileConfig.name, { [fileConfig.root]: items });
      const completed = Math.min(endItem, items.length);
      const pct = Math.round((completed / items.length) * 100);
      console.log(`✅ [Batch ${i + 1}/${totalBatches}] Success! Progress: ${completed}/${items.length} items (${pct}%). Incremental save complete.`);
    } catch (err) {
      console.log(`⚠️ [Batch ${i + 1}/${totalBatches}] Failed. Skipping... ${err.message}`);
    }
    if (i + 1 < totalBatches) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}

async function main() {
  console.log("Found files to translate with Riva batch mode (en -> id):");
  FILES.forEach((f) => console.log(`  ${f.name}`));
  console.log("WARNING: Translating SRD data may use significant API credits.\n");

  let totalItems = 0;
  let totalBatches = 0;
  for (const file of FILES) {
    const items = getItemsToTranslate(file);
    totalItems += items.length;
    totalBatches += Math.ceil(items.length / (file.batchSize || BATCH_SIZE));
  }
  console.log(`Total items to translate: ${totalItems}`);
  console.log(`Total batches: ${totalBatches}\n`);

  let processed = 0;
  for (const file of FILES) {
    try {
      await translateFile(file);
      processed++;
    } catch (err) {
      console.error(`Failed to translate ${file.name}:`, err);
    }
  }

  console.log(`\n🎉 Translation Complete! ${processed}/${FILES.length} files processed.`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
