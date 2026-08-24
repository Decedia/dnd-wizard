const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

function detectWeaponType(partDesc) {
  const lower = partDesc.toLowerCase();
  if (lower.includes('martial melee weapon')) return 'martial_melee';
  if (lower.includes('martial ranged weapon')) return 'martial_ranged';
  if (lower.includes('martial weapon')) return 'martial';
  if (lower.includes('simple melee weapon')) return 'simple_melee';
  if (lower.includes('simple ranged weapon')) return 'simple_ranged';
  if (lower.includes('simple weapon')) return 'simple';
  return null;
}

function extractItemName(partDesc) {
  const cleaned = partDesc
    .replace(/^\([a-z]\)\s*/, '')
    .replace(/^or\s*/, '')
    .trim();
  
  if (detectWeaponType(cleaned)) return null;
  
  const firstItem = cleaned.split(',')[0].trim();
  return firstItem.replace(/^a(n?)\s+/i, '').replace(/^the\s+/i, '');
}

classesData.classes.forEach((cls) => {
  cls.startingEquipment?.forEach((entry) => {
    const desc = entry.description || '';
    if (!desc.includes(' or ')) return;
    
    const parts = desc.split(' or ');
    const newItems = [];
    
    parts.forEach((part, index) => {
      const partDesc = part.trim();
      const weaponType = detectWeaponType(partDesc);
      
      if (weaponType) {
        newItems.push({
          type: 'weapon_choice',
          category: weaponType,
          description: partDesc,
          quantity: 1
        });
      } else {
        const itemName = extractItemName(partDesc);
        newItems.push({
          name: itemName || partDesc,
          quantity: 1,
          description: partDesc
        });
      }
    });
    
    entry.items = newItems;
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Fixed weapon choices in startingEquipment');
