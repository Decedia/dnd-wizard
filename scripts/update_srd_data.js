/**
 * Comprehensive D&D 5e SRD & Expansion Data Updater
 * Synchronizes core SRD with official D&D 5e API, completes all expansion subclasses,
 * generates clean summaries, and synchronizes spell mappings and choices.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLASSES_EN = path.join(ROOT, 'src/data/en/2014_classes.json');
const SUBCLASSES_EN = path.join(ROOT, 'src/data/en/2014_subclasses.json');
const CLASSES_ID = path.join(ROOT, 'src/data/id/2014_classes.json');
const SUBCLASSES_ID = path.join(ROOT, 'src/data/id/2014_subclasses.json');
const SUBCLASS_SPELLS = path.join(ROOT, 'src/data/subclass_spells.json');
const SUBCLASS_CHOICES = path.join(ROOT, 'src/data/subclass_feature_choices.json');

const API_CACHE = 'C:/Users/user/.gemini/antigravity-ide/brain/eae81e8b-e655-45c9-ac8b-87b3b3975e88/scratch/dnd5e_api_features.json';

// Helper: Normalize string for comparison
function norm(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper: Clean sentence & ensure it does not end awkwardly
function cleanSummary(text) {
  if (!text) return '';
  let s = String(text).trim();
  // Remove markdown bold/italics/backticks
  s = s.replace(/[\*_`#]/g, '');
  // Remove trailing cutoffs like "(bonus action...", "...or Resilience (gain"
  s = s.replace(/\([^\)]*$/, '').trim();
  s = s.replace(/[,;:\-\–\—\s]+$/, '');
  // If ends with dangling preposition or conjunction, trim back to previous word
  const dangling = /\b(and|or|the|with|to|in|of|gain|for|from|as|at|by|into|on|upon|that|which|is|are|a|an)\s*$/i;
  while (dangling.test(s)) {
    s = s.replace(dangling, '').trim();
    s = s.replace(/[,;:\-\–\—\s]+$/, '');
  }
  if (!s.endsWith('.') && !s.endsWith('!') && !s.endsWith('?')) {
    s += '.';
  }
  return s;
}

// Helper: Create a concise, high quality summary from a description
function createSummary(name, description, existingSummary) {
  // If existing summary is already good, keep it
  if (existingSummary && existingSummary.length >= 15 && !/[,;\-\(]\s*$/.test(existingSummary) && !/\b(gain|to|of|and|or)\s*$/i.test(existingSummary)) {
    const cleaned = cleanSummary(existingSummary);
    if (!cleaned.includes('...') && cleaned.length >= 15) {
      return cleaned;
    }
  }

  if (!description) return cleanSummary(name);
  let text = Array.isArray(description) ? description.join(' ') : String(description);
  text = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Pick first 1-2 complete sentences under 160 characters
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let firstSentence = sentences[0] ? sentences[0].trim() : text;

  // If first sentence is just "Starting at X level, you can...", strip the preamble
  firstSentence = firstSentence.replace(/^(Starting at \d+[a-z]{2} level|At \d+[a-z]{2} level|Beginning at \d+[a-z]{2} level|When you choose this [^,]+ at \d+[a-z]{2} level|Also at \d+[a-z]{2} level)[,:\s]*/i, '');
  firstSentence = firstSentence.replace(/^You gain the ability to\s+/i, 'Gain the ability to ');
  firstSentence = firstSentence.replace(/^You can use your\s+/i, 'Use your ');
  firstSentence = firstSentence.replace(/^You can\s+/i, '');
  firstSentence = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);

  if (firstSentence.length > 150) {
    let trimmed = firstSentence.slice(0, 130);
    trimmed = trimmed.replace(/\s+[^\s]*$/, '');
    return cleanSummary(trimmed);
  }

  return cleanSummary(firstSentence);
}

// -------------------------------------------------------------
// 1. Load API Features & Build Lookup Map
// -------------------------------------------------------------
console.log('Loading cached official D&D 5e API features...');
const apiFeatures = JSON.parse(fs.readFileSync(API_CACHE, 'utf8'));
const apiFeatureMap = new Map();

for (const f of apiFeatures) {
  if (f.error) continue;
  const desc = Array.isArray(f.desc) ? f.desc.join('\n\n') : (f.desc || '');
  apiFeatureMap.set(norm(f.name), {
    name: f.name,
    desc: desc,
    level: f.level,
    class: f.class?.name,
    subclass: f.subclass?.name,
    feature_specific: f.feature_specific
  });
}
console.log(`Loaded ${apiFeatureMap.size} unique official SRD features.`);

// -------------------------------------------------------------
// 2. Update Classes EN
// -------------------------------------------------------------
console.log('\n--- Updating 2014 Classes EN ---');
const classesDataEn = JSON.parse(fs.readFileSync(CLASSES_EN, 'utf8'));

let classFeatsUpdated = 0;
for (const cls of classesDataEn.classes) {
  // Update top-level features
  if (cls.features) {
    for (const f of cls.features) {
      const apiF = apiFeatureMap.get(norm(f.name)) || apiFeatureMap.get(norm(cls.name + ' ' + f.name));
      if (apiF && apiF.desc) {
        f.description = apiF.desc;
        classFeatsUpdated++;
      }
      f.summary = createSummary(f.name, f.description, f.summary);
    }
  }

  // Update levels
  if (cls.levels) {
    for (const lvl of cls.levels) {
      if (lvl.features) {
        for (const f of lvl.features) {
          const apiF = apiFeatureMap.get(norm(f.name)) || apiFeatureMap.get(norm(cls.name + ' ' + f.name));
          if (apiF && apiF.desc) {
            f.description = apiF.desc;
            classFeatsUpdated++;
          }
          f.summary = createSummary(f.name, f.description, f.summary);
        }
      }
    }
  }
}
console.log(`Updated ${classFeatsUpdated} class features from official D&D 5e API.`);
fs.writeFileSync(CLASSES_EN, JSON.stringify(classesDataEn, null, 2) + '\n', 'utf8');

// -------------------------------------------------------------
// 3. Complete and Fix Subclasses EN
// -------------------------------------------------------------
console.log('\n--- Updating 2014 Subclasses EN ---');

// Retrieve pristine original subclasses from git to preserve Circle of Dreams & Circle of the Shepherd
const gitSubclassesRaw = execSync('git show HEAD:src/data/en/2014_subclasses.json', { maxBuffer: 15*1024*1024 }).toString();
const gitSubclasses = JSON.parse(gitSubclassesRaw).subclasses;

// Full definitions for the stubbed / missing subclasses
const EXPANSION_SUBCLASSES = [
  // === BARBARIAN ===
  {
    name: "Path of the Beast",
    class: "Barbarian",
    index: "path-of-the-beast",
    book: "TCE",
    description: "Barbarians who walk the Path of the Beast draw their power from a primal animal spark within their souls. When they rage, that spark manifests as a physical transformation, granting them natural weapons and bestial traits in battle.",
    features: [
      {
        name: "Form of the Beast",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        duration: "1 minute (Rage)",
        summary: "Manifest a natural weapon (Bite, Claws, or Tail) when entering rage.",
        description: "When you enter your rage, you can transform, revealing the bestial power within you. Until the rage ends, you manifest a natural weapon. It counts as a simple melee weapon for you, and you add your Strength modifier to the attack and damage rolls when you attack with it. You choose the weapon each time you rage: Bite (1d8 piercing, heal PB hit points once per turn when below half HP), Claws (1d6 slashing, make an additional claw attack once per turn when taking the Attack action), or Tail (1d8 piercing with reach, reaction to add 1d8 to your AC against an attack that would hit you)."
      },
      {
        name: "Bestial Soul",
        level: 6,
        featureType: "Passive",
        actionType: null,
        duration: "Permanent / Short Rest",
        summary: "Natural weapons count as magical; adapt movement with climbing, swimming, or jumping.",
        description: "The feral spirit within you grows stronger, altering your physical form. The natural weapons you manifest with Form of the Beast now count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage. In addition, when you finish a short or long rest, you can choose one of the following benefits until your next rest: Swimming (gain swimming speed equal to walking speed and can breathe underwater), Climbing (gain climbing speed equal to walking speed and climb difficult surfaces without checks), or Jumping (extend your jump distance by rolling an Athletics check and adding the total to the distance in feet)."
      },
      {
        name: "Infectious Fury",
        level: 10,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Curse a creature you strike with natural weapons to deal 2d12 psychic damage or strike an ally.",
        description: "When you hit a creature with your natural weapons while raging, the beast within you can curse your target with rabid fury. The target must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Constitution modifier) or suffer one of the following effects (your choice): the target must use its reaction to make a melee attack against another creature of your choice that you can see, or the target takes 2d12 psychic damage. You can use this feature a number of times equal to your proficiency bonus, regaining all uses upon finishing a long rest."
      },
      {
        name: "Call the Hunt",
        level: 14,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Rally your pack to gain 5 temp HP per ally and grant allies +1d6 damage on attacks.",
        description: "The beast within you grows so powerful that you can spread its ferocity to your companions and be sustained by their presence. When you enter your rage, you can choose a number of willing creatures you can see within 30 feet of you equal to your Constitution modifier (minimum of one). You gain 5 temporary hit points for each creature that accepts this feature. Until the rage ends, the chosen creatures each gain an extra 1d6 damage on their melee weapon damage rolls once per turn. You can use this feature a number of times equal to your proficiency bonus, regaining all uses upon a long rest."
      }
    ]
  },
  {
    name: "Path of Wild Magic",
    class: "Barbarian",
    index: "path-of-wild-magic",
    book: "TCE",
    description: "Many places in the multiverse abound with beauty, intense emotion, and rampant magic; the Feywild and Upper Planes are among them. Barbarians influenced by these realms burst into magical chaos when their rage begins.",
    features: [
      {
        name: "Magic Awareness",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Sense the presence of any spell or magic item within 60 feet.",
        description: "As an action, you can open your awareness to the presence of concentrated magic. Until the end of your next turn, you know the location of any spell or magic item within 60 feet of you that isn't behind total cover. When you sense a spell, you learn its school of magic. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
      },
      {
        name: "Wild Magic Surge",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        duration: "1 minute (Rage)",
        summary: "Roll a d8 on the Wild Magic table upon raging to produce a chaotic magical surge.",
        description: "Magical energy roils inside you. Whenever you enter your rage, roll on the Wild Magic Surge table to determine the magical effect produced: 1: Each creature of your choice within 30 feet takes 1d12 necrotic damage and you gain 1d12 temp HP. 2: Teleport up to 30 feet as a bonus action each turn. 3: Summon an intangible spirit within 30 feet that explodes for 1d6 force damage on hit. 4: A magic light infuses your weapon, dealing +1d6 force damage and gaining the light and thrown properties. 5: Retaliate against attackers with 1d6 force damage when struck. 6: Gain a +1 AC protective aura for yourself and allies within 10 feet. 7: The ground within 15 feet of you turns difficult terrain for enemies. 8: Shoot a beam of radiant light up to 30 feet blinding the target and dealing 1d6 radiant damage."
      },
      {
        name: "Bolstering Presence",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Bolster an ally to give +1d3 on attack rolls/ability checks or restore a 1st-3rd level spell slot.",
        description: "You can harness your wild magic to bolster yourself or a companion. As an action, you can touch a creature (which can be yourself) and confer one of the following benefits: For 10 minutes, the creature can add a 1d3 roll to any attack roll or ability check it makes. Or, roll a 1d3 to restore one expended spell slot to the creature of a level equal to or lower than the rolled number. Once you confer either benefit, you can't do so again until you finish a long rest, unless you expend a use of your rage to do so."
      },
      {
        name: "Unstable Backlash",
        level: 10,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Reroll your Wild Magic Surge table effect when taking damage or failing a saving throw.",
        description: "When you are imperiled during your rage, the magic within you can lash out. Immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and immediately produce the new effect, replacing your current surge effect."
      },
      {
        name: "Controlled Surge",
        level: 14,
        featureType: "Passive",
        summary: "Roll twice on the Wild Magic Surge table and choose which effect manifests.",
        description: "Whenever you roll on the Wild Magic table, you can roll the die twice and choose which of the two effects to produce. If you roll the same number on both dice, you can ignore the number and choose any effect on the table."
      }
    ]
  },

  // === BARD ===
  {
    name: "College of Creation",
    class: "Bard",
    index: "college-of-creation",
    book: "TCE",
    description: "Bards of the College of Creation believe that the cosmos was drawn into existence through the Song of Creation, and that fragments of that primordial music still resound in every particle of matter.",
    features: [
      {
        name: "Mote of Potential",
        level: 3,
        featureType: "Passive",
        summary: "Bardic Inspiration creates a dancing mote of potential granting extra effects on checks, attacks, and saves.",
        description: "Whenever you give a creature a Bardic Inspiration die, you can utter a note from the Song of Creation to create a Tiny mote of potential, which orbits the creature within 5 feet. When the creature uses the die, the mote provides an additional effect: Ability Check (roll twice and pick highest), Attack Roll (explodes with thunder damage equal to inspiration roll to target and creatures within 5 ft), or Saving Throw (gain temp HP equal to the roll plus your Charisma modifier)."
      },
      {
        name: "Performance of Creation",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 2nd+ spell slot" },
        summary: "Magically create one nonmagical item worth up to 20 times your bard level in gold.",
        description: "As an action, you can channel the magic of the Song of Creation to create one nonmagical item of your choice in an unoccupied space within 10 feet of you. The item must be of a size no larger than Medium, and its value can be no more than 20 times your bard level in gp. The item glistens faintly and lasts for a number of hours equal to your proficiency bonus. You can use this feature once per long rest, or by expending a 2nd-level or higher spell slot."
      },
      {
        name: "Animating Performance",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 3rd+ spell slot" },
        summary: "Animate a Large or smaller nonmagical object into a friendly Dancing Item construct.",
        description: "As an action, you can animate one Large or smaller nonmagical item within 30 feet of you. The item uses the Dancing Item stat block, is friendly to you and your companions, and obeys your mental commands as a bonus action. It has an aura of 10 feet that increases ally movement and slows enemies. It remains animated for 1 hour, until reduced to 0 HP, or until you die. You can use this feature once per long rest, or by expending a 3rd-level or higher spell slot."
      },
      {
        name: "Creative Crescendo",
        level: 14,
        featureType: "Passive",
        summary: "Create multiple items with Performance of Creation, with no gold cost limit and up to Huge size.",
        description: "When you use your Performance of Creation feature, you can now create more than one item at a time. The number of items equals your Charisma modifier (minimum of two). One of the items can be Huge, and the gp limit on the items' value no longer applies."
      }
    ]
  },
  {
    name: "College of Eloquence",
    class: "Bard",
    index: "college-of-eloquence",
    book: "TCE",
    description: "Adherents of the College of Eloquence master the art of oratory. Persuasion is elevated to an art form, and their silver tongues can turn foes into friends and unravel the resolve of their adversaries.",
    features: [
      {
        name: "Silver Tongue",
        level: 3,
        featureType: "Passive",
        summary: "Treat any roll of 9 or lower on the d20 as a 10 for Persuasion and Deception checks.",
        description: "You are a master at saying the right thing at the right time. When you make a Charisma (Persuasion) or Charisma (Deception) check, you can treat a d20 roll of 9 or lower as a 10."
      },
      {
        name: "Unsettling Words",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Expend a Bardic Inspiration die to subtract the roll from a target's next saving throw.",
        description: "You can spin words laced with magic that unsettle a creature and cause it to doubt itself. As a bonus action, you can expend one use of your Bardic Inspiration and choose one creature you can see within 60 feet of you. Roll the Bardic Inspiration die. The creature must subtract the number rolled from the next saving throw it makes before the start of your next turn."
      },
      {
        name: "Unfailing Inspiration",
        level: 6,
        featureType: "Passive",
        summary: "A creature does not lose its Bardic Inspiration die if it fails the roll.",
        description: "Your inspiring words are so persuasive that others feel driven to succeed. When a creature adds one of your Bardic Inspiration dice to its ability check, attack roll, or saving throw and the roll fails, the creature can keep the Bardic Inspiration die to use again on a future roll."
      },
      {
        name: "Universal Speech",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / spell slot" },
        summary: "Make your speech completely understandable to any creatures regardless of language.",
        description: "You have gained the ability to make your speech intelligible to any creature. As an action, choose one or more creatures within 60 feet of you, up to a number equal to your Charisma modifier (minimum of one). The chosen creatures can magically understand you, regardless of the language you speak, for 1 hour. You can use this feature once per long rest, or by expending a spell slot."
      },
      {
        name: "Infectious Inspiration",
        level: 14,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Charisma modifier", recharge: "Long Rest" },
        summary: "Inspire another creature without expending a die when an ally succeeds using inspiration.",
        description: "When you successfully inspire someone, the power of your eloquence can spread to someone else. When a creature within 60 feet of you adds one of your Bardic Inspiration dice to its roll and the roll succeeds, you can use your reaction to grant another creature within 60 feet a Bardic Inspiration die without expending any of your Bardic Inspiration uses."
      }
    ]
  },

  // === CLERIC ===
  {
    name: "Twilight Domain",
    class: "Cleric",
    index: "twilight",
    book: "TCE",
    description: "The twilight domain focuses on the transition between daylight and the dark of night, offering comfort and safety to those who must journey through darkness and rest in the shadows.",
    features: [
      {
        name: "Bonus Proficiencies",
        level: 1,
        featureType: "Passive",
        summary: "Gain proficiency with martial weapons and heavy armor.",
        description: "You gain proficiency with martial weapons and heavy armor."
      },
      {
        name: "Eyes of Night",
        level: 1,
        featureType: "Active",
        actionType: "Action",
        summary: "Gain 300 feet of darkvision, and share it with willing creatures for 1 hour.",
        description: "You can see through the deepest gloom. You have darkvision out to a range of 300 feet. In addition, as an action, you can magically share your darkvision with willing creatures you can see within 10 feet of you, up to a number equal to your Wisdom modifier (minimum of one). The shared darkvision lasts for 1 hour, once per long rest, or by expending a spell slot of any level."
      },
      {
        name: "Vigilant Blessing",
        level: 1,
        featureType: "Active",
        actionType: "Action",
        summary: "Grant advantage on the next initiative roll to yourself or a touched creature.",
        description: "The night has taught you to be watchful. As an action, you give one creature you touch (including possibly yourself) advantage on the next initiative roll the creature makes. This benefit ends immediately after the roll or if you use this feature again."
      },
      {
        name: "Twilight Domain Spells",
        level: 1,
        featureType: "Passive",
        summary: "Gain domain spells at levels 1, 3, 5, 7, and 9.",
        description: "You gain domain spells at the cleric levels listed in the Twilight Domain Spells table: 1st: Faerie Fire, Sleep; 3rd: Moonbeam, See Invisibility; 5th: Aura of Vitality, Tiny Hut; 7th: Aura of Life, Greater Invisibility; 9th: Circle of Power, Mislead."
      },
      {
        name: "Channel Divinity: Twilight Sanctuary",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Create a 30-foot sphere of twilight granting 1d6 + cleric level temp HP or ending charm/fear.",
        description: "As an action, you present your holy symbol and utter a twilight prayer. A sphere of twilight emanates from you in a 30-foot radius. The sphere moves with you, is filled with dim light, and lasts for 1 minute or until you are incapacitated. Whenever a creature (including you) ends its turn in the sphere, you can grant that creature 1d6 + your cleric level temporary hit points, or end one effect on it causing it to be charmed or frightened."
      },
      {
        name: "Steps of Night",
        level: 6,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Fly with flying speed equal to your walking speed for 1 minute in dim light or darkness.",
        description: "You draw on the mystical power of twilight to fly through the dark. As a bonus action when you are in dim light or darkness, you can magically give yourself a flying speed equal to your walking speed for 1 minute. You can use this bonus action a number of times equal to your proficiency bonus, regaining all uses on a long rest."
      },
      {
        name: "Divine Strike",
        level: 8,
        featureType: "Passive",
        summary: "Once on each of your turns, deal an extra 1d8 radiant damage on a weapon hit (2d8 at 14th).",
        description: "At 8th level, you gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns when you hit a creature with a weapon attack, you can cause the attack to deal an extra 1d8 radiant damage to the target. When you reach 14th level, the extra damage increases to 2d8."
      },
      {
        name: "Twilight Shroud",
        level: 17,
        featureType: "Passive",
        summary: "Allies inside your Twilight Sanctuary gain the benefits of half cover (+2 AC and Dex saves).",
        description: "The twilight that you summon offers a protective embrace: you and your allies have half cover while in the sphere created by your Twilight Sanctuary feature."
      }
    ]
  },
  {
    name: "Peace Domain",
    class: "Cleric",
    index: "peace",
    book: "TCE",
    description: "The balm of peace thrives at the heart of healthy communities. Clerics of the Peace Domain act as peacemakers, forging bonds between individuals and healing physical and emotional wounds.",
    features: [
      {
        name: "Implement of Peace",
        level: 1,
        featureType: "Passive",
        summary: "Gain proficiency in Insight, Performance, or Persuasion.",
        description: "You gain proficiency in the Insight, Performance, or Persuasion skill (your choice)."
      },
      {
        name: "Emboldening Bond",
        level: 1,
        featureType: "Active",
        actionType: "Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Forge a magical bond between allies, adding 1d4 to one attack, check, or saving throw each turn.",
        description: "You can forge an empowering bond between allies. As an action, you choose a number of willing creatures within 30 feet of you (which can include yourself) equal to your proficiency bonus. For 10 minutes, while any bonded creature is within 30 feet of another, the creature can roll a 1d4 and add the number rolled to an attack roll, ability check, or saving throw it makes once per turn. You can use this feature a number of times equal to your proficiency bonus per long rest."
      },
      {
        name: "Peace Domain Spells",
        level: 1,
        featureType: "Passive",
        summary: "Gain domain spells at levels 1, 3, 5, 7, and 9.",
        description: "You gain domain spells at the cleric levels listed in the Peace Domain Spells table: 1st: Heroism, Sanctuary; 3rd: Aid, Warding Bond; 5th: Beacon of Hope, Sending; 7th: Aura of Purity, Otiluke's Resilient Sphere; 9th: Greater Restoration, Rary's Telepathic Bond."
      },
      {
        name: "Channel Divinity: Balm of Peace",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Move up to your speed without provoking opportunity attacks and heal passed creatures 2d6 + Wis.",
        description: "As an action, you can use your Channel Divinity to move up to your walking speed, without provoking opportunity attacks. When you move within 5 feet of any other creature during this action, you can restore 2d6 + your Wisdom modifier hit points to that creature. A creature can receive this healing only once whenever you take this action."
      },
      {
        name: "Protective Bond",
        level: 6,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Bonded creatures within 30 feet can teleport to take damage in place of one another.",
        description: "The bond you forge between people helps them protect each other. When a creature affected by your Emboldening Bond feature is about to take damage, a second bonded creature within 30 feet of the first can use its reaction to teleport to an unoccupied space within 5 feet of the first creature. The second creature then takes all the damage instead."
      },
      {
        name: "Potent Spellcasting",
        level: 8,
        featureType: "Passive",
        summary: "Add your Wisdom modifier to the damage you deal with any cleric cantrip.",
        description: "Starting at 8th level, you add your Wisdom modifier to the damage you deal with any cleric cantrip."
      },
      {
        name: "Expansive Bond",
        level: 17,
        featureType: "Passive",
        summary: "Protective Bond range increases to 60 feet, and the teleporting creature gains resistance to the damage.",
        description: "The benefits of your Emboldening Bond and Protective Bond features now apply when the creatures are within 60 feet of each other. Moreover, when a creature uses Protective Bond to take someone else's damage, that creature gains resistance to that damage."
      }
    ]
  },
  {
    name: "Order Domain",
    class: "Cleric",
    index: "order",
    book: "TCE",
    description: "The Order Domain represents devotion to discipline, law, and structure. Clerics of Order strive to establish stability, harmony, and righteous command over chaos and wickedness.",
    features: [
      {
        name: "Bonus Proficiencies",
        level: 1,
        featureType: "Passive",
        summary: "Gain proficiency with heavy armor and your choice of Intimidation or Persuasion.",
        description: "You gain proficiency with heavy armor. You also gain proficiency in the Intimidation or Persuasion skill (your choice)."
      },
      {
        name: "Voice of Authority",
        level: 1,
        featureType: "Active",
        actionType: "Reaction",
        summary: "When you cast a 1st-level or higher spell targeting an ally, that ally can make a weapon attack as a reaction.",
        description: "You can invoke the power of law to drive an ally to strike. Whenever you cast a spell of 1st level or higher that targets an ally, you can direct that ally to use its reaction immediately after the spell to make one weapon attack against a creature of your choice that you can see. If the spell targets more than one ally, you choose the ally who can make the attack."
      },
      {
        name: "Order Domain Spells",
        level: 1,
        featureType: "Passive",
        summary: "Gain domain spells at levels 1, 3, 5, 7, and 9.",
        description: "You gain domain spells at the cleric levels listed in the Order Domain Spells table: 1st: Command, Heroism; 3rd: Hold Person, Zone of Truth; 5th: Mass Healing Word, Slow; 7th: Compulsion, Locate Creature; 9th: Commune, Dominate Person."
      },
      {
        name: "Channel Divinity: Order's Demand",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Charm creatures within 30 feet and force them to immediately drop weapons they are holding.",
        description: "As an action, you present your holy symbol, and each creature of your choice that can see or hear you within 30 feet must succeed on a Wisdom saving throw or be charmed by you until the end of your next turn or until it takes damage. You can also cause any of the charmed creatures to drop what they are holding when they fail the saving throw."
      },
      {
        name: "Embodiment of the Law",
        level: 6,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: "Wisdom modifier", recharge: "Long Rest" },
        summary: "Cast an enchantment spell of 1st level or higher with a casting time of 1 action as a bonus action.",
        description: "You have become remarkably adept at channeling order. If you cast a spell of the enchantment school using a spell slot of 1st level or higher, you can change the spell's casting time to 1 bonus action for this casting, provided the spell's normal casting time is 1 action. You can use this feature a number of times equal to your Wisdom modifier per long rest."
      },
      {
        name: "Divine Strike",
        level: 8,
        featureType: "Passive",
        summary: "Once on each of your turns, deal an extra 1d8 psychic damage on a weapon hit (2d8 at 14th).",
        description: "At 8th level, you gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns when you hit a creature with a weapon attack, you can cause the attack to deal an extra 1d8 psychic damage to the target. When you reach 14th level, the extra damage increases to 2d8."
      },
      {
        name: "Order's Wrath",
        level: 17,
        featureType: "Passive",
        summary: "Enemies you strike with Divine Strike take an extra 2d8 psychic damage the next time an ally hits them.",
        description: "Starting at 17th level, enemies you strike are cursed by your divine authority. When you deal your Divine Strike damage to a creature, you curse that creature until the start of your next turn. The next time one of your allies hits the cursed creature with an attack, the target takes an extra 2d8 psychic damage, and the curse ends."
      }
    ]
  },
  {
    name: "Arcana Domain",
    class: "Cleric",
    index: "arcana",
    book: "SCAG",
    description: "Magic is an energy that suffuses the multiverse. Clerics of the Arcana Domain revere the deities of magic, knowing that arcane magic and divine devotion can weave together in sublime mystery.",
    features: [
      {
        name: "Arcane Initiate",
        level: 1,
        featureType: "Passive",
        summary: "Gain proficiency in Arcana and learn two wizard cantrips that count as cleric cantrips.",
        description: "When you choose this domain at 1st level, you gain proficiency in the Arcana skill, and you gain two cantrips of your choice from the wizard spell list. For you, these cantrips count as cleric cantrips."
      },
      {
        name: "Arcana Domain Spells",
        level: 1,
        featureType: "Passive",
        summary: "Gain domain spells at levels 1, 3, 5, 7, and 9.",
        description: "1st: Detect Magic, Magic Missile; 3rd: Magic Weapon, Nondetection; 5th: Dispel Magic, Magic Circle; 7th: Arcane Eye, Leomund's Secret Chest; 9th: Planar Binding, Teleportation Circle."
      },
      {
        name: "Channel Divinity: Arcane Abjuration",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Turn or banish celestial, elemental, fey, or fiend creatures within 30 feet.",
        description: "As an action, you present your holy symbol and one celestial, elemental, fey, or fiend within 30 feet must succeed on a Wisdom save or be turned for 1 minute. Starting at 5th level, turned creatures of low CR are banished to their home plane instead."
      },
      {
        name: "Spell Breaker",
        level: 6,
        featureType: "Passive",
        summary: "When you heal an ally with a spell, end one spell of equal or lower level on that ally.",
        description: "Starting at 6th level, when you restore hit points to an ally with a spell of 1st level or higher, you can also end one spell of your choice on that creature. The level of the spell you end must be equal to or lower than the level of the spell slot you used to cast the healing spell."
      },
      {
        name: "Potent Spellcasting",
        level: 8,
        featureType: "Passive",
        summary: "Add Wisdom modifier to cleric cantrip damage.",
        description: "Starting at 8th level, you add your Wisdom modifier to the damage you deal with any cleric cantrip."
      },
      {
        name: "Arcane Mastery",
        level: 17,
        featureType: "Passive",
        summary: "Learn four wizard spells (one each of 6th, 7th, 8th, and 9th level) as domain spells.",
        description: "At 17th level, you choose four spells from the wizard spell list, one from each of the following levels: 6th, 7th, 8th, and 9th. You add them to your domain spells, always prepared and casting them as cleric spells."
      }
    ]
  },
  {
    name: "Death Domain",
    class: "Cleric",
    index: "death",
    book: "DMG",
    description: "The Death domain is concerned with the forces that cause death, as well as the negative energy that powers undead creatures. Clerics of death are feared necromancers and heralds of finality.",
    features: [
      {
        name: "Bonus Proficiency",
        level: 1,
        featureType: "Passive",
        summary: "Gain proficiency with martial weapons.",
        description: "At 1st level, you gain proficiency with martial weapons."
      },
      {
        name: "Reaper",
        level: 1,
        featureType: "Passive",
        summary: "Target two adjacent creatures with necromancy cantrips that normally target one.",
        description: "At 1st level, when the cleric casts a necromancy cantrip that normally targets only one creature, the spell can instead target two creatures within range and within 5 feet of each other."
      },
      {
        name: "Death Domain Spells",
        level: 1,
        featureType: "Passive",
        summary: "Gain domain spells at levels 1, 3, 5, 7, and 9.",
        description: "1st: False Life, Ray of Sickness; 3rd: Blindness/Deafness, Ray of Enfeeblement; 5th: Animate Dead, Vampiric Touch; 7th: Blight, Death Ward; 9th: Antilife Shell, Cloudkill."
      },
      {
        name: "Channel Divinity: Touch of Death",
        level: 2,
        featureType: "Active",
        actionType: "Free",
        summary: "Add 5 + (2 x cleric level) necrotic damage to a successful melee attack.",
        description: "Starting at 2nd level, when the cleric hits a creature with a melee attack, the cleric can use Channel Divinity to deal extra necrotic damage to the target equal to 5 + twice his or her cleric level."
      },
      {
        name: "Inescapable Destruction",
        level: 6,
        featureType: "Passive",
        summary: "Necrotic damage dealt by your cleric spells and Channel Divinity ignores resistance to necrotic damage.",
        description: "Starting at 6th level, the cleric's ability to channel negative energy becomes more potent. Necrotic damage dealt by the character's cleric spells and Channel Divinity options ignores resistance to necrotic damage."
      },
      {
        name: "Divine Strike",
        level: 8,
        featureType: "Passive",
        summary: "Once on each turn, deal extra 1d8 necrotic damage on a weapon hit (2d8 at 14th).",
        description: "At 8th level, the cleric gains the ability to infuse his or her weapon strikes with necrotic energy. Once on each of the cleric's turns when he or she hits a creature with a weapon attack, the cleric can cause the attack to deal an extra 1d8 necrotic damage. At 14th level, this increases to 2d8."
      },
      {
        name: "Improved Reaper",
        level: 17,
        featureType: "Passive",
        summary: "Target two adjacent creatures with 1st through 5th level necromancy spells.",
        description: "Starting at 17th level, when the cleric casts a necromancy spell of 1st through 5th level that targets only one creature, the spell can instead target two creatures within range and within 5 feet of each other."
      }
    ]
  },

  // === DRUID ===
  {
    name: "Circle of Stars",
    class: "Druid",
    index: "circle-of-stars",
    book: "TCE",
    description: "The Circle of Stars allows druids to draw on the power of starlight. These druids track constellations and map secret connections throughout the cosmos to unleash starry manifestations.",
    features: [
      {
        name: "Star Map",
        level: 2,
        featureType: "Passive",
        summary: "Create a star map focus, learn Guidance cantrip, and cast Guiding Bolt for free PB times per day.",
        description: "You've created a star chart as part of your heavenly studies. You learn the Guidance cantrip. You also have the Guiding Bolt spell prepared, which counts as a druid spell for you and can be cast without expending a spell slot a number of times equal to your proficiency bonus per long rest."
      },
      {
        name: "Starry Form",
        level: 2,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Expending Wild Shape transforms you into a glimmering Starry Form: Archer, Chalice, or Dragon.",
        description: "As a bonus action, you can expend a use of your Wild Shape feature to take on a starry form for 10 minutes: Archer (bonus action ranged spell attack dealing 1d8 + Wis radiant damage), Chalice (healing a creature heals another creature for 1d8 + Wis), or Dragon (treat any roll of 9 or lower on the d20 as a 10 for Concentration saves and Intelligence/Wisdom checks)."
      },
      {
        name: "Cosmic Omen",
        level: 6,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Consult the stars after a rest to roll d6: add 1d6 to an ally's roll (Weal) or subtract 1d6 from an enemy's roll (Woe).",
        description: "Whenever you finish a long rest, you can consult your Star Map for omens. Roll a d6: even is Weal (reaction add 1d6 to an ally's attack, save, or check within 30 ft), odd is Woe (reaction subtract 1d6 from a target's attack, save, or check within 30 ft). You can use this reaction a number of times equal to your proficiency bonus."
      },
      {
        name: "Twinkling Constellations",
        level: 10,
        featureType: "Passive",
        summary: "The constellations of your Starry Form improve to 2d8, and you can switch forms each turn.",
        description: "The constellations of your Starry Form become more potent: Archer and Chalice rolls increase to 2d8 radiant / healing, and Dragon form gives you a flying speed of 20 feet and hover. In addition, at the start of each of your turns while in Starry Form, you can switch which constellation is active."
      },
      {
        name: "Full of Stars",
        level: 14,
        featureType: "Passive",
        summary: "While in Starry Form, you become partially incorporeal with resistance to bludgeoning, piercing, and slashing damage.",
        description: "While in your Starry Form, you become partially incorporeal, giving you resistance to bludgeoning, piercing, and slashing damage."
      }
    ]
  },
  {
    name: "Circle of Wildfire",
    class: "Druid",
    index: "circle-of-wildfire",
    book: "TCE",
    description: "Druids in the Circle of Wildfire understand that destruction is sometimes the precursor to creation, just as a forest fire promotes new growth.",
    features: [
      {
        name: "Circle of Wildfire Spells",
        level: 2,
        featureType: "Passive",
        summary: "Gain wildfire spells at levels 2, 3, 5, 7, and 9.",
        description: "2nd: Burning Hands, Cure Wounds; 3rd: Flaming Sphere, Scorching Ray; 5th: Plant Growth, Revivify; 7th: Aura of Life, Fire Shield; 9th: Flame Strike, Mass Cure Wounds."
      },
      {
        name: "Summon Wildfire Spirit",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Expending a Wild Shape summons a friendly Wildfire Spirit that burns foes and obeys your commands.",
        description: "You can summon the primal spirit bound to your soul. As an action, you can expend one use of your Wild Shape feature to summon your wildfire spirit within 30 feet. Each creature within 10 feet must succeed on a Dex save or take 2d6 fire damage. The spirit takes its turn immediately after yours, attacks with Flame Seed, and can teleport itself and willing allies with Fiery Teleportation."
      },
      {
        name: "Enhanced Bond",
        level: 6,
        featureType: "Passive",
        summary: "Add 1d8 to rolls of spells that deal fire damage or restore hit points when your spirit is present.",
        description: "The bond with your wildfire spirit enhances your destructive and restorative spells. Whenever you cast a spell that deals fire damage or restores hit points while your wildfire spirit is summoned, roll a 1d8 and add the number rolled to one damage or healing roll of the spell."
      },
      {
        name: "Cauterizing Flames",
        level: 10,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Drop spectral flames when a creature dies within 30 feet to heal or damage a creature 2d10 + Wis.",
        description: "You gain the ability to turn death into magical flames that can heal or incinerate. When a Small or larger creature dies within 30 feet of you or your wildfire spirit, a harmless spectral flame springs up in its space. When a creature touches it, you can use your reaction to either restore 2d10 + Wis HP to it or deal 2d10 + Wis fire damage."
      },
      {
        name: "Blazing Revival",
        level: 14,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: 1, recharge: "Long Rest" },
        summary: "When reduced to 0 HP, sacrifice your wildfire spirit to drop to 1 HP and regain half your max HP.",
        description: "If you are reduced to 0 hit points and your wildfire spirit is within 120 feet of you, you can sacrifice the spirit to cause you to drop to 1 hit point instead of 0, and each creature within 10 feet of the sacrificed spirit takes fire damage equal to 2d10 + your Wisdom modifier."
      }
    ]
  },
  {
    name: "Circle of Spores",
    class: "Druid",
    index: "circle-of-spores",
    book: "TCE",
    description: "Druids of the Circle of Spores find beauty in decay. They see within mold, fungi, and spores the ability to transform lifeless matter into abundant, albeit strange, life.",
    features: [
      {
        name: "Circle Spells",
        level: 2,
        featureType: "Passive",
        summary: "Learn Chill Touch and gain circle spells at levels 3, 5, 7, and 9.",
        description: "You gain the Chill Touch cantrip. At 3rd level, Blindness/Deafness, Gentle Repose; 5th: Animate Dead, Gaseous Form; 7th: Blight, Confusion; 9th: Cloudkill, Contagion."
      },
      {
        name: "Halo of Spores",
        level: 2,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Reaction deal 1d4 necrotic damage to a creature starting its turn or moving within 10 feet (scales to 1d8).",
        description: "You are surrounded by invisible, necrotic spores. When a creature you can see starts its turn within 10 feet of you or moves there, you can use your reaction to deal 1d4 necrotic damage to that creature unless it succeeds on a Constitution saving throw. The damage increases to 1d6 at 6th, 1d8 at 10th, and 1d10 at 14th level."
      },
      {
        name: "Symbiotic Entity",
        level: 2,
        featureType: "Active",
        actionType: "Action",
        summary: "Expending Wild Shape grants 4 temp HP per druid level, doubles Halo of Spores damage, and adds 1d6 necrotic to melee hits.",
        description: "As an action, you can expend a use of your Wild Shape feature to awaken your spores. You gain 4 temporary hit points for each level you have in this class. While this feature is active, you roll your Halo of Spores damage die a second time, and your melee weapon attacks deal an extra 1d6 necrotic damage on a hit."
      },
      {
        name: "Fungal Infestation",
        level: 6,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Wisdom modifier", recharge: "Long Rest" },
        summary: "Animate a Small or Medium beast or humanoid that dies within 30 feet as a temporary zombie.",
        description: "Your spores gain the ability to infest a corpse and animate it. When a beast or a humanoid that is Small or Medium dies within 30 feet of you, you can use your reaction to animate that creature with 1 hit point as a zombie under your command for 1 hour."
      },
      {
        name: "Spreading Spores",
        level: 10,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Throw a 10-foot cube of spores up to 30 feet that damages creatures inside with Halo of Spores.",
        description: "As a bonus action while your Symbiotic Entity feature is active, you can hurl spores up to 30 feet away, where they swirl in a 10-foot cube for 1 minute. Any creature that moves into the cube or starts its turn there takes your Halo of Spores damage."
      },
      {
        name: "Fungal Body",
        level: 14,
        featureType: "Passive",
        summary: "Gain immunity to being blinded, deafened, frightened, or poisoned, and critical hits against you become normal hits.",
        description: "The fungal spores in your body alter you: you can't be blinded, deafened, frightened, or poisoned, and any critical hit against you counts as a normal hit instead, unless you're incapacitated."
      }
    ]
  },

  // === FIGHTER ===
  {
    name: "Psi Warrior",
    class: "Fighter",
    index: "psi-warrior",
    book: "TCE",
    description: "Psi Warriors augment their martial might with psionic energy, using mental disciplines to shield allies, propel weapons, and leap through the air.",
    features: [
      {
        name: "Psionic Power",
        level: 3,
        featureType: "Active",
        summary: "Harbor Psionic Energy dice (d6s scaling to d12s) to fuel Protective Field, Psionic Strike, and Telekinetic Movement.",
        description: "You harbor a wellspring of psionic energy within yourself. You have a number of Psionic Energy dice equal to twice your proficiency bonus, which are d6s (scaling to d8 at 5th, d10 at 11th, and d12 at 17th level). You can use your dice for: Protective Field (reaction reduce damage to yourself or an ally within 30 ft by die roll + Int mod), Psionic Strike (deal extra force damage equal to die roll + Int mod on a weapon hit), or Telekinetic Movement (move an object or willing creature up to 30 ft as an action)."
      },
      {
        name: "Telekinetic Leap",
        level: 7,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: 1, recharge: "Short/Long Rest / 1 Psionic Die" },
        summary: "Gain flying speed equal to twice your walking speed until the end of your current turn.",
        description: "As a bonus action, you can propel your body with your mind. You gain a flying speed equal to twice your walking speed until the end of the current turn. Once you take this bonus action, you can't do so again until you finish a short or long rest, unless you expend a Psionic Energy die to take it again."
      },
      {
        name: "Guarded Mind",
        level: 7,
        featureType: "Passive",
        summary: "Gain resistance to psychic damage, and expend a Psionic Energy die to end charmed or frightened.",
        description: "The psionic energy flowing through you has bolstered your mind. You have resistance to psychic damage. Moreover, if you start your turn charmed or frightened, you can expend one Psionic Energy die and immediately end every effect on yourself subjecting you to those conditions."
      },
      {
        name: "Bulwark of Force",
        level: 10,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: 1, recharge: "Long Rest / 1 Psionic Die" },
        summary: "Shield yourself and allies within 30 feet with half cover (+2 AC and Dex saves) for 1 minute.",
        description: "As a bonus action, you can shield yourself and others with telekinetic force. You choose a number of creatures within 30 feet of you equal to your Intelligence modifier (minimum of one), including yourself. For 1 minute or until you are incapacitated, the chosen creatures have half cover. Once you use this feature, you can't do so again until you finish a long rest, unless you expend a Psionic Energy die."
      },
      {
        name: "Telekinetic Master",
        level: 15,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 1 Psionic Die" },
        summary: "Cast Telekinesis without components, and make a weapon attack as a bonus action while concentrating on it.",
        description: "Your ability to move creatures and objects with your mind is unmatched. You can cast the Telekinesis spell without components, using Intelligence as your spellcasting ability. On each turn while you concentrate on the spell, you can make one weapon attack as a bonus action. Once you cast Telekinesis with this feature, you can't do so again until you finish a long rest, unless you expend a Psionic Energy die."
      }
    ]
  },
  {
    name: "Rune Knight",
    class: "Fighter",
    index: "rune-knight",
    book: "TCE",
    description: "Rune Knights discover how to enhance their martial prowess using the runic magic of giants, etching supernatural runes into their arms and armor.",
    features: [
      {
        name: "Bonus Proficiencies",
        level: 3,
        featureType: "Passive",
        summary: "Gain proficiency with smith's tools and learn to speak, read, and write Giant.",
        description: "You gain proficiency with smith's tools, and you learn to speak, read, and write Giant."
      },
      {
        name: "Rune Carver",
        level: 3,
        featureType: "Passive",
        summary: "Inscribe giant runes on equipment to gain passive benefits and activated magical invocations.",
        description: "You can use magic runes to enhance your gear. You learn two runes of your choice (Cloud, Fire, Frost, Stone, Hill, or Storm). Whenever you finish a long rest, you can touch a number of objects equal to the number of runes you know and inscribe a different rune onto each. Each rune grants a passive bonus and can be invoked once per short or long rest for a powerful magical effect."
      },
      {
        name: "Giant's Might",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Grow to Large size, gain advantage on Strength checks and saves, and deal +1d6 damage once per turn.",
        description: "As a bonus action, you magically imbue yourself with the might of giants. For 1 minute: if you are smaller than Large, you become Large along with anything you are wearing; you have advantage on Strength checks and Strength saving throws; and once on each of your turns, one of your weapon attacks or unarmed strikes can deal an extra 1d6 damage to a target on a hit. You can use this feature a number of times equal to your proficiency bonus per long rest."
      },
      {
        name: "Runic Shield",
        level: 7,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Force an attacker within 60 feet who hits an ally to reroll the d20 and take the new roll.",
        description: "You learn to invoke your runic magic to protect your allies. When another creature you can see within 60 feet of you is hit by an attack roll, you can use your reaction to force the attacker to reroll the d20 and use the new roll. You can use this feature a number of times equal to your proficiency bonus per long rest."
      },
      {
        name: "Great Stature",
        level: 10,
        featureType: "Passive",
        summary: "Your height increases by 3d4 inches, and your Giant's Might damage increases to 1d8.",
        description: "The magic of your runes permanently alters you. When you gain this feature, roll 3d4; you grow a number of inches in height equal to the roll. Moreover, the extra damage you deal with your Giant's Might feature increases to 1d8."
      },
      {
        name: "Master of Runes",
        level: 15,
        featureType: "Passive",
        summary: "Invoke each rune you have inscribed twice per short or long rest instead of once.",
        description: "You can invoke each such rune twice, rather than once, and you regain all expended uses when you finish a short or long rest."
      },
      {
        name: "Runic Juggernaut",
        level: 18,
        featureType: "Passive",
        summary: "Giant's Might allows you to grow to Huge size, reach increases by 5 feet, and extra damage becomes 1d10.",
        description: "You learn how to amplify your rune-powered transformation. As a result, the extra damage you deal with the Giant's Might feature increases to 1d10. Moreover, when you use that feature, your size can increase to Huge, and while you are that size, your reach increases by 5 feet."
      }
    ]
  },

  // === MONK ===
  {
    name: "Way of the Four Elements",
    class: "Monk",
    index: "four-elements",
    book: "PHB",
    description: "You follow a monastic tradition that teaches you to harness the elements. When you focus your ki, you can align yourself with the forces of creation and bend the four elements to your will.",
    features: [
      {
        name: "Disciple of the Elements",
        level: 3,
        featureType: "Active",
        summary: "Learn magical disciplines that harness earth, air, fire, and water by spending ki points.",
        description: "You learn magical disciplines that harness the power of the four elements. A discipline requires you to spend ki points each time you use it. You know the Elemental Attunement discipline and one other elemental discipline of your choice. You learn one additional elemental discipline of your choice at 6th, 11th, and 17th level."
      },
      {
        name: "Elemental Attunement",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Produce minor harmless elemental effects, create sparks, cool or warm objects, or shape mist.",
        description: "You can use your action to briefly control elemental forces nearby: create harmless sensory effects like showers of sparks, puff of wind, or mist; light or snuff a candle or campfire; chill or warm up to 1 pound of nonliving material; or shape earth, fire, water, or mist into crude shapes for 1 minute."
      },
      {
        name: "Fangs of the Fire Snake",
        level: 3,
        featureType: "Active",
        summary: "Spend 1 ki to extend unarmed strike reach by 10 ft and deal fire damage; spend extra ki for +1d10 fire.",
        description: "When you use the Attack action on your turn, you can spend 1 ki point to cause tendrils of flame to stretch out from your fists and feet. Your reach with your unarmed strikes increases by 10 feet for that action, as well as the rest of the turn. A hit with such an attack deals fire damage instead of bludgeoning damage, and if you spend 1 additional ki point when the attack hits, it deals an extra 1d10 fire damage."
      },
      {
        name: "Water Whip",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 2 ki to create a water whip dealing 3d10 bludgeoning and pulling the target 25 ft or knocking prone.",
        description: "You can spend 2 ki points as an action to create a whip of water that shoves and pulls a creature to unbalance it. A creature that you can see that is within 30 feet of you must make a Dexterity saving throw. On a failed save, it takes 3d10 bludgeoning damage plus an extra 1d10 for each additional ki point spent, and you can either knock it prone or pull it up to 25 feet closer to you."
      },
      {
        name: "Fist of Four Thunders",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 2 ki points to cast Thunderwave.",
        description: "You can spend 2 ki points to cast Thunderwave."
      },
      {
        name: "Sweeping Cinder Strike",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 2 ki points to cast Burning Hands.",
        description: "You can spend 2 ki points to cast Burning Hands."
      },
      {
        name: "Gong of the Summit",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 3 ki points to cast Shatter.",
        description: "You can spend 3 ki points to cast Shatter."
      },
      {
        name: "Flames of the Phoenix",
        level: 11,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 4 ki points to cast Fireball.",
        description: "You can spend 4 ki points to cast Fireball."
      },
      {
        name: "Ride the Wind",
        level: 11,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 4 ki points to cast Fly on yourself.",
        description: "You can spend 4 ki points to cast Fly, targeting yourself."
      },
      {
        name: "River of Hungry Flame",
        level: 17,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 5 ki points to cast Wall of Fire.",
        description: "You can spend 5 ki points to cast Wall of Fire."
      }
    ]
  },
  {
    name: "Way of Mercy",
    class: "Monk",
    index: "way-of-mercy",
    book: "TCE",
    description: "Monks of the Way of Mercy learn to manipulate the life force of others to bring aid to those in need. They are wandering physicians and harbingers of swift death to those beyond saving.",
    features: [
      {
        name: "Implements of Mercy",
        level: 3,
        featureType: "Passive",
        summary: "Gain proficiency in Insight, Medicine, and the herbalism kit, and craft a unique mercy mask.",
        description: "You gain proficiency in the Insight and Medicine skills, and you gain proficiency with the herbalism kit. You also gain a special mask, which you often wear when conducting your work."
      },
      {
        name: "Hands of Healing",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 1 ki to touch a creature and heal hit points equal to your Martial Arts die + Wis modifier.",
        description: "Your mystical touch can mend wounds. As an action, you can spend 1 ki point to touch a creature and restore a number of hit points equal to a roll of your Martial Arts die + your Wisdom modifier. When you use your Flurry of Blows, you can replace one of the unarmed strikes with a use of this feature without spending its ki point."
      },
      {
        name: "Hands of Harm",
        level: 3,
        featureType: "Active",
        summary: "Spend 1 ki when hitting with an unarmed strike to deal extra necrotic damage equal to Martial Arts die + Wis.",
        description: "You can use your ki to inflict wounds. When you hit a creature with an unarmed strike, you can spend 1 ki point to deal extra necrotic damage equal to one roll of your Martial Arts die + your Wisdom modifier. You can use this feature only once per turn."
      },
      {
        name: "Physician's Touch",
        level: 6,
        featureType: "Passive",
        summary: "Hands of Healing cures disease, blindness, paralysis, or poisoned; Hands of Harm poisons the target without a save.",
        description: "Starting at 6th level, you can administer even greater medical aid with your touch. When you use Hands of Healing, you can also end one disease or one condition afflicting the target: blinded, deafened, paralyzed, poisoned, or stunned. When you use Hands of Harm on a creature, you can subject that creature to the poisoned condition until the end of your next turn."
      },
      {
        name: "Flurry of Healing and Harm",
        level: 11,
        featureType: "Passive",
        summary: "When you use Flurry of Blows, you can replace both attacks with Hands of Healing without spending extra ki.",
        description: "Starting at 11th level, you can now use Hands of Healing to heal a creature with both of the unarmed strikes granted by your Flurry of Blows, without spending extra ki points. In addition, when you make an unarmed strike with Flurry of Blows, you can use Hands of Harm with that strike without spending the ki point for Hands of Harm."
      },
      {
        name: "Hand of Ultimate Mercy",
        level: 17,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 5 Ki" },
        summary: "Touch a creature that died within 24 hours and spend 5 ki points to return it to life with 4d10 + Wis HP.",
        description: "Your mastery of life energy opens the door to the ultimate mercy. As an action, you can touch the corpse of a creature that died within the past 24 hours and expend 5 ki points. The creature returns to life, regaining a number of hit points equal to 4d10 + your Wisdom modifier. If the creature died while subject to any of the following conditions, it revives with those conditions removed: blinded, deafened, paralyzed, poisoned, and stunned. Once you use this feature, you can't use it again until you finish a long rest."
      }
    ]
  },
  {
    name: "Way of the Astral Self",
    class: "Monk",
    index: "way-of-the-astral-self",
    book: "TCE",
    description: "A monk who follows the Way of the Astral Self believes their body is an illusion. They see their ki as a representation of their true form: the astral self.",
    features: [
      {
        name: "Arms of the Astral Self",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Spend 1 ki to summon spectral astral arms dealing force damage with Wisdom for attacks/checks.",
        description: "Your ki allows you to manifest spectral arms. As a bonus action, you can spend 1 ki point to summon the arms of your astral self for 10 minutes. Each creature within 10 feet must succeed on a Dex save or take 2x your Martial Arts die in force damage. While active, you can use Wisdom modifier in place of Strength for checks and saves, your unarmed strike reach increases by 5 feet, and your unarmed strikes deal force damage using Wisdom."
      },
      {
        name: "Visage of the Astral Self",
        level: 6,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Spend 1 ki to manifest an astral mask gaining darkvision through magical darkness, Insight/Intimidation advantage, and whisper projection.",
        description: "You can summon the spectral visage of your astral self. As a bonus action, or as part of summoning your arms, you spend 1 ki point to manifest your visage for 10 minutes. You gain Astral Sight (see in normal and magical darkness out to 120 ft), Wisdom of the Spirit (advantage on Insight and Intimidation checks), and Word of the Astral Self (project your voice to whisper up to 600 ft or boom 3x loud)."
      },
      {
        name: "Body of the Astral Self",
        level: 11,
        featureType: "Passive",
        summary: "Manifest astral armor: deflect elemental damage as a reaction, and make 3 attacks with Flurry of Blows.",
        description: "When you have both your astral arms and visage active, you can manifest the complete body of your astral self. You gain: Deflect Energy (reaction reduce acid, cold, fire, force, lightning, or thunder damage by 1d10 + Wis mod) and Empowered Arms (once on each of your turns when you hit with your astral arms, deal extra damage equal to your Martial Arts die)."
      },
      {
        name: "Awakened Astral Self",
        level: 17,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Spend 5 ki to summon your full astral form: +2 AC, 3 attacks per Extra Attack, and crushing force.",
        description: "You can awaken the full power of your astral self. As a bonus action, you can spend 5 ki points to summon your arms, visage, and body simultaneously for 10 minutes. While active: you gain a +2 bonus to AC, you can make three attacks instead of two whenever you take the Attack action with your astral arms, and when you hit a target you can deal extra force damage."
      }
    ]
  },
  {
    name: "Way of the Long Death",
    class: "Monk",
    index: "way-of-the-long-death",
    book: "SCAG",
    description: "Monks of the Way of the Long Death obsess over the meaning and mechanics of dying. They study creatures as they die and record the exact moment when the soul leaves the body.",
    features: [
      {
        name: "Touch of Death",
        level: 3,
        featureType: "Passive",
        summary: "Gain temporary hit points equal to Wisdom modifier + monk level when reducing a creature within 5 ft to 0 HP.",
        description: "Your study of death allows you to extract vitality from dying creatures. When you reduce a creature within 5 feet of you to 0 hit points, you gain temporary hit points equal to your Wisdom modifier + your monk level (minimum 1)."
      },
      {
        name: "Hour of Reaping",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        summary: "Frighten all creatures within 30 feet that can see you on a failed Wisdom saving throw.",
        description: "As an action, you unleash the macabre presence of death. Each creature within 30 feet of you that can see you must succeed on a Wisdom saving throw or be frightened of you until the end of your next turn."
      },
      {
        name: "Mastery of Death",
        level: 11,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Spend 1 ki point when reduced to 0 hit points to drop to 1 hit point instead.",
        description: "Beginning at 11th level, you use your familiarity with death to escape its grasp. When you are reduced to 0 hit points, you can expend 1 ki point (no action required) to have 1 hit point instead."
      },
      {
        name: "Touch of the Long Death",
        level: 17,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 1 to 10 ki points on a touched creature to deal 2d10 necrotic damage per ki point spent.",
        description: "Your touch channels the pure energy of death. As an action, you touch one creature within 5 feet of you and expend 1 to 10 ki points. The target must make a Constitution saving throw, taking 2d10 necrotic damage per ki point spent on a failure, or half as much on a success."
      }
    ]
  },

  // === PALADIN ===
  {
    name: "Oath of Glory",
    class: "Paladin",
    index: "oath-of-glory",
    book: "TCE",
    description: "Paladins who take the Oath of Glory believe they and their companions are destined to achieve heroic glory through acts of courage, discipline, and deeds written in legend.",
    features: [
      {
        name: "Oath Spells",
        level: 3,
        featureType: "Passive",
        summary: "Gain oath spells at levels 3, 5, 9, 13, and 17.",
        description: "3rd: Guiding Bolt, Heroism; 5th: Enhance Ability, Magic Weapon; 9th: Haste, Protection from Energy; 13th: Compulsion, Freedom of Movement; 17th: Commune, Flame Strike."
      },
      {
        name: "Channel Divinity: Peerless Athlete",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Gain advantage on Athletics/Acrobatics checks, double carry weight, and jump distance +10 ft for 10 minutes.",
        description: "As a bonus action, you can use your Channel Divinity to augment your athleticism. For 10 minutes, you have advantage on Strength (Athletics) and Dexterity (Acrobatics) checks; you can carry, push, drag, and lift twice as much weight; and your jump distance increases by 10 feet."
      },
      {
        name: "Channel Divinity: Inspiring Smite",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Distribute 2d8 + paladin level temporary hit points to allies within 30 feet after using Divine Smite.",
        description: "Immediately after you deal damage to a creature with your Divine Smite feature, you can use your Channel Divinity as a bonus action to distribute temporary hit points to creatures of your choice within 30 feet of you (including yourself) equal to 2d8 + your paladin level, divided among them as you choose."
      },
      {
        name: "Aura of Alacrity",
        level: 7,
        featureType: "Passive",
        summary: "Your walking speed increases by 10 feet, and allies starting their turn within 5 feet (10 ft at 18th) gain +10 ft speed.",
        description: "You exude an aura that fills you and your companions with vigor. Your walking speed increases by 10 feet. In addition, that of each ally within 5 feet of you increases by 10 feet until the end of their next turn. At 18th level, the range of this aura increases to 10 feet."
      },
      {
        name: "Glorious Defense",
        level: 15,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Charisma modifier", recharge: "Long Rest" },
        summary: "Reaction add your Charisma modifier to an ally's AC; if attack misses, make a weapon attack against the attacker.",
        description: "You can turn defense into attack. When you or another creature you can see within 10 feet of you is hit by an attack roll, you can use your reaction to grant a bonus to the target's AC against that attack equal to your Charisma modifier (minimum of +1). If the attack misses, you can immediately make one weapon attack against the attacker as part of this reaction, provided the attacker is within your weapon's range."
      },
      {
        name: "Living Legend",
        level: 20,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: 1, recharge: "Long Rest / 5th spell slot" },
        summary: "Transform into a legendary hero for 1 minute: advantage on Charisma checks, reroll missed attacks, reaction spell save advantage.",
        description: "You can empower yourself with the legends of your destiny. As a bonus action, you gain the following benefits for 1 minute: you are blessed with an otherworldly presence, gaining advantage on all Charisma checks; once on each of your turns when you make a weapon attack and miss, you can cause that attack to hit instead; and if you fail a saving throw, you can use your reaction to reroll it."
      }
    ]
  },
  {
    name: "Oath of the Crown",
    class: "Paladin",
    index: "oath-of-the-crown",
    book: "SCAG",
    description: "The Oath of the Crown is sworn to the ideals of civilization, the law, and the preservation of an established sovereign realm.",
    features: [
      {
        name: "Oath Spells",
        level: 3,
        featureType: "Passive",
        summary: "Gain oath spells at levels 3, 5, 9, 13, and 17.",
        description: "3rd: Command, Compelled Duel; 5th: Warding Bond, Zone of Truth; 9th: Aura of Vitality, Spirit Guardians; 13th: Banishment, Guardian of Faith; 17th: Circle of Power, Geas."
      },
      {
        name: "Channel Divinity: Champion Challenge",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Force hostile creatures within 30 feet to stay within 30 feet of you on a failed Wisdom saving throw.",
        description: "As a bonus action, you issue a challenge that compels other creatures to do battle with you. Each creature of your choice that you can see within 30 feet of you must make a Wisdom saving throw. On a failed save, a creature can't willingly move more than 30 feet away from you."
      },
      {
        name: "Channel Divinity: Turn the Tide",
        level: 3,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Restore 1d6 + Cha mod hit points to allies within 30 feet that have no more than half their max HP.",
        description: "As a bonus action, you can bolster injured creatures with your Channel Divinity. Each creature of your choice within 30 feet of you that can hear you and has no more than half its hit points regains hit points equal to 1d6 + your Charisma modifier (minimum 1)."
      },
      {
        name: "Divine Allegiance",
        level: 7,
        featureType: "Active",
        actionType: "Reaction",
        summary: "When an ally within 5 feet takes damage, use your reaction to magically take that damage instead.",
        description: "Starting at 7th level, when a creature within 5 feet of you takes damage, you can use your reaction to magically substitute your own health for that of the target creature, taking that damage in its place. This damage to you cannot be reduced or prevented in any way."
      },
      {
        name: "Unyielding Saint",
        level: 15,
        featureType: "Passive",
        summary: "Gain advantage on saving throws to avoid being paralyzed or stunned.",
        description: "Beginning at 15th level, you have advantage on saving throws to avoid becoming paralyzed or stunned."
      },
      {
        name: "Exalted Champion",
        level: 20,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest" },
        summary: "For 1 hour: resistance to nonmagical weapon damage, allies within 30 ft have advantage on death and Wisdom saves.",
        description: "At 20th level, your presence on the battlefield becomes an inspiration to your allies. As an action, you gain the following benefits for 1 hour: resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons; your allies within 30 feet have advantage on death saving throws; and you and your allies within 30 feet have advantage on Wisdom saving throws."
      }
    ]
  },
  {
    name: "Oathbreaker",
    class: "Paladin",
    index: "oathbreaker",
    book: "DMG",
    description: "An Oathbreaker is a paladin who has broken their sacred vows to pursue a dark ambition or serve a fiendish power. Only malice and dark magic remain where virtue once stood.",
    features: [
      {
        name: "Oathbreaker Spells",
        level: 3,
        featureType: "Passive",
        summary: "Gain dark oathbreaker spells at levels 3, 5, 9, 13, and 17.",
        description: "3rd: Hellish Rebuke, Inflict Wounds; 5th: Crown of Madness, Darkness; 9th: Animate Dead, Bestow Curse; 13th: Blight, Confusion; 17th: Contagion, Dominate Person."
      },
      {
        name: "Channel Divinity: Control Undead",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Take control of an undead creature within 30 feet with CR lower than your paladin level for 24 hours.",
        description: "As an action, you target one undead creature you can see within 30 feet. The target must make a Wisdom saving throw. On a failed save, the target must obey your commands for the next 24 hours, or until you use this Channel Divinity option again. An undead whose challenge rating is equal to or greater than your paladin level is immune."
      },
      {
        name: "Channel Divinity: Dreadful Aspect",
        level: 3,
        featureType: "Active",
        actionType: "Action",
        summary: "Frighten all hostile creatures within 30 feet for 1 minute on a failed Wisdom saving throw.",
        description: "As an action, the paladin channels the darkest emotions and focuses them into a burst of magical menace. Each creature of the paladin's choice within 30 feet must make a Wisdom saving throw if it can see the paladin. On a failed save, the target is frightened of the paladin for 1 minute."
      },
      {
        name: "Aura of Hate",
        level: 7,
        featureType: "Passive",
        summary: "Add your Charisma modifier to melee weapon damage rolls for yourself and friendly fiends/undead within 10 ft.",
        description: "Starting at 7th level, the paladin, as well as any fiends and undead within 10 feet of the paladin, gains a bonus to melee weapon damage rolls equal to the paladin's Charisma modifier (minimum of +1). At 18th level, the range increases to 30 feet."
      },
      {
        name: "Supernatural Resistance",
        level: 15,
        featureType: "Passive",
        summary: "Gain resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.",
        description: "At 15th level, the paladin gains resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons."
      },
      {
        name: "Dread Lord",
        level: 20,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest" },
        summary: "Transform into an avatar of darkness for 1 minute: 30 ft gloomy aura, 4d10 psychic damage, bonus action shadow attack.",
        description: "At 20th level, the paladin can surround himself or herself with an aura of gloom for 1 minute. The aura sheds dim light in a 30-foot radius. Enemies in the aura take 4d10 psychic damage at the start of their turns if frightened, and the paladin can use a bonus action to make a melee spell attack dealing 3d10 + Cha necrotic damage."
      }
    ]
  },

  // === RANGER ===
  {
    name: "Gloom Stalker",
    class: "Ranger",
    index: "gloom-stalker",
    book: "XGE",
    description: "Gloom Stalkers are at home in the darkest places: deep under the earth, in shadowy alleyways, and in primeval forests. They master the shadows to ambush threats before enemies even know they are there.",
    features: [
      {
        name: "Gloom Stalker Magic",
        level: 3,
        featureType: "Passive",
        summary: "Gain additional spells at levels 3, 5, 9, 13, and 17.",
        description: "3rd: Disguise Self; 5th: Rope Trick; 9th: Fear; 13th: Greater Invisibility; 17th: Seeming."
      },
      {
        name: "Dread Ambusher",
        level: 3,
        featureType: "Passive",
        summary: "Add Wisdom modifier to initiative, gain +10 ft speed on your first turn, and make an extra attack dealing +1d8 damage.",
        description: "At 3rd level, you master the art of the ambush. You can give yourself a bonus to your initiative rolls equal to your Wisdom modifier. At the start of your first turn of each combat, your walking speed increases by 10 feet, which lasts until the end of that turn. If you take the Attack action on that turn, you can make one additional weapon attack as part of that action. If that attack hits, the target takes an extra 1d8 damage of the weapon's damage type."
      },
      {
        name: "Umbral Sight",
        level: 3,
        featureType: "Passive",
        summary: "Gain 60 ft darkvision (or +30 ft), and become completely invisible to any creature relying on darkvision in darkness.",
        description: "At 3rd level, you gain darkvision out to a range of 60 feet. If you already have darkvision from your race, its range increases by 30 feet. You are also adept at evading creatures that rely on darkvision. While in darkness, you are invisible to any creature that relies on darkvision to see you in that darkness."
      },
      {
        name: "Iron Mind",
        level: 7,
        featureType: "Passive",
        summary: "Gain proficiency in Wisdom saving throws (or Intelligence or Charisma if you already have it).",
        description: "By 7th level, you have honed your ability to resist the mind-altering powers of your prey. You gain proficiency in Wisdom saving throws. If you already have this proficiency, you instead gain proficiency in Intelligence or Charisma saving throws (your choice)."
      },
      {
        name: "Stalker's Flurry",
        level: 11,
        featureType: "Passive",
        summary: "Once on each of your turns when you miss with a weapon attack, make another weapon attack as part of the same action.",
        description: "At 11th level, you learn to attack with such rapid speed that you can turn a miss into another strike. Once on each of your turns when you miss with a weapon attack, you can make another weapon attack as part of the same action."
      },
      {
        name: "Shadowy Dodge",
        level: 15,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Impose disadvantage on an attack roll against you as a reaction unless the attacker has advantage.",
        description: "Starting at 15th level, you can dodge in unforeseen ways, with wisps of supernatural shadow around you. Whenever a creature makes an attack roll against you and doesn't have advantage on the roll, you can use your reaction to impose disadvantage on it."
      }
    ]
  },

  // === ROGUE ===
  {
    name: "Soulknife",
    class: "Rogue",
    index: "soulknife",
    book: "TCE",
    description: "Soulknives strike and infiltrate with the power of their minds. They manifest blades of shimmering psychic energy from their hands to execute stealthy assassinations and bridge thoughts with allies.",
    features: [
      {
        name: "Psionic Power",
        level: 3,
        featureType: "Active",
        summary: "Harbor Psionic Energy dice (d6s scaling to d12s) to fuel Psi-Bolstered Knack and Psychic Whispers.",
        description: "You harbor a wellspring of psionic energy within yourself, represented by your Psionic Energy dice (twice your proficiency bonus in d6s, scaling to d8 at 5th, d10 at 11th, and d12 at 17th level). You can use your dice for: Psi-Bolstered Knack (add the die to a failed ability check using a proficient skill; if it still fails, the die is not expended) and Psychic Whispers (telepathically connect with allies within 1 mile for hours equal to the die roll)."
      },
      {
        name: "Psychic Blades",
        level: 3,
        featureType: "Active",
        actionType: "Action / Bonus Action",
        summary: "Manifest shimmering blades of psychic energy dealing 1d6 psychic damage, with a 1d4 bonus action offhand strike.",
        description: "You can manifest your psionic power as shimmering blades of psychic energy. Whenever you take the Attack action, you can manifest a psychic blade from your free hand and make the attack with that blade. It is a simple melee weapon with the finesse and thrown properties (range 60 ft). It deals 1d6 psychic damage on a hit. If you attack with a blade, you can use a bonus action to make a second psychic blade attack with your other hand, dealing 1d4 psychic damage."
      },
      {
        name: "Soul Blades",
        level: 9,
        featureType: "Active",
        summary: "Expend Psionic Energy dice to boost missed psychic blade attack rolls or teleport up to 10x the roll in feet.",
        description: "You can weave your psychic blades with your psionic power in two new ways: Homing Strikes (if you miss with a psychic blade, add a Psionic Energy die to the attack roll; die is expended only if the attack hits) and Psychic Teleportation (bonus action throw a blade up to 10 times the number rolled on a Psionic Energy die in feet and teleport to that unoccupied space)."
      },
      {
        name: "Psychic Veil",
        level: 13,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 1 Psionic Die" },
        summary: "Become completely invisible for 1 hour as an action; ends if you deal damage or force a saving throw.",
        description: "You can weave a veil of psychic static to mask your physical presence. As an action, you can magically become invisible, along with anything you are wearing or carrying, for 1 hour or until you dismiss this effect. The invisibility ends early immediately after you deal damage to a creature or you force a creature to make a saving throw. You can use this once per long rest, or by expending a Psionic Energy die."
      },
      {
        name: "Rend Mind",
        level: 17,
        featureType: "Active",
        uses: { total: 1, recharge: "Long Rest / 3 Psionic Dice" },
        summary: "When you deal Sneak Attack damage with a psychic blade, force a Wisdom save or stun the target for 1 minute.",
        description: "You can sweep your psychic blade directly through a creature's mind. When you use your Psychic Blades to deal Sneak Attack damage to a creature, you can force that target to make a Wisdom saving throw (DC 8 + proficiency bonus + Dexterity modifier). If the save fails, the target is stunned for 1 minute. The stunned target can repeat the save at the end of each of its turns, ending the effect on itself on a success."
      }
    ]
  },
  {
    name: "Phantom",
    class: "Rogue",
    index: "phantom",
    book: "TCE",
    description: "Many rogues walk a fine line between life and death. Phantoms embrace that connection, drawing on the knowledge and whispers of spirits to walk between worlds.",
    features: [
      {
        name: "Whispers of the Dead",
        level: 3,
        featureType: "Active",
        summary: "Echoes of the dead grant you proficiency in one skill or tool of your choice each short or long rest.",
        description: "Echoes of those who have died begin to cling to you. Whenever you finish a short or long rest, you can choose one skill or tool proficiency that you lack and gain it, as a ghostly presence shares its knowledge with you. You lose this proficiency when you use this feature to choose a different proficiency."
      },
      {
        name: "Wails from the Grave",
        level: 3,
        featureType: "Active",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "When you deal Sneak Attack damage, deal half your Sneak Attack dice in necrotic damage to a second creature within 30 ft.",
        description: "As you nudge someone closer to the grave, you can channel the wails of departed spirits. Immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature that you can see within 30 feet of the first creature. Roll half the number of Sneak Attack dice for your level (round up), and the second creature takes necrotic damage equal to the roll's total."
      },
      {
        name: "Tokens of the Departed",
        level: 9,
        featureType: "Active",
        actionType: "Reaction",
        summary: "Snatch the soul of a dying creature within 30 ft into a Soul Trinket granting advantage on Death and Con saves.",
        description: "When a creature dies within 30 feet of you, you can use your reaction to capture its soul into a tiny trinket called a soul trinket (max up to your proficiency bonus). While carrying a soul trinket, you have advantage on death saving throws and Constitution saving throws. You can destroy a trinket to ask the spirit a question or use Wails from the Grave without expending a use."
      },
      {
        name: "Ghost Walk",
        level: 13,
        featureType: "Active",
        actionType: "Bonus Action",
        summary: "Transform into a ghostly form for 10 minutes: 10 ft flying speed, disadvantage on attacks against you, and pass through solid objects.",
        description: "You can phase, at least partially, into the realm of the dead. As a bonus action, you assume a spectral form for 10 minutes (or until dismissed). You gain a flying speed of 10 feet and can hover; attack rolls against you have disadvantage; and you can move through creatures and solid objects as if they were difficult terrain."
      },
      {
        name: "Death's Friend",
        level: 17,
        featureType: "Passive",
        summary: "Wails from the Grave deals damage to both targets, and gain a free soul trinket at the end of a long rest.",
        description: "Your association with death reaches its peak: when you use your Wails from the Grave, you can now deal the necrotic damage to both the first and the second creature. In addition, whenever you finish a long rest, a soul trinket appears in your hand if you don't already have one."
      }
    ]
  },

  // === SORCERER ===
  {
    name: "Clockwork Soul",
    class: "Sorcerer",
    index: "clockwork-soul",
    book: "TCE",
    description: "The cosmic power of Mechanus and the clockwork gears of order infuse your soul. You weave magic that corrects balance, removes advantage and disadvantage, and protects reality from chaos.",
    features: [
      {
        name: "Clockwork Magic",
        level: 1,
        featureType: "Passive",
        summary: "Learn additional order and abjuration spells at levels 1, 3, 5, 7, and 9.",
        description: "1st: Alarm, Protection from Evil and Good; 3rd: Aid, Lesser Restoration; 5th: Dispel Magic, Protection from Energy; 7th: Freedom of Movement, Summon Construct; 9th: Greater Restoration, Wall of Force. You can replace these with abjuration or transmutation spells from the sorcerer, warlock, or wizard spell lists."
      },
      {
        name: "Restore Balance",
        level: 1,
        featureType: "Active",
        actionType: "Reaction",
        uses: { total: "Proficiency Bonus", recharge: "Long Rest" },
        summary: "Reaction cancel advantage or disadvantage on a d20 roll for a creature within 60 feet.",
        description: "Your connection to the plane of absolute law allows you to equalize chaotic fluctuations. When a creature you can see within 60 feet of you is about to roll a d20 with advantage or disadvantage, you can use your reaction to prevent the roll from being affected by advantage and disadvantage."
      },
      {
        name: "Bastion of Law",
        level: 6,
        featureType: "Active",
        actionType: "Action",
        summary: "Spend 1 to 5 sorcery points to create a protective ward of d8s that reduces incoming damage.",
        description: "You can imbue a creature with a shimmering shield of order. As an action, you can expend 1 to 5 sorcery points to create a magical ward around yourself or another creature you can see within 30 feet of you. The ward has a number of d8s equal to the sorcery points spent. When the warded creature takes damage, it can expend a number of those dice, roll them, and reduce the damage taken by the total rolled."
      },
      {
        name: "Trance of Order",
        level: 14,
        featureType: "Active",
        actionType: "Bonus Action",
        uses: { total: 1, recharge: "Long Rest / 5 Sorcery Points" },
        summary: "Enter a clockwork trance for 1 minute: attacks against you can't have advantage, and attack/check/save d20 rolls of 9 or lower count as 10.",
        description: "As a bonus action, you can enter a state of clockwork perfection for 1 minute. Attack rolls against you can't benefit from advantage, and whenever you make an attack roll, an ability check, or a saving throw, you can treat a roll of 9 or lower on the d20 as a 10."
      },
      {
        name: "Clockwork Cavalcade",
        level: 18,
        featureType: "Active",
        actionType: "Action",
        uses: { total: 1, recharge: "Long Rest / 7 Sorcery Points" },
        summary: "Summon a 30-foot cube of clockwork spirits: restore up to 100 HP, repair broken objects, and end 6th level or lower spells.",
        description: "You summon a procession of spirits of order to restore balance. As an action, you summon spirits in a 30-foot cube originating from you: the spirits restore up to 100 hit points, divided as you choose among any number of creatures in the cube; damaged objects in the cube are instantly repaired; and any spells of 6th level or lower on creatures and objects in the cube end."
      }
    ]
  }
];

// Exact set of stub names to prune
const PRUNE_NAMES = new Set([
  'dreams', // Prune the 1-feature "Dreams" stub, keep "Circle of Dreams"
  'shepherd', // Prune the 1-feature "Shepherd" stub, keep "Circle of the Shepherd"
  'college-of-satire',
  'college of satire',
  'four elements', // Prune the 1-feature "Four Elements" stub, keep "Way of the Four Elements"
  'twilight', // Prune the 1-feature "Twilight" stub, keep "Twilight Domain"
  'peace', // Prune the 1-feature "Peace" stub, keep "Peace Domain"
  'order', // Prune the 1-feature "Order" stub, keep "Order Domain"
  'redemption' // Prune the redundant "Redemption" stub, keep "Oath of Redemption"
]);

// Filter pristine original git subclasses
let finalSubclasses = [];
for (const s of gitSubclasses) {
  const lowerName = (s.name || '').toLowerCase().trim();
  const lowerIdx = (s.index || '').toLowerCase().trim();

  // If this is a known stub to prune, skip it
  if (PRUNE_NAMES.has(lowerName) || (lowerName === 'dreams' && (s.features || []).length <= 1) || (lowerName === 'shepherd' && (s.features || []).length <= 1) || (lowerName === 'clockwork soul' && (s.features || []).length <= 1)) {
    console.log(`Pruning stub subclass: "${s.name}" (${s.class})`);
    continue;
  }

  // If this is Clockwork Magic, rename to Clockwork Soul
  if (s.name === 'Clockwork Magic' || s.index === 'clockwork-magic') {
    s.name = 'Clockwork Soul';
    s.index = 'clockwork-soul';
  }

  finalSubclasses.push(s);
}

// Now replace or add each of the complete EXPANSION_SUBCLASSES
for (const expSub of EXPANSION_SUBCLASSES) {
  const matchIdx = finalSubclasses.findIndex(s => {
    return s.class === expSub.class && (
      norm(s.name) === norm(expSub.name) ||
      norm(s.name) + 'domain' === norm(expSub.name) ||
      norm(s.name) === norm(expSub.name) + 'domain' ||
      'wayofthe' + norm(s.name) === norm(expSub.name) ||
      norm(s.name) === 'oathof' + norm(expSub.name) ||
      norm(s.name) === norm(expSub.name).replace(/^pathof(the)?/, '')
    );
  });

  if (matchIdx !== -1) {
    console.log(`Replacing/upgrading subclass with complete data: ${expSub.name} (${expSub.class})`);
    finalSubclasses[matchIdx] = expSub;
  } else {
    console.log(`Adding missing subclass: ${expSub.name} (${expSub.class})`);
    finalSubclasses.push(expSub);
  }
}

// Ensure proper book and summary for every subclass
for (const sub of finalSubclasses) {
  if (!sub.book) sub.book = 'PHB';
  if (Array.isArray(sub.description)) {
    sub.description = sub.description.join('\n\n');
  }
  for (const f of (sub.features || [])) {
    f.summary = createSummary(f.name, f.description, f.summary);
    if (!f.source) {
      f.source = { type: "subclass", name: sub.name, level: f.level || 3 };
    }
    if (!f.book) {
      f.book = sub.book;
    }
  }
}

// Sort alphabetically by class, then name
finalSubclasses.sort((a, b) => {
  if (a.class !== b.class) return a.class.localeCompare(b.class);
  return a.name.localeCompare(b.name);
});

const subclassesOutput = {
  generated: new Date().toISOString(),
  total: finalSubclasses.length,
  subclasses: finalSubclasses
};

fs.writeFileSync(SUBCLASSES_EN, JSON.stringify(subclassesOutput, null, 2) + '\n', 'utf8');
console.log(`Saved ${finalSubclasses.length} complete subclasses to ${SUBCLASSES_EN}.`);

// -------------------------------------------------------------
// 4. Update Subclass Spells Mapping
// -------------------------------------------------------------
console.log('\n--- Updating Subclass Spells ---');
const subclassSpellsData = JSON.parse(fs.readFileSync(SUBCLASS_SPELLS, 'utf8'));

const NEW_SPELL_GRANTS = {
  "twilight": {
    "1": ["Faerie Fire", "Sleep"],
    "3": ["Moonbeam", "See Invisibility"],
    "5": ["Aura of Vitality", "Tiny Hut"],
    "7": ["Aura of Life", "Greater Invisibility"],
    "9": ["Circle of Power", "Mislead"]
  },
  "peace": {
    "1": ["Heroism", "Sanctuary"],
    "3": ["Aid", "Warding Bond"],
    "5": ["Beacon of Hope", "Sending"],
    "7": ["Aura of Purity", "Otiluke's Resilient Sphere"],
    "9": ["Greater Restoration", "Rary's Telepathic Bond"]
  },
  "order": {
    "1": ["Command", "Heroism"],
    "3": ["Hold Person", "Zone of Truth"],
    "5": ["Mass Healing Word", "Slow"],
    "7": ["Compulsion", "Locate Creature"],
    "9": ["Commune", "Dominate Person"]
  },
  "arcana": {
    "1": ["Detect Magic", "Magic Missile"],
    "3": ["Magic Weapon", "Nondetection"],
    "5": ["Dispel Magic", "Magic Circle"],
    "7": ["Arcane Eye", "Leomund's Secret Chest"],
    "9": ["Planar Binding", "Teleportation Circle"]
  },
  "death": {
    "1": ["False Life", "Ray of Sickness"],
    "3": ["Blindness/Deafness", "Ray of Enfeeblement"],
    "5": ["Animate Dead", "Vampiric Touch"],
    "7": ["Blight", "Death Ward"],
    "9": ["Antilife Shell", "Cloudkill"]
  },
  "circle-of-stars": {
    "2": ["Guidance", "Guiding Bolt"]
  },
  "circle-of-wildfire": {
    "2": ["Burning Hands", "Cure Wounds"],
    "3": ["Flaming Sphere", "Scorching Ray"],
    "5": ["Plant Growth", "Revivify"],
    "7": ["Aura of Life", "Fire Shield"],
    "9": ["Flame Strike", "Mass Cure Wounds"]
  },
  "circle-of-spores": {
    "2": ["Chill Touch"],
    "3": ["Blindness/Deafness", "Gentle Repose"],
    "5": ["Animate Dead", "Gaseous Form"],
    "7": ["Blight", "Confusion"],
    "9": ["Cloudkill", "Contagion"]
  },
  "oath-of-glory": {
    "3": ["Guiding Bolt", "Heroism"],
    "5": ["Enhance Ability", "Magic Weapon"],
    "9": ["Haste", "Protection from Energy"],
    "13": ["Compulsion", "Freedom of Movement"],
    "17": ["Commune", "Flame Strike"]
  },
  "oath-of-the-crown": {
    "3": ["Command", "Compelled Duel"],
    "5": ["Warding Bond", "Zone of Truth"],
    "9": ["Aura of Vitality", "Spirit Guardians"],
    "13": ["Banishment", "Guardian of Faith"],
    "17": ["Circle of Power", "Geas"]
  },
  "oathbreaker": {
    "3": ["Hellish Rebuke", "Inflict Wounds"],
    "5": ["Crown of Madness", "Darkness"],
    "9": ["Animate Dead", "Bestow Curse"],
    "13": ["Blight", "Confusion"],
    "17": ["Contagion", "Dominate Person"]
  },
  "gloom-stalker": {
    "3": ["Disguise Self"],
    "5": ["Rope Trick"],
    "9": ["Fear"],
    "13": ["Greater Invisibility"],
    "17": ["Seeming"]
  },
  "clockwork-soul": {
    "1": ["Alarm", "Protection from Evil and Good"],
    "3": ["Aid", "Lesser Restoration"],
    "5": ["Dispel Magic", "Protection from Energy"],
    "7": ["Freedom of Movement", "Summon Construct"],
    "9": ["Greater Restoration", "Wall of Force"]
  }
};

if (!subclassSpellsData.domainSpells) subclassSpellsData.domainSpells = {};
for (const [subKey, spellMap] of Object.entries(NEW_SPELL_GRANTS)) {
  subclassSpellsData.domainSpells[subKey] = spellMap;
}
fs.writeFileSync(SUBCLASS_SPELLS, JSON.stringify(subclassSpellsData, null, 2) + '\n', 'utf8');
console.log(`Added bonus spell mappings for ${Object.keys(NEW_SPELL_GRANTS).length} subclasses.`);

// -------------------------------------------------------------
// 5. Update Subclass Feature Choices
// -------------------------------------------------------------
console.log('\n--- Updating Subclass Feature Choices ---');
const choicesData = JSON.parse(fs.readFileSync(SUBCLASS_CHOICES, 'utf8'));

if (!choicesData.Fighter) choicesData.Fighter = {};
if (!choicesData.Fighter["Rune Knight"]) {
  choicesData.Fighter["Rune Knight"] = {
    "Rune Carver": {
      "count": 2,
      "description": "Choose runes to inscribe onto your weapons or armor. Each rune grants a passive trait and an active invocation.",
      "options": [
        { "name": "Cloud Rune", "description": "Advantage on Sleight of Hand and Deception; reaction to redirect an attack roll within 30 feet to another creature." },
        { "name": "Fire Rune", "description": "Double proficiency bonus for tools with which you are proficient; on hit, restrain target in fiery shackles dealing 2d6 fire damage per turn." },
        { "name": "Frost Rune", "description": "Advantage on Animal Handling and Intimidation; bonus action gain +2 to Strength and Constitution checks and saves for 10 minutes." },
        { "name": "Stone Rune", "description": "Advantage on Insight and 120 ft darkvision; reaction charm and incapacitate a creature that ends its turn within 30 feet." },
        { "name": "Hill Rune (Level 7+)", "description": "Advantage on saves against poison and resistance to poison damage; bonus action gain resistance to bludgeoning, piercing, and slashing damage for 1 minute." },
        { "name": "Storm Rune (Level 7+)", "description": "Advantage on Arcana and can't be surprised; bonus action enter a prophetic state for 1 minute to grant advantage or disadvantage to rolls within 60 feet." }
      ]
    }
  };
}

if (!choicesData.Barbarian) choicesData.Barbarian = {};
if (!choicesData.Barbarian["Path of the Beast"]) {
  choicesData.Barbarian["Path of the Beast"] = {
    "Form of the Beast": {
      "count": 1,
      "description": "Choose which natural weapon manifests when you enter your rage.",
      "options": [
        { "name": "Bite", "description": "1d8 piercing damage. Once on each of your turns when below half HP, restore hit points equal to your proficiency bonus on a hit." },
        { "name": "Claws", "description": "1d6 slashing damage. Once on each of your turns when taking the Attack action, make an additional claw attack as part of that action." },
        { "name": "Tail", "description": "1d8 piercing damage with Reach. Reaction to roll 1d8 and add the result to your AC against an attack that would hit you." }
      ]
    }
  };
}

if (!choicesData.Druid) choicesData.Druid = {};
if (!choicesData.Druid["Circle of Stars"]) {
  choicesData.Druid["Circle of Stars"] = {
    "Starry Form": {
      "count": 1,
      "description": "Choose your active starry constellation when entering Starry Form.",
      "options": [
        { "name": "Archer", "description": "Make a ranged spell attack as a bonus action (range 60 ft) dealing 1d8 + Wisdom modifier radiant damage." },
        { "name": "Chalice", "description": "Whenever you cast a spell using a spell slot that restores hit points, you or another creature within 30 ft regains 1d8 + Wisdom modifier hit points." },
        { "name": "Dragon", "description": "Treat any d20 roll of 9 or lower as a 10 for Concentration checks to maintain spells, as well as Intelligence and Wisdom checks." }
      ]
    }
  };
}

fs.writeFileSync(SUBCLASS_CHOICES, JSON.stringify(choicesData, null, 2) + '\n', 'utf8');
console.log('Updated subclass feature choices.');

// -------------------------------------------------------------
// 6. Mirror to Indonesian Data (src/data/id/)
// -------------------------------------------------------------
console.log('\n--- Synchronizing Indonesian Datasets ---');
const classesDataId = JSON.parse(fs.readFileSync(CLASSES_ID, 'utf8'));
for (let i = 0; i < classesDataEn.classes.length; i++) {
  const enCls = classesDataEn.classes[i];
  const idCls = classesDataId.classes.find(c => c.name === enCls.name);
  if (idCls) {
    idCls.levels = enCls.levels;
    idCls.features = enCls.features;
  }
}
fs.writeFileSync(CLASSES_ID, JSON.stringify(classesDataId, null, 2) + '\n', 'utf8');
fs.writeFileSync(SUBCLASSES_ID, JSON.stringify(subclassesOutput, null, 2) + '\n', 'utf8');
console.log('Synchronized Indonesian datasets.');

console.log('\n=== ALL SRD DATA SUCCESSFULLY UPDATED ===');
