export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
}

export interface SRDClassLevel {
  features: { name: string; description: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
}

export interface SRDClass {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  flavorText: string;
  features: { name: string; description: string }[];
  levels: SRDClassLevel[];
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
    primaryAbility: "str",
    savingThrows: ["str", "con"],
    flavorText: "A master of martial combat, skilled with weapons and armor.",
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
    hitDie: 8,
    primaryAbility: "int",
    savingThrows: ["int", "wis"],
    flavorText: "A scholarly spellcaster who wields magic through study and arcane knowledge.",
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
  },
  {
    name: "Rogue",
    hitDie: 8,
    primaryAbility: "dex",
    savingThrows: ["dex", "int"],
    flavorText: "A stealthy trickster who excels at skills, stealth, and striking from the shadows.",
    features: [
      { name: "Expertise", description: "Double your proficiency bonus for two chosen skills or thieves' tools." },
      { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll." },
      { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues." },
    ],
    levels: [
      { features: [{ name: "Expertise", description: "Double your proficiency bonus for two chosen skills or thieves' tools." }, { name: "Sneak Attack", description: "Deal extra damage to a creature you hit with advantage on the attack roll." }, { name: "Thieves' Cant", description: "Speak a secret mix of dialect and code known only to rogues." }], asi: false },
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

export const raceNames = races.map((r) => r.name);
export const classNames = classes.map((c) => c.name);
export const skillNames = skills.map((s) => s.name);

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
