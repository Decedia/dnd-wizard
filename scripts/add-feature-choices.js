const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

// Define all the choices we need to add based on SRD analysis
const featureChoices = {
  "Fighter": {
    "Fighting Style": {
      type: "single",
      options: ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"],
      description: "Choose a fighting style option."
    }
  },
  "Paladin": {
    "Fighting Style": {
      type: "single",
      options: ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"],
      description: "Choose a fighting style option."
    }
  },
  "Ranger": {
    "Fighting Style": {
      type: "single",
      options: ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"],
      description: "Choose a fighting style option."
    },
    "Favored Enemy": {
      type: "single",
      options: ["Aberrations", "Beasts", "Celestials", "Constructs", "Dragons", "Elementals", "Fey", "Fiends", "Giants", "Monstrosities", "Oozes", "Plants", "Undead"],
      description: "Choose a type of favored enemy."
    },
    "Natural Explorer": {
      type: "single",
      options: ["Arctic", "Coast", "Desert", "Forest", "Grassland", "Mountain", "Swamp", "Underdark"],
      description: "Choose a type of natural environment."
    }
  },
  "Rogue": {
    "Expertise": {
      type: "skills",
      count: 2,
      options: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth", "Thieves' Tools"],
      description: "Choose two of your skill proficiencies to gain expertise in."
    }
  },
  "Bard": {
    "Expertise": {
      type: "skills",
      count: 2,
      options: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"],
      description: "Choose two of your skill proficiencies to gain expertise in."
    }
  },
  "Warlock": {
    "Eldritch Invocations": {
      type: "invocations",
      count: 2,
      options: ["Agonizing Blast", "Armor of Shadows", "Beast Speech", "Beguiling Defenses", "Bewitching Whispers", "Book of Ancient Secrets", "Chains of Carceri", "Devil's Sight", "Dreadful Word", "Eldritch Master", "Eldritch Sight", "Eyes of the Rune Keeper", "Fiendish Vigor", "Gift of the Depths", "Gift of the Ever-Living Ones", "Mask of Many Faces", "Master of Myriad Forms", "Minions of Chaos", "Mire the Mind", "Misty Visions", "One with Shadows", "Otherworldly Leap", "Piercing Gaze", "Poisonous Touch", "Protection of the Seraph", "Puppet Master", "Repelling Blast", "Sculptor of Flesh", "Sign of Ill Omen", "Spirit of the Dead", "Starry Form", "Tomb of Levistus", "Trickster's Escape", "Uncanny Armor", "Visions of Distant Realms", "Whispers of the Grave", "Witch Sight"],
      description: "Choose two eldritch invocations."
    }
  }
};

// Update classes with feature choices
classesData.classes.forEach((cls) => {
  const classChoices = featureChoices[cls.name];
  if (!classChoices) return;

  cls.levels.forEach((level) => {
    if (!level.features) return;
    level.features.forEach((feature) => {
      const choiceData = classChoices[feature.name];
      if (choiceData) {
        feature.choices = choiceData;
      }
    });
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Updated class features with choices');
