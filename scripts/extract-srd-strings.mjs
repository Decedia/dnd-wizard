import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EN_DIR = path.join(__dirname, '..', 'src', 'data', 'en');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const OUTPUT_FILE = path.join(LOCALES_DIR, 'srd-strings-en.json');

const TARGET_FIELDS = new Set([
  'description',
  'fullDescription',
  'summary',
  'effectSummary',
  'flavorText',
]);

const FILES = [
  '2014_classes.json',
  '2014_subclasses.json',
  '2014_races.json',
  '2014_feats.json',
  '2014_spells.json',
  '2014_spell_mechanics.json',
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractStrings(obj, pathSegments, results) {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    const occurrenceCounter = new Map();
    for (const item of obj) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const baseName = item.index || (item.name ? slugify(item.name) : null);
        if (baseName) {
          const count = (occurrenceCounter.get(baseName) || 0) + 1;
          occurrenceCounter.set(baseName, count);
          const id = count > 1 ? `${baseName}-${count}` : baseName;
          extractStrings(item, [...pathSegments, id], results);
        }
      }
    }
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (TARGET_FIELDS.has(key) && typeof value === 'string') {
      const fullPath = [...pathSegments, key];
      const dictKey = fullPath.join('.');
      results[dictKey] = value;
    } else if (Array.isArray(value)) {
      extractStrings(value, pathSegments, results);
    } else if (value && typeof value === 'object') {
      extractStrings(value, [...pathSegments, key], results);
    }
  }
}

function extractFile(filename) {
  const filePath = path.join(EN_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const fileBase = path.basename(filename, path.extname(filename));
  const results = {};

  extractStrings(data, [fileBase], results);

  return results;
}

function main() {
  const allStrings = {};

  for (const file of FILES) {
    console.log(`Extracting from ${file}...`);
    const fileStrings = extractFile(file);
    let count = 0;
    for (const [key, value] of Object.entries(fileStrings)) {
      allStrings[key] = value;
      count++;
    }
    console.log(`  Found ${count} strings`);
  }

  fs.mkdirSync(LOCALES_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allStrings, null, 2) + '\n');
  console.log(`\nTotal: ${Object.keys(allStrings).length} strings written to ${OUTPUT_FILE}`);
}

main();
