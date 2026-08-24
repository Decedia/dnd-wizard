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
  
  // Check for weapon choice patterns
  const weaponType = detectWeaponType(trimmed);
  if (weaponType) {
    return { type: 'weapon_choice', category: weaponType, description: trimmed, quantity: 1 };
  }
  
  // Extract item name from description
  const cleaned = trimmed.replace(/^\([a-z]\)\s*/, '').replace(/^or\s*/, '').trim();
  const itemName = cleaned.split(',')[0].trim().replace(/^a(n?)\s+/i, '').replace(/^the\s+/i, '');
  
  return { name: itemName || cleaned, description: trimmed, quantity: 1 };
}

classesData.classes.forEach((cls) => {
  cls.startingEquipment?.forEach((entry) => {
    const desc = entry.description || '';
    
    // Handle complex cases with "and" in options
    if (desc.includes(' and ') && desc.includes(' or ')) {
      // e.g., "(a) a martial weapon and a shield or (b) two martial weapons"
      const parts = desc.split(' or ');
      const newItems = [];
      
      parts.forEach((part) => {
        const trimmed = part.trim();
        
        if (trimmed.includes(' and ')) {
          // Split by "and" to get multiple items
          const subParts = trimmed.split(' and ');
          subParts.forEach((subPart) => {
            const parsed = parseOption(subPart.trim());
            newItems.push(parsed);
          });
        } else {
          const parsed = parseOption(trimmed);
          newItems.push(parsed);
        }
      });
      
      entry.items = newItems;
    } else if (desc.includes(' or ')) {
      // Simple case: just split by " or "
      const parts = desc.split(' or ');
      entry.items = parts.map((part) => parseOption(part.trim()));
    }
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Fixed equipment parsing');
