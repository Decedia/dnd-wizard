const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

function detectWeaponType(desc) {
  const lower = desc.toLowerCase();
  if (lower.includes('any martial melee weapon')) return 'martial_melee';
  if (lower.includes('any martial ranged weapon')) return 'martial_ranged';
  if (lower.includes('any martial weapon')) return 'martial';
  if (lower.includes('any simple melee weapon')) return 'simple_melee';
  if (lower.includes('any simple ranged weapon')) return 'simple_ranged';
  if (lower.includes('any simple weapon')) return 'simple';
  return null;
}

classesData.classes.forEach((cls) => {
  cls.startingEquipment?.forEach((entry) => {
    const desc = entry.description || '';
    if (!desc.includes(' or ')) return;
    
    const parts = desc.split(' or ');
    const updatedItems = [];
    
    parts.forEach((part, index) => {
      const partDesc = part.trim();
      const weaponType = detectWeaponType(partDesc);
      
      if (weaponType) {
        updatedItems.push({
          type: 'weapon_choice',
          category: weaponType,
          description: partDesc,
          quantity: 1
        });
      } else {
        const originalItem = entry.items?.[index] || { name: partDesc, quantity: 1 };
        updatedItems.push({
          ...originalItem,
          description: partDesc
        });
      }
    });
    
    entry.items = updatedItems;
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Flagged weapon choices in startingEquipment');
