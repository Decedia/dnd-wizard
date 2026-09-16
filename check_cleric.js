const data = require('./src/data/2014_subclasses.json');
for (const s of data.subclasses) {
  if (s.class === 'Cleric') {
    console.log('Cleric subclass:', s.name, 'features count:', (s.features || []).length);
    for (const f of (s.features || [])) {
      console.log('  Feature:', f.name, 'desc type:', typeof f.description, 'isArray:', Array.isArray(f.description), 'desc:', JSON.stringify(f.description).slice(0, 80));
    }
  }
}
