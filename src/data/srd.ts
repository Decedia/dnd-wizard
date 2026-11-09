export interface SRDRace {
  name: string;
  abilityScoreIncreases: Record<string, number>;
  speed: number;
  size: string;
  darkvision: boolean | { range: number };
  traits: { name: string; description: string }[];
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
  target?: string;
  effectSummary?: string;
  fullDescription?: string;
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
  { name: "Fire Bolt", level: 0, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You hurl a mote of fire at a creature or object within range.", effect: "Make a ranged spell attack. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried.", target: "1 creature or object within 120ft", effectSummary: "Hurl a mote of fire at a target", fullDescription: "Make a ranged spell attack against a creature or object within 120 feet. On a hit, the target takes 1d10 fire damage. Flammable objects that aren't being worn or carried catch fire if hit." },
  { name: "Ray of Frost", level: 0, castingTime: "1 action", range: "60 feet", duration: "Instantaneous", description: "A beam of blue-white light streaks toward a creature within range.", effect: "Make a ranged spell attack. On a hit, the target takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn.", target: "1 creature within 60ft", effectSummary: "Fire a ray of cold that slows the target", fullDescription: "Make a ranged spell attack. On a hit, the target takes 1d8 cold damage and its speed is reduced by 10 feet until the start of your next turn." },
  { name: "Light", level: 0, castingTime: "1 action", range: "Touch", duration: "1 hour", description: "You touch one object that is no larger than 10 feet in any dimension.", effect: "Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like.", target: "1 object you touch", effectSummary: "Make an object glow with bright light", fullDescription: "Touch one object no larger than 10 feet in any dimension. Until the spell ends, it sheds bright light in a 20-foot radius and dim light for an additional 20 feet. You can choose the light's color." },
  { name: "Mage Hand", level: 0, castingTime: "1 action", range: "30 feet", duration: "1 minute", description: "A spectral, floating hand appears at a point you choose within range.", effect: "The hand lasts for the duration or until you dismiss it. You can use it to manipulate an object, open an unlocked door or container, or stow or retrieve an item from an open container.", target: "a point within 30ft", effectSummary: "Create a floating hand to manipulate objects", fullDescription: "A spectral hand appears at a point within 30 feet. It lasts for up to 1 minute. You can use it to manipulate objects, open unlocked doors or containers, or stow and retrieve items from open containers. The hand can't attack or activate magic items." },
  { name: "Prestidigitation", level: 0, castingTime: "1 action", range: "10 feet", duration: "Up to 1 hour", description: "You create a minor magical effect within range.", effect: "You can create a harmless sensory effect, light or snuff a small flame, clean or soil an object no larger than 1 cubic foot, chill or warm up to 1 cubic foot of nonliving material, or make a small mark or color appear on an object.", target: "within 10 feet", effectSummary: "Create a minor magical trick or sensory effect", fullDescription: "Create a harmless sensory effect, light or snuff a small flame, clean or soil an object up to 1 cubic foot, chill or warm nonliving material, or make a small mark appear on an object. The effect lasts up to 1 hour." },
  { name: "Magic Missile", level: 1, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You create three glowing darts of magical force.", effect: "Each dart hits a creature of your choice that you can see within range. A dart deals 1d4+1 force damage to its target. The darts all strike simultaneously, and you can direct them at one creature or several.", target: "creatures within 120ft", effectSummary: "Launch force darts that automatically hit", fullDescription: "Create three glowing darts of magical force. Each dart automatically hits a creature of your choice within 120 feet and deals 1d4+1 force damage. The darts strike simultaneously and can target one creature or several. At higher levels, you create one additional dart for each slot level above 1st." },
  { name: "Shield", level: 1, castingTime: "1 reaction, taken when you are hit by an attack or targeted by the magic missile spell", range: "Self", duration: "1 round", description: "An invisible barrier of magical force appears to protect you.", effect: "Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.", target: "yourself", effectSummary: "Gain +5 AC and block magic missile", fullDescription: "An invisible barrier of magical force appears to protect you. Until the start of your next turn, you gain a +5 bonus to AC (including against the triggering attack) and take no damage from magic missile. Cast as a reaction when you are hit by an attack or targeted by magic missile." },
  { name: "Mage Armor", level: 1, castingTime: "1 action", range: "Touch", duration: "8 hours", description: "You touch a willing creature who isn't wearing armor.", effect: "A magical force field surrounds the target until the spell ends. The target's base AC becomes 10 plus its Dexterity modifier.", target: "1 willing creature you touch", effectSummary: "Set base AC to 10 plus your DEX modifier", fullDescription: "Touch a willing creature who isn't wearing armor. A magical force field surrounds them until the spell ends (8 hours), setting their base AC to 10 plus their Dexterity modifier. This counts as wearing armor for the purpose of class features." },
  { name: "Detect Magic", level: 1, castingTime: "1 action", range: "Self", duration: "Up to 10 minutes", description: "For the duration, you sense the presence of magic within 30 feet of you.", effect: "If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic. You also learn the school of magic, if any.", target: "yourself (30ft radius)", effectSummary: "Sense magical auras within 30 feet", fullDescription: "For up to 10 minutes, sense the presence of magic within 30 feet. Use your action to see a faint aura around visible creatures or objects that bear magic, and learn the school of magic if any. The spell can penetrate most barriers but is blocked by 1 foot of stone or 1 inch of metal." },
  { name: "Burning Hands", level: 1, castingTime: "1 action", range: "Self (15-foot cone)", duration: "Instantaneous", description: "A thin sheet of flames shoots forth from your outstretched fingertips.", effect: "Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much on a successful one.", target: "all creatures in a 15ft cone", effectSummary: "Deal 3d6 fire damage in a 15-foot cone", fullDescription: "A thin sheet of flames shoots from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. On a failed save, they take 3d6 fire damage, or half as much on a successful one. At higher levels, the damage increases by 1d6 per slot level above 1st." },
  { name: "Sleep", level: 1, castingTime: "1 action", range: "90 feet", duration: "1 minute", description: "This spell sends creatures into a magical slumber.", effect: "Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose are affected in ascending order of their current hit points.", target: "creatures within 20ft of a point", effectSummary: "Put low-HP creatures to sleep with 5d8 total", fullDescription: "Roll 5d8 to determine how many hit points of creatures you can affect. Creatures within 20 feet of a point you choose within 90 feet fall asleep in ascending order of their current hit points (lowest first). Undead and creatures immune to charm aren't affected. A sleeping creature wakes if it takes damage or someone uses an action to shake it awake. At higher levels, roll an extra 2d8 per slot level above 1st." },
  { name: "Comprehend Languages", level: 1, castingTime: "1 action", range: "Self", duration: "1 hour", description: "You understand the literal meaning of any spoken language you hear.", effect: "You also understand any written language that you see, but you must be touching the surface on which the words are written.", target: "yourself", effectSummary: "Understand any spoken or written language", fullDescription: "You understand the literal meaning of any spoken language you hear for the duration (1 hour). You also understand any written language you see, but you must be touching the surface it's written on. This spell doesn't let you speak or write the language, only understand it." },
  { name: "Chromatic Orb", level: 1, castingTime: "1 action", range: "90 feet", duration: "Instantaneous", description: "You hurl a 4-inch-diameter sphere of energy at a creature within range.", effect: "Make a ranged spell attack. On a hit, the target takes 3d8 damage of a type you choose: acid, cold, fire, lightning, poison, or thunder.", target: "1 creature within 90ft", effectSummary: "Deal 3d8 damage of your chosen type", fullDescription: "Hurl a 4-inch sphere of energy at a creature within 90 feet. Make a ranged spell attack. On a hit, the target takes 3d8 damage of a type you choose: acid, cold, fire, lightning, poison, or thunder. At higher levels, the damage increases by 1d8 for each slot level above 1st." },
  { name: "Magic Weapon", level: 1, castingTime: "1 bonus action", range: "Touch", duration: "Up to 1 hour", description: "You touch a nonmagical weapon.", effect: "Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls.", target: "1 nonmagical weapon you touch", effectSummary: "Give a weapon a +1 bonus to attacks and damage", fullDescription: "Touch a nonmagical weapon. Until the spell ends (up to 1 hour), that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls. At higher levels, the bonus increases to +2 at 3rd level and +3 at 5th level." },
  { name: "Misty Step", level: 2, castingTime: "1 bonus action", range: "Self", duration: "Instantaneous", description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.", effect: "You can teleport through barriers as long as you have line of sight to the destination.", target: "yourself", effectSummary: "Teleport up to 30 feet to a space you can see", fullDescription: "Briefly surrounded by silvery mist, teleport up to 30 feet to an unoccupied space you can see. You can teleport through barriers as long as you have line of sight to the destination. Cast as a bonus action." },
  { name: "Mirror Image", level: 2, castingTime: "1 action", range: "Self", duration: "1 minute", description: "Three illusory duplicates of yourself appear in your space.", effect: "Until the spell ends, the duplicates move with you and mimic your actions. Whenever a creature targets you with an attack, roll a d20. On a roll of 11 or higher, one of the duplicates takes the hit instead.", target: "yourself", effectSummary: "Create 3 duplicates that can absorb attacks", fullDescription: "Three illusory duplicates appear in your space and last for up to 1 minute. They move with you and mimic your actions. Whenever a creature targets you with an attack, roll a d20. On a roll of 11 or higher, one duplicate takes the hit instead and disappears. The spell ends when all duplicates are destroyed." },
  { name: "Scorching Ray", level: 2, castingTime: "1 action", range: "120 feet", duration: "Instantaneous", description: "You create three rays of fire and hurl them at targets within range.", effect: "Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.", target: "creatures within 120ft", effectSummary: "Fire rays dealing 2d6 fire damage each", fullDescription: "Create three rays of fire and hurl them at targets within 120 feet. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage. You can direct all rays at one creature or split them among several. At higher levels, you create one additional ray for each slot level above 2nd." },
  { name: "Invisibility", level: 2, castingTime: "1 action", range: "Touch", duration: "Up to 1 hour", description: "A creature you touch becomes invisible until the spell ends.", effect: "Anything the target is wearing or carrying is invisible as long as it is on the target's person. The spell ends for a target that attacks or casts a spell.", target: "1 creature you touch", effectSummary: "Make a creature invisible until it attacks", fullDescription: "A creature you touch becomes invisible until the spell ends (up to 1 hour). Anything the target is wearing or carrying is invisible as long as it's on their person. The spell ends immediately if the target attacks or casts a spell. At higher levels, the duration increases to 1 minute per slot level above 2nd for each creature targeted." },
  { name: "Counterspell", level: 3, castingTime: "1 reaction, taken when you see a creature within 60 feet casting a spell", range: "60 feet", duration: "Instantaneous", description: "You attempt to interrupt a creature in the process of casting a spell.", effect: "If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability.", target: "a creature casting a spell within 60ft", effectSummary: "Interrupt and stop a spell being cast", fullDescription: "Attempt to interrupt a creature casting a spell within 60 feet. If the spell is 3rd level or lower, it automatically fails. If it's 4th level or higher, make an ability check using your spellcasting ability (DC = 10 + the spell's level). On a success, the spell fails and has no effect. Cast as a reaction when you see a creature within 60 feet casting a spell." },
  { name: "Fireball", level: 3, castingTime: "1 action", range: "150 feet", duration: "Instantaneous", description: "A bright streak flashes from your pointing finger to a point you choose within range.", effect: "A 20-foot-radius sphere of fire spreads out from that point. Each creature in that area must make a Dexterity saving throw. A creature takes 8d6 fire damage on a failed save, or half as much on a successful one.", target: "all creatures in a 20ft sphere", effectSummary: "Deal 8d6 fire damage in a 20-foot sphere", fullDescription: "A bright streak flashes to a point you choose within 150 feet, then explodes into a 20-foot-radius sphere of flame. Each creature in the area must make a Dexterity saving throw. On a failed save, they take 8d6 fire damage, or half as much on a successful one. The fire spreads around corners and ignites flammable objects not being worn or carried. At higher levels, the damage increases by 1d6 per slot level above 3rd." },
  { name: "Lightning Bolt", level: 3, castingTime: "1 action", range: "Self (100-foot line)", duration: "Instantaneous", description: "A stroke of lightning forms a line 100 feet long and 5 feet wide.", effect: "Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much on a successful one.", target: "all creatures in a 100ft x 5ft line", effectSummary: "Deal 8d6 lightning damage in a 100-foot line", fullDescription: "A stroke of lightning forms a line 100 feet long and 5 feet wide starting from you. Each creature in the line must make a Dexterity saving throw. On a failed save, they take 8d6 lightning damage, or half as much on a successful one. At higher levels, the damage increases by 1d6 per slot level above 3rd." },
  { name: "Fly", level: 3, castingTime: "1 action", range: "Touch", duration: "Up to 10 minutes", description: "You touch a willing creature.", effect: "The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.", target: "1 willing creature you touch", effectSummary: "Give a creature a 60-foot flying speed", fullDescription: "Touch a willing creature. The target gains a flying speed of 60 feet for up to 10 minutes. When the spell ends, the target falls if still aloft unless they can stop the fall. At higher levels, the duration increases to 10 minutes per slot level above 3rd." },
  { name: "Dimension Door", level: 4, castingTime: "1 action", range: "500 feet", duration: "Instantaneous", description: "You teleport yourself from your current location to any other spot within range.", effect: "You can bring along objects as long as their weight doesn't exceed your carrying capacity. You can also bring one willing creature of your size or smaller.", target: "yourself and optionally 1 willing creature", effectSummary: "Teleport yourself and optionally one creature up to 500ft", fullDescription: "Teleport yourself from your current location to any other spot within 500 feet. You can bring objects as long as their weight doesn't exceed your carrying capacity. You can also bring one willing creature of your size or smaller. If you would arrive inside a solid object, you take damage and appear in the nearest unoccupied space." },
  { name: "Greater Invisibility", level: 4, castingTime: "1 action", range: "Touch", duration: "Up to 1 minute", description: "You or a creature you touch becomes invisible until the spell ends.", effect: "Unlike invisibility, this spell does not end if the target attacks or casts a spell.", target: "1 creature you touch or yourself", effectSummary: "Make a creature invisible even when attacking", fullDescription: "You or a creature you touch becomes invisible until the spell ends (up to 1 minute). Unlike the invisibility spell, this does not end if the target attacks or casts a spell. Anything the target is wearing or carrying is invisible as long as it's on their person. At higher levels, the duration increases to 1 minute per slot level above 4th." },
  { name: "Wall of Fire", level: 4, castingTime: "1 action", range: "120 feet", duration: "Up to 1 minute", description: "You create a wall of fire on a solid surface within range.", effect: "When a creature enters the wall's space for the first time on a turn or starts its turn there, it must make a Dexterity saving throw, taking 5d8 fire damage on a failed save, or half as much on a successful one.", target: "creatures entering or starting turn in the wall", effectSummary: "Create a wall dealing 5d8 fire damage", fullDescription: "Create a wall of fire on a solid surface within 120 feet. The wall can be up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter. When a creature enters the wall's space for the first time on a turn or starts its turn there, it must make a Dexterity saving throw, taking 5d8 fire damage on a failed save, or half as much on a successful one. One side of the wall deals double damage. The wall lasts for up to 1 minute." },
  { name: "Cloudkill", level: 5, castingTime: "1 action", range: "120 feet", duration: "Up to 10 minutes", description: "You create a 20-foot-radius sphere of poisonous, yellow-green fog centered on a point you choose within range.", effect: "The fog spreads around corners and heavily obscures its area. When a creature enters the area, it must make a Constitution saving throw, taking 5d8 poison damage on a failed save, or half as much on a successful one.", target: "all creatures entering or in the fog", effectSummary: "Create a poison fog dealing 5d8 poison damage", fullDescription: "Create a 20-foot-radius sphere of poisonous, yellow-green fog centered on a point within 120 feet. The fog spreads around corners and heavily obscures its area. When a creature enters the area or starts its turn there, it must make a Constitution saving throw, taking 5d8 poison damage on a failed save, or half as much on a successful one. The fog lasts for up to 10 minutes. At higher levels, the damage increases by 1d8 per slot level above 5th." },
  { name: "Scrying", level: 5, castingTime: "10 minutes", range: "Self", duration: "Up to 10 minutes", description: "You can see and hear a particular creature you choose that is on the same plane of existence as you.", effect: "If the target is willing, the scrying succeeds automatically. If unwilling, the target can make a Wisdom saving throw to resist.", target: "1 creature on the same plane", effectSummary: "See and hear a distant creature on the same plane", fullDescription: "See and hear a particular creature you choose that is on the same plane of existence. If the target is willing, scrying succeeds automatically. If unwilling, the target makes a Wisdom saving throw to resist. The spell can be blocked by certain materials or spells. If the target is familiar with you, they have disadvantage on the saving throw. The spell lasts up to 10 minutes." }
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
  // Exotic languages: players may take these with the DM's approval.
  { name: "Abyssal" },
  { name: "Celestial" },
  { name: "Deep Speech" },
  { name: "Draconic" },
  { name: "Infernal" },
  { name: "Primordial" },
  { name: "Sylvan" },
  { name: "Undercommon" },
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
export const skillNames = skills.map((s) => s.name);
export const spellNames = spells.map((s) => s.name);
export const languageNames = languages.map((l) => l.name);

export function getRaceData(name: string): SRDRace | undefined {
  return races.find((r) => r.name === name);
}

export function getSkillData(name: string): SRDSkill | undefined {
  return skills.find((s) => s.name === name);
}

export function getSpellData(name: string): SRDSpell | undefined {
  return spells.find((s) => s.name === name);
}

export function getLanguageData(name: string): SRDLanguage | undefined {
  return languages.find((l) => l.name === name);
}
