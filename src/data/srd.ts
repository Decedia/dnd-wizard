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
  cantripsKnown?: Record<number, number>;
  scalingFeatures?: SRDScalingFeature[];
  subclassLevel?: number;
  subclasses?: {
    name: string;
    description: string;
    features: { name: string; description: string }[];
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
    { name: "Fighting Style", description: "You adopt a particular style of fighting as your specialty.", type: "feature" },
    { name: "Second Wind", description: "Regain hit points equal to 1d10 + your fighter level as a bonus action.", type: "feature" },
  ],
    levels: [
      { features: [{ name: "Fighting Style", description: "You adopt a particular style of fighting as your specialty." }, { name: "Second Wind", description: "Regain hit points equal to 1d10 + your fighter level as a bonus action." }], asi: false },
      { features: [{ name: "Action Surge", description: "Take one additional action on your turn, once per short rest." }], asi: false },
      { features: [{ name: "Martial Archetype", description: "Choose a martial archetype: Champion, Battle Master, or Eldritch Knight." }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Extra Attack", description: "Attack twice whenever you take the Attack action on your turn." }], asi: false },
      { features: [], asi: false },
      { features: [{ name: "Martial Archetype feature", description: "You gain a feature from your chosen Martial Archetype." }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Indomitable", description: "Reroll a failed saving throw, once per long rest." }], asi: false },
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
      { name: "Spellcasting", description: "You can cast spells using an arcane focus and your spellbook.", type: "feature" },
      { name: "Arcane Recovery", description: "Recover spell slots once per day during a short rest.", type: "feature" },
    ],
    levels: [
      { features: [{ name: "Spellcasting", description: "You can cast spells using an arcane focus and your spellbook." }, { name: "Arcane Recovery", description: "Recover spell slots once per day during a short rest." }], asi: false, spellSlots: { 1: 2 } },
      { features: [{ name: "Arcane Tradition", description: "Choose an arcane tradition: School of Evocation, etc." }], asi: false, spellSlots: { 1: 3 } },
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
    cantripsKnown: { 1: 3, 4: 4, 10: 5 },
    subclassLevel: 2,
    subclasses: [
      {
        name: "School of Abjuration",
        description: "A wizard who specializes in protective magic.",
        features: [
          { name: "Abjuration Savant", description: "You gain expertise in abjuration spells." },
          { name: "Arcane Ward", description: "You can create a magical ward that absorbs damage." },
        ],
      },
      {
        name: "School of Conjuration",
        description: "A wizard who specializes in creating objects and creatures from magic.",
        features: [
          { name: "Conjuration Savant", description: "You gain expertise in conjuration spells." },
          { name: "Minor Conjuration", description: "You can conjure a small object with your magic." },
        ],
      },
      {
        name: "School of Divination",
        description: "A wizard who specializes in gaining knowledge and foresight.",
        features: [
          { name: "Divination Savant", description: "You gain expertise in divination spells." },
          { name: "Portent", description: "You can glimpse the future and influence the rolls of fate." },
        ],
      },
      {
        name: "School of Enchantment",
        description: "A wizard who specializes in charming and beguiling others.",
        features: [
          { name: "Enchantment Savant", description: "You gain expertise in enchantment spells." },
          { name: "Hypnotic Gaze", description: "You can charm a creature with your gaze." },
        ],
      },
      {
        name: "School of Evocation",
        description: "A wizard who specializes in raw destructive magic.",
        features: [
          { name: "Evocation Savant", description: "You gain expertise in evocation spells." },
          { name: "Sculpt Spells", description: "You can protect your allies from your own evocation spells." },
        ],
      },
      {
        name: "School of Illusion",
        description: "A wizard who specializes in creating deceptive images and phantasms.",
        features: [
          { name: "Illusion Savant", description: "You gain expertise in illusion spells." },
          { name: "Malleable Illusion", description: "You can alter your illusions on the fly." },
        ],
      },
      {
        name: "School of Necromancy",
        description: "A wizard who specializes in the magic of death and undeath.",
        features: [
          { name: "Necromancy Savant", description: "You gain expertise in necromancy spells." },
          { name: "Grim Harvest", description: "You can regain hit points when you kill creatures with your spells." },
        ],
      },
      {
        name: "School of Transmutation",
        description: "A wizard who specializes in altering the physical world.",
        features: [
          { name: "Transmutation Savant", description: "You gain expertise in transmutation spells." },
          { name: "Minor Alchemy", description: "You can transmute materials into other materials." },
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
      { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll.", type: "attack" },
      { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues.", type: "feature" },
    ],
    levels: [
      { features: [{ name: "Expertise", description: "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies (in skills or with thieves' tools) to gain this benefit.", type: "feature" }, { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll.", type: "attack" }, { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues.", type: "feature" }], asi: false },
      { features: [{ name: "Cunning Action", description: "Use a bonus action to Dash, Disengage, or Hide.", type: "feature" }], asi: false },
      { features: [{ name: "Rogue Archetype", description: "Choose a rogue archetype: Thief, Assassin, or Arcane Trickster.", type: "feature" }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Uncanny Dodge", description: "Use your reaction to halve the damage from an attack that hits you.", type: "feature" }], asi: false },
      { features: [], asi: false },
      { features: [{ name: "Evasion", description: "Dodge out of the way of area effects on a successful Dexterity saving throw.", type: "feature" }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Rogue Archetype feature", description: "You gain a feature from your chosen Rogue Archetype.", type: "feature" }], asi: false },
      { features: [{ name: "Stroke of Luck", description: "Turn a missed attack into a hit or a failed ability check into a success.", type: "feature" }], asi: false },
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
  { name: "Dungeoneer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Explorer's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Burglar's Pack", description: "Includes a backpack, 10 feet of string, a bell, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, a waterskin, and 50 feet of rope.", type: "item" },
  { name: "Scholar's Pack", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin.", type: "item" },
  { name: "Component Pouch", description: "A small pouch containing arcane components.", type: "item" },
  { name: "Arcane Focus", description: "A focus for casting spells, such as a wand or orb.", type: "item" },
  { name: "Spellbook", description: "A book containing your starting spells and formulas for casting them.", type: "item" },
  { name: "Quiver", description: "Contains arrows or bolts.", type: "item" },
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
