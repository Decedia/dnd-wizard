const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CLASSES_FILE = path.join(DATA_DIR, '2014_classes.json');
const RACES_FILE = path.join(DATA_DIR, '2014_races.json');
const SUBCLASSES_FILE = path.join(DATA_DIR, '2014_subclasses.json');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchAllFeatures() {
  console.log('Fetching features from D&D 5e API...');
  const data = await fetch('https://www.dnd5eapi.co/api/2014/features/');
  const features = data.results;
  console.log(`  Found ${features.length} features`);

  const featureMap = new Map();
  for (const f of features) {
    const detail = await fetch(`https://www.dnd5eapi.co${f.url}`);
    const name = detail.name;
    const desc = Array.isArray(detail.desc) ? detail.desc.join('\n') : detail.desc || '';
    if (!featureMap.has(name)) {
      featureMap.set(name, desc);
    }
  }
  console.log(`  Loaded ${featureMap.size} unique feature descriptions`);
  return featureMap;
}

async function fetchAllTraits() {
  console.log('Fetching traits from D&D 5e API...');
  const data = await fetch('https://www.dnd5eapi.co/api/2014/traits/');
  const traits = data.results;
  console.log(`  Found ${traits.length} traits`);

  const traitMap = new Map();
  for (const t of traits) {
    const detail = await fetch(`https://www.dnd5eapi.co${t.url}`);
    const name = detail.name;
    const desc = Array.isArray(detail.desc) ? detail.desc.join('\n') : detail.desc || '';
    if (!traitMap.has(name)) {
      traitMap.set(name, desc);
    }
  }
  console.log(`  Loaded ${traitMap.size} unique trait descriptions`);
  return traitMap;
}

function updateClassFeatures(featureMap) {
  console.log('\nUpdating class features...');
  const data = JSON.parse(fs.readFileSync(CLASSES_FILE, 'utf8'));
  let updated = 0;
  const updatedNames = new Set();

  for (const cls of data.classes) {
    if (cls.features) {
      for (const f of cls.features) {
        if (featureMap.has(f.name)) {
          f.description = featureMap.get(f.name);
          updated++;
          updatedNames.add(f.name);
        }
      }
    }
    if (cls.levels) {
      for (const lvl of cls.levels) {
        if (lvl.features) {
          for (const f of lvl.features) {
            if (featureMap.has(f.name)) {
              f.description = featureMap.get(f.name);
              updated++;
              updatedNames.add(f.name);
            }
          }
        }
      }
    }
  }

  fs.writeFileSync(CLASSES_FILE, JSON.stringify(data, null, 2));
  console.log(`  Updated ${updated} class feature entries (${updatedNames.size} unique names)`);
  return { updated, names: updatedNames };
}

function updateRacialTraits(traitMap) {
  console.log('\nUpdating racial traits...');
  const data = JSON.parse(fs.readFileSync(RACES_FILE, 'utf8'));
  let updated = 0;
  const updatedNames = new Set();

  for (const race of data.races) {
    if (race.traits) {
      for (const t of race.traits) {
        if (traitMap.has(t.name)) {
          t.description = traitMap.get(t.name);
          updated++;
          updatedNames.add(t.name);
        }
      }
    }
  }

  fs.writeFileSync(RACES_FILE, JSON.stringify(data, null, 2));
  console.log(`  Updated ${updated} racial trait entries (${updatedNames.size} unique names)`);
  return { updated, names: updatedNames };
}

function updateSubclassFeatures(featureMap) {
  console.log('\nUpdating subclass features...');
  const data = JSON.parse(fs.readFileSync(SUBCLASSES_FILE, 'utf8'));
  let updated = 0;
  const updatedNames = new Set();

  for (const sc of data.subclasses) {
    if (sc.features) {
      for (const f of sc.features) {
        if (featureMap.has(f.name)) {
          const desc = featureMap.get(f.name);
          f.description = [desc];
          updated++;
          updatedNames.add(f.name);
        }
      }
    }
  }

  fs.writeFileSync(SUBCLASSES_FILE, JSON.stringify(data, null, 2));
  console.log(`  Updated ${updated} subclass feature entries (${updatedNames.size} unique names)`);
  return { updated, names: updatedNames };
}

async function main() {
  console.log('=== Feature Description Updater ===\n');

  const [featureMap, traitMap] = await Promise.all([
    fetchAllFeatures(),
    fetchAllTraits()
  ]);

  const classResult = updateClassFeatures(featureMap);
  const raceResult = updateRacialTraits(traitMap);
  const subclassResult = updateSubclassFeatures(featureMap);

  const totalUpdated = classResult.updated + raceResult.updated + subclassResult.updated;
  const allNames = new Set([...classResult.names, ...raceResult.names, ...subclassResult.names]);

  console.log('\n=== Summary ===');
  console.log(`Total feature entries updated: ${totalUpdated}`);
  console.log(`Unique feature names updated: ${allNames.size}`);
  console.log(`Files updated: 2014_classes.json, 2014_races.json, 2014_subclasses.json`);
  console.log(`Sample updated features: ${[...allNames].slice(0, 10).join(', ')}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
