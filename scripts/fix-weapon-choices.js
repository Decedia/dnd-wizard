const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

function detectWeaponType(partDesc) {
  const lower = partDesc.toLowerCase();
  if (lower.includes('any martial melee weapon')) return 'martial_melee';
  if (lower.includes('any martial ranged weapon')) return 'martial_ranged';
  if (lower.includes('any martial weapon')) return 'martial';
  if (lower.includes('any simple melee weapon')) return 'simple_melee';
  if (lower.includes('any simple ranged weapon')) return 'simple_ranged';
  if (lower.includes('any simple weapon')) return 'simple';
  return null;
}

function extractItemName(partDesc) {
  // Extract item name from description like "(a) a quarterstaff or (b) a dagger"
  // or "(a) chain mail or (b) leather armor, longbow, and 20 arrows"
  const cleaned = partDesc
    .replace(/^\([a-z]\)\s*/, '')
    .replace(/^or\s*/, '')
    .trim();
  
  // If it's a weapon choice, return null
  if (detectWeaponType(cleaned)) return null;
  
  // Extract the first item name
  const firstItem = cleaned.split(',')[0].trim();
  // Remove leading "a " or "an "
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
