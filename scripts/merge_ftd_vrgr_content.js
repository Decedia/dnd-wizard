const fs = require('fs');

// Read existing files
const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));
const racesData = JSON.parse(fs.readFileSync('src/data/2014_races.json', 'utf8'));
const subclassesData = JSON.parse(fs.readFileSync('src/data/2014_subclasses.json', 'utf8'));

// Read FTD data
const ftdSpells = JSON.parse(fs.readFileSync('scripts/ftd_spells_data.json', 'utf8'));
const ftdFeats = JSON.parse(fs.readFileSync('scripts/ftd_feats_data.json', 'utf8'));
const ftdRaces = JSON.parse(fs.readFileSync('scripts/ftd_races_data.json', 'utf8'));
const ftdSubclasses = JSON.parse(fs.readFileSync('scripts/ftd_subclasses_data.json', 'utf8'));

// Read VRGR data
const vrgrSpells = JSON.parse(fs.readFileSync('scripts/vrgr_spells_data.json', 'utf8'));
const vrgrFeats = JSON.parse(fs.readFileSync('scripts/vrgr_feats_data.json', 'utf8'));
const vrgrRaces = JSON.parse(fs.readFileSync('scripts/vrgr_races_data.json', 'utf8'));
const vrgrSubclasses = JSON.parse(fs.readFileSync('scripts/vrgr_subclasses_data.json', 'utf8'));

// Check for existing FTD/VRGR entries and remove them first (to avoid duplicates)
spellsData.spells = spellsData.spells.filter(s => s.source !== 'FTD' && s.source !== 'VRGR');
featsData.feats = featsData.feats.filter(f => f.source !== 'FTD' && f.source !== 'VRGR');
racesData.races = racesData.races.filter(r => r.source !== 'FTD' && r.source !== 'VRGR');
subclassesData.subclasses = subclassesData.subclasses.filter(s => s.source !== 'FTD' && s.source !== 'VRGR');

// Add FTD spells
for (const spell of ftdSpells) {
  spellsData.spells.push(spell);
  console.log(`  Added FTD spell: ${spell.name}`);
}

// Add FTD feats
for (const feat of ftdFeats) {
  featsData.feats.push(feat);
  console.log(`  Added FTD feat: ${feat.name}`);
}

// Add FTD races
for (const race of ftdRaces) {
  racesData.races.push(race);
  console.log(`  Added FTD race: ${race.name}`);
}

// Add FTD subclasses
for (const sub of ftdSubclasses) {
  subclassesData.subclasses.push(sub);
  console.log(`  Added FTD subclass: ${sub.class}: ${sub.name}`);
}

// Add VRGR spells
for (const spell of vrgrSpells) {
  spellsData.spells.push(spell);
  console.log(`  Added VRGR spell: ${spell.name}`);
}

// Add VRGR feats
for (const feat of vrgrFeats) {
  featsData.feats.push(feat);
  console.log(`  Added VRGR feat: ${feat.name}`);
}

// Add VRGR races
for (const race of vrgrRaces) {
  racesData.races.push(race);
  console.log(`  Added VRGR race: ${race.name}`);
}

// Add VRGR subclasses
for (const sub of vrgrSubclasses) {
  subclassesData.subclasses.push(sub);
  console.log(`  Added VRGR subclass: ${sub.class}: ${sub.name}`);
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

console.log(`\nTotal spells: ${spellsData.spells.length} (${spellsData.spells.filter(s => s.source === 'FTD').length} FTD, ${spellsData.spells.filter(s => s.source === 'VRGR').length} VRGR)`);
console.log(`Total feats: ${featsData.feats.length} (${featsData.feats.filter(f => f.source === 'FTD').length} FTD, ${featsData.feats.filter(f => f.source === 'VRGR').length} VRGR)`);
console.log(`Total races: ${racesData.races.length} (${racesData.races.filter(r => r.source === 'FTD').length} FTD, ${racesData.races.filter(r => r.source === 'VRGR').length} VRGR)`);
console.log(`Total subclasses: ${subclassesData.subclasses.length} (${subclassesData.subclasses.filter(s => s.source === 'FTD').length} FTD, ${subclassesData.subclasses.filter(s => s.source === 'VRGR').length} VRGR)`);
