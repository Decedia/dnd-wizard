import fs from "fs";
import path from "path";

const FILE = "2014_classes_artificer-egw.json";
const TARGET_DIR = path.join(process.cwd(), "src/locales/parts/id");
const FILE_PATH = path.join(TARGET_DIR, FILE);

const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

// Common D&D terms that should stay in English
const FIXES = [
  // Action economy terms
  { from: "action", to: "Action" },
  { from: "Action", to: "Action" },
  { from: "reaction", to: "Reaction" },
  { from: "Reaction", to: "Reaction" },
  { from: "bonus action", to: "Bonus Action" },
  { from: "Bonus Action", to: "Bonus Action" },
  
  // Ability scores
  { from: "Intelligence", to: "Intelligence" },
  { from: "Intelligence modifier", to: "Intelligence modifier" },
  { from: "Intelligence mod", to: "Intelligence modifier" },
  { from: "Int mod", to: "Intelligence modifier" },
  { from: "Int modifier", to: "Intelligence modifier" },
  { from: "Strength", to: "Strength" },
  { from: "Dexterity", to: "Dexterity" },
  { from: "Constitution", to: "Constitution" },
  { from: "Wisdom", to: "Wisdom" },
  { from: "Charisma", to: "Charisma" },
  
  // Short forms
  { from: "Str", to: "Str" },
  { from: "Dex", to: "Dex" },
  { from: "Con", to: "Con" },
  { from: "Int", to: "Int" },
  { from: "Wis", to: "Wis" },
  { from: "Cha", to: "Cha" },
  
  // Sizes
  { from: "Tiny", to: "Tiny" },
  { from: "Small", to: "Small" },
  { from: "Medium", to: "Medium" },
  { from: "Large", to: "Large" },
  { from: "Huge", to: "Huge" },
  { from: "Gargantuan", to: "Gargantuan" },
  
  // Distances
  { from: "feet", to: "feet" },
  { from: "foot", to: "foot" },
  { from: "ft", to: "ft" },
  { from: "radius", to: "radius" },
  { from: "5-foot", to: "5-foot" },
  { from: "5 feet", to: "5 feet" },
  { from: "10 feet", to: "10 feet" },
  { from: "30 feet", to: "30 feet" },
  
  // Rest
  { from: "long rest", to: "long rest" },
  { from: "Long Rest", to: "long rest" },
  { from: "short rest", to: "short rest" },
  { from: "Short Rest", to: "short rest" },
  
  // Spell terms
  { from: "cantrip", to: "cantrip" },
  { from: "spell slot", to: "spell slot" },
  { from: "spell slots", to: "spell slots" },
  { from: "spellcasting", to: "spellcasting" },
  { from: "Spellcasting", to: "spellcasting" },
  { from: "spellcasting focus", to: "spellcasting focus" },
  { from: "spell list", to: "spell list" },
  { from: "spell level", to: "spell level" },
  { from: "1st-level", to: "1st-level" },
  { from: "2nd-level", to: "2nd-level" },
  
  // Tools
  { from: "thieves' tools", to: "thieves' tools" },
  { from: "Thieves' Tools", to: "thieves' tools" },
  { from: "artisan's tools", to: "artisan's tools" },
  { from: "Artisan's Tools", to: "artisan's tools" },
  { from: "smith's tools", to: "smith's tools" },
  { from: "woodcarver's tools", to: "woodcarver's tools" },
  { from: "alchemist's supplies", to: "alchemist's supplies" },
  
  // Class names
  { from: "artificer", to: "Artificer" },
  { from: "Artificer", to: "Artificer" },
  { from: "Alchemist", to: "Alchemist" },
  { from: "Armorer", to: "Armorer" },
  { from: "Artillerist", to: "Artillerist" },
  { from: "Battle Smith", to: "Battle Smith" },
  
  // Conditions/Mechanics
  { from: "advantage", to: "Advantage" },
  { from: "Advantage", to: "Advantage" },
  { from: "disadvantage", to: "Disadvantage" },
  { from: "Disadvantage", to: "Disadvantage" },
  { from: "proficiency bonus", to: "proficiency bonus" },
  { from: "proficiency", to: "proficiency" },
  { from: "ability check", to: "ability check" },
  { from: "saving throw", to: "saving throw" },
  { from: "saving throws", to: "saving throws" },
  { from: "attack roll", to: "attack roll" },
  { from: "AC", to: "AC" },
  { from: "Hit Points", to: "Hit Points" },
  { from: "HP", to: "HP" },
  { from: "DC", to: "DC" },
  { from: "Difficulty Class", to: "Difficulty Class" },
  
  // Attunement
  { from: "attune", to: "attune" },
  { from: "attunement", to: "attunement" },
  { from: "Attunement", to: "attunement" },
  { from: "attuned", to: "attuned" },
  
  // Rarity
  { from: "common", to: "common" },
  { from: "uncommon", to: "uncommon" },
  { from: "rare", to: "rare" },
  { from: "very rare", to: "very rare" },
  { from: "legendary", to: "legendary" },
  { from: "artifact", to: "artifact" },
  
  // Artificer features
  { from: "Infusion", to: "Infusion" },
  { from: "infusion", to: "infusion" },
  { from: "infusions", to: "infusions" },
  { from: "Infused Items", to: "Infused Items" },
  { from: "Spell-Storing Item", to: "Spell-Storing Item" },
  { from: "Magic Item Adept", to: "Magic Item Adept" },
  { from: "Magic Item Savant", to: "Magic Item Savant" },
  { from: "Magic Item Master", to: "Magic Item Master" },
  { from: "Soul of Artifice", to: "Soul of Artifice" },
  { from: "Tool Expertise", to: "Tool Expertise" },
  { from: "Flash of Genius", to: "Flash of Genius" },
  { from: "The Right Tool for the Job", to: "The Right Tool for the Job" },
  { from: "Magical Tinkering", to: "Magical Tinkering" },
  { from: "Infuse Item", to: "Infuse Item" },
  
  // Fix Indonesian artifacts
  { from: "dengan thieves' tools atau alat artisan's", to: "dengan thieves' tools atau artisan's tools" },
  { from: "alat artisan's", to: "artisan's tools" },
  { from: "percobaan", to: "ability check" }, // wrong translation
  { from: "lemparan selamat", to: "saving throw" }, // wrong translation
  { from: "pelemparan", to: "cast" },
  { from: "dilembarkan", to: "cast" },
  { from: "mengakhiri", to: "end" },
  { from: "memiliki keuntungan", to: "have Advantage" },
  { from: "keuntungan pada", to: "Advantage on" },
  { from: "diperdoubled", to: "doubled" },
  { from: "terpengaruh", to: "affected" },
  { from: "sekaligus", to: "at once" },
  { from: "membutuhkan seperempat", to: "takes a quarter" },
  { from: "waktu normal biasa", to: "normal time" },
  { from: "biaya emasnya hanya setengah", to: "costs half the usual gold" },
  { from: "mecast", to: "cast" },
  { from: "mengisi item biasa dengan infusi sihir", to: "imbue mundane items with magical infusions" },
  { from: "mengisinya dengan satu dari", to: "imbue it with one of" },
  { from: "sama dengan Infused Items kolom", to: "equal to Infused Items column" },
  { from: "Diberikan pada level", to: "Granted at level" },
  { from: "reach level", to: "reach level" },
  { from: "setiap kali Anda menyelesaikan long rest", to: "whenever you finish a long rest" },
  { from: "setiap kali kamu menyelesaikan long rest", to: "whenever you finish a long rest" },
  { from: "memilih spell tingkat 1 atau 2", to: "choosing a 1st- or 2nd-level spell" },
  { from: "untuk dilembarkan", to: "to cast" },
  { from: "menggunakan kemampuan spellcasting kamu modifier", to: "using your spellcasting ability modifier" },
  { from: "Dapat digunakan 2x kali Int mod", to: "Usable 2x Int mod" },
  { from: "diperbarui setelah long rest", to: "recharge after long rest" },
  { from: "Abaikan semua persyaratan", to: "Ignore all requirements" },
  { from: "mengakhiri satu infusi", to: "end one infusion" },
  { from: "menambahkan jumlah infused items", to: "add number of infused items" },
];

function fixText(text) {
  let result = text;
  
  // First, fix the base64 artifacts
  result = result.replace(/__PROTECTED_[A-Za-z0-9+/=]+__/g, '');
  result = result.replace(/__PROTECT_SW50ZWxsaWdlbmNl__/g, 'Intelligence');
  
  // Apply fixes - order matters, longer phrases first
  const sortedFixes = [...FIXES].sort((a, b) => b.from.length - a.from.length);
  
  for (const { from, to } of sortedFixes) {
    // Use word boundaries for whole words, but allow partial for compounds
    const regex = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, to);
  }
  
  // Clean up
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  result = result.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
  
  return result;
}

function fixObject(obj) {
  const fixed = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      fixed[k] = fixText(v);
    } else if (typeof v === 'object' && v !== null) {
      fixed[k] = fixObject(v);
    } else {
      fixed[k] = v;
    }
  }
  return fixed;
}

const fixedData = fixObject(data);
fs.writeFileSync(FILE_PATH, JSON.stringify(fixedData, null, 2));
console.log(`Fixed ${FILE}`);