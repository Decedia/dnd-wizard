const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'src/data/2014_classes.json');
const classesData = require(classesPath);

const spellsData = require(path.join(__dirname, '..', 'src/data/2014_spells.json'));
const allSpells = spellsData.spells || [];

function getSpellsByClassAndLevel(className, maxLevel) {
  return allSpells
    .filter((s) => s.classes && s.classes.includes(className) && s.level <= maxLevel)
    .map((s) => s.name);
}

function getWizardSpellsByLevel(minLevel, maxLevel) {
  return allSpells
    .filter((s) => s.classes && s.classes.includes('Wizard') && s.level >= minLevel && s.level <= maxLevel)
    .map((s) => s.name);
}

classesData.classes.forEach((cls) => {
  cls.levels.forEach((level, index) => {
    const levelNumber = index + 1;
    level.features?.forEach((feature) => {
      if (feature.choices) return;
      
      const desc = typeof feature.description === 'string' ? feature.description : (Array.isArray(feature.description) ? feature.description.join(' ') : '');
      const lower = desc.toLowerCase();
      
      if (lower.includes('choose two spells from any class') || lower.includes('choose two spells')) {
        const maxSpellLevel = levelNumber === 10 ? 4 : levelNumber === 14 ? 6 : 8;
        const spellOptions = allSpells
          .filter((s) => s.level <= maxSpellLevel)
          .map((s) => s.name);
        feature.choices = {
          type: 'spells',
          options: spellOptions,
          count: 2,
          description: 'Choose two spells of level ' + maxSpellLevel + ' or lower from any class.'
        };
      }
      
      if (lower.includes('choose one') && lower.includes('spell from the warlock spell list')) {
        const spellLevel = levelNumber === 11 ? 6 : levelNumber === 13 ? 7 : levelNumber === 15 ? 8 : 9;
        const spellOptions = getSpellsByClassAndLevel('Warlock', spellLevel).filter((name) => {
          const spell = allSpells.find((s) => s.name === name);
          return spell && spell.level === spellLevel;
        });
        feature.choices = {
          type: 'spells',
          options: spellOptions,
          count: 1,
          description: 'Choose one ' + spellLevel + 'th-level spell from the warlock spell list.'
        };
      }
      
      if (lower.includes('choose a 1st-level wizard spell') || lower.includes('choose a 2nd-level wizard spell')) {
        const levelMatch = desc.match(/choose a (\d+)(?:st|nd|rd|th)-level wizard spell/i);
        if (levelMatch) {
          const spellLevel = parseInt(levelMatch[1]);
          const spellOptions = getWizardSpellsByLevel(spellLevel, spellLevel);
          feature.choices = {
            type: 'spells',
            options: spellOptions,
            count: 1,
            description: 'Choose a ' + spellLevel + 'th-level wizard spell.'
          };
        }
      }
      
      if (lower.includes('choose two') && lower.includes('3rd-level wizard spells')) {
        const spellOptions = getWizardSpellsByLevel(3, 3);
        feature.choices = {
          type: 'spells',
          options: spellOptions,
          count: 2,
          description: 'Choose two 3rd-level wizard spells.'
        };
      }
    });
  });
});

fs.writeFileSync(classesPath, JSON.stringify(classesData, null, 2));
console.log('Added missing choices data for class features');
