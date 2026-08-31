const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { 
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Get all spells from D&D 5e API
  console.log('Fetching all spells from D&D 5e API...');
  const allSpells = await fetch('https://www.dnd5eapi.co/api/2014/spells');
  console.log(`Total spells in API: ${allSpells.count}`);
  
  // Known TCE spell names (from Tasha's Cauldron of Everything)
  const tceSpellNames = [
    'Blade Bite', 'Booster Pulse', 'Dream of the Blue Veil', 'Druid Grove',
    'Gravity Shift', 'Intellect Fortress', 'Otherworldly Form', 'Power Word Pain',
    'Psychic Scream', 'Pulse Wave', 'Sapping Sting', 'Spirit Shroud',
    'Summon Aberration', 'Summon Beast', 'Summon Celestial', 'Summon Construct',
    'Summon Elemental', 'Summon Fey', 'Summon Fiend', 'Summon Shadowspawn',
    'Summon Undead', 'Time Slipp', 'Touch of the Void', 'Void Writing'
  ];
  
  // Find matching spells
  const found = [];
  const notFound = [];
  
  for (const name of tceSpellNames) {
    const match = allSpells.results.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (match) {
      found.push(match);
      console.log(`  ✓ ${match.name} (${match.index})`);
    } else {
      notFound.push(name);
      console.log(`  ✗ ${name}`);
    }
  }
  
  console.log(`\nFound in D&D 5e API: ${found.length}`);
  console.log(`Not found: ${notFound.length}`);
  
  // Fetch detailed info for found spells
  console.log('\nFetching detailed spell info...');
  const detailedSpells = [];
  for (const spell of found) {
    try {
      const detail = await fetch(`https://www.dnd5eapi.co${spell.url}`);
      detailedSpells.push(detail);
      console.log(`  ✓ ${detail.name}`);
    } catch(e) {
      console.log(`  ✗ ${spell.name} - ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync('scripts/tce_spells_dnd5e.json', JSON.stringify(detailedSpells, null, 2));
  fs.writeFileSync('scripts/tce_spells_not_found.json', JSON.stringify(notFound, null, 2));
  
  console.log(`\nTotal detailed spells: ${detailedSpells.length}`);
}

main().catch(console.error);
