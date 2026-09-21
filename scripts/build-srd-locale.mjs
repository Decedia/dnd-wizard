import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EN_DIR = path.join(__dirname, '..', 'src', 'data', 'en');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'data');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseKey(key) {
  const parts = key.split('.');
  if (parts.length < 3) {
    throw new Error(`Invalid key format: ${key}`);
  }
  const filename = parts[0];
  const fieldName = parts[parts.length - 1];
  const pathSegments = parts.slice(1, -1);
  return { filename, fieldName, pathSegments };
}

function findRootArray(obj) {
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  return null;
}

function findInArray(arr, segment) {
  const match = segment.match(/^(.+)-(\d+)$/);
  if (match) {
    const baseName = match[1];
    const index = parseInt(match[2], 10) - 1;
    const candidates = arr.filter(
      item => item && typeof item === 'object' && (
        String(item.index) === baseName ||
        (item.name && slugify(item.name) === baseName)
      )
    );
    if (index >= 0 && index < candidates.length) {
      return candidates[index];
    }
    return null;
  }
  return arr.find(
    item => item && typeof item === 'object' && (
      String(item.index) === segment ||
      (item.name && slugify(item.name) === segment)
    )
  );
}

function navigateToTarget(root, pathSegments) {
  let current = findRootArray(root);
  if (!current) {
    throw new Error('No root array found in EN file');
  }
  return navigateSegments(current, pathSegments, 0);
}

function navigateSegments(current, pathSegments, index) {
  if (index >= pathSegments.length) {
    return current;
  }

  const segment = pathSegments[index];

  if (Array.isArray(current)) {
    const found = findInArray(current, segment);
    if (!found) {
      return null;
    }
    return navigateSegments(found, pathSegments, index + 1);
  }

  if (current && typeof current === 'object') {
    if (segment in current) {
      const directResult = navigateSegments(current[segment], pathSegments, index + 1);
      if (directResult !== null) {
        return directResult;
      }
    }

    for (const key of Object.keys(current)) {
      const value = current[key];
      if (Array.isArray(value) && typeof value[0] === 'object') {
        const found = findInArray(value, segment);
        if (found) {
          const result = navigateSegments(found, pathSegments, index + 1);
          if (result !== null) {
            return result;
          }
        }
      }
    }

    return null;
  }

  return null;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function processFile(translations, locale, filename) {
  const enPath = path.join(EN_DIR, filename);
  const localeDir = path.join(LOCALES_DIR, locale);
  const outPath = path.join(localeDir, filename);

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const cloneData = deepClone(enData);

  const fileBase = path.basename(filename, path.extname(filename));
  const prefix = `${fileBase}.`;

  let replaced = 0;
  let fallback = 0;

  for (const [key, translatedValue] of Object.entries(translations)) {
    if (!key.startsWith(prefix)) continue;

    const { fieldName, pathSegments } = parseKey(key);
    const target = navigateToTarget(cloneData, pathSegments);

    if (target && typeof target === 'object' && fieldName in target) {
      if (translations[key] !== undefined && translations[key] !== null) {
        target[fieldName] = translatedValue;
        replaced++;
      } else {
        fallback++;
      }
    }
  }

  fs.mkdirSync(localeDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(cloneData, null, 2) + '\n');
  console.log(`  ${filename}: ${replaced} replaced, ${fallback} fallback (EN)`);
}

function main() {
  const locale = process.argv[2];
  if (!locale) {
    console.error('Usage: node scripts/build-srd-locale.mjs <locale>');
    console.error('Example: node scripts/build-srd-locale.mjs id');
    process.exit(1);
  }

  const dictPath = path.join(__dirname, '..', 'src', 'locales', `srd-strings-${locale}.json`);
  if (!fs.existsSync(dictPath)) {
    console.error(`Dictionary not found: ${dictPath}`);
    console.error(`Run extraction first or create src/locales/srd-strings-${locale}.json`);
    process.exit(1);
  }

  console.log(`Building locale: ${locale}`);
  const translations = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
  console.log(`Loaded ${Object.keys(translations).length} translation keys\n`);

  const files = [
    '2014_classes.json',
    '2014_subclasses.json',
    '2014_races.json',
    '2014_feats.json',
    '2014_spells.json',
    '2014_spell_mechanics.json',
  ];

  for (const file of files) {
    processFile(translations, locale, file);
  }

  console.log(`\nDone! Locale data written to src/data/${locale}/`);
}

main();
