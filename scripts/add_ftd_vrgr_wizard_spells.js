const fs = require('fs');

// Read wizard spells
const wizardData = JSON.parse(fs.readFileSync('src/data/2014_wizard_spells.json', 'utf8'));

// Read FTD and VRGR spells data
const ftdSpells = JSON.parse(fs.readFileSync('scripts/ftd_spells_data.json', 'utf8'));
const vrgrSpells = JSON.parse(fs.readFileSync('scripts/vrgr_spells_data.json', 'utf8'));

// Filter for wizard spells
const ftdWizardSpells = ftdSpells.filter(s => s.classes && s.classes.includes('Wizard'));
const vrgrWizardSpells = vrgrSpells.filter(s => s.classes && s.classes.includes('Wizard'));

// Check for existing FTD/VRGR entries and remove them first (to avoid duplicates)
wizardData.spells = wizardData.spells.filter(s => s.source !== 'FTD' && s.source !== 'VRGR');

// Add FTD wizard spells
for (const spell of ftdWizardSpells) {
  const exists = wizardData.spells.find(s => s.index === spell.index || s.name === spell.name);
  if (!exists) {
    wizardData.spells.push({ ...spell, source: 'FTD' });
    console.log(`  Added FTD: ${spell.name}`);
  } else {
    console.log(`  Already exists: ${spell.name}`);
  }
}

// Add VRGR wizard spells
for (const spell of vrgrWizardSpells) {
  const exists = wizardData.spells.find(s => s.index === spell.index || s.name === spell.name);
  if (!exists) {
    wizardData.spells.push({ ...spell, source: 'VRGR' });
    console.log(`  Added VRGR: ${spell.name}`);
  } else {
    console.log(`  Already exists: ${spell.name}`);
  }
}

// Sort by level then name
wizardData.spells.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  return a.name.localeCompare(b.name);
});

// Write updated file
fs.writeFileSync('src/data/2014_wizard_spells.json', JSON.stringify(wizardData, null, 2));

console.log(`\nTotal wizard spells: ${wizardData.spells.length}`);
console.log(`  FTD: ${wizardData.spells.filter(s => s.source === 'FTD').length}`);
console.log(`  VRGR: ${wizardData.spells.filter(s => s.source === 'VRGR').length}`);
