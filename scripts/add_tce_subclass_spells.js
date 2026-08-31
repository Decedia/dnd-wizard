const fs = require('fs');

// Read subclass spells
const data = JSON.parse(fs.readFileSync('src/data/subclass_spells.json', 'utf8'));

// Add TCE subclass spell grants

// Fey Wanderer (Ranger) - Fey Wanderer Magic
// Gains spells at levels 3, 5, 9, 13, 17 from enchantment or divination schools
if (!data.rangerSpells) data.rangerSpells = {};
data.rangerSpells["fey-wanderer"] = {
  "3": ["Charm Person"],
  "5": ["Misty Step"],
  "9": ["Dispel Magic"],
  "13": ["Dimension Door"],
  "17": ["Mislead"]
};

// Aberrant Mind (Sorcerer) - Psionic Spells
// Gains spells at levels 1, 3, 5, 7, 9 from any school
if (!data.sorcererSpells) data.sorcererSpells = {};
data.sorcererSpells["aberrant-mind"] = {
  "1": ["Arms of Hadar", "Dissonant Whispers", "Mind Sliver"],
  "3": ["Calm Emotions", "Detect Thoughts"],
  "5": ["Hunger of Hadar", "Sending"],
  "7": ["Evard's Black Tentacles", "Summon Aberration"],
  "9": ["Rary's Telepathic Bond", "Telekinesis"]
};

// Clockwork Magic (Sorcerer) - Clockwork Magic
// Gains spells at levels 1, 3, 5, 7, 9 from any school
data.sorcererSpells["clockwork-magic"] = {
  "1": ["Alarm", "Protection from Evil and Good"],
  "3": ["Aid", "Lesser Restoration"],
  "5": ["Dispel Magic", "Protection from Energy"],
  "7": ["Freedom of Movement", "Summon Construct"],
  "9": ["Greater Restoration", "Wall of Force"]
};

// Write updated file
fs.writeFileSync('src/data/subclass_spells.json', JSON.stringify(data, null, 2));

console.log('Added TCE subclass spell grants');
console.log('  - Fey Wanderer (Ranger)');
console.log('  - Aberrant Mind (Sorcerer)');
console.log('  - Clockwork Magic (Sorcerer)');
