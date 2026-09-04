export const RECOMMENDED_CLASSES = new Set([
  "Fighter",
  "Rogue",
  "Cleric",
  "Paladin",
  "Ranger",
]);

export const RECOMMENDED_RACES = new Set([
  "Human",
  "Dwarf",
  "Elf",
  "Halfling",
]);

export const RECOMMENDED_SUBCLASSES: Record<string, Set<string>> = {
  Fighter: new Set(["Champion", "Battle Master"]),
  Rogue: new Set(["Thief", "Assassin"]),
  Cleric: new Set(["Life Domain", "Knowledge Domain"]),
  Wizard: new Set(["School of Evocation"]),
  Warlock: new Set(["The Fiend"]),
  Bard: new Set(["College of Lore", "College of Valor"]),
  Druid: new Set(["Circle of the Land"]),
  Sorcerer: new Set(["Draconic Bloodline"]),
  Paladin: new Set(["Oath of Devotion", "Oath of Redemption"]),
  Ranger: new Set(["Hunter"]),
  Barbarian: new Set(["Path of the Berserker"]),
  Monk: new Set(["Way of the Open Hand"]),
};

export const RECOMMENDED_SPELLS = new Set([
  "Magic Missile",
  "Cure Wounds",
  "Shield",
  "Burning Hands",
  "Hunter's Mark",
  "Bless",
  "Healing Word",
  "Guiding Bolt",
  "Scorching Ray",
  "Heat Metal",
  "Hold Person",
  "Misty Step",
  "Spiritual Weapon",
  "Fireball",
  "Lightning Bolt",
  "Counterspell",
  "Revivify",
  "Spirit Guardians",
  "Fire Bolt",
  "Sacred Flame",
  "Ray of Frost",
  "Mage Hand",
  "Prestidigitation",
  "Thaumaturgy",
  "Minor Illusion",
  "Toll the Dead",
]);

export const RECOMMENDED_SKILLS = new Set([
  "Perception",
  "Athletics",
  "Stealth",
  "Persuasion",
]);

export const RECOMMENDED_STATS: Record<string, string[]> = {
  Fighter: ["STR", "CON"],
  Rogue: ["DEX", "INT"],
  Cleric: ["WIS", "CON"],
  Paladin: ["STR", "CHA"],
  Ranger: ["DEX", "WIS"],
  Barbarian: ["STR", "CON"],
  Bard: ["CHA", "DEX"],
  Druid: ["WIS", "CON"],
  Monk: ["DEX", "WIS"],
  Sorcerer: ["CHA", "CON"],
  Warlock: ["CHA", "CON"],
  Wizard: ["INT", "CON"],
};

export function isRecommended(type: "class" | "race" | "subclass" | "spell" | "skill" | "stat", name: string, className?: string): boolean {
  switch (type) {
    case "class":
      return RECOMMENDED_CLASSES.has(name);
    case "race":
      return RECOMMENDED_RACES.has(name);
    case "subclass":
      return className ? (RECOMMENDED_SUBCLASSES[className]?.has(name) ?? false) : false;
    case "spell":
      return RECOMMENDED_SPELLS.has(name);
    case "skill":
      return RECOMMENDED_SKILLS.has(name);
    case "stat":
      return className ? RECOMMENDED_STATS[className]?.includes(name) ?? false : false;
    default:
      return false;
  }
}
