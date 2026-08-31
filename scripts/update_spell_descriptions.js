const fs = require('fs');
const path = require('path');

const SPELLS_FILE = path.join(__dirname, '..', 'src', 'data', '2014_spells.json');
const API_BASE = 'https://api.open5e.com/v1/spells/?format=json&document__slug=wotc-srd';

async function fetchAllSpells() {
  const allSpells = [];
  let url = API_BASE;
  let page = 1;

  while (url) {
    console.log(`Fetching page ${page}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    allSpells.push(...data.results);
    url = data.next;
    page++;
  }

  console.log(`Total spells fetched from Open5E: ${allSpells.length}`);
  return allSpells;
}

function splitDesc(desc) {
  if (!desc) return [];
  return desc.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
}

async function main() {
  const open5eSpells = await fetchAllSpells();

  const fileContent = fs.readFileSync(SPELLS_FILE, 'utf8');
  const spellData = JSON.parse(fileContent);

  const spellIndexMap = new Map();
  for (const spell of spellData.spells) {
    spellIndexMap.set(spell.index, spell);
  }

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];

  for (const open5eSpell of open5eSpells) {
    const localSpell = spellIndexMap.get(open5eSpell.slug);
    if (!localSpell) {
      notFound++;
      notFoundList.push(open5eSpell.slug);
      continue;
    }

    localSpell.description = open5eSpell.desc;
    localSpell.desc = splitDesc(open5eSpell.desc);

    if (open5eSpell.higher_level && open5eSpell.higher_level.trim().length > 0) {
      localSpell.higherLevel = open5eSpell.higher_level;
    }

    updated++;
  }

  fs.writeFileSync(SPELLS_FILE, JSON.stringify(spellData, null, 2), 'utf8');

  console.log(`\n=== Update Summary ===`);
  console.log(`Spells updated: ${updated}`);
  console.log(`Spells not found in Open5E: ${notFound}`);
  if (notFoundList.length > 0) {
    console.log(`Not found: ${notFoundList.join(', ')}`);
  }

  console.log(`\n=== Sample Updated Spells ===`);
  const sampleSpells = open5eSpells.slice(0, 3);
  for (const s of sampleSpells) {
    const local = spellIndexMap.get(s.slug);
    if (local) {
      console.log(`\n--- ${s.name} (${s.slug}) ---`);
      console.log(`description: ${local.description.substring(0, 150)}...`);
      console.log(`desc paragraphs: ${local.desc.length}`);
      console.log(`higherLevel: ${local.higherLevel ? local.higherLevel.substring(0, 100) + '...' : '(none)'}`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
