import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EN_DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'en');
const ID_PARTS_DIR = path.join(__dirname, '..', 'src', 'locales', 'parts', 'id');
const ID_DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'id');

const FILES = [
  '2014_classes.json',
  '2014_races.json',
  '2014_feats.json',
  '2014_subclasses.json',
  '2014_spells.json',
  '2014_spell_mechanics.json',
];

const TARGET_FIELDS = new Set([
  'description',
  'fullDescription',
  'summary',
  'effectSummary',
  'flavorText',
]);

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function loadIdParts(baseName) {
  const partsDir = path.join(ID_PARTS_DIR);
  const parts = {};
  
  try {
    const files = fs.readdirSync(partsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const withoutExt = file.slice(0, -5);
      
      if (withoutExt === baseName) {
        const data = loadJson(path.join(partsDir, file));
        if (data && typeof data === 'object') {
          Object.assign(parts, data);
        }
      } else if (withoutExt.startsWith(baseName + '_')) {
        const partName = withoutExt.slice(baseName.length + 1);
        const data = loadJson(path.join(partsDir, file));
        if (data && typeof data === 'object') {
          Object.assign(parts, data);
        }
      }
    }
  } catch (e) {
    // directory might not exist yet
  }
  
  return parts;
}

function translateValue(value, translations) {
  if (typeof value === 'string') {
    return translations[value] || value;
  }
  if (Array.isArray(value)) {
    return value.map(item => translateValue(item, translations));
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = translateValue(val, translations);
    }
    return result;
  }
  return value;
}

function processNode(node, translations, pathSegments = []) {
  if (typeof node !== 'object' || node === null) {
    return translateValue(node, translations);
  }

  if (Array.isArray(node)) {
    return node.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const baseName = item.index || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null);
        if (baseName) {
          return processNode(item, translations, [...pathSegments, baseName]);
        }
      }
      return processNode(item, translations, pathSegments);
    });
  }

  const result = {};
  for (const [key, value] of Object.entries(node)) {
    if (TARGET_FIELDS.has(key) && typeof value === 'string') {
      const fullPath = [...pathSegments, key].join('.');
      if (translations[fullPath]) {
        result[key] = translations[fullPath];
      } else if (translations[value]) {
        result[key] = translations[value];
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      result[key] = processNode(value, translations, pathSegments);
    } else if (value && typeof value === 'object') {
      result[key] = processNode(value, translations, [...pathSegments, key]);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function buildFile(filename) {
  const enPath = path.join(EN_DATA_DIR, filename);
  const idPath = path.join(ID_DATA_DIR, filename);
  
  const enData = loadJson(enPath);
  if (!enData) {
    console.log(`  SKIP: ${filename} (no EN source)`);
    return;
  }

  const baseName = path.basename(filename, path.extname(filename));
  const translations = loadIdParts(baseName);
  
  const idData = processNode(enData, translations, [baseName]);
  
  fs.mkdirSync(ID_DATA_DIR, { recursive: true });
  fs.writeFileSync(idPath, JSON.stringify(idData, null, 2) + '\n');
  console.log(`  OK: ${filename} -> ${idPath}`);
}

function main() {
  console.log('Building ID data from modular parts...\n');
  
  for (const file of FILES) {
    console.log(`Processing ${file}...`);
    buildFile(file);
  }
  
  console.log('\nBuild complete.');
}

main();
