const fs = require('fs');

// Read existing files
const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));
const racesData = JSON.parse(fs.readFileSync('src/data/2014_races.json', 'utf8'));
const subclassesData = JSON.parse(fs.readFileSync('src/data/2014_subclasses.json', 'utf8'));

// Read MTF data
const mtfSpells = JSON.parse(fs.readFileSync('scripts/mtf_spells_data.json', 'utf8'));
const mtfFeats = JSON.parse(fs.readFileSync('scripts/mtf_feats_data.json', 'utf8'));
const mtfRaces = JSON.parse(fs.readFileSync('scripts/mtf_races_data.json', 'utf8'));
const mtfSubclasses = JSON.parse(fs.readFileSync('scripts/mtf_subclasses_data.json', 'utf8'));

// Check for existing MTF entries and remove them first (to avoid duplicates)
spellsData.spells = spellsData.spells.filter(s => s.source !== 'MTF');
featsData.feats = featsData.feats.filter(f => f.source !== 'MTF');
racesData.races = racesData.races.filter(r => r.source !== 'MTF');
subclassesData.subclasses = subclassesData.subclasses.filter(s => s.source !== 'MTF');

// Add MTF spells
for (const spell of mtfSpells) {
  spellsData.spells.push(spell);
  console.log(`  Added spell: ${spell.name}`);
}

// Add MTF feats
for (const feat of mtfFeats) {
  featsData.feats.push(feat);
  console.log(`  Added feat: ${feat.name}`);
}

// Add MTF races
for (const race of mtfRaces) {
  racesData.races.push(race);
  console.log(`  Added race: ${race.name}`);
}

// Add MTF subclasses
for (const sub of mtfSubclasses) {
  subclassesData.subclasses.push(sub);
  console.log(`  Added subclass: ${sub.class}: ${sub.name}`);
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

// Sort subclasses by class then name
subclassesData.subclasses.sort((a, b) => {
  if (a.class !== b.class) return a.class.localeCompare(b.class);
  return a.name.localeCompare(b.name);
});

// Write updated files
fs.writeFileSync('src/data/2014_spells.json', JSON.stringify(spellsData, null, 2));
fs.writeFileSync('src/data/2014_feats.json', JSON.stringify(featsData, null, 2));
fs.writeFileSync('src/data/2014_races.json', JSON.stringify(racesData, null, 2));
fs.writeFileSync('src/data/2014_subclasses.json', JSON.stringify(subclassesData, null, 2));

console.log(`\nTotal spells: ${spellsData.spells.length} (${spellsData.spells.filter(s => s.source === 'MTF').length} MTF)`);
console.log(`Total feats: ${featsData.feats.length} (${featsData.feats.filter(f => f.source === 'MTF').length} MTF)`);
console.log(`Total races: ${racesData.races.length} (${racesData.races.filter(r => r.source === 'MTF').length} MTF)`);
console.log(`Total subclasses: ${subclassesData.subclasses.length} (${subclassesData.subclasses.filter(s => s.source === 'MTF').length} MTF)`);
