import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PARTS_ID_DIR = path.join(__dirname, '..', 'src', 'locales', 'parts', 'id');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'locales', 'srd-strings-id.json');

const merged = {};

const files = fs.readdirSync(PARTS_ID_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(PARTS_ID_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const [key, value] of Object.entries(data)) {
    merged[key] = value;
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2) + '\n');
console.log(`Merged ${files.length} files into ${OUTPUT_FILE}`);
console.log(`Total keys: ${Object.keys(merged).length}`);
