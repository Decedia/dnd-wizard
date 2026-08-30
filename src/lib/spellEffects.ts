"use client";

export type EffectType =
  | "ac_bonus"
  | "temp_hp"
  | "speed_bonus"
  | "fly_speed"
  | "swim_speed"
  | "burrow_speed"
  | "darkvision"
  | "advantage_save"
  | "advantage_check"
  | "resistance"
  | "immunity"
  | "damage_bonus"
  | "attack_bonus"
  | "disadvantage_attacks";

export interface SpellEffect {
  type: EffectType;
  value?: number;
  ability?: string;
  damageType?: string;
  description: string;
}

export interface BuffDefinition {
  id: string;
  name: string;
  level: number;
  classes: string[];
  concentration: boolean;
  effects: SpellEffect[];
}

export const BUFF_DEFINITIONS: Record<string, BuffDefinition> = {
  "mage-armor": {
    id: "mage-armor",
    name: "Mage Armor",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "ac_bonus", value: 13, description: "AC becomes 13 + Dex modifier" }],
  },
  "shield-of-faith": {
    id: "shield-of-faith",
    name: "Shield of Faith",
    level: 1,
    classes: ["Paladin", "Cleric"],
    concentration: true,
    effects: [{ type: "ac_bonus", value: 2, description: "+2 AC" }],
  },
  "armor-of-agathys": {
    id: "armor-of-agathys",
    name: "Armor of Agathys",
    level: 1,
    classes: ["Warlock"],
    concentration: false,
    effects: [{ type: "temp_hp", value: 5, description: "5 temporary hit points" }],
  },
  "longstrider": {
    id: "longstrider",
    name: "Longstrider",
    level: 1,
    classes: ["Bard", "Druid", "Ranger", "Wizard"],
    concentration: false,
    effects: [{ type: "speed_bonus", value: 10, description: "Speed +10 ft" }],
  },
  "absorb-elements": {
    id: "absorb-elements",
    name: "Absorb Elements",
    level: 1,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Resistance to triggering damage type" }],
  },
  "shield": {
    id: "shield",
    name: "Shield",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "ac_bonus", value: 5, description: "+5 AC until start of next turn" }],
  },
  "darkvision": {
    id: "darkvision",
    name: "Darkvision",
    level: 2,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "darkvision", value: 60, description: "60 ft darkvision" }],
  },
  "enhance-ability": {
    id: "enhance-ability",
    name: "Enhance Ability",
    level: 2,
    classes: ["Bard", "Cleric", "Druid", "Sorcerer"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Advantage on ability checks" }],
  },
  "enlarge-reduce": {
    id: "enlarge-reduce",
    name: "Enlarge/Reduce",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [
      { type: "advantage_check", ability: "str", description: "Advantage on Strength checks" },
      { type: "damage_bonus", value: 1, description: "+1d4 damage (Enlarge)" },
    ],
  },
  "alter-self": {
    id: "alter-self",
    name: "Alter Self",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "swim_speed", description: "Swimming speed equals walking speed" }],
  },
  "blur": {
    id: "blur",
    name: "Blur",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "disadvantage_attacks", description: "Attack rolls against you have disadvantage" }],
  },
  "protection-from-energy": {
    id: "protection-from-energy",
    name: "Protection from Energy",
    level: 3,
    classes: ["Cleric", "Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Resistance to chosen damage type" }],
  },
  "haste": {
    id: "haste",
    name: "Haste",
    level: 3,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [
      { type: "ac_bonus", value: 2, description: "+2 AC" },
      { type: "speed_bonus", description: "Speed doubled" },
      { type: "advantage_save", ability: "dex", description: "Advantage on Dexterity saves" },
    ],
  },
  "fly": {
    id: "fly",
    name: "Fly",
    level: 3,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "fly_speed", value: 60, description: "60 ft fly speed" }],
  },
  "gaseous-form": {
    id: "gaseous-form",
    name: "Gaseous Form",
    level: 3,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [
      { type: "fly_speed", value: 10, description: "10 ft fly speed" },
      { type: "resistance", description: "Resistance to nonmagical damage" },
    ],
  },
  "fire-shield": {
    id: "fire-shield",
    name: "Fire Shield",
    level: 4,
    classes: ["Wizard"],
    concentration: false,
    effects: [{ type: "resistance", damageType: "fire", description: "Resistance to fire damage" }],
  },
  "stoneskin": {
    id: "stoneskin",
    name: "Stoneskin",
    level: 4,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Resistance to nonmagical B/P/S" }],
  },
  "holy-aura": {
    id: "holy-aura",
    name: "Holy Aura",
    level: 8,
    classes: ["Cleric"],
    concentration: true,
    effects: [{ type: "advantage_save", description: "Advantage on all saving throws" }],
  },
  "wish": {
    id: "wish",
    name: "Wish",
    level: 9,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Resistance to one damage type for 8 hours" }],
  },
  "blade-ward": {
    id: "blade-ward",
    name: "Blade Ward",
    level: 0,
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Resistance to B/P/S from weapon attacks" }],
  },
  "friends": {
    id: "friends",
    name: "Friends",
    level: 0,
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", ability: "cha", description: "Advantage on Charisma checks" }],
  },
  "divine-favor": {
    id: "divine-favor",
    name: "Divine Favor",
    level: 1,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "+1d4 radiant damage on weapon attacks" }],
  },
  "expeditious-retreat": {
    id: "expeditious-retreat",
    name: "Expeditious Retreat",
    level: 1,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "speed_bonus", description: "Dash as bonus action" }],
  },
  "false-life": {
    id: "false-life",
    name: "False Life",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "temp_hp", value: 5, description: "1d4+4 temporary hit points" }],
  },
  "searing-smite": {
    id: "searing-smite",
    name: "Searing Smite",
    level: 1,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "+1d6 fire damage on next hit" }],
  },
  "thunderous-smite": {
    id: "thunderous-smite",
    name: "Thunderous Smite",
    level: 1,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 2, description: "+2d6 thunder damage on next hit" }],
  },
  "wrathful-smite": {
    id: "wrathful-smite",
    name: "Wrathful Smite",
    level: 1,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "+1d6 psychic damage on next hit" }],
  },
  "zephyr-strike": {
    id: "zephyr-strike",
    name: "Zephyr Strike",
    level: 1,
    classes: ["Ranger"],
    concentration: true,
    effects: [{ type: "speed_bonus", description: "No opportunity attacks, +1d8 damage on first hit" }],
  },
  "branding-smite": {
    id: "branding-smite",
    name: "Branding Smite",
    level: 2,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 2, description: "+2d6 radiant damage on next hit" }],
  },
  "flame-blade": {
    id: "flame-blade",
    name: "Flame Blade",
    level: 2,
    classes: ["Druid"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 3, description: "3d6 fire damage weapon" }],
  },
  "kinetic-jaunt": {
    id: "kinetic-jaunt",
    name: "Kinetic Jaunt",
    level: 2,
    classes: ["Bard", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "speed_bonus", description: "No opportunity attacks, double melee damage" }],
  },
  "mirror-image": {
    id: "mirror-image",
    name: "Mirror Image",
    level: 2,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "disadvantage_attacks", description: "3 duplicates, attacks may target them instead" }],
  },
  "pass-without-trace": {
    id: "pass-without-trace",
    name: "Pass Without Trace",
    level: 2,
    classes: ["Druid", "Ranger"],
    concentration: true,
    effects: [{ type: "advantage_check", ability: "dex", description: "+10 bonus to Stealth checks" }],
  },
  "shadow-blade": {
    id: "shadow-blade",
    name: "Shadow Blade",
    level: 2,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 2, description: "2d8 psychic damage weapon" }],
  },
  "warding-wind": {
    id: "warding-wind",
    name: "Warding Wind",
    level: 2,
    classes: ["Bard", "Druid", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Difficult terrain around you, deafened" }],
  },
  "blink": {
    id: "blink",
    name: "Blink",
    level: 3,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "disadvantage_attacks", description: "50% chance to vanish to Ethereal Plane" }],
  },
  "spirit-shroud": {
    id: "spirit-shroud",
    name: "Spirit Shroud",
    level: 3,
    classes: ["Cleric", "Paladin", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "+1d8 extra damage on attacks" }],
  },
  "vampiric-touch": {
    id: "vampiric-touch",
    name: "Vampiric Touch",
    level: 3,
    classes: ["Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 3, description: "3d6 necrotic damage, heal half" }],
  },
  "malicious-smite": {
    id: "malicious-smite",
    name: "Malicious Smite",
    level: 6,
    classes: ["Paladin"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 4, description: "+4d6 necrotic damage on next hit" }],
  },
  "sunbeam": {
    id: "sunbeam",
    name: "Sunbeam",
    level: 6,
    classes: ["Druid", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 6, description: "6d8 radiant damage, blind target" }],
  },
  "mislead": {
    id: "mislead",
    name: "Mislead",
    level: 5,
    classes: ["Bard", "Wizard"],
    concentration: true,
    effects: [{ type: "disadvantage_attacks", description: "Invisible, illusory double" }],
  },
  "glibness": {
    id: "glibness",
    name: "Glibness",
    level: 8,
    classes: ["Bard", "Warlock"],
    concentration: false,
    effects: [{ type: "advantage_check", ability: "cha", description: "Charisma checks = 15, always truthful" }],
  },
  "dispel-evil-and-good": {
    id: "dispel-evil-and-good",
    name: "Dispel Evil and Good",
    level: 5,
    classes: ["Cleric", "Paladin"],
    concentration: true,
    effects: [{ type: "disadvantage_attacks", description: "Disadvantage on attacks from celestials, elementals, fey, fiends, undead" }],
  },
  "antilife-shell": {
    id: "antilife-shell",
    name: "Antilife Shell",
    level: 5,
    classes: ["Druid"],
    concentration: true,
    effects: [{ type: "resistance", description: "10ft barrier hedges out living creatures" }],
  },
  "globe-of-invulnerability": {
    id: "globe-of-invulnerability",
    name: "Globe of Invulnerability",
    level: 6,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Spells 5th or lower blocked" }],
  },
  "etherealness": {
    id: "etherealness",
    name: "Etherealness",
    level: 7,
    classes: ["Bard", "Cleric", "Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Ethereal Plane, move through objects" }],
  },
  "antimagic-field": {
    id: "antimagic-field",
    name: "Antimagic Field",
    level: 8,
    classes: ["Cleric", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "10ft sphere suppresses all magic" }],
  },
  "shapechange": {
    id: "shapechange",
    name: "Shapechange",
    level: 9,
    classes: ["Druid", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Assume form of another creature" }],
  },
  "time-stop": {
    id: "time-stop",
    name: "Time Stop",
    level: 9,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "speed_bonus", description: "Take 1d4+1 extra turns" }],
  },
  "contingency": {
    id: "contingency",
    name: "Contingency",
    level: 6,
    classes: ["Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Pre-cast spell triggers on condition" }],
  },
  "eyebite": {
    id: "eyebite",
    name: "Eyebite",
    level: 6,
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Asleep, panicked, or sickened on failed save" }],
  },
  "find-the-path": {
    id: "find-the-path",
    name: "Find the Path",
    level: 6,
    classes: ["Bard", "Cleric", "Druid"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Know shortest route to fixed location" }],
  },
  "control-weather": {
    id: "control-weather",
    name: "Control Weather",
    level: 8,
    classes: ["Cleric", "Druid", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Control weather within 5 miles" }],
  },
  "tree-stride": {
    id: "tree-stride",
    name: "Tree Stride",
    level: 5,
    classes: ["Druid", "Ranger"],
    concentration: true,
    effects: [{ type: "speed_bonus", description: "Teleport between trees within 500ft" }],
  },
  "scrying": {
    id: "scrying",
    name: "Scrying",
    level: 5,
    classes: ["Bard", "Cleric", "Druid", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "See and hear target creature" }],
  },
  "locate-creature": {
    id: "locate-creature",
    name: "Locate Creature",
    level: 4,
    classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Sense direction to familiar creature" }],
  },
  "locate-object": {
    id: "locate-object",
    name: "Locate Object",
    level: 2,
    classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Sense direction to familiar object" }],
  },
  "see-invisibility": {
    id: "see-invisibility",
    name: "See Invisibility",
    level: 2,
    classes: ["Bard", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "See invisible creatures and objects" }],
  },
  "detect-thoughts": {
    id: "detect-thoughts",
    name: "Detect Thoughts",
    level: 2,
    classes: ["Bard", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Read surface thoughts of creatures" }],
  },
  "detect-magic": {
    id: "detect-magic",
    name: "Detect Magic",
    level: 1,
    classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Sense magic within 30 feet" }],
  },
  "detect-evil-and-good": {
    id: "detect-evil-and-good",
    name: "Detect Evil and Good",
    level: 1,
    classes: ["Cleric", "Paladin"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Detect aberrations, celestials, elementals, fey, fiends, undead" }],
  },
  "detect-poison-and-disease": {
    id: "detect-poison-and-disease",
    name: "Detect Poison and Disease",
    level: 1,
    classes: ["Cleric", "Druid", "Paladin", "Ranger"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Detect poisons, poisonous creatures, diseases" }],
  },
  "comprehend-languages": {
    id: "comprehend-languages",
    name: "Comprehend Languages",
    level: 1,
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Understand spoken and written languages" }],
  },
  "speak-with-animals": {
    id: "speak-with-animals",
    name: "Speak with Animals",
    level: 1,
    classes: ["Bard", "Druid", "Ranger"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Communicate with beasts" }],
  },
  "speak-with-plants": {
    id: "speak-with-plants",
    name: "Speak with Plants",
    level: 3,
    classes: ["Bard", "Druid", "Ranger"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Communicate with plants" }],
  },
  "locate-animals-or-plants": {
    id: "locate-animals-or-plants",
    name: "Locate Animals or Plants",
    level: 2,
    classes: ["Bard", "Druid", "Ranger"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Find nearest beast or plant of a kind" }],
  },
  "augury": {
    id: "augury",
    name: "Augury",
    level: 2,
    classes: ["Cleric"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Receive omen about course of action" }],
  },
  "divination": {
    id: "divination",
    name: "Divination",
    level: 4,
    classes: ["Druid"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Receive answer from deity about future event" }],
  },
  "legend-lore": {
    id: "legend-lore",
    name: "Legend Lore",
    level: 5,
    classes: ["Bard", "Cleric", "Wizard"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Learn lore about person, place, or object" }],
  },
  "contact-other-plane": {
    id: "contact-other-plane",
    name: "Contact Other Plane",
    level: 5,
    classes: ["Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Ask questions to extraplanar entity" }],
  },
  "commune": {
    id: "commune",
    name: "Commune",
    level: 5,
    classes: ["Cleric"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Ask deity up to 3 yes/no questions" }],
  },
  "commune-with-nature": {
    id: "commune-with-nature",
    name: "Commune With Nature",
    level: 5,
    classes: ["Druid", "Ranger"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Learn about surrounding territory" }],
  },
  "disguise-self": {
    id: "disguise-self",
    name: "Disguise Self",
    level: 1,
    classes: ["Bard", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "advantage_check", description: "Change your appearance" }],
  },
  "produce-flame": {
    id: "produce-flame",
    name: "Produce Flame",
    level: 0,
    classes: ["Druid"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "Create flame for attacks, 1d8 fire damage" }],
  },
  "spirit-guardians": {
    id: "spirit-guardians",
    name: "Spirit Guardians",
    level: 3,
    classes: ["Cleric"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 3, description: "3d8 radiant/necrotic damage to nearby creatures" }],
  },
  "tiny-hut": {
    id: "tiny-hut",
    name: "Tiny Hut",
    level: 3,
    classes: ["Bard", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "10ft dome blocks spells and creatures" }],
  },
  "prismatic-spray": {
    id: "prismatic-spray",
    name: "Prismatic Spray",
    level: 7,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 10, description: "8 colored rays, 10d6 damage each" }],
  },
  "gravity-fissure": {
    id: "gravity-fissure",
    name: "Gravity Fissure",
    level: 6,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 8, description: "8d8 force damage in 100ft line" }],
  },
  "lightning-bolt": {
    id: "lightning-bolt",
    name: "Lightning Bolt",
    level: 3,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 8, description: "8d6 lightning damage in 100ft line" }],
  },
  "cone-of-cold": {
    id: "cone-of-cold",
    name: "Cone of Cold",
    level: 5,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 8, description: "8d8 cold damage in 60ft cone" }],
  },
  "burning-hands": {
    id: "burning-hands",
    name: "Burning Hands",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 3, description: "3d6 fire damage in 15ft cone" }],
  },
  "thunderwave": {
    id: "thunderwave",
    name: "Thunderwave",
    level: 1,
    classes: ["Bard", "Druid", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 2, description: "2d8 thunder damage in 15ft cube" }],
  },
  "frost-fingers": {
    id: "frost-fingers",
    name: "Frost Fingers",
    level: 1,
    classes: ["Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 2, description: "2d8 cold damage in 15ft cone" }],
  },
  "color-spray": {
    id: "color-spray",
    name: "Color Spray",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 6, description: "6d10 HP of creatures blinded" }],
  },
  "earth-tremor": {
    id: "earth-tremor",
    name: "Earth Tremor",
    level: 1,
    classes: ["Bard", "Druid", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d6 bludgeoning, knocked prone" }],
  },
  "arms-of-hadar": {
    id: "arms-of-hadar",
    name: "Arms of Hadar",
    level: 1,
    classes: ["Warlock"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 2, description: "2d6 necrotic damage in 10ft radius" }],
  },
  "hellish-rebuke": {
    id: "hellish-rebuke",
    name: "Hellish Rebuke",
    level: 1,
    classes: ["Warlock"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 2, description: "2d10 fire damage on reaction" }],
  },
  "ensnaring-strike": {
    id: "ensnaring-strike",
    name: "Ensnaring Strike",
    level: 1,
    classes: ["Ranger"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "1d6 piercing, restrained by vines" }],
  },
  "hail-of-thorns": {
    id: "hail-of-thorns",
    name: "Hail of Thorns",
    level: 1,
    classes: ["Ranger"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "1d10 piercing in 5ft radius" }],
  },
  "tashas-caustic-brew": {
    id: "tashas-caustic-brew",
    name: "Tasha's Caustic Brew",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 2, description: "2d4 acid damage in 30ft line" }],
  },
  "booming-blade": {
    id: "booming-blade",
    name: "Booming Blade",
    level: 0,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "+1d8 thunder if target moves" }],
  },
  "green-flame-blade": {
    id: "green-flame-blade",
    name: "Green-Flame Blade",
    level: 0,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "Fire damage to second creature" }],
  },
  "lightning-lure": {
    id: "lightning-lure",
    name: "Lightning Lure",
    level: 0,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d8 lightning, pull 10ft" }],
  },
  "sword-burst": {
    id: "sword-burst",
    name: "Sword Burst",
    level: 0,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d6 force in 5ft radius" }],
  },
  "thunderclap": {
    id: "thunderclap",
    name: "Thunderclap",
    level: 0,
    classes: ["Bard", "Druid", "Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d6 thunder in 5ft radius" }],
  },
  "create-bonfire": {
    id: "create-bonfire",
    name: "Create Bonfire",
    level: 0,
    classes: ["Druid", "Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 1, description: "1d8 fire damage in 5ft cube" }],
  },
  "primal-savagery": {
    id: "primal-savagery",
    name: "Primal Savagery",
    level: 0,
    classes: ["Druid"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d10 acid damage, melee spell" }],
  },
  "chill-touch": {
    id: "chill-touch",
    name: "Chill Touch",
    level: 0,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d8 necrotic, no healing" }],
  },
  "acid-splash": {
    id: "acid-splash",
    name: "Acid Splash",
    level: 0,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "damage_bonus", value: 1, description: "1d6 acid damage" }],
  },
  "melfs-minute-meteors": {
    id: "melfs-minute-meteors",
    name: "Melf's Minute Meteors",
    level: 3,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "damage_bonus", value: 2, description: "2d6 fire damage per meteor" }],
  },
  "gust-of-wind": {
    id: "gust-of-wind",
    name: "Gust of Wind",
    level: 2,
    classes: ["Druid", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "speed_bonus", description: "Push creatures 15ft, difficult terrain" }],
  },
  "fear": {
    id: "fear",
    name: "Fear",
    level: 3,
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Creatures frightened, must flee" }],
  },
  "magic-jar": {
    id: "magic-jar",
    name: "Magic Jar",
    level: 6,
    classes: ["Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Possess another creature's body" }],
  },
};

export interface ActiveBuff {
  spellId: string;
  name: string;
  concentration: boolean;
  turnsRemaining: number | null;
}

export interface BuffModifiers {
  acBonus: number;
  tempHpBonus: number;
  speedBonus: number;
  flySpeed: number | null;
  swimSpeed: number | null;
  burrowSpeed: number | null;
  darkvisionRange: number | null;
  resistances: string[];
  advantageSaves: string[];
  advantageChecks: string[];
  damageBonus: number;
  attackBonus: number;
  disadvantageAttacks: boolean;
}

export function computeBuffModifiers(activeBuffs: ActiveBuff[]): BuffModifiers {
  const mods: BuffModifiers = {
    acBonus: 0,
    tempHpBonus: 0,
    speedBonus: 0,
    flySpeed: null,
    swimSpeed: null,
    burrowSpeed: null,
    darkvisionRange: null,
    resistances: [],
    advantageSaves: [],
    advantageChecks: [],
    damageBonus: 0,
    attackBonus: 0,
    disadvantageAttacks: false,
  };

  for (const buff of activeBuffs) {
    const def = BUFF_DEFINITIONS[buff.spellId];
    if (!def) continue;
    for (const effect of def.effects) {
      switch (effect.type) {
        case "ac_bonus":
          mods.acBonus += effect.value || 0;
          break;
        case "temp_hp":
          mods.tempHpBonus += effect.value || 0;
          break;
        case "speed_bonus":
          if (effect.value) {
            mods.speedBonus += effect.value;
          } else {
            mods.speedBonus = -1;
          }
          break;
        case "fly_speed":
          mods.flySpeed = effect.value || 0;
          break;
        case "swim_speed":
          mods.swimSpeed = -1;
          break;
        case "burrow_speed":
          mods.burrowSpeed = effect.value || 0;
          break;
        case "darkvision":
          mods.darkvisionRange = effect.value || 0;
          break;
        case "resistance":
          if (effect.damageType) {
            mods.resistances.push(effect.damageType);
          } else {
            mods.resistances.push("chosen");
          }
          break;
        case "advantage_save":
          if (effect.ability) {
            mods.advantageSaves.push(effect.ability);
          } else {
            mods.advantageSaves.push("all");
          }
          break;
        case "advantage_check":
          if (effect.ability) {
            mods.advantageChecks.push(effect.ability);
          } else {
            mods.advantageChecks.push("all");
          }
          break;
        case "damage_bonus":
          mods.damageBonus += effect.value || 0;
          break;
        case "attack_bonus":
          mods.attackBonus += effect.value || 0;
          break;
        case "disadvantage_attacks":
          mods.disadvantageAttacks = true;
          break;
      }
    }
  }

  return mods;
}

export function getAvailableBuffs(className: string, level: number): BuffDefinition[] {
  return Object.values(BUFF_DEFINITIONS).filter(
    (buff) => buff.classes.includes(className) && buff.level <= Math.ceil(level / 2)
  );
}

export function getBuffsByClass(className: string): BuffDefinition[] {
  return Object.values(BUFF_DEFINITIONS).filter(
    (buff) => buff.classes.includes(className)
  );
}

export function getAllBuffs(): BuffDefinition[] {
  return Object.values(BUFF_DEFINITIONS);
}

export function parseDurationToTurns(duration: string): number | null {
  if (!duration) return null;
  const d = duration.toLowerCase().trim();
  if (d === "instantaneous") return null;
  if (d === "until dispelled" || d === "special") return null;
  const roundMatch = d.match(/^(\d+)\s*round/);
  if (roundMatch) return parseInt(roundMatch[1], 10);
  if (d === "1 round") return 1;
  const minuteMatch = d.match(/^(\d+)\s*minute/);
  if (minuteMatch) return parseInt(minuteMatch[1], 10) * 10;
  if (d.includes("1 minute")) return 10;
  if (d.includes("10 minutes")) return 100;
  const hourMatch = d.match(/^(\d+)\s*hour/);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 600;
  if (d.includes("1 hour")) return 600;
  if (d.includes("8 hours")) return 4800;
  if (d.includes("24 hours")) return 14400;
  const dayMatch = d.match(/^(\d+)\s*day/);
  if (dayMatch) return parseInt(dayMatch[1], 10) * 14400;
  const upToRoundMatch = d.match(/up to\s*(\d+)\s*round/);
  if (upToRoundMatch) return parseInt(upToRoundMatch[1], 10);
  const upToMinMatch = d.match(/up to\s*(\d+)\s*minute/);
  if (upToMinMatch) return parseInt(upToMinMatch[1], 10) * 10;
  const upToHourMatch = d.match(/up to\s*(\d+)\s*hour/);
  if (upToHourMatch) return parseInt(upToHourMatch[1], 10) * 600;
  if (d.includes("concentration")) {
    const concMinMatch = d.match(/up to\s*(\d+)\s*minute/);
    if (concMinMatch) return parseInt(concMinMatch[1], 10) * 10;
    const concHourMatch = d.match(/up to\s*(\d+)\s*hour/);
    if (concHourMatch) return parseInt(concHourMatch[1], 10) * 600;
    const concRoundMatch = d.match(/up to\s*(\d+)\s*round/);
    if (concRoundMatch) return parseInt(concRoundMatch[1], 10);
    return 10;
  }
  return null;
}

export function advanceTurn(activeBuffs: ActiveBuff[]): ActiveBuff[] {
  return activeBuffs
    .map(buff => {
      if (buff.turnsRemaining === null) return buff;
      return { ...buff, turnsRemaining: buff.turnsRemaining - 1 };
    })
    .filter(buff => buff.turnsRemaining === null || buff.turnsRemaining > 0);
}
