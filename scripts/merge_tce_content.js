const fs = require('fs');

// Read existing files
const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));

// Read TCE data
const tceSpells = JSON.parse(fs.readFileSync('scripts/tce_spells_data.json', 'utf8'));
const tceFeats = JSON.parse(fs.readFileSync('scripts/tce_feats_data.json', 'utf8'));

// Check for existing TCE entries and remove them first (to avoid duplicates)
spellsData.spells = spellsData.spells.filter(s => s.source !== 'TCE');
featsData.feats = featsData.feats.filter(f => f.source !== 'TCE');

// Add TCE spells
for (const spell of tceSpells) {
  spellsData.spells.push(spell);
}

// Add TCE feats
for (const feat of tceFeats) {
  featsData.feats.push(feat);
}

// Sort spells by level then name
spellsData.spells.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  return a.name.localeCompare(b.name);
});

// Sort feats by name
featsData.feats.sort((a, b) => a.name.localeCompare(b.name));

// Write updated files
fs.writeFileSync('src/data/2014_spells.json', JSON.stringify(spellsData, null, 2));
fs.writeFileSync('src/data/2014_feats.json', JSON.stringify(featsData, null, 2));

console.log(`Spells: ${spellsData.spells.length} total (${spellsData.spells.filter(s => s.source === 'TCE').length} TCE)`);
console.log(`Feats: ${featsData.feats.length} total (${featsData.feats.filter(f => f.source === 'TCE').length} TCE)`);
