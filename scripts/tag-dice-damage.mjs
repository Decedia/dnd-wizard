import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RACES_FILE = path.join(__dirname, "..", "src", "locales", "parts", "en", "2014_races.json");

const data = JSON.parse(fs.readFileSync(RACES_FILE, "utf8"));

// Dice notation pattern
const DICE_PATTERN = /\b(\d+d\d+(?:\+\d+)?)\b/g;

// Damage types
const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", 
  "lightning", "necrotic", "piercing", "poison", 
  "psychic", "radiant", "slashing", "thunder"
];

function tagDiceAndDamage(text) {
  let result = text;
  
  // Tag dice notation: 2d6 -> {@dice 2d6}
  result = result.replace(DICE_PATTERN, (match) => `{@dice ${match}}`);
  
  // Tag damage types (case insensitive, whole words only)
  for (const dmg of DAMAGE_TYPES) {
    const regex = new RegExp(`\\b${dmg}\\b`, "gi");
    result = result.replace(regex, (match) => `{@damage ${match.toLowerCase()}}`);
  }
  
  return result;
}

function processValue(key, value) {
  if (typeof value === "string") {
    // Only process description and summary fields
    if (key.endsWith(".description") || key.endsWith(".summary")) {
      return tagDiceAndDamage(value);
    }
  }
  return value;
}

function processObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = processValue(key, value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = processObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const processed = processObject(data);
fs.writeFileSync(RACES_FILE, JSON.stringify(processed, null, 2));
console.log("Tagged dice and damage types in 2014_races.json");