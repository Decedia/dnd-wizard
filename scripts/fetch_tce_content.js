const https = require('https');
const fs = require('fs');

const TCE_SPELLS = [
  'summon-fey', 'summon-shadowspawn', 'summon-aberration', 'summon-construct',
  'summon-elemental', 'summon-undead', 'intellect-fortress', 'spirit-shroud',
  'summon-celestial', 'summon-fiend', 'druid-grove', 'dream-of-the-blue-veil',
  'otherworldly-form', 'power-word-pain', 'psi-warrior', 'psychic-scream',
  'thought-shield', 'blade-bite', 'booster-pulse', 'dialing-disruption',
  'gravity-shift', 'overcharge', 'precision-beam', 'pressure-reversal',
  'resistant-force', 'siphon-soul', 'time-slip', 'touch-of-the-void',
  'umbramancy', 'void-writing'
];

const TCE_FEATS = [
  'fey-touched', 'shadow-touched', 'eldritch-adept', 'metamagic-adept',
  'fighting-initiate', 'piercer', 'crusher', 'slasher', 'skill-expert',
  'alert', 'weapon-master', 'moderately-armored', 'heavily-armored',
  'lightly-armored', 'shield-master', 'medium-armor-master',
  'defensive-duelist', 'dragon-hide', 'elven Accuracy', 'fade-away',
  'fey-teleportation', 'flames-of-phlegethos', 'infernal-constitution',
  'orcish-fury', 'prodigy', 'second-chance', 'squat-nimbleness',
  'bountiful-luck', 'dwarven-fortitude', 'drow-high-magic'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const spells = [];
  const feats = [];
  
  console.log('Fetching TCE spells from D&D 5e API...');
  for (const spell of TCE_SPELLS) {
    try {
      const data = await fetch(`https://www.dnd5eapi.co/api/2014/spells/${spell}`);
      if (data && data.name) {
        spells.push(data);
        console.log(`  ✓ ${data.name}`);
      }
    } catch(e) {
      console.log(`  ✗ ${spell} - not found`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\nFetching TCE feats from D&D 5e API...');
  for (const feat of TCE_FEATS) {
    try {
      const data = await fetch(`https://www.dnd5eapi.co/api/2014/feats/${feat}`);
      if (data && data.name) {
        feats.push(data);
        console.log(`  ✓ ${data.name}`);
      }
    } catch(e) {
      console.log(`  ✗ ${feat} - not found`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n\nTotal spells fetched: ${spells.length}`);
  console.log(`Total feats fetched: ${feats.length}`);
  
  // Save raw data
  fs.writeFileSync('scripts/tce_spells_raw.json', JSON.stringify(spells, null, 2));
  fs.writeFileSync('scripts/tce_feats_raw.json', JSON.stringify(feats, null, 2));
}

main().catch(console.error);
