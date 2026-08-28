export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
}

export interface SRDSkillChoice {
  count: number;
  options: string[];
}

export interface SRDEquipmentItemRef {
  name: string;
  quantity?: number;
  description?: string;
}

export interface SRDEquipmentChoice {
  description: string;
  items: SRDEquipmentItemRef[];
}

export interface SRDClassLevel {
  features: { name: string; description: string; type?: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
}

export interface SRDScalingFeature {
  name: string;
  description: string;
  type: "feature" | "attack";
  values: Record<number, number>;
}

export interface SRDClass {
  name: string;
  hitDie: number;
  hpPerLevel: number;
  primaryAbility: string;
  savingThrows: string[];
  flavorText: string;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
  };
  skillChoices: SRDSkillChoice;
  startingEquipment: (SRDEquipmentChoice | { granted: true; description: string; items: SRDEquipmentItemRef[] })[];
  features: { name: string; description: string; type?: string }[];
  levels: SRDClassLevel[];
  spellcastingAbility?: string;
  cantripsKnown?: Record<number, number> | number[];
  spellsKnown?: Record<number, number>;
  invocationsKnown?: Record<number, number>;
  scalingFeatures?: SRDScalingFeature[];
  subclassLevel?: number;
  subclasses?: {
    name: string;
    description: string;
    features: { level?: number; name: string; description: string }[];
  }[];
}

export interface SRDSkill {
  name: string;
  ability: string;
  description: string;
}

export interface SRDSpell {
  name: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  effect: string;
}

export interface SRDEquipment {
  name: string;
  description: string;
  type: "weapon" | "armor" | "item";
  category?: "melee" | "ranged";
  damageDice?: string;
  damageType?: string;
  baseAC?: number;
  armorType?: "light" | "medium" | "heavy" | "shield";
  maxDexBonus?: number | null;
}

export interface SRDLanguage {
  name: string;
  description?: string;
}

export const races: SRDRace[] = [
  {
    name: "Human",
    abilityScoreIncreases: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    size: "Medium",
    darkvision: false,
    traits: [
      { name: "Extra Language", description: "You know one extra language of your choice." },
    ],
  },
  {
    name: "Elf",
    abilityScoreIncreases: { dex: 2 },
    speed: 30,
    size: "Medium",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Accustomed to the dim light of the twilight wilds, you can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name: "Keen Senses", description: "You have proficiency in the Perception skill." },
      { name: "Fey Ancestry", description: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
    ],
  },
  {
    name: "Dwarf",
    abilityScoreIncreases: { con: 2 },
    speed: 25,
    size: "Medium",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Accustomed to life underground, you have superior vision in dim and dark conditions within 60 feet." },
      { name: "Dwarven Resilience", description: "You have advantage on saving throws against poison, and you have resistance against poison damage." },
      { name: "Dwarven Combat Training", description: "You have proficiency with battleaxes, handaxes, light hammers, and warhammers." },
      { name: "Tool Proficiency", description: "You gain proficiency with one type of artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools." },
    ],
  },
  {
    name: "Halfling",
    abilityScoreIncreases: { dex: 2 },
    speed: 25,
    size: "Small",
    darkvision: false,
    traits: [
      { name: "Lucky", description: "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll." },
      { name: "Brave", description: "You have advantage on saving throws against being frightened." },
      { name: "Halfling Nimbleness", description: "You can move through the space of any creature that is of a size larger than yours." },
    ],
  },
  {
    name: "Dragonborn",
    abilityScoreIncreases: { str: 2, cha: 1 },
    speed: 30,
    size: "Medium",
    darkvision: false,
    traits: [
      { name: "Dragon Ancestry", description: "You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type." },
      { name: "Breath Weapon", description: "You can use your action to exhale destructive energy. The damage type and area are determined by your draconic ancestry." },
      { name: "Damage Resistance", description: "You have resistance to the damage type associated with your draconic ancestry." },
    ],
  },
  {
    name: "Gnome",
    abilityScoreIncreases: { int: 2 },
    speed: 25,
    size: "Small",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Accustomed to life underground, you have superior vision in dim and dark conditions within 60 feet." },
      { name: "Gnome Cunning", description: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." },
    ],
  },
  {
    name: "Half-Elf",
    abilityScoreIncreases: { cha: 2 },
    speed: 30,
    size: "Medium",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Thanks to your elf blood, you have superior vision in dim and dark conditions within 60 feet." },
      { name: "Fey Ancestry", description: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
      { name: "Skill Versatility", description: "You gain proficiency in two skills of your choice." },
      { name: "Ability Score Increase", description: "Increase two other ability scores of your choice by 1 each." },
    ],
  },
  {
    name: "Half-Orc",
    abilityScoreIncreases: { str: 2, con: 1 },
    speed: 30,
    size: "Medium",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Thanks to your orc blood, you have superior vision in dim and dark conditions within 60 feet." },
      { name: "Menacing", description: "You gain proficiency in the Intimidation skill." },
      { name: "Relentless Endurance", description: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead." },
      { name: "Savage Attacks", description: "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit." },
    ],
  },
  {
    name: "Tiefling",
    abilityScoreIncreases: { cha: 2, int: 1 },
    speed: 30,
    size: "Medium",
    darkvision: { range: 60 },
    traits: [
      { name: "Darkvision", description: "Thanks to your infernal heritage, you have superior vision in dim and dark conditions within 60 feet." },
      { name: "Hellish Resistance", description: "You have resistance to fire damage." },
      { name: "Infernal Legacy", description: "You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once per long rest. When you reach 5th level, you can also cast the darkness spell once per long rest." },
    ],
  },
];

export const classes: SRDClass[] = [
  {
    name: "Fighter",
    hitDie: 10,
    hpPerLevel: 6,
    primaryAbility: "str",
    savingThrows: ["str", "con"],
    flavorText: "A master of martial combat, skilled with weapons and armor.",
    proficiencies: {
      armor: ["all armor", "shields"],
      weapons: ["simple weapons", "martial weapons"],
      tools: [],
    },
    skillChoices: {
      count: 2,
      options: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    },
    startingEquipment: [
      {
        description: "Choose one:",
        items: [
          { name: "Chain Mail", description: "Medium armor. AC 16." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Leather Armor", description: "Light armor. AC 11 + Dex modifier." },
          { name: "Longbow", description: "A ranged weapon (1d8 piercing)." },
          { name: "Quiver", description: "Contains 20 arrows.", quantity: 20 },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Martial Weapon", description: "A martial weapon of your choice." },
          { name: "Shield", description: "Increases AC by +2 while equipped.", quantity: 1 },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Martial Weapon", description: "A martial weapon of your choice.", quantity: 2 },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Light Crossbow", description: "A ranged weapon (1d8 piercing)." },
          { name: "Quiver", description: "Contains 20 bolts.", quantity: 20 },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Handaxe", description: "A simple melee weapon (1d6 slashing).", quantity: 2 },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Dungeoneer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Explorer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
    ],
     features: [
       { name: "Fighting Style", description: "You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting.", type: "feature" },
       { name: "Second Wind", description: "You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.", type: "feature" },
     ],
     levels: [
       { features: [{ name: "Fighting Style", description: "You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting." }, { name: "Second Wind", description: "You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again." }], asi: false },
       { features: [{ name: "Action Surge", description: "Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn." }], asi: false },
       { features: [{ name: "Martial Archetype", description: "Choose a martial archetype: Champion, Battle Master, or Eldritch Knight." }], asi: false },
       { features: [], asi: true },
       { features: [{ name: "Extra Attack", description: "Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn." }], asi: false },
       { features: [], asi: false },
       { features: [{ name: "Martial Archetype feature", description: "You gain a feature from your chosen Martial Archetype." }], asi: false },
       { features: [], asi: true },
       { features: [{ name: "Indomitable", description: "Beginning at 9th level, you can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can't use this feature again until you finish a long rest." }], asi: false },
       { features: [{ name: "Extra Indomitable use", description: "You can now use Indomitable twice between long rests." }], asi: false },
     ],
    subclassLevel: 3,
    subclasses: [
      {
        name: "Champion",
        description: "A paragon of martial prowess, focusing on the raw power of physical combat.",
        features: [
          { name: "Improved Critical", description: "Your weapon attacks score a critical hit on a roll of 19 or 20." },
          { name: "Remarkable Athlete", description: "You can add half your proficiency bonus to any Strength, Dexterity, or Constitution check you make that doesn't already use your proficiency bonus." },
        ],
      },
      {
        name: "Battle Master",
        description: "A master of combat tactics, using maneuvers to control the battlefield.",
        features: [
          { name: "Combat Superiority", description: "You learn maneuvers that fuel your fighting style." },
          { name: "Student of War", description: "You gain proficiency with one type of artisan's tools." },
        ],
      },
      {
        name: "Eldritch Knight",
        description: "A fighter who blends martial skill with arcane magic.",
        features: [
          { name: "Weapon Bond", description: "You can bond with a weapon, allowing you to summon it to your hand." },
          { name: "Spellcasting", description: "You can cast spells using your arcane knowledge." },
        ],
      },
    ],
  },
  {
    name: "Wizard",
    hitDie: 6,
    hpPerLevel: 4,
    primaryAbility: "int",
    savingThrows: ["int", "wis"],
    flavorText: "A scholarly spellcaster who wields magic through study and arcane knowledge.",
    proficiencies: {
      armor: [],
      weapons: ["daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
      tools: [],
    },
    skillChoices: {
      count: 2,
      options: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    },
    startingEquipment: [
      {
        description: "Choose one:",
        items: [
          { name: "Quarterstaff", description: "A simple melee weapon (1d6 bludgeoning)." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Dagger", description: "A simple melee weapon (1d4 piercing)." },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Component Pouch", description: "A small pouch containing arcane components." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Arcane Focus", description: "A focus for casting spells, such as a wand or orb." },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Scholar's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Explorer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
      {
        granted: true,
        description: "Always granted:",
        items: [
          { name: "Spellbook", description: "A book containing your starting spells and formulas for casting them.", quantity: 1 },
        ],
      },
    ],
     features: [
       { name: "Spellcasting", description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. At 1st level, you know three cantrips of your choice from the wizard spell list. You also have a spellbook containing six 1st-level wizard spells of your choice.", type: "feature" },
       { name: "Arcane Recovery", description: "You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.", type: "feature" },
     ],
     levels: [
       { features: [{ name: "Spellcasting", description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. At 1st level, you know three cantrips of your choice from the wizard spell list. You also have a spellbook containing six 1st-level wizard spells of your choice." }, { name: "Arcane Recovery", description: "You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher." }], asi: false, spellSlots: { 1: 2 } },
       { features: [{ name: "Arcane Tradition", description: "Choose an arcane tradition: School of Evocation, School of Abjuration, or School of Illusion." }], asi: false, spellSlots: { 1: 3 } },
       { features: [], asi: false, spellSlots: { 1: 4, 2: 2 } },
       { features: [], asi: true, spellSlots: { 1: 4, 2: 3 } },
       { features: [], asi: false, spellSlots: { 1: 4, 2: 3, 3: 2 } },
       { features: [{ name: "Arcane Tradition feature", description: "You gain a feature from your chosen Arcane Tradition." }], asi: false, spellSlots: { 1: 4, 2: 3, 3: 3 } },
       { features: [], asi: false, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
       { features: [], asi: true, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
       { features: [], asi: false, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } },
       { features: [{ name: "Arcane Tradition feature", description: "You gain a feature from your chosen Arcane Tradition." }], asi: false, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
     ],
    spellcastingAbility: "int",
    cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5],
    subclassLevel: 2,
    subclasses: [
      {
        name: "School of Abjuration",
        description: "Abjurers specialize in protective magic, creating wards and barriers to shield themselves and their allies. They are the ultimate defenders among wizards, capable of turning enemy magic against them and creating nearly impenetrable defenses.",
        features: [
          { level: 2, name: "Abjuration Savant", description: "The gold and time you must spend to copy an abjuration spell into your spellbook is halved." },
          { level: 2, name: "Arcane Ward", description: "When you cast an abjuration spell of 1st level or higher, you can use a strand of the spell's magic to create a magical ward around yourself. The ward has a maximum hit point total equal to twice your wizard level + your Intelligence modifier, and it starts with hit points equal to that maximum. Whenever you take damage, the ward takes the damage instead. If this damage reduces the ward to 0 hit points, you take any remaining damage. When you cast an abjuration spell of 1st level or higher, the ward regains a number of hit points equal to twice the level of the spell. Once you create the ward, you can't do so again until you finish a long rest." },
          { level: 6, name: "Projected Ward", description: "When a creature that you can see within 30 feet of you takes damage, you can use your reaction to cause your Arcane Ward to absorb that damage. If this damage reduces the ward to 0 hit points, the warded creature takes any remaining damage." },
          { level: 10, name: "Improved Abjuration", description: "When you cast an abjuration spell of 1st level or higher that requires you to make an ability check as a part of casting the spell (as in Counterspell and Dispel Magic), you can add your proficiency bonus to that ability check." },
        ],
      },
      {
        name: "School of Evocation",
        description: "Evokers specialize in raw destructive magic, hurling fireballs, lightning bolts, and other devastating spells. They are masters of offensive magic who can sculpt their spells to avoid harming allies caught in the blast.",
        features: [
          { level: 2, name: "Evocation Savant", description: "The gold and time you must spend to copy an evocation spell into your spellbook is halved." },
          { level: 2, name: "Sculpt Spells", description: "When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save." },
          { level: 6, name: "Potent Cantrip", description: "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on its saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no other effect from the cantrip." },
          { level: 10, name: "Empowered Evocation", description: "You can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast." },
        ],
      },
      {
        name: "School of Illusion",
        description: "Illusionists specialize in creating deceptive images, phantasms, and mind-bending magic. They are masters of misdirection who can make the impossible seem real and alter their illusions on the fly.",
        features: [
          { level: 2, name: "Illusion Savant", description: "The gold and time you must spend to copy an illusion spell into your spellbook is halved." },
          { level: 2, name: "Improved Minor Illusion", description: "You learn the Minor Illusion cantrip. If you already know it, you learn a different wizard cantrip of your choice. The cantrip doesn't count against your cantrips known. When you cast Minor Illusion, you can create both sound and image with a single casting of the spell." },
          { level: 6, name: "Malleable Illusions", description: "While a creature is concentrating on an illusion spell you cast, you can use your action to change the nature of that illusion provided that its duration is not instantaneous." },
          { level: 10, name: "Illusory Self", description: "When a creature makes an attack roll against you, you can use your reaction to interpose an illusory duplicate of yourself between the attacker and yourself. The attack automatically misses you, and then the illusion dissipates. Once you use this feature, you can't use it again until you finish a short or long rest." },
        ],
      },
    ],
  },
  {
    name: "Rogue",
    hitDie: 8,
    hpPerLevel: 5,
    primaryAbility: "dex",
    savingThrows: ["dex", "int"],
    flavorText: "A stealthy trickster who excels at skills, stealth, and striking from the shadows.",
    proficiencies: {
      armor: ["light armor"],
      weapons: ["simple weapons", "hand crossbows", "longswords", "rapiers", "shortswords"],
      tools: ["thieves' tools"],
    },
    skillChoices: {
      count: 4,
      options: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    },
    startingEquipment: [
      {
        description: "Choose one:",
        items: [
          { name: "Rapier", description: "A martial melee weapon (1d8 piercing)." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Shortsword", description: "A martial melee weapon (1d6 piercing)." },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Shortbow", description: "A ranged weapon (1d6 piercing)." },
          { name: "Quiver", description: "Contains 20 arrows.", quantity: 20 },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Shortsword", description: "A martial melee weapon (1d6 piercing)." },
        ],
      },
      {
        description: "Choose one:",
        items: [
          { name: "Burglar's Pack", description: "Includes a backpack, 10 feet of string, a bell, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, a waterskin, and 50 feet of rope." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Dungeoneer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
      {
        description: "Or:",
        items: [
          { name: "Explorer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." },
        ],
      },
      {
        granted: true,
        description: "Always granted:",
        items: [
          { name: "Leather Armor", description: "Light armor. AC 11 + Dex modifier.", quantity: 1 },
          { name: "Dagger", description: "A simple melee weapon (1d4 piercing).", quantity: 2 },
          { name: "Thieves' Tools", description: "A set of tools for picking locks and disarming traps.", quantity: 1 },
        ],
      },
    ],
     features: [
       { name: "Expertise", description: "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies (in skills or with thieves' tools) to gain this benefit.", type: "feature" },
       { name: "Sneak Attack", description: "Beginning at 1st level, you know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon. The amount of extra damage increases as you gain levels.", type: "attack" },
       { name: "Thieves' Cant", description: "During your rogue training you learned thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation. Only another creature that knows thieves' cant understands such messages.", type: "feature" },
     ],
     levels: [
       { features: [{ name: "Expertise", description: "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies (in skills or with thieves' tools) to gain this benefit." }, { name: "Sneak Attack", description: "Beginning at 1st level, you know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon." }, { name: "Thieves' Cant", description: "During your rogue training you learned thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation." }], asi: false },
       { features: [{ name: "Cunning Action", description: "Starting at 2nd level, your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action." }], asi: false },
       { features: [{ name: "Rogue Archetype", description: "Choose a rogue archetype: Thief, Assassin, or Arcane Trickster." }], asi: false },
       { features: [], asi: true },
       { features: [{ name: "Uncanny Dodge", description: "Starting at 5th level, when an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you." }], asi: false },
       { features: [], asi: false },
       { features: [{ name: "Evasion", description: "Beginning at 7th level, when you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail." }], asi: false },
       { features: [], asi: true },
       { features: [{ name: "Rogue Archetype feature", description: "You gain a feature from your chosen Rogue Archetype." }], asi: false },
       { features: [{ name: "Stroke of Luck", description: "At 11th level, if you miss an attack roll, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can't use it again until you finish a short or long rest." }], asi: false },
     ],
    scalingFeatures: [
      {
        name: "Sneak Attack",
        description: "Deal extra damage to a creature you hit with advantage on the attack roll.",
        type: "attack",
        values: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5 },
      },
      {
        name: "Expertise",
        description: "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies (in skills or with thieves' tools) to gain this benefit.",
        type: "feature",
        values: { 1: 2, 3: 2, 6: 4 },
      },
    ],
    subclassLevel: 3,
    subclasses: [
      {
        name: "Thief",
        description: "A rogue who specializes in stealth and speed, mastering the art of moving unseen and striking from the shadows.",
        features: [
          { name: "Fast Hands", description: "You can use your bonus action to Dash, Disengage, or Hide, or to use an object." },
          { name: "Second-Story Work", description: "You gain the ability to climb difficult surfaces and jump farther than normal." },
          { name: "Sneak in the Dark", description: "You gain darkvision out to 60 feet. If you already have darkvision, its range increases by 30 feet. You also have advantage on Dexterity (Stealth) checks made in dim light or darkness." },
        ],
      },
      {
        name: "Assassin",
        description: "A rogue who specializes in swift, deadly strikes from the shadows, using subterfuge and misdirection.",
        features: [
          { name: "Assassinate", description: "You have advantage on attack rolls against any creature that hasn't taken a turn yet. In addition, any hit you score against a surprised creature is a critical hit." },
          { name: "Infiltration Expertise", description: "You can create a disguise to infiltrate a location. You can also forge documents with advantage." },
          { name: "Imposter", description: "You can mimic speech, writing, and mannerisms of another person. You have advantage on Deception checks to pass yourself off as someone else." },
        ],
      },
      {
        name: "Arcane Trickster",
        description: "A rogue who weaves magic into their stealth and trickery, learning spells from the wizard spell list.",
        features: [
          { name: "Spellcasting", description: "You can cast spells using your arcane trickster features. You know two cantrips and three 1st-level spells from the wizard spell list." },
          { name: "Mage Hand Legerdemain", description: "Your mage hand becomes invisible and can manipulate objects more effectively, including picking locks and disarming traps." },
          { name: "Magical Ambush", description: "You have advantage on saving throws against spells and other magical effects when you are hidden from the spellcaster." },
        ],
      },
    ],
  },
  {
    name: "Warlock",
    hitDie: 8,
    hpPerLevel: 5,
    primaryAbility: "cha",
    savingThrows: ["wis", "cha"],
    flavorText: "Warlocks are seekers of the knowledge that lies hidden in the fabric of the multiverse. Through pacts made with mysterious beings of supernatural power, warlocks unlock magical effects both subtle and spectacular.",
    proficiencies: {
      armor: ["light armor"],
      weapons: ["simple weapons"],
      tools: [],
    },
    skillChoices: {
      count: 2,
      options: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    },
    startingEquipment: [
      { description: "(a) a light crossbow and 20 bolts or (b) any simple weapon", items: [{ name: "Light Crossbow", description: "A ranged weapon that fires bolts." }, { name: "Crossbow bolt", description: "Ammunition for crossbows.", quantity: 20 }] },
      { description: "(a) a component pouch or (b) an arcane focus", items: [{ name: "Component Pouch", description: "A small pouch containing arcane components." }] },
      { description: "Or:", items: [{ name: "Arcane Focus", description: "A focus for casting spells, such as a wand or orb." }] },
      { description: "(a) a scholar's pack or (b) a dungeoneer's pack", items: [{ name: "Scholar's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." }] },
      { description: "Or:", items: [{ name: "Dungeoneer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." }] },
      { granted: true, description: "Always granted:", items: [{ name: "Leather Armor", description: "Light armor. AC 11 + Dex modifier.", quantity: 1 }, { name: "Dagger", description: "A simple melee weapon (1d4 piercing).", quantity: 2 }] },
    ],
    features: [
      { name: "Otherworldly Patron", description: "At 1st level, you have struck a bargain with an otherworldly being of your choice. Your choice grants you features at 1st level and again at 6th, 10th, and 14th level.", type: "feature" },
      { name: "Pact Magic", description: "Your arcane research and the magic bestowed on you by your patron have given you facility with spells. You regain all expended spell slots when you finish a short or long rest.", type: "feature" },
    ],
    levels: [
      { features: [{ name: "Otherworldly Patron", description: "At 1st level, you have struck a bargain with an otherworldly being of your choice." }, { name: "Pact Magic", description: "You know two cantrips and two 1st-level spells from the warlock spell list. Spell slots recover on short or long rest." }], asi: false, spellSlots: { 1: 1 } },
      { features: [{ name: "Eldritch Invocations", description: "At 2nd level, you gain two eldritch invocations of your choice." }], asi: false, spellSlots: { 1: 2 } },
      { features: [{ name: "Pact Boon", description: "At 3rd level, your otherworldly patron bestows a gift upon you for your loyal service." }], asi: false, spellSlots: { 2: 2 } },
      { features: [{ name: "Ability Score Improvement", description: "You can increase one ability score by 2, or two ability scores by 1." }], asi: true, spellSlots: { 2: 2 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: false, spellSlots: { 3: 2 } },
      { features: [{ name: "Otherworldly Patron feature", description: "You gain a feature from your chosen Otherworldly Patron." }], asi: false, spellSlots: { 3: 2 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: false, spellSlots: { 4: 2 } },
      { features: [{ name: "Ability Score Improvement", description: "You can increase one ability score by 2, or two ability scores by 1." }], asi: true, spellSlots: { 4: 2 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: false, spellSlots: { 5: 2 } },
      { features: [{ name: "Otherworldly Patron feature", description: "You gain a feature from your chosen Otherworldly Patron." }], asi: false, spellSlots: { 5: 2 } },
      { features: [{ name: "Ability Score Improvement", description: "You can increase one ability score by 2, or two ability scores by 1." }], asi: true, spellSlots: { 5: 3 } },
      { features: [{ name: "Mystic Arcanum (6th level)", description: "Choose one 6th-level spell from the warlock spell list. You can cast it once without expending a spell slot." }], asi: false, spellSlots: { 5: 3 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: true, spellSlots: { 5: 3 } },
      { features: [{ name: "Mystic Arcanum (7th level)", description: "Choose one 7th-level spell from the warlock spell list." }], asi: false, spellSlots: { 5: 3 } },
      { features: [{ name: "Otherworldly Patron feature", description: "You gain a feature from your chosen Otherworldly Patron." }], asi: false, spellSlots: { 5: 3 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: false, spellSlots: { 5: 3 } },
      { features: [{ name: "Ability Score Improvement", description: "You can increase one ability score by 2, or two ability scores by 1." }], asi: true, spellSlots: { 5: 3 } },
      { features: [{ name: "Mystic Arcanum (8th level)", description: "Choose one 8th-level spell from the warlock spell list." }], asi: false, spellSlots: { 5: 3 } },
      { features: [{ name: "Eldritch Invocations", description: "You gain an additional eldritch invocation of your choice." }], asi: true, spellSlots: { 5: 4 } },
      { features: [{ name: "Mystic Arcanum (9th level)", description: "Choose one 9th-level spell from the warlock spell list." }], asi: false, spellSlots: { 5: 4 } },
      { features: [{ name: "Eldritch Master", description: "At 20th level, you can spend 1 minute entreating your patron to regain all expended spell slots from your Pact Magic feature." }], asi: false, spellSlots: { 5: 4 } },
    ],
    spellcastingAbility: "cha",
    cantripsKnown: { "1": 2, "4": 3, "10": 4 },
    spellsKnown: { "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10, "10": 11, "11": 12, "12": 12, "13": 13, "14": 13, "15": 14, "16": 14, "17": 15, "18": 15, "19": 15, "20": 15 },
    invocationsKnown: { "2": 2, "5": 3, "7": 4, "9": 5, "12": 6, "15": 7, "18": 8 },
    subclassLevel: 1,
    subclasses: [
      { name: "Fiend", description: "You have made a pact with a fiend from the lower planes of existence.", features: [
        { level: 1, name: "Dark One's Blessing", description: "When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level." },
        { level: 6, name: "Dark One's Own Luck", description: "When you make an ability check or a saving throw, you can add a d10 to your roll." },
        { level: 10, name: "Fiendish Resilience", description: "Choose one damage type when you finish a short or long rest. You gain resistance to that damage type." },
        { level: 14, name: "Hurl Through Hell", description: "When you hit a creature with an attack, you can instantly transport the target through the lower planes." },
      ]},
      { name: "Great Old One", description: "Your patron is a mysterious entity whose nature is utterly foreign to the fabric of reality.", features: [
        { level: 1, name: "Awakened Mind", description: "You can telepathically speak to any creature you can see within 30 feet of you." },
        { level: 6, name: "Entropic Ward", description: "When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll." },
        { level: 10, name: "Thought Shield", description: "Your thoughts can't be read by telepathy or other means unless you allow it. You have resistance to psychic damage." },
        { level: 14, name: "Create Thrall", description: "You can touch an incapacitated humanoid. That creature is then charmed by you." },
      ]},
      { name: "Archfey", description: "Your patron is a lord or lady of the fey, a creature of legend.", features: [
        { level: 1, name: "Fey Presence", description: "As an action, you can cause each creature in a 10-foot cube to make a Wisdom saving throw." },
        { level: 6, name: "Misty Escape", description: "When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet." },
        { level: 10, name: "Beguiling Defenses", description: "You are immune to being charmed." },
        { level: 14, name: "Dark Delirium", description: "You can plunge a creature into an illusory realm." },
      ]},
    ],
  },
];

export const skills: SRDSkill[] = [
  { name: "Acrobatics", ability: "dex", description: "Used for keeping your balance in difficult situations, performing aerial stunts, or avoiding falling damage." },
  { name: "Animal Handling", ability: "wis", description: "Used for calming animals, riding mounts, or reading animal behavior." },
  { name: "Arcana", ability: "int", description: "Used for recalling lore about spells, magic items, and the planes of existence." },
  { name: "Athletics", ability: "str", description: "Used for climbing, jumping, swimming, and physical feats of strength." },
  { name: "Deception", ability: "cha", description: "Used for lying, misleading, or disguising your true intentions." },
  { name: "History", ability: "int", description: "Used for recalling lore about historical events, people, and places." },
  { name: "Insight", ability: "wis", description: "Used for reading body language, detecting lies, and understanding emotions." },
  { name: "Intimidation", ability: "cha", description: "Used for threatening others, hostage situations, or bullying." },
  { name: "Investigation", ability: "int", description: "Used for searching for clues, examining objects, or finding hidden things." },
  { name: "Medicine", ability: "wis", description: "Used for stabilizing dying creatures, diagnosing illnesses, or treating wounds." },
  { name: "Nature", ability: "int", description: "Used for recalling lore about terrain, plants, animals, and weather." },
  { name: "Perception", ability: "wis", description: "Used for spotting hidden creatures, noticing details, or detecting ambushes." },
  { name: "Performance", ability: "cha", description: "Used for entertaining crowds, acting, music, dance, or storytelling." },
  { name: "Persuasion", ability: "cha", description: "Used for negotiating, convincing others, or altering attitudes." },
  { name: "Religion", ability: "int", description: "Used for recalling lore about deities, holy symbols, and religious traditions." },
  { name: "Sleight of Hand", ability: "dex", description: "Used for picking pockets, performing magic tricks, or planting items." },
  { name: "Stealth", ability: "dex", description: "Used for hiding, moving silently, or avoiding detection." },
  { name: "Survival", ability: "wis", description: "Used for tracking creatures, navigating wilderness, or foraging for food." },
];

export const spells: SRDSpell[] = [
  { name: "Fire Bolt", level: 0, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You hurl a mote of fire at a creature or object within range.", effect: "Make a ranged spell attack. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried." },
  { name: "Ray of Frost", level: 0, castingTime: "1 action", range: "60 feet", duration: "Instantaneous", description: "A beam of blue-white light streaks toward a creature within range.", effect: "Make a ranged spell attack. On a hit, the target takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn." },
  { name: "Light", level: 0, castingTime: "1 action", range: "Touch", duration: "1 hour", description: "You touch one object that is no larger than 10 feet in any dimension.", effect: "Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like." },
  { name: "Mage Hand", level: 0, castingTime: "1 action", range: "30 feet", duration: "1 minute", description: "A spectral, floating hand appears at a point you choose within range.", effect: "The hand lasts for the duration or until you dismiss it. You can use it to manipulate an object, open an unlocked door or container, or stow or retrieve an item from an open container." },
  { name: "Prestidigitation", level: 0, castingTime: "1 action", range: "10 feet", duration: "Up to 1 hour", description: "You create a minor magical effect within range.", effect: "You can create a harmless sensory effect, light or snuff a small flame, clean or soil an object no larger than 1 cubic foot, chill or warm up to 1 cubic foot of nonliving material, or make a small mark or color appear on an object." },
  { name: "Magic Missile", level: 1, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You create three glowing darts of magical force.", effect: "Each dart hits a creature of your choice that you can see within range. A dart deals 1d4+1 force damage to its target. The darts all strike simultaneously, and you can direct them at one creature or several." },
  { name: "Shield", level: 1, castingTime: "1 reaction, taken when you are hit by an attack or targeted by the magic missile spell", range: "Self", duration: "1 round", description: "An invisible barrier of magical force appears to protect you.", effect: "Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile." },
  { name: "Mage Armor", level: 1, castingTime: "1 action", range: "Touch", duration: "8 hours", description: "You touch a willing creature who isn't wearing armor.", effect: "A magical force field surrounds the target until the spell ends. The target's base AC becomes 10 plus its Dexterity modifier." },
  { name: "Detect Magic", level: 1, castingTime: "1 action", range: "Self", duration: "Up to 10 minutes", description: "For the duration, you sense the presence of magic within 30 feet of you.", effect: "If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic. You also learn the school of magic, if any." },
  { name: "Burning Hands", level: 1, castingTime: "1 action", range: "Self (15-foot cone)", duration: "Instantaneous", description: "A thin sheet of flames shoots forth from your outstretched fingertips.", effect: "Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much on a successful one." },
  { name: "Sleep", level: 1, castingTime: "1 action", range: "90 feet", duration: "1 minute", description: "This spell sends creatures into a magical slumber.", effect: "Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose are affected in ascending order of their current hit points." },
  { name: "Comprehend Languages", level: 1, castingTime: "1 action", range: "Self", duration: "1 hour", description: "You understand the literal meaning of any spoken language you hear.", effect: "You also understand any written language that you see, but you must be touching the surface on which the words are written." },
  { name: "Chromatic Orb", level: 1, castingTime: "1 action", range: "90 feet", duration: "Instantaneous", description: "You hurl a 4-inch-diameter sphere of energy at a creature within range.", effect: "Make a ranged spell attack. On a hit, the target takes 3d8 damage of a type you choose: acid, cold, fire, lightning, poison, or thunder." },
  { name: "Magic Weapon", level: 1, castingTime: "1 bonus action", range: "Touch", duration: "Up to 1 hour", description: "You touch a nonmagical weapon.", effect: "Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls." },
  { name: "Misty Step", level: 2, castingTime: "1 bonus action", range: "Self", duration: "Instantaneous", description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.", effect: "You can teleport through barriers as long as you have line of sight to the destination." },
  { name: "Mirror Image", level: 2, castingTime: "1 action", range: "Self", duration: "1 minute", description: "Three illusory duplicates of yourself appear in your space.", effect: "Until the spell ends, the duplicates move with you and mimic your actions. Whenever a creature targets you with an attack, roll a d20. On a roll of 11 or higher, one of the duplicates takes the hit instead." },
  { name: "Scorching Ray", level: 2, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You create three rays of fire and hurl them at targets within range.", effect: "Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage." },
  { name: "Invisibility", level: 2, castingTime: "1 action", range: "Touch", duration: "Up to 1 hour", description: "A creature you touch becomes invisible until the spell ends.", effect: "Anything the target is wearing or carrying is invisible as long as it is on the target's person. The spell ends for a target that attacks or casts a spell." },
  { name: "Counterspell", level: 3, castingTime: "1 reaction, taken when you see a creature within 60 feet casting a spell", range: "60 feet", duration: "Instantaneous", description: "You attempt to interrupt a creature in the process of casting a spell.", effect: "If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability." },
  { name: "Fireball", level: 3, castingTime: "1 action", range: "150 feet", duration: "Instantaneous", description: "A bright streak flashes from your pointing finger to a point you choose within range.", effect: "A 20-foot-radius sphere of fire spreads out from that point. Each creature in that area must make a Dexterity saving throw. A creature takes 8d6 fire damage on a failed save, or half as much on a successful one." },
  { name: "Lightning Bolt", level: 3, castingTime: "1 action", range: "Self (100-foot line)", duration: "Instantaneous", description: "A stroke of lightning forms a line 100 feet long and 5 feet wide.", effect: "Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much on a successful one." },
  { name: "Fly", level: 3, castingTime: "1 action", range: "Touch", duration: "Up to 10 minutes", description: "You touch a willing creature.", effect: "The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall." },
  { name: "Dimension Door", level: 4, castingTime: "1 action", range: "500 feet", duration: "Instantaneous", description: "You teleport yourself from your current location to any other spot within range.", effect: "You can bring along objects as long as their weight doesn't exceed your carrying capacity. You can also bring one willing creature of your size or smaller." },
  { name: "Greater Invisibility", level: 4, castingTime: "1 action", range: "Touch", duration: "Up to 1 minute", description: "You or a creature you touch becomes invisible until the spell ends.", effect: "Unlike invisibility, this spell does not end if the target attacks or casts a spell." },
  { name: "Wall of Fire", level: 4, castingTime: "1 action", range: "120 feet", duration: "Up to 1 minute", description: "You create a wall of fire on a solid surface within range.", effect: "When a creature enters the wall's space for the first time on a turn or starts its turn there, it must make a Dexterity saving throw, taking 5d8 fire damage on a failed save, or half as much on a successful one." },
  { name: "Cloudkill", level: 5, castingTime: "1 action", range: "120 feet", duration: "Up to 10 minutes", description: "You create a 20-foot-radius sphere of poisonous, yellow-green fog centered on a point you choose within range.", effect: "The fog spreads around corners and heavily obscures its area. When a creature enters the area, it must make a Constitution saving throw, taking 5d8 poison damage on a failed save, or half as much on a successful one." },
  { name: "Scrying", level: 5, castingTime: "10 minutes", range: "Self", duration: "Up to 10 minutes", description: "You can see and hear a particular creature you choose that is on the same plane of existence as you.", effect: "If the target is willing, the scrying succeeds automatically. If unwilling, the target can make a Wisdom saving throw to resist." },
];

export const equipment: SRDEquipment[] = [
  { name: "Longsword", description: "A versatile martial weapon, effective in slashing and thrusting attacks.", type: "weapon", category: "melee", damageDice: "1d8", damageType: "slashing" },
  { name: "Shortbow", description: "A ranged weapon favored by rogues and rangers for its mobility.", type: "weapon", category: "ranged", damageDice: "1d6", damageType: "piercing" },
  { name: "Leather Armor", description: "Light armor made from tough but flexible leather, offering basic protection.", type: "armor", baseAC: 11, armorType: "light", maxDexBonus: null },
  { name: "Chain Shirt", description: "Medium armor made of interlocking metal rings, balancing protection and mobility.", type: "armor", baseAC: 13, armorType: "medium", maxDexBonus: 2 },
  { name: "Chain Mail", description: "Heavy armor made of interlocking metal rings.", type: "armor", baseAC: 16, armorType: "heavy", maxDexBonus: 0 },
  { name: "Dagger", description: "A simple, lightweight weapon that can be used in melee or thrown.", type: "weapon", category: "melee", damageDice: "1d4", damageType: "piercing" },
  { name: "Shortsword", description: "A martial weapon favored by rogues.", type: "weapon", category: "melee", damageDice: "1d6", damageType: "piercing" },
  { name: "Rapier", description: "A slender, sharply pointed martial weapon.", type: "weapon", category: "melee", damageDice: "1d8", damageType: "piercing" },
  { name: "Longbow", description: "A ranged weapon used for long-distance combat.", type: "weapon", category: "ranged", damageDice: "1d8", damageType: "piercing" },
  { name: "Light Crossbow", description: "A ranged weapon that fires bolts.", type: "weapon", category: "ranged", damageDice: "1d8", damageType: "piercing" },
  { name: "Handaxe", description: "A simple melee weapon designed for throwing.", type: "weapon", category: "melee", damageDice: "1d6", damageType: "slashing" },
  { name: "Quarterstaff", description: "A simple melee weapon made of wood.", type: "weapon", category: "melee", damageDice: "1d6", damageType: "bludgeoning" },
  { name: "Shield", description: "A defensive tool that increases your Armor Class when wielded.", type: "armor", baseAC: 2, armorType: "shield" },
  { name: "Potion of Healing", description: "Restores 2d4+2 hit points when consumed.", type: "item" },
  { name: "Dungeoneer's Pack", description: "A backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Explorer's Pack", description: "A backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Burglar's Pack", description: "A backpack, 10 feet of string, a bell, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, a waterskin, and 50 feet of rope.", type: "item" },
  { name: "Scholar's Pack", description: "A backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Diplomat's Pack", description: "A chest, 2 map or scroll cases, fine clothes, ink, ink pen, lamp, 2 flasks of oil, 5 sheets of paper, perfume, sealing wax, and soap.", type: "item" },
  { name: "Entertainer's Pack", description: "A backpack, bedroll, 2 sets of costume clothes, 5 candles, 5 days of rations, a waterskin, and a disguise kit.", type: "item" },
  { name: "Priest's Pack", description: "A backpack, blanket, 10 candles, tinderbox, 2 days of rations, a waterskin, alms box, 2 blocks of incense, censer, and vestments.", type: "item" },
  { name: "Component Pouch", description: "A small pouch containing arcane components.", type: "item" },
  { name: "Arcane Focus", description: "A focus for casting spells, such as a wand or orb.", type: "item" },
  { name: "Spellbook", description: "A book containing your starting spells and formulas for casting them.", type: "item" },
  { name: "Quiver", description: "Arrows or bolts.", type: "item" },
  { name: "Thieves' Tools", description: "A set of tools for picking locks and disarming traps.", type: "item" },
];

export const languages: SRDLanguage[] = [
  { name: "Common" },
  { name: "Dwarvish" },
  { name: "Elvish" },
  { name: "Giant" },
  { name: "Gnomish" },
  { name: "Goblin" },
  { name: "Halfling" },
  { name: "Orc" },
];

export const backgrounds = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Hermit",
  "Noble",
  "Outlander",
  "Sage",
  "Sailor",
  "Soldier",
  "Urchin",
];

export const raceNames = races.map((r) => r.name);
export const classNames = classes.map((c) => c.name);
export const skillNames = skills.map((s) => s.name);
export const spellNames = spells.map((s) => s.name);
export const equipmentNames = equipment.map((e) => e.name);
export const languageNames = languages.map((l) => l.name);

export function getRaceData(name: string): SRDRace | undefined {
  return races.find((r) => r.name === name);
}

export function getClassData(name: string): SRDClass | undefined {
  return classes.find((c) => c.name === name);
}

export function getSkillData(name: string): SRDSkill | undefined {
  return skills.find((s) => s.name === name);
}

export function getSpellData(name: string): SRDSpell | undefined {
  return spells.find((s) => s.name === name);
}

export function getEquipmentData(name: string): SRDEquipment | undefined {
  return equipment.find((e) => e.name === name);
}

export function getLanguageData(name: string): SRDLanguage | undefined {
  return languages.find((l) => l.name === name);
}
