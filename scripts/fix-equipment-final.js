const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

function detectWeaponType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('martial melee weapon')) return 'martial_melee';
  if (lower.includes('martial ranged weapon')) return 'martial_ranged';
  if (lower.includes('martial weapon')) return 'martial';
  if (lower.includes('simple melee weapon')) return 'simple_melee';
  if (lower.includes('simple ranged weapon')) return 'simple_ranged';
  if (lower.includes('simple weapon')) return 'simple';
  return null;
}

function parseOption(desc) {
  const trimmed = desc.trim();
  const weaponType = detectWeaponType(trimmed);
  if (weaponType) {
    return { type: 'weapon_choice', category: weaponType, description: trimmed, quantity: 1 };
  }
  const cleaned = trimmed.replace(/^\([a-z]\)\s*/, '').replace(/^or\s*/, '').trim();
  const itemName = cleaned.split(',')[0].trim().replace(/^a(n?)\s+/i, '').replace(/^the\s+/i, '');
  return { name: itemName || cleaned, description: trimmed, quantity: 1 };
}

// Manual fixes for complex entries
const manualFixes = {
  'Fighter': {
    0: [
      { name: 'chain mail', description: '(a) chain mail', quantity: 1 },
      { name: 'leather armor', description: '(b) leather armor, longbow, and 20 arrows', quantity: 1 }
    ],
    1: [
      { type: 'weapon_choice', category: 'martial', description: '(a) a martial weapon', quantity: 1 },
      { name: 'shield', description: 'a shield', quantity: 1 },
      { type: 'weapon_choice', category: 'martial', description: '(b) two martial weapons', quantity: 1 }
    ],
    2: [
      { name: 'light crossbow', description: '(a) a light crossbow', quantity: 1 },
      { name: '20 bolts', description: '20 bolts', quantity: 1 },
      { name: 'two handaxes', description: '(b) two handaxes', quantity: 1 }
    ]
  },
  'Bard': {
    2: [
      { name: 'rapier', description: '(a) a rapier', quantity: 1 },
      { name: 'longsword', description: '(b) a longsword', quantity: 1 },
      { type: 'weapon_choice', category: 'simple', description: '(c) any simple weapon', quantity: 1 }
    ]
  },
  'Ranger': {
    3: [
      { name: 'two shortswords', description: '(a) two shortswords', quantity: 1 },
      { type: 'weapon_choice', category: 'simple_melee', description: '(b) two simple melee weapons', quantity: 1 }
    ]
  },
  'Paladin': {
    1: [
      { type: 'weapon_choice', category: 'martial', description: '(a) a martial weapon', quantity: 1 },
      { name: 'shield', description: 'a shield', quantity: 1 },
      { type: 'weapon_choice', category: 'martial', description: '(b) two martial weapons', quantity: 1 }
    ]
  }
};

classesData.classes.forEach((cls) => {
  const className = cls.name;
  const fixes = manualFixes[className];
  
  cls.startingEquipment?.forEach((entry, entryIndex) => {
    if (fixes && fixes[entryIndex]) {
      entry.items = fixes[entryIndex];
      return;
    }
    
    const desc = entry.description || '';
    if (!desc.includes(' or ')) return;
    
    const parts = desc.split(' or ');
    entry.items = parts.map((part) => parseOption(part.trim()));
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Applied final equipment parsing fixes');
