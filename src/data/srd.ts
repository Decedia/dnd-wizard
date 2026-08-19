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
  type: "sneak_attack" | "expertise";
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
}

export interface SRDSkill {
  name: string;
  ability: string;
  description: string;
}

export interface SRDSpell {
  name: string;
  level: number;
  description: string;
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
      { name: "Fighting Style", description: "You adopt a particular style of fighting as your specialty." },
      { name: "Second Wind", description: "Regain hit points equal to 1d10 + your fighter level as a bonus action." },
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
      { name: "Spellcasting", description: "You can cast spells using an arcane focus and your spellbook." },
      { name: "Arcane Recovery", description: "Recover spell slots once per day during a short rest." },
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
      { name: "Expertise", description: "Double your proficiency bonus for two chosen skills or thieves' tools.", type: "expertise" },
      { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll.", type: "sneak_attack" },
      { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues." },
    ],
    levels: [
      { features: [{ name: "Expertise", description: "Double your proficiency bonus for two chosen skills or thieves' tools.", type: "expertise" }, { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll.", type: "sneak_attack" }, { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues." }], asi: false },
      { features: [{ name: "Cunning Action", description: "Use a bonus action to Dash, Disengage, or Hide." }], asi: false },
      { features: [{ name: "Roguish Archetype", description: "Choose a roguish archetype: Thief, Assassin, or Arcane Trickster." }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Uncanny Dodge", description: "Use your reaction to halve the damage from an attack that hits you." }], asi: false },
      { features: [{ name: "Roguish Archetype feature", description: "You gain a feature from your chosen Roguish Archetype." }], asi: false },
      { features: [{ name: "Evasion", description: "Dodge out of the way of area effects on a successful Dexterity saving throw." }], asi: false },
      { features: [], asi: true },
      { features: [{ name: "Roguish Archetype feature", description: "You gain a feature from your chosen Roguish Archetype." }], asi: false },
      { features: [{ name: "Stroke of Luck", description: "Turn a missed attack into a hit or a failed ability check into a success." }], asi: false },
    ],
    scalingFeatures: [
      {
        name: "Sneak Attack",
        description: "Deal extra damage to a creature you hit with advantage on the attack roll.",
        type: "sneak_attack",
        values: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5 },
      },
      {
        name: "Expertise",
        description: "Double your proficiency bonus for two chosen skills or thieves' tools.",
        type: "expertise",
        values: { 1: 2, 3: 2, 6: 4 },
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
  { name: "Fire Bolt", level: 0, description: "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried." },
  { name: "Magic Missile", level: 1, description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4+1 force damage to its target." },
  { name: "Shield", level: 1, description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile." },
  { name: "Mage Armor", level: 1, description: "You touch a willing creature who isn't wearing armor, and a magical force field surrounds it until the spell ends. The target's base AC becomes 10 plus its Dexterity modifier." },
  { name: "Detect Magic", level: 1, description: "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic." },
  { name: "Burning Hands", level: 1, description: "As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much on a successful one." },
  { name: "Sleep", level: 1, description: "This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose within range are affected in ascending order of their current hit points." },
  { name: "Comprehend Languages", level: 1, description: "For the duration, you understand the literal meaning of any spoken language you hear. You also understand any written language that you see, but you must be touching the surface on which the words are written." },
  { name: "Chromatic Orb", level: 1, description: "You hurl a 4-inch-diameter sphere of energy at a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 3d8 damage of a type you choose: acid, cold, fire, lightning, poison, or thunder." },
  { name: "Magic Weapon", level: 1, description: "You touch a nonmagical weapon. Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls." },
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
