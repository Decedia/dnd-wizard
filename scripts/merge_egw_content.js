const fs = require('fs');

// Read existing files
const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));
const racesData = JSON.parse(fs.readFileSync('src/data/2014_races.json', 'utf8'));
const subclassesData = JSON.parse(fs.readFileSync('src/data/2014_subclasses.json', 'utf8'));

// Read EGW data
const egwSpells = JSON.parse(fs.readFileSync('scripts/egw_spells_data.json', 'utf8'));
const egwFeats = JSON.parse(fs.readFileSync('scripts/egw_feats_data.json', 'utf8'));
const egwRaces = JSON.parse(fs.readFileSync('scripts/egw_races_data.json', 'utf8'));
const egwSubclasses = JSON.parse(fs.readFileSync('scripts/egw_subclasses_data.json', 'utf8'));

// Check for existing EGW entries and remove them first (to avoid duplicates)
spellsData.spells = spellsData.spells.filter(s => s.source !== 'EGW');
featsData.feats = featsData.feats.filter(f => f.source !== 'EGW');
racesData.races = racesData.races.filter(r => r.source !== 'EGW');
subclassesData.subclasses = subclassesData.subclasses.filter(s => s.source !== 'EGW');

// Add EGW spells
for (const spell of egwSpells) {
  spellsData.spells.push(spell);
  console.log(`  Added spell: ${spell.name}`);
}

// Add EGW feats
for (const feat of egwFeats) {
  featsData.feats.push(feat);
  console.log(`  Added feat: ${feat.name}`);
}

// Add EGW races
for (const race of egwRaces) {
  racesData.races.push(race);
  console.log(`  Added race: ${race.name}`);
}

// Add EGW subclasses
for (const sub of egwSubclasses) {
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

console.log(`\nTotal spells: ${spellsData.spells.length} (${spellsData.spells.filter(s => s.source === 'EGW').length} EGW)`);
console.log(`Total feats: ${featsData.feats.length} (${featsData.feats.filter(f => f.source === 'EGW').length} EGW)`);
console.log(`Total races: ${racesData.races.length} (${racesData.races.filter(r => r.source === 'EGW').length} EGW)`);
console.log(`Total subclasses: ${subclassesData.subclasses.length} (${subclassesData.subclasses.filter(s => s.source === 'EGW').length} EGW)`);
