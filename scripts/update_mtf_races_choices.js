const fs = require('fs');

// Read races data
const racesData = JSON.parse(fs.readFileSync('src/data/2014_races.json', 'utf8'));

// Update Eladrin with season choice
const eladrin = racesData.races.find(r => r.index === 'eladrin');
if (eladrin) {
  eladrin.choices = [
    {
      id: 'season',
      name: 'Eladrin Season',
      description: 'Choose your season. This determines the effect of your Fey Step ability.',
      type: 'single',
      options: [
        { id: 'autumn', name: 'Autumn', description: 'When you teleport, up to two creatures of your choice that you can see within 10 feet of you must succeed on a Wisdom saving throw or be charmed by you for 1 minute.' },
        { id: 'winter', name: 'Winter', description: 'When you teleport, one creature of your choice that you can see within 5 feet of the space you left must succeed on a Wisdom saving throw or be frightened of you until the end of your next turn.' },
        { id: 'spring', name: 'Spring', description: 'When you teleport, you can touch one willing creature within 5 feet of you. That creature then teleports to an unoccupied space of your choice that you can see within 5 feet of your destination.' },
        { id: 'summer', name: 'Summer', description: 'When you teleport, each creature of your choice that you can see within 5 feet of you takes fire damage equal to your Charisma modifier (minimum of 1).' }
      ]
    }
  ];
}

// Update Githyanki with Decadent Mastery choices
const githyanki = racesData.races.find(r => r.index === 'githyanki');
if (githyanki) {
  githyanki.choices = [
    {
      id: 'language',
      name: 'Decadent Mastery: Language',
      description: 'Learn one language of your choice.',
      type: 'language'
    },
    {
      id: 'proficiency',
      name: 'Decadent Mastery: Skill or Tool',
      description: 'Gain proficiency with one skill or tool of your choice.',
      type: 'proficiency'
    }
  ];
}

// Write updated file
fs.writeFileSync('src/data/2014_races.json', JSON.stringify(racesData, null, 2));

console.log('Updated MTF races with choices');
console.log('  - Eladrin: season choice (4 options)');
console.log('  - Githyanki: language + proficiency choice');
