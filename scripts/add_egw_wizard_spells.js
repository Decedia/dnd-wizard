const fs = require('fs');

// Read wizard spells
const wizardData = JSON.parse(fs.readFileSync('src/data/2014_wizard_spells.json', 'utf8'));

// Read EGW spells data
const egwSpells = JSON.parse(fs.readFileSync('scripts/egw_spells_data.json', 'utf8'));

// Filter for wizard spells
const egwWizardSpells = egwSpells.filter(s => s.classes && s.classes.includes('Wizard'));

// Check for existing EGW entries and remove them first (to avoid duplicates)
wizardData.spells = wizardData.spells.filter(s => s.source !== 'EGW');

// Add EGW wizard spells
for (const spell of egwWizardSpells) {
  const exists = wizardData.spells.find(s => s.index === spell.index || s.name === spell.name);
  if (!exists) {
    wizardData.spells.push({
      ...spell,
      source: 'EGW'
    });
    console.log(`  Added: ${spell.name}`);
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

console.log(`\nTotal wizard spells: ${wizardData.spells.length} (${wizardData.spells.filter(s => s.source === 'EGW').length} EGW)`);
