const fs = require('fs');

const classes = JSON.parse(fs.readFileSync('src/data/en/2014_classes.json', 'utf8')).classes;
const subclasses = JSON.parse(fs.readFileSync('src/data/en/2014_subclasses.json', 'utf8')).subclasses;

console.log('=== AUDIT REPORT: SRD & EXPANSIONS ===\n');

let totalClassFeatures = 0;
let totalSubclassFeatures = 0;
let missingSummary = [];
let truncatedSummary = [];
let missingDesc = [];
let subclassesWithTooFewFeatures = [];

function checkFeature(owner, f) {
  const desc = Array.isArray(f.description) ? f.description.join(' ') : (f.description || '');
  const sum = f.summary || '';

  if (!desc || desc.trim().length < 15) {
    missingDesc.push({ owner, name: f.name });
  }

  if (!sum || sum.trim().length === 0) {
    missingSummary.push({ owner, name: f.name });
  } else if (sum.length < 10 || /[,;:\-]\s*$/.test(sum) || /\([^\)]*$/.test(sum) || /\b(and|or|the|with|to|in|of|gain)\s*$/i.test(sum)) {
    truncatedSummary.push({ owner, name: f.name, summary: sum });
  }
}

for (const c of classes) {
  for (const f of (c.features || [])) {
    totalClassFeatures++;
    checkFeature('Class ' + c.name, f);
  }
  for (const l of (c.levels || [])) {
    for (const f of (l.features || [])) {
      totalClassFeatures++;
      checkFeature(`Class ${c.name} Lvl ${l.level}`, f);
    }
  }
}

for (const s of subclasses) {
  const featCount = (s.features || []).length;
  if (featCount < 3) {
    subclassesWithTooFewFeatures.push({ class: s.class, name: s.name, count: featCount });
  }
  for (const f of (s.features || [])) {
    totalSubclassFeatures++;
    checkFeature(`Subclass ${s.class} - ${s.name}`, f);
  }
}

console.log(`Classes checked: ${classes.length}`);
console.log(`Total class feature entries: ${totalClassFeatures}`);
console.log(`Subclasses checked: ${subclasses.length}`);
console.log(`Total subclass feature entries: ${totalSubclassFeatures}`);

console.log(`\nMissing descriptions: ${missingDesc.length}`);
if (missingDesc.length > 0) console.log(missingDesc);

console.log(`Missing summaries: ${missingSummary.length}`);
if (missingSummary.length > 0) console.log(missingSummary);

console.log(`Truncated / malformed summaries: ${truncatedSummary.length}`);
if (truncatedSummary.length > 0) {
  console.log('Sample truncated:');
  for (const item of truncatedSummary.slice(0, 10)) {
    console.log(`  [${item.owner}] ${item.name}: "${item.summary}"`);
  }
}

console.log(`Subclasses with < 3 features: ${subclassesWithTooFewFeatures.length}`);
if (subclassesWithTooFewFeatures.length > 0) console.log(subclassesWithTooFewFeatures);

if (missingDesc.length === 0 && missingSummary.length === 0 && truncatedSummary.length === 0 && subclassesWithTooFewFeatures.length === 0) {
  console.log('\n✅ PERFECT AUDIT: 100% of classes, subclasses, and features are complete, descriptive, and summarized without truncation!');
} else {
  console.log('\n⚠️ Some issues remain.');
}
