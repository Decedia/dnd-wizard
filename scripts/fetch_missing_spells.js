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
  const missingSpells = ['tensers-floating-disk', 'cordon-of-arrows', 'melfs-acid-arrow', 'nystuls-magic-aura', 'phantasmal-force'];
  
  const results = [];
  for (const index of missingSpells) {
    try {
      const data = await fetch(`https://www.dnd5eapi.co/api/2014/spells/${index}`);
      if (data && data.name) {
        results.push(data);
        console.log(`  ✓ ${data.name}`);
      }
    } catch(e) {
      console.log(`  ✗ ${index} - not found`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync('scripts/missing_spells.json', JSON.stringify(results, null, 2));
  console.log(`\nTotal fetched: ${results.length}`);
}

main().catch(console.error);
