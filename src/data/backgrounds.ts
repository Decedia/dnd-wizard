export interface BackgroundData {
  name: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: string[];
  feature: { name: string; description: string };
}

export const backgroundsData: BackgroundData[] = [
  {
    name: "Acolyte",
    skillProficiencies: ["Insight", "Religion"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Holy symbol", "Prayer book", "5 sticks of incense", "vestments", "set of common clothes", "belt pouch containing 15 gp"],
    feature: {
      name: "Shelter of the Faithful",
      description: "As an acolyte, you and your companions can expect to receive healing and care at a temple of your faith. You can also gain access to shrines and altars for spellcasting purposes."
    }
  },
  {
    name: "Charlatan",
    skillProficiencies: ["Deception", "Sleight of Hand"],
    toolProficiencies: ["Disguise kit", "Forgery kit"],
    languages: 0,
    equipment: ["Set of fine clothes", "disguise kit", "tools of the con of your choice (ten stopped bottles of colored liquid, a set of weighted dice, a deck of marked cards, or a signet ring of an imaginary duke)", "belt pouch containing 15 gp"],
    feature: {
      name: "False Identity",
      description: "You have created a second identity that has documentation, established acquaintances, and disguises that allow you to assume that persona."
    }
  },
  {
    name: "Criminal",
    skillProficiencies: ["Deception", "Stealth"],
    toolProficiencies: ["One type of gaming set", "thieves' tools"],
    languages: 0,
    equipment: ["Crowbar", "set of dark common clothes including a hood", "belt pouch containing 15 gp"],
    feature: {
      name: "Criminal Contact",
      description: "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances."
    }
  },
  {
    name: "Entertainer",
    skillProficiencies: ["Acrobatics", "Performance"],
    toolProficiencies: ["Disguise kit", "one type of musical instrument"],
    languages: 0,
    equipment: ["Musical instrument (one of your choice)", "favor of an admirer (love letter, lock of hair, or trinket)", "costume", "belt pouch containing 15 gp"],
    feature: {
      name: "By Popular Demand",
      description: "You can always find a place to perform, such as a tavern or inn. At such places, you receive free lodging and food of a modest or comfortable standard. Your performance makes you something of a local figure."
    }
  },
  {
    name: "Folk Hero",
    skillProficiencies: ["Animal Handling", "Survival"],
    toolProficiencies: ["One type of artisan's tools", "vehicles (land)"],
    languages: 0,
    equipment: ["Set of artisan's tools (one of your choice)", "shovel", "iron pot", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Rustic Hospitality",
      description: "Since you are of the common folk, you can find a place to hide, rest, or hide among other commoners. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you."
    }
  },
  {
    name: "Guild Artisan",
    skillProficiencies: ["Insight", "Persuasion"],
    toolProficiencies: ["One type of artisan's tools"],
    languages: 1,
    equipment: ["Set of artisan's tools (one of your choice)", "letter of introduction from your guild", "set of traveler's clothes", "belt pouch containing 15 gp"],
    feature: {
      name: "Guild Membership",
      description: "As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed."
    }
  },
  {
    name: "Hermit",
    skillProficiencies: ["Medicine", "Religion"],
    toolProficiencies: ["Herbalism kit"],
    languages: 1,
    equipment: ["Scroll case stuffed full of notes from your studies or prayers", "winter blanket", "set of common clothes", "herbalism kit", "5 gp"],
    feature: {
      name: "Discovery",
      description: "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation is up to you and the DM."
    }
  },
  {
    name: "Noble",
    skillProficiencies: ["History", "Persuasion"],
    toolProficiencies: ["One type of gaming set"],
    languages: 1,
    equipment: ["Set of fine clothes", "signet ring", "scroll of pedigree", "purse containing 25 gp"],
    feature: {
      name: "Position of Privilege",
      description: "Thanks to your birth, people are inclined to think the best of you. You are welcome in high society, and the common folk make every effort to accommodate you. You can secure an audience with a local noble if you need to."
    }
  },
  {
    name: "Outlander",
    skillProficiencies: ["Athletics", "Survival"],
    toolProficiencies: ["One type of musical instrument"],
    languages: 1,
    equipment: ["Staff", "hunting trap", "trophy from an animal you killed", "set of traveler's clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Wanderer",
      description: "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features. In addition, you can find food and fresh water for yourself and up to five other people each day, provided the land offers berries, water, small game, and so forth."
    }
  },
  {
    name: "Sage",
    skillProficiencies: ["Arcana", "History"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Bottle of black ink", "quill", "small knife", "letter from a dead colleague posing a question you have not yet been able to answer", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Researcher",
      description: "When you attempt to learn or recall a piece of lore, if you do not know that information yourself, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature."
    }
  },
  {
    name: "Sailor",
    skillProficiencies: ["Athletics", "Perception"],
    toolProficiencies: ["Navigator's tools", "vehicles (water)"],
    languages: 0,
    equipment: ["Belaying pin (club)", "50 feet of silk rope", "lucky charm such as a rabbit foot or a small stone with a hole in the center", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Ship's Passage",
      description: "When you need to, you can secure free passage on a sailing ship for yourself and your companions. You might sail on a ship you have served on, or one whose captain you are on good terms with."
    }
  },
  {
    name: "Soldier",
    skillProficiencies: ["Athletics", "Intimidation"],
    toolProficiencies: ["One type of gaming set", "vehicles (land)"],
    languages: 0,
    equipment: ["Insignia of rank", "trophy taken from a fallen enemy (a dagger, broken blade, or piece of a banner)", "set of bone dice or deck of cards", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Military Rank",
      description: "Soldiers loyal to your former military organization still recognize your influence and authority. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use."
    }
  },
  {
    name: "Urchin",
    skillProficiencies: ["Sleight of Hand", "Stealth"],
    toolProficiencies: ["Disguise kit", "thieves' tools"],
    languages: 0,
    equipment: ["Small knife", "map of the city you grew up in", "pet mouse", "token to remember your parents by", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "City Secrets",
      description: "You know the secret patterns and flow of cities, and can find passages through the urban sprawl that others would not suspect. When you are not in combat, you and your companions can get to a place you know twice as fast as your speed would normally allow."
    }
  },
];

export const alignmentOptions = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

export function getBackgroundData(name: string): BackgroundData | undefined {
  return backgroundsData.find((b) => b.name === name);
}
