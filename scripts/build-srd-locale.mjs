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

function isTarget(candidate, fieldName) {
  return !!candidate && typeof candidate === 'object' && fieldName in candidate;
}

function navigateToTarget(root, pathSegments, fieldName) {
  let current = findRootArray(root);
  if (!current) {
    throw new Error('No root array found in EN file');
  }
  return navigateSegments(current, pathSegments, 0, fieldName);
}

/**
 * Walks the path segments to the object that owns `fieldName`. A candidate only
 * counts as a hit if it actually carries that field, which is what lets the search
 * backtrack out of a decoy key: a race holds `darkvision: { range: 60 }` alongside
 * its Darkvision trait, and without this the shortcut won on the decoy and every
 * 2014_races.<race>.darkvision.* translation was silently dropped.
 */
function navigateSegments(current, pathSegments, index, fieldName) {
  if (index >= pathSegments.length) {
    return isTarget(current, fieldName) ? current : null;
  }

  const segment = pathSegments[index];

  if (Array.isArray(current)) {
    const found = findInArray(current, segment);
    if (!found) {
      return null;
    }
    return navigateSegments(found, pathSegments, index + 1, fieldName);
  }

  if (current && typeof current === 'object') {
    const direct = current[segment];
    if (direct && typeof direct === 'object') {
      const directResult = navigateSegments(direct, pathSegments, index + 1, fieldName);
      if (directResult !== null) {
        return directResult;
      }
    }

    for (const key of Object.keys(current)) {
      const value = current[key];
      if (Array.isArray(value) && typeof value[0] === 'object') {
        const found = findInArray(value, segment);
        if (found) {
          const result = navigateSegments(found, pathSegments, index + 1, fieldName);
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
  let skipped = 0;

  for (const [key, translatedValue] of Object.entries(translations)) {
    if (!key.startsWith(prefix)) continue;

    // A handful of hand-written parts carry malformed keys. They cannot address a
    // field in the data tree, so skip them instead of aborting the whole build.
    let parsed;
    try {
      parsed = parseKey(key);
    } catch {
      skipped++;
      continue;
    }
    const { fieldName, pathSegments } = parsed;
    const target = navigateToTarget(cloneData, pathSegments, fieldName);

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
  console.log(`  ${filename}: ${replaced} replaced, ${fallback} fallback (EN)${skipped ? `, ${skipped} malformed skipped` : ''}`);
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
