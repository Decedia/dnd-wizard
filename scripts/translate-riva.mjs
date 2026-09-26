import fs from "fs";
import path from "path";
import https from "https";

const EN_DIR = path.join(process.cwd(), "src/data/en");
const ID_DIR = path.join(process.cwd(), "src/data/id");

const TRANSLATABLE_KEYS = new Set([
  "description", "fullDescription", "flavorText", "effectSummary", "summary", "languageDesc",
]);

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

async function translateText(text) {
  const apiKey = process.env.RIVA_API_KEY;
  if (!apiKey) throw new Error("Missing RIVA_API_KEY environment variable.");

  const payload = JSON.stringify({
    model: "nvidia/riva-translate-4b-instruct-v2",
    messages: [
      { role: "system", content: "en-id" },
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
        Authorization: `Bearer ${process.env.RIVA_API_KEY}`,
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

async function translateTextWithRetry(text, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await translateText(text);
      return result;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`  Retry ${i + 1}/${maxRetries} after error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

let totalTranslated = 0;

async function translateValue(value, enValue, path = "") {
  if (typeof value === "string" && typeof enValue === "string") {
    if (value !== enValue && value.length > 0) {
      return value;
    }
    totalTranslated++;
    const protectedText = protectTerms(enValue);
    const shieldedText = shieldPlaceholders(protectedText);
    const translated = await translateTextWithRetry(shieldedText);
    const unshielded = unshieldPlaceholders(translated);
    return restoreTerms(unshielded);
  }
  
  if (Array.isArray(value) && Array.isArray(enValue)) {
    const out = [];
    for (let i = 0; i < enValue.length; i++) {
      out.push(await translateValue(value[i], enValue[i], `${path}[${i}]`));
    }
    return out;
  }
  
  if (value && typeof value === "object" && enValue && typeof enValue === "object") {
    const out = {};
    for (const key of Object.keys(enValue)) {
      out[key] = await translateValue(value?.[key], enValue[key], `${path}.${key}`);
    }
    return out;
  }
  
  return value;
}

async function processFile(fileName) {
  const srcPath = path.join(EN_DIR, fileName);
  const dstPath = path.join(ID_DIR, fileName);
  
  const enData = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  let idData = {};
  
  if (fs.existsSync(dstPath)) {
    idData = JSON.parse(fs.readFileSync(dstPath, "utf8"));
  }
  
  totalTranslated = 0;
  console.log(`Processing ${fileName}...`);
  const translated = await translateValue(idData, enData);
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, JSON.stringify(translated, null, 2));
  console.log(`Translated ${totalTranslated} fields in ${fileName}`);
}

async function main() {
  const files = [
    "2014_races.json", "2014_classes.json", "2014_subclasses.json", "2014_feats.json", "2024_phb.json",
  ];

  console.log("Found files to translate with Riva (en -> id):");
  files.forEach((f) => console.log(`  ${f}`));
  console.log("WARNING: Translating all SRD data may use significant API credits.\n");

  let processed = 0;
  for (const file of files) {
    try {
      await processFile(file);
      processed++;
      console.log(`Progress: ${processed}/${files.length}`);
      if (processed < files.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error(`Failed to translate ${file}:`, err);
    }
  }

  console.log(`\nRiva translation complete. ${processed}/${files.length} files processed.`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
