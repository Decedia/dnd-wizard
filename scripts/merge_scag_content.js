const fs = require('fs');

// Read existing files
const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));
const racesData = JSON.parse(fs.readFileSync('src/data/2014_races.json', 'utf8'));

// Read SCAG data
const scagSpells = JSON.parse(fs.readFileSync('scripts/scag_spells_data.json', 'utf8'));
const scagFeats = JSON.parse(fs.readFileSync('scripts/scag_feats_data.json', 'utf8'));
const scagRaces = JSON.parse(fs.readFileSync('scripts/scag_races_data.json', 'utf8'));

// Check for existing SCAG entries and remove them first (to avoid duplicates)
spellsData.spells = spellsData.spells.filter(s => s.source !== 'SCAG');
featsData.feats = featsData.feats.filter(f => f.source !== 'SCAG');
racesData.races = racesData.races.filter(r => r.source !== 'SCAG');

// Add SCAG spells
for (const spell of scagSpells) {
  spellsData.spells.push(spell);
  console.log(`  Added spell: ${spell.name}`);
}

// Add SCAG feats
for (const feat of scagFeats) {
  featsData.feats.push(feat);
  console.log(`  Added feat: ${feat.name}`);
}

// Add SCAG races
for (const race of scagRaces) {
  racesData.races.push(race);
  console.log(`  Added race: ${race.name}`);
}

// Sort spells by level then name
spellsData.spells.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  return a.name.localeCompare(b.name);
});

// Sort feats by name
featsData.feats.sort((a, b) => a.name.localeCompare(b.name));

// Sort races by name
racesData.races.sort((a, b) => a.name.localeCompare(b.name));

// Write updated files
fs.writeFileSync('src/data/2014_spells.json', JSON.stringify(spellsData, null, 2));
fs.writeFileSync('src/data/2014_feats.json', JSON.stringify(featsData, null, 2));
fs.writeFileSync('src/data/2014_races.json', JSON.stringify(racesData, null, 2));

console.log(`\nTotal spells: ${spellsData.spells.length} (${spellsData.spells.filter(s => s.source === 'SCAG').length} SCAG)`);
console.log(`Total feats: ${featsData.feats.length} (${featsData.feats.filter(f => f.source === 'SCAG').length} SCAG)`);
console.log(`Total races: ${racesData.races.length} (${racesData.races.filter(r => r.source === 'SCAG').length} SCAG)`);
