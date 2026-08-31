const fs = require('fs');
const path = require('path');

const RACES_FILE = path.join(__dirname, '..', 'src', 'data', '2014_races.json');
const API_BASE = 'https://api.open5e.com/v1/races/?format=json&document__slug=wotc-srd';

async function fetchRaces() {
  console.log('Fetching races from Open5E API...');
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`Fetched ${data.results.length} races from Open5E`);
  return data.results;
}

function parseTraits(traitsString) {
  const traits = [];
  if (!traitsString || traitsString.trim().length === 0) {
    return traits;
  }

  const regex = /\*\*_(.+?)_?\*\*\s*/g;
  let match;
  const matches = [];

  while ((match = regex.exec(traitsString)) !== null) {
    matches.push({
      name: match[1].replace(/\.$/, '').trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const description = traitsString
      .substring(current.endIndex, next ? next.startIndex : undefined)
      .trim();
    traits.push({
      name: current.name,
      description: description
    });
  }

  return traits;
}

function normalizeTraitName(name) {
  return name
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .trim();
}

function findBestMatch(apiTraitName, localTraits) {
  const normalized = apiTraitName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const localTrait of localTraits) {
    const localNormalized = localTrait.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (localNormalized === normalized) {
      return localTrait;
    }
  }

  for (const localTrait of localTraits) {
    const localNormalized = localTrait.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (localNormalized.includes(normalized) || normalized.includes(localNormalized)) {
      return localTrait;
    }
  }

  return null;
}

async function main() {
  const open5eRaces = await fetchRaces();

  const fileContent = fs.readFileSync(RACES_FILE, 'utf8');
  const raceData = JSON.parse(fileContent);

  const localRaceMap = new Map();
  for (const race of raceData.races) {
    localRaceMap.set(race.name.toLowerCase(), race);
  }

  let racesUpdated = 0;
  let traitsUpdated = 0;
  const updateDetails = [];

  for (const apiRace of open5eRaces) {
    const localRace = localRaceMap.get(apiRace.name.toLowerCase());
    if (!localRace) {
      console.log(`  Race "${apiRace.name}" not found in local data, skipping`);
      continue;
    }

    const apiTraits = parseTraits(apiRace.traits);
    if (apiTraits.length === 0) {
      console.log(`  No traits parsed for "${apiRace.name}", skipping`);
      continue;
    }

    let raceTraitsUpdated = 0;
    for (const apiTrait of apiTraits) {
      const localTrait = findBestMatch(apiTrait.name, localRace.traits);
      if (localTrait && apiTrait.description.length > 0) {
        localTrait.description = apiTrait.description;
        traitsUpdated++;
        raceTraitsUpdated++;
      }
    }

    if (raceTraitsUpdated > 0) {
      racesUpdated++;
      updateDetails.push({
        race: apiRace.name,
        traitsUpdated: raceTraitsUpdated,
        apiTraits: apiTraits.map(t => t.name)
      });
    }

    console.log(`  ${apiRace.name}: updated ${raceTraitsUpdated} traits`);
  }

  fs.writeFileSync(RACES_FILE, JSON.stringify(raceData, null, 2), 'utf8');

  console.log('\n=== Update Summary ===');
  console.log(`Races updated: ${racesUpdated}`);
  console.log(`Traits updated: ${traitsUpdated}`);

  console.log('\n=== Update Details ===');
  for (const detail of updateDetails) {
    console.log(`  ${detail.race}: ${detail.traitsUpdated} traits (${detail.apiTraits.join(', ')})`);
  }

  console.log('\n=== Sample Updated Trait Descriptions ===');
  const sampleRace = raceData.races.find(r => r.name === 'Dwarf') || raceData.races[0];
  if (sampleRace) {
    for (const trait of sampleRace.traits.slice(0, 2)) {
      console.log(`\n--- ${trait.name} (${sampleRace.name}) ---`);
      console.log(trait.description.substring(0, 200) + (trait.description.length > 200 ? '...' : ''));
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
