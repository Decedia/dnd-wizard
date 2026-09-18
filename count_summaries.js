const fs = require('fs');
const path = require('path');

const searchDirs = [
  '/workspace/56ac2440-3d0b-4707-b63e-8da7bb6f489e/sessions/agent_fd48c6d1-5bd7-44a9-b5fa-848760cc8eb6/src/data',
  '/workspace/56ac2440-3d0b-4707-b63e-8da7bb6f489e/sessions/agent_fd48c6d1-5bd7-44a9-b5fa-848760cc8eb6/scripts'
];

const results = [];
let totalMissing = 0;

for (const dir of searchDirs) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      let features = [];
      let traits = [];
      
      function findArrays(obj, key) {
        if (Array.isArray(obj)) {
          const hasNamedObjects = obj.some(item => 
            item && typeof item === 'object' && item.name && item.description
          );
          if (hasNamedObjects && (key === 'features' || key === 'traits')) {
            if (key === 'features') features = obj;
            if (key === 'traits') traits = obj;
          }
        } else if (obj && typeof obj === 'object') {
          for (const k in obj) {
            findArrays(obj[k], k);
          }
        }
      }
      
      findArrays(data, 'root');
      
      const allItems = [...features, ...traits];
      if (allItems.length === 0) continue;
      
      const missing = allItems.filter(item => {
        if (!item || !item.name || !item.description) return false;
        return !item.summary || item.summary === null || item.summary === '';
      });
      
      if (missing.length > 0) {
        results.push({
          file: filePath,
          type: dir.includes('src/data') ? 'core' : 'expansion',
          total: allItems.length,
          missing: missing.length,
          items: missing.map(item => item.name)
        });
        totalMissing += missing.length;
      }
    } catch (e) {
      console.error('Error parsing', filePath, e.message);
    }
  }
}

console.log('=== MISSING SUMMARIES REPORT ===\n');
results.forEach(r => {
  console.log(r.type.toUpperCase() + ': ' + r.file);
  console.log('  Total features/traits: ' + r.total);
  console.log('  Missing summaries: ' + r.missing);
  console.log('  Items: ' + r.items.join(', '));
  console.log('');
});
console.log('TOTAL MISSING SUMMARIES: ' + totalMissing);
