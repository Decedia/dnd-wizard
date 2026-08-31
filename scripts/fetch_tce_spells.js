const https = require('https');
const fs = require('fs');

// Known TCE spells (based on Tasha's Cauldron of Everything table of contents)
const TCE_SPELLS = [
  { name: 'Blade Bite', index: 'blade-bite' },
  { name: 'Booster Pulse', index: 'booster-pulse' },
  { name: 'Dream of the Blue Veil', index: 'dream-of-the-blue-veil' },
  { name: 'Druid Grove', index: 'druid-grove' },
  { name: 'Gravity Shift', index: 'gravity-shift' },
  { name: 'Intellect Fortress', index: 'intellect-fortress' },
  { name: 'Otherworldly Form', index: 'otherworldly-form' },
  { name: 'Power Word Pain', index: 'power-word-pain' },
  { name: 'Psychic Scream', index: 'psychic-scream' },
  { name: 'Pulse Wave', index: 'pulse-wave' },
  { name: 'Sapping Sting', index: 'sapping-sting' },
  { name: 'Spirit Shroud', index: 'spirit-shroud' },
  { name: 'Summon Aberration', index: 'summon-aberration' },
  { name: 'Summon Beast', index: 'summon-beast' },
  { name: 'Summon Celestial', index: 'summon-celestial' },
  { name: 'Summon Construct', index: 'summon-construct' },
  { name: 'Summon Elemental', index: 'summon-elemental' },
  { name: 'Summon Fey', index: 'summon-fey' },
  { name: 'Summon Fiend', index: 'summon-fiend' },
  { name: 'Summon Shadowspawn', index: 'summon-shadowspawn' },
  { name: 'Summon Undead', index: 'summon-undead' },
  { name: 'Time Slipp', index: 'time-slipp' },
  { name: 'Touch of the Void', index: 'touch-of-the-void' },
  { name: 'Vampiric Touch', index: 'vampiric-touch' },  // already exists
  { name: 'Void Writing', index: 'void-writing' },
];

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
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
          }
        }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const found = [];
  const notFound = [];
  
  console.log('Searching for TCE spells in Open5E API...');
  for (const spell of TCE_SPELLS) {
    try {
      // Try direct slug first
      const data = await fetch(`https://api.open5e.com/v1/spells/${spell.index}/`);
      if (data && data.name) {
        found.push({ ...data, tce: true });
        console.log(`  ✓ ${data.name}`);
      }
    } catch(e) {
      // Try search
      try {
        const searchData = await fetch(`https://api.open5e.com/v1/spells/?search=${spell.name.toLowerCase().replace(/['\s]+/g, '+')}`);
        if (searchData && searchData.results && searchData.results.length > 0) {
          // Find exact match
          const match = searchData.results.find(r => r.name.toLowerCase() === spell.name.toLowerCase());
          if (match) {
            found.push({ ...match, tce: true });
            console.log(`  ✓ ${match.name} (via search)`);
          } else {
            notFound.push(spell);
            console.log(`  ✗ ${spell.name} - search results but no exact match`);
          }
        } else {
          notFound.push(spell);
          console.log(`  ✗ ${spell.name} - not found`);
        }
      } catch(e2) {
        notFound.push(spell);
        console.log(`  ✗ ${spell.name} - ${e2.message.substring(0, 100)}`);
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n\nFound: ${found.length}`);
  console.log(`Not found: ${notFound.length}`);
  
  fs.writeFileSync('scripts/tce_spells_found.json', JSON.stringify(found, null, 2));
  fs.writeFileSync('scripts/tce_spells_not_found.json', JSON.stringify(notFound, null, 2));
}

main().catch(console.error);
