const fs = require('fs');

// Read subclass spells
const data = JSON.parse(fs.readFileSync('src/data/subclass_spells.json', 'utf8'));

// Remove redundant sections
delete data.rangerSpells;
delete data.sorcererSpells;

// Write updated file
fs.writeFileSync('src/data/subclass_spells.json', JSON.stringify(data, null, 2));

console.log('Cleaned subclass_spells.json');
console.log('Keys:', Object.keys(data));
