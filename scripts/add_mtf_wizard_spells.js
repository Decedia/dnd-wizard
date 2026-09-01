const fs = require('fs');

// Read wizard spells
const wizardData = JSON.parse(fs.readFileSync('src/data/2014_wizard_spells.json', 'utf8'));

// Read MTF spells data
const mtfSpells = JSON.parse(fs.readFileSync('scripts/mtf_spells_data.json', 'utf8'));

// Filter for wizard spells
const mtfWizardSpells = mtfSpells.filter(s => s.classes && s.classes.includes('Wizard'));

// Check for existing MTF entries and remove them first (to avoid duplicates)
wizardData.spells = wizardData.spells.filter(s => s.source !== 'MTF');

// Add MTF wizard spells
for (const spell of mtfWizardSpells) {
  const exists = wizardData.spells.find(s => s.index === spell.index || s.name === spell.name);
  if (!exists) {
    wizardData.spells.push({
      ...spell,
      source: 'MTF'
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

console.log(`\nTotal wizard spells: ${wizardData.spells.length} (${wizardData.spells.filter(s => s.source === 'MTF').length} MTF)`);
